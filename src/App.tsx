import React from "react";
import Menu from "./components/react/Menu";
import ThreeScene from "./components/three/ThreeMain";
import CameraController from "./components/three/cameraController";
import { OrbitControls } from "@react-three/drei";

const App: React.FC = () => (
  <div className="relative w-screen h-screen">
    <Menu />
    <ThreeScene />
  </div>
);

export default App;
