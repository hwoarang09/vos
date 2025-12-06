import { Node } from "../../../../../types";
import { DirectionUtils } from "./_DirectionUtils";
import { StraightPointsCalculator } from "./_StraightPointsCalculator";
import * as THREE from "three";
import {
  calculateStraightDistance,
  calculateCurveLength,
} from "@/utils/geometry/calculateDistance";
const DEFAULT_SEGMENTS = 100;

/**
 * 180도 곡선 (LEFT_CURVE, RIGHT_CURVE) Edge Points Calculator
 * 직선 + 180도 곡선 + 직선 구조로 처리
 * 각 구간의 길이에 비례해서 점을 배분
 */
export class Curve180EdgePointsCalculator {
  /**
   * 180도 곡선 타입의 edge 포인트 계산
   * @param edgeRowData CFG에서 파싱된 edge row 데이터
   * @param nodes 전체 노드 배열
   * @param totalSegments 전체 세그먼트 수 (기본값: 20)
   * @returns 3D 렌더링 포인트 배열
   */
  static calculate(
    edgeRowData: any,
    nodes: Node[],
    totalSegments: number = DEFAULT_SEGMENTS
  ): THREE.Vector3[] {
    const { waypoints, radius, edge_name, vos_rail_type } = edgeRowData;

    // waypoints 구조: [a, b, c, d]
    // a→b: 첫 번째 직선
    // b→c: 180도 곡선 (LEFT 또는 RIGHT)
    // c→d: 두 번째 직선
    const nodeA = nodes.find((n: Node) => n.node_name === waypoints[0]);
    const nodeB = nodes.find((n: Node) => n.node_name === waypoints[1]);
    const nodeC = nodes.find((n: Node) => n.node_name === waypoints[2]);
    const nodeD = nodes.find((n: Node) => n.node_name === waypoints[3]);

    if (!nodeA || !nodeB || !nodeC || !nodeD) {
      console.warn(
        `${vos_rail_type} waypoint nodes not found for edge: ${edge_name}`
      );
      console.warn(
        `Missing nodes: A(${waypoints[0]}):${!!nodeA}, B(${
          waypoints[1]
        }):${!!nodeB}, C(${waypoints[2]}):${!!nodeC}, D(${
          waypoints[3]
        }):${!!nodeD}`
      );
      return [];
    }

    // 1. 각 구간의 길이 계산
    const straight1Length = calculateStraightDistance(nodeA, nodeB);
    const curveLength = calculateCurveLength(radius, 180); // 180도 곡선
    const straight2Length = calculateStraightDistance(nodeC, nodeD);

    const totalLength = straight1Length + curveLength + straight2Length;

    // 2. 길이 비율에 따른 세그먼트 배분
    const straight1Ratio = straight1Length / totalLength;
    const curveRatio = curveLength / totalLength;
    const straight2Ratio = straight2Length / totalLength;

    // 세그먼트 수 배분 (최소 1개는 보장)
    let straight1Segments = Math.max(
      1,
      Math.round(totalSegments * straight1Ratio)
    );
    let curveSegments = Math.max(1, Math.round(totalSegments * curveRatio));
    let straight2Segments = Math.max(
      1,
      Math.round(totalSegments * straight2Ratio)
    );

    // 반올림으로 인한 오차 보정 (가장 긴 구간에서 조정)
    const assignedSegments =
      straight1Segments + curveSegments + straight2Segments;
    const segmentDiff = totalSegments - assignedSegments;

    if (segmentDiff !== 0) {
      if (curveRatio >= straight1Ratio && curveRatio >= straight2Ratio) {
        curveSegments += segmentDiff;
      } else if (straight1Ratio >= straight2Ratio) {
        straight1Segments += segmentDiff;
      } else {
        straight2Segments += segmentDiff;
      }
    }

    // 직선 방향 계산 (첫 번째와 두 번째 waypoint 기준)
    const straightLineDirection = DirectionUtils.getLineDirection(nodeA, nodeB);
    const allPoints: THREE.Vector3[] = [];

    // 3. 첫 번째 직선 구간 (a → b)
    const straightPoints1 = StraightPointsCalculator.calculateSegmentedPoints(
      nodeA,
      nodeB,
      straight1Segments
    );
    allPoints.push(...straightPoints1);

    // 4. 180도 곡선 구간 (b → c)
    const curvePoints = DirectionUtils.calculateCurveAreaPoints(
      nodeB,
      nodeC,
      straightLineDirection,
      radius,
      180, // 180도 곡선
      curveSegments,
      "from"
    );
    allPoints.push(...curvePoints);

    // 5. 두 번째 직선 구간 (c → d)
    const straightPoints2 = StraightPointsCalculator.calculateSegmentedPoints(
      nodeC,
      nodeD,
      straight2Segments
    );
    allPoints.push(...straightPoints2);

    // Z 오프셋 적용
    const zOffset = 0.001; // 또는 파라미터로 받아서 사용
    const offsetPoints = allPoints.map(
      (point) => new THREE.Vector3(point.x, point.y, point.z + zOffset)
    );

    return offsetPoints;
  }
}
