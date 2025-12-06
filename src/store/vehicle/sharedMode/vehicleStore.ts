import { create } from "zustand";
import { vehicleSharedMovement } from "./vehicleMovement";
import { vehicleSharedByEdge } from "./edgeBasedVehicleList";

interface VehicleSharedStore {
  // Shared memory references
  vehicleDataRef: Float32Array | null;
  edgeVehicleListRef: typeof vehicleSharedByEdge | null;

  // Initialize shared memory (call once on app start)
  initSharedMemory: () => void;

  // Detailed methods
  setVehiclePosition: (
    vehicleIndex: number,
    x: number,
    y: number,
    z: number
  ) => void;
  setVehicleVelocity: (vehicleIndex: number, velocity: number) => void;
  setVehicleRotation: (vehicleIndex: number, rotation: number) => void;
  setVehicleStatus: (vehicleIndex: number, status: number) => void;

  addVehicleToEdgeList: (edgeIndex: number, vehicleIndex: number) => void;
  removeVehicleFromEdgeList: (edgeIndex: number, vehicleIndex: number) => void;

  clearVehicleData: (vehicleIndex: number) => void;

  // Integrated methods
  addVehicle: (
    vehicleIndex: number,
    data: {
      x: number;
      y: number;
      z: number;
      edgeIndex: number;
      rotation?: number;
      velocity?: number;
      acceleration?: number;
      status?: number;
    }
  ) => void;

  removeVehicle: (vehicleIndex: number) => void;

  moveVehicleToEdge: (vehicleIndex: number, newEdgeIndex: number) => void;
}

export const useVehicleSharedStore = create<VehicleSharedStore>(
  (set, get) => ({
    vehicleDataRef: null,
    edgeVehicleListRef: null,

    // Initialize shared memory
    initSharedMemory: () => {
      set({
        vehicleDataRef: vehicleSharedMovement.getData(),
        edgeVehicleListRef: vehicleSharedByEdge,
      });
    },

    // Set vehicle position
    setVehiclePosition: (vehicleIndex, x, y, z) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      vehicle.movement.x = x;
      vehicle.movement.y = y;
      vehicle.movement.z = z;
    },

    // Set vehicle velocity
    setVehicleVelocity: (vehicleIndex, velocity) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      vehicle.movement.velocity = velocity;
    },

    // Set vehicle rotation
    setVehicleRotation: (vehicleIndex, rotation) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      vehicle.movement.rotation = rotation;
    },

    // Set vehicle status
    setVehicleStatus: (vehicleIndex, status) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      vehicle.status.status = status;
    },

    // Add vehicle to edge list
    addVehicleToEdgeList: (edgeIndex, vehicleIndex) => {
      vehicleSharedByEdge.addVehicle(edgeIndex, vehicleIndex);
    },

    // Remove vehicle from edge list
    removeVehicleFromEdgeList: (edgeIndex, vehicleIndex) => {
      vehicleSharedByEdge.removeVehicle(edgeIndex, vehicleIndex);
    },

    // Clear vehicle data
    clearVehicleData: (vehicleIndex) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      vehicle.movement.x = 0;
      vehicle.movement.y = 0;
      vehicle.movement.z = 0;
      vehicle.movement.rotation = 0;
      vehicle.movement.velocity = 0;
      vehicle.movement.acceleration = 0;
      vehicle.movement.edgeRatio = 0;
      vehicle.status.status = 0;
      vehicle.status.currentEdge = -1;
    },

    // Add vehicle (integrated)
    addVehicle: (vehicleIndex, data) => {
      const vehicle = vehicleSharedMovement.get(vehicleIndex);

      // Set movement data
      vehicle.movement.x = data.x;
      vehicle.movement.y = data.y;
      vehicle.movement.z = data.z;
      vehicle.movement.rotation = data.rotation ?? 0;
      vehicle.movement.velocity = data.velocity ?? 0;
      vehicle.movement.acceleration = data.acceleration ?? 0;
      vehicle.movement.edgeRatio = 0;

      // Set status data
      vehicle.status.status = data.status ?? 0;
      vehicle.status.currentEdge = data.edgeIndex;

      // Add to edge list
      vehicleSharedByEdge.addVehicle(data.edgeIndex, vehicleIndex);
    },

    // Remove vehicle (integrated)
    removeVehicle: (vehicleIndex) => {
      const store = get();
      const currentEdge = vehicleSharedMovement.get(vehicleIndex).status.currentEdge;

      // Remove from edge list
      if (currentEdge !== -1) {
        store.removeVehicleFromEdgeList(currentEdge, vehicleIndex);
      }

      // Clear data
      store.clearVehicleData(vehicleIndex);
    },

    // Move vehicle to new edge
    moveVehicleToEdge: (vehicleIndex, newEdgeIndex) => {
      const store = get();
      const vehicle = vehicleSharedMovement.get(vehicleIndex);
      const oldEdge = vehicle.status.currentEdge;

      // Remove from old edge
      if (oldEdge !== -1) {
        store.removeVehicleFromEdgeList(oldEdge, vehicleIndex);
      }

      // Add to new edge
      store.addVehicleToEdgeList(newEdgeIndex, vehicleIndex);
      vehicle.status.currentEdge = newEdgeIndex;
      vehicle.movement.edgeRatio = 0;
    },
  })
);

