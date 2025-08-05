import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useCameraStore } from "@store/cameraStore";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 예시: useRef로 받았다면

const CameraController: React.FC = () => {
  const { camera } = useThree(); // R3F 카메라와 OrbitControls 참조
  const { position, target } = useCameraStore(); // 스토어에서 상태 가져오기
  const controlsRef = useRef<OrbitControls>(null!);
  const controls = useThree((state) => state.controls as OrbitControls);

  useEffect(() => {
    if (!controls) return;
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
  }, [camera, controls, position, target]);

  return null;
};

export default CameraController;
