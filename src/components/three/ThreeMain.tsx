import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import * as THREE from "three";
import CameraController from "./Camera/cameraController";
import MapBuilder from "./MapBuilder/MapBuilder";
import MapRenderer from "./MapRenderer";
import Floor from "./Floor";
import AxisHelper from "./AxisHelper";

const ThreeScene: React.FC = () => {
  return (
    <>
      <Canvas
        className="absolute inset-0"
        scene={{ background: new THREE.Color("#1a1a1a") }}
      >
        {/* Basic lighting for factory environment */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 500]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Factory floor */}
        <Floor />

        {/* Coordinate axes for orientation */}
        <AxisHelper />

        {/* Map management - handles data operations */}
        <MapBuilder />

        {/* Map rendering - displays the actual 3D objects */}
        <MapRenderer />

        {/* Development tools */}
        <Perf position="bottom-right" />

        {/* Camera controls */}
        <CameraController />
        <OrbitControls makeDefault />
      </Canvas>
    </>
  );
};

export default ThreeScene;
