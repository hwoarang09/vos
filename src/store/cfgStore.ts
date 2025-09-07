import { create } from "zustand";
import { useNodeStore } from "./nodeStore";
import { useMapStore } from "./edgeStore";
import { useTextStore, TextPosition } from "./textStore";
import { Node, Edge } from "../types";
import { getNodeColor } from "../utils/colors/nodeColors";
import { getEdgeColor } from "../utils/colors/edgeColors";
import { PointsCalculator } from "../components/three/Edge/points_calculator";
import * as THREE from "three";

interface CFGStore {
  isLoading: boolean;
  error: string | null;
  loadCFGFiles: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 간단한 CSV 파싱 헬퍼
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

// waypoints 파싱 헬퍼
const parseWaypoints = (waypointStr: string): string[] => {
  if (!waypointStr) return [];

  // 따옴표와 대괄호 제거
  const cleaned = waypointStr
    .replace(/^["']/, "")
    .replace(/["']$/, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  if (!cleaned) return [];

  return cleaned
    .split(",")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
};

// nodes.cfg 파싱
const parseNodesCFG = (content: string): Node[] => {
  const lines = content.split("\n").map((line) => line.trim());
  const nodes: Node[] = [];

  // 헤더 찾기
  const headerIndex = lines.findIndex((line) => line.startsWith("node_name,"));
  if (headerIndex === -1) {
    throw new Error("nodes.cfg header not found");
  }

  // 데이터 라인 파싱
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 5) continue;

    try {
      const nodeName = parts[0];

      const node: Node = {
        node_name: nodeName,
        barcode: parseInt(parts[1]) || 0,
        editor_x: parseFloat(parts[2]) || 0,
        editor_y: parseFloat(parts[3]) || 0,
        editor_z: parseFloat(parts[4]) || 3.8,
        color: getNodeColor(nodeName), // 노드 이름에 따른 색상 적용
        size: 0.5,
        readonly: true,
        source: "config",
      };
      nodes.push(node);
    } catch (error) {
      console.warn(`Failed to parse node line: ${line}`, error);
    }
  }

  return nodes;
};

// edges.cfg 파싱
const parseEdgesCFG = (content: string): Edge[] => {
  const lines = content.split("\n").map((line) => line.trim());
  const edges: Edge[] = [];

  // 헤더 찾기
  const headerIndex = lines.findIndex((line) => line.startsWith("edge_name,"));
  if (headerIndex === -1) {
    throw new Error("edges.cfg header not found");
  }

  // 헤더 컬럼 파싱
  const headers = parseCSVLine(lines[headerIndex]);
  const waypointsIndex = headers.indexOf("waypoints");

  // 데이터 라인 파싱
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith("#")) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 5) continue;

    try {
      const edgeName = parts[0];
      const fromNode = parts[1];
      const toNode = parts[2];
      const distance = parseFloat(parts[3]) || 0;
      const railType = parts[4];
      const radius = parts[5] ? parseFloat(parts[5]) : undefined;
      const rotation = parts[6] ? parseFloat(parts[6]) : undefined;

      // waypoints 파싱 - 인덱스가 유효하면 해당 컬럼에서, 없으면 기본값
      let waypoints: string[] = [fromNode, toNode]; // 기본값

      if (waypointsIndex >= 0 && parts[waypointsIndex]) {
        const parsed = parseWaypoints(parts[waypointsIndex]);
        if (parsed.length > 0) {
          waypoints = parsed;
        }
      }

      // rendering points 계산
      let renderingPoints: THREE.Vector3[] = [];
      try {
        const edgeRowData = {
          vos_rail_type: railType,
          radius: radius || (railType.startsWith("C") ? 0.5 : undefined),
          rotation: rotation,
          edge_name: edgeName,
          from_node: fromNode,
          to_node: toNode,
          waypoints: waypoints,
        };

        renderingPoints =
          PointsCalculator.calculateRenderingPoints(edgeRowData);
      } catch (error) {
        console.warn(
          `Failed to calculate rendering points for edge ${edgeName}:`,
          error
        );
      }

      const edge: Edge = {
        edge_name: edgeName,
        from_node: fromNode,
        to_node: toNode,
        waypoints: waypoints,
        vos_rail_type: railType,
        distance: distance,
        radius: radius || (railType.startsWith("C") ? 0.5 : undefined),
        rotation: rotation || 0,
        color: getEdgeColor(railType), // VOS rail type에 따른 색상 적용
        opacity: 1.0,
        readonly: true,
        source: "config",
        rendering_mode: "normal",
        renderingPoints: renderingPoints,
      };
      edges.push(edge);
    } catch (error) {
      console.warn(`Failed to parse edge line: ${line}`, error);
    }
  }

