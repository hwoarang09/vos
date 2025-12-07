// initializeVehicles.ts
// Vehicle initialization logic separated from main component
// Only handles data initialization, no rendering

import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { getLinearAcceleration, getLinearDeceleration, getCurveMaxSpeed } from "@/config/movementConfig";
import { calculateVehiclePlacementsOnLoops } from "@/utils/vehicle/vehiclePlacement";
import { findEdgeLoops, VehicleLoop } from "@/utils/vehicle/loopMaker";
import { vehicleDataArray, SensorData, VEHICLE_DATA_SIZE, MovementData, MovingStatus } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { PresetIndex } from "@/store/vehicle/arrayMode/sensorPresets";
import { updateSensorPoints } from "./helpers/sensorPoints";
import { useVehicleGeneralStore } from "@/store/vehicle/vehicleGeneralStore";

export interface InitializationResult {
  vehicleLoops: VehicleLoop[];
  vehicleLoopMap: Map<number, VehicleLoop>;
  edgeNameToIndex: Map<string, number>;
  edgeArray: any[];
  actualNumVehicles: number;
}

export interface InitializeVehiclesParams {
  edges: any[]; // Edge array from useEdgeStore
  numVehicles: number;
  store: any;
}

/**
 * Initialize all vehicles with placement and data (no rendering)
 */
