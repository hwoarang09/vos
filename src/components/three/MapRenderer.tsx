import React from 'react';
import { useMapStore, EdgeData } from '../../store/edgeStore';
import EdgeRenderer from './Edge/EdgeRenderer';

/**
 * Individual Edge component with memoization
 * Only re-renders when its specific edge data changes
 */
const MemoizedEdge: React.FC<{ edge: EdgeData }> = React.memo(({ edge }) => {
  return (
    <EdgeRenderer
      startPosition={edge.startPosition}
      endPosition={edge.endPosition}
      color={edge.color}
      opacity={edge.opacity}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if edge data actually changed
  const prev = prevProps.edge;
  const next = nextProps.edge;

  return (
    prev.id === next.id &&
    prev.startPosition[0] === next.startPosition[0] &&
    prev.startPosition[1] === next.startPosition[1] &&
    prev.startPosition[2] === next.startPosition[2] &&
    prev.endPosition[0] === next.endPosition[0] &&
    prev.endPosition[1] === next.endPosition[1] &&
    prev.endPosition[2] === next.endPosition[2] &&
    prev.color === next.color &&
    prev.opacity === next.opacity
  );
});

/**
 * MapRenderer component - Renders the map based on data from MapStore
 * This component is responsible for displaying edges and nodes from the store
 */
const MapRenderer: React.FC = () => {
  const { edges } = useMapStore();

  return (
    <group>
      {/* Render all edges from store with memoization */}
      {edges.map((edge) => (
        <MemoizedEdge key={edge.id} edge={edge} />
      ))}

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