  return edges;
};

// CFG 파일 로드
const loadCFGFile = async (filename: string): Promise<string> => {
  const response = await fetch(`/railConfig/dismantle/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
  }
  return response.text();
};

// CFG Store
export const useCFGStore = create<CFGStore>((set) => ({
  isLoading: false,
  error: null,

  loadCFGFiles: async () => {
    set({ isLoading: true, error: null });

    try {
      // 1. 먼저 nodes.cfg 로드 및 파싱
      const nodesContent = await loadCFGFile("nodes.cfg");
      const nodes = parseNodesCFG(nodesContent);

      // 2. 노드 스토어 업데이트 (완전히 끝날 때까지 기다림)
      const nodeStore = useNodeStore.getState();
      nodeStore.clearNodes();
      nodes.forEach((node) => nodeStore.addNode(node));

      // 3. 노드 파싱이 완료된 후 edges.cfg 로드 및 파싱
      const edgesContent = await loadCFGFile("edges.cfg");
      const edges = parseEdgesCFG(edgesContent);

      // 4. 엣지 스토어 업데이트
      const mapStore = useMapStore.getState();
      mapStore.clearEdges();
      edges.forEach((edge) => mapStore.addEdge(edge));

      // 5. 텍스트 데이터 생성 및 업데이트
      const textStore = useTextStore.getState();
      textStore.clearAllTexts();

      // 노드 텍스트 생성: { 'N001': [x, y, z], ... } (TMP_ 제외)
      const nodeTexts: Record<string, TextPosition> = {};
      nodes.forEach((node) => {
        // TMP_로 시작하는 노드는 제외
        if (!node.node_name.startsWith("TMP_")) {
          nodeTexts[node.node_name] = {
            x: node.editor_x,
            y: node.editor_y,
            z: node.editor_z,
          };
        }
      });
      textStore.setNodeTexts(nodeTexts);
      console.log("CFG Store - Generated nodeTexts:", nodeTexts);

      // 엣지 텍스트 생성: { 'E001': [midpoint_x, midpoint_y, midpoint_z], ... } (TMP_ 제외)
      const edgeTexts: Record<string, TextPosition> = {};
      edges.forEach((edge) => {
        // TMP_로 시작하는 엣지는 제외
        if (!edge.edge_name.startsWith("TMP_")) {
          // waypoints 배열에서 적절한 노드 선택
          const waypoints = edge.waypoints || [];

          let node1, node2;

          if (waypoints.length >= 4) {
            // 곡선 엣지: waypoints[1]과 waypoints[-2] 사용
            const node1Name = waypoints[1];
            const node2Name = waypoints[waypoints.length - 2];
            node1 = nodes.find((n) => n.node_name === node1Name);
            node2 = nodes.find((n) => n.node_name === node2Name);
            console.log(
              `Curve edge ${edge.edge_name}: using ${node1Name} and ${node2Name} from waypoints:`,
              waypoints
            );
          } else {
            // 직선 엣지: from_node와 to_node 사용
            node1 = nodes.find((n) => n.node_name === edge.from_node);
            node2 = nodes.find((n) => n.node_name === edge.to_node);
            console.log(
              `Linear edge ${edge.edge_name}: using ${edge.from_node} and ${edge.to_node}`
            );
          }

          if (node1 && node2) {
            // 중점 계산
            edgeTexts[edge.edge_name] = {
              x: (node1.editor_x + node2.editor_x) / 2,
              y: (node1.editor_y + node2.editor_y) / 2,
              z: (node1.editor_z + node2.editor_z) / 2,
            };
          }
        }
      });
      textStore.setEdgeTexts(edgeTexts);
      console.log("CFG Store - Generated edgeTexts:", edgeTexts);

      // 강제 업데이트 트리거 (렌더링 확실히 하기 위해)
      setTimeout(() => {
        textStore.forceUpdate();
        console.log("CFG Store - Force update triggered");
      }, 100);

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      set({ error: errorMessage, isLoading: false });
      console.error("Failed to load CFG files:", error);
      throw error;
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
