import React, { useRef, useLayoutEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ColorChange {
  index: number;
  color: string | THREE.Color;
}

interface GridSquaresProps {
  rows?: number;
  cols?: number;
  spacing?: number;
  size?: number;
  z?: number;
  highlighted?: number[];
  colorChanges?: ColorChange[]; // 색상 변경할 인덱스와 색상 배열
}

export function GridSquares({
  rows = 10,
  cols = 10,
  spacing = 1.2,
  size = 1,
  z = 5,
  highlighted = [0, 5, 12, 33, 44, 55, 66, 77, 88, 99],
  colorChanges = [],
}: GridSquaresProps) {
  const count = rows * cols;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 색상 배열을 계산 (highlighted + colorChanges 반영)
  const colors = useMemo(() => {
    const c = new THREE.Color();
    const red = new THREE.Color("#ff3b30");
    const gray = new THREE.Color("#7f8c8d");
    const highlightSet = new Set(highlighted);

    // colorChanges를 Map으로 변환 (빠른 lookup)
    const colorChangeMap = new Map(
      colorChanges.map((change) => [
        change.index,
        new THREE.Color(change.color),
      ])
    );

    return new Float32Array(
      Array.from({ length: count }, (_, i) => {
        // 우선순위: colorChanges > highlighted > 기본(gray)
        if (colorChangeMap.has(i)) {
          c.copy(colorChangeMap.get(i)!);
        } else if (highlightSet.has(i)) {
          c.copy(red);
        } else {
          c.copy(gray);
        }
        return c.toArray();
      }).flat()
    );
  }, [count, highlighted, colorChanges]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    let idx = 0;
    const xStart = -((cols - 1) * spacing) / 2;
    const yStart = -((rows - 1) * spacing) / 2;

    // 각 인스턴스의 위치 설정
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = xStart + c * spacing;
        const y = yStart + r * spacing;

        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        idx++;
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [rows, cols, spacing, z, count]);

  useFrame(() => {
    // 필요시 애니메이션 로직 추가
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[size, size, 0.05]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </boxGeometry>
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}
