import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useCameraStore } from "../../store/cameraStore";

const CameraController: React.FC = () => {
  const { camera, controls } = useThree(); // R3F 카메라와 OrbitControls 참조
  const { position, target } = useCameraStore(); // 스토어에서 상태 가져오기

  useEffect(() => {
    if (!controls) return;
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
  }, [camera, controls, position, target]);

  return null;
};

export default CameraController;
