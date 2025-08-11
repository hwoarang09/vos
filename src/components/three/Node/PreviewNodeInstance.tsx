// PreviewNodeInstance.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNodeStore } from '../../../store/nodeStore';
import nodeVertexShader from './shaders/nodeVertex.glsl?raw';
import nodeFragmentShader from './shaders/nodeFragment.glsl?raw';

interface Props {
  size?: number; // base size for preview nodes
  opacity?: number;
}

/**
 * Render up to two preview nodes (start=end index 0, end=index 1) without React re-renders.
 * - Shared geometry
 * - Separate materials (so color/size can differ per node)
 * - Per-frame transform/uniform updates
 */
const PreviewNodeInstance: React.FC<Props> = ({
  size = 0.1, // shrink more than half
  opacity = 0.9,
}) => {
  const meshRefA = useRef<THREE.Mesh>(null);
  const meshRefB = useRef<THREE.Mesh>(null);

  const prevA = useRef({ x: NaN, y: NaN, z: NaN, size: NaN, color: '' });
  const prevB = useRef({ x: NaN, y: NaN, z: NaN, size: NaN, color: '' });

  // Colors: from-node (A) = blue, to-node (B) = green
  const FROM_BLUE = '#1e90ff';
  const TO_GREEN = '#22c55e';

  // Create once
  const geometry = useMemo(() => new THREE.SphereGeometry(1.0, 16, 16), []);
  const materialA = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(FROM_BLUE) },
          uOpacity: { value: opacity },
          uSize: { value: size },
          uIsPreview: { value: 1.0 },
        },
        transparent: true,
        side: THREE.FrontSide,
      }),
    [opacity, size]
  );
  const materialB = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(TO_GREEN) },
          uOpacity: { value: opacity },
          uSize: { value: size },
          uIsPreview: { value: 1.0 },
        },
        transparent: true,
        side: THREE.FrontSide,
      }),
    [opacity, size]
  );

  useFrame((state) => {
    (materialA.uniforms.uTime as any).value = state.clock.elapsedTime;
    (materialB.uniforms.uTime as any).value = state.clock.elapsedTime;

    const { previewNodes } = useNodeStore.getState();

    // Node A (index 0) - FROM (blue)
    const mA = meshRefA.current;
    if (!mA || previewNodes.length < 1) {
      if (mA) mA.visible = false;
    } else {
      const n = previewNodes[0];
      const x = n.x, y = n.y, z = n.z;
      const s = n.size ?? size;
      const c = FROM_BLUE;

      const p = prevA.current;
      const changed = x !== p.x || y !== p.y || z !== p.z || s !== p.size || c !== p.color;
      if (changed) {
        p.x = x; p.y = y; p.z = z; p.size = s; p.color = c;
        mA.position.set(x, y, z);
        mA.scale.set(s, s, s);
        (materialA.uniforms.uSize as any).value = s;
        (materialA.uniforms.uColor as any).value = new THREE.Color(c);
      }
      mA.visible = true;
    }

    // Node B (index 1) - TO (green)
    const mB = meshRefB.current;
    if (!mB || previewNodes.length < 2) {
      if (mB) mB.visible = false;
    } else {
      const n = previewNodes[1];
      const x = n.x, y = n.y, z = n.z;
      const s = n.size ?? size;
      const c = TO_GREEN;

      const p = prevB.current;
      const changed = x !== p.x || y !== p.y || z !== p.z || s !== p.size || c !== p.color;
      if (changed) {
        p.x = x; p.y = y; p.z = z; p.size = s; p.color = c;
        mB.position.set(x, y, z);
        mB.scale.set(s, s, s);
        (materialB.uniforms.uSize as any).value = s;
        (materialB.uniforms.uColor as any).value = new THREE.Color(c);
      }
      mB.visible = true;
    }
  });

  return (
    <group>
      <mesh ref={meshRefA} geometry={geometry} material={materialA} />
      <mesh ref={meshRefB} geometry={geometry} material={materialB} />
    </group>
  );
};

export default PreviewNodeInstance;

