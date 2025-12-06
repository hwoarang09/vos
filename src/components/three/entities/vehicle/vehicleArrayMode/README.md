# Vehicle Array Mode - Collision Detection System

High-performance collision detection system for vehicle simulation using Float32Array and zero-allocation architecture.

## 📁 File Structure

```
vehicleArrayMode/
├── collisionCheck.ts              # Main collision orchestrator
├── collisionLogic/                # Collision detection algorithms
│   ├── checkLeadVehicle.ts       # Lead vehicle collision (next edge + merge)
│   ├── checkFollowingVehicle.ts  # Following vehicle collision (same edge)
│   └── mergeConflictChecker.ts   # Merge point conflict resolution
├── helpers/                       # Utility functions
│   ├── distanceCalculator.ts     # Distance calculation (LINEAR/CURVE)
│   ├── edgeTargetFinder.ts       # Next edge identification
│   └── statusApplier.ts          # Vehicle status management
├── movementLogic/                 # Movement calculation
│   ├── speedCalculator.ts        # Speed calculation
│   ├── edgeTransition.ts         # Edge transition handling
│   └── positionInterpolator.ts   # Position interpolation
├── initializeVehicles.ts          # Vehicle initialization
├── movementUpdate.ts              # Movement update orchestrator
└── vehicleArrayMode.tsx           # Main component
```

## 🎯 Collision Detection Features

### 1. **Lead Vehicle Collision** (`checkLeadVehicle.ts`)
- **Next Edge Collision**: Checks distance to last vehicle on target edge
- **Merge Conflict Detection**: Handles multi-input merge points
- **Topology Optimization**: Fast path for single-path edges, slow path for diverge nodes
- **Priority Rules**: Distance-based priority + Edge Index tie-breaker

### 2. **Following Vehicle Collision** (`checkFollowingVehicle.ts`)
- **Same Edge Collision**: Checks distance to front vehicle
- **Adaptive Safe Distance**: Different thresholds for LINEAR vs CURVE edges
- **Y-axis Compensation**: Adjusts distance calculation for curved paths

### 3. **Merge Conflict Resolution** (`mergeConflictChecker.ts`)
- **Distance-based Priority**: Closer vehicle proceeds first
- **Tie-breaker Rule**: Lower Edge Index yields (prevents deadlock)
- **Threshold-based**: Only checks within 3m of merge point

## 🔧 Helper Functions

### Distance Calculator (`distanceCalculator.ts`)
```typescript
// Calculate distance between vehicles
calculateVehicleDistance(x1, y1, x2, y2, edge1IsLinear, edge2IsLinear)

// Calculate effective resume distance
calculateEffectiveResumeDistance(yLead, yTarget, currentIsLinear, targetIsLinear, baseResumeDistance)

// Calculate same-edge distances
calculateSameEdgeDistances(isLinearEdge, dy, baseSafeDistance, baseResumeDistance)
```

**Logic:**
- **LINEAR → LINEAR**: Use x-axis distance only (horizontal)
- **LINEAR ↔ CURVE**: Use Euclidean distance
- **CURVE → CURVE**: Use Euclidean distance
- **Y-axis Compensation**: Adjust safe distance based on y-difference

### Edge Target Finder (`edgeTargetFinder.ts`)
```typescript
// Find next edge for lead vehicle
findTargetEdgeIndex(currentEdge, leadVehId, vehicleLoopMap, edgeNameToIndex)
```

**Logic:**
- **Fast Path**: Single-path edges (no lookup)
- **Slow Path**: Diverge nodes (loop map lookup)
- **Fallback**: Pick first available path if loop fails

### Status Applier (`statusApplier.ts`)
```typescript
// Apply vehicle status change
applyVehicleStatus(data, vehiclePtr, canProceed)
```

**Returns:** `{ collisions: number, resumes: number }`

## 📊 Performance Optimizations

1. **Zero-Allocation Architecture**
   - Direct Float32Array access
   - No temporary object creation
   - Cache-friendly memory layout

2. **Edge-based Sorting**
   - Vehicles sorted by EdgeRatio (DESC)
   - O(edges) complexity instead of O(n²)
   - Only check relevant vehicles

3. **Topology Optimization**
   - Fast path for single-path edges
   - Slow path only for diverge nodes
   - Reduces map lookups by ~80%

4. **Threshold-based Checks**
   - Merge conflict: Only within 3m
   - Resume distance: Adaptive based on edge type
   - Reduces unnecessary calculations

## 🚀 Usage Example

```typescript
import { checkCollisions } from './collisionCheck';

// In useFrame loop
checkCollisions({
  data: vehicleDataArray,
  edgeArray: edges,
  actualNumVehicles: 100,
  vehicleLoopMap: loopMap,
  edgeNameToIndex: edgeIndexMap,
  sameEdgeSafeDistance: 2.0,  // meters
  resumeDistance: 1.8,         // meters
});
```

## 🔍 Collision Types

### Type 1: Rear-End Collision (Next Edge)
```
Current Edge          Target Edge
  [Lead] ------>  |  [Last Vehicle]
                  ^
                  Collision Check
```

### Type 2: Same Edge Collision
```
Same Edge
  [Front] ---> [Back]
               ^
               Collision Check
```

### Type 3: Merge Conflict (Side Collision)
```
Edge A: [VehA] ----\
                    \
                     --> Merge Point
                    /
Edge B: [VehB] ----/
        ^
        Priority Check
```

## 📝 Configuration

### Safe Distances
- **LINEAR Edge**: 2.0m (same edge), 1.8m (resume)
- **CURVE Edge**: 
  - dy < 0.7m: 90% of base distance
  - dy >= 0.7m: 10% of base distance (sensors angled)

### Merge Conflict
- **Threshold**: 3.0m from merge point
- **Priority**: Distance-based (closer vehicle first)
- **Tie-breaker**: Edge Index (lower yields)

## 🎓 Key Concepts

1. **EdgeRatio**: Position on edge (0.0 = start, 1.0 = end)
2. **Lead Vehicle**: Highest EdgeRatio on edge (closest to end)
3. **Following Vehicle**: Lower EdgeRatio (behind lead)
4. **Merge Point**: Node where multiple edges converge
5. **Diverge Node**: Node where edge splits into multiple paths

