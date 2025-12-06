import { create } from "zustand";
import { VehicleSystemMode } from "@components/three/entities/vehicle/VehicleSystem";

/**
 * Vehicle Test Store
 * - Manages vehicle test state
 * - Controls which test mode is active
 * - Controls simulation play/pause state
 */

interface VehicleTestState {
  isTestActive: boolean;
  testMode: VehicleSystemMode | null;
  numVehicles: number;
  isPanelVisible: boolean;
  isPaused: boolean; // Simulation pause state
  initialVehicleDistribution: Map<number, number[]> | null; // Edge index -> vehicle indices

  // Actions
  startTest: (mode: VehicleSystemMode, numVehicles?: number) => void;
  stopTest: () => void;
  setNumVehicles: (num: number) => void;
  setPanelVisible: (visible: boolean) => void;
  setPaused: (paused: boolean) => void;
  setInitialVehicleDistribution: (distribution: Map<number, number[]>) => void;
}

export const useVehicleTestStore = create<VehicleTestState>((set) => ({
  isTestActive: false,
  testMode: null,
  numVehicles: 50,
  isPanelVisible: true,
  isPaused: true, // Start paused by default
  initialVehicleDistribution: null,

  startTest: (mode: VehicleSystemMode, numVehicles = 50) => {
    console.log(`[VehicleTestStore] Starting test: ${mode} with ${numVehicles} vehicles`);
    set({ isTestActive: true, testMode: mode, numVehicles, isPanelVisible: true, isPaused: true });
  },

  stopTest: () => {
    console.log("[VehicleTestStore] Stopping test");
    set({ isTestActive: false, testMode: null, isPanelVisible: true, isPaused: true, initialVehicleDistribution: null });
  },

  setNumVehicles: (num: number) => {
    set({ numVehicles: num });
  },

  setPanelVisible: (visible: boolean) => {
    set({ isPanelVisible: visible });
  },

  setPaused: (paused: boolean) => {
    console.log(`[VehicleTestStore] ${paused ? 'Pausing' : 'Resuming'} simulation`);
    set({ isPaused: paused });
  },

  setInitialVehicleDistribution: (distribution: Map<number, number[]>) => {
    set({ initialVehicleDistribution: distribution });
  },
}));

