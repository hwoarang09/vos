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

  const maxSpeed = isCurve ? curveMax : linearMax;

  // deceleration is expected to be <= 0 when braking
  const totalAccel = acceleration + deceleration;
  let nextVelocity = currentVelocity + totalAccel * delta;

  // Clamp to physical limits
  if (nextVelocity > maxSpeed) nextVelocity = maxSpeed;
  if (nextVelocity < 0) nextVelocity = 0;

  return nextVelocity;
}
