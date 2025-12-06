import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VEHICLE_DATA_SIZE, MovementData, MovingStatus } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { Edge } from "@/types/edge";
import { calculateSameEdgeDistances } from "../helpers/distanceCalculator";

/**
 * Check following vehicles collision with front vehicle on same edge
 */
export function checkFollowingVehicles(params: {
  edgeIdx: number;
  edge: Edge;
  data: Float32Array;
  sameEdgeSafeDistance: number;
  resumeDistance: number;
  shouldLogDetails: boolean;
}) {
  const {
    edgeIdx,
    edge,
    data,
    sameEdgeSafeDistance,
    resumeDistance,
    shouldLogDetails,
  } = params;

  let collisions = 0;
  let resumes = 0;

  const rawData = edgeVehicleQueue.getData(edgeIdx);
  // Checked count > 1 in caller, so safe here
  const count = rawData![0];

  // Determine edge type
  const isLinearEdge = edge.vos_rail_type === "LINEAR";

  // Loop through following vehicles
  // i=0 is Leader, i=1 follows i=0, i=2 follows i=1 ...
  for (let i = 1; i < count; i++) {
    const frontVehId = rawData![1 + (i - 1)];
    const backVehId = rawData![1 + i];

    // Skip if same vehicle (shouldn't happen, but safety check)
    if (frontVehId === backVehId) {
      if (shouldLogDetails) {
        console.log(`[Skip] VEH${frontVehId} appears twice in edge ${edge.edge_name} list, skipping self-check`);
      }
      continue;
    }

    const ptrFront = frontVehId * VEHICLE_DATA_SIZE;
    const ptrBack = backVehId * VEHICLE_DATA_SIZE;

    const xFront = data[ptrFront + MovementData.X];
    const yFront = data[ptrFront + MovementData.Y];
    const xBack = data[ptrBack + MovementData.X];
    const yBack = data[ptrBack + MovementData.Y];

    // Calculate distance and effective safe distances based on edge type
    let distance: number;
    if (isLinearEdge) {
      // Linear edge - only use x distance (horizontal line)
      distance = Math.abs(xFront - xBack);
    } else {
      // Curve edge - use Euclidean distance
      const dx = Math.abs(xFront - xBack);
      const dy = Math.abs(yFront - yBack);
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate effective distances based on edge type
    const dy = Math.abs(yFront - yBack);
    const { effectiveSafeDistance, effectiveResumeDistance } = calculateSameEdgeDistances(
      isLinearEdge,
      dy,
      sameEdgeSafeDistance,
      resumeDistance
    );

    const statusBack = data[ptrBack + MovementData.MOVING_STATUS];

    // Control back vehicle based on distance to front vehicle
    if (distance < effectiveSafeDistance && statusBack !== MovingStatus.STOPPED) {
      // Too close - stop back vehicle
      data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.STOPPED;
      collisions++;
      if (shouldLogDetails) {
        console.log(`[Collision] VEH${backVehId} STOPPED on edge ${edge.edge_name} (dist to VEH${frontVehId}: ${distance.toFixed(2)}m < ${effectiveSafeDistance.toFixed(2)}m)`);
      }
    } else if (distance > effectiveResumeDistance && statusBack === MovingStatus.STOPPED) {
      // Far enough - resume back vehicle
      data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
      resumes++;
      if (shouldLogDetails) {
        console.log(`[Resume] VEH${backVehId} RESUMED on edge ${edge.edge_name} (dist to VEH${frontVehId}: ${distance.toFixed(2)}m > ${effectiveResumeDistance.toFixed(2)}m)`);
      }
    }
  }

  return { collisions, resumes };
}
