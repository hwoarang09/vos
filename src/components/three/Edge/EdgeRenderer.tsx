import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import edgeVertexShader from './shaders/edgeVertex.glsl?raw';
import edgeFragmentShader from './shaders/edgeFragment.glsl?raw';

interface EdgeProps {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  color?: string;
  opacity?: number;
}

const EdgeRenderer: React.FC<EdgeProps> = ({
  startPosition,
  endPosition,
  color = '#00ff00',
  opacity = 1.0
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate edge properties
  const { geometry, length } = useMemo(() => {
    const start = new THREE.Vector3(...startPosition);
    const end = new THREE.Vector3(...endPosition);
    const length = start.distanceTo(end);

    // Create a simple line geometry
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);

    // Position the cylinder between start and end points
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    geometry.translate(midPoint.x, midPoint.y, midPoint.z);

    // Rotate to align with the direction
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    geometry.applyQuaternion(quaternion);

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
        uOpacity: { value: opacity }
      },
      transparent: true,
    });
  }, [length, color, opacity]);

  // Update time uniform for animation
  useFrame((state) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
};

export default EdgeRenderer;