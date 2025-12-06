# Requirement: Vehicle Data Expansion

## 1. Goal
Expand the current `vehicleDataArray` (formerly `vehicleArrayState`) to support advanced business logic and physics.

## 2. Required State Definitions

### A. TrafficState (Road Occupation)
> **Type:** `Uint8` (Enum)
> **Description:** Controls permission to enter intersections or merge points.

```typescript
export const TrafficState = {
  FREE: 0,      // Normal driving
  WAITING: 1,   // Waiting for lock (Must Stop)
  ACQUIRED: 2,  // Lock acquired (Can Enter)
} as const;
```

### B. StopReason (Stop Conditions)
> **Type:** `Uint32` (Bitmask)
> **Description:** Tracks why the vehicle is stopped. Supports multiple simultaneous reasons.
> **Rule:** Vehicle can move only if `StopReason === 0`.

```typescript
export const StopReason = {
  NONE: 0,
  OBS_LIDAR: 1 << 0,         // Lidar obstacle
  OBS_CAMERA: 1 << 1,        // Camera obstacle
  E_STOP: 1 << 2,            // Emergency Stop Button
  WAITING_FOR_LOCK: 1 << 3,  // Waiting for Traffic Lock
  DESTINATION_REACHED: 1 << 4,
  PATH_BLOCKED: 1 << 5,      // Blocked by vehicle ahead
  LOAD_ON: 1 << 6,           // Loading action in progress
  LOAD_OFF: 1 << 7,          // Unloading action in progress
  NOT_INITIALIZED: 1 << 8,   // System safety start
} as const;
```

### C. JobState (Mission Status)
> **Type:** `Uint8` (Enum)
> **Description:** Current high-level mission step.

```typescript
export const JobState = {
  INITIALIZING: 0,
  IDLE: 1,
  MOVE_TO_LOAD: 2,
  LOADING: 3,
  MOVE_TO_UNLOAD: 4,
  UNLOADING: 5,
  ERROR: 6,
} as const;
```

### D. MovingState (Physical Motor State)
> **Type:** `Uint8` (Enum)
> **Description:** Feedback on whether motors are actually turning.

```typescript
export const MovingState = {
  STOPPED: 0,
  MOVING: 1,
} as const;
```

### E. Physics Expansion
> **Field:** `DCC` (Deceleration)
> **Type:** `Float32`
> **Description:** Separate Deceleration limit (different from Acceleration).
> **Usage:** Used for braking curves and emergency stops.

## 3. Implementation Target
These states must be integrated into `src/store/vehicle/arrayMode/vehicleDataArray.ts`.
See `src/store/vehicle/arrayMode/VEHICLE_DATA_STRUCTURE.md` for the memory layout plan.