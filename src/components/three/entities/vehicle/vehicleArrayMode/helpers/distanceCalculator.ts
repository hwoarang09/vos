import { Edge } from "@/types/edge";

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
  if (edge1IsLinear && edge2IsLinear) {
    // LINEAR -> LINEAR: use x-axis only (assuming horizontal)
    return Math.abs(x2 - x1);
  } else {
    // LINEAR ↔ CURVE or CURVE ↔ CURVE: use Euclidean distance
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Calculate effective resume distance based on edge types and y-axis difference
 */
export function calculateEffectiveResumeDistance(
  yLead: number,
  yTarget: number,
  currentIsLinear: boolean,
  targetIsLinear: boolean,
  baseResumeDistance: number
): number {
  if (currentIsLinear && targetIsLinear) {
    return baseResumeDistance; // 1.80m
  } else {
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
}

/**
 * Calculate effective safe/resume distances for same-edge collision
 */
export function calculateSameEdgeDistances(
  isLinearEdge: boolean,
  dy: number,
  baseSafeDistance: number,
  baseResumeDistance: number
): {
  effectiveSafeDistance: number;
  effectiveResumeDistance: number;
} {
  if (isLinearEdge) {
    return {
      effectiveSafeDistance: baseSafeDistance,
      effectiveResumeDistance: baseResumeDistance,
    };
  } else {
    // Curve edge - adjust based on y-axis difference
    if (dy < 0.7) {
      return {
        effectiveSafeDistance: baseSafeDistance * 0.9, // 10% shorter
        effectiveResumeDistance: baseResumeDistance * 0.9,
      };
    } else {
      return {
        effectiveSafeDistance: baseSafeDistance * 0.1, // 90% shorter for large y-diff
        effectiveResumeDistance: baseResumeDistance * 0.1,
      };
    }
  }
}

