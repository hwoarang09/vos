// vehicleArrayMode/collisionLogic/checkLeadVehicle.ts

import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VEHICLE_DATA_SIZE, MovementData, SensorData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { Edge } from "@/types/edge";
import { VehicleLoop } from "@/utils/vehicle/loopMaker";
import { findTargetEdgeIndex } from "../helpers/edgeTargetFinder";
import { applyVehicleStatus } from "../helpers/statusApplier";
import { checkMergeConflict } from "./mergeConflictChecker";
import { checkSensorCollision, roughDistanceCheck } from "../helpers/sensorCollision";
import { SENSOR_PRESETS } from "@/store/vehicle/arrayMode/sensorPresets";

export function checkLeadVehicle(params: {
  edgeIdx: number;
  edge: Edge;
  data: Float32Array;
  edgeArray: Edge[];
  vehicleLoopMap: Map<number, VehicleLoop>;
  edgeNameToIndex: Map<string, number>;
  resumeDistance: number;
  shouldLogDetails: boolean;
}) {
  const { edgeIdx, edge, data, edgeArray, vehicleLoopMap, edgeNameToIndex, resumeDistance, shouldLogDetails } = params;

  const rawData = edgeVehicleQueue.getData(edgeIdx);
  if (!rawData || rawData[0] === 0) return { collisions: 0, resumes: 0 };

  const leadVehId = rawData[1];
  const leadPtr = leadVehId * VEHICLE_DATA_SIZE;

  const targetEdgeIdx = findTargetEdgeIndex(edge, leadVehId, vehicleLoopMap, edgeNameToIndex);
  if (targetEdgeIdx === -1) return applyVehicleStatus(data, leadPtr, false);

  const targetEdge = edgeArray[targetEdgeIdx];
  let canProceed = true;

  // 3. Collision Check
  const targetRawData = edgeVehicleQueue.getData(targetEdgeIdx);
  const targetCount = targetRawData ? targetRawData[0] : 0;

  if (shouldLogDetails) {
    console.log(`[CollisionCheck] VEH${leadVehId}: currentEdge=${edge.edge_name}(idx:${edgeIdx}), targetEdge=${targetEdge.edge_name}(idx:${targetEdgeIdx}), targetCount=${targetCount}`);
  }

  // If target edge is same as current edge, check if there are other vehicles ahead
  if (targetEdgeIdx === edgeIdx) {
    // Same edge - check if there are vehicles ahead of lead vehicle
    if (targetCount <= 1) {
      // Only lead vehicle on this edge, no collision
      if (shouldLogDetails) console.log(`[SameEdge] VEH${leadVehId} is alone on edge, can proceed`);
      return applyVehicleStatus(data, leadPtr, true);
    }
    // If there are multiple vehicles, we need to check the one ahead (not implemented yet)
    // For now, just allow proceeding
    if (shouldLogDetails) console.log(`[SameEdge] VEH${leadVehId} has ${targetCount} vehicles on same edge, allowing proceed for now`);
    return applyVehicleStatus(data, leadPtr, true);
  }

  // If no vehicles on target edge, can proceed
  if (targetCount === 0) {
    if (shouldLogDetails) console.log(`[NoTarget] VEH${leadVehId} -> ${targetEdge.edge_name} is empty, can proceed`);
    return applyVehicleStatus(data, leadPtr, true);
  }

  if (targetCount > 0) {
    const targetLastVehId = targetRawData![1 + (targetCount - 1)];

    // Skip if checking against self (shouldn't happen after same-edge check above)
    if (targetLastVehId === leadVehId) {
      if (shouldLogDetails) console.log(`[Skip] VEH${leadVehId} skipping self-check (unexpected)`);
      return applyVehicleStatus(data, leadPtr, true); // Can proceed
    }

    const targetLastPtr = targetLastVehId * VEHICLE_DATA_SIZE;

    const xLead = data[leadPtr + MovementData.X];
    const yLead = data[leadPtr + MovementData.Y];
    const xTarget = data[targetLastPtr + MovementData.X];
    const yTarget = data[targetLastPtr + MovementData.Y];

    const currentIsLinear = edge.vos_rail_type === "LINEAR";
    const targetIsLinear = targetEdge.vos_rail_type === "LINEAR";

    // 복잡 상황: 커브, 합류, 분기
    const hasMerge = targetEdge.prevEdgeIndices && targetEdge.prevEdgeIndices.length > 1;
    const hasBranch = edge.toNodeIsDiverge;
    const isComplex = !currentIsLinear || !targetIsLinear || hasMerge || hasBranch;

    if (isComplex) {
      // 센서 기반 정밀 체크 (SAT)
      if (roughDistanceCheck(leadVehId, targetLastVehId, 8.0)) {
        if (checkSensorCollision(leadVehId, targetLastVehId)) {
          canProceed = false;
          if (shouldLogDetails) console.log(`[Sensor] VEH${leadVehId} -> VEH${targetLastVehId} (complex)`);
        }
      }
    } else {
      // 직선 구간: 센서 길이 기반 거리 체크 (x 좌표만 사용)
      const distance = Math.abs(xTarget - xLead);

      // Get sensor length from preset
      const presetIdx = data[leadPtr + SensorData.PRESET_IDX] | 0;
      const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];
      const sensorLength = Math.max(preset.leftLength, preset.rightLength);

      // Stop distance = sensor length + small buffer
      const stopDistance = sensorLength + 0.5;

      if (distance <= stopDistance) {
        canProceed = false;
        if (shouldLogDetails) console.log(`[Distance] VEH${leadVehId} blocked (${distance.toFixed(2)}m, sensor: ${sensorLength.toFixed(2)}m, straight)`);
      }
    }

    // Debug: Log edge transition
    if (shouldLogDetails && edgeIdx !== targetEdgeIdx) {
      console.log(`[EdgeTransition] VEH${leadVehId}: ${edge.vos_rail_type}(${edge.edge_name}) -> ${targetEdge.vos_rail_type}(${targetEdge.edge_name}), canProceed: ${canProceed}`);
    }
  }

  // 4. Merge Conflict
  if (canProceed) {
    canProceed = checkMergeConflict(data, edgeIdx, edge, targetEdge, leadVehId, leadPtr, edgeArray, shouldLogDetails);
  }

  return applyVehicleStatus(data, leadPtr, canProceed);
}
