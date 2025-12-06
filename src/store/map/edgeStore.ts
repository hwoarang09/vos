import { create } from "zustand";
import { Edge } from "@/types/edge"; // 분리된 타입 경로
import { useNodeStore } from "./nodeStore";

/**
 * Calculate edge axis direction from start to end point
 * - 0°: X-axis right (East)
 * - 90°: Y-axis up (North)
 * - 180°: X-axis left (West)
 * - 270°: Y-axis down (South)
 */
function calculateEdgeAxis(fromNodeName: string, toNodeName: string): number {
  const nodeStore = useNodeStore.getState();
  const fromNode = nodeStore.getNodeByName(fromNodeName);
  const toNode = nodeStore.getNodeByName(toNodeName);

  if (!fromNode || !toNode) {
    console.warn(`Cannot calculate axis: nodes not found (${fromNodeName} -> ${toNodeName})`);
    return 0;
  }

  const dx = toNode.editor_x - fromNode.editor_x;
  const dy = toNode.editor_y - fromNode.editor_y;

  // atan2(dy, dx) returns angle in radians from -π to π
  // Standard math: 0° = right (East), 90° = up (North), 180° = left (West), 270° = down (South)
  let angleRad = Math.atan2(dy, dx);
  let angleDeg = angleRad * (180 / Math.PI);

  // Normalize to 0-360 range
  if (angleDeg < 0) angleDeg += 360;

  return angleDeg;
}

interface EdgeState {
  edges: Edge[];
  edgeNameToIndex: Map<string, number>; // O(1) Lookup

  // Actions
  setEdges: (edges: Edge[]) => void; // 여기서 토폴로지 자동 계산
  addEdge: (edge: Edge) => void;
  clearEdges: () => void;
  
  // Utility
  getEdgeByIndex: (index: number) => Edge | undefined;
}

export const useEdgeStore = create<EdgeState>((set, get) => ({
  edges: [],
  edgeNameToIndex: new Map(),

  // [핵심] 맵 로딩 시 이 함수만 호출하면 됨
  setEdges: (rawEdges) => {
    console.time("EdgeTopologyCalc");

    // 1. 빠른 조회를 위한 임시 맵 생성 (NodeName -> EdgeIndices[])
    const nodeIncoming = new Map<string, number[]>();
    const nodeOutgoing = new Map<string, number[]>();
    const nameToIndex = new Map<string, number>();

    // 1차 순회: 인덱싱 및 노드 연결 관계 수집
    rawEdges.forEach((edge, idx) => {
      nameToIndex.set(edge.edge_name, idx);

      // From Node (Outgoing)
      if (!nodeOutgoing.has(edge.from_node)) nodeOutgoing.set(edge.from_node, []);
      nodeOutgoing.get(edge.from_node)!.push(idx);

      // To Node (Incoming)
      if (!nodeIncoming.has(edge.to_node)) nodeIncoming.set(edge.to_node, []);
      nodeIncoming.get(edge.to_node)!.push(idx);
    });

    // 2차 순회: Edge 데이터에 토폴로지 정보 주입 (불변성 유지)
    const connectedEdges = rawEdges.map((edge) => {
      const incomingToStart = nodeIncoming.get(edge.from_node) || [];
      const outgoingFromStart = nodeOutgoing.get(edge.from_node) || [];

      const incomingToEnd = nodeIncoming.get(edge.to_node) || [];
      const outgoingFromEnd = nodeOutgoing.get(edge.to_node) || [];

      // Calculate axis direction
      const axis = calculateEdgeAxis(edge.from_node, edge.to_node);

      return {
        ...edge,
        // [Topology Flags] - 4-Way State
        fromNodeIsMerge: incomingToStart.length > 1,
        fromNodeIsDiverge: outgoingFromStart.length > 1,
        toNodeIsMerge: incomingToEnd.length > 1,
        toNodeIsDiverge: outgoingFromEnd.length > 1,

        // [Indices]
        nextEdgeIndices: outgoingFromEnd, // 다음 갈 수 있는 엣지들
        prevEdgeIndices: incomingToEnd,   // 나와 합류 경쟁하는 엣지들

        // [Geometry]
        axis: axis, // Edge direction (0°=East, 90°=North, 180°=West, 270°=South)
      };
    });

    console.timeEnd("EdgeTopologyCalc");
    console.log(`[EdgeStore] Loaded ${connectedEdges.length} edges with topology.`);

    set({ 
      edges: connectedEdges, 
      edgeNameToIndex: nameToIndex 
    });
  },

  addEdge: (edge) => set((state) => {
    // *주의: 단일 추가 시에는 전체 토폴로지 재계산이 안 됨. 
    // 런타임에 맵을 수정한다면 addEdge 후 별도의 재계산 로직이 필요할 수 있음.
    // 여기서는 단순 추가만 구현.
    const newIndex = state.edges.length;
    const newMap = new Map(state.edgeNameToIndex);
    newMap.set(edge.edge_name, newIndex);
    return {
      edges: [...state.edges, edge],
      edgeNameToIndex: newMap
    };
  }),

  clearEdges: () => set({ edges: [], edgeNameToIndex: new Map() }),

  getEdgeByIndex: (index) => get().edges[index],
}));