import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { vehicleSharedMovement } from "@/store/vehicle/sharedMode/vehicleMovement";
import { useEdgeStore } from "@/store/map/edgeStore";
import { useVehicleTestStore } from "@/store/vehicle/vehicleTestStore";

/**
 * VehicleSharedMemoryMode
 * - Uses SharedArrayBuffer (can be used with Web Workers)
 * - Direct shared memory access
 * - Only handles path calculation and position updates
 * - Rendering is done by VehiclesRenderer
 */

interface VehicleSharedMemoryModeProps {
  numVehicles?: number;
}

const VehicleSharedMemoryMode: React.FC<VehicleSharedMemoryModeProps> = ({
  numVehicles = 100,
}) => {
  const initRef = useRef(false);
  const edges = useEdgeStore((state) => state.edges);

  // Initialize vehicles
  useEffect(() => {
    if (!initRef.current) {
      console.log("[VehicleSharedMemoryMode] Initializing shared memory mode");

      // Initialize test vehicles on edges
      const edgeArray = Array.from(edges.values());
      if (edgeArray.length > 0) {
        const distribution = new Map<number, number[]>();

        console.log(`\n[VehicleSharedMemoryMode] ========== VEHICLE PLACEMENT DETAILS ==========`);
        for (let i = 0; i < numVehicles; i++) {
          const edgeIndex = i % edgeArray.length;
          const edge = edgeArray[edgeIndex];
          const points = edge.renderingPoints || [];

          if (points.length > 0) {
            const vehicle = vehicleSharedMovement.get(i);
            const startPoint = points[0];

            vehicle.movement.x = startPoint.x;
            vehicle.movement.y = startPoint.y;
            vehicle.movement.z = startPoint.z;
            vehicle.movement.velocity = 2 + Math.random() * 3; // 2~5 m/s
            vehicle.movement.rotation = 0;
            vehicle.movement.edgeRatio = 0;
            vehicle.status.currentEdge = edgeIndex;
            vehicle.status.status = 1; // MOVING

            console.log(
              `  VEH${i}: Edge${edgeIndex} (${edge.edge_name}), ` +
              `ratio=000, pos=(${startPoint.x.toFixed(1)}, ${startPoint.y.toFixed(1)})`
            );

            // Track distribution
            if (!distribution.has(edgeIndex)) {
              distribution.set(edgeIndex, []);
            }
            distribution.get(edgeIndex)!.push(i);
          }
        }

        console.log(`\n[VehicleSharedMemoryMode] ========== EDGE-BASED VEHICLE ARRAYS ==========`);

        console.log(`[VehicleSharedMemoryMode] ================================================================\n`);

        console.log(`[VehicleSharedMemoryMode] Initialized ${numVehicles} vehicles`);

        // Store initial vehicle distribution for UI display
        useVehicleTestStore.getState().setInitialVehicleDistribution(distribution);
      }

      initRef.current = true;
    }
  }, [numVehicles, edges]);

  // Update vehicle positions every frame
  useFrame((_state, delta) => {
    // Check if simulation is paused
    const isPaused = useVehicleTestStore.getState().isPaused;
    if (isPaused) return;

    const edgeArray = Array.from(edges.values());
    if (edgeArray.length === 0) return;

    for (let i = 0; i < numVehicles; i++) {
      const vehicle = vehicleSharedMovement.get(i);
      
      const velocity = vehicle.movement.velocity;
      const edgeRatio = vehicle.movement.edgeRatio;
      const currentEdgeIndex = vehicle.status.currentEdge;

      const edge = edgeArray[currentEdgeIndex];
      if (!edge?.renderingPoints || edge.renderingPoints.length === 0) continue;

      const points = edge.renderingPoints;
      const edgeLength = edge.distance || 1;

      // Update edge ratio based on velocity
      let newRatio = edgeRatio + (velocity * delta) / edgeLength;

      // If reached end of edge, move to next edge
      if (newRatio >= 1) {
        newRatio = 0;
        const nextEdgeIndex = (currentEdgeIndex + 1) % edgeArray.length;
        vehicle.status.currentEdge = nextEdgeIndex;
      }

      vehicle.movement.edgeRatio = newRatio;

      // Calculate position on edge using ratio
      const pointIndex = Math.floor(newRatio * (points.length - 1));
      const nextPointIndex = Math.min(pointIndex + 1, points.length - 1);
      const localRatio = (newRatio * (points.length - 1)) - pointIndex;

      const p1 = points[pointIndex];
      const p2 = points[nextPointIndex];

      const x = p1.x + (p2.x - p1.x) * localRatio;
      const y = p1.y + (p2.y - p1.y) * localRatio;
      const z = p1.z + (p2.z - p1.z) * localRatio;

      // Calculate rotation (direction of movement)
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);

      // Update position and rotation
      vehicle.movement.x = x;
      vehicle.movement.y = y;
      vehicle.movement.z = z;
      vehicle.movement.rotation = rotation;
    }
  });

  // This component doesn't render anything - rendering is done by VehiclesRenderer
  return null;
};

export default VehicleSharedMemoryMode;