export function initializeVehicles(params: InitializeVehiclesParams): InitializationResult {
  const { edges, numVehicles, store } = params;

  console.log(`[VehicleArrayMode] Initializing...`);

  // 1. Initialize memory
  store.initArrayMemory();

  // Get direct data access
  const directData = vehicleDataArray.getData();

  // 2. Build edge array and name-to-index map
  const edgeArray = edges; // Already an array
  const nameToIndex = new Map<string, number>();
  edgeArray.forEach((edge, idx) => nameToIndex.set(edge.edge_name, idx));

  // 3. Calculate vehicle placements on loops
  const edgeLoops = findEdgeLoops(edgeArray);
  const result = calculateVehiclePlacementsOnLoops(edgeLoops, numVehicles, edgeArray);

  // 4. Build vehicle loop map
  const loopMap = new Map<number, VehicleLoop>();
  result.vehicleLoops.forEach(loop => loopMap.set(loop.vehicleIndex, loop));

  // 5. Set vehicle data
  const edgeVehicleCount = new Map<number, number>();

  for (let i = 0; i < result.placements.length; i++) {
    const placement = result.placements[i];
    const edgeIndex = nameToIndex.get(placement.edgeName);

    if (edgeIndex !== undefined) {
      const edge = edgeArray[edgeIndex];
      const isCurve = edge.vos_rail_type !== "LINEAR";
      const initialVelocity = isCurve ? getCurveMaxSpeed() : 0;

      store.addVehicle(placement.vehicleIndex, {
        x: placement.x,
        y: placement.y,
        z: placement.z,
        edgeIndex: edgeIndex,
        edgeRatio: placement.edgeRatio,
        rotation: placement.rotation,
        velocity: initialVelocity,
        acceleration: getLinearAcceleration(),
        deceleration: getLinearDeceleration(),
        movingStatus: MovingStatus.MOVING,
      });

      // Initialize sensor preset based on edge type
      const vehData = vehicleDataArray.getData();
      const ptr = placement.vehicleIndex * VEHICLE_DATA_SIZE;
      vehData[ptr + SensorData.PRESET_IDX] = PresetIndex.STRAIGHT; // Default to straight
      vehData[ptr + SensorData.HIT_ZONE] = -1; // No contact

      // Initialize sensor points with current position and rotation
      updateSensorPoints(
        placement.vehicleIndex,
        placement.x,
        placement.y,
        placement.rotation,
        PresetIndex.STRAIGHT
      );

      // Count vehicles per edge
      edgeVehicleCount.set(edgeIndex, (edgeVehicleCount.get(edgeIndex) || 0) + 1);

      // Add to VehicleGeneralStore (for UI/Metadata)
      // ID Format must match VehicleTextRenderer: VEH00001, VEH00002...
      // ID Format must match VehicleTextRenderer: VEH00001, VEH00002...
      const idNumber = placement.vehicleIndex;
      const formattedId = `VEH${String(idNumber).padStart(5, '0')}`;

      useVehicleGeneralStore.getState().addVehicle(placement.vehicleIndex, {
        id: formattedId,
        name: `Vehicle ${placement.vehicleIndex}`,
        color: "#ffffff",
        battery: 100,
        vehicleType: 0,
        taskType: 0,
      });
    }
  }

  // // 6. Log vehicle distribution
  // console.log(`[VehicleArrayMode] Initialized ${result.placements.length} vehicles`);
  // console.log(
  //   `[VehicleArrayMode] Vehicles per edge:`,
  //   Array.from(edgeVehicleCount.entries())
  //     .map(([idx, count]) => `Edge${idx}:${count}`)
  //     .join(", ")
  // );

  // 6.5. Log detailed vehicle placement BEFORE sorting
  // console.log(`\n[VehicleArrayMode] ========== VEHICLE PLACEMENT DETAILS (BEFORE SORT) ==========`);
  for (let i = 0; i < result.placements.length; i++) {
    const placement = result.placements[i];
    const edgeIndex = nameToIndex.get(placement.edgeName);
    if (edgeIndex !== undefined) {
      const ptr = i * VEHICLE_DATA_SIZE;
      const ratio = directData[ptr + MovementData.EDGE_RATIO]; // edgeRatio offset
      // console.log(
      //   `  VEH${i}: Edge${edgeIndex} (${placement.edgeName}), ` +
      //   `ratio=${ratio.toFixed(3)}, pos=(${placement.x.toFixed(1)}, ${placement.y.toFixed(1)})`
      // );
    }
  }
  // console.log(`[VehicleArrayMode] ================================================================\n`);

  // 7. Sort vehicles in each edge by edgeRatio (front to back)
  // console.log(`[VehicleArrayMode] Sorting vehicles by edgeRatio...`);
  edgeVehicleCount.forEach((_, edgeIdx) => {
    edgeVehicleQueue.sortByEdgeRatio(edgeIdx, directData);
  });
  // console.log(`[VehicleArrayMode] Sorting complete`);

  // 8. Verify edgeVehicleQueue
  let totalInByEdge = 0;
  edgeVehicleCount.forEach((count, edgeIdx) => {
    const actualCount = edgeVehicleQueue.getCount(edgeIdx);
    totalInByEdge += actualCount;
    if (actualCount !== count) {
      console.error(`[VehicleArrayMode] Edge ${edgeIdx} mismatch! Expected: ${count}, Got: ${actualCount}`);
    }
  });
  // console.log(`[VehicleArrayMode] Total vehicles in edgeVehicleQueue: ${totalInByEdge}`);

  // 8.5. Log detailed edge-based vehicle arrays AFTER sorting
  // console.log(`\n[VehicleArrayMode] ========== EDGE-BASED VEHICLE ARRAYS (AFTER SORT) ==========`);
  // console.log(`[VehicleArrayMode] NOTE: [0] = FRONT (highest ratio), [n] = BACK (lowest ratio)`);
  edgeVehicleCount.forEach((_, edgeIdx) => {
    const vehicles = edgeVehicleQueue.getVehicles(edgeIdx);
    const edgeName = edgeArray[edgeIdx]?.edge_name || `Edge${edgeIdx}`;

    // console.log(`\n  Edge${edgeIdx} (${edgeName}): ${vehicles.length} vehicles`);
    vehicles.forEach((vehIdx, arrayPos) => {
      const ptr = vehIdx * VEHICLE_DATA_SIZE;
      const ratio = directData[ptr + MovementData.EDGE_RATIO]; // edgeRatio offset
      const x = directData[ptr + MovementData.X];
      const y = directData[ptr + MovementData.Y];
      // console.log(
      //   `    [${arrayPos}] VEH${vehIdx}: ratio=${ratio.toFixed(3)}, pos=(${x.toFixed(1)}, ${y.toFixed(1)})`
      // );
    });
  });
  // console.log(`[VehicleArrayMode] ================================================================\n`);

  return {
    vehicleLoops: result.vehicleLoops,
    vehicleLoopMap: loopMap,
    edgeNameToIndex: nameToIndex,
    edgeArray: edgeArray,
    actualNumVehicles: result.placements.length,
  };
}
