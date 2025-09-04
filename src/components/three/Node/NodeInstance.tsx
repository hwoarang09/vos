// NodeInstance.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNodeStore } from "../../../store/nodeStore";
import nodeVertexShader from "./shaders/nodeVertex.glsl?raw";
import nodeFragmentShader from "./shaders/nodeFragment.glsl?raw";

interface NodeInstanceProps {
  nodeId: string;
  isPreview?: boolean; // preview 모드인지 여부
}

/**
 * High-performance node renderer for a single node.
 * - Subscribes to the specific node in Zustand and updates refs only (no React re-render)
 * - Geometry and material are created once and reused
 * - Per-frame transforms/uniforms are updated in useFrame
 */
const NodeInstance: React.FC<NodeInstanceProps> = ({
  nodeId,
  isPreview = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Store latest node props in refs (position, size, color)
  const posRef = useRef(new THREE.Vector3());
  const sizeRef = useRef(1);
  const colorRef = useRef(new THREE.Color("#ff6b6b"));

  // Create once
  const geometry = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: colorRef.current.clone() },
          uOpacity: { value: 1.0 },
          uSize: { value: 0.1 },
          uIsPreview: { value: 0.0 },
        },
        transparent: true,
        side: THREE.FrontSide,
        depthWrite: true,
        blending: THREE.NormalBlending,
      }),
    []
  );

  // Subscribe to node updates without causing React re-renders
  useEffect(() => {
    if (isPreview) {
      // Preview nodes don't need subscription, they get data from previewNodes
      return;
    }

    // Initialize from current state
    const n = useNodeStore.getState().getNodeByName(nodeId);
    if (n) {
      posRef.current.set(n.editor_x, n.editor_y, n.editor_z);
      sizeRef.current = n.size ?? 1;
      colorRef.current.set(n.color ?? "#ff6b6b");
      (material.uniforms.uColor as any).value = colorRef.current;
      (material.uniforms.uSize as any).value = sizeRef.current;
    }

    const unsub = useNodeStore.subscribe((state) => {
      const node = state.getNodeByName(nodeId);
      if (!node) return;

      posRef.current.set(node.editor_x, node.editor_y, node.editor_z);
      const newSize = node.size ?? 1;
      if (newSize !== sizeRef.current) {
        sizeRef.current = newSize;
        (material.uniforms.uSize as any).value = newSize;
      }
      const newColor = node.color ?? "#ff6b6b";
      if (!colorRef.current.equals(new THREE.Color(newColor))) {
        colorRef.current.set(newColor);
        (material.uniforms.uColor as any).value = colorRef.current;
      }
    });
    return unsub;
  }, [nodeId, material, isPreview]);

  // Per-frame updates: position/scale and time uniform
  useFrame((state) => {
    (material.uniforms.uTime as any).value = state.clock.elapsedTime;

    const m = meshRef.current;
    if (!m) return;

    if (isPreview) {
      // Preview mode: get data from previewNodes
      const { previewNodes } = useNodeStore.getState();
      const previewNode = previewNodes.find((n) => n.node_name === nodeId);

      if (!previewNode) {
        m.visible = false;
        return;
      }

      // Update position and properties from preview node
      m.position.set(
        previewNode.editor_x,
        previewNode.editor_y,
        previewNode.editor_z
      );
      const size = previewNode.size ?? 1;
      m.scale.set(size, size, size);

      // Update material uniforms
      const color = previewNode.color ?? "#1e90ff";
      if (!colorRef.current.equals(new THREE.Color(color))) {
        colorRef.current.set(color);
        (material.uniforms.uColor as any).value = colorRef.current;
      }
      if (size !== sizeRef.current) {
        sizeRef.current = size;
        (material.uniforms.uSize as any).value = size;
      }

      m.visible = true;
    } else {
      // Normal mode: use refs
      const p = posRef.current;
      m.position.set(p.x, p.y, p.z);
      const s = sizeRef.current;
      m.scale.set(s, s, s);
      m.visible = true;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

export default NodeInstance;
