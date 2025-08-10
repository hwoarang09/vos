<<<<<<< HEAD
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
=======
// components/react/edges/EdgeRenderer.tsx
import React from 'react';
import { EdgeData, useMapStore } from '../../../store/edgeStore';
import { EdgeInstance } from './EdgeInstance';
import PreviewEdgeInstance from './PreviewEdgeInstance';

>>>>>>> 54b4257 (version 0.0.25, previewedge 성능 완성)
interface EdgeRendererProps {
  edges: EdgeData[];
}

<<<<<<< HEAD
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
=======
const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edges }) => {
  // 프리뷰가 활성화됐는지 / 스타일값 가져오기
  const previewEdge = useMapStore((s) => s.previewEdge);

  return (
    <group>
      {/* 실제 엣지들: 트랜스폼은 EdgeInstance 내부에서 useFrame + subscribe로 갱신 */}
      {edges.map((edge) => (
        <EdgeInstance
          key={edge.id}
          fromNodeId={edge.fromNode}
          toNodeId={edge.toNode}
          color={edge.color}
          opacity={edge.opacity}
          mode={edge.mode}
          width={0.5}
        />
      ))}

      {/* 프리뷰 엣지: previewNodes를 useFrame에서 직접 읽어 트랜스폼 갱신 */}
      {previewEdge && (
        <PreviewEdgeInstance
          color={previewEdge.color ?? '#ffff00'}
          opacity={previewEdge.opacity ?? 0.7}
          width={0.5}
          z={30}
        />
      )}
    </group>
>>>>>>> 54b4257 (version 0.0.25, previewedge 성능 완성)
  );

  return <GenericRenderer config={config} />;
};

export default EdgeRenderer;
