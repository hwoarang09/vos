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
import NumberGrid from "./Text/spriteText/NumberGrid";
import NumberGridInstanced from "./Text/customSpriteText/NumberGridInstnaced";

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

        {/* spriteText test */}
        {/* <NumberGrid
          width={200}
          height={200}
          rows={30}
          cols={30}
          z={1.0}
          color="#00e5ff"
          backgroundColor="transparent" // 또는 'rgba(0,0,0,0.35)'
          batchSize={500} // 빌드/머신에 맞게 조절
          showFrame
        /> */}
        {/* customSpriteTest */}
        <NumberGridInstanced
          width={200}
          height={200}
          rows={100}
          cols={100}
          z={1.0}
          charScale={0.7}
          charSpacing={0.2}
          color="#00e5ff"
          bgColor="transparent"
          digits={4}
          // billboard // 필요하면 켜기
        />
      </Canvas>
    </>
  );
};

export default ThreeScene;
