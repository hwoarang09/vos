import { getLinearMaxSpeed, getCurveMaxSpeed } from "@/config/movementConfig";
import { Edge } from "@/types/edge"; // Edge 타입 가정

export function calculateNextSpeed(
  currentVelocity: number, 
  acceleration: number, 
  deceleration: number,
  edge: Edge, 
  delta: number
): number {
  const isCurve = edge.vos_rail_type !== "LINEAR";
  const linearMax = getLinearMaxSpeed();
  const curveMax = getCurveMaxSpeed();

  if (isCurve) {
    // Curve logic: Decelerate to curveMax if needed
    if (currentVelocity > curveMax) {
      return Math.max(curveMax, currentVelocity - deceleration * delta);
    }
    return Math.min(curveMax, currentVelocity + acceleration * delta);
  } else {
    // Linear logic
    return Math.min(linearMax, currentVelocity + acceleration * delta);
  }
}