import React from "react";
import ThreeScene from "./components/three/ThreeMain";
import MenuContainer from "@components/react/menu/MenuContainer";
import KeyboardShortcutHandler from "@components/react/system/KeyboardShortcutHandler";
import "./index.css";

const App: React.FC = () => (
  <div className="relative w-screen h-screen">
    <KeyboardShortcutHandler />
    <MenuContainer />
    <ThreeScene />
  </div>
);

export default App;
