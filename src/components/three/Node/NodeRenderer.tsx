import React, { useMemo } from "react";
import { Node } from "../../../types";
import NodeInstance from "./NodeInstance";
import { useRenderCheck } from "../../../utils/renderDebug";

interface NodeRendererProps {
  nodes: Node[];
}

/**
 * NodeRenderer: optimized to avoid re-renders from preview node updates.
 * - Renders actual nodes via NodeInstance (each subscribes to its own data)
 * - Always renders PreviewNodeInstance (it handles visibility internally via useFrame)
 * - No subscription to previewNodes to avoid re-renders on mouse movement
 */
const NodeRenderer: React.FC<NodeRendererProps> = ({ nodes }) => {
  useRenderCheck("NodeRenderer");

  // Memoize the node instances to avoid recreating them on every render
  const nodeInstances = useMemo(
    () =>
      nodes.map((n) => <NodeInstance key={n.node_name} nodeId={n.node_name} />),
    [nodes]
  );

  // Preview node instances - always rendered but handle their own visibility
  const previewNodeInstances = useMemo(
    () => [
      <NodeInstance
        key="preview_start"
        nodeId="preview_start"
        isPreview={true}
      />,
      <NodeInstance key="preview_end" nodeId="preview_end" isPreview={true} />,
    ],
    []
  );

  return (
    <group>
      {nodeInstances}
      {/* Preview nodes - they handle their own visibility based on activeMenu */}
      {previewNodeInstances}
    </group>
  );
};

export default NodeRenderer;
