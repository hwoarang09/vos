import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCameraStore } from "@store/cameraStore";
import { useMenuStore } from "@store/menuStore";
import { OrbitControls } from 'three-stdlib';

const CameraController: React.FC = () => {
  const { camera, controls } = useThree(); // controls는 drei가 set해줌

  // Only use rotation requests from store, not position/target
  const rotateZDeg = useCameraStore((s) => s.rotateZDeg);
  const _resetRotateZ = useCameraStore((s) => s._resetRotateZ);

  // Menu state for Bay Builder detection
  const { activeMainMenu, activeSubMenu } = useMenuStore();

  // Store original camera state for restoration
  const originalStateRef = useRef<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    target: THREE.Vector3;
    enableRotate: boolean;
    mouseButtons: {
      LEFT: number;
      MIDDLE: number;
      RIGHT: number;
    };
  } | null>(null);

  // Z-up 보정 (항상 유지)
  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, [camera, activeMainMenu, activeSubMenu]); // 메뉴 변경 시에도 Z-up 유지

  // Bay Builder mode detection and Top View switching
  useEffect(() => {
    const isBayBuilderMode = activeMainMenu === "LayoutBuilder" && activeSubMenu === "layout-menu-1";

    if (!controls) return;
    const orbitControls = controls as OrbitControls;

    if (isBayBuilderMode && !originalStateRef.current) {
      // Save original state before switching to top view
      originalStateRef.current = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone(),
        target: orbitControls.target.clone(),
        enableRotate: orbitControls.enableRotate,
        mouseButtons: {
          LEFT: orbitControls.mouseButtons.LEFT || 0,
          MIDDLE: orbitControls.mouseButtons.MIDDLE || 1,
          RIGHT: orbitControls.mouseButtons.RIGHT || 2,
        },
      };

      // Switch to top view
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
      camera.up.set(0, 1, 0); // Y-up for top view
      camera.updateProjectionMatrix();

      // Configure controls for Bay Builder mode
      orbitControls.target.set(0, 0, 0);
      orbitControls.enableRotate = false;
      orbitControls.enablePan = true;
      orbitControls.enableZoom = true;

      // Remap mouse buttons for Bay Builder mode
      orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      orbitControls.mouseButtons.RIGHT = undefined;

      orbitControls.update();

    } else if (!isBayBuilderMode && originalStateRef.current) {
      // When leaving Bay Builder mode, only restore controls (keep current camera position)
      camera.up.set(0, 0, 1); // Restore Z-up

      orbitControls.enableRotate = originalStateRef.current.enableRotate;
      orbitControls.enablePan = true;
      orbitControls.enableZoom = true;

      // Restore original mouse button settings
      orbitControls.mouseButtons.LEFT = originalStateRef.current.mouseButtons.LEFT;
      orbitControls.mouseButtons.MIDDLE = originalStateRef.current.mouseButtons.MIDDLE;
      orbitControls.mouseButtons.RIGHT = originalStateRef.current.mouseButtons.RIGHT;

      orbitControls.update();

      originalStateRef.current = null;
    }
  }, [activeMainMenu, activeSubMenu, camera, controls]);

  // WSAD keyboard movement for Bay Builder mode
  useEffect(() => {
    const isBayBuilderMode = activeMainMenu === "LayoutBuilder" && activeSubMenu === "layout-menu-1";
    if (!isBayBuilderMode) return;

    const moveSpeed = 2; // Movement speed
    const pressedKeys = new Set<string>();

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.add(event.key.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key.toLowerCase());
    };

    const updateCameraPosition = () => {
      if (!isBayBuilderMode || !controls) return;

      let deltaX = 0;
      let deltaY = 0;

      // WSAD movement
      if (pressedKeys.has('w')) deltaY += moveSpeed;
      if (pressedKeys.has('s')) deltaY -= moveSpeed;
      if (pressedKeys.has('a')) deltaX -= moveSpeed;
      if (pressedKeys.has('d')) deltaX += moveSpeed;

      if (deltaX !== 0 || deltaY !== 0) {
        const orbitControls = controls as OrbitControls;

        // Move camera and target together to maintain top-down view
        camera.position.x += deltaX;
        camera.position.y += deltaY;
        orbitControls.target.x += deltaX;
        orbitControls.target.y += deltaY;

        orbitControls.update();
      }
    };

    // Animation loop for smooth movement
    let animationId: number;
    const animate = () => {
      updateCameraPosition();
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animate();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [activeMainMenu, activeSubMenu, camera, controls]);

  // Z축 회전 처리 (Bay Builder 모드가 아닐 때만)
  useEffect(() => {
    if (!controls) return;

    // Bay Builder 모드에서는 기존 카메라 로직을 무시
    const isBayBuilderMode = activeMainMenu === "LayoutBuilder" && activeSubMenu === "layout-menu-1";
    if (isBayBuilderMode) return;

    // 회전 요청이 있으면 현재 target 기준으로 Z축 공전
    if (rotateZDeg !== 0) {
      const currentTarget = (controls as any).target;
      const axis = new THREE.Vector3(0, 0, 1);
      camera.position
        .sub(currentTarget)
        .applyAxisAngle(axis, THREE.MathUtils.degToRad(rotateZDeg))
        .add(currentTarget);
      _resetRotateZ();

      // @ts-ignore
      controls.update();
    }
  }, [camera, controls, rotateZDeg, _resetRotateZ, activeMainMenu, activeSubMenu]);

  return null;
};

export default CameraController;
