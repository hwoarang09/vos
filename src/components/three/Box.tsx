import React from "react";

interface BoxProps {
  color: string;
  onClick: () => void;
}

const Box: React.FC<BoxProps> = ({ color, onClick }) => (
  <mesh onClick={onClick}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={color} />
  </mesh>
);

export default Box;
