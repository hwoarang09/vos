// PreviewEdgeInstance.tsx
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNodeStore } from '../../../store/nodeStore';
import edgeVertexShader from './shaders/edgeVertex.glsl?raw';
import edgeFragmentShader from './shaders/edgeFragment.glsl?raw';

interface Props {
  color?: string;
  opacity?: number;
  width?: number;
  z?: number;
}

const PreviewEdgeInstance: React.FC<Props> = ({
  color = '#ffff00',
  opacity = 0.7,
  width = 0.5,
  z = 30,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const prevRef = useRef({ sx: NaN, sy: NaN, ex: NaN, ey: NaN });

  // 한 번만 생성
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, width), [width]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: edgeVertexShader,
        fragmentShader: edgeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uLength: { value: 1 },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uIsPreview: { value: 1.0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [color, opacity]
  );

  useFrame((state) => {
    // 시간 유니폼
    (material.uniforms.uTime as any).value = state.clock.elapsedTime;

    // 매 프레임 Zustand에서 직접 읽기 — 리렌더/구독 불필요
    const { previewNodes } = useNodeStore.getState();
    const m = meshRef.current;
    if (!m || previewNodes.length < 2) {
      if (m) m.visible = false;
      return;
    }

    const s = previewNodes[0];
    const e = previewNodes[1];
    const sx = s.x, sy = s.y, ex = e.x, ey = e.y;

    // 값이 안 바뀌었으면 스킵 (불필요한 행렬 연산 방지)
    const p = prevRef.current;
    if (sx === p.sx && sy === p.sy && ex === p.ex && ey === p.ey) return;
    p.sx = sx; p.sy = sy; p.ex = ex; p.ey = ey;

    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.hypot(dx, dy);

    if (len < 1e-6) {
      m.visible = false;
      return;
    }

    const angle = Math.atan2(dy, dx);
    m.position.set((sx + ex) * 0.5, (sy + ey) * 0.5, z);
    m.rotation.set(0, 0, angle);
    m.scale.set(len, 1, 1);

    (material.uniforms.uLength as any).value = len;
    m.visible = true;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

export default PreviewEdgeInstance;