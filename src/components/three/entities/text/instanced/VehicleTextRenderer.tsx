import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vehicleDataArray, VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { useDigitMaterials, CHAR_MAP, CHAR_COUNT } from "./useDigitMaterials";
import {
  HIDE_MATRIX,
  computeBillboardRotation,
  distanceSquared,
} from "./instancedTextUtils";

const LOD_DIST_SQ = 400 * 400;
const CAM_HEIGHT_CUTOFF = 50;
const LABEL_LENGTH = 8; // VEH00001

interface SlotData {
  totalCharacters: number;
  counts: number[];
  slotIndex: Int32Array;
  slotDigit: Int8Array;
  slotVehicle: Int32Array;
  slotPosition: Int32Array;
}

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
  zOffset = 1,
}) => {
  const digitMaterials = useDigitMaterials({ color });
  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const dataRef = useRef<SlotData | null>(null);
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(new Array(CHAR_COUNT).fill(null));

  // 슬롯 데이터 초기화
  useEffect(() => {
    if (numVehicles === 0) {
      dataRef.current = null;
      return;
    }

    const totalCharacters = numVehicles * LABEL_LENGTH;
    const counts = new Array(CHAR_COUNT).fill(0);
    const slotDigit = new Int8Array(totalCharacters);
    const slotVehicle = new Int32Array(totalCharacters);
    const slotPosition = new Int32Array(totalCharacters);

    let charIndex = 0;
    for (let v = 0; v < numVehicles; v++) {
      const label = `VEH${String(v).padStart(5, "0")}`;

      for (let i = 0; i < LABEL_LENGTH; i++) {
        const digit = CHAR_MAP[label[i]] ?? 0;
        slotDigit[charIndex] = digit;
        slotVehicle[charIndex] = v;
        slotPosition[charIndex] = i;
        counts[digit]++;
        charIndex++;
      }
    }

    const slotIndex = new Int32Array(totalCharacters);
    const currentSlot = new Array(CHAR_COUNT).fill(0);

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

  // InstancedMesh 생성
  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || numVehicles === 0) return [];

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, data.counts[d]);
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

  // 카운트 업데이트
  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    for (let d = 0; d < CHAR_COUNT; d++) {
      const mesh = instRefs.current[d];
      if (mesh && data.counts[d] > 0) {
        mesh.count = data.counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

  // 렌더링 루프
  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D || numVehicles === 0) return;

    const { slotDigit, slotIndex, slotVehicle, slotPosition, totalCharacters } = D;
    const vehicleData = vehicleDataArray.getData();
    const { x: cx, y: cy, z: cz } = camera.position;

    // 고도 컬링
    if (cz > CAM_HEIGHT_CUTOFF) {
      for (let i = 0; i < totalCharacters; i++) {
        const d = slotDigit[i];
        const slot = slotIndex[i];
        const mesh = instRefs.current[d];
        if (mesh) mesh.setMatrixAt(slot, HIDE_MATRIX);
      }
      for (const msh of instRefs.current) {
        if (msh) msh.instanceMatrix.needsUpdate = true;
      }
      return;
    }

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.15 * scale;
    const halfLen = (LABEL_LENGTH - 1) / 2; // 3.5

    const vehicleLOD = new Map<number, boolean>();
    const vehicleRotation = new Map<number, { quaternion: THREE.Quaternion; right: THREE.Vector3 }>();

    for (let i = 0; i < totalCharacters; i++) {
      const d = slotDigit[i];
      const slot = slotIndex[i];
      const v = slotVehicle[i];
      const posIdx = slotPosition[i];
      const mesh = instRefs.current[d];
      if (!mesh) continue;

      // 차량 위치
      const off = v * VEHICLE_DATA_SIZE;
      const vx = vehicleData[off + MovementData.X];
      const vy = vehicleData[off + MovementData.Y];
      const vz = vehicleData[off + MovementData.Z] + zOffset;

      // LOD 체크 (차량당 한번만)
      if (!vehicleLOD.has(v)) {
        const distSq = distanceSquared(cx, cy, cz, vx, vy, vz);
        vehicleLOD.set(v, distSq > LOD_DIST_SQ);
      }

      if (vehicleLOD.get(v)) {
        mesh.setMatrixAt(slot, HIDE_MATRIX);
        continue;
      }

      // 빌보드 회전 (차량당 한번만)
      if (!vehicleRotation.has(v)) {
        const pos = new THREE.Vector3(vx, vy, vz);
        vehicleRotation.set(v, computeBillboardRotation(pos, camera.position));
      }

      const { quaternion, right } = vehicleRotation.get(v)!;

      const offsetX = (posIdx - halfLen) * charSpacing;
      const offsetVector = right.clone().multiplyScalar(offsetX);
      const finalPos = new THREE.Vector3(vx, vy, vz).add(offsetVector);

      m.compose(finalPos, quaternion, s);
      mesh.setMatrixAt(slot, m);
    }

    for (const msh of instRefs.current) {
      if (msh) msh.instanceMatrix.needsUpdate = true;
    }
  });

  return <group>{meshes}</group>;
};

export default VehicleTextRenderer;