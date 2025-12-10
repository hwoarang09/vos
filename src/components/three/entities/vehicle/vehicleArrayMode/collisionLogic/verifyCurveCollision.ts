import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { Edge } from "@/types/edge";
import { verifyNextPathCollision } from "./verifyNextPathCollision";
import { verifyFollowingCollision } from "./verifyFollowingCollision";
import { verifyMergeZoneCollision } from "./verifyMergeCollision";

/**
 * Main Entry Point for Curve Collision Logic
 * Uses shared components: NextPath, Following, Merge
 */
export function verifyCurveCollision(edgeIdx: number, edge: Edge, vehicleArrayData: Float32Array) {
  const rawData = edgeVehicleQueue.getData(edgeIdx);
  if (!rawData || rawData[0] === 0) return;

  // 1. Check collision with next path (Same as Linear)
  verifyNextPathCollision(edgeIdx, edge, vehicleArrayData);

  // 2. Check collision with vehicle in front (Generic Logic)
  verifyFollowingCollision(edgeIdx, edge, vehicleArrayData);

  // 3. Check collision in Merge Zone (if applicable)
  // Curve edges often merge into main lines
  if (edge.toNodeIsMerge && edge.prevEdgeIndices && edge.prevEdgeIndices.length > 1) {
    verifyMergeZoneCollision(edgeIdx, edge, vehicleArrayData, rawData);
  }
}
