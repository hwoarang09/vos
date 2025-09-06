// Curve90EdgeRenderer.tsx - 단순히 점들을 받아서 곡선으로 렌더링
import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import edgeVertexShader from "../shaders/edgeVertex.glsl?raw";
import edgeFragmentShader from "../shaders/edgeFragment.glsl?raw";

interface Curve90EdgeRendererProps {
  renderingPoints: THREE.Vector3[];
  color?: string;
  opacity?: number;
  width?: number;
  isPreview?: boolean;
  renderOrder?: number;
}

export const Curve90EdgeRenderer: React.FC<Curve90EdgeRendererProps> = ({
  renderingPoints = [],
  color = "#ff69b4",
  opacity = 1,
  width = 0.5,
  isPreview = false,
  renderOrder = 2,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const segmentRefs = useRef<THREE.Mesh[]>([]);

  console.log(
    `Curve90EdgeRenderer: ${renderingPoints.length} points, isPreview: ${isPreview}, renderOrder: ${renderOrder}`
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
      // Z-fighting 해결을 위한 설정 추가
      depthTest: true,
      depthWrite: true,
      depthFunc: THREE.LessEqualDepth, // 기본값이지만 명시적으로 설정
    });
  }, [color, opacity, isPreview]);

  // 직선 segment 업데이트 함수
  const updateSegment = (
    mesh: THREE.Mesh,
    start: THREE.Vector3,
    end: THREE.Vector3
  ) => {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const centerZ = (start.z + end.z) / 2;

    const length = start.distanceTo(end);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    mesh.position.set(centerX, centerY, centerZ);
    mesh.rotation.set(0, 0, angle);
    mesh.scale.set(length * 2, width, 1);
    mesh.visible = true;

    // 셰이더 uniform 업데이트
    if (mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.uniforms.uLength.value = length;
    }
  };

  // renderingPoints로 곡선 그리기
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // 점이 없으면 숨기기
    if (!renderingPoints || renderingPoints.length < 2) {
      group.visible = false;
      return;
    }

    // 기존 mesh들 정리
    segmentRefs.current.forEach((mesh) => {
      if (mesh) {
        group.remove(mesh);
        mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) {
          mesh.material.dispose();
        }
      }
    });
    segmentRefs.current = [];

    // 점들을 연결하는 직선 segments 생성
    for (let i = 0; i < renderingPoints.length - 1; i++) {
      const start = renderingPoints[i];
      const end = renderingPoints[i + 1];

      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = shaderMaterial.clone();
      const mesh = new THREE.Mesh(geometry, material);

      // renderOrder 설정 추가
      mesh.renderOrder = renderOrder;

      updateSegment(mesh, start, end);

      group.add(mesh);
      segmentRefs.current.push(mesh);
    }

    group.visible = true;
    console.log(`곡선 렌더링 완료: ${segmentRefs.current.length}개 세그먼트`);
  }, [renderingPoints, width, shaderMaterial, renderOrder]);

  // 셰이더 애니메이션 업데이트
  useFrame((state) => {
    segmentRefs.current.forEach((mesh) => {
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    });
  });

  return <group ref={groupRef} />;
};
