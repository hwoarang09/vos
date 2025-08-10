// EdgeInstance.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useNodeStore } from '../../../store/nodeStore';
import edgeVertexShader from './shaders/edgeVertex.glsl?raw';
import edgeFragmentShader from './shaders/edgeFragment.glsl?raw';

interface EdgeInstanceProps {
  fromNodeId: string;
  toNodeId: string;
  color?: string;
  opacity?: number;
  mode?: 'normal' | 'preview';
  width?: number; // 도로 폭
}

const Z_ELEVATION = 30;

export const EdgeInstance: React.FC<EdgeInstanceProps> = ({
  fromNodeId,
  toNodeId,
  color = '#00ff00',
  opacity = 1,
  mode = 'normal',
  width = 0.5,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 노드 좌표는 ref에 저장해서 리렌더 없이 갱신
  const startRef = useRef(new THREE.Vector3());
  const endRef   = useRef(new THREE.Vector3());

  // 최초 1회용 geometry/material
  const geometry = useMemo(() => {
    // 길이 1, 폭 width인 X축 정렬 Plane (중앙이 원점)
    const g = new THREE.PlaneGeometry(1, width);
    // 이미 X축을 따라 놓고, 노멀은 +Z
    return g;
  }, [width]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: edgeVertexShader,
      fragmentShader: edgeFragmentShader,
      uniforms: {
        uTime:    { value: 0 },
        uLength:  { value: 1 }, // 매 프레임 갱신
        uColor:   { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uIsPreview: { value: mode === 'preview' ? 1.0 : 0.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [color, opacity, mode]);

  // 두 노드만 selector로 구독 → ref에만 저장 (리렌더 X)
  useEffect(() => {
    // 안전하게 초기화 1회
    const s = useNodeStore.getState().getNodeById(fromNodeId);
    const e = useNodeStore.getState().getNodeById(toNodeId);
    if (s) startRef.current.set(s.x, s.y, Z_ELEVATION);
    if (e) endRef.current.set(e.x, e.y, Z_ELEVATION);

    const unsub = useNodeStore.subscribe(
      (st) => {
        const s2 = st.getNodeById(fromNodeId);
        const e2 = st.getNodeById(toNodeId);
        return {
          sx: s2?.x, sy: s2?.y, sz: s2?.z,
          ex: e2?.x, ey: e2?.y, ez: e2?.z,
        };
      },
      (p) => {
        if (p.sx != null && p.sy != null)
          startRef.current.set(p.sx, p.sy, Z_ELEVATION); // z는 고정
        if (p.ex != null && p.ey != null)
          endRef.current.set(p.ex, p.ey, Z_ELEVATION);
        // 여기서 setState 없음 → 컴포넌트 리렌더 안 됨
      }
    );
    return unsub;
  }, [fromNodeId, toNodeId]);

  // 매 프레임: transform만 갱신
  const tmpDir = useRef(new THREE.Vector3());
  useFrame((state) => {
    // 시간 유니폼
    (material.uniforms.uTime as any).value = state.clock.elapsedTime;

    const start = startRef.current;
    const end   = endRef.current;

    // 방향/길이
    const dir = tmpDir.current.subVectors(end, start);
    dir.z = 0; // XY 평면
    const length = dir.length();
    if (length < 1e-6) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    if (meshRef.current && !meshRef.current.visible) meshRef.current.visible = true;

    // 위치(중점), 회전(Z), 길이는 scale.x로
    const midX = (start.x + end.x) * 0.5;
    const midY = (start.y + end.y) * 0.5;

    const angleZ = Math.atan2(dir.y, dir.x);

    const m = meshRef.current!;
    m.position.set(midX, midY, Z_ELEVATION);
    m.rotation.set(0, 0, angleZ);
    m.scale.set(length, 1, 1);

    // 셰이더 길이 유니폼 갱신 (스트라이프/대시용)
    (material.uniforms.uLength as any).value = length;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};