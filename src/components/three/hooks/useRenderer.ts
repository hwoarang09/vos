import { useMemo } from 'react';
import * as THREE from 'three';

// Generic renderer configuration interface
export interface RendererConfig<T> {
  // Data source
  data: T[];
  
  // Shader configuration
  vertexShader: string;
  fragmentShader: string;
  
  // Geometry creation function
  createGeometry: (item: T) => THREE.BufferGeometry;
  
  // Uniform creation function
  createUniforms: (item: T) => { [key: string]: THREE.IUniform };
  
  // Position extraction function
  getPosition: (item: T) => [number, number, number];
  
  // Comparison function for memoization
  compareItems: (prev: T, next: T) => boolean;
  
  // Optional material configuration
  materialConfig?: {
    transparent?: boolean;
    side?: THREE.Side;
    depthWrite?: boolean;
    blending?: THREE.Blending;
  };
}

// Generic renderer hook
export function useRenderer<T extends { id: string }>(config: RendererConfig<T>) {
  const { data, getPosition } = config;

  // Just return the configuration and data
  // Individual items will create their own geometry/material for better memoization
  const renderData = useMemo(() => {
    return data.map((item) => ({
      id: item.id,
      item,
      position: getPosition(item),
    }));
  }, [data, getPosition]);

  return {
    renderData,
  };
}

// Specific configurations for different renderer types
export const createNodeRendererConfig = (
  nodes: any[],
  vertexShader: string,
  fragmentShader: string
): RendererConfig<any> => ({
  data: nodes,
  vertexShader,
  fragmentShader,
  createGeometry: (node) => {
    const radius = (node.size || 1.0) * 0.5;
    return new THREE.SphereGeometry(radius, 16, 16);
  },
  createUniforms: (node) => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(node.color || '#ff6b6b') },
    uOpacity: { value: 1.0 },
    uSize: { value: node.size || 1.0 },
    uIsPreview: { value: 0.0 }
  }),
  getPosition: (node) => [node.x, node.y, node.z],
  compareItems: (prev, next) => (
    prev.id === next.id &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.z === next.z &&
    prev.color === next.color &&
    prev.size === next.size
  ),
});

export const createEdgeRendererConfig = (
  edges: any[],
  vertexShader: string,
  fragmentShader: string,
  getNodeById: (id: string) => any
): RendererConfig<any> => ({
  data: edges,
  vertexShader,
  fragmentShader,
  createGeometry: (edge) => {
    const fromNode = getNodeById(edge.fromNode);
    const toNode = getNodeById(edge.toNode);
    
    if (!fromNode || !toNode) {
      return new THREE.PlaneGeometry(0, 0); // Empty geometry for missing nodes
    }

    const start = new THREE.Vector3(fromNode.x, fromNode.y, 30);
    const end = new THREE.Vector3(toNode.x, toNode.y, 30);
    const length = start.distanceTo(end);

    const width = 0.5;
    const geometry = new THREE.PlaneGeometry(length, width);

    // Apply transformations
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    direction.z = 0;
    direction.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(right, direction);
    geometry.applyQuaternion(quaternion);

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    geometry.translate(midPoint.x, midPoint.y, 30);

    return geometry;
  },
  createUniforms: (edge) => {
    const fromNode = getNodeById(edge.fromNode);
    const toNode = getNodeById(edge.toNode);
    const length = fromNode && toNode ? 
      new THREE.Vector3(fromNode.x, fromNode.y, 30).distanceTo(
        new THREE.Vector3(toNode.x, toNode.y, 30)
      ) : 0;

    return {
      uTime: { value: 0 },
      uLength: { value: length },
      uColor: { value: new THREE.Color(edge.color || '#00ff00') },
      uOpacity: { value: edge.opacity || 1.0 },
      uIsPreview: { value: edge.mode === 'preview' ? 1.0 : 0.0 }
    };
  },
  getPosition: () => [0, 0, 0], // Position is handled in geometry
  compareItems: (prev, next) => (
    prev.id === next.id &&
    prev.fromNode === next.fromNode &&
    prev.toNode === next.toNode &&
    prev.color === next.color &&
    prev.opacity === next.opacity &&
    prev.mode === next.mode
  ),
  materialConfig: {
    side: THREE.DoubleSide,
  }
});
