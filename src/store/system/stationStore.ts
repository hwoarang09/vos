import { create } from "zustand";

// Station interface
export interface Station {
  station_name: string;
  x: number;
  y: number;
  z: number;
  type?: "loading" | "unloading" | "storage";
  color?: string;
  size?: number;
  source?: "config" | "user" | "system";
}

// Station store interface
interface StationStore {
  stations: Station[];
  addStation: (station: Station) => void;
  removeStation: (station_name: string) => void;
  updateStation: (station_name: string, updates: Partial<Station>) => void;
  clearStations: () => void;
  loadStations: (stations: Station[]) => void;
}

// Create the station store
export const useStationStore = create<StationStore>((set) => ({
  stations: [],

  addStation: (station) =>
    set((state) => ({
      stations: [...state.stations, station],
    })),

  removeStation: (station_name) =>
    set((state) => ({
      stations: state.stations.filter((s) => s.station_name !== station_name),
    })),

  updateStation: (station_name, updates) =>
    set((state) => ({
      stations: state.stations.map((s) =>
        s.station_name === station_name ? { ...s, ...updates } : s
      ),
    })),

  clearStations: () => set({ stations: [] }),

  loadStations: (stations) => set({ stations }),
}));

