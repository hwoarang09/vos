import React, { useRef } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useMenuStore } from '../../../store/menuStore';
import { useMapStore } from '../../../store/edgeStore';
import { useNodeStore } from '../../../store/nodeStore';
import * as THREE from 'three';

/**
 * RoadBuilder component - Handles road creation based on active menu
 */
const RoadBuilder: React.FC = () => {
  const { camera, raycaster } = useThree();
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const { addEdge } = useMapStore();
  const { addNode, generateNodeName } = useNodeStore();
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Road creation functions for different types
  const createStraightRoad = (point: THREE.Vector3) => {
    const startX = point.x;
    const startY = point.y;
    const endX = startX + 5; // 5 units to the right
    const endY = startY;
    const z = 30; // Fixed z coordinate

    // Create start and end nodes
    const startNodeName = generateNodeName();
    const endNodeName = generateNodeName();

    const startNode = {
      id: startNodeName,
      name: startNodeName,
      x: startX,
      y: startY,
      z: z,
      color: '#ffff00',
      size: 1.0,
      source: 'user' as const
    };

    const endNode = {
      id: endNodeName,
      name: endNodeName,
      x: endX,
      y: endY,
      z: z,
      color: '#ffff00',
      size: 1.0,
      source: 'user' as const
    };

    // Add nodes to store
    addNode(startNode);
    addNode(endNode);

    // Create edge connecting the nodes
    return {
      id: generateEdgeId(),
      fromNode: startNodeName,
      toNode: endNodeName,
      color: '#ffff00', // Yellow for user-created roads
      opacity: 1.0,
      source: 'user' as const,
      mode: "normal" as 'normal' | 'preview'
    };
  };

  const createCurvedRoad = (point: THREE.Vector3) => {
    // TODO: Implement curved road creation
    console.log('Curved road creation not implemented yet');
    return null;
  };

  const createCircularRoad = (point: THREE.Vector3) => {
    // TODO: Implement circular road creation
    console.log('Circular road creation not implemented yet');
    return null;
  };

  // Handle mouse click for road creation
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    // Only handle clicks when MapBuilder is active
    if (activeMainMenu !== 'MapBuilder') {
      return;
    }

    // Get mouse position in normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2();
    mouse.x = (event.nativeEvent.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.nativeEvent.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Create a plane at z=30 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -30);
    const intersectionPoint = new THREE.Vector3();

    // Get intersection point with the z=30 plane
    if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
      let newEdge = null;

      // Create different types of roads based on active submenu
      switch (activeSubMenu) {
        case 'map-menu-1': // Straight Road
          newEdge = createStraightRoad(intersectionPoint);
          break;
        case 'map-menu-2': // Curved Road
          newEdge = createCurvedRoad(intersectionPoint);
          break;
        case 'map-menu-3': // Circular Road
          newEdge = createCircularRoad(intersectionPoint);
          break;
        default:
          console.log('Unknown road type:', activeSubMenu);
          return;
      }

      // Add the new edge to the store if creation was successful
      if (newEdge) {
        addEdge(newEdge);
        console.log('Created new road:', newEdge);
      }
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
