import React, { useState, useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useMenuStore } from '../../../../store/menuStore';
import * as THREE from 'three';

/**
 * BayBuilder component - Creates rectangular bay areas with Ctrl+Drag
 * Camera management is handled by CameraController
 */
const BayBuilder: React.FC = () => {
  const { activeMainMenu, activeSubMenu } = useMenuStore();
  const { camera, raycaster } = useThree();

  // Rectangle drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [endPoint, setEndPoint] = useState<THREE.Vector3 | null>(null);

  const meshRef = useRef<THREE.Mesh>(null);

  // Only render when BayBuilder is active
  if (activeMainMenu !== "LayoutBuilder" || activeSubMenu !== "layout-menu-1") {
    console.log('❌ BayBuilder not active:', { activeMainMenu, activeSubMenu });
    return null;
  }

  console.log('✅ BayBuilder is active and rendering');

  // Get 3D position from mouse event
  const getMousePosition3D = useCallback((event: MouseEvent | PointerEvent) => {
    console.log('🎯 Getting 3D position from mouse event');

    if (!meshRef.current) {
      console.log('❌ No mesh ref available');
      return null;
    }

    const rect = (event.target as HTMLCanvasElement)?.getBoundingClientRect();
    if (!rect) {
      console.log('❌ No canvas rect available');
      return null;
    }

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    console.log('📐 Normalized coordinates:', { x, y });

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObject(meshRef.current);

    console.log('🔍 Raycaster intersects:', intersects.length);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      // Force Z coordinate to match interaction plane level
      point.z = 5;
      console.log('✅ 3D intersection point (Z fixed to 5):', point);
      return point;
    }

    console.log('❌ No intersections found');
    return null;
  }, [camera, raycaster]);

  // Handle mouse down
  const handleMouseDown = useCallback((event: any) => {
    console.log('🖱️ Mouse down event:', {
      ctrlKey: event.ctrlKey,
      button: event.button,
      type: event.type,
      nativeEvent: event.nativeEvent
    });

    // Check both event and nativeEvent for ctrlKey
    const isCtrlPressed = event.ctrlKey || event.nativeEvent?.ctrlKey;
    console.log('🔍 Ctrl key check:', {
      eventCtrl: event.ctrlKey,
      nativeCtrl: event.nativeEvent?.ctrlKey,
      isCtrlPressed
    });

    // Only start drawing if Ctrl is pressed
    if (!isCtrlPressed) {
      console.log('❌ Ctrl key not pressed, ignoring mouse down');
      return;
    }

    console.log('✅ Ctrl key pressed, attempting to get 3D position');
    const mousePos = getMousePosition3D(event.nativeEvent || event);
    console.log('📍 Mouse 3D position:', mousePos);

    if (!mousePos) {
      console.log('❌ Failed to get 3D position');
      return;
    }

    console.log('🎯 Starting rectangle drawing at:', mousePos);
    console.log('🟢 Setting isDrawing to true');
    setIsDrawing(true);
    setStartPoint(mousePos.clone());
    setEndPoint(mousePos.clone());
  }, [getMousePosition3D]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: any) => {
    if (!isDrawing || !startPoint) {
      // Only log if we're in drawing mode but missing requirements
      if (isDrawing && !startPoint) {
        console.log('⚠️ Drawing mode but no start point');
      }
      return;
    }

    const mousePos = getMousePosition3D(event.nativeEvent);
    if (!mousePos) {
      console.log('⚠️ Failed to get 3D position during drag');
      return;
    }

    console.log('🖱️ Dragging to:', mousePos, 'from:', startPoint);
    setEndPoint(mousePos.clone());
  }, [isDrawing, startPoint, getMousePosition3D]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    console.log('🖱️ Mouse up event:', {
      isDrawing,
      hasStartPoint: !!startPoint,
      hasEndPoint: !!endPoint
    });

    if (!isDrawing || !startPoint || !endPoint) {
      console.log('❌ Cannot complete rectangle - missing requirements');
      return;
    }

    // Log the completed rectangle but don't save it
    console.log('✅ Rectangle completed:', {
      start: { x: startPoint.x, y: startPoint.y, z: startPoint.z },
      end: { x: endPoint.x, y: endPoint.y, z: endPoint.z },
      width: Math.abs(endPoint.x - startPoint.x),
      height: Math.abs(endPoint.y - startPoint.y)
    });

    // Clear drawing state - rectangle will disappear
    setIsDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
  }, [isDrawing, startPoint, endPoint]);

  // Create rectangle geometry
  const createRectangleGeometry = useCallback((start: THREE.Vector3, end: THREE.Vector3) => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;

    console.log('📐 Rectangle geometry:', {
      width,
      height,
      centerX,
      centerY,
      start: { x: start.x, y: start.y, z: start.z },
      end: { x: end.x, y: end.y, z: end.z }
    });

    return {
      position: [centerX, centerY, 5] as [number, number, number], // Same Z level as interaction plane
      args: [Math.max(width, 0.5), Math.max(height, 0.5)] as [number, number] // Minimum size for visibility
    };
  }, []);

  return (
    <>
      {/* Invisible plane for mouse interactions - XY plane at Z=5 */}
      <mesh
        ref={meshRef}
        position={[0, 0, 5]}
        rotation={[0, 0, 0]} // XY plane (no rotation)
        visible={false}
        onPointerDown={(e) => {
          console.log('🖱️ Pointer down event triggered!', e);
          handleMouseDown(e);
        }}
        onPointerMove={(e) => {
          // Only log if we're drawing to avoid spam
          if (isDrawing) {
            console.log('🖱️ Pointer move event triggered!');
          }
          handleMouseMove(e);
        }}
        onPointerUp={(e) => {
          console.log('🖱️ Pointer up event triggered!');
          handleMouseUp();
        }}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshBasicMaterial />
      </mesh>

      {/* Debug: Visible plane to see interaction area */}
      <mesh
        position={[0, 0, 5.01]}
        rotation={[0, 0, 0]} // XY plane
        visible={true}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Current drawing rectangle (while dragging) */}
      {(() => {
        console.log('🔍 Drawing state check:', {
          isDrawing,
          hasStartPoint: !!startPoint,
          hasEndPoint: !!endPoint,
          startPoint: startPoint ? { x: startPoint.x, y: startPoint.y, z: startPoint.z } : null,
          endPoint: endPoint ? { x: endPoint.x, y: endPoint.y, z: endPoint.z } : null
        });

        if (isDrawing && startPoint && endPoint) {
          const rectGeom = createRectangleGeometry(startPoint, endPoint);
          console.log('🟢 Rendering current drawing rectangle:', rectGeom);
          return (
            <group>
              {/* Bright green rectangle for visibility */}
              <mesh position={rectGeom.position}>
                <planeGeometry args={rectGeom.args} />
                <meshBasicMaterial
                  color="#00ff00"
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Bright border */}
              <lineSegments position={rectGeom.position}>
                <edgesGeometry args={[new THREE.PlaneGeometry(rectGeom.args[0], rectGeom.args[1])]} />
                <lineBasicMaterial color="#ffffff" linewidth={4} />
              </lineSegments>
            </group>
          );
        }
        return null;
      })()}

      {/* Completed rectangles removed - only show during drag */}

      {/* Test rectangle for debugging - always visible */}
      <group>
        <mesh position={[0, 0, 5.02]}>
          <planeGeometry args={[10, 5]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments position={[0, 0, 5.02]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(10, 5)]} />
          <lineBasicMaterial color="#ffffff" linewidth={3} />
        </lineSegments>
      </group>
    </>
  );
};

export default BayBuilder;
