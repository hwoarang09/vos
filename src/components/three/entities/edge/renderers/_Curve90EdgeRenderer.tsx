// Curve90EdgeRenderer.tsx - InstancedMesh 버전
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
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const segmentCount = Math.max(0, renderingPoints.length - 1);

  // 기본 geometry (한 번만 생성)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  // 셰이더 머티리얼 (한 번만 생성)
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
      depthTest: true,
      depthWrite: true,
      depthFunc: THREE.LessEqualDepth,
    });
  }, [color, opacity, isPreview]);

  // 인스턴스 행렬 계산 및 적용
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;

    // // renderOrder 설정
    // mesh.renderOrder = renderOrder;

    // 점이 충분하지 않으면 숨기기
    if (segmentCount <= 0) {
      mesh.visible = false;
      return;
    }

    // 변환 행렬 계산용 임시 변수들
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    // 각 세그먼트에 대한 변환 행렬 계산
    for (let i = 0; i < segmentCount; i++) {
      const start = renderingPoints[i];
      const end = renderingPoints[i + 1];

      // 중심점 계산
      const centerX = (start.x + end.x) / 2;
      const centerY = (start.y + end.y) / 2;
      const centerZ = (start.z + end.z) / 2;

      // 길이와 각도 계산
      const length = start.distanceTo(end);
      const angle = Math.atan2(end.y - start.y, end.x - start.x);

      // 변환 설정 (기존 코드와 동일하게 length * 2 사용)
      position.set(centerX, centerY, centerZ);
      euler.set(0, 0, angle);
      quaternion.setFromEuler(euler);
      scale.set(length * 2, width, 1);

      // 행렬 생성 및 인스턴스에 적용
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(i, matrix);
    }

    // GPU에 인스턴스 행렬 업데이트 알림
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = true;
  }, [renderingPoints, width, segmentCount, renderOrder]);

  // 셰이더 애니메이션 업데이트 (모든 인스턴스에 공통 적용)
  useFrame((state) => {
    if (shaderMaterial.uniforms.uTime) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // segmentCount가 0이면 아무것도 렌더링하지 않음
  if (segmentCount <= 0) {
    return null;
  }

  return (
    <instancedMesh
      key={segmentCount} // segmentCount 변경 시 재생성
      ref={instancedMeshRef}
      args={[geometry, shaderMaterial, segmentCount]}
      frustumCulled={false} // 성능을 위해 frustum culling 비활성화
    />
  );
};
