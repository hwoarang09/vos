import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { checkSensorCollision, roughDistanceCheck } from "../helpers/sensorCollision";
import { HitZone } from "@/store/vehicle/arrayMode/vehicleDataArray";

/**
 * Check collision at merge points
 * Returns true if CONFLICT DETECTED (should yield), false if safe
 */
export function isMergeConflict(
  leadVehId: number,
  targetEdgeIdx: number,
  shouldLogDetails: boolean
): boolean {
  // Check detection against competitor's HEAD vehicle
  const compData = edgeVehicleQueue.getData(targetEdgeIdx); 
  
  // If no vehicles on competitor edge, safe (no conflict)
  if (!compData || compData[0] === 0) return false;

  const compLeadId = compData[1]; // First in array = Head

  // Prevent self-check (though unlikely if finder filtered correctly)
  if (compLeadId === leadVehId) return false;

  // Use standard sensor check
  // Note: roughDistanceCheck prevents expensive SAT if far away
  // Range: 15.0m for merge safety (conservative)
  if (roughDistanceCheck(leadVehId, compLeadId, 15.0)) {
      const hit = checkSensorCollision(leadVehId, compLeadId);
      
      // If ANY detection (Stop/Brake/Approach), treat as conflict
      if (hit !== HitZone.NONE) {
          if (shouldLogDetails) {
             console.log(`[MergeConflict] VEH${leadVehId} sees VEH${compLeadId} (Zone: ${hit}) -> Yielding`);
          }
          return true; // Conflict Exists!
      }
  }

  return false; // Safe (No Conflict)
}
