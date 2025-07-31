import React from "react";
import Menu from "./components/react/Menu";
import ThreeScene from "./components/three/ThreeMain";
import CameraController from "@components/three/cameraController";
import { OrbitControls } from "@react-three/drei";
import MenuContainer from "@components/react/menu/MenuContainer";
import "./index.css";

const App: React.FC = () => (
  <div className="relative w-screen h-screen">
    <MenuContainer />
    <ThreeScene />
  </div>
);

export default App;
