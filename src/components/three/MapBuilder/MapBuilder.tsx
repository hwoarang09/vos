import React, { useEffect } from 'react';
import { useMapStore } from '../../../store/edgeStore';
import RoadBuilder from './RoadBuilder';

/**
 * MapBuilder component - Manages map data in the store
 * This component is responsible for adding/editing/removing map elements
 * It does NOT render anything directly - that's MapRenderer's job
 */
const MapBuilder: React.FC = () => {
  const { addEdge, clearAll } = useMapStore();

  // Initialize with hardcoded test data
  useEffect(() => {
    // Clear existing data first
    clearAll();

    // Add test edges to the store
    const testEdges = [
      {
        id: 'edge1',
        startPosition: [0, 0, 30] as [number, number, number],
        endPosition: [15, 2, 30] as [number, number, number],
        color: '#ff0000', // Red
        opacity: 0.8
      },
      {
        id: 'edge2',
        startPosition: [5, 2, 30] as [number, number, number],
        endPosition: [-3, 4, 30] as [number, number, number],
        color: '#00ff00', // Green
        opacity: 0.9
      },
      {
        id: 'edge3',
        startPosition: [-3, 4, 30] as [number, number, number],
        endPosition: [2, -1,30] as [number, number, number],
        color: '#0000ff', // Blue
        opacity: 1.0
      }
    ];

    // Add each edge to the store
    testEdges.forEach(edge => addEdge(edge));
  }, [addEdge, clearAll]);

  // This component manages data and handles road building interactions
  return <RoadBuilder />;
};

export default MapBuilder;