// src/types/node.ts

/**
 * Node Interface
 * - Core Data: Defined in nodes.cfg
 * - UI Data: Optional visual properties
 * - Topology Data: Calculated by Store (Derived)
 */
export interface Node {
  // ============================================================================
  // [1] CORE DATA (From Config)
  // ============================================================================
  node_name: string; // Unique Identifier
  editor_x: number;
  editor_y: number;
  editor_z: number;
  barcode: number;

  // ============================================================================
  // [2] UI & RENDERING (Optional)
  // ============================================================================
  color?: string;
  size?: number;
  rendering_mode?: "normal" | "preview";
  source?: "config" | "user" | "system";
  readonly?: boolean;

  // ============================================================================
  // [3] TOPOLOGY DATA (Derived / Calculated)
  // ============================================================================
  /**
   * 이 노드로 들어오는 엣지가 2개 이상인가? (합류점 여부)
   * True면 이곳에서 충돌 위험이 높음.
   */
  isMerge?: boolean;

  /**
   * 이 노드에서 나가는 엣지가 2개 이상인가? (분기점 여부)
   * True면 이곳을 지나는 차량은 다음 경로를 선택해야 함.
   */
  isDiverge?: boolean;

  /**
   * 연결된 엣지가 하나뿐인 막다른 곳인가?
   */
  isTerminal?: boolean;

  /**
   * 이 노드로 들어오는 엣지들의 인덱스 목록 (Store 기준)
   */
  incomingEdgeIndices?: number[];

  /**
   * 이 노드에서 출발하는 엣지들의 인덱스 목록 (Store 기준)
   */
  outgoingEdgeIndices?: number[];
}