import React from "react";
import Menu from "./components/react/Menu";
import ThreeScene from "./components/three/ThreeMain";
// import CameraController from "@components/three/cameraController";
import { OrbitControls } from "@react-three/drei";
import MenuContainer from "@components/react/menu/MenuContainer";
import KeyboardShortcutHandler from "@components/react/system/KeyboardShortcutHandler"
import "./index.css";

const App: React.FC = () => (
  <div className="relative w-screen h-screen">
    <KeyboardShortcutHandler />
    <MenuContainer />
    <ThreeScene />
  </div>
);

export default App;
