import { Edge } from "@/types/edge";
import { VehicleLoop, getNextEdgeInLoop } from "@/utils/vehicle/loopMaker";

/**
 * Find target edge index for a lead vehicle
 * Handles both single-path and diverge scenarios
 */
/**
 * Find collision target edges for a lead vehicle
 * Returns:
 * - mergeTargetIndices: Edges entering the same node (Competitors)
 * - nextTargetIndices: Edges leaving the same node (Next Paths)
 */
export function findCollisionTargetEdges(
  currentEdge: Edge,
  edgeArray: Edge[]
): { mergeTargetIndices: number[]; nextTargetIndices: number[] } {
  const mergeTargetIndices: number[] = [];
  const nextTargetIndices: number[] = [];

  // [1] Merge Targets (Competitors entering same node)
  // Only relevant if the node we are approaching is a merge point
  if (currentEdge.toNodeIsMerge && currentEdge.prevEdgeIndices) {
    // Current edge's index needs to be excluded
    // But we don't have current edge index easily here without searching or passing it
    // Assuming prevEdgeIndices contains all indices including self?
    // Let's rely on caller to filter self or filter by edge name if needed.
    // Actually, prevEdgeIndices are indices of edges sharing the TO_NODE.
    // We should filter out the current edge itself.
    
    // Safety: Retrieve current edge index from edgeArray? 
    // Optimization: Just pass edgeIdx from caller if possible, but for now filtering by object identity or name
    currentEdge.prevEdgeIndices.forEach(idx => {
       const otherEdge = edgeArray[idx];
       if (otherEdge && otherEdge.edge_name !== currentEdge.edge_name) {
          mergeTargetIndices.push(idx);
       }
    });
  }

  // [2] Next Targets (Paths leaving the node)
  if (currentEdge.nextEdgeIndices) {
    nextTargetIndices.push(...currentEdge.nextEdgeIndices);
  }

  return { mergeTargetIndices, nextTargetIndices };
}

