import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCameraStore } from "@store/cameraStore";
import { useMenuStore } from "@store/menuStore";
import { OrbitControls } from 'three-stdlib';

const CameraController: React.FC = () => {
  const { camera, controls } = useThree(); // controls는 drei가 set해줌

  const position = useCameraStore((s) => s.position);
  const target = useCameraStore((s) => s.target);
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

  // Z-up 보정 (한 번만)
  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, [camera]);

  // Bay Builder mode detection and Top View switching
  useEffect(() => {
    const isBayBuilderMode = activeMainMenu === "MapBuilder" && activeSubMenu === "map-menu-10";

    if (isBayBuilderMode && !originalStateRef.current) {
      // Save original state before switching to top view
      const orbitControls = controls as OrbitControls;
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
      camera.up.set(0, 1, 0);
      camera.updateProjectionMatrix();

      // Configure controls for Bay Builder mode
      orbitControls.target.set(0, 0, 0);
      orbitControls.enableRotate = false;
      orbitControls.enablePan = true; // Keep pan enabled for mouse drag
      orbitControls.enableZoom = true; // Keep zoom enabled

      // Remap mouse buttons: LEFT for pan, disable RIGHT rotation
      orbitControls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      orbitControls.mouseButtons.RIGHT = undefined; // Disable right click rotation

      orbitControls.update();

    } else if (!isBayBuilderMode && originalStateRef.current) {
      // Restore original state when leaving Bay Builder mode
      const orbitControls = controls as OrbitControls;

      camera.position.copy(originalStateRef.current.position);
      camera.rotation.copy(originalStateRef.current.rotation);
      camera.updateProjectionMatrix();

      orbitControls.target.copy(originalStateRef.current.target);
      orbitControls.enableRotate = originalStateRef.current.enableRotate;
      orbitControls.enablePan = true; // Restore pan
      orbitControls.enableZoom = true; // Restore zoom

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
    const isBayBuilderMode = activeMainMenu === "MapBuilder" && activeSubMenu === "map-menu-10";
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

  // 위치/타깃 반영 + Z축 공전 처리 + 컨트롤 동기화 (Bay Builder 모드가 아닐 때만)
  useEffect(() => {
    if (!controls) return;

    // Bay Builder 모드에서는 기존 카메라 로직을 무시
    const isBayBuilderMode = activeMainMenu === "MapBuilder" && activeSubMenu === "map-menu-10";
    if (isBayBuilderMode) return;

    // 1) 기본 위치/타깃 반영
    camera.position.copy(position);

    // 2) 회전 요청이 있으면 target 기준으로 Z축 공전
    if (rotateZDeg !== 0) {
      const axis = new THREE.Vector3(0, 0, 1);
      camera.position
        .sub(target)
        .applyAxisAngle(axis, THREE.MathUtils.degToRad(rotateZDeg))
        .add(target);
      _resetRotateZ();
    }

    // 3) 컨트롤 동기화
    // @ts-ignore - controls는 drei에서 주입되는 any
    controls.target.copy(target);
    // @ts-ignore
    controls.update();
  }, [camera, controls, position, target, rotateZDeg, _resetRotateZ, activeMainMenu, activeSubMenu]);

  return null;
};

export default CameraController;
