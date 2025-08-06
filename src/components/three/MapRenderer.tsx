import React from 'react';
import { useMapStore } from '../../store/edgeStore';
import EdgeRenderer from './Edge/EdgeRenderer';

/**
 * MapRenderer component - Renders the map based on data from MapStore
 * This component is responsible for displaying edges and nodes from the store
 */
const MapRenderer: React.FC = () => {
  const { edges, previewEdge } = useMapStore();

  // Combine regular edges with preview edge for rendering
  const allEdges = previewEdge ? [...edges, previewEdge] : edges;

  return (
    <group>
      {/* Render all edges (including preview) using EdgeRenderer container */}
      <EdgeRenderer edges={allEdges} />

      {/* TODO: Add NodeRenderer when needed */}
      {/* {nodes.map((node) => (
        <NodeRenderer
          key={node.id}
          position={node.position}
          color={node.color}
          size={node.size}
        />
      ))} */}

      {/* Basic lighting for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </group>
  );
};

export default MapRenderer;
