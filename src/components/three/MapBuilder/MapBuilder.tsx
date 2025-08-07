import React, { useRef, useCallback, useEffect } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { useMenuStore } from '../../../store/menuStore';
import { useMapStore } from '../../../store/edgeStore';
import { useNodeStore } from '../../../store/nodeStore';
import * as THREE from 'three';

/**
 * MapBuilder component - Handles Edge creation based on active menu
 */
const MapBuilder: React.FC = () => {
  const { camera, raycaster } = useThree();
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const { addEdge, setPreviewEdge, clearPreviewEdge } = useMapStore();
  const { addNode, generateNodeName, setPreviewNodes, clearPreviewNodes, updatePreviewNodesPosition } = useNodeStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const currentMousePositionRef = useRef<THREE.Vector3 | null>(null);
  const previewInitializedRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef<number>(0);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Initialize preview objects once
  const initializePreview = useCallback(() => {
    if (previewInitializedRef.current) return;

    // Create preview nodes
    const previewStartNode = {
      id: 'preview_start',
      name: 'preview_start',
      x: 0,
      y: 0,
      z: 30,
      color: '#ffff00',
      size: 1.0,
      source: 'user' as const
    };

    const previewEndNode = {
      id: 'preview_end',
      name: 'preview_end',
      x: 5,
      y: 0,
      z: 30,
      color: '#ffff00',
      size: 1.0,
      source: 'user' as const
    };

    // Set preview nodes
    setPreviewNodes([previewStartNode, previewEndNode]);

    // Create preview edge
    const previewEdge = {
      id: 'preview_edge',
      fromNode: 'preview_start',
      toNode: 'preview_end',
      color: '#ffff00', // Yellow for preview
      opacity: 0.7,
      source: 'user' as const,
      mode: "preview" as 'normal' | 'preview'
    };

    setPreviewEdge(previewEdge);
    previewInitializedRef.current = true;
  }, [setPreviewNodes, setPreviewEdge]);

  // Update preview position (optimized - only updates positions with throttling)
  const updatePreviewPosition = useCallback((point: THREE.Vector3) => {
    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Throttle updates to ~60fps (16ms) to reduce GPU load
    if (timeSinceLastUpdate < 16) {
      return;
    }

    const startX = point.x;
    const startY = point.y;
    const endX = startX + 5; // 5 units to the right
    const endY = startY;
    const z = 30; // Fixed z coordinate

    currentMousePositionRef.current = point;
    updatePreviewNodesPosition([startX, startY, z], [endX, endY, z]);
    lastUpdateTimeRef.current = now;
  }, [updatePreviewNodesPosition]);

  // Reuse objects to avoid garbage collection
  const mouseVector = useRef(new THREE.Vector2());
  const planeNormal = useRef(new THREE.Vector3(0, 0, 1));
  const plane = useRef(new THREE.Plane(planeNormal.current, -30));
  const intersectionPoint = useRef(new THREE.Vector3());

  // Get mouse position in 3D space (optimized)
  const getMousePosition3D = useCallback((event: MouseEvent) => {
    const mouse = mouseVector.current;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersection = intersectionPoint.current;
    if (raycaster.ray.intersectPlane(plane.current, intersection)) {
      // Return a new Vector3 to avoid reference issues
      return new THREE.Vector3(intersection.x, intersection.y, intersection.z);
    }
    return null;
  }, [camera, raycaster]);

  // Handle mouse move for preview (only called when straight Edge is selected)
  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const mousePosition = getMousePosition3D(event.nativeEvent);
    if (mousePosition) {
      // Initialize preview objects if not done yet
      if (!previewInitializedRef.current) {
        initializePreview();
      }
      // Only update positions (much more efficient)
      updatePreviewPosition(mousePosition);
      // console.log(mousePosition)
    }
  }, [getMousePosition3D, initializePreview, updatePreviewPosition]);

  // Clear preview when menu changes or component unmounts
  useEffect(() => {
    // Clear preview when not in straight Edge mode
    if (activeMainMenu !== 'MapBuilder' || activeSubMenu !== 'map-menu-1') {
      clearPreviewEdge();
      clearPreviewNodes();
      previewInitializedRef.current = false;
    }
  }, [activeMainMenu, activeSubMenu, clearPreviewEdge, clearPreviewNodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreviewEdge();
      clearPreviewNodes();
      previewInitializedRef.current = false;
    };
  }, [clearPreviewEdge, clearPreviewNodes]);

  // Edge creation functions for different types
  const createStraightEdge = (point: THREE.Vector3) => {
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
      color: '#ffff00', // Yellow for user-created Edges
      opacity: 1.0,
      source: 'user' as const,
      mode: "normal" as 'normal' | 'preview'
    };
  };

  const createCurvedEdge = (_point: THREE.Vector3) => {
    // TODO: Implement curved Edge creation
    console.log('Curved Edge creation not implemented yet');
    return null;
  };

  const createCircularEdge = (_point: THREE.Vector3) => {
    // TODO: Implement circular Edge creation
    console.log('Circular Edge creation not implemented yet');
    return null;
  };

  // Handle mouse click for Edge creation
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    // Only handle clicks when MapBuilder is active
    if (activeMainMenu !== 'MapBuilder') {
      return;
    }

    const mousePosition = getMousePosition3D(event.nativeEvent);
    if (mousePosition) {
      let newEdge = null;

      // Create different types of Edges based on active submenu
      switch (activeSubMenu) {
        case 'map-menu-1': // Straight Edge
          newEdge = createStraightEdge(mousePosition);
          break;
        case 'map-menu-2': // Curved Edge
          newEdge = createCurvedEdge(mousePosition);
          break;
        case 'map-menu-3': // Circular Edge
          newEdge = createCircularEdge(mousePosition);
          break;
        default:
          console.log('Unknown Edge type:', activeSubMenu);
          return;
      }

      // Add the new edge to the store if creation was successful
      if (newEdge) {
        addEdge(newEdge);
        // Clear preview after creating actual Edge
        clearPreviewEdge();
        clearPreviewNodes();
        previewInitializedRef.current = false;
      }
    }
  }, [activeMainMenu, activeSubMenu, getMousePosition3D, createStraightEdge, createCurvedEdge, createCircularEdge, addEdge, clearPreviewEdge, clearPreviewNodes]);

  // Only attach onPointerMove when straight Edge is selected
  const shouldShowPreview = activeMainMenu === 'MapBuilder' && activeSubMenu === 'map-menu-1';

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerMove={shouldShowPreview ? handleMouseMove : undefined}
      visible={false} // Invisible click handler
      position={[0, 0, 0]}
    >
      {/* Large invisible plane to catch clicks and mouse moves */}
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default MapBuilder;
