import React from 'react';
import GenericRenderer from '../common/GenericRenderer';
import { RendererConfig } from '../hooks/useRenderer';
import stationVertexShader from './shaders/stationVertex.glsl?raw';
import stationFragmentShader from './shaders/stationFragment.glsl?raw';
import * as THREE from 'three';

// Station data interface (you can adjust this based on your needs)
export interface StationData {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  color?: string;
  size?: number;
  type?: 'loading' | 'unloading' | 'storage';
}

// Props for the StationRenderer container component
interface StationRendererProps {
  stations: StationData[];
}

// Station-specific renderer configuration
const createStationRendererConfig = (
  stations: StationData[],
  vertexShader: string,
  fragmentShader: string
): RendererConfig<StationData> => ({
  data: stations,
  vertexShader,
  fragmentShader,
  createGeometry: (station) => {
    const size = station.size || 2.0;
    // Use box geometry for stations to differentiate from nodes
    return new THREE.BoxGeometry(size, size, size * 0.5);
  },
  createUniforms: (station) => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(station.color || '#4ecdc4') },
    uOpacity: { value: 1.0 },
    uSize: { value: station.size || 2.0 },
    uStationType: { value: station.type === 'loading' ? 1.0 : station.type === 'unloading' ? 2.0 : 0.0 },
    uIsPreview: { value: 0.0 }
  }),
  getPosition: (station) => [station.x, station.y, station.z],
  compareItems: (prev, next) => (
    prev.id === next.id &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.z === next.z &&
    prev.color === next.color &&
    prev.size === next.size &&
    prev.type === next.type
  ),
});

/**
 * StationRenderer container component that renders multiple stations
 * Uses the generic renderer with station-specific configuration
 */
const StationRenderer: React.FC<StationRendererProps> = ({ stations }) => {
  const config = createStationRendererConfig(
    stations,
    stationVertexShader,
    stationFragmentShader
  );

  return <GenericRenderer config={config} />;
};

export default StationRenderer;