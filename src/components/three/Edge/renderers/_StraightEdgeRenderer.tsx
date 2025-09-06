// StraightEdgeRenderer.tsx - InstancedMesh 버전
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
  renderOrder?: number;
}

export const StraightEdgeRenderer: React.FC<StraightEdgeRendererProps> = ({
  renderingPoints = [],
  color = "#00ff00",
  opacity = 1,
  width = 0.5,
  isPreview = false,
  renderOrder = 1,
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // 직선은 항상 1개의 인스턴스만 필요
  const instanceCount = renderingPoints.length >= 2 ? 1 : 0;

  // 기본 geometry (한 번만 생성)
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

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
      depthTest: true,
      depthWrite: true,
      depthFunc: THREE.LessEqualDepth,
    });
  }, [color, opacity, isPreview]);

  // 인스턴스 행렬 계산 및 적용
  useEffect(() => {
    const mesh = instancedMeshRef.current;
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

    // 변환 행렬 계산용 임시 변수들
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const euler = new THREE.Euler();

    // 변환 설정
    position.set(centerX, centerY, centerZ);
    euler.set(0, 0, angle);
    quaternion.setFromEuler(euler);
    scale.set(length, width, 1);

    // 행렬 생성 및 인스턴스에 적용
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(0, matrix);

    // GPU에 인스턴스 행렬 업데이트 알림
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = true;
  }, [renderingPoints, width, renderOrder]);

  // 셰이더 애니메이션 업데이트 (모든 인스턴스에 공통 적용)
  useFrame((state) => {
    if (shaderMaterial.uniforms.uTime) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // instanceCount가 0이면 아무것도 렌더링하지 않음
  if (instanceCount <= 0) {
    return null;
  }

  return (
    <instancedMesh
      key={instanceCount} // instanceCount 변경 시 재생성
      ref={instancedMeshRef}
      args={[geometry, shaderMaterial, instanceCount]}
      frustumCulled={false} // 성능을 위해 frustum culling 비활성화
    />
  );
};
