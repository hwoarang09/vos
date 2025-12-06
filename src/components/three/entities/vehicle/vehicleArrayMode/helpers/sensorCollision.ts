// vehicleArrayMode/helpers/sensorCollision.ts

import {
  sensorPointArray,
  SENSOR_DATA_SIZE,
  SENSOR_POINT_SIZE,
  SensorPoint,
} from "@/store/vehicle/arrayMode/sensorPointArray";

// 센서 사각형: FL -> SL -> SR -> FR (반시계)
const SENSOR_QUAD_IDX = [
  SensorPoint.FL_X,
  SensorPoint.SL_X,
  SensorPoint.SR_X,
  SensorPoint.FR_X,
] as const;

// 바디 사각형: FL -> BL -> BR -> FR (반시계)
const BODY_QUAD_IDX = [
  SensorPoint.FL_X,
  SensorPoint.BL_X,
  SensorPoint.BR_X,
  SensorPoint.FR_X,
] as const;

/**
 * 센서 충돌 검사 (SAT 알고리즘, Zero-GC)
 * @param sensorVehIdx - 센서 차량 (뒤차)
 * @param targetVehIdx - 타겟 차량 (앞차)
 * @returns true = 충돌
 */
export function checkSensorCollision(
  sensorVehIdx: number,
  targetVehIdx: number
): number {
  const data = sensorPointArray.getData();
  const baseSensor = sensorVehIdx * SENSOR_DATA_SIZE;
  const baseTarget = targetVehIdx * SENSOR_DATA_SIZE;

  // check inner -> outer to prioritize strongest braking
  for (let zone = 2; zone >= 0; zone--) {
    const sensorBase = baseSensor + zone * SENSOR_POINT_SIZE;
    const targetBase = baseTarget + 0 * SENSOR_POINT_SIZE; // body uses outer zone footprint

    if (
      satQuadCheck(data, sensorBase, targetBase, SENSOR_QUAD_IDX, BODY_QUAD_IDX) &&
      satQuadCheck(data, targetBase, sensorBase, BODY_QUAD_IDX, SENSOR_QUAD_IDX)
    ) {
      return zone;
    }
  }

  return -1; // no collision
}

/**
 * SAT (Separating Axis Theorem) 검사
 * @returns true = 이 축들에서 겹침 (분리축 없음)
 */
function satQuadCheck(
  data: Float32Array,
  baseA: number,
  baseB: number,
  idxA: readonly number[],
  idxB: readonly number[]
): boolean {
  // 4개 변에 대해 검사
  for (let i = 0; i < 4; i++) {
    const currIdx = idxA[i];
    const nextIdx = idxA[(i + 1) % 4];

    // 변의 두 점
    const p1x = data[baseA + currIdx];
    const p1y = data[baseA + currIdx + 1];
    const p2x = data[baseA + nextIdx];
    const p2y = data[baseA + nextIdx + 1];

    // 법선 벡터 (변에 수직)
    const axisX = -(p2y - p1y);
    const axisY = p2x - p1x;

    // 축 길이 체크 (degenerate 방지)
    const axisLenSq = axisX * axisX + axisY * axisY;
    if (axisLenSq < 1e-10) continue;

    // Poly A 투영 범위
    let minA = Infinity;
    let maxA = -Infinity;
    for (let j = 0; j < 4; j++) {
      const px = data[baseA + idxA[j]];
      const py = data[baseA + idxA[j] + 1];
      const proj = px * axisX + py * axisY;
      if (proj < minA) minA = proj;
      if (proj > maxA) maxA = proj;
    }

    // Poly B 투영 범위
    let minB = Infinity;
    let maxB = -Infinity;
    for (let j = 0; j < 4; j++) {
      const px = data[baseB + idxB[j]];
      const py = data[baseB + idxB[j] + 1];
      const proj = px * axisX + py * axisY;
      if (proj < minB) minB = proj;
      if (proj > maxB) maxB = proj;
    }

    // 분리축 발견 = 충돌 아님
    if (maxA < minB || maxB < minA) {
      return false;
    }
  }

  return true;
}

/**
 * 거리 기반 사전 필터 (정밀 검사 전 빠른 스킵용)
 * FL 점 기준 대략적 거리 체크
 */
export function roughDistanceCheck(
  vehIdx1: number,
  vehIdx2: number,
  threshold: number
): boolean {
  const data = sensorPointArray.getData();
  const base1 = vehIdx1 * SENSOR_DATA_SIZE + 0 * SENSOR_POINT_SIZE;
  const base2 = vehIdx2 * SENSOR_DATA_SIZE + 0 * SENSOR_POINT_SIZE;

  // FL 점 기준
  const dx = data[base1 + SensorPoint.FL_X] - data[base2 + SensorPoint.FL_X];
  const dy = data[base1 + SensorPoint.FL_Y] - data[base2 + SensorPoint.FL_Y];

  return (dx * dx + dy * dy) <= (threshold * threshold);
}
