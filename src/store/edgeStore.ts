import { create } from "zustand";

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

  // Edge management functions
  addEdge: (edge: EdgeData) => void;
  removeEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<EdgeData>) => void;
  clearEdges: () => void;

  // Node management functions
  addNode: (node: NodeData) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  clearNodes: () => void;

  // Utility functions
  clearAll: () => void;
  loadMapData: (edges: EdgeData[], nodes: NodeData[]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  edges: [],
  nodes: [],

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

  // Utility functions
  clearAll: () => set({ edges: [], nodes: [] }),

  loadMapData: (edges, nodes) => set({ edges, nodes }),
}));