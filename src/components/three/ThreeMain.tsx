import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { useMqttStore } from "../../store/mqttStore";
import CameraController from "./Camera/cameraController";
import MapBuilder from "./MapBuilder/MapBuilder";

const ThreeScene: React.FC = () => {
  const { sendMessage } = useMqttStore();
  const handleBoxClick = () => {
    sendMessage({ topic: "control/box", message: "Box clicked!" });
    console.log("Box clicked!");
  };

  return (
    <Canvas className="absolute inset-0">
      <ambientLight />
      <pointLight position={[10, 10, 10]} />

      {/* <Box color="orange" onClick={handleBoxClick} /> */}
      {/* <Stations /> */}

      {/* Add MapBuilder with edges */}
      <MapBuilder />

      <Perf position="bottom-right" />
      {/* 카메라 상태 업데이트 */}
      <CameraController />
      {/* OrbitControls 추가 */}
      <OrbitControls makeDefault />
    </Canvas>
  );
};

export default ThreeScene;
