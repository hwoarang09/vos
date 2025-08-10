import React from 'react';
import { NodeData, useNodeStore } from '../../../store/nodeStore';
import NodeInstance from './NodeInstance';
import PreviewNodeInstance from './PreviewNodeInstance';

interface NodeRendererProps {
  nodes: NodeData[];
}

/**
 * NodeRenderer: non-generic, edge-like implementation.
 * - Renders actual nodes via NodeInstance (each subscribes to its own data)
 * - Renders a PreviewNodeInstance for live preview without React re-renders
 */
const NodeRenderer: React.FC<NodeRendererProps> = ({ nodes }) => {
  // Do not include previewNodes here; PreviewNodeInstance handles that live.
  const { previewNodes } = useNodeStore();
  const previewActive = previewNodes.length > 0;

  return (
    <group>
      {nodes
        .filter((n) => !previewNodes.some((p) => p.id === n.id))
        .map((n) => (
          <NodeInstance key={n.id} nodeId={n.id} />
        ))}

      {previewActive && <PreviewNodeInstance />}
    </group>
  );
};

export default NodeRenderer;