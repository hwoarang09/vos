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

const EdgeRenderer: React.FC<EdgeProps> = React.memo(({
  startPosition,
  endPosition,
  color = '#00ff00',
  opacity = 1.0
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

    // Position the plane between start and end points (z = 30)
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    geometry.translate(midPoint.x, midPoint.y, 30);

    // Rotate to align with the direction in XY plane only
    // The plane normal should point towards +Z axis
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    // Project direction to XY plane (z=0)
    direction.z = 0;
    direction.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(right, direction);
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
      side: THREE.DoubleSide, // 양면 렌더링
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
});

export default EdgeRenderer;