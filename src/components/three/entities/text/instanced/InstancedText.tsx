import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RENDER_ORDER_TEXT } from "@/utils/renderOrder";

export interface TextGroup {
  x: number;
  y: number;
  z: number;
  digits: number[];
}

type Props = {
  groups?: TextGroup[];
  scale?: number;
  font?: string;
  color?: string;
  bgColor?: string;
  zOffset?: number;
  // LOD 설정
  lodDistance?: number;
  camHeightCutoff?: number;
};

// LOD 상수
const HIDE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

export default function NumberGridInstanced({
  groups = [],
  scale = 1.0,
  font = "bold 96px system-ui, Roboto, Arial",
  color = "#ffffff",
  bgColor = "transparent",
  zOffset = 0.5,
  lodDistance = 50,
  camHeightCutoff = 60,
}: Props) {
  const LOD_DIST_SQ = lodDistance * lodDistance;

  // 0~9, N, E 텍스처 12개
  const digitMaterials = useMemo(() => {
    const characters = ["0","1","2","3","4","5","6","7","8","9","N","E"];

    return characters.map(char => {
      const S = 256;
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, S, S);
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, S, S);
      }
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, S / 2, S / 2, S * 0.9);

      const tex = new THREE.Texture(c);
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
  }, [font, color, bgColor]);

  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  /** ---------------- 데이터 구성 ---------------- */
  const dataRef = useRef<{
    totalCharacters: number;
    counts: number[];
    slotIndex: Int32Array;
    slotDigit: Int8Array;
    slotGroup: Int32Array;
    slotPosition: Int32Array;
  } | null>(null);

  useEffect(() => {
    if (!groups || groups.length === 0) {
      dataRef.current = null;
      return;
    }

    let totalCharacters = 0;
    groups.forEach(group => totalCharacters += group.digits.length);

    const counts = new Array(12).fill(0);
    const slotDigit = new Int8Array(totalCharacters);
    const slotGroup = new Int32Array(totalCharacters);
    const slotPosition = new Int32Array(totalCharacters);

    let charIndex = 0;
    groups.forEach((group, groupIndex) => {
      group.digits.forEach((digit, positionIndex) => {
        const validDigit = Math.max(0, Math.min(11, digit));
        slotDigit[charIndex] = validDigit;
        slotGroup[charIndex] = groupIndex;
        slotPosition[charIndex] = positionIndex;
        counts[validDigit]++;
        charIndex++;
      });
    });

    const slotIndex = new Int32Array(totalCharacters);
    const currentSlot = new Array(12).fill(0);

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
      slotGroup,
      slotPosition,
    };
  }, [groups]);

  /** ---------------- InstancedMesh 생성 ---------------- */
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(12).fill(null));

  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || !groups || groups.length === 0) return [];

    const { counts } = data;

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, counts[d]);
      return (
        <instancedMesh
          key={`digit-${d}-${cnt}`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, cnt]}
          frustumCulled={false}
          renderOrder={RENDER_ORDER_TEXT}
        />
      );
    });
  }, [digitMaterials, quad, dataRef.current?.counts, groups]);

  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    const { counts } = data;
    for (let d = 0; d < 12; d++) {
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
    if (!D || !groups || groups.length === 0) return;

    const { slotDigit, slotIndex, slotGroup, slotPosition, totalCharacters } = D;

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.2 * scale;

    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    // 카메라 높이 기반 전체 컬링
    if (cz > camHeightCutoff) {
      for (let i = 0; i < totalCharacters; i++) {
        const d = slotDigit[i];
        const slot = slotIndex[i];
        const mesh = instRefs.current[d];
        if (mesh) mesh.setMatrixAt(slot, HIDE_MATRIX);
      }
      instRefs.current.forEach(msh => msh && (msh.instanceMatrix.needsUpdate = true));
      return;
    }

    // 그룹별 LOD 캐시
    const groupLOD = new Map<number, boolean>();
    const groupRotation = new Map<number, { q: THREE.Quaternion; right: THREE.Vector3 }>();

    for (let i = 0; i < totalCharacters; i++) {
      const d = slotDigit[i];
      const slot = slotIndex[i];
      const groupIdx = slotGroup[i];
      const posIdx = slotPosition[i];
      const mesh = instRefs.current[d];
      if (!mesh) continue;

      const group = groups[groupIdx];
      const gx = group.x;
      const gy = group.y;
      const gz = group.z + zOffset;

      // LOD 체크 (그룹당 한번만)
      if (!groupLOD.has(groupIdx)) {
        const dx = cx - gx, dy = cy - gy, dz = cz - gz;
        const distSq = dx*dx + dy*dy + dz*dz;
        groupLOD.set(groupIdx, distSq > LOD_DIST_SQ);
      }

      if (groupLOD.get(groupIdx)) {
        mesh.setMatrixAt(slot, HIDE_MATRIX);
        continue;
      }

      // 빌보드 회전 (그룹당 한번만)
      if (!groupRotation.has(groupIdx)) {
        const groupCenter = new THREE.Vector3(gx, gy, gz);
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
        groupRotation.set(groupIdx, { q, right });
      }

      const { q, right } = groupRotation.get(groupIdx)!;

      // 문자 위치 계산
      const halfLen = (group.digits.length - 1) / 2;
      const offsetX = (posIdx - halfLen) * charSpacing;
      const offsetVector = right.clone().multiplyScalar(offsetX);

      const finalPos = new THREE.Vector3(gx, gy, gz).add(offsetVector);

      m.compose(finalPos, q, s);
      mesh.setMatrixAt(slot, m);
    }

    instRefs.current.forEach(msh => msh && (msh.instanceMatrix.needsUpdate = true));
  });

  return <group>{meshes}</group>;
}