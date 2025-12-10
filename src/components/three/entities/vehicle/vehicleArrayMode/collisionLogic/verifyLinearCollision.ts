import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { Edge } from "@/types/edge";

import { verifyLinearFollowingCollision } from "./verifyLinearFollowingCollision";
import { checkSensorCollision } from "@/components/three/entities/vehicle/vehicleArrayMode/helpers/sensorCollision";
import { MovementData, VEHICLE_DATA_SIZE, HitZone } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { applyCollisionZoneLogic } from "./collisionCommon";
import { verifyNextPathCollision } from "./verifyNextPathCollision";
  
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
  verifyLinearFollowingCollision(edgeIdx, edge, vehicleArrayData);

  // 2. Merge Danger Zone Checks (If applicable)
  // If this edge merges into another node, we must check for cross-traffic
  // near the end of the edge (Danger Zone).
  if (edge.toNodeIsMerge && edge.prevEdgeIndices && edge.prevEdgeIndices.length > 1) {
    verifyMergeZoneCollision(edgeIdx, edge, vehicleArrayData, rawData);
  }
}

import { getBodyLength } from "@/config/vehicleConfig";

/**
 * Returns a fixed curve tail length (assumption: 0.5m).
 * This represents the distance between Node[-2] and ToNode on the merging curve.
 */
function getCurveTailLength(): number {
  return 0.5;
}

/**
 * Checks for side/merge collisions in the Danger Zone.
 * Iterates ALL vehicles on the edge (not just lead) because a long edge
 * might have multiple vehicles in the merge zone.
 */
function verifyMergeZoneCollision(
  edgeIdx: number, 
  edge: Edge, 
  data: Float32Array, 
  queue: Int32Array
) {
  // 1. Calculate Danger Zone Length
  // User Requirement: Assume Curve Tail Length (Node[-2] to ToNode) is fixed at 0.5m.
  const tailLength = getCurveTailLength();
  const vehicleLen = getBodyLength();
  
  // Safety Margin: Tail Length + (VehicleLength * 2)
  const dangerZoneLen = tailLength + (vehicleLen * 2);

  const edgeLen = edge.distance;
  const dangerStartOffset = edgeLen - dangerZoneLen;

  const count = queue[0];

  for (let i = 0; i < count; i++) {
    const vehId = queue[1 + i];
    const ptr = vehId * VEHICLE_DATA_SIZE;
    
    // Calculate Position on Edge
    const ratio = data[ptr + MovementData.EDGE_RATIO];
    const currentOffset = ratio * edgeLen;

    // optimization: Only check vehicles in Danger Zone
    if (currentOffset < dangerStartOffset) continue;

    // Check against ALL competitor edges
    let mostCriticalHitZone: number = HitZone.NONE;

    for (const compEdgeIdx of edge.prevEdgeIndices!) {
      if (compEdgeIdx === edgeIdx) continue; // Skip self

      const compQueue = edgeVehicleQueue.getData(compEdgeIdx);
      if (!compQueue || compQueue[0] === 0) continue;

      // Check against relevant vehicles on competitor edge.
      // User Req: Curve edges are short, so check ALL vehicles (no limit).
      mostCriticalHitZone = checkCompetitorVehicles(vehId, compQueue, mostCriticalHitZone);
    }

    // Apply Logic if collision detected
    if (mostCriticalHitZone !== HitZone.NONE) {
       applyCollisionZoneLogic(mostCriticalHitZone, data, ptr);
    }
  }
}

/**
 * Helper to check collision against all vehicles on a competitor edge.
 * Returns the updated max HitZone.
 */
function checkCompetitorVehicles(
  myVehId: number,
  compQueue: Int32Array,
  currentMaxHitZone: number
): number {
  const compCount = compQueue[0];
  let maxHitZone = currentMaxHitZone;

  for (let j = 0; j < compCount; j++) {
    const compVehId = compQueue[1 + j];
    
    const hitZone = checkSensorCollision(myVehId, compVehId);
    
    if (hitZone > maxHitZone) {
      maxHitZone = hitZone;
    }

    // Optimization: STOP is the max value, no need to check further if found
    if (maxHitZone === HitZone.STOP) break;
  }

  return maxHitZone;
}
