import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useVehicleRapierStore } from "../../../../../store/vehicle/rapierMode/vehicleStore";
import { useVehicleTestStore } from "../../../../../store/vehicle/vehicleTestStore";
import { useEdgeStore } from "../../../../../store/map/edgeStore";
import { getLinearMaxSpeed, getLinearAcceleration, getCurveMaxSpeed } from "../../../../../config/movementConfig";
import { calculateVehiclePlacementsOnLoops } from "../../../../../utils/vehicle/vehiclePlacement";
import { findEdgeLoops, getNextEdgeInLoop, VehicleLoop } from "../../../../../utils/vehicle/loopMaker";
import VehicleRapierModeVehicle from "./VehicleRapierModeVehicle";

interface VehicleRapierModeProps {
  numVehicles?: number;
  mode?: "rapier" | "array_single" | "array_shared";
}

const VehicleRapierMode: React.FC<VehicleRapierModeProps> = ({
  numVehicles = 100,
  mode = "rapier",
}) => {
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const actualNumVehicles = useVehicleRapierStore((state) => state.actualNumVehicles);
  const edges = useEdgeStore((state) => state.edges);
  const loopsRef = useRef<VehicleLoop[]>([]);
  const edgeNameToIndexRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!initRef.current) {
      console.log(`[VehicleRapierMode] Initializing ${mode} mode with Rapier physics`);

      const store = useVehicleRapierStore.getState();

      if (mode === "array_single") {
        store.initArraySingleMode(numVehicles);
      } else if (mode === "array_shared") {
        store.initArraySharedMode(numVehicles);
      } else {
        store.initRapierMode();
      }

      const edgeArray = Array.from(edges.values());

      const nameToIndex = new Map<string, number>();
      edgeArray.forEach((edge, idx) => {
        nameToIndex.set(edge.edge_name, idx);
      });
      edgeNameToIndexRef.current = nameToIndex;

      const edgeLoops = findEdgeLoops(edgeArray);
      console.log(`[VehicleRapierMode] Found ${edgeLoops.length} loops`);

      const result = calculateVehiclePlacementsOnLoops(
        edgeLoops,
        numVehicles,
        edgeArray
      );

      console.log(`[VehicleRapierMode] ✅ Placement calculation completed!`);
      console.log(`[VehicleRapierMode]    - Requested vehicles: ${numVehicles}`);
      console.log(`[VehicleRapierMode]    - Calculated placements: ${result.placements.length}`);
      console.log(`[VehicleRapierMode]    - Max capacity: ${result.maxCapacity}`);
      console.log(`[VehicleRapierMode]    - Vehicle loops: ${result.vehicleLoops.length}`);

      loopsRef.current = result.vehicleLoops;

      if (mode === "rapier") {
        // Rapier mode: batch initialization with SINGLE re-render per batch
        const BATCH_SIZE = 100;
        const totalPlacements = result.placements.length;

        const processBatch = (startIndex: number) => {
          const endIndex = Math.min(startIndex + BATCH_SIZE, totalPlacements);
          const batchNumber = Math.floor(startIndex / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(totalPlacements / BATCH_SIZE);

          console.log(`[VehicleRapierMode] 🚗 Creating batch ${batchNumber}/${totalBatches} (vehicles ${startIndex}-${endIndex - 1})`);

          // Collect all vehicles in this batch
          const vehicleBatch = [];
          for (let i = startIndex; i < endIndex; i++) {
            const placement = result.placements[i];
            const edgeIndex = nameToIndex.get(placement.edgeName);

            if (edgeIndex !== undefined) {
              vehicleBatch.push({
                index: placement.vehicleIndex,
                x: placement.x,
                y: placement.y,
                z: placement.z,
                velocity: 0,
                edgeIndex: edgeIndex,
                edgeRatio: placement.edgeRatio,
                status: 1,
              });
            }
          }

          // Single store update = single re-render
          store.batchAddVehicles(vehicleBatch);

          if (endIndex < totalPlacements) {
            setTimeout(() => processBatch(endIndex), 0);
          } else {
            console.log(`[VehicleRapierMode] ✅ All ${totalPlacements} vehicles initialized!`);

            // Log detailed vehicle placement
            console.log(`\n[VehicleRapierMode] ========== VEHICLE PLACEMENT DETAILS ==========`);
            result.placements.forEach((placement) => {
              const edgeIndex = nameToIndex.get(placement.edgeName);
              if (edgeIndex !== undefined) {
                console.log(
                  `  VEH${placement.vehicleIndex}: Edge${edgeIndex} (${placement.edgeName}), ` +
                  `ratio=${placement.edgeRatio.toFixed(3)}, pos=(${placement.x.toFixed(1)}, ${placement.y.toFixed(1)})`
                );
              }
            });

            // Store initial vehicle distribution for UI display and log edge-based arrays
            const distribution = new Map<number, number[]>();
            result.placements.forEach((placement) => {
              const edgeIndex = nameToIndex.get(placement.edgeName);
              if (edgeIndex !== undefined) {
                if (!distribution.has(edgeIndex)) {
                  distribution.set(edgeIndex, []);
                }
                distribution.get(edgeIndex)!.push(placement.vehicleIndex);
              }
            });

            console.log(`\n[VehicleRapierMode] ========== EDGE-BASED VEHICLE ARRAYS ==========`);
            Array.from(distribution.entries())
              .sort((a, b) => a[0] - b[0])
              .forEach(([edgeIdx, vehicles]) => {
                const edgeName = edgeArray[edgeIdx]?.edge_name || `Edge${edgeIdx}`;
                console.log(`\n  Edge${edgeIdx} (${edgeName}): ${vehicles.length} vehicles`);
                console.log(`    Vehicles: [${vehicles.join(", ")}]`);
              });
            console.log(`[VehicleRapierMode] ================================================================\n`);

            useVehicleTestStore.getState().setInitialVehicleDistribution(distribution);

            // Set initialized AFTER all batches are complete
            store.setActualNumVehicles(result.placements.length);
            store.setMaxPlaceableVehicles(result.maxCapacity);
            initRef.current = true;
            setInitialized(true);
            console.log(`[VehicleRapierMode] setInitialized(true) called`);
          }
        };

        processBatch(0);
      } else {
        // Array mode: direct initialization
        for (let i = 0; i < result.placements.length; i++) {
          const placement = result.placements[i];
          const edgeIndex = nameToIndex.get(placement.edgeName);

          if (edgeIndex !== undefined) {
            store.setVehiclePosition(
              placement.vehicleIndex,
              placement.x,
              placement.y,
              placement.z
            );
            store.setVehicleVelocity(placement.vehicleIndex, 0);
            store.setCurrentEdge(placement.vehicleIndex, edgeIndex);
            store.setEdgeRatio(placement.vehicleIndex, placement.edgeRatio);
            store.setVehicleStatus(placement.vehicleIndex, 1);
          }
        }
        console.log(`[VehicleRapierMode] ✅ All ${result.placements.length} vehicles initialized!`);

        // Set initialized AFTER all vehicles are added
        store.setActualNumVehicles(result.placements.length);
        store.setMaxPlaceableVehicles(result.maxCapacity);
        initRef.current = true;
        setInitialized(true);
        console.log(`[VehicleRapierMode] setInitialized(true) called`);
      }
    }
  }, [numVehicles, edges, mode]);

  useFrame((_state, delta) => {
    const MAX_DELTA = 1 / 30;
    const clampedDelta = Math.min(delta, MAX_DELTA);

    // Check if simulation is paused
    const isPaused = useVehicleTestStore.getState().isPaused;
    if (isPaused) return;

    if (!initialized) return;

    const store = useVehicleRapierStore.getState();
    const edgeArray = Array.from(edges.values());
    if (edgeArray.length === 0 || actualNumVehicles === 0) return;

    for (let i = 0; i < actualNumVehicles; i++) {
      const status = store.getVehicleStatus(i);
      const velocity = store.getVehicleVelocity(i);
      const edgeRatioNullable = store.getEdgeRatio(i);
      const currentEdgeIndexNullable = store.getCurrentEdge(i);

      // For rapier mode, check rigidBody; for array mode, skip rigidBody check
      if (mode === "rapier") {
        const rigidBody = store.getRigidBody(i);
        if (!rigidBody || velocity === null || edgeRatioNullable === null || currentEdgeIndexNullable === null) continue;
      } else {
        if (velocity === null || edgeRatioNullable === null || currentEdgeIndexNullable === null) continue;
      }

      let edgeRatio = edgeRatioNullable;
      let currentEdgeIndex = currentEdgeIndexNullable;

      if (status === 0) {
        store.setVehicleVelocity(i, 0);
        if (mode === "rapier") {
          const rigidBody = store.getRigidBody(i);
          if (rigidBody) {
            rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
          }
        }
        continue;
      }

      let edge = edgeArray[currentEdgeIndex];
      if (!edge || !edge.renderingPoints || edge.renderingPoints.length === 0) continue;

      const isCurve = edge.vos_rail_type !== "LINEAR";
      const linearMaxSpeed = getLinearMaxSpeed();
      const linearAccel = getLinearAcceleration();
      const curveMaxSpeed = getCurveMaxSpeed();

      let currentSpeed = velocity;
      let acceleration = 0;

      if (isCurve) {
        currentSpeed = curveMaxSpeed;
        acceleration = 0;
      } else {
        const targetSpeed = linearMaxSpeed;
        acceleration = linearAccel;
        currentSpeed = Math.min(targetSpeed, velocity + acceleration * clampedDelta);
      }

      store.setVehicleVelocity(i, currentSpeed);

      let newRatio = edgeRatio + (currentSpeed * clampedDelta) / edge.distance;

      while (newRatio >= 1.0) {
        const overflow = (newRatio - 1.0) * edge.distance;

        const vehicleLoop = loopsRef.current.find(vl => vl.vehicleIndex === i);
        if (!vehicleLoop) {
          console.warn(`[Vehicle ${i}] No loop found, stopping`);
          break;
        }

        const currentEdgeName = edge.edge_name;
        const nextEdgeName = getNextEdgeInLoop(currentEdgeName, vehicleLoop.edgeSequence);
        const nextEdgeIndex = edgeNameToIndexRef.current.get(nextEdgeName);
        if (nextEdgeIndex === undefined) {
          console.warn(`[Vehicle ${i}] Next edge ${nextEdgeName} not found in map`);
          break;
        }

        const nextEdge = edgeArray[nextEdgeIndex];
        if (!nextEdge || !nextEdge.distance) break;

        currentEdgeIndex = nextEdgeIndex;
        edge = nextEdge;
        newRatio = overflow / edge.distance;
      }

      store.setCurrentEdge(i, currentEdgeIndex);
      store.setEdgeRatio(i, newRatio);

      const points = edge.renderingPoints;
      if (!points || points.length === 0) continue;

      const pointIndex = Math.floor(newRatio * (points.length - 1));
      const nextPointIndex = Math.min(pointIndex + 1, points.length - 1);
      const localRatio = (newRatio * (points.length - 1)) - pointIndex;

      const p1 = points[pointIndex];
      const p2 = points[nextPointIndex];

      const x = p1.x + (p2.x - p1.x) * localRatio;
      const y = p1.y + (p2.y - p1.y) * localRatio;
      const z = 3.8; // Fixed vehicle height (all nodes have z=3.8)

      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;

      const dirMagnitude = Math.sqrt(dx * dx + dy * dy);
      if (dirMagnitude < 0.01 && pointIndex + 2 < points.length) {
        const p3 = points[pointIndex + 2];
        dx = p3.x - p1.x;
        dy = p3.y - p1.y;
      }

      const angle = Math.atan2(dy, dx);

      if (mode === "rapier") {
        // Rapier mode: use RigidBody
        const rigidBody = store.getRigidBody(i);
        if (rigidBody) {
          const halfAngle = angle / 2;
          const quat = {
            x: 0,
            y: 0,
            z: Math.sin(halfAngle),
            w: Math.cos(halfAngle)
          };
          rigidBody.setTranslation({ x, y, z }, true);
          rigidBody.setRotation(quat, true);
        }
      } else {
        // Array mode: update store directly
        const rotation = angle * (180 / Math.PI);
        store.setVehiclePosition(i, x, y, z);
        store.setVehicleRotation(i, rotation);
      }
    }
  });

  // Only render VehicleRapierModeVehicle components in rapier mode
  // In array mode, VehiclesRenderer handles rendering
  return (
    <>
      {mode === "rapier" && initialized && Array.from({ length: actualNumVehicles }).map((_, i) => (
        <VehicleRapierModeVehicle
          key={i}
          vehicleIndex={i}
        />
      ))}
    </>
  );
};

export default VehicleRapierMode;