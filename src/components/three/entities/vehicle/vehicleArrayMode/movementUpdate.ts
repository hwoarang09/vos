import { VEHICLE_DATA_SIZE, MovementData, SensorData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { MovingStatus } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { VehicleArrayStore } from "@/store/vehicle/arrayMode/vehicleStore";
import { VehicleLoop } from "@/utils/vehicle/loopMaker";
import { Edge } from "@/types/edge";

// Logic modules
import { calculateNextSpeed } from "./movementLogic/speedCalculator";
import { handleEdgeTransition } from "./movementLogic/edgeTransition";
import { interpolatePosition } from "./movementLogic/positionInterpolator";
import { updateSensorPoints } from "./helpers/sensorPoints";
import { logSensorSummary } from "./helpers/sensorDebug";

interface MovementUpdateParams {
  data: Float32Array;
  edgeArray: Edge[];
  actualNumVehicles: number;
  vehicleLoopMap: Map<number, VehicleLoop>;
  edgeNameToIndex: Map<string, number>;
  store: VehicleArrayStore;
  clampedDelta: number;
}

// Debug flag
let frameCount = 0;
const DEBUG_INTERVAL = 300; // Log every 300 frames (~5 seconds at 60fps)

/**
 * Update vehicle movement and positions
 * Optimized for Zero-Allocation: Directly accesses Float32Array without creating temporary objects.
 */
export function updateMovement(params: MovementUpdateParams) {
  const {
    data,
    edgeArray,
    actualNumVehicles,
    vehicleLoopMap,
    edgeNameToIndex,
    store,
    clampedDelta,
  } = params;

  frameCount++;

  for (let i = 0; i < actualNumVehicles; i++) {
    const ptr = i * VEHICLE_DATA_SIZE;

    // 1. Status Check (Direct Read)
    const status = data[ptr + MovementData.MOVING_STATUS];

    // Skip if paused (preserve state - freeze)
    if (status === MovingStatus.PAUSED) {
      continue;
    }

    // Skip if stopped (reset state - hard stop)
    if (status === MovingStatus.STOPPED) {
      data[ptr + MovementData.VELOCITY] = 0;
      continue;
    }

    // Double check: if explicit MOVING state is missing (safety)
    if (status !== MovingStatus.MOVING) {
       data[ptr + MovementData.VELOCITY] = 0;
       continue;
    }

    // 2. Data Read (Direct Access)
    // No object allocation here. Just reading values to stack variables.
    const currentEdgeIndex = data[ptr + MovementData.CURRENT_EDGE];
    const velocity = data[ptr + MovementData.VELOCITY];
    const acceleration = data[ptr + MovementData.ACCELERATION];
    const deceleration = data[ptr + MovementData.DECELERATION];
    const edgeRatio = data[ptr + MovementData.EDGE_RATIO];
    
    // Position fallbacks
    let finalX = data[ptr + MovementData.X];
    let finalY = data[ptr + MovementData.Y];
    let finalZ = data[ptr + MovementData.Z];
    let finalRotation = data[ptr + MovementData.ROTATION];

    // Safety check
    const currentEdge = edgeArray[currentEdgeIndex];
    if (!currentEdge) continue;

    // 3. Calculate Speed
    const newVelocity = calculateNextSpeed(
      velocity,
      acceleration,
      deceleration,
      currentEdge,
      clampedDelta
    );

    // 4. Calculate New Ratio
    const rawNewRatio = edgeRatio + (newVelocity * clampedDelta) / currentEdge.distance;

    // 5. Handle Edge Transition
    // Note: handleEdgeTransition still returns a temporary object. 
    // This is the next optimization target if GC is still high.
    const { finalEdgeIndex, finalRatio, activeEdge } = handleEdgeTransition(
      i,
      currentEdgeIndex,
      rawNewRatio,
      edgeArray,
      vehicleLoopMap,
      edgeNameToIndex,
      store
    );

    // 6. Interpolate Position
    if (activeEdge) {
      const posResult = interpolatePosition(activeEdge, finalRatio);
      finalX = posResult.x;
      finalY = posResult.y;
      finalZ = posResult.z;
      finalRotation = posResult.rotation;
    }

    // 7. Write Back (Direct Write)
    data[ptr + MovementData.VELOCITY] = newVelocity;
    data[ptr + MovementData.EDGE_RATIO] = finalRatio;
    data[ptr + MovementData.CURRENT_EDGE] = finalEdgeIndex;

    data[ptr + MovementData.X] = finalX;
    data[ptr + MovementData.Y] = finalY;
    data[ptr + MovementData.Z] = finalZ;
    data[ptr + MovementData.ROTATION] = finalRotation;

    // 8. Update Sensor Points (Zero-GC)
    const presetIdx = data[ptr + SensorData.PRESET_IDX] | 0; // float -> int
    updateSensorPoints(i, finalX, finalY, finalRotation, presetIdx);
  }

  // Debug log every N frames
  if (frameCount % DEBUG_INTERVAL === 0) {
    logSensorSummary(actualNumVehicles);
  }
}
