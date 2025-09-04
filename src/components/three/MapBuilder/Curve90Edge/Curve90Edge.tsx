import React, { useRef, useCallback, useEffect } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { useMenuStore } from "@store/menuStore";
import { useMapStore } from "@store/edgeStore";
import { useNodeStore } from "@store/nodeStore";
import { Edge, Node } from "../../../../types";
import * as THREE from "three";
import { useRenderCheck } from "../../../../utils/renderDebug";

/**
 * Curve90Edge component - Handles 90-degree curve edge creation
 */
const Curve90Edge: React.FC = () => {
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

  // Render debugging
  useRenderCheck("Curve90Edge");

  const meshRef = useRef<THREE.Mesh>(null);
  const currentMousePositionRef = useRef<THREE.Vector3 | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastCreatedEdgeRef = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Curve direction state (right or left)
  const curveDirectionRef = useRef<"right" | "left">("right");

  const MENU_BLUE_COLOR = "#5ec5ff";

  // Generate unique edge ID
  const generateEdgeId = useCallback(() => {
    return `CURVE90_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Calculate 90-degree curve end position
  const calculateCurve90EndPosition = useCallback(
    (
      startX: number,
      startY: number,
      startDirection: number,
      curveDirection: "right" | "left",
      radius: number = 5
    ) => {
      const startRadians = (startDirection * Math.PI) / 180;

      // Calculate curve direction modifier
      const curveModifier = curveDirection === "right" ? -1 : 1; // right = clockwise, left = counterclockwise

      // Calculate center of the curve
      const centerX = startX + Math.sin(startRadians) * radius * curveModifier;
      const centerY = startY - Math.cos(startRadians) * radius * curveModifier;

      // Calculate end position (90 degrees from start)
      const endDirection =
        startDirection + (curveDirection === "right" ? 90 : -90);
      const endRadians = (endDirection * Math.PI) / 180;

      const endX = centerX + Math.cos(endRadians) * radius;
      const endY = centerY + Math.sin(endRadians) * radius;

      return { x: endX, y: endY, centerX, centerY, endDirection };
    },
    []
  );

  // Find nearest node within snap distance
  const findNearestNode = useCallback(
    (position: THREE.Vector3, excludeNodeId?: string) => {
      const snapDistance = 2.0;
      const { nodes } = useNodeStore.getState();

      let nearestNode = null;
      let minDistance = snapDistance;

      for (const node of nodes) {
        if (excludeNodeId && node.node_name === excludeNodeId) continue;

        const distance = Math.hypot(
          position.x - node.editor_x,
          position.y - node.editor_y
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestNode = node;
        }
      }

      return nearestNode;
    },
    []
  );

  // Update preview position for idle state
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
      const z = 30.1; // Preview z coordinate

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

      // Calculate curve end position
      const curveResult = calculateCurve90EndPosition(
        startX,
        startY,
        edgeCreation.currentDirection,
        curveDirectionRef.current
      );

      // Check for snapping for end position
      const nearestEndNode = findNearestNode(
        new THREE.Vector3(curveResult.x, curveResult.y, z)
      );
      let endSnapped = false;
      let finalEndX = curveResult.x;
      let finalEndY = curveResult.y;
      if (nearestEndNode) {
        finalEndX = nearestEndNode.editor_x;
        finalEndY = nearestEndNode.editor_y;
        endSnapped = true;
      }

      currentMousePositionRef.current = point;
      updatePreviewNodesPosition(
        [startX, startY, z],
        [finalEndX, finalEndY, z]
      );

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
        editor_x: finalEndX,
        editor_y: finalEndY,
        editor_z: z,
        color: endSnapped ? "#ff6b6b" : MENU_BLUE_COLOR,
        size: endSnapped ? 0.15 : 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);
      lastUpdateTimeRef.current = now;
    },
    [
      updatePreviewNodesPosition,
      findNearestNode,
      setPreviewNodes,
      calculateCurve90EndPosition,
      edgeCreation.currentDirection,
    ]
  );

  // Get mouse position in 3D world coordinates
  const getMousePosition3D = useCallback(
    (event: MouseEvent) => {
      if (!meshRef.current) return null;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObject(meshRef.current);

      if (intersects.length > 0) {
        return intersects[0].point;
      }

      // Fallback: project to z=30 plane
      const vector = new THREE.Vector3(x, y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = (30 - camera.position.z) / dir.z;
      return camera.position.clone().add(dir.multiplyScalar(distance));
    },
    [camera, raycaster]
  );

  // Toggle curve direction (right/left)
  const toggleCurveDirection = useCallback(() => {
    curveDirectionRef.current =
      curveDirectionRef.current === "right" ? "left" : "right";
  }, []);

  // Handle mouse move for curve preview
  const handleMouseMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const mousePosition = getMousePosition3D(event.nativeEvent);
      if (!mousePosition) return;

      // Handle curve adjustment during adjusting phase
      if (edgeCreation.phase === "adjusting" && edgeCreation.startPosition) {
        // For curve90, we don't adjust length like straight edge
        // The curve is fixed 90 degrees with fixed radius
        // Just update preview nodes based on current curve direction
        const startPos = edgeCreation.startPosition;
        const curveResult = calculateCurve90EndPosition(
          startPos.x,
          startPos.y,
          edgeCreation.currentDirection,
          curveDirectionRef.current
        );

        // Check for snapping at end position
        const nearestNode = findNearestNode(
          new THREE.Vector3(curveResult.x, curveResult.y, startPos.z),
          edgeCreation.fromNodeId ?? undefined
        );

        let finalEndPos = { x: curveResult.x, y: curveResult.y };
        let snappedToExistingNode = false;

        if (nearestNode) {
          finalEndPos = {
            x: nearestNode.editor_x,
            y: nearestNode.editor_y,
          };
          snappedToExistingNode = true;

          setEdgeCreationState({
            toNodeId: nearestNode.node_name,
          });
        } else {
          setEdgeCreationState({
            toNodeId: null,
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
          color: snappedToExistingNode ? "#ff6b6b" : MENU_BLUE_COLOR,
          size: snappedToExistingNode ? 0.15 : 0.1,
          source: "user" as const,
        };

        setPreviewNodes([previewStartNode, previewEndNode]);
        return;
      }

      // Handle idle state preview
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
      edgeCreation.fromNodeId,
      setEdgeCreationState,
      setPreviewNodes,
      findNearestNode,
      calculateCurve90EndPosition,
    ]
  );

  // Handle keyboard input for direction rotation and curve direction toggle
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle rotation only during idle phase (when start node is not fixed)
      if (edgeCreation.phase !== "idle") return;

      if (event.key === "r" || event.key === "R") {
        rotateEdgeDirection(); // Rotate start direction (0°, 90°, 180°, 270°)
      } else if (event.key === "c" || event.key === "C") {
        toggleCurveDirection(); // Toggle curve direction (right/left)
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [edgeCreation.phase, rotateEdgeDirection, toggleCurveDirection]);

  // Only render when curve90 edge is selected
  if (activeMainMenu !== "MapBuilder" || activeSubMenu !== "map-menu-2") {
    return null;
  }

  // Start curve creation
  const startCurveCreation = useCallback(
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
        const startNode: Node = {
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
        edgeLength: 5, // Default length (not used for curve90 but kept for compatibility)
      });

      // Calculate curve end position
      const curveResult = calculateCurve90EndPosition(
        startX,
        startY,
        currentDirection,
        curveDirectionRef.current
      );

      // Create preview nodes for the curve preview (start + end)
      const previewStartNode: Node = {
        node_name: "preview_start",
        barcode: 0,
        editor_x: startX,
        editor_y: startY,
        editor_z: z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      const previewEndNode: Node = {
        node_name: "preview_end",
        barcode: 0,
        editor_x: curveResult.x,
        editor_y: curveResult.y,
        editor_z: z,
        color: MENU_BLUE_COLOR,
        size: 0.1,
        source: "user" as const,
      };

      setPreviewNodes([previewStartNode, previewEndNode]);

      // Create preview edge
      const previewEdge: Edge = {
        edge_name: "creating_curve90",
        from_node: "preview_start",
        to_node: "preview_end",
        waypoints: ["preview_start", "preview_end"], // 90도 커브는 시작점과 끝점만
        vos_rail_type: "C90", // Curve 90 type
        distance: 0,
        radius: 0.5, // 0.5m 반지름
        rotation: 90, // 90도 회전
        curve_direction: curveDirectionRef.current, // 커브 방향 정보 추가
        start_direction: edgeCreation.currentDirection, // 시작 방향 정보 추가
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
      calculateCurve90EndPosition,
      findNearestNode,
      edgeCreation.currentDirection,
    ]
  );

  // Finalize curve creation
  const finalizeCurve = useCallback(() => {
    if (!edgeCreation.fromNodeId || !edgeCreation.startPosition) return;

    const { previewNodes } = useNodeStore.getState();
    if (previewNodes.length < 2) return;

    const endNode = previewNodes[1];
    let toNodeId;

    // Check if we're snapping to an existing node
    if (edgeCreation.toNodeId) {
      // Use existing node
      toNodeId = edgeCreation.toNodeId;
    } else {
      // Create new end node
      const endNodeName = generateNodeName();
      const finalEndNode: Node = {
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

    // Create final curve edge
    const finalEdge: Edge = {
      edge_name: generateEdgeId(),
      from_node: edgeCreation.fromNodeId,
      to_node: toNodeId,
      waypoints: [edgeCreation.fromNodeId, toNodeId], // 90도 커브는 시작점과 끝점만
      vos_rail_type: "C90",
      distance: 0,
      radius: 0.5, // 0.5m 반지름
      rotation: 90, // 90도 회전
      curve_direction: curveDirectionRef.current, // 커브 방향 정보 추가
      start_direction: edgeCreation.currentDirection, // 시작 방향 정보 추가
      color: MENU_BLUE_COLOR,
      opacity: 1.0,
      source: "user" as const,
      rendering_mode: "normal" as "normal" | "preview",
    };

    addEdge(finalEdge);

    // 연속 생성 모드: toNode를 다음 시작노드로 설정
    const toNodeData = useNodeStore.getState().getNodeByName(toNodeId);
    if (toNodeData) {
      // Calculate the end direction of the curve for continuous creation
      const curveResult = calculateCurve90EndPosition(
        edgeCreation.startPosition.x,
        edgeCreation.startPosition.y,
        edgeCreation.currentDirection,
        curveDirectionRef.current
      );

      setEdgeCreationState({
        phase: "adjusting",
        startPosition: {
          x: toNodeData.editor_x,
          y: toNodeData.editor_y,
          z: toNodeData.editor_z,
        },
        fromNodeId: toNodeId,
        currentDirection: curveResult.endDirection, // Use the end direction of the curve
        edgeLength: 5, // Default length
      });
    } else {
      resetEdgeCreation();
    }
  }, [
    edgeCreation.fromNodeId,
    edgeCreation.startPosition,
    edgeCreation.toNodeId,
    edgeCreation.currentDirection,
    generateNodeName,
    addNode,
    generateEdgeId,
    addEdge,
    resetEdgeCreation,
    setEdgeCreationState,
    calculateCurve90EndPosition,
  ]);

  // Handle mouse click for curve creation
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      const mousePosition = getMousePosition3D(event.nativeEvent);
      if (!mousePosition) return;

      // Handle curve creation phases
      switch (edgeCreation.phase) {
        case "idle":
          // 첫 번째 커브 생성 시작
          startCurveCreation(mousePosition);
          break;
        case "adjusting":
          // 커브 생성 완료 (연속 모드로 다음 커브 준비됨)
          finalizeCurve();
          break;
      }
    },
    [getMousePosition3D, edgeCreation.phase, startCurveCreation, finalizeCurve]
  );

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerMove={handleMouseMove}
      visible={false} // Invisible click handler
      position={[0, 0, 0]}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

export default Curve90Edge;
