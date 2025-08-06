import { create } from "zustand";

// Node data interface
export interface NodeData {
  id: string; // Same as name
  name: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  size?: number;
  readonly?: boolean; // true면 수정 불가, false/undefined면 수정 가능
  source?: 'config' | 'user' | 'system'; // 데이터 출처 (선택사항)
}

// Store interface
interface NodeStore {
  nodes: NodeData[];
  nodeCounter: number; // Counter for generating sequential node names

  // Node management functions
  addNode: (node: NodeData) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  clearNodes: () => void;

  // Utility functions
  getNodeById: (id: string) => NodeData | undefined;
  getNodeByName: (name: string) => NodeData | undefined;
  generateNodeName: () => string;
  setNodeCounter: (counter: number) => void;
}

// Create the store
export const useNodeStore = create<NodeStore>((set, get) => ({
  nodes: [],
  nodeCounter: 1, // Start from 1 for NODE0001

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id)
  })),

  updateNode: (id, updates) => set((state) => {
    const node = state.nodes.find(n => n.id === id);
    if (node) {
      Object.assign(node, updates);
      return { nodes: [...state.nodes] }; // 배열 참조만 새로 만들어서 리렌더링 트리거
    }
    return state;
  }),

  clearNodes: () => set({ nodes: [], nodeCounter: 1 }), // Counter도 초기화

  // Utility functions
  getNodeById: (id) => {
    return get().nodes.find(node => node.id === id);
  },

  getNodeByName: (name) => {
    return get().nodes.find(node => node.name === name);
  },

  generateNodeName: () => {
    const state = get();
    const nodeName = `NODE${state.nodeCounter.toString().padStart(4, '0')}`;
    set({ nodeCounter: state.nodeCounter + 1 });
    return nodeName;
  },

  setNodeCounter: (counter) => set({ nodeCounter: counter })
}));
