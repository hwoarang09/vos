// EdgeRenderer.tsx - 순수 렌더러 버전
import React, { useMemo } from "react";
import { Edge } from "../../../../types";
import { StraightEdgeRenderer } from "./_StraightEdgeRenderer";
import { Curve90EdgeRenderer } from "./_Curve90EdgeRenderer";
import { Curve180EdgeRenderer } from "./_Curve180EdgeRenderer";
import { colors } from "./colors"; // EdgeRenderer 폴더 내의 colors.ts
import * as THREE from "three";
import { CurveCSCEdgePointsCalculator } from "../points_calculator";
import { CurveCSCEdgeRenderer } from "./_CurveCSCEdgeRenderer";

interface EdgeRendererProps {
  edges: Edge[];
  previewEdges?: Edge[]; // Preview용 별도 배열
}

const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edges,
  previewEdges = [],
}) => {
  // rail type에 따른 기본 색상 가져오기
  const getDefaultColor = (vos_rail_type: string): string => {
    switch (vos_rail_type) {
      case "LINEAR":
        return colors.linear;
      case "CURVE_90":
        return colors.curve90;
      case "CURVE_180":
        return colors.curve180;
      case "CURVE_CSC":
        return colors.curveCSC;
      default:
        return colors.default;
    }
  };

  // rail type에 따른 renderOrder 설정 (높을수록 위에 렌더링)
  const getRenderOrder = (vos_rail_type: string): number => {
    switch (vos_rail_type) {
      case "LINEAR":
        return 1; // 직선이 먼저 (뒤에)
      case "CURVE_90":
      case "CURVE_180":
      case "CURVE_CSC":
        return 2; // 90도 곡선이 나중에 (위에)

      default:
        return 0;
    }
  };

  // 일반 edge 렌더링 함수
  const renderEdge = (edge: Edge, isPreview: boolean = false) => {
    const commonProps = {
      color: edge.color || getDefaultColor(edge.vos_rail_type),
      opacity: edge.opacity || 1,
      width: 0.25,
      isPreview,
      renderOrder: getRenderOrder(edge.vos_rail_type), // renderOrder 추가
    };

    // points가 없으면 렌더링하지 않음
    if (!edge.renderingPoints || edge.renderingPoints.length === 0) {
      console.warn(`Edge ${edge.edge_name} has no points, skipping render`);
      return null;
    }

    const key = isPreview ? `preview-${edge.edge_name}` : edge.edge_name;

    switch (edge.vos_rail_type) {
      case "CURVE_90":
        return (
          <Curve90EdgeRenderer
            key={key}
            renderingPoints={edge.renderingPoints}
            {...commonProps}
          />
        );
      case "CURVE_180":
        return (
          <Curve180EdgeRenderer
            key={key}
            renderingPoints={edge.renderingPoints}
            {...commonProps}
          />
        );
      case "CURVE_CSC":
        return (
          <CurveCSCEdgeRenderer
            key={key}
            renderingPoints={edge.renderingPoints}
            {...commonProps}
          />
        );
      case "LINEAR":
      default:
        return (
          <StraightEdgeRenderer
            key={key}
            renderingPoints={edge.renderingPoints}
            {...commonProps}
          />
        );
    }
  };

  // 일반 edges 메모화
  const edgeInstances = useMemo(
    () =>
      edges
        .filter((edge) => edge.rendering_mode !== "preview")
        .map((edge) => renderEdge(edge, false))
        .filter(Boolean), // null 제거
    [edges]
  );

  // Preview edges 메모화
  const previewEdgeInstances = useMemo(
    () => previewEdges.map((edge) => renderEdge(edge, true)).filter(Boolean), // null 제거
    [previewEdges]
  );

  return (
    <group>
      {edgeInstances}
      {previewEdgeInstances}
    </group>
  );
};

export default EdgeRenderer;
