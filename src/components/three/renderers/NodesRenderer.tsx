// NodesRenderer.tsx - InstancedMesh version for all nodes
import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useNodeStore } from "../../../store/map/nodeStore";
import nodeVertexShader from "../entities/node/shaders/nodeVertex.glsl?raw";
import nodeFragmentShader from "../entities/node/shaders/nodeFragment.glsl?raw";

interface NodesRendererProps {
  nodeIds: string[];
}

/**
 * NodesRenderer - Renders all nodes using a single InstancedMesh
 * - Much more efficient than individual NodeInstance components
 * - Single useFrame for all nodes
 * - Updates instance matrices when node positions/colors change
 */
const NodesRenderer: React.FC<NodesRendererProps> = ({ nodeIds }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const nodeDataRef = useRef<Map<string, number>>(new Map()); // nodeId -> instanceIndex

  const instanceCount = nodeIds.length;

  const geometry = useMemo(() => new THREE.SphereGeometry(0.2, 16, 16), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nodeVertexShader,
        fragmentShader: nodeFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#ff6b6b") },
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

  // Build nodeId -> instanceIndex mapping
  useEffect(() => {
    const newMap = new Map<string, number>();
    nodeIds.forEach((nodeId, index) => {
      newMap.set(nodeId, index);
    });
    nodeDataRef.current = newMap;
  }, [nodeIds]);

  // Initialize instance matrices and colors
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh || instanceCount === 0) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    const getNodeByName = useNodeStore.getState().getNodeByName;

    nodeIds.forEach((nodeId, index) => {
      const node = getNodeByName(nodeId);
      if (!node) return;

      position.set(node.editor_x, node.editor_y, node.editor_z);
      const size = node.size ?? 1;
      scale.set(size, size, size);

      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);

      // Set color using instance color attribute (if needed)
      // For now, we'll use a single color for all nodes
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [nodeIds, instanceCount]);

  // Subscribe to node store changes and update matrices
  useEffect(() => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const unsub = useNodeStore.subscribe((state) => {
      let needsUpdate = false;

      nodeIds.forEach((nodeId) => {
        const node = state.getNodeByName(nodeId);
        const instanceIndex = nodeDataRef.current.get(nodeId);
        
        if (!node || instanceIndex === undefined) return;

        position.set(node.editor_x, node.editor_y, node.editor_z);
        const size = node.size ?? 1;
        scale.set(size, size, size);

        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(instanceIndex, matrix);
        needsUpdate = true;
      });

      if (needsUpdate) {
        mesh.instanceMatrix.needsUpdate = true;
      }
    });

    return unsub;
  }, [nodeIds]);

  // Single useFrame for all nodes - only update time uniform
  useFrame((state) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  if (instanceCount === 0) {
    return null;
  }

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, instanceCount]}
      frustumCulled={false}
    />
  );
};

export default NodesRenderer;

