import React from 'react';
import EdgeRenderer from '../Edge/EdgeRenderer';

const MapBuilder: React.FC = () => {
  // Hardcoded edge data for testing
  const testEdges = [
    {
      id: 'edge1',
      startPosition: [0, 0, 0] as [number, number, number],
      endPosition: [5, 2, 3] as [number, number, number],
      color: '#ff0000', // Red
      opacity: 0.8
    },
    {
      id: 'edge2',
      startPosition: [5, 2, 3] as [number, number, number],
      endPosition: [-3, 4, -2] as [number, number, number],
      color: '#00ff00', // Green
      opacity: 0.9
    },
    {
      id: 'edge3',
      startPosition: [-3, 4, -2] as [number, number, number],
      endPosition: [2, -1, 5] as [number, number, number],
      color: '#0000ff', // Blue
      opacity: 1.0
    }
  ];

  return (
    <group>
      {/* Render all test edges */}
      {testEdges.map((edge) => (
        <EdgeRenderer
          key={edge.id}
          startPosition={edge.startPosition}
          endPosition={edge.endPosition}
          color={edge.color}
          opacity={edge.opacity}
        />
      ))}

      {/* Add some basic lighting for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </group>
  );
};

export default MapBuilder;