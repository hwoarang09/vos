import { Node } from "../../../../types";
import * as THREE from "three";

/**
 * 직선의 방향 타입 (4방향만 지원)
 */
export type Direction = "+x" | "-x" | "+y" | "-y";

/**
 * 방향 관련 유틸리티 함수들
 */
export class DirectionUtils {
  /**
   * 두 노드 사이의 직선 방향을 구함 (4방향만)
   */
  static getLineDirection(fromNode: Node, toNode: Node): Direction {
    const dx = toNode.editor_x - fromNode.editor_x;
    const dy = toNode.editor_y - fromNode.editor_y;

    // x, y 중 어느 쪽이 더 많이 변했는지 확인
    if (Math.abs(dx) > Math.abs(dy)) {
      // x 방향으로 더 많이 변함
      return dx > 0 ? "+x" : "-x";
    } else {
      // y 방향으로 더 많이 변함
      return dy > 0 ? "+y" : "-y";
    }
  }

  /**
   * 90도 곡선의 호 중심 좌표를 계산
   * @param bNode 곡선 시작점 (b)
   * @param cNode 곡선 끝점 (c)
   * @param fromDirection from쪽 직선의 방향
   * @param radius 곡선 반지름
   */
  static calculateArcCenter(
    bNode: Node,
    cNode: Node,
    fromDirection: Direction,
    radius: number
  ): [number, number, number] {
    // b노드 기준으로 호의 중심을 계산
    let centerX = bNode.editor_x;
    let centerY = bNode.editor_y;
    const centerZ = bNode.editor_z; // Z는 그대로

    // from 방향과 c노드 위치에 따라 호의 중심 결정
    if (fromDirection === "+x") {
      // +x 직선에서 c노드의 y가 b노드보다 크면 위쪽에 중심
      if (cNode.editor_y > bNode.editor_y) {
        centerY += radius; // 위쪽(+y)으로 radius만큼
      } else {
        centerY -= radius; // 아래쪽(-y)으로 radius만큼
      }
    } else if (fromDirection === "-x") {
      // -x 직선
      if (cNode.editor_y > bNode.editor_y) {
        centerY += radius;
      } else {
        centerY -= radius;
      }
    } else if (fromDirection === "+y") {
      // +y 직선
      if (cNode.editor_x > bNode.editor_x) {
        centerX += radius; // 오른쪽(+x)으로 radius만큼
      } else {
        centerX -= radius; // 왼쪽(-x)으로 radius만큼
      }
    } else if (fromDirection === "-y") {
      // -y 직선
      if (cNode.editor_x > bNode.editor_x) {
        centerX += radius;
      } else {
        centerX -= radius;
      }
    }

    return [centerX, centerY, centerZ];
  }

  /**
   * Calculate curve area points for rendering (공용 함수)
   * @param curveStartNode 곡선 시작점 (보통 b노드)
   * @param curveEndNode 곡선 끝점 (보통 c노드)
   * @param straightLineDirectionFromFromNode from노드에서 시작된 직선 영역의 방향
   * @param radius 곡선 반지름
   * @param rotationDegrees 곡선 회전 각도 (도 단위: 90, 180, 43 등 모든 각도 가능)
   * @param segments 곡선을 나눌 세그먼트 수
   * @param arcCenterBase 'from': curveStartNode 기준으로 arc center (기본값), 'to': curveEndNode 기준으로 arc center (S자 곡선용)
   */
  static calculateCurveAreaPoints(
    curveStartNode: Node,
    curveEndNode: Node,
    straightLineDirectionFromFromNode: Direction,
    radius: number = 0.5,
    rotationDegrees: number = 90,
    segments: number = 16,
    arcCenterBase: "from" | "to" = "from"
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];

    // 1. arc center 기준점 결정
    const arcCenterBaseNode =
      arcCenterBase === "from" ? curveStartNode : curveEndNode;
    const arcCenterOtherNode =
      arcCenterBase === "from" ? curveEndNode : curveStartNode;

    // 2. 원의 중심 계산
    const [centerX, centerY] = DirectionUtils.calculateArcCenter(
      arcCenterBaseNode,
      arcCenterOtherNode,
      straightLineDirectionFromFromNode,
      radius
    );

    // 3. 곡선 그리기 방향 결정
    let actualCurveStartNode: Node;
    let actualCurveEndNode: Node;

    if (arcCenterBase === "from") {
      // 기본: curveStartNode부터 curveEndNode로 곡선
      actualCurveStartNode = curveStartNode;
      actualCurveEndNode = curveEndNode;
    } else {
      // S자 곡선: curveEndNode부터 curveStartNode로 곡선 (역방향)
      actualCurveStartNode = curveEndNode;
      actualCurveEndNode = curveStartNode;
    }

    // 4. 시작각도 계산
    const startAngle = Math.atan2(
      actualCurveStartNode.editor_y - centerY,
      actualCurveStartNode.editor_x - centerX
    );

    // 5. 지정된 각도만큼 호를 segments로 나누어 점들 생성
    const rotationRadians = (rotationDegrees * Math.PI) / 180; // 도를 라디안으로 변환

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      // 지정된 각도만큼 회전
      let angle = startAngle + rotationRadians * t;

      // 방향에 따라 시계방향/반시계방향 결정
      // TODO: straightLineDirectionFromFromNode에 따라 올바른 방향으로 회전하도록 수정 필요

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const z =
        actualCurveStartNode.editor_z +
        (actualCurveEndNode.editor_z - actualCurveStartNode.editor_z) * t; // Z는 선형 보간

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }
}
