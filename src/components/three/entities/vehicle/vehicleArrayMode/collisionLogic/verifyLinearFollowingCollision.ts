import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { Edge } from "@/types/edge";
import { SensorData, VEHICLE_DATA_SIZE } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { getBodyLength } from "@/config/vehicleConfig";
import { SENSOR_PRESETS } from "@/store/vehicle/arrayMode/sensorPresets";
import { calculateLinearDistance, determineLinearHitZone, applyCollisionZoneLogic } from "./collisionCommon";

export function verifyLinearFollowingCollision(edgeIdx: number, edge: Edge, data: Float32Array) {
  const rawData = edgeVehicleQueue.getData(edgeIdx);
  if (!rawData || rawData[0] <= 1) return;

  const count = rawData[0];
  const vehicleLength = getBodyLength(); 

  // Iterate from 1 to count - 1 to check pairs (0-1, 1-2, etc.)
  for (let i = 1; i < count; i++) {
    const frontVehId = rawData[1 + (i - 1)];
    const backVehId = rawData[1 + i];
    
    // Pointers to the Float32Array
    const ptrFront = frontVehId * VEHICLE_DATA_SIZE;
    const ptrBack = backVehId * VEHICLE_DATA_SIZE;
    
    // Calculate distance
    const distance = calculateLinearDistance(edge.axis ?? 'x', data, ptrFront, ptrBack);

    // Get sensor config
    const presetIdx = Math.trunc(data[ptrBack + SensorData.PRESET_IDX]);
    const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];

    // Calculate thresholds
    const stopDist = preset.zones.stop.leftLength + vehicleLength;
    const brakeDist = preset.zones.brake.leftLength + vehicleLength;
    const approachDist = preset.zones.approach.leftLength + vehicleLength;

    // 1. Determine Hit Zone
    const hitZone = determineLinearHitZone(distance, stopDist, brakeDist, approachDist);

    // 2. Apply Logic based on Zone
    applyCollisionZoneLogic(hitZone, data, ptrBack);
  }
}
