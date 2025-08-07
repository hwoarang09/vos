import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRenderer, RendererConfig } from '../hooks/useRenderer';

interface GenericRendererProps<T extends { id: string }> {
  config: RendererConfig<T>;
}

/**
 * Individual item component with memoization
 * Creates its own geometry and material for better performance
 */
const MemoizedItem = React.memo<{
  item: any;
  config: RendererConfig<any>;
  position: [number, number, number];
}>(({ item, config, position }) => {
  // Create geometry only for this item (memoized by item properties)
  const geometry = useMemo(() => {
    return config.createGeometry(item);
  }, [item, config.createGeometry]);

  // Create material only for this item (memoized by item properties)
  const material = useMemo(() => {
    const uniforms = config.createUniforms(item);

    return new THREE.ShaderMaterial({
      vertexShader: config.vertexShader,
      fragmentShader: config.fragmentShader,
      uniforms,
      transparent: config.materialConfig?.transparent ?? true,
      side: config.materialConfig?.side ?? THREE.FrontSide,
      depthWrite: config.materialConfig?.depthWrite ?? true,
      blending: config.materialConfig?.blending ?? THREE.NormalBlending,
    });
  }, [item, config]);

  // Update time uniform for animation
  useFrame((state) => {
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
    />
  );
}, (prevProps, nextProps) => {
  // Use the config's comparison function
  return prevProps.config.compareItems(prevProps.item, nextProps.item) &&
         prevProps.position[0] === nextProps.position[0] &&
         prevProps.position[1] === nextProps.position[1] &&
         prevProps.position[2] === nextProps.position[2];
});

/**
 * Generic renderer component that can render any type of data
 * with custom shaders and geometries
 */
function GenericRenderer<T extends { id: string }>({ config }: GenericRendererProps<T>) {
  const { renderData } = useRenderer(config);

  return (
    <group>
      {renderData.map(({ id, item, position }) => (
        <MemoizedItem
          key={id}
          item={item}
          config={config}
          position={position}
        />
      ))}
    </group>
  );
}

export default GenericRenderer;
