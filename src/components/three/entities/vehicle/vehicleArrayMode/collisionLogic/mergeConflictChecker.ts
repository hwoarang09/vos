import { Edge } from "@/types/edge";
import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";

const MERGE_CHECK_THRESHOLD = 3.0; // meters

/**
 * Check merge conflict (side collision) at merge points
 * Returns true if vehicle can proceed, false if it should yield
 */
export function checkMergeConflict(
  data: Float32Array,
  edgeIdx: number,
  edge: Edge,
  targetEdge: Edge,
  leadVehId: number,
  leadPtr: number,
  edgeArray: Edge[],
  shouldLogDetails: boolean
): boolean {
  // Only check if target edge accepts multiple inputs (prevEdgeIndices > 1)
  if (!targetEdge.prevEdgeIndices || targetEdge.prevEdgeIndices.length <= 1) {
    return true; // No merge conflict possible
  }

  const myRatio = data[leadPtr + MovementData.EDGE_RATIO];
  const myDistLeft = (1.0 - myRatio) * edge.distance;

  // Only check if we are close to the merge point
  if (myDistLeft >= MERGE_CHECK_THRESHOLD) {
    return true; // Too far from merge point
  }

  // Check all competitor edges
  for (const compEdgeIdx of targetEdge.prevEdgeIndices) {
    if (compEdgeIdx === edgeIdx) continue; // Skip myself

    // Check competitor's LEAD vehicle (closest to merge)
    const compData = edgeVehicleQueue.getData(compEdgeIdx);
    const compCount = compData ? compData[0] : 0;

    if (compCount > 0) {
      const compLeadId = compData![1]; // First in array = Lead
      const compLeadPtr = compLeadId * VEHICLE_DATA_SIZE;
      const compEdge = edgeArray[compEdgeIdx];

      const compRatio = data[compLeadPtr + MovementData.EDGE_RATIO];
      const compDistLeft = (1.0 - compRatio) * compEdge.distance;

      // Conflict detection
      if (compDistLeft < MERGE_CHECK_THRESHOLD) {
        // Simple Priority Rule: Closer vehicle goes first
        // If distances are very similar (< 0.5m diff), use Edge Index as tie-breaker to prevent deadlock
        if (compDistLeft < myDistLeft - 0.5) {
          // Competitor is significantly closer
          if (shouldLogDetails) {
            console.log(
              `[Merge Yield] VEH${leadVehId} yielding to VEH${compLeadId} (Dist: ${myDistLeft.toFixed(1)} vs ${compDistLeft.toFixed(1)})`
            );
          }
          return false;
        } else if (Math.abs(compDistLeft - myDistLeft) <= 0.5) {
          // Tie-breaker: Lower Edge Index yields (deterministic rule)
          if (compEdgeIdx < edgeIdx) {
            if (shouldLogDetails) {
              console.log(
                `[Merge Yield] VEH${leadVehId} yielding to VEH${compLeadId} (Tie-breaker: Edge ${compEdgeIdx} < ${edgeIdx})`
              );
            }
            return false;
          }
        }
      }
    }
  }

  return true; // Can proceed
}
