import React from 'react';
import { NodeData } from '../../../store/nodeStore';
import GenericRenderer from '../common/GenericRenderer';
import { createNodeRendererConfig } from '../hooks/useRenderer';
import nodeVertexShader from './shaders/nodeVertex.glsl?raw';
import nodeFragmentShader from './shaders/nodeFragment.glsl?raw';

// Props for the NodeRenderer container component
interface NodeRendererProps {
  nodes: NodeData[];
}

/**
 * NodeRenderer container component that renders multiple nodes
 * Uses the generic renderer with node-specific configuration
 */
const NodeRenderer: React.FC<NodeRendererProps> = ({ nodes }) => {
  const config = createNodeRendererConfig(
    nodes,
    nodeVertexShader,
    nodeFragmentShader
  );

  return <GenericRenderer config={config} />;
};

export default NodeRenderer;