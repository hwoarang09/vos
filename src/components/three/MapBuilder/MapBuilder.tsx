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
  const {
    addEdge,
    setPreviewEdge,
    clearPreviewEdge,
    edgeCreation,
    setEdgeCreationState,
    resetEdgeCreation,
    rotateEdgeDirection
  } = useMapStore();
  const { addNode, generateNodeName, setPreviewNodes, clearPreviewNodes, updatePreviewNodesPosition } = useNodeStore();
  const meshRef = useRef<THREE.Mesh>(null);
  const currentMousePositionRef = useRef<THREE.Vector3 | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastCreatedEdgeRef = useRef<{startX: number, startY: number, endX: number, endY: number} | null>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // 메뉴 색상에서 투명도 제거한 버전
  const MENU_BLUE_COLOR = '#5ec5ff'; // rgba(94, 197, 255, 1.0)

  // Helper function to calculate end position based on direction and length
  const calculateEndPosition = useCallback((startX: number, startY: number, direction: number, length: number) => {
    const radians = (direction * Math.PI) / 180;
    return {
      x: startX + Math.cos(radians) * length,
      y: startY + Math.sin(radians) * length
    };
  }, []);

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

  // Handle mouse move for preview and edge creation
  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const mousePosition = getMousePosition3D(event.nativeEvent);
    if (!mousePosition) return;

    // Handle direction selection during edge creation
    if (edgeCreation.phase === 'direction_selection' && edgeCreation.startPosition) {
      const startPos = edgeCreation.startPosition;
      const direction = edgeCreation.currentDirection;
      const radians = (direction * Math.PI) / 180;

      // Calculate projection of mouse position onto current direction
      const dx = mousePosition.x - startPos.x;
      const dy = mousePosition.y - startPos.y;

      // Project onto direction vector
      const dirX = Math.cos(radians);
      const dirY = Math.sin(radians);
      const projectedLength = Math.max(1, dx * dirX + dy * dirY); // Minimum length of 1

      // Calculate end position along the fixed direction
      const endPos = {
        x: startPos.x + dirX * projectedLength,
        y: startPos.y + dirY * projectedLength
      };

      // Update preview nodes
      const previewStartNode = {
        id: 'preview_start',
        name: 'preview_start',
        x: startPos.x,
        y: startPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      const previewEndNode = {
        id: 'preview_end',
        name: 'preview_end',
        x: endPos.x,
        y: endPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      // Update edge length in state
      setEdgeCreationState({ edgeLength: projectedLength });

      return;
    }

    // Handle length adjustment during edge creation
    if (edgeCreation.phase === 'length_adjustment' &&
        edgeCreation.startPosition) {

      // Calculate the projection of mouse position onto the current direction
      const startPos = edgeCreation.startPosition;
      const direction = edgeCreation.currentDirection;
      const radians = (direction * Math.PI) / 180;

      // Vector from start to mouse
      const dx = mousePosition.x - startPos.x;
      const dy = mousePosition.y - startPos.y;

      // Project onto direction vector
      const dirX = Math.cos(radians);
      const dirY = Math.sin(radians);
      const projectedLength = Math.max(1, dx * dirX + dy * dirY); // Minimum length of 1

      // Calculate new end position
      const newEndPos = {
        x: startPos.x + dirX * projectedLength,
        y: startPos.y + dirY * projectedLength
      };

      // Update preview nodes
      const previewStartNode = {
        id: 'preview_start',
        name: 'preview_start',
        x: startPos.x,
        y: startPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      const previewEndNode = {
        id: 'preview_end',
        name: 'preview_end',
        x: newEndPos.x,
        y: newEndPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      // Update edge length in state
      setEdgeCreationState({ edgeLength: projectedLength });

      return;
    }

    // Original preview logic for idle state
    if (edgeCreation.phase === 'idle') {
      updatePreviewPosition(mousePosition);
    }
  }, [getMousePosition3D, updatePreviewPosition, edgeCreation.phase, edgeCreation.startPosition, edgeCreation.currentDirection, setEdgeCreationState, setPreviewNodes]);

  // Show/hide preview based on menu state and edge creation phase
  useEffect(() => {
    if (activeMainMenu === 'MapBuilder' && activeSubMenu === 'map-menu-1' && edgeCreation.phase === 'idle') {
      // Show preview for straight edge mode only when not creating an edge
      const startX = currentMousePositionRef.current?.x || 0;
      const startY = currentMousePositionRef.current?.y || 0;

      const previewStartNode = {
        id: 'preview_start',
        name: 'preview_start',
        x: startX,
        y: startY,
        z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      const previewEndNode = {
        id: 'preview_end',
        name: 'preview_end',
        x: startX + 5,
        y: startY,
        z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      const previewEdge = {
        id: 'preview_edge',
        fromNode: 'preview_start',
        toNode: 'preview_end',
        color: MENU_BLUE_COLOR,
        opacity: 0.7,
        source: 'user' as const,
        mode: "preview" as 'normal' | 'preview'
      };

      setPreviewEdge(previewEdge);
    } else if (edgeCreation.phase !== 'idle') {
      // During edge creation, don't show the mouse-following preview
      // The edge creation preview is handled separately
    } else {
      // Hide preview when not in straight edge mode
      clearPreviewEdge();
      clearPreviewNodes();
      lastCreatedEdgeRef.current = null; // Clear last created edge on menu change
    }
  }, [activeMainMenu, activeSubMenu, edgeCreation.phase, setPreviewNodes, setPreviewEdge, clearPreviewEdge, clearPreviewNodes]);



  // Handle keyboard input for direction rotation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle rotation during direction selection phase
      if (edgeCreation.phase !== 'direction_selection') return;

      if (event.key === 'r' || event.key === 'R') {
        rotateEdgeDirection();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [edgeCreation.phase, rotateEdgeDirection]);

  // Update preview when direction changes
  useEffect(() => {
    if (edgeCreation.phase === 'direction_selection' && edgeCreation.startPosition) {
      const startPos = edgeCreation.startPosition;
      const direction = edgeCreation.currentDirection;
      const length = edgeCreation.edgeLength;

      // Calculate end position based on current direction
      const endPos = calculateEndPosition(startPos.x, startPos.y, direction, length);

      // Update preview nodes
      const previewStartNode = {
        id: 'preview_start',
        name: 'preview_start',
        x: startPos.x,
        y: startPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      const previewEndNode = {
        id: 'preview_end',
        name: 'preview_end',
        x: endPos.x,
        y: endPos.y,
        z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: 'user' as const
      };

      setPreviewNodes([previewStartNode, previewEndNode]);
    }
  }, [edgeCreation.phase, edgeCreation.currentDirection, edgeCreation.startPosition, edgeCreation.edgeLength, calculateEndPosition, setPreviewNodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreviewEdge();
      clearPreviewNodes();
      resetEdgeCreation();
      lastCreatedEdgeRef.current = null;
    };
  }, [clearPreviewEdge, clearPreviewNodes, resetEdgeCreation]);

  // Phase 1: Start edge creation - only fix from node, keep edge and to node as preview
  const startEdgeCreation = useCallback((point: THREE.Vector3) => {
    const startX = point.x;
    const startY = point.y;
    const z = 30; // Fixed z coordinate

    // Create start node (this will be solid/fixed)
    const startNodeName = generateNodeName();
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

    // Add start node to store
    addNode(startNode);

    // Set edge creation state
    setEdgeCreationState({
      phase: 'direction_selection',
      startPosition: { x: startX, y: startY, z },
      fromNodeId: startNodeName,
      currentDirection: 0, // Start facing right
      edgeLength: 5 // Default length
    });

    // Create preview nodes for the edge preview (start + end)
    const endPos = calculateEndPosition(startX, startY, 0, 5);
    const previewStartNode = {
      id: 'preview_start',
      name: 'preview_start',
      x: startX,
      y: startY,
      z: z,
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    const previewEndNode = {
      id: 'preview_end',
      name: 'preview_end',
      x: endPos.x,
      y: endPos.y,
      z: z,
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    setPreviewNodes([previewStartNode, previewEndNode]);

    // Create preview edge
    const previewEdge = {
      id: 'creating_edge',
      fromNode: 'preview_start',
      toNode: 'preview_end',
      color: MENU_BLUE_COLOR,
      opacity: 0.7,
      source: 'user' as const,
      mode: "preview" as 'normal' | 'preview'
    };

    setPreviewEdge(previewEdge);
  }, [addNode, generateNodeName, setEdgeCreationState, setPreviewEdge, setPreviewNodes, calculateEndPosition]);

  // Phase 2: Confirm direction and move to length adjustment
  const confirmDirection = useCallback(() => {
    // Simply move to length adjustment phase
    setEdgeCreationState({ phase: 'length_adjustment' });
  }, [setEdgeCreationState]);

  // Phase 3: Finalize edge creation
  const finalizeEdge = useCallback(() => {
    if (!edgeCreation.fromNodeId || !edgeCreation.startPosition) return;

    // Get current preview end position
    const { previewNodes } = useNodeStore.getState();
    if (previewNodes.length < 2) return;

    const endNode = previewNodes[1];

    // Create final end node
    const endNodeName = generateNodeName();
    const finalEndNode = {
      id: endNodeName,
      name: endNodeName,
      x: endNode.x,
      y: endNode.y,
      z: endNode.z,
      color: MENU_BLUE_COLOR,
      size: 0.1,
      source: 'user' as const
    };

    addNode(finalEndNode);

    // Create final edge
    const finalEdge = {
      id: generateEdgeId(),
      fromNode: edgeCreation.fromNodeId,
      toNode: endNodeName,
      color: MENU_BLUE_COLOR,
      opacity: 1.0,
      source: 'user' as const,
      mode: "normal" as 'normal' | 'preview'
    };

    addEdge(finalEdge);
    resetEdgeCreation();
    // Note: Don't clear preview here - let the updatePreviewEdge effect handle it
  }, [edgeCreation.fromNodeId, edgeCreation.startPosition, generateNodeName, addNode, generateEdgeId, addEdge, clearPreviewEdge, clearPreviewNodes, resetEdgeCreation]);

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
    if (!mousePosition) return;

    // Handle different phases of edge creation for straight edges
    if (activeSubMenu === 'map-menu-1') {
      switch (edgeCreation.phase) {
        case 'idle':
          // Phase 1: Start edge creation
          startEdgeCreation(mousePosition);
          break;
        case 'direction_selection':
          // Phase 2: Confirm direction and move to length adjustment
          confirmDirection();
          break;
        case 'length_adjustment':
          // Phase 3: Finalize edge creation
          finalizeEdge();
          break;
      }
      return;
    }

    // Handle other edge types (curved, circular) - keep existing logic for now
    let newEdge = null;
    switch (activeSubMenu) {
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

      // Debug: Count all nodes and edges after creation
      const { edges, previewEdge } = useMapStore.getState();
      const { nodes, previewNodes } = useNodeStore.getState();

      console.log('🔵 [DEBUG] After edge creation:');
      console.log(`  📊 Regular nodes: ${nodes.length}`);
      console.log(`  📊 Preview nodes: ${previewNodes.length}`);
      console.log(`  📊 Regular edges: ${edges.length}`);
      console.log(`  📊 Preview edge: ${previewEdge ? 1 : 0}`);
      console.log(`  📊 Total nodes: ${nodes.length + previewNodes.length}`);
      console.log(`  📊 Total edges: ${edges.length + (previewEdge ? 1 : 0)}`);

      // Store the created edge position to avoid preview overlap
      const startX = mousePosition.x;
      const startY = mousePosition.y;
      const endX = startX + 5;
      const endY = startY;
      lastCreatedEdgeRef.current = { startX, startY, endX, endY };
    }
  }, [activeMainMenu, activeSubMenu, getMousePosition3D, edgeCreation.phase, startEdgeCreation, confirmDirection, finalizeEdge, createCurvedEdge, createCircularEdge, addEdge]);

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