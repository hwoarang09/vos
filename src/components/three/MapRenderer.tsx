import React, { useMemo } from "react";
import { useMapStore } from "../../store/edgeStore";
import { useNodeStore } from "../../store/nodeStore";
import EdgeRenderer from "./Edge/renderers/EdgeRenderer";
import NodeRenderer from "./Node/NodeRenderer";
import { useRenderCheck } from "../../utils/renderDebug";

/**
 * MapRenderer component - Optimized to minimize re-renders
 * - Only subscribes to edges and nodes (not previewEdge)
 * - EdgeRenderer handles previewEdge internally
 * - Memoizes edge array to avoid unnecessary recreations
 */
const MapRenderer: React.FC = () => {
  useRenderCheck("MapRenderer");

  const edges = useMapStore((state) => state.edges); // Only subscribe to edges
  const nodes = useNodeStore((state) => state.nodes); // Only subscribe to regular nodes

  // Memoize nodes to avoid unnecessary NodeRenderer re-renders
  const memoizedNodes = useMemo(() => nodes, [nodes]);

  return (
    <group>
      {/* Render regular nodes - NodeRenderer handles preview nodes internally */}
      <NodeRenderer nodes={memoizedNodes} />

      {/* EdgeRenderer handles both regular edges and previewEdge internally */}
      <EdgeRenderer edges={edges} />

      {/* Basic lighting for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </group>
  );
};

export default MapRenderer;
