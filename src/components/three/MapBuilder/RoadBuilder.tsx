import React, { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useMenuStore } from '../../../store/menuStore';
import { useMapStore } from '../../../store/edgeStore';
import * as THREE from 'three';

/**
 * RoadBuilder component - Handles road creation based on active menu
 */
const RoadBuilder: React.FC = () => {
  const { camera, raycaster, scene } = useThree();
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const { addEdge } = useMapStore();
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle mouse click for road creation
  const handleClick = (event: THREE.Event) => {
    // Only handle clicks when MapBuilder > Straight Road is active
    if (activeMainMenu !== 'MapBuilder' || activeSubMenu !== 'map-menu-1') {
      return;
    }

    // Get mouse position in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Create a plane at z=30 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -30);
    const intersectionPoint = new THREE.Vector3();
    
    // Get intersection point with the z=30 plane
    if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
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
    }
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
