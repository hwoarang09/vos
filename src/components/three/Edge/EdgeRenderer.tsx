import React from 'react';
import { EdgeData } from '../../../store/edgeStore';
import { useNodeStore } from '../../../store/nodeStore';
import GenericRenderer from '../common/GenericRenderer';
import { createEdgeRendererConfig } from '../hooks/useRenderer';
import edgeVertexShader from './shaders/edgeVertex.glsl?raw';
import edgeFragmentShader from './shaders/edgeFragment.glsl?raw';

// Legacy SingleEdge component - now replaced by GenericRenderer
// Keeping for reference during transition

// Props for the EdgeRenderer container component
interface EdgeRendererProps {
  edges: EdgeData[];
}

// Legacy SingleEdge component kept for reference
// This will be replaced by the generic renderer approach

/**
 * EdgeRenderer container component that renders multiple edges
 * Uses the generic renderer with edge-specific configuration
 */
const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edges }) => {
  const { getNodeById } = useNodeStore();

  const config = createEdgeRendererConfig(
    edges,
    edgeVertexShader,
    edgeFragmentShader,
    getNodeById
  );

  return <GenericRenderer config={config} />;
};

export default EdgeRenderer;