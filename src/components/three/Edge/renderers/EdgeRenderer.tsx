// EdgeRenderer.tsx - 순수 렌더러 버전
import React, { useMemo } from "react";
import { Edge } from "../../../../types";
import { StraightEdgeRenderer } from "./StraightEdgeRenderer";
import { Curve90EdgeRenderer } from "./Curve90EdgeRenderer";
import * as THREE from "three";

interface EdgeRendererProps {
  edges: Edge[];
  previewEdges?: Edge[]; // Preview용 별도 배열
}

const EdgeRenderer: React.FC<EdgeRendererProps> = ({
  edges,
  previewEdges = [],
}) => {
  console.log("EdgeRenderer - rendering", edges.length, "edges");

  // 일반 edge 렌더링 함수
  const renderEdge = (edge: Edge, isPreview: boolean = false) => {
    const commonProps = {
      color: edge.color || "#00ff00",
      opacity: edge.opacity || 1,
      width: 0.25,
      isPreview,
    };

    console.log(
      `Rendering edge: ${edge.edge_name} (${edge.vos_rail_type}) - ${
        edge.renderingPoints?.length || 0
      } points`
    );

    // points가 없으면 렌더링하지 않음
    if (!edge.renderingPoints || edge.renderingPoints.length === 0) {
      console.warn(`Edge ${edge.edge_name} has no points, skipping render`);
      return null;
    }

    const key = isPreview ? `preview-${edge.edge_name}` : edge.edge_name;

    switch (edge.vos_rail_type) {
      case "C90":
      case "LEFT_CURVE":
      case "RIGHT_CURVE":
        return (
          <Curve90EdgeRenderer
            key={key}
            renderingPoints={edge.renderingPoints}
            {...commonProps}
          />
        );
      case "C180":
        // C180 렌더러가 만들어지면 여기에 추가
        console.warn("C180EdgeRenderer not implemented yet");
        return null;
      case "S":
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
