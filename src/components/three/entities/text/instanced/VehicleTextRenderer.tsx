import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vehicleDataArray, VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";

const CHAR_MAP: Record<string, number> = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  'V':10,'E':11,'H':12,
};

// LOD 설정
const HIDE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
const LOD_DIST_SQ = 400 * 400;
const CAM_HEIGHT_CUTOFF = 50;

interface Props {
  numVehicles: number;
  scale?: number;
  color?: string;
  zOffset?: number;
}

const VehicleTextRenderer: React.FC<Props> = ({
  numVehicles,
  scale = 0.5,
  color = "#ffffff",
  zOffset = 1.0,
}) => {
  // 13개 문자 텍스처 (0-9, V, E, H)
  const digitMaterials = useMemo(() => {
    const characters = ['0','1','2','3','4','5','6','7','8','9','V','E','H'];

    return characters.map(char => {
      const S = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = S;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = color;
      ctx.font = "bold 96px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, S / 2, S / 2);

      const tex = new THREE.Texture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;

      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
    });
  }, [color]);

  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  /** ---------------- 데이터 구성 ---------------- */
  const dataRef = useRef<{
    totalCharacters: number;
    counts: number[];
    slotIndex: Int32Array;
    slotDigit: Int8Array;
    slotVehicle: Int32Array;
    slotPosition: Int32Array;
  } | null>(null);

  useEffect(() => {
    if (numVehicles === 0) {
      dataRef.current = null;
      return;
    }

    // VEH00001 ~ VEH{n} each 8 characters
    const totalCharacters = numVehicles * 8;
    const counts = new Array(13).fill(0);
    const slotDigit = new Int8Array(totalCharacters);
    const slotVehicle = new Int32Array(totalCharacters);
    const slotPosition = new Int32Array(totalCharacters);

    let charIndex = 0;
    for (let v = 0; v < numVehicles; v++) {
      const label = `VEH${String(v + 1).padStart(5, '0')}`;
      
      for (let i = 0; i < label.length; i++) {
        const digit = CHAR_MAP[label[i]];
        slotDigit[charIndex] = digit;
        slotVehicle[charIndex] = v;
        slotPosition[charIndex] = i;
        counts[digit]++;
        charIndex++;
      }
    }

    // 슬롯 인덱스 매핑
    const slotIndex = new Int32Array(totalCharacters);
    const currentSlot = new Array(13).fill(0);

    for (let i = 0; i < totalCharacters; i++) {
      const digit = slotDigit[i];
      slotIndex[i] = currentSlot[digit];
      currentSlot[digit]++;
    }

    dataRef.current = {
      totalCharacters,
      counts,
      slotIndex,
      slotDigit,
      slotVehicle,
      slotPosition,
    };
  }, [numVehicles]);

  /** ---------------- InstancedMesh 생성 ---------------- */
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(13).fill(null));

  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || numVehicles === 0) return [];

    const { counts } = data;

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, counts[d]);
      return (
        <instancedMesh
          key={`veh-digit-${d}-${cnt}`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, cnt]}
          frustumCulled={false}
        />
      );
    });
  }, [digitMaterials, quad, dataRef.current?.counts, numVehicles]);

  // InstancedMesh 카운트 업데이트
  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    const { counts } = data;
    for (let d = 0; d < 13; d++) {
      const mesh = instRefs.current[d];
      if (mesh && counts[d] > 0) {
        mesh.count = counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

  /** ---------------- 빌보드 렌더링 + LOD ---------------- */
  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D || numVehicles === 0) return;

    const { slotDigit, slotIndex, slotVehicle, slotPosition } = D;
    const vehicleData = vehicleDataArray.getData();

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.15 * scale;

    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    // 카메라 높이 기반 전체 컬링
    if (cz > CAM_HEIGHT_CUTOFF) {
      for (let i = 0; i < D.totalCharacters; i++) {
        const d = slotDigit[i];
        const slot = slotIndex[i];
        const mesh = instRefs.current[d];
        if (mesh) mesh.setMatrixAt(slot, HIDE_MATRIX);
      }
      instRefs.current.forEach(msh => msh && (msh.instanceMatrix.needsUpdate = true));
      return;
    }

    // 차량별 LOD 캐시 (같은 차량 문자들 중복 계산 방지)
    const vehicleLOD = new Map<number, boolean>();
    const vehicleRotation = new Map<number, { q: THREE.Quaternion; right: THREE.Vector3 }>();

    for (let i = 0; i < D.totalCharacters; i++) {
      const d = slotDigit[i];
      const slot = slotIndex[i];
      const v = slotVehicle[i];
      const posIdx = slotPosition[i];
      const mesh = instRefs.current[d];
      if (!mesh) continue;

      // 차량 위치 가져오기
      const off = v * VEHICLE_DATA_SIZE;
      const vx = vehicleData[off + MovementData.X];
      const vy = vehicleData[off + MovementData.Y];
      const vz = vehicleData[off + MovementData.Z] + zOffset;

      // LOD 체크 (차량당 한번만)
      if (!vehicleLOD.has(v)) {
        const dx = cx - vx, dy = cy - vy, dz = cz - vz;
        const distSq = dx*dx + dy*dy + dz*dz;
        vehicleLOD.set(v, distSq > LOD_DIST_SQ);
      }

      if (vehicleLOD.get(v)) {
        mesh.setMatrixAt(slot, HIDE_MATRIX);
        continue;
      }

      // 빌보드 회전 (차량당 한번만)
      if (!vehicleRotation.has(v)) {
        const groupCenter = new THREE.Vector3(vx, vy, vz);
        const lookDirection = new THREE.Vector3()
          .subVectors(camera.position, groupCenter)
          .normalize();

        const upVector = new THREE.Vector3(0, 0, 1);
        const matrix = new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          lookDirection.clone().negate(),
          upVector
        );

        const q = new THREE.Quaternion().setFromRotationMatrix(matrix);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
        vehicleRotation.set(v, { q, right });
      }

      const { q, right } = vehicleRotation.get(v)!;

      // Character position calculation (8 chars, center align)
      // Center of 0~7 is 3.5
      const offsetX = (posIdx - 3.5) * charSpacing;
      const offsetVector = right.clone().multiplyScalar(offsetX);

      const finalPos = new THREE.Vector3(vx, vy, vz).add(offsetVector);

      m.compose(finalPos, q, s);
      mesh.setMatrixAt(slot, m);
    }

    instRefs.current.forEach(msh => msh && (msh.instanceMatrix.needsUpdate = true));
  });

  return <group>{meshes}</group>;
};

export default VehicleTextRenderer;
