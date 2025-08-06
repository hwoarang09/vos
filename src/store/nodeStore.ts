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
  previewNodes: NodeData[]; // Preview nodes for road building

  // Node management functions
  addNode: (node: NodeData) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  clearNodes: () => void;

  // Preview node management
  setPreviewNodes: (nodes: NodeData[]) => void;
  updatePreviewNodesPosition: (startPos: [number, number, number], endPos: [number, number, number]) => void;
  clearPreviewNodes: () => void;

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
  previewNodes: [],

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

  // Preview node management
  setPreviewNodes: (nodes) => set({ previewNodes: nodes }),

  updatePreviewNodesPosition: (startPos, endPos) => set((state) => {
    if (state.previewNodes.length !== 2) return state;

    const startNode = state.previewNodes[0];
    const endNode = state.previewNodes[1];

    // Check if positions actually changed to avoid unnecessary re-renders
    const startChanged = startNode.x !== startPos[0] || startNode.y !== startPos[1] || startNode.z !== startPos[2];
    const endChanged = endNode.x !== endPos[0] || endNode.y !== endPos[1] || endNode.z !== endPos[2];

    if (!startChanged && !endChanged) {
      return state; // No change, avoid re-render
    }

    // Directly mutate the existing objects (more efficient)
    if (startChanged) {
      startNode.x = startPos[0];
      startNode.y = startPos[1];
      startNode.z = startPos[2];
    }
    if (endChanged) {
      endNode.x = endPos[0];
      endNode.y = endPos[1];
      endNode.z = endPos[2];
    }

    // Return new array reference to trigger re-render
    return { previewNodes: [...state.previewNodes] };
  }),

  clearPreviewNodes: () => set({ previewNodes: [] }),

  // Utility functions
  getNodeById: (id) => {
    const state = get();
    // First check regular nodes, then preview nodes
    return state.nodes.find(node => node.id === id) ||
           state.previewNodes.find(node => node.id === id);
  },

  getNodeByName: (name) => {
    const state = get();
    // First check regular nodes, then preview nodes
    return state.nodes.find(node => node.name === name) ||
           state.previewNodes.find(node => node.name === name);
  },

  generateNodeName: () => {
    const state = get();
    const nodeName = `NODE${state.nodeCounter.toString().padStart(4, '0')}`;
    set({ nodeCounter: state.nodeCounter + 1 });
    return nodeName;
  },

  setNodeCounter: (counter) => set({ nodeCounter: counter })
}));
