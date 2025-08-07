import React from 'react';
import { useMapStore } from '../../store/edgeStore';
import { useNodeStore } from '../../store/nodeStore';
import EdgeRenderer from './Edge/EdgeRenderer';
import NodeRenderer from './Node/NodeRenderer';

/**
 * MapRenderer component - Renders the map based on data from MapStore
 * This component is responsible for displaying edges and nodes from the store
 */
const MapRenderer: React.FC = () => {
  const { edges, previewEdge } = useMapStore();
  const { nodes, previewNodes } = useNodeStore();

  // Combine regular edges with preview edge for rendering
  const allEdges = previewEdge ? [...edges, previewEdge] : edges;

  // Combine regular nodes with preview nodes for rendering
  const allNodes = [...nodes, ...previewNodes];

  return (
    <group>
      {/* Render all nodes (including preview) using NodeRenderer container */}
      <NodeRenderer nodes={allNodes} />

      {/* Render all edges (including preview) using EdgeRenderer container */}
      <EdgeRenderer edges={allEdges} />

      {/* Basic lighting for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </group>
  );
};

export default MapRenderer;
