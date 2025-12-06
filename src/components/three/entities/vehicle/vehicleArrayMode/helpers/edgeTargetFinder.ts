import { Edge } from "@/types/edge";
import { VehicleLoop, getNextEdgeInLoop } from "@/utils/vehicle/loopMaker";

/**
 * Find target edge index for a lead vehicle
 * Handles both single-path and diverge scenarios
 */
export function findTargetEdgeIndex(
  currentEdge: Edge,
  leadVehId: number,
  vehicleLoopMap: Map<number, VehicleLoop>,
  edgeNameToIndex: Map<string, number>
): number {
  let targetEdgeIdx = -1;

  if (!currentEdge.toNodeIsDiverge && currentEdge.nextEdgeIndices && currentEdge.nextEdgeIndices.length > 0) {
    // FAST PATH: Single path, no lookup needed
    targetEdgeIdx = currentEdge.nextEdgeIndices[0];
  } else {
    // SLOW PATH: Diverge, check loop map
    const loop = vehicleLoopMap.get(leadVehId);
    if (loop) {
      const nextEdgeName = getNextEdgeInLoop(currentEdge.edge_name, loop.edgeSequence);
      const idx = edgeNameToIndex.get(nextEdgeName);
      if (idx !== undefined) targetEdgeIdx = idx;
    }

    // Fallback: If loop fails or no loop, just pick first available path to avoid stuck
    if (targetEdgeIdx === -1 && currentEdge.nextEdgeIndices && currentEdge.nextEdgeIndices.length > 0) {
      targetEdgeIdx = currentEdge.nextEdgeIndices[0];
    }
  }

  return targetEdgeIdx;
}

