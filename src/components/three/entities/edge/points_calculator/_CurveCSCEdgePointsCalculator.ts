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
 * CSC (직선-곡선-직선-곡선-직선) Edge Points Calculator
 * 6개 노드로 구성: a→b(직선) → b→c(90도곡선) → c→d(직선) → d→e(90도곡선) → e→f(직선)
 * 각 구간의 길이에 비례해서 점을 배분
 */
export class CurveCSCEdgePointsCalculator {
  /**
   * CSC 타입의 edge 포인트 계산
   * @param edgeRowData CFG에서 파싱된 edge row 데이터
   * @param nodes 전체 노드 배열
   * @param totalSegments 전체 세그먼트 수 (기본값: 100)
   * @returns 3D 렌더링 포인트 배열
   */
  static calculate(
    edgeRowData: any,
    nodes: Node[],
    totalSegments: number = DEFAULT_SEGMENTS
  ): THREE.Vector3[] {
    const { waypoints, radius, edge_name, vos_rail_type } = edgeRowData;

    // waypoints 구조: [a, b, c, d, e, f] (6개)
    // a→b: 첫 번째 직선
    // b→c: 첫 번째 90도 곡선
    // c→d: 두 번째 직선
    // d→e: 두 번째 90도 곡선
    // e→f: 세 번째 직선
    const nodeA = nodes.find((n: Node) => n.node_name === waypoints[0]);
    const nodeB = nodes.find((n: Node) => n.node_name === waypoints[1]);
    const nodeC = nodes.find((n: Node) => n.node_name === waypoints[2]);
    const nodeD = nodes.find((n: Node) => n.node_name === waypoints[3]);
    const nodeE = nodes.find((n: Node) => n.node_name === waypoints[4]);
    const nodeF = nodes.find((n: Node) => n.node_name === waypoints[5]);

    if (!nodeA || !nodeB || !nodeC || !nodeD || !nodeE || !nodeF) {
      console.warn(
        `${vos_rail_type} waypoint nodes not found for edge: ${edge_name}`
      );
      console.warn(
        `Missing nodes: A(${waypoints[0]}):${!!nodeA}, B(${
          waypoints[1]
        }):${!!nodeB}, C(${waypoints[2]}):${!!nodeC}, D(${
          waypoints[3]
        }):${!!nodeD}, E(${waypoints[4]}):${!!nodeE}, F(${
          waypoints[5]
        }):${!!nodeF}`
      );
      return [];
    }

    // 1. 각 구간의 길이 계산
    const straight1Length = calculateStraightDistance(nodeA, nodeB); // a→b
    const curve1Length = calculateCurveLength(radius, 90); // b→c (90도)
    const straight2Length = calculateStraightDistance(nodeC, nodeD); // c→d
    const curve2Length = calculateCurveLength(radius, 90); // d→e (90도)
    const straight3Length = calculateStraightDistance(nodeE, nodeF); // e→f

    const totalLength =
      straight1Length +
      curve1Length +
      straight2Length +
      curve2Length +
      straight3Length;

    // 2. 길이 비율에 따른 세그먼트 배분
    const straight1Ratio = straight1Length / totalLength;
    const curve1Ratio = curve1Length / totalLength;
    const straight2Ratio = straight2Length / totalLength;
    const curve2Ratio = curve2Length / totalLength;
    const straight3Ratio = straight3Length / totalLength;

    // 세그먼트 수 배분 (최소 1개는 보장)
    let straight1Segments = Math.max(
      1,
      Math.round(totalSegments * straight1Ratio)
    );
    let curve1Segments = Math.max(1, Math.round(totalSegments * curve1Ratio));
    let straight2Segments = Math.max(
      1,
      Math.round(totalSegments * straight2Ratio)
    );
    let curve2Segments = Math.max(1, Math.round(totalSegments * curve2Ratio));
    let straight3Segments = Math.max(
      1,
      Math.round(totalSegments * straight3Ratio)
    );

    // 반올림으로 인한 오차 보정 (가장 긴 구간에서 조정)
    const assignedSegments =
      straight1Segments +
      curve1Segments +
      straight2Segments +
      curve2Segments +
      straight3Segments;
    const segmentDiff = totalSegments - assignedSegments;

    if (segmentDiff !== 0) {
      // 가장 긴 구간 찾기
      const lengths = [
        {
          segments: straight1Segments,
          ratio: straight1Ratio,
          name: "straight1",
        },
        { segments: curve1Segments, ratio: curve1Ratio, name: "curve1" },
        {
          segments: straight2Segments,
          ratio: straight2Ratio,
          name: "straight2",
        },
        { segments: curve2Segments, ratio: curve2Ratio, name: "curve2" },
        {
          segments: straight3Segments,
          ratio: straight3Ratio,
          name: "straight3",
        },
      ];

      const longestSection = lengths.reduce((max, current) =>
        current.ratio > max.ratio ? current : max
      );

      // 가장 긴 구간에서 차이 조정
      switch (longestSection.name) {
        case "straight1":
          straight1Segments += segmentDiff;
          break;
        case "curve1":
          curve1Segments += segmentDiff;
          break;
        case "straight2":
          straight2Segments += segmentDiff;
          break;
        case "curve2":
          curve2Segments += segmentDiff;
          break;
        case "straight3":
          straight3Segments += segmentDiff;
          break;
      }
    }

    const allPoints: THREE.Vector3[] = [];

    // 3. 첫 번째 직선 구간 (a → b)
    const straightPoints1 = StraightPointsCalculator.calculateSegmentedPoints(
      nodeA,
      nodeB,
      straight1Segments
    );
    allPoints.push(...straightPoints1);

    // 4. 첫 번째 90도 곡선 구간 (b → c)
    const straightLineDirection1 = DirectionUtils.getLineDirection(
      nodeA,
      nodeB
    );
    const curvePoints1 = DirectionUtils.calculateCurveAreaPoints(
      nodeB,
      nodeC,
      straightLineDirection1,
      radius,
      90,
      curve1Segments,
      "from"
    );
    allPoints.push(...curvePoints1);

    // 5. 두 번째 직선 구간 (c → d)
    const straightPoints2 = StraightPointsCalculator.calculateSegmentedPoints(
      nodeC,
      nodeD,
      straight2Segments
    );
    allPoints.push(...straightPoints2);

    // 6. 두 번째 90도 곡선 구간 (d → e)
    const straightLineDirection2 = DirectionUtils.getLineDirection(
      nodeC,
      nodeD
    );
    const curvePoints2 = DirectionUtils.calculateCurveAreaPoints(
      nodeD,
      nodeE,
      straightLineDirection2,
      radius,
      90,
      curve2Segments,
      "from"
    );
    allPoints.push(...curvePoints2);

    // 7. 세 번째 직선 구간 (e → f)
    const straightPoints3 = StraightPointsCalculator.calculateSegmentedPoints(
      nodeE,
      nodeF,
      straight3Segments
    );
    allPoints.push(...straightPoints3);

    // Z 오프셋 적용 (CSC 타입은 복잡한 곡선이므로 더 높은 우선순위)
    const zOffset = 0.003;
    const offsetPoints = allPoints.map(
      (point) => new THREE.Vector3(point.x, point.y, point.z + zOffset)
    );

    return offsetPoints;
  }
}
