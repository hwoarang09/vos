import { create } from "zustand";
import { Edge, EdgeCreationPhase, EdgeCreationState, Node } from "../types";

// Map store interface
interface MapState {
  edges: Edge[];
  nodes: Node[];
  previewEdge: Edge | null; // Preview edge for road building
  edgeCreation: EdgeCreationState; // Edge creation state

  // Edge management functions
  addEdge: (edge: Edge) => void;
  removeEdge: (edge_name: string) => void;
  updateEdge: (edge_name: string, updates: Partial<Edge>) => void;
  clearEdges: () => void;

  // Preview edge management
  setPreviewEdge: (edge: Edge | null) => void;
  clearPreviewEdge: () => void;

  // Edge creation management
  setEdgeCreationPhase: (phase: EdgeCreationPhase) => void;
  setEdgeCreationState: (state: Partial<EdgeCreationState>) => void;
  resetEdgeCreation: () => void;
  rotateEdgeDirection: () => void;

  // Node management functions
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  clearNodes: () => void;

  // Utility functions
  clearAll: () => void;
  loadMapData: (edges: Edge[], nodes: Node[]) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  edges: [
    // 테스트용 기본 엣지
    // {
    //   edge_name: "E9901",
    //   from_node: "N9901",
    //   to_node: "N9902",
    //   waypoints: ["N9901", "N9902"],
    //   vos_rail_type: "S",
    //   distance: 10,
    //   color: "#0000ff",
    //   opacity: 1.0,
    //   source: "system",
    //   rendering_mode: "normal",
    // },
  ],
  nodes: [],
  previewEdge: null,
  edgeCreation: {
    phase: "idle",
    startPosition: null,
    currentDirection: 0,
    fromNodeId: null,
    toNodeId: null,
    tempToNodeId: null,
    snappedToNodeId: null,
    edgeLength: 5, // Default length
  },

  // Edge management
  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  removeEdge: (edge_name) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.edge_name !== edge_name),
    })),

  updateEdge: (edge_name, updates) =>
    set((state) => {
      const edge = state.edges.find((e) => e.edge_name === edge_name);
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
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.node_name !== id),
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.node_name === id ? { ...node, ...updates } : node
      ),
    })),

  clearNodes: () => set({ nodes: [] }),

  // Edge creation management
  setEdgeCreationPhase: (phase) =>
    set((state) => ({
      edgeCreation: { ...state.edgeCreation, phase },
    })),

  setEdgeCreationState: (updates) =>
    set((state) => ({
      edgeCreation: { ...state.edgeCreation, ...updates },
    })),

  resetEdgeCreation: () =>
    set(() => ({
      edgeCreation: {
        phase: "idle",
        startPosition: null,
        currentDirection: 0,
        fromNodeId: null,
        toNodeId: null,
        tempToNodeId: null,
        snappedToNodeId: null,
        edgeLength: 5,
      },
    })),

  rotateEdgeDirection: () =>
    set((state) => {
      const currentDirection = state.edgeCreation.currentDirection;
      const newDirection = (currentDirection + 90) % 360;
      return {
        edgeCreation: { ...state.edgeCreation, currentDirection: newDirection },
      };
    }),

  // Utility functions
  clearAll: () =>
    set({
      edges: [],
      nodes: [],
      previewEdge: null,
      edgeCreation: {
        phase: "idle",
        startPosition: null,
        currentDirection: 0,
        fromNodeId: null,
        toNodeId: null,
        tempToNodeId: null,
        snappedToNodeId: null,
        edgeLength: 5,
      },
    }),

  loadMapData: (edges, nodes) => set({ edges, nodes }),
}));
