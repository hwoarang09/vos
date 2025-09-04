import { Node } from "../../../../types";
import { DirectionUtils } from "./DirectionUtils";
import * as THREE from "three";

const CURVE_SEGMENTS = 20;

/**
 * 180도 곡선 (CW, CCW) Edge Points Calculator
 */
export class Curve180EdgePointsCalculator {
  /**
   * 180도 곡선 타입의 edge 포인트 계산
   * @param edgeRowData CFG에서 파싱된 edge row 데이터
   * @param nodes 전체 노드 배열
   * @returns 3D 렌더링 포인트 배열
   */
  static calculate(edgeRowData: any, nodes: Node[]): THREE.Vector3[] {
    const { waypoints, radius, edge_name, vos_rail_type, from_node, to_node } =
      edgeRowData;
    const segments = CURVE_SEGMENTS;

    console.log(
      `Processing ${vos_rail_type} edge: ${edge_name} (radius: ${radius})`
    );

    const fromNode = nodes.find((n: Node) => n.node_name === from_node);
    const toNode = nodes.find((n: Node) => n.node_name === to_node);

    if (!fromNode || !toNode) {
      console.warn(
        `${vos_rail_type} nodes not found: ${from_node} or ${to_node}`
      );
      return [];
    }

    // waypoints 기준 방향 계산
    const firstNode = nodes.find((n: Node) => n.node_name === waypoints[0]);
    const secondNode = nodes.find((n: Node) => n.node_name === waypoints[1]);

    if (!firstNode || !secondNode) {
      console.warn(`${vos_rail_type} waypoint nodes not found`);
      return [];
    }

    const straightLineDirection = DirectionUtils.getLineDirection(
      firstNode,
      secondNode
    );
    console.log(`  📐 Straight line direction: ${straightLineDirection}`);

    // 180도 곡선 계산
    // CW: 시계방향 180도
    // CCW: 반시계방향 180도
    const curvePoints = DirectionUtils.calculateCurveAreaPoints(
      fromNode,
      toNode,
      straightLineDirection,
      radius,
      180, // 180도 곡선
      segments,
      "from"
    );

    console.log(`  ✅ ${vos_rail_type} total points: ${curvePoints.length}`);
    return curvePoints;
  }
}
