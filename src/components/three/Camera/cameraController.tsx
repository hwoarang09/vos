import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCameraStore } from "@store/cameraStore";

const CameraController: React.FC = () => {
  const { camera, controls } = useThree(); // controls는 drei가 set해줌

  const position = useCameraStore((s) => s.position);
  const target = useCameraStore((s) => s.target);
  const rotateZDeg = useCameraStore((s) => s.rotateZDeg);
  const _resetRotateZ = useCameraStore((s) => s._resetRotateZ);

  // Z-up 보정 (한 번만)
  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, [camera]);

  // 위치/타깃 반영 + Z축 공전 처리 + 컨트롤 동기화
  useEffect(() => {
    if (!controls) return;

    // 1) 기본 위치/타깃 반영
    camera.position.copy(position);

    // 2) 회전 요청이 있으면 target 기준으로 Z축 공전
    if (rotateZDeg !== 0) {
      const axis = new THREE.Vector3(0, 0, 1);
      camera.position
        .sub(target)
        .applyAxisAngle(axis, THREE.MathUtils.degToRad(rotateZDeg))
        .add(target);
      _resetRotateZ();
    }

    // 3) 컨트롤 동기화
    // @ts-ignore - controls는 drei에서 주입되는 any
    controls.target.copy(target);
    // @ts-ignore
    controls.update();
  }, [camera, controls, position, target, rotateZDeg, _resetRotateZ]);

  return null;
};

export default CameraController;
