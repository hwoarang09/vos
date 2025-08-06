import React, { useEffect } from 'react';
import { useMapStore } from '../../../store/edgeStore';
import { useNodeStore } from '../../../store/nodeStore';
import RoadBuilder from './RoadBuilder';

/**
 * MapBuilder component - Manages map data in the store
 * This component is responsible for adding/editing/removing map elements
 * It does NOT render anything directly - that's MapRenderer's job
 */
const MapBuilder: React.FC = () => {
  const { addEdge, clearAll } = useMapStore();
  const { addNode, clearNodes, setNodeCounter } = useNodeStore();

  // Initialize with hardcoded test data
  useEffect(() => {
    // Clear existing data first
    clearAll();
    clearNodes();

    // Add test nodes to the store
    const testNodes = [
      { id: 'NODE0001', name: 'NODE0001', x: 0, y: 0, z: 30, color: '#ff0000', size: 1.0 },
      { id: 'NODE0002', name: 'NODE0002', x: 15, y: 2, z: 30, color: '#ff0000', size: 1.0 },
      { id: 'NODE0003', name: 'NODE0003', x: 5, y: 2, z: 30, color: '#00ff00', size: 1.0 },
    ];

    // Add test edges to the store
    const testEdges = [
      {
        id: 'edge1',
        fromNode: 'NODE0001',
        toNode: 'NODE0002',
        color: '#ff0000', // Red
        opacity: 0.8,
        mode: "normal" as 'normal' | 'preview'
      },
      {
        id: 'edge2',
        fromNode: 'NODE0002',
        toNode: 'NODE0003',
        color: '#00ff00', // Green
        opacity: 0.9,
        mode: "normal" as 'normal' | 'preview'
      },
      {
        id: 'edge3',
        fromNode: 'NODE0003',
        toNode: 'NODE0001',
        color: '#0000ff', // Blue
        opacity: 1.0,
        mode: "normal" as 'normal' | 'preview'
      }
    ];

    // Add nodes and edges to the store
    testNodes.forEach(node => addNode(node));
    testEdges.forEach(edge => addEdge(edge));

    // Set node counter to 6 so next generated node will be NODE0006
    setNodeCounter(6);
  }, [addEdge, addNode, clearAll, clearNodes, setNodeCounter]);

  // This component manages data and handles road building interactions
  return <RoadBuilder />;
};

export default MapBuilder;