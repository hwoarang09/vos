import React, { useRef } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useMenuStore } from '../../../store/menuStore';
import { useMapStore } from '../../../store/edgeStore';
import * as THREE from 'three';

/**
 * RoadBuilder component - Handles road creation based on active menu
 */
const RoadBuilder: React.FC = () => {
  const { camera, raycaster } = useThree();
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const { addEdge } = useMapStore();
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Handle mouse click for road creation
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // Only handle clicks when MapBuilder > Straight Road is active
    if (activeMainMenu !== 'MapBuilder' || activeSubMenu !== 'map-menu-1') {
      return;
    }

    // Use the intersection point from the event - React Three Fiber handles this automatically!
    const intersectionPoint = event.point;

    // Create a straight road of length 5 at the clicked position
    const startX = intersectionPoint.x;
    const startY = intersectionPoint.y;
    const endX = startX + 5; // 5 units to the right
    const endY = startY;
    const z = 30; // Fixed z coordinate

    const newEdge = {
      id: generateEdgeId(),
      startPosition: [startX, startY, z] as [number, number, number],
      endPosition: [endX, endY, z] as [number, number, number],
      color: '#ffff00', // Yellow for user-created roads
      opacity: 1.0,
      source: 'user' as const
    };

    // Add the new edge to the store
    addEdge(newEdge);

    console.log('Created new straight road:', newEdge);
  };

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      visible={false} // Invisible click handler
      position={[0, 0, 0]}
    >
      {/* Large invisible plane to catch clicks */}
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default RoadBuilder;
