import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EdgeData } from '../../../store/edgeStore';
import { useNodeStore } from '../../../store/nodeStore';
import edgeVertexShader from './shaders/edgeVertex.glsl?raw';
import edgeFragmentShader from './shaders/edgeFragment.glsl?raw';

interface SingleEdgeProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  color?: string;
  opacity?: number;
  mode?: 'normal' | 'preview';
}

const SingleEdge: React.FC<SingleEdgeProps> = React.memo(({
  startPosition,
  endPosition,
  color = '#00ff00',
  opacity = 1.0,
  mode = 'normal'
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate edge properties
  const { geometry, length } = useMemo(() => {
    // Force z-coordinate to be 30 for both start and end points
    const start = new THREE.Vector3(startPosition[0], startPosition[1], 30);
    const end = new THREE.Vector3(endPosition[0], endPosition[1], 30);
    const length = start.distanceTo(end);

    // Create a rectangular plane geometry
    const width = 0.5; // Edge width
    const geometry = new THREE.PlaneGeometry(length, width);

    // First: Rotate to align with the direction in XY plane only
    // The plane normal should point towards +Z axis
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    // Project direction to XY plane (z=0)
    direction.z = 0;
    direction.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(right, direction);
    geometry.applyQuaternion(quaternion);

    // Second: Position the plane between start and end points (z = 30)
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    geometry.translate(midPoint.x, midPoint.y, 30);

    return { geometry, length };
  }, [startPosition, endPosition]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: edgeVertexShader,
      fragmentShader: edgeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uLength: { value: length },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uIsPreview: { value: mode === 'preview' ? 1.0 : 0.0 }
      },
      transparent: true,
      side: THREE.DoubleSide, // 양면 렌더링
    });
  }, [length, color, opacity, mode]);

  // Update time uniform for animation
  useFrame((state) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
});

// Props for the EdgeRenderer container component
interface EdgeRendererProps {
  edges: EdgeData[];
}

/**
 * Individual Edge component with memoization
 * Only re-renders when its specific edge data changes or node positions change
 */
const MemoizedEdge: React.FC<{ edge: EdgeData }> = React.memo(({ edge }) => {
  const { getNodeById } = useNodeStore();

  const fromNode = getNodeById(edge.fromNode);
  const toNode = getNodeById(edge.toNode);

  // If nodes don't exist, don't render the edge
  if (!fromNode || !toNode) {
    console.warn(`Edge ${edge.id}: Missing nodes - fromNode: ${edge.fromNode}, toNode: ${edge.toNode}`);
    return null;
  }

  return (
    <SingleEdge
      startPosition={[fromNode.x, fromNode.y, fromNode.z]}
      endPosition={[toNode.x, toNode.y, toNode.z]}
      color={edge.color}
      opacity={edge.opacity}
      mode={edge.mode}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - compare edge properties and node positions
  const prev = prevProps.edge;
  const next = nextProps.edge;

  // Get node store to compare node positions
  const nodeStore = useNodeStore.getState();
  const prevFromNode = nodeStore.getNodeById(prev.fromNode);
  const prevToNode = nodeStore.getNodeById(prev.toNode);
  const nextFromNode = nodeStore.getNodeById(next.fromNode);
  const nextToNode = nodeStore.getNodeById(next.toNode);

  return (
    prev.id === next.id &&
    prev.fromNode === next.fromNode &&
    prev.toNode === next.toNode &&
    prev.color === next.color &&
    prev.opacity === next.opacity &&
    prev.mode === next.mode &&
    // Compare node positions
    prevFromNode?.x === nextFromNode?.x &&
    prevFromNode?.y === nextFromNode?.y &&
    prevFromNode?.z === nextFromNode?.z &&
    prevToNode?.x === nextToNode?.x &&
    prevToNode?.y === nextToNode?.y &&
    prevToNode?.z === nextToNode?.z
  );
});

/**
 * EdgeRenderer container component that renders multiple edges
 */
const EdgeRenderer: React.FC<EdgeRendererProps> = ({ edges }) => {
  return (
    <group>
      {edges.map((edge) => (
        <MemoizedEdge key={edge.id} edge={edge} />
      ))}
    </group>
  );
};

export default EdgeRenderer;