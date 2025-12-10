import { Edge } from "@/types/edge";
import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { MovementData, VEHICLE_DATA_SIZE, HitZone } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { checkSensorCollision } from "@/components/three/entities/vehicle/vehicleArrayMode/helpers/sensorCollision";
import { applyCollisionZoneLogic } from "./collisionCommon";
import { getBodyLength } from "@/config/vehicleConfig";

/**
 * Returns a fixed curve tail length (assumption: 0.5m).
 * This represents the distance between Node[-2] and ToNode on the merging curve.
 */
function getCurveTailLength(): number {
  return 0.5;
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

/**
 * Checks for side/merge collisions in the Danger Zone.
 * Iterates ALL vehicles on the edge (not just lead) because a long edge
 * might have multiple vehicles in the merge zone.
 */
/**
 * Check a single vehicle against all collision candidates in the merge zone.
 */
function checkAgainstCompetitors(
  vehId: number, 
  edgeIdx: number, 
  edge: Edge, 
  data: Float32Array, 
  ptr: number
) {
  if (!edge.prevEdgeIndices) return;

  let mostCriticalHitZone: number = HitZone.NONE;

  for (const compEdgeIdx of edge.prevEdgeIndices) {
    if (compEdgeIdx === edgeIdx) continue; // Skip self

    const compQueue = edgeVehicleQueue.getData(compEdgeIdx);
    if (!compQueue || compQueue[0] === 0) continue;

    // Check against relevant vehicles on competitor edge.
    mostCriticalHitZone = checkCompetitorVehicles(vehId, compQueue, mostCriticalHitZone);
  }

  // Apply Logic if collision detected
  if (mostCriticalHitZone !== HitZone.NONE) {
      applyCollisionZoneLogic(mostCriticalHitZone, data, ptr);
  }
}

/**
 * Checks for side/merge collisions in the Danger Zone.
 * Iterates ALL vehicles on the edge (not just lead) because a long edge
 * might have multiple vehicles in the merge zone.
 */
export function verifyMergeZoneCollision(
  edgeIdx: number, 
  edge: Edge, 
  data: Float32Array, 
  queue: Int32Array
) {
  // 1. Calculate Danger Zone Length
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
    
    // Calculate Position on Edge (Generic: support both Curve and Straight)
    let currentOffset = 0;
    
    if (edge.curveType) {
       // Curve: Use OFFSET directly
       currentOffset = data[ptr + MovementData.OFFSET];
    } else {
       // Straight: Calculate offset from EDGE_RATIO
       const ratio = data[ptr + MovementData.EDGE_RATIO];
       currentOffset = ratio * edgeLen;
    }

    // optimization: Only check vehicles in Danger Zone
    if (currentOffset < dangerStartOffset) continue;

    checkAgainstCompetitors(vehId, edgeIdx, edge, data, ptr);
  }
}
