import { create } from "zustand";
import { useNodeStore } from "./nodeStore";
import { useMapStore } from "./edgeStore";
import { Node, Edge } from "../types";
import { getNodeColor } from "../types/nodeColors";
import { getEdgeColor } from "../types/edgeColors";
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

  console.log("Headers found:", headers);
  console.log("Waypoints column index:", waypointsIndex);

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

      console.log(`Edge ${edgeName}: waypoints = [${waypoints.join(", ")}]`);

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
        rotation:
          rotation ||
          (railType === "C90" ? 90 : railType === "C180" ? 180 : undefined),
        color: getEdgeColor(railType), // VOS rail type에 따른 색상 적용
        opacity: 1.0,
        readonly: true,
        source: "config",
        rendering_mode: "normal",
        renderingPoints: renderingPoints,
      };
      console.log(`Rendering points for ${edgeName}:`, renderingPoints);
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
    console.log("🔄 Starting CFG file loading...");

    try {
      // CFG 파일들 로드
      const [nodesContent, edgesContent] = await Promise.all([
        loadCFGFile("nodes.cfg"),
        loadCFGFile("edges.cfg"),
      ]);

      // 파싱
      const nodes = parseNodesCFG(nodesContent);
      const edges = parseEdgesCFG(edgesContent);

      console.log(`✅ Parsed ${nodes.length} nodes and ${edges.length} edges`);

      // 스토어 업데이트
      const nodeStore = useNodeStore.getState();
      const mapStore = useMapStore.getState();

      nodeStore.clearNodes();
      mapStore.clearEdges();

      nodes.forEach((node) => nodeStore.addNode(node));
      edges.forEach((edge) => mapStore.addEdge(edge));

      console.log(
        `Loaded ${nodes.length} nodes and ${edges.length} edges from CFG files`
      );
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
