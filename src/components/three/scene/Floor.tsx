import React from 'react';

/**
 * Floor component - Creates a factory floor at z=0
 */
const Floor: React.FC = () => {
  return (
    <mesh position={[0, 0, -1]}>
      {/* Large plane for factory floor - normal vector points to +Z */}
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#404040"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

export default Floor;
