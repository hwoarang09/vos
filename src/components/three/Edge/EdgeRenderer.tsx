// components/react/edges/EdgeRenderer.tsx
import React from 'react';
import { EdgeData, useMapStore } from '../../../store/edgeStore';
import { EdgeInstance } from './EdgeInstance';
import PreviewEdgeInstance from './PreviewEdgeInstance';

interface EdgeRendererProps {
  edges: EdgeData[];
}

const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edges }) => {
  // 프리뷰가 활성화됐는지 / 스타일값 가져오기
  const previewEdge = useMapStore((s) => s.previewEdge);

  return (
    <group>
      {/* 실제 엣지들: 트랜스폼은 EdgeInstance 내부에서 useFrame + subscribe로 갱신 */}
      {/* Preview mode edges are handled separately by PreviewEdgeInstance */}
      {edges
        .filter((edge) => edge.mode !== 'preview')
        .map((edge) => (
          <EdgeInstance
            key={edge.id}
            fromNodeId={edge.fromNode}
            toNodeId={edge.toNode}
            color={edge.color}
            opacity={edge.opacity}
            mode={edge.mode}
            width={0.25}
          />
        ))}

      {/* 프리뷰 엣지: previewNodes를 useFrame에서 직접 읽어 트랜스폼 갱신 */}
      {previewEdge && (
        <PreviewEdgeInstance
          color={previewEdge.color ?? '#1e90ff'}
          opacity={previewEdge.opacity ?? 0.9}
          width={0.25}
          z={30.1}
        />
      )}
    </group>
  );

};

export default EdgeRenderer;
