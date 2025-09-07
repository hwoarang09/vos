import { create } from "zustand";

// Text position data structure
export interface TextPosition {
  x: number;
  y: number;
  z: number;
}

// Text store interface
interface TextStore {
  // Node texts: { 'N001': [x, y, z], 'N002': [x, y, z], ... }
  nodeTexts: Record<string, TextPosition>;

  // Edge texts: { 'E001': [x, y, z], 'E002': [x, y, z], ... }
  edgeTexts: Record<string, TextPosition>;

  // Force update trigger
  updateTrigger: number;

  // Actions
  setNodeTexts: (nodeTexts: Record<string, TextPosition>) => void;
  setEdgeTexts: (edgeTexts: Record<string, TextPosition>) => void;
  addNodeText: (nodeName: string, position: TextPosition) => void;
  addEdgeText: (edgeName: string, position: TextPosition) => void;
  removeNodeText: (nodeName: string) => void;
  removeEdgeText: (edgeName: string) => void;
  clearAllTexts: () => void;
  forceUpdate: () => void;

  // Utility functions
  getAllTexts: () => Record<string, TextPosition>; // Combined node + edge texts
}

// Create the text store
export const useTextStore = create<TextStore>((set, get) => ({
  nodeTexts: {},
  edgeTexts: {},
  updateTrigger: 0,

  setNodeTexts: (nodeTexts) =>
    set((state) => ({
      nodeTexts,
      updateTrigger: state.updateTrigger + 1,
    })),

  setEdgeTexts: (edgeTexts) =>
    set((state) => ({
      edgeTexts,
      updateTrigger: state.updateTrigger + 1,
    })),

  addNodeText: (nodeName, position) =>
    set((state) => ({
      nodeTexts: {
        ...state.nodeTexts,
        [nodeName]: position,
      },
      updateTrigger: state.updateTrigger + 1,
    })),

  addEdgeText: (edgeName, position) =>
    set((state) => ({
      edgeTexts: {
        ...state.edgeTexts,
        [edgeName]: position,
      },
      updateTrigger: state.updateTrigger + 1,
    })),

  removeNodeText: (nodeName) =>
    set((state) => {
      const { [nodeName]: removed, ...rest } = state.nodeTexts;
      return {
        nodeTexts: rest,
        updateTrigger: state.updateTrigger + 1,
      };
    }),

  removeEdgeText: (edgeName) =>
    set((state) => {
      const { [edgeName]: removed, ...rest } = state.edgeTexts;
      return {
        edgeTexts: rest,
        updateTrigger: state.updateTrigger + 1,
      };
    }),

  clearAllTexts: () =>
    set((state) => ({
      nodeTexts: {},
      edgeTexts: {},
      updateTrigger: state.updateTrigger + 1,
    })),

  forceUpdate: () =>
    set((state) => ({
      updateTrigger: state.updateTrigger + 1,
    })),

  getAllTexts: () => {
    const state = get();
    return {
      ...state.nodeTexts,
      ...state.edgeTexts,
    };
  },
}));
