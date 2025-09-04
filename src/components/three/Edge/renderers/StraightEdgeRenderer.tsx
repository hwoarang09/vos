// StraightEdgeRenderer.tsx - 단순히 점들을 받아서 직선으로 렌더링
import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import edgeVertexShader from "../shaders/edgeVertex.glsl?raw";
import edgeFragmentShader from "../shaders/edgeFragment.glsl?raw";

interface StraightEdgeRendererProps {
  renderingPoints: THREE.Vector3[];
  color?: string;
  opacity?: number;
  width?: number;
  isPreview?: boolean;
}

export const StraightEdgeRenderer: React.FC<StraightEdgeRendererProps> = ({
  renderingPoints = [],
  color = "#00ff00",
  opacity = 1,
  width = 0.5,
  isPreview = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  console.log(
    `StraightEdgeRenderer: ${renderingPoints.length}개 점, isPreview: ${isPreview}`
  );

  // 셰이더 머티리얼 생성
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uIsPreview: { value: isPreview ? 1.0 : 0.0 },
        uLength: { value: 1.0 },
      },
      vertexShader: edgeVertexShader,
      fragmentShader: edgeFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [color, opacity, isPreview]);

  // 직선 렌더링
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // 점 데이터 검증 (직선은 최소 2개 점 필요)
    if (!renderingPoints || renderingPoints.length < 2) {
      mesh.visible = false;
      return;
    }

    // 첫 번째와 마지막 점을 사용해서 직선 그리기
    const startPos = renderingPoints[0];
    const endPos = renderingPoints[renderingPoints.length - 1];

    // 중심점과 길이 계산
    const centerX = (startPos.x + endPos.x) / 2;
    const centerY = (startPos.y + endPos.y) / 2;
    const centerZ = (startPos.z + endPos.z) / 2;

    const length = startPos.distanceTo(endPos);
    const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);

    // 길이가 너무 작으면 숨김
    if (length < 0.01) {
      mesh.visible = false;
      return;
    }

    // mesh 변형 적용
    mesh.position.set(centerX, centerY, centerZ);
    mesh.rotation.set(0, 0, angle);
    mesh.scale.set(length, width, 1);
    mesh.visible = true;

    // 셰이더 uniform 업데이트
    if (mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.uniforms.uLength.value = length;
    }

    console.log(`직선 렌더링 완료: 길이 ${length.toFixed(2)}`);
  }, [renderingPoints, width]);

  // 셰이더 애니메이션 업데이트
  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
};
