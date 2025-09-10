import React, { useRef, useCallback, useEffect } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { useMenuStore } from "@store/menuStore";
import { useMapStore } from "@store/edgeStore";
import { useNodeStore } from "@store/nodeStore";
import { Edge, Node, NodeData } from "@/types";
import * as THREE from "three";

/**
 * StraightEdge component - Handles straight edge creation
 */
const StraightEdge: React.FC = () => {
  const { camera, raycaster } = useThree();
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const {
    addEdge,
    setPreviewEdge,
    clearPreviewEdge,
    edgeCreation,
    setEdgeCreationState,
    resetEdgeCreation,
    rotateEdgeDirection,
  } = useMapStore();
  const {
    addNode,
    generateNodeName,
    setPreviewNodes,
    clearPreviewNodes,
    updatePreviewNodesPosition,
  } = useNodeStore();

  const meshRef = useRef<THREE.Mesh>(null);
  const currentMousePositionRef = useRef<THREE.Vector3 | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastCreatedEdgeRef = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Generate unique ID for new edges
  const generateEdgeId = () => {
    return `edge_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // 메뉴 색상에서 투명도 제거한 버전
  const MENU_BLUE_COLOR = "#5ec5ff"; // rgba(94, 197, 255, 1.0)

  // Helper function to calculate end position based on direction and length
  const calculateEndPosition = useCallback(
    (startX: number, startY: number, direction: number, length: number) => {
      const radians = (direction * Math.PI) / 180;
      return {
        x: startX + Math.cos(radians) * length,
        y: startY + Math.sin(radians) * length,
      };
    },
    []
  );

  // Find nearest node within snap distance (excluding specific node)
  const findNearestNode = useCallback(
    (
      targetPosition: THREE.Vector3,
      excludeNodeId?: string,
      snapDistance: number = 2
    ) => {
      const { nodes } = useNodeStore.getState();

      let nearestNode = null;
      let minDistance = snapDistance;

      for (const node of nodes) {
        // Skip excluded node
        if (excludeNodeId && node.node_name === excludeNodeId) {
          continue;
        }

        const distance = Math.sqrt(
          Math.pow(node.editor_x - targetPosition.x, 2) +
            Math.pow(node.editor_y - targetPosition.y, 2)
        );

        if (distance < minDistance) {
          nearestNode = node;
          minDistance = distance;
        }
      }

      return nearestNode;
    },
    []
  );

  // Update preview position (optimized - only updates positions with throttling)
  const updatePreviewPosition = useCallback(
    (point: THREE.Vector3) => {
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Throttle updates to ~60fps (16ms) to reduce GPU load
      if (timeSinceLastUpdate < 16) {
        return;
      }

      let startX = point.x;
      let startY = point.y;
      let endX = startX + 5; // 5 units to the right
      let endY = startY;
      const z = 30.1; // Preview z coordinate (above actual edges)

      // Check for snapping for start position
      const nearestStartNode = findNearestNode(
        new THREE.Vector3(startX, startY, z)
      );
      let startSnapped = false;
      if (nearestStartNode) {
        startX = nearestStartNode.editor_x;
        startY = nearestStartNode.editor_y;
        startSnapped = true;
      }

      // Check for snapping for end position
      const nearestEndNode = findNearestNode(new THREE.Vector3(endX, endY, z));
      let endSnapped = false;
      if (nearestEndNode) {
        endX = nearestEndNode.editor_x;
        endY = nearestEndNode.editor_y;
        endSnapped = true;
      }

      currentMousePositionRef.current = point;
      updatePreviewNodesPosition([startX, startY, z], [endX, endY, z]);

      // Update preview nodes with snapping colors
      const previewStartNode: Node = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: startX,
        editor_y: startY,
        editor_z: z,
        color: startSnapped ? "#ff6b6b" : MENU_BLUE_COLOR,
        size: startSnapped ? 0.15 : 0.1,
        source: "user" as const,
      };

      const previewEndNode: Node = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: endX,
        editor_y: endY,
        editor_z: z,
        color: endSnapped ? "#ff6b6b" : MENU_BLUE_COLOR,
        size: endSnapped ? 0.15 : 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);
      lastUpdateTimeRef.current = now;
    },
    [updatePreviewNodesPosition, findNearestNode, setPreviewNodes]
  );

  // Reuse objects to avoid garbage collection
  const mouseVector = useRef(new THREE.Vector2());
  const planeNormal = useRef(new THREE.Vector3(0, 0, 1));
  const plane = useRef(new THREE.Plane(planeNormal.current, -30));
  const intersectionPoint = useRef(new THREE.Vector3());

  // Get mouse position in 3D space (optimized)
  const getMousePosition3D = useCallback(
    (event: MouseEvent) => {
      const mouse = mouseVector.current;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersection = intersectionPoint.current;
      if (raycaster.ray.intersectPlane(plane.current, intersection)) {
        // Return a new Vector3 to avoid reference issues
        return new THREE.Vector3(
          intersection.x,
          intersection.y,
          intersection.z
        );
      }
      return null;
    },
    [camera, raycaster]
  );

  // Handle mouse move for preview and edge creation
  const handleMouseMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const mousePosition = getMousePosition3D(event.nativeEvent);
      if (!mousePosition) return;

      // Handle direction and length adjustment during edge creation (combined phase)
      if (edgeCreation.phase === "adjusting" && edgeCreation.startPosition) {
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

        // Calculate initial end position along the fixed direction
        const calculatedEndPos = {
          x: startPos.x + dirX * projectedLength,
          y: startPos.y + dirY * projectedLength,
        };

        // Check for nearby nodes to snap to (exclude fromNode)
        const nearestNode = findNearestNode(
          new THREE.Vector3(calculatedEndPos.x, calculatedEndPos.y, startPos.z),
          edgeCreation.fromNodeId ?? undefined
        );

        let finalEndPos;
        let snappedToExistingNode = false;

        if (nearestNode) {
          // Snap to existing node
          finalEndPos = {
            x: nearestNode.editor_x,
            y: nearestNode.editor_y,
          };
          snappedToExistingNode = true;

          // Store snapped node info for finalization
          setEdgeCreationState({
            edgeLength: projectedLength,
            toNodeId: nearestNode.node_name, // Store the target node ID
          });
        } else {
          // Use calculated position
          finalEndPos = calculatedEndPos;
          setEdgeCreationState({
            edgeLength: projectedLength,
            toNodeId: null, // Clear target node ID when not snapped
          });
        }

        // Update preview nodes
        const previewStartNode: Node = {
          node_name: "preview_start",
          barcode: 0,
          editor_x: startPos.x,
          editor_y: startPos.y,
          editor_z: startPos.z,
          color: MENU_BLUE_COLOR,
          size: 0.1,
          source: "user" as const,
        };

        const previewEndNode: Node = {
          node_name: "preview_end",
          barcode: 0,
          editor_x: finalEndPos.x,
          editor_y: finalEndPos.y,
          editor_z: startPos.z,
          color: snappedToExistingNode ? "#ff6b6b" : MENU_BLUE_COLOR, // Different color when snapped
          size: snappedToExistingNode ? 0.15 : 0.1, // Slightly larger when snapped
          source: "user" as const,
        };

        setPreviewNodes([previewStartNode, previewEndNode]);

        return;
      }

      // Original preview logic for idle state
      if (edgeCreation.phase === "idle") {
        updatePreviewPosition(mousePosition);
      }
    },
    [
      getMousePosition3D,
      updatePreviewPosition,
      edgeCreation.phase,
      edgeCreation.startPosition,
      edgeCreation.currentDirection,
      setEdgeCreationState,
      setPreviewNodes,
      findNearestNode,
    ]
  );

  // Show/hide preview based on menu state and edge creation phase
  useEffect(() => {
    if (
      activeMainMenu === "MapBuilder" &&
      activeSubMenu === "map-menu-1" &&
      edgeCreation.phase === "idle"
    ) {
      // Show preview for straight edge mode only when not creating an edge
      const startX = currentMousePositionRef.current?.x || 0;
      const startY = currentMousePositionRef.current?.y || 0;

      const previewStartNode: Node = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: startX,
        editor_y: startY,
        editor_z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      const previewEndNode: Node = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: startX + 5,
        editor_y: startY,
        editor_z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      const previewEdge: Edge = {
        edge_name: "preview_edge",
        from_node: "preview_start",
        to_node: "preview_end",
        waypoints: ["preview_start", "preview_end"], // 직선은 시작점과 끝점만
        vos_rail_type: "S",
        distance: 0,
        color: MENU_BLUE_COLOR,
        opacity: 0.7,
        source: "user" as const,
        rendering_mode: "preview" as "normal" | "preview",
      };

      setPreviewEdge(previewEdge);
    } else if (edgeCreation.phase !== "idle") {
      // During edge creation, don't show the mouse-following preview
      // The edge creation preview is handled separately
    } else {
      // Hide preview when not in straight edge mode
      clearPreviewEdge();
      clearPreviewNodes();
      lastCreatedEdgeRef.current = null; // Clear last created edge on menu change
    }
  }, [
    activeMainMenu,
    activeSubMenu,
    edgeCreation.phase,
    setPreviewNodes,
    setPreviewEdge,
    clearPreviewEdge,
    clearPreviewNodes,
  ]);

  // Handle keyboard input for direction rotation (only works during idle phase)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle rotation only during idle phase (when start node is not fixed)
      if (edgeCreation.phase !== "idle") return;

      if (event.key === "r" || event.key === "R") {
        rotateEdgeDirection();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [edgeCreation.phase, rotateEdgeDirection]);

  // Update preview when direction changes during idle or adjusting phase
  useEffect(() => {
    if (edgeCreation.phase === "adjusting" && edgeCreation.startPosition) {
      const startPos = edgeCreation.startPosition;
      const direction = edgeCreation.currentDirection;
      const length = edgeCreation.edgeLength;

      // Calculate end position based on current direction
      const endPos = calculateEndPosition(
        startPos.x,
        startPos.y,
        direction,
        length
      );

      // Update preview nodes
      const previewStartNode: Node = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: startPos.x,
        editor_y: startPos.y,
        editor_z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      const previewEndNode: Node = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: endPos.x,
        editor_y: endPos.y,
        editor_z: startPos.z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);
    } else if (
      edgeCreation.phase === "idle" &&
      currentMousePositionRef.current
    ) {
      // Update preview in idle state based on current mouse position and direction
      const mousePos = currentMousePositionRef.current;
      const direction = edgeCreation.currentDirection;
      const length = 5; // Default preview length

      // Calculate end position based on current direction
      const endPos = calculateEndPosition(
        mousePos.x,
        mousePos.y,
        direction,
        length
      );

      // Update preview nodes
      const previewStartNode: NodeData = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: mousePos.x,
        editor_y: mousePos.y,
        editor_z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      const previewEndNode: NodeData = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: endPos.x,
        editor_y: endPos.y,
        editor_z: 30.1,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);
    }
  }, [
    edgeCreation.phase,
    edgeCreation.currentDirection,
    edgeCreation.startPosition,
    edgeCreation.edgeLength,
    calculateEndPosition,
    setPreviewNodes,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPreviewEdge();
      clearPreviewNodes();
      resetEdgeCreation();
      lastCreatedEdgeRef.current = null;
    };
  }, [clearPreviewEdge, clearPreviewNodes, resetEdgeCreation]);

  // Phase 1: Start edge creation - check for snapping at start position
  const startEdgeCreation = useCallback(
    (point: THREE.Vector3) => {
      let startX = point.x;
      let startY = point.y;
      const z = 30; // Fixed z coordinate

      // Check if clicking near an existing node
      const nearestStartNode = findNearestNode(
        new THREE.Vector3(startX, startY, z)
      );
      let fromNodeId;

      if (nearestStartNode) {
        // Use existing node as start
        fromNodeId = nearestStartNode.node_name;
        startX = nearestStartNode.editor_x;
        startY = nearestStartNode.editor_y;
      } else {
        // Create new start node
        const startNodeName = generateNodeName();
        const startNode: NodeData = {
          node_name: startNodeName,
          barcode: 0,
          editor_x: startX,
          editor_y: startY,
          editor_z: z,
          color: MENU_BLUE_COLOR,
          size: 0.1,
          source: "user" as const,
        };

        addNode(startNode);
        fromNodeId = startNodeName;
      }

      // Set edge creation state - directly to adjusting phase
      const currentDirection = edgeCreation.currentDirection; // 현재 회전된 방향 유지
      setEdgeCreationState({
        phase: "adjusting",
        startPosition: { x: startX, y: startY, z },
        fromNodeId: fromNodeId,
        currentDirection: currentDirection, // 현재 방향 유지
        edgeLength: 5, // Default length
      });

      // Create preview nodes for the edge preview (start + end)
      const endPos = calculateEndPosition(startX, startY, currentDirection, 5);
      const previewStartNode: NodeData = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: startX,
        editor_y: startY,
        editor_z: z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      const previewEndNode: NodeData = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: endPos.x,
        editor_y: endPos.y,
        editor_z: z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      // Create preview edge
      const previewEdge: Edge = {
        edge_name: "creating_edge",
        from_node: "preview_start",
        to_node: "preview_end",
        waypoints: ["preview_start", "preview_end"], // 직선은 시작점과 끝점만
        vos_rail_type: "S",
        distance: 0,
        color: MENU_BLUE_COLOR,
        opacity: 0.7,
        source: "user" as const,
        rendering_mode: "preview" as "normal" | "preview",
      };

      setPreviewEdge(previewEdge);
    },
    [
      addNode,
      generateNodeName,
      setEdgeCreationState,
      setPreviewEdge,
      setPreviewNodes,
      calculateEndPosition,
      findNearestNode,
      edgeCreation.currentDirection,
    ]
  );

  // Phase 2: Finalize edge creation
  const finalizeEdge = useCallback(() => {
    if (!edgeCreation.fromNodeId || !edgeCreation.startPosition) return;

    const { previewNodes } = useNodeStore.getState();
    if (previewNodes.length < 2) return;

    const endNode = previewNodes[1];
    let toNodeId;

    // Check if we're snapping to an existing node
    if (edgeCreation.snappedToNodeId) {
      // Use existing node
      toNodeId = edgeCreation.snappedToNodeId;
    } else {
      // Create new end node
      const endNodeName = generateNodeName();
      const finalEndNode: NodeData = {
        node_name: endNodeName,
        barcode: 0,
        editor_x: endNode.editor_x,
        editor_y: endNode.editor_y,
        editor_z: endNode.editor_z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      addNode(finalEndNode);
      toNodeId = endNodeName;
    }

    // Create final edge
    const finalEdge: Edge = {
      edge_name: generateEdgeId(),
      from_node: edgeCreation.fromNodeId,
      to_node: toNodeId,
      waypoints: [edgeCreation.fromNodeId, toNodeId], // 직선은 시작점과 끝점만
      vos_rail_type: "S",
      distance: 0,
      color: MENU_BLUE_COLOR,
      opacity: 1.0,
      source: "user" as const,
      rendering_mode: "normal" as "normal" | "preview",
    };

    addEdge(finalEdge);

    // 연속 생성 모드: toNode를 다음 시작노드로 설정
    const toNodeData = useNodeStore.getState().getNodeByName(toNodeId);
    if (toNodeData) {
      setEdgeCreationState({
        phase: "adjusting",
        startPosition: {
          x: toNodeData.editor_x,
          y: toNodeData.editor_y,
          z: toNodeData.editor_z,
        },
        fromNodeId: toNodeId,
        currentDirection: 0, // 기본 방향으로 리셋
        edgeLength: 5, // 기본 길이로 리셋
      });
    } else {
      resetEdgeCreation();
    }
  }, [
    edgeCreation.fromNodeId,
    edgeCreation.startPosition,
    edgeCreation.snappedToNodeId,
    generateNodeName,
    addNode,
    generateEdgeId,
    addEdge,
    resetEdgeCreation,
    setEdgeCreationState,
  ]);

  // Handle mouse click for straight edge creation
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      const mousePosition = getMousePosition3D(event.nativeEvent);
      if (!mousePosition) return;

      // Handle edge creation phases
      switch (edgeCreation.phase) {
        case "idle":
          // 첫 번째 엣지 생성 시작
          startEdgeCreation(mousePosition);
          break;
        case "adjusting":
          // 엣지 생성 완료 (연속 모드로 다음 엣지 준비됨)
          finalizeEdge();
          break;
      }
    },
    [getMousePosition3D, edgeCreation.phase, startEdgeCreation, finalizeEdge]
  );

  // Only render when straight edge is selected
  if (activeMainMenu !== "MapBuilder" || activeSubMenu !== "map-menu-1") {
    return null;
  }

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerMove={handleMouseMove}
      visible={false} // Invisible click handler
      position={[0, 0, 0]}
    >
      {/* Large invisible plane to catch clicks and mouse moves */}
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default StraightEdge;
