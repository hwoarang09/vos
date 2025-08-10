// NodeInstance.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNodeStore } from '../../../store/nodeStore';
import nodeVertexShader from './shaders/nodeVertex.glsl?raw';
import nodeFragmentShader from './shaders/nodeFragment.glsl?raw';

interface NodeInstanceProps {
  nodeId: string;
}

/**
 * High-performance node renderer for a single node.
 * - Subscribes to the specific node in Zustand and updates refs only (no React re-render)
 * - Geometry and material are created once and reused
 * - Per-frame transforms/uniforms are updated in useFrame
 */
const NodeInstance: React.FC<NodeInstanceProps> = ({ nodeId }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Store latest node props in refs (position, size, color)
  const posRef = useRef(new THREE.Vector3());
  const sizeRef = useRef(1);
  const colorRef = useRef(new THREE.Color('#ff6b6b'));

  // Create once
  const geometry = useMemo(() => new THREE.SphereGeometry(1.0, 16, 16), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: colorRef.current.clone() },
          uOpacity: { value: 1.0 },
          uSize: { value: 0.1 },
          uIsPreview: { value: 0.0 },
        },
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
        blending: THREE.NormalBlending,
      }),
    []
  );

  // Subscribe to node updates without causing React re-renders
  useEffect(() => {
    // Initialize from current state
    const n = useNodeStore.getState().getNodeById(nodeId);
    if (n) {
      posRef.current.set(n.x, n.y, n.z);
      sizeRef.current = n.size ?? 1;
      colorRef.current.set(n.color ?? '#ff6b6b');
      (material.uniforms.uColor as any).value = colorRef.current;
      (material.uniforms.uSize as any).value = sizeRef.current;
    }

    const unsub = useNodeStore.subscribe((state) => {
      const node = state.getNodeById(nodeId);
      if (!node) return;

      posRef.current.set(node.x, node.y, node.z);
      const newSize = node.size ?? 1;
      if (newSize !== sizeRef.current) {
        sizeRef.current = newSize;
        (material.uniforms.uSize as any).value = newSize;
        console.log(`NodeInstance ${nodeId}: uSize updated to ${newSize}`);
      }
      const newColor = node.color ?? '#ff6b6b';
      if (!colorRef.current.equals(new THREE.Color(newColor))) {
        colorRef.current.set(newColor);
        (material.uniforms.uColor as any).value = colorRef.current;
      }
    });
    return unsub;
  }, [nodeId, material]);

  // Per-frame updates: position/scale and time uniform
  useFrame((state) => {
    (material.uniforms.uTime as any).value = state.clock.elapsedTime;

    const m = meshRef.current;
    if (!m) return;

    // Set transform from refs
    const p = posRef.current;
    m.position.set(p.x, p.y, p.z);
    const s = sizeRef.current;
    m.scale.set(s, s, s);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

export default NodeInstance;

