import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RENDER_ORDER_TEXT } from "@/utils/renderOrder";

type BillboardMode = "screen" | "spherical";

// Group data structure for text rendering
export interface TextGroup {
  x: number;
  y: number;
  z: number;
  digits: number[]; // Array of character indices (0-9=digits, 10=N, 11=E)
}

type Props = {
  // New props for groups-based rendering
  groups?: TextGroup[];
  scale?: number;

  // Legacy props (for backward compatibility)
  width?: number;
  height?: number;
  rows?: number;
  cols?: number; // 100x100 => 10,000개
  digits?: number; // 기본 4 (0000~9999)
  z?: number;
  charScale?: number; // 문자 높이 = min(cellW,cellH)*charScale
  charSpacing?: number; // 문자 간격(문자높이 배수)
  font?: string;
  color?: string;
  bgColor?: string;
  mode?: BillboardMode; // "screen" | "spherical"
};

export default function NumberGridInstanced({
  // New props
  groups = [],
  scale = 1.0,

  // Legacy props (with defaults)
  width = 200,
  height = 200,
  rows = 100,
  cols = 100,
  digits = 4,
  z = 1,
  charScale = 0.2,
  charSpacing = 2.1,
  font = "bold 96px system-ui, Roboto, Arial",
  color = "#ffffff",
  bgColor = "transparent",
  mode = "spherical",
}: Props) {
  const { camera } = useThree();

  // 0~9, N, E 텍스처 12개
  const digitMaterials = useMemo(() => {
    const characters = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "N",
      "E",
    ];

    const make = (char: string) => {
      const S = 256;
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, S, S);
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, S, S);
      }
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, S / 2, S / 2, S * 0.9);

      const tex = new THREE.Texture(c);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;

      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
    };
    return characters.map((char) => make(char));
  }, [font, color, bgColor]);

  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  /** ---------------- Groups 기반 데이터 구성 ---------------- */
  const dataRef = useRef<{
    // 총 문자 개수 (모든 그룹의 모든 문자)
    totalCharacters: number;
    // 각 문자별 인스턴스 개수 (0-9, N, E)
    counts: number[];
    // 각 문자의 슬롯 인덱스 매핑
    slotIndex: Int32Array;
    // 각 문자의 문자 타입 (0-11)
    slotDigit: Int8Array;
    // 각 문자의 그룹 인덱스
    slotGroup: Int32Array;
    // 각 문자의 그룹 내 위치 인덱스
    slotPosition: Int32Array;
  } | null>(null);

  // Groups 기반 데이터 셋업
  useEffect(() => {
    if (!groups || groups.length === 0) {
      dataRef.current = null;
      return;
    }

    // 총 문자 개수 계산
    let totalCharacters = 0;
    groups.forEach((group) => {
      totalCharacters += group.digits.length;
    });

    // 각 문자별 개수 계산 (0-9, N, E)
    const counts = new Array(12).fill(0);
    const slotDigit = new Int8Array(totalCharacters);
    const slotGroup = new Int32Array(totalCharacters);
    const slotPosition = new Int32Array(totalCharacters);

    let charIndex = 0;
    groups.forEach((group, groupIndex) => {
      group.digits.forEach((digit, positionIndex) => {
        // 유효한 문자 인덱스인지 확인 (0-11)
        const validDigit = Math.max(0, Math.min(11, digit));

        slotDigit[charIndex] = validDigit;
        slotGroup[charIndex] = groupIndex;
        slotPosition[charIndex] = positionIndex;
        counts[validDigit]++;
        charIndex++;
      });
    });

    // 슬롯 인덱스 매핑
    const slotIndex = new Int32Array(totalCharacters);
    const currentSlot = new Array(12).fill(0);

    for (let i = 0; i < totalCharacters; i++) {
      const digit = slotDigit[i];
      slotIndex[i] = currentSlot[digit];
      currentSlot[digit]++;
    }

    dataRef.current = {
      totalCharacters,
      counts,
      slotIndex,
      slotDigit,
      slotGroup,
      slotPosition,
    };

    // 디버깅: counts 출력
    if (groups && groups.length > 0) {
      console.log("Groups:", groups.length, "groups");
      console.log("Character counts:", counts);
      console.log("Total characters:", totalCharacters);
    }
  }, [groups]);

  /** ---------------- InstancedMesh 생성(문자별) ---------------- */
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(12).fill(null));

  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || !groups || groups.length === 0) {
      // 데이터가 없으면 빈 배열 반환
      return [];
    }

    const { counts } = data;
    console.log("Creating meshes with counts:", counts);

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, counts[d]);
      return (
        <instancedMesh
          key={`digit-${d}-${cnt}`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, cnt]}
          frustumCulled={false}
          renderOrder={RENDER_ORDER_TEXT}
        />
      );
    });
  }, [digitMaterials, quad, dataRef.current?.counts, groups]);

  // InstancedMesh 카운트 업데이트
  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    const { counts } = data;
    for (let d = 0; d < 12; d++) {
      const mesh = instRefs.current[d];
      if (mesh && counts[d] > 0) {
        mesh.count = counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

  /** ---------------- Groups 기반 초기 배치 ---------------- */
  useEffect(() => {
    const D = dataRef.current;
    if (!D || !groups || groups.length === 0) return;

    console.log("Initial placement starting...");

    const { slotDigit, slotIndex } = D;
    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.2 * scale;

    // 각 그룹별로 처리
    groups.forEach((group, groupIndex) => {
      // Y축 회전만 적용 (기본 정면 방향)
      const q = new THREE.Quaternion(); // 기본 회전 (정면)

      group.digits.forEach((_, positionIndex) => {
        // 해당 문자의 전역 인덱스 찾기
        let charIndex = 0;
        for (let gi = 0; gi < groupIndex; gi++) {
          charIndex += groups[gi].digits.length;
        }
        charIndex += positionIndex;

        const d = slotDigit[charIndex];
        const slot = slotIndex[charIndex];
        const mesh = instRefs.current[d];
        if (!mesh) return;

        // 그룹 내에서의 상대 위치 계산 (중앙 정렬)
        const offsetX =
          (positionIndex - (group.digits.length - 1) / 2) * charSpacing;

        const pos = new THREE.Vector3(
          group.x + offsetX,
          group.y,
          group.z + 0.5 // z + 0.5
        );

        m.compose(pos, q, s);
        mesh.setMatrixAt(slot, m);
      });
    });

    instRefs.current.forEach(
      (msh) => msh && (msh.instanceMatrix.needsUpdate = true)
    );

    console.log("Initial placement completed");
  }, [groups, scale, dataRef.current]);

  /** ---------------- Groups 기반 빌보드 렌더링 (수정됨) ---------------- */
  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D || !groups) return;

    const { slotDigit, slotIndex } = D;

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, 1);
    const charSpacing = 0.2 * scale;

    // 각 그룹별로 처리
    groups.forEach((group, groupIndex) => {
      const groupCenter = new THREE.Vector3(group.x, group.y, group.z);

      // 1. 카메라로부터 그룹 중심으로의 방향 벡터 계산
      const lookDirection = new THREE.Vector3()
        .subVectors(camera.position, groupCenter)
        .normalize();

      // 2. 빌보드 회전 계산 - lookAt과 동일한 효과
      // Z축을 up 벡터로 사용하여 회전 행렬 생성
      const upVector = new THREE.Vector3(0, 0, 1);

      // Look direction을 기준으로 회전 행렬 생성
      const matrix = new THREE.Matrix4().lookAt(
        new THREE.Vector3(0, 0, 0), // 원점에서
        lookDirection.clone().negate(), // 카메라 방향의 반대 (카메라를 향하도록)
        upVector
      );

      // 회전 행렬에서 쿼터니언 추출
      const groupBillboardRotation =
        new THREE.Quaternion().setFromRotationMatrix(matrix);

      // 3. 회전된 평면에서의 오른쪽 방향 벡터 (글자 배치용)
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        groupBillboardRotation
      );

      // 4. 그룹 내 각 문자 배치
      group.digits.forEach((_, positionIndex) => {
        // 해당 문자의 전역 인덱스 찾기
        let charIndex = 0;
        for (let gi = 0; gi < groupIndex; gi++) {
          charIndex += groups[gi].digits.length;
        }
        charIndex += positionIndex;

        const d = slotDigit[charIndex];
        const slot = slotIndex[charIndex];
        const mesh = instRefs.current[d];
        if (!mesh) return;

        // 5. 그룹 내에서의 상대 위치 계산 (중앙 정렬)
        const offsetX =
          (positionIndex - (group.digits.length - 1) / 2) * charSpacing;
        const offsetVector = right.clone().multiplyScalar(offsetX);

        // 6. 최종 위치 = 그룹 중심 + 평면 위 오프셋
        const finalPos = groupCenter.clone().add(offsetVector);
        finalPos.z += 0.5; // z offset

        // 10. 변환 행렬 구성 (위치 + 빌보드 회전 + 스케일)
        m.compose(finalPos, groupBillboardRotation, s);
        mesh.setMatrixAt(slot, m);
      });
    });

    instRefs.current.forEach(
      (msh) => msh && (msh.instanceMatrix.needsUpdate = true)
    );
  });

  return <group>{meshes}</group>;
}
