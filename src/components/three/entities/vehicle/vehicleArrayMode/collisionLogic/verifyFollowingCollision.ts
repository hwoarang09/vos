import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { Edge } from "@/types/edge";
import { SensorData, VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { getBodyLength } from "@/config/vehicleConfig";
import { SENSOR_PRESETS } from "@/store/vehicle/arrayMode/sensorPresets";
import { determineLinearHitZone, applyCollisionZoneLogic } from "./collisionCommon";

/**
 * 직선/곡선 공용 Following Collision 로직
 * 거리 계산 방식(Strategy)만 다름.
 */
export function verifyFollowingCollision(edgeIdx: number, edge: Edge, data: Float32Array) {
  const rawData = edgeVehicleQueue.getData(edgeIdx);
  if (!rawData || rawData[0] <= 1) return;

  const count = rawData[0];
  const vehicleLength = getBodyLength(); 

  // Iterate from 1 to count - 1 (앞차 vs 뒷차 쌍 비교)
  for (let i = 1; i < count; i++) {
    const frontVehId = rawData[1 + (i - 1)];
    const backVehId = rawData[1 + i];
    
    const ptrFront = frontVehId * VEHICLE_DATA_SIZE;
    const ptrBack = backVehId * VEHICLE_DATA_SIZE;
    
    // [핵심 변경점] 엣지 타입에 따라 거리 계산 분기
    let distance = 0;

    if (edge.curveType) {
       // --- 곡선인 경우: Offset 차이 ---
       const frontOffset = data[ptrFront + MovementData.OFFSET];
       const backOffset = data[ptrBack + MovementData.OFFSET];
       distance = Math.abs(frontOffset - backOffset); // 안전하게 절대값 (보통 front > back)

    } else {
       // --- 직선인 경우: 좌표 차이 ---
       const axisIdx = edge.axis === 'y' ? MovementData.Y : MovementData.X;
       const frontPos = data[ptrFront + axisIdx];
       const backPos = data[ptrBack + axisIdx];
       
       distance = Math.abs(frontPos - backPos); 
    }

    // 이하 로직은 직선/곡선 100% 동일
    const presetIdx = Math.trunc(data[ptrBack + SensorData.PRESET_IDX]);
    const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];

    const stopDist = preset.zones.stop.leftLength + vehicleLength;
    const brakeDist = preset.zones.brake.leftLength + vehicleLength;
    const approachDist = preset.zones.approach.leftLength + vehicleLength;

    const hitZone = determineLinearHitZone(distance, stopDist, brakeDist, approachDist);
    applyCollisionZoneLogic(hitZone, data, ptrBack);
  }
}
