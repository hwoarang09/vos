import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

type BillboardMode = "screen" | "spherical";

type Props = {
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

  // 0~9 텍스처 10개
  const digitMaterials = useMemo(() => {
    const make = (d: number) => {
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
      ctx.fillText(String(d), S / 2, S / 2, S * 0.9);

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
    return Array.from({ length: 10 }, (_, d) => make(d));
  }, [font, color, bgColor]);

  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  /** ---------------- 라벨/인스턴스 구성 사전 계산 ---------------- */
  const dataRef = useRef<{
    // 라벨 개수 = rows*cols
    labelCount: number;
    // 라벨 중심점 (x,y,z) * labelCount - 전체 레이블의 중심
    labelCenter: Float32Array;
    // 자릿수 가로 오프셋 (digits개) - 레이블 중심 기준 상대 위치
    digitRelativeOffsetX: Float32Array;
    charH: number;
    // 숫자 d(0..9)의 인스턴스 개수
    counts: number[];
    // 라벨 i의 k번째 자릿수가 들어간 instancedMesh 슬롯 인덱스
    slotIndex: Int32Array; // 길이 = labelCount*digits
    // 라벨 i의 k번째 자릿수가 어떤 숫자인지
    slotDigit: Int8Array; // 길이 = labelCount*digits, 값 0..9
  } | null>(null);

  // 한 번 셋업: 모든 매핑/버퍼 채우기
  useEffect(() => {
    const total = rows * cols;
    const cellW = width / cols;
    const cellH = height / rows;
    const startX = -width / 2 + cellW / 2;
    const startY = height / 2 - cellH / 2;
    const charH = Math.min(cellW, cellH) * charScale;
    const stepX = charH * charSpacing;

    // 각 자릿수의 레이블 중심 기준 상대 오프셋 계산
    const digitRelativeOffsetX = new Float32Array(digits);
    const totalLabelWidth = (digits - 1) * stepX;
    const startOffset = -totalLabelWidth / 2;
    for (let k = 0; k < digits; k++) {
      digitRelativeOffsetX[k] = startOffset + k * stepX;
    }

    const counts = new Array(10).fill(0);

    // 1) 라벨 중심점 / 어떤 숫자인지
    const labelCenter = new Float32Array(total * 3);
    const slotDigit = new Int8Array(total * digits);

    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const centerX = startX + c * cellW;
      const centerY = startY - r * cellH;
      const p = i * 3;
      labelCenter[p + 0] = centerX;
      labelCenter[p + 1] = centerY;
      labelCenter[p + 2] = z;

      const s = i.toString().padStart(digits, "0");
      for (let k = 0; k < digits; k++) {
        const d = s.charCodeAt(k) - 48;
        slotDigit[i * digits + k] = d;
        counts[d]++;
      }
    }

    // 2) 숫자별 instancedMesh 슬롯 인덱스 부여
    const cursor = new Array(10).fill(0);
    const slotIndex = new Int32Array(total * digits);
    for (let i = 0; i < total; i++) {
      for (let k = 0; k < digits; k++) {
        const d = slotDigit[i * digits + k];
        slotIndex[i * digits + k] = cursor[d]++;
      }
    }

    dataRef.current = {
      labelCount: total,
      labelCenter,
      digitRelativeOffsetX,
      charH,
      counts,
      slotIndex,
      slotDigit,
    };
  }, [rows, cols, width, height, z, digits, charScale, charSpacing]);

  /** ---------------- InstancedMesh 생성(숫자별) ---------------- */
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(Array(10).fill(null));

  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data) {
      // 데이터가 없으면 기본값으로 생성
      return digitMaterials.map((mat, d) => (
        <instancedMesh
          key={`digit-${d}-1`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, 1]}
          frustumCulled={false}
        />
      ));
    }

    const { counts } = data;
    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, counts[d]);
      return (
        <instancedMesh
          key={`digit-${d}-${cnt}`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, cnt]}
          frustumCulled={false}
        />
      );
    });
  }, [digitMaterials, quad, dataRef.current?.counts]);

  // InstancedMesh 카운트 업데이트
  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    const { counts } = data;
    for (let d = 0; d < 10; d++) {
      const mesh = instRefs.current[d];
      if (mesh && counts[d] > 0) {
        mesh.count = counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

  /** ---------------- 초기 배치(회전 없이 XY평면) ---------------- */
  useEffect(() => {
    const D = dataRef.current;
    if (!D) return;
    const {
      labelCount,
      labelCenter,
      digitRelativeOffsetX,
      charH,
      slotDigit,
      slotIndex,
    } = D;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion(); // (0,0,0,1) - XY 평면
    const s = new THREE.Vector3(charH, charH, 1);

    for (let i = 0; i < labelCount; i++) {
      const p = i * 3;
      const centerX = labelCenter[p + 0];
      const centerY = labelCenter[p + 1];
      const centerZ = labelCenter[p + 2];

      // 레이블 i의 모든 자릿수에 동일한 회전 적용 (XY 평면 기준)
      for (let k = 0; k < digits; k++) {
        const d = slotDigit[i * digits + k];
        const slot = slotIndex[i * digits + k];
        const mesh = instRefs.current[d];
        if (!mesh) continue;

        // 레이블 중심 + X방향 오프셋 (XY 평면이므로 +X가 right)
        const pos = new THREE.Vector3(
          centerX + digitRelativeOffsetX[k],
          centerY,
          centerZ
        );
        m.compose(pos, q, s);
        mesh.setMatrixAt(slot, m);
      }
    }

    instRefs.current.forEach(
      (msh) => msh && (msh.instanceMatrix.needsUpdate = true)
    );
  }, [rows, cols, digits]);

  /** ---------------- 평면 기반 4글자 배치 ---------------- */
  /** ---------------- 평면 기반 4글자 배치 ---------------- */
  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D) return;
    const {
      labelCount,
      labelCenter,
      digitRelativeOffsetX,
      charH,
      slotDigit,
      slotIndex,
    } = D;

    const m = new THREE.Matrix4();
    const s = new THREE.Vector3(charH, charH, 1);

    // 카메라의 월드 변환 행렬에서 방향 벡터들 추출
    const cameraMatrix = camera.matrixWorld;
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(
      cameraMatrix,
      0
    ); // X축
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(cameraMatrix, 1); // Y축
    const cameraForward = new THREE.Vector3()
      .setFromMatrixColumn(cameraMatrix, 2)
      .negate(); // -Z축

    // 각 4글자 그룹별로 처리
    for (let i = 0; i < labelCount; i++) {
      const ip = i * 3;
      const groupCenter = new THREE.Vector3(
        labelCenter[ip],
        labelCenter[ip + 1],
        labelCenter[ip + 2]
      );

      // 1. 그룹에서 카메라로의 방향 계산
      const toCamera = new THREE.Vector3()
        .subVectors(camera.position, groupCenter)
        .normalize();

      // 2. 화면 기준 수평 방향 계산
      // 카메라의 right 벡터를 해당 평면에 투영
      const planeRight = new THREE.Vector3()
        .copy(cameraRight)
        .projectOnPlane(toCamera)
        .normalize();

      // 3. 평면의 up 방향 계산 (right와 법선의 외적)
      const planeUp = new THREE.Vector3()
        .crossVectors(toCamera, planeRight)
        .normalize();

      // 4. 회전 행렬 구성 (화면 기준 좌표계)
      const rotationMatrix = new THREE.Matrix4().makeBasis(
        planeRight,
        planeUp,
        toCamera
      );
      const finalRotation = new THREE.Quaternion().setFromRotationMatrix(
        rotationMatrix
      );

      // 5. 평면 위에 4글자 배치
      for (let k = 0; k < digits; k++) {
        const d = slotDigit[i * digits + k];
        const slot = slotIndex[i * digits + k];
        const mesh = instRefs.current[d];
        if (!mesh) continue;

        // 6. 화면 기준 수평 방향으로 오프셋 적용
        const offsetVector = new THREE.Vector3()
          .copy(planeRight)
          .multiplyScalar(digitRelativeOffsetX[k]);

        // 7. 최종 위치 = 그룹 중심 + 평면 위 오프셋
        const finalPos = new THREE.Vector3()
          .copy(groupCenter)
          .add(offsetVector);

        // 8. 변환 행렬 구성 (위치 + 회전 + 스케일)
        m.compose(finalPos, finalRotation, s);
        mesh.setMatrixAt(slot, m);
      }
    }

    instRefs.current.forEach(
      (msh) => msh && (msh.instanceMatrix.needsUpdate = true)
    );
  });

  instRefs.current.forEach(
    (msh) => msh && (msh.instanceMatrix.needsUpdate = true)
  );

  return <group>{meshes}</group>;
}
