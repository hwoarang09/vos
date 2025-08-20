import { create } from "zustand";

// Edge creation phases
export type EdgeCreationPhase = 'idle' | 'initial' | 'direction_selection' | 'length_adjustment' | 'adjusting';

// Edge creation state interface
export interface EdgeCreationState {
  phase: EdgeCreationPhase;
  startPosition: { x: number; y: number; z: number } | null;
  currentDirection: number; // 0, 90, 180, 270 degrees
  fromNodeId: string | null;
  toNodeId: string | null;
  tempToNodeId: string | null;
  snappedToNodeId: string | null;
  edgeLength: number;
}

// Edge data interface
export interface EdgeData {
  id: string;
  fromNode: string; // Node ID/name
  toNode: string; // Node ID/name
  color: string;
  opacity: number;
  readonly?: boolean; // true면 수정 불가, false/undefined면 수정 가능
  source?: 'config' | 'user' | 'system'; // 데이터 출처 (선택사항)
  mode? : "normal" | "preview";
}

// Node data interface (for future use)
export interface NodeData {
  id: string;
  position: [number, number, number];
  color: string;
  size: number;
}

// Map store interface
interface MapState {
  edges: EdgeData[];
  nodes: NodeData[];
  previewEdge: EdgeData | null; // Preview edge for road building
  edgeCreation: EdgeCreationState; // Edge creation state

  // Edge management functions
  addEdge: (edge: EdgeData) => void;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<EdgeData>) => void;
  clearEdges: () => void;

  // Preview edge management
  setPreviewEdge: (edge: EdgeData | null) => void;
  clearPreviewEdge: () => void;

  // Edge creation management
  setEdgeCreationPhase: (phase: EdgeCreationPhase) => void;
  setEdgeCreationState: (state: Partial<EdgeCreationState>) => void;
  resetEdgeCreation: () => void;
  rotateEdgeDirection: () => void;

  // Node management functions
  addNode: (node: NodeData) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  clearNodes: () => void;

  // Utility functions
  clearAll: () => void;
  loadMapData: (edges: EdgeData[], nodes: NodeData[]) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  edges: [],
  nodes: [],
  previewEdge: null,
  edgeCreation: {
    phase: 'idle',
    startPosition: null,
    currentDirection: 0,
    fromNodeId: null,
    toNodeId: null,
    tempToNodeId: null,
    snappedToNodeId: null,
    edgeLength: 5, // Default length
  },

  // Edge management
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),

  removeEdge: (id) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== id)
  })),

  updateEdge: (id, updates) => set((state) => {
    const edge = state.edges.find(e => e.id === id);
    if (edge) {
      Object.assign(edge, updates);
      return { edges: [...state.edges] }; // 배열 참조만 새로 만들어서 리렌더링 트리거
    }
    return state;
  }),

  clearEdges: () => set({ edges: [] }),

  // Preview edge management
  setPreviewEdge: (edge) => set({ previewEdge: edge }),

  clearPreviewEdge: () => set({ previewEdge: null }),

  // Node management
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id)
  })),

  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === id ? { ...node, ...updates } : node
    )
  })),

  clearNodes: () => set({ nodes: [] }),

  // Edge creation management
  setEdgeCreationPhase: (phase) => set((state) => ({
    edgeCreation: { ...state.edgeCreation, phase }
  })),

  setEdgeCreationState: (updates) => set((state) => ({
    edgeCreation: { ...state.edgeCreation, ...updates }
  })),

  resetEdgeCreation: () => set(() => ({
    edgeCreation: {
      phase: 'idle',
      startPosition: null,
      currentDirection: 0,
      fromNodeId: null,
      toNodeId: null,
      tempToNodeId: null,
      snappedToNodeId: null,
      edgeLength: 5,
    }
  })),

  rotateEdgeDirection: () => set((state) => {
    const currentDirection = state.edgeCreation.currentDirection;
    const newDirection = (currentDirection + 90) % 360;
    return {
      edgeCreation: { ...state.edgeCreation, currentDirection: newDirection }
    };
  }),

  // Utility functions
  clearAll: () => set({ edges: [], nodes: [], previewEdge: null, edgeCreation: {
    phase: 'idle',
    startPosition: null,
    currentDirection: 0,
    fromNodeId: null,
    toNodeId: null,
    tempToNodeId: null,
    snappedToNodeId: null,
    edgeLength: 5,
  }}),

  loadMapData: (edges, nodes) => set({ edges, nodes }),
}));