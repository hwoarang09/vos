import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  CameraControls,
  // MapControls,
  // FlyControls,
  // FirstPersonControls
} from "@react-three/drei";
import { Perf } from "r3f-perf";
import * as THREE from "three";
// import CameraController from "./scene/Camera/cameraController"; // Replaced with drei controls
import MapBuilder from "./builders/MapBuilder/MapBuilder";
import LayoutBuilder from "./builders/LayoutBuilder/LayoutBuilder";
import MapRenderer from "./renderers/MapRenderer";
import Floor from "./scene/Floor";
import AxisHelper from "./scene/AxisHelper";
import TextRenderer from "./entities/text/TextRenderer";
import VehicleSystem from "./entities/vehicle/VehicleSystem";

import CameraController from "./scene/Camera/cameraController";
import { GridSquares } from "./TestExample/GridSquares";
import { useVehicleTestStore } from "@store/vehicle/vehicleTestStore";
import { PerformanceMonitorUI } from "./performance/PerformanceMonitor";

const ThreeScene: React.FC = () => {
  // Camera type state
  const [cameraType, setCameraType] = useState<"perspective" | "orthographic">(
    "perspective"
  );
  const [controlType, setControlType] = useState<"orbit" | "camera" | "map">(
    "orbit"
  );

  return (
    <>
      <Canvas
        className="absolute inset-0"
        scene={{ background: new THREE.Color("#1a1a1a") }}
      >
        <OrbitControls makeDefault enablePan enableZoom enableRotate />
        <CameraController />

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

        {/* Layout management - handles bay, station, equipment creation */}
        <LayoutBuilder />

        {/* Map rendering - displays the actual 3D objects */}
        <MapRenderer />

        {/* Text rendering - displays node and edge labels */}
        <TextRenderer scale={0.85} nodeColor="#00e5ff" edgeColor="#ff9800" />

        {/* Vehicle System - Conditionally rendered when test is active */}
        <VehicleSystemRenderer />

        {/* Development tools */}
        <Perf position="bottom-right" />

        {/* instnacedMesh color Test */}
        {/* <GridSquares
          rows={10}
          cols={10}
          highlighted={[0, 5, 10, 14, 15]} // 빨간색으로 하이라이트
          colorChanges={[
            // 특정 인덱스 색상 변경
            { index: 25, color: "#00ff00" }, // 25번째를 초록색
            { index: 50, color: "#0000ff" }, // 50번째를 파란색
            { index: 75, color: "#ffff00" }, // 75번째를 노란색
          ]}
        /> */}
      </Canvas>

      {/* Performance Monitor - 5-second average CPU usage */}
      <PerformanceMonitorUI />
    </>
  );
};

/**
 * VehicleSystemRenderer
 * - Conditionally renders VehicleSystem based on test state
 */
const VehicleSystemRenderer: React.FC = () => {
  const { isTestActive, testMode, numVehicles } = useVehicleTestStore();

  if (!isTestActive || !testMode) {
    return null;
  }

  return (
    <VehicleSystem
      mode={testMode}
      numVehicles={numVehicles}
    />
  );
};

export default ThreeScene;
