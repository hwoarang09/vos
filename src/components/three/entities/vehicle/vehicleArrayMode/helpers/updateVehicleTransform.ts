import { vehicleDataArray } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { VEHICLE_DATA_SIZE, MovementData, SensorData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { updateSensorPoints } from "./sensorPoints";

/**
 * 차량 위치/회전 + 센서 점 통합 업데이트
 * 
 * 이 함수 하나로 movement와 sensor geometry가 동시에 갱신됨.
 * 기존에 x, y, rotation 따로 세팅하던 코드를 이걸로 교체.
 */
export function updateVehicleTransform(
  vehIdx: number,
  x: number,
  y: number,
  rot: number
): void {
  const vData = vehicleDataArray.getData();
  const base = vehIdx * VEHICLE_DATA_SIZE;

  // 1) Movement 업데이트
  vData[base + MovementData.X] = x;
  vData[base + MovementData.Y] = y;
  vData[base + MovementData.ROTATION] = rot;

  // 2) 현재 프리셋 인덱스 읽기
  const presetIdx = Math.trunc(vData[base + SensorData.PRESET_IDX]);  // float -> int

  // 3) 센서 점 6개 업데이트
  updateSensorPoints(vehIdx, x, y, rot, presetIdx);
}

/**
 * 센서 프리셋 변경 (edge 진입 시 호출)
 */
export function setSensorPreset(vehIdx: number, presetIdx: number): void {
  const vData = vehicleDataArray.getData();
  const base = vehIdx * VEHICLE_DATA_SIZE;
  vData[base + SensorData.PRESET_IDX] = presetIdx;
}

/**
 * 센서 프리셋 조회
 */
export function getSensorPreset(vehIdx: number): number {
  const vData = vehicleDataArray.getData();
  const base = vehIdx * VEHICLE_DATA_SIZE;
  return Math.trunc(vData[base + SensorData.PRESET_IDX]);
}
