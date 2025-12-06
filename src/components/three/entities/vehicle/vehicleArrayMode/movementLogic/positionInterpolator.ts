import { Edge } from "@/types/edge";

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Calculates 3D position and rotation based on edge and ratio.
 * * [수정 사항]
 * - LINEAR: 계산 안 함. Edge에 저장된 axis 값을 차량의 진행 방향(rotation)으로 사용.
 * - CURVE: 곡선은 위치마다 각도가 변하므로 세그먼트 벡터로 계산하여 -90도 보정.
 */
export function interpolatePosition(edge: Edge, ratio: number) {
  const points = edge.renderingPoints;
  
  // Fast fail
  if (!points || points.length === 0) {
    // axis가 없으면 0도
    return { x: 0, y: 0, z: 3.8, rotation: (edge as any).axis ?? 0 };
  }

  // ==================================================================================
  // TYPE 1: LINEAR EDGES (Direct Access)
  // 이미 로딩 시점에 axis(0, 90, 180, 270)가 결정되었으므로 계산하지 않음.
  // ==================================================================================
  if (edge.vos_rail_type === "LINEAR") {
    const pStart = points[0];
    const pEnd = points[points.length - 1];

    // Position Interpolation (Lerp)
    // 직선은 중간 점 무시하고 시작/끝 점만으로 보간
    const x = pStart.x + (pEnd.x - pStart.x) * ratio;
    const y = pStart.y + (pEnd.y - pStart.y) * ratio;
    const z = 3.8;

    // axis: 이미 결정된 진행 방향 값 사용 (0: 위, 90: 왼쪽, 180: 아래, 270: 오른쪽)
    // Edge 타입에 axis가 없어서 TS 에러가 날 수 있으므로 any 캐스팅 처리
    const rotation = (edge as any).axis ?? 0;
    
    return { x, y, z, rotation };
  }

  // ==================================================================================
  // TYPE 2: CURVE EDGES (Segmented)
  // 곡선은 위치마다 각도가 계속 변하므로 벡터 계산 필요
  // ==================================================================================
  
  const safeRatio = ratio < 0 ? 0 : (ratio > 1 ? 1 : ratio);
  
  const maxIndex = points.length - 1;
  const floatIndex = safeRatio * maxIndex;
  const index = Math.floor(floatIndex);
  
  const nextIndex = index < maxIndex ? index + 1 : maxIndex;
  const segmentRatio = floatIndex - index;

  const p1 = points[index];
  const p2 = points[nextIndex];

  // Interpolate Position
  const x = p1.x + (p2.x - p1.x) * segmentRatio;
  const y = p1.y + (p2.y - p1.y) * segmentRatio;
  const z = 3.8;

  // Calculate Rotation for Curve
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const distSq = dx * dx + dy * dy;
  let rawRotation = 0;

  if (distSq > 0.000001) {
    rawRotation = Math.atan2(dy, dx) * RAD_TO_DEG;
  } else if (index > 0) {
    const pPrev = points[index - 1];
    rawRotation = Math.atan2(p1.y - pPrev.y, p1.x - pPrev.x) * RAD_TO_DEG;
  }

  // 곡선 구간 -90도 오프셋 (User Mapping Consistency: 위쪽이 0도 기준)
  const rotation = ((rawRotation) % 360 + 360) % 360;

  return { x, y, z, rotation };
}