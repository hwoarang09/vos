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
  const lastCreatedEdgeRef = useRef<{startX: number, startY: number, endX: number, endY: number} | null>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // 메뉴 색상에서 투명도 제거한 버전
  const MENU_BLUE_COLOR = '#5ec5ff'; // rgba(94, 197, 255, 1.0)

  // Initialize preview objects once
  const initializePreview = useCallback(() => {
    console.log('🔵 initializePreview called');
    if (previewInitializedRef.current) {
      console.log('🔵 Preview already initialized, skipping');
      return;
    }

    // Create preview nodes
    const previewStartNode = {
      id: 'preview_start',
      name: 'preview_start',
      x: 0,
      y: 0,
      z: 30.1, // Preview nodes slightly above
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    const previewEndNode = {
      id: 'preview_end',
      name: 'preview_end',
      x: 5,
      y: 0,
      z: 30.1, // Preview nodes slightly above
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    // Set preview nodes
    setPreviewNodes([previewStartNode, previewEndNode]);

    // Create preview edge
    const previewEdge = {
      id: 'preview_edge',
      fromNode: 'preview_start',
      toNode: 'preview_end',
      color: MENU_BLUE_COLOR, // Menu blue for preview
      opacity: 0.7,
      source: 'user' as const,
      mode: "preview" as 'normal' | 'preview'
    };

    setPreviewEdge(previewEdge);
    previewInitializedRef.current = true;
    console.log('🔵 Preview initialized successfully');
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
    const z = 30.1; // Preview z coordinate (above actual edges)

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
      // Check if preview would overlap with existing edges
      const startX = mousePosition.x;
      const startY = mousePosition.y;
      const endX = startX + 5;
      const endY = startY;

      // Check if preview would overlap with last created edge
      // if (lastCreatedEdgeRef.current) {
      //   const lastEdge = lastCreatedEdgeRef.current;
      //   const startDist = Math.sqrt((lastEdge.startX - startX)**2 + (lastEdge.startY - startY)**2);
      //   const endDist = Math.sqrt((lastEdge.endX - endX)**2 + (lastEdge.endY - endY)**2);
      //   if (startDist < 2 && endDist < 2) return; // Don't show preview if too close
      // }

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
      lastCreatedEdgeRef.current = null; // Clear last created edge on menu change
    }
  }, [activeMainMenu, activeSubMenu, clearPreviewEdge, clearPreviewNodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreviewEdge();
      clearPreviewNodes();
      previewInitializedRef.current = false;
      lastCreatedEdgeRef.current = null;
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
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    const endNode = {
      id: endNodeName,
      name: endNodeName,
      x: endX,
      y: endY,
      z: z,
      color: MENU_BLUE_COLOR,
      size: 0.1,
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
      color: MENU_BLUE_COLOR, // Menu blue for user-created Edges
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

        // Store the created edge position to avoid preview overlap
        const startX = mousePosition.x;
        const startY = mousePosition.y;
        const endX = startX + 5;
        const endY = startY;
        lastCreatedEdgeRef.current = { startX, startY, endX, endY };

        // // Clear preview after creating actual Edge
        // console.log('🔴 Clearing preview after edge creation');
        // clearPreviewEdge();
        // clearPreviewNodes();
        // previewInitializedRef.current = false;
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
