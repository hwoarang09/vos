// Render order constants for consistent layering
// Higher values render on top

// Background elements
export const RENDER_ORDER_BACKGROUND = -100;
export const RENDER_ORDER_GRID = -50;

export const RENDER_ORDER_DEFAULT = 0;
// Rail elements
export const RENDER_ORDER_RAIL_LINEAR = 1;
export const RENDER_ORDER_RAIL_CURVE_90 = 2;
export const RENDER_ORDER_RAIL_CURVE_180 = 2;
export const RENDER_ORDER_RAIL_CURVE_CSC = 2;

// Node elements
export const RENDER_ORDER_NODE_BASE = 10;
export const RENDER_ORDER_NODE_HIGHLIGHT = 20;

// UI elements (always on top)
export const RENDER_ORDER_TEXT = 999;
export const RENDER_ORDER_LABELS = 1000;
export const RENDER_ORDER_UI_OVERLAY = 1100;
