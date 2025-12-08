import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RENDER_ORDER_TEXT } from "@/utils/renderOrder";
import { useDigitMaterials, CHAR_COUNT } from "./useDigitMaterials";
import {
  SlotData,
  HIDE_MATRIX,
  buildSlotData,
  applyHighAltitudeCulling,
  computeBillboardRotation,
  distanceSquared,
} from "./instancedTextUtils";

import type { TextGroup } from "./instancedTextUtils";
export type { TextGroup } from "./instancedTextUtils";

interface Props {
  readonly groups?: TextGroup[];
  readonly scale?: number;
  readonly font?: string;
  readonly color?: string;
  readonly bgColor?: string;
  readonly zOffset?: number;
  readonly lodDistance?: number;
  readonly camHeightCutoff?: number;
}

export default function InstancedText({
  groups = [],
  scale = 1,
  font = "bold 96px system-ui, Roboto, Arial",
  color = "#ffffff",
  bgColor = "transparent",
  zOffset = 0.5,
  lodDistance = 50,
  camHeightCutoff = 60,
}: Props) {
  const LOD_DIST_SQ = lodDistance * lodDistance;

  const digitMaterials = useDigitMaterials({ color, bgColor, font });
  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const dataRef = useRef<SlotData | null>(null);
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(new Array(CHAR_COUNT).fill(null));

  useEffect(() => {
    dataRef.current = buildSlotData(groups);
  }, [groups]);

  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || groups.length === 0) return [];

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, data.counts[d]);
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

    for (let d = 0; d < CHAR_COUNT; d++) {
      const mesh = instRefs.current[d];
      if (mesh && data.counts[d] > 0) {
        mesh.count = data.counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D || groups.length === 0) return;

    const { slotDigit, slotIndex, slotGroup, slotPosition, totalCharacters } = D;
    const { x: cx, y: cy, z: cz } = camera.position;

    if (applyHighAltitudeCulling(cz, camHeightCutoff, D, instRefs.current)) {
      return;
    }

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.2 * scale;

    const groupLOD = new Map<number, boolean>();
    const groupRotation = new Map<number, { quaternion: THREE.Quaternion; right: THREE.Vector3 }>();

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
        const distSq = distanceSquared(cx, cy, cz, gx, gy, gz);
        groupLOD.set(groupIdx, distSq > LOD_DIST_SQ);
      }

      if (groupLOD.get(groupIdx)) {
        mesh.setMatrixAt(slot, HIDE_MATRIX);
        continue;
      }

      // 빌보드 회전 (그룹당 한번만)
      if (!groupRotation.has(groupIdx)) {
        const pos = new THREE.Vector3(gx, gy, gz);
        groupRotation.set(groupIdx, computeBillboardRotation(pos, camera.position));
      }

      const { quaternion, right } = groupRotation.get(groupIdx)!;

      const halfLen = (group.digits.length - 1) / 2;
      const offsetX = (posIdx - halfLen) * charSpacing;
      const offsetVector = right.clone().multiplyScalar(offsetX);
      const finalPos = new THREE.Vector3(gx, gy, gz).add(offsetVector);

      m.compose(finalPos, quaternion, s);
      mesh.setMatrixAt(slot, m);
    }

    for (const msh of instRefs.current) {
      if (msh) msh.instanceMatrix.needsUpdate = true;
    }
  });

  return <group>{meshes}</group>;
}