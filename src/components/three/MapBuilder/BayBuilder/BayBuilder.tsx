import React from 'react';
import { useMenuStore } from '../../../../store/menuStore';

/**
 * BayBuilder component - Creates rectangular bay areas with Ctrl+Drag
 * Camera management is handled by CameraController
 */
const BayBuilder: React.FC = () => {
  const { activeMainMenu, activeSubMenu } = useMenuStore();

  // Only render when BayBuilder is active
  if (activeMainMenu !== "MapBuilder" || activeSubMenu !== "map-menu-10") {
    return null;
  }

  // TODO: Add Ctrl+Drag rectangle drawing functionality here
  // This will be implemented in the next step

  return (
    <>
      {/* Invisible plane for mouse interactions */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]} // Horizontal plane
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial />
      </mesh>

      {/* TODO: Add Ctrl+Drag rectangle drawing functionality here */}
    </>
  );
};

export default BayBuilder;
