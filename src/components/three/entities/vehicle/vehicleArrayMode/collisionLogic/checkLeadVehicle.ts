// checkLeadVehicle.ts
import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VEHICLE_DATA_SIZE, MovementData, SensorData, MovingStatus, HitZone } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { Edge } from "@/types/edge";
import { VehicleLoop } from "@/utils/vehicle/loopMaker";
import { findCollisionTargetEdges } from "../helpers/edgeTargetFinder";
import { applyVehicleStatus } from "../helpers/statusApplier";
import { isMergeConflict } from "./mergeConflictChecker";
import { checkSensorCollision, roughDistanceCheck } from "../helpers/sensorCollision";
import { SENSOR_PRESETS, SensorZoneKey } from "@/store/vehicle/arrayMode/sensorPresets";
import { getApproachMinSpeed, getBrakeMinSpeed } from "@/config/movementConfig";
import { getBodyLength } from "@/config/vehicleConfig";

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
  const { edgeIdx, edge, data, edgeArray, shouldLogDetails } = params;

  const rawData = edgeVehicleQueue.getData(edgeIdx);
  // rawData[0] = count, rawData[1] = first vehicle index
  if (!rawData || rawData[0] === 0) return { collisions: 0, resumes: 0 };

  const leadVehId = rawData[1];
  const leadPtr = leadVehId * VEHICLE_DATA_SIZE;

  // 1. Get Targets (Merge + Next)
  const { mergeTargetIndices, nextTargetIndices } = findCollisionTargetEdges(edge, edgeArray);

  // Aggregated state for this vehicle across all potential paths
  let canProceed = true;
  let maxDeceleration = 0;
  let mostSevereHit: number = HitZone.NONE;

  // Cache config values
  const approachMinSpeed = getApproachMinSpeed();
  const brakeMinSpeed = getBrakeMinSpeed();
  const velocity = data[leadPtr + MovementData.VELOCITY];

  if (shouldLogDetails && (mergeTargetIndices.length > 0 || nextTargetIndices.length > 1)) {
    console.log(`[CheckLead] VEH${leadVehId} @ ${edge.edge_name}: MergeTargets=[${mergeTargetIndices}], NextTargets=[${nextTargetIndices}]`);
  }

  // =========================================================================================
  // [A] CHECK MERGE CONFLICTS (Competitors entering same node)
  // Target: HEAD vehicle of competitor edge
  // =========================================================================================
  for (const targetIdx of mergeTargetIndices) {
    if (!canProceed) break; // Optimization: Stop if already blocked

    const targetRaw = edgeVehicleQueue.getData(targetIdx);
    if (!targetRaw || targetRaw[0] === 0) continue;

    const targetHeadVehId = targetRaw[1]; // HEAD vehicle (index 0)
    const targetEdge = edgeArray[targetIdx];

    // Check Merge Conflict
    const hasConflict = isMergeConflict(leadVehId, targetIdx, shouldLogDetails);
    
    if (hasConflict) {
        canProceed = false;
        mostSevereHit = HitZone.STOP;
        if (shouldLogDetails) console.log(`[MergeBlock] VEH${leadVehId} blocked by VEH${targetHeadVehId} from ${targetEdge.edge_name}`);
    }
  }

  // =========================================================================================
  // [B] CHECK NEXT PATHS (Following Logic)
  // Target: TAIL vehicle of next edge
  // =========================================================================================
  
  // If no next paths available, stop.
  if (nextTargetIndices.length === 0) {
     canProceed = false;
     mostSevereHit = HitZone.STOP;
  }

  for (const targetIdx of nextTargetIndices) {
    if (!canProceed && mostSevereHit === HitZone.STOP) break; 

      const targetRaw = edgeVehicleQueue.getData(targetIdx);
      const targetCount = targetRaw ? targetRaw[0] : 0;
      const targetEdge = edgeArray[targetIdx];
      
      if (targetCount === 0) continue; // Path is clear

      // Check TAIL Vehicle (Last one entered)
      const targetTailVehIndex = 1 + (targetCount - 1);
      const targetTailId = targetRaw![targetTailVehIndex];

      // Prevent self-check
      if (targetTailId === leadVehId) continue;

      // SENSOR CHECK (SAT)
      const roughCheck = roughDistanceCheck(leadVehId, targetTailId, 12.0); 
      if (roughCheck) {
          const zoneHit = checkSensorCollision(leadVehId, targetTailId);
          
          if (zoneHit >= 0) {
            const presetIdx = data[leadPtr + SensorData.PRESET_IDX] | 0;
            const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];
            const zoneKey: SensorZoneKey = zoneHit === HitZone.STOP ? SensorZoneKey.STOP : zoneHit === HitZone.BRAKE ? SensorZoneKey.BRAKE : SensorZoneKey.APPROACH;
            const dec = preset.zones[zoneKey]?.dec ?? 0;

            if (zoneKey === SensorZoneKey.STOP || dec === -Infinity) {
               canProceed = false;
               mostSevereHit = HitZone.STOP;
            } else {
               // Conditional Deceleration
               let shouldDecel = true;
               if (zoneKey === SensorZoneKey.APPROACH && velocity <= approachMinSpeed) shouldDecel = false;
               if (zoneKey === SensorZoneKey.BRAKE && velocity <= brakeMinSpeed) shouldDecel = false;
               
               if (shouldDecel) {
                   if (dec > maxDeceleration) maxDeceleration = dec;
                   // Severity: higher HitZone value is more severe
                   if (zoneHit > mostSevereHit) mostSevereHit = zoneHit;
               }
            }

            if (shouldLogDetails) console.log(`[NextPath] VEH${leadVehId} hit VEH${targetTailId} (${zoneKey}) on ${targetEdge.edge_name}`);
          }
      }
    }


  // Apply Final State
  data[leadPtr + SensorData.HIT_ZONE] = mostSevereHit;
  data[leadPtr + MovementData.DECELERATION] = maxDeceleration;

  if (mostSevereHit === HitZone.STOP || !canProceed) {
    data[leadPtr + MovementData.VELOCITY] = 0;
    data[leadPtr + MovementData.DECELERATION] = 0;
    data[leadPtr + MovementData.MOVING_STATUS] = MovingStatus.STOPPED;
    return applyVehicleStatus(data, leadPtr, false);
  }

  return applyVehicleStatus(data, leadPtr, true);
}
