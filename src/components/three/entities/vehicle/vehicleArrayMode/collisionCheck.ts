import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VehicleLoop } from "@/utils/vehicle/loopMaker";
import { Edge } from "@/types/edge";
import { checkLeadVehicle } from "./collisionLogic/checkLeadVehicle";
import { checkFollowingVehicles } from "./collisionLogic/checkFollowingVehicle";

interface CollisionCheckParams {
  data: Float32Array;
  edgeArray: Edge[];
  actualNumVehicles: number;
  vehicleLoopMap: Map<number, VehicleLoop>;
  edgeNameToIndex: Map<string, number>;
  sameEdgeSafeDistance: number;
  resumeDistance: number;
}

/**
 * Check collisions and control vehicle stop/resume
 * Returns collision statistics
 */
export function checkCollisions(params: CollisionCheckParams) {
  const {
    data,
    edgeArray,
    sameEdgeSafeDistance,
    resumeDistance,
    vehicleLoopMap,
    edgeNameToIndex,
  } = params;

  let sameEdgeCollisions = 0;
  let sameEdgeResumes = 0;
  let edgesChecked = 0;
  let totalVehiclesChecked = 0;

  // Sampling for logs
  const shouldLogDetails = Math.random() < 0.001;

  for (let edgeIdx = 0; edgeIdx < edgeArray.length; edgeIdx++) {
    const edge = edgeArray[edgeIdx];
    // Safety check
    if (!edge) continue;

    // Zero-allocation: get count directly
    const count = edgeVehicleQueue.getCount(edgeIdx);
    if (count === 0) continue;

    edgesChecked++;
    totalVehiclesChecked += count;

    // [A] Check lead vehicle (index 0 in sorted array = closest to end) - check Next Edge / Merge
    const leadResult = checkLeadVehicle({
      edgeIdx,
      edge,
      data,
      edgeArray,
      vehicleLoopMap,
      edgeNameToIndex,
      resumeDistance,
      shouldLogDetails,
    });
    sameEdgeCollisions += leadResult.collisions;
    sameEdgeResumes += leadResult.resumes;

    // [B] Check following vehicles (index 1 to count-1) - check Front Vehicle
    // Only if there are 2+ vehicles
    if (count > 1) {
      const followResult = checkFollowingVehicles({
        edgeIdx,
        edge,
        data,
        sameEdgeSafeDistance,
        resumeDistance,
        shouldLogDetails,
      });
      sameEdgeCollisions += followResult.collisions;
      sameEdgeResumes += followResult.resumes;
    }
  }

  return { sameEdgeCollisions, sameEdgeResumes, edgesChecked, totalVehiclesChecked };
}
