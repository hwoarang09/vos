import { create } from "zustand";
import { Node } from "../types";

// Store interface
interface NodeStore {
  nodes: Node[];
  nodeCounter: number; // Counter for generating sequential node names
  previewNodes: Node[]; // Preview nodes for road building

  // Node management functions
  addNode: (node: Node) => void;
  removeNode: (node_name: string) => void;
  updateNode: (node_name: string, updates: Partial<Node>) => void;
  clearNodes: () => void;

  // Preview node management
  setPreviewNodes: (nodes: Node[]) => void;
  updatePreviewNodesPosition: (
    startPos: [number, number, number],
    endPos: [number, number, number]
  ) => void;
  clearPreviewNodes: () => void;

  // Utility functions
  getNodeByName: (node_name: string) => Node | undefined;
  generateNodeName: () => string;
  setNodeCounter: (counter: number) => void;
}

// Create the store
export const useNodeStore = create<NodeStore>((set, get) => ({
  nodes: [
    // 테스트용 기본 노드들
    // {
    //   node_name: "N9901",
    //   barcode: 0,
    //   editor_x: 0,
    //   editor_y: 0,
    //   editor_z: 3.8,
    //   color: "#ff0000",
    //   size: 1.0,
    //   source: "system",
    // },
    // {
    //   node_name: "N9902",
    //   barcode: 0,
    //   editor_x: 10,
    //   editor_y: 0,
    //   editor_z: 3.8,
    //   color: "#00ff00",
    //   size: 1.0,
    //   source: "system",
    // },
  ],
  nodeCounter: 1, // Start from 1 for NODE0001
  previewNodes: [],

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (node_name) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.node_name !== node_name),
    })),

  updateNode: (node_name, updates) =>
    set((state) => {
      const node = state.nodes.find((n) => n.node_name === node_name);
      if (node) {
        Object.assign(node, updates);
        return { nodes: [...state.nodes] }; // 배열 참조만 새로 만들어서 리렌더링 트리거
      }
      return state;
    }),

  clearNodes: () => set({ nodes: [], nodeCounter: 1 }), // Counter도 초기화

  // Preview node management
  setPreviewNodes: (nodes) => set({ previewNodes: nodes }),

  updatePreviewNodesPosition: (startPos, endPos) =>
    set((state) => {
      if (state.previewNodes.length !== 2) return state;

      const startNode = state.previewNodes[0];
      const endNode = state.previewNodes[1];

      // Check if positions actually changed to avoid unnecessary re-renders
      const startChanged =
        startNode.editor_x !== startPos[0] ||
        startNode.editor_y !== startPos[1] ||
        startNode.editor_z !== startPos[2];
      const endChanged =
        endNode.editor_x !== endPos[0] ||
        endNode.editor_y !== endPos[1] ||
        endNode.editor_z !== endPos[2];

      if (!startChanged && !endChanged) {
        return state; // No change, avoid re-render
      }

      // Directly mutate the existing objects (more efficient)
      if (startChanged) {
        startNode.editor_x = startPos[0];
        startNode.editor_y = startPos[1];
        startNode.editor_z = startPos[2];
      }
      if (endChanged) {
        endNode.editor_x = endPos[0];
        endNode.editor_y = endPos[1];
        endNode.editor_z = endPos[2];
      }

      // Return new array reference to trigger re-render
      return { previewNodes: [...state.previewNodes] };
    }),

  clearPreviewNodes: () => set({ previewNodes: [] }),

  // Utility functions
  getNodeByName: (node_name) => {
    const state = get();
    // First check regular nodes, then preview nodes
    return (
      state.nodes.find((node) => node.node_name === node_name) ||
      state.previewNodes.find((node) => node.node_name === node_name)
    );
  },

  generateNodeName: () => {
    const state = get();
    const nodeName = `NODE${state.nodeCounter.toString().padStart(4, "0")}`;
    set({ nodeCounter: state.nodeCounter + 1 });
    return nodeName;
  },

  setNodeCounter: (counter) => set({ nodeCounter: counter }),
}));
