/**
 * Calculate distance between two vehicles
 * Handles both LINEAR and CURVE edge types
 */
export function calculateVehicleDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  edge1IsLinear: boolean,
  edge2IsLinear: boolean
): number {

    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.hypot(dx, dy);
}

/**
 * Calculate resume distance for linear-to-linear transitions (or linear sections)
 */
export function calculateLinearResumeDistance(
  baseResumeDistance: number
): number {
  return baseResumeDistance; // 1.80m
}

/**
 * Calculate resume distance for transitions involving curves
 * Checks y-axis difference to determine if vehicles are in the same lane
 */
export function calculateCurveResumeDistance(
  yLead: number,
  yTarget: number,
  baseResumeDistance: number
): number {
  // LINEAR ↔ CURVE transition
  const yDiff = Math.abs(yTarget - yLead);

  if (yDiff < 0.1) {
    // y difference < 0.1m (almost same lane) → use standard resumeDistance
    return baseResumeDistance; // 1.80m
  } else {
    // y difference >= 0.1m (different lane, curve section) → require 0.1m+ distance
    return 0.1;
  }
}
