import * as THREE from "three";
import { CHAR_COUNT } from "./useDigitMaterials";

export const HIDE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

export interface SlotData {
  totalCharacters: number;
  counts: number[];
  slotIndex: Int32Array;
  slotDigit: Int8Array;
  slotGroup: Int32Array;
  slotPosition: Int32Array;
}

export interface TextGroup {
  x: number;
  y: number;
  z: number;
  digits: number[];
}

/**
 * TextGroup 배열에서 인스턴싱 슬롯 데이터 생성
 */
export function buildSlotData(groups: TextGroup[]): SlotData | null {
  if (!groups || groups.length === 0) return null;

  let totalCharacters = 0;
  for (const group of groups) {
    totalCharacters += group.digits.length;
  }

  const counts = new Array(CHAR_COUNT).fill(0);
  const slotDigit = new Int8Array(totalCharacters);
  const slotGroup = new Int32Array(totalCharacters);
  const slotPosition = new Int32Array(totalCharacters);

  let charIndex = 0;
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const { digits } = groups[groupIndex];
    for (let posIndex = 0; posIndex < digits.length; posIndex++) {
      const digit = Math.max(0, Math.min(CHAR_COUNT - 1, digits[posIndex]));
      slotDigit[charIndex] = digit;
      slotGroup[charIndex] = groupIndex;
      slotPosition[charIndex] = posIndex;
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

  return { totalCharacters, counts, slotIndex, slotDigit, slotGroup, slotPosition };
}

/**
 * 카메라 고도 기반 전체 컬링
 * @returns true면 컬링됨 (렌더링 스킵)
 */
export function applyHighAltitudeCulling(
  cameraZ: number,
  cutoff: number,
  data: SlotData,
  meshes: (THREE.InstancedMesh | null)[]
): boolean {
  if (cameraZ <= cutoff) return false;

  const { totalCharacters, slotDigit, slotIndex } = data;
  for (let i = 0; i < totalCharacters; i++) {
    const d = slotDigit[i];
    const slot = slotIndex[i];
    const mesh = meshes[d];
    if (mesh) mesh.setMatrixAt(slot, HIDE_MATRIX);
  }
  for (const msh of meshes) {
    if (msh) msh.instanceMatrix.needsUpdate = true;
  }
  return true;
}

/**
 * 빌보드 회전 계산 (Z-up 기준)
 */
export function computeBillboardRotation(
  targetPos: THREE.Vector3,
  cameraPos: THREE.Vector3
): { quaternion: THREE.Quaternion; right: THREE.Vector3 } {
  const lookDir = new THREE.Vector3()
    .subVectors(cameraPos, targetPos)
    .normalize();

  const up = new THREE.Vector3(0, 0, 1);
  const matrix = new THREE.Matrix4().lookAt(
    new THREE.Vector3(0, 0, 0),
    lookDir.clone().negate(),
    up
  );

  const quaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);

  return { quaternion, right };
}

/**
 * 거리 제곱 계산
 */
export function distanceSquared(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;
  return dx * dx + dy * dy + dz * dz;
}