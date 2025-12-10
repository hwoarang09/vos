import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { Edge } from "@/types/edge";
import { verifyNextPathCollision } from "./verifyNextPathCollision";
import { verifyFollowingCollision } from "./verifyFollowingCollision";
import { verifyMergeZoneCollision } from "./verifyMergeCollision";
  
/**
 * Main Entry Point for Linear Collision Logic
 * Routes to Simple or Merge logic based on topology.
 */
export function verifyLinearCollision(edgeIdx: number, edge: Edge, vehicleArrayData: Float32Array) {
  const rawData = edgeVehicleQueue.getData(edgeIdx);
  if (!rawData || rawData[0] === 0) return;

  // 1. Standard Linear Checks (Always apply)
  // - Lead vehicle checks next path/node
  // - Following vehicles check gap to front
  verifyNextPathCollision(edgeIdx, edge, vehicleArrayData);  
  verifyFollowingCollision(edgeIdx, edge, vehicleArrayData);

  // 2. Merge Danger Zone Checks (If applicable)
  // If this edge merges into another node, we must check for cross-traffic
  // near the end of the edge (Danger Zone).
  if (edge.toNodeIsMerge && edge.prevEdgeIndices && edge.prevEdgeIndices.length > 1) {
    verifyMergeZoneCollision(edgeIdx, edge, vehicleArrayData, rawData);
  }
}

