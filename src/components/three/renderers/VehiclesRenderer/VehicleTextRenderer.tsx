import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vehicleDataArray, VEHICLE_DATA_SIZE, MovementData } from "../../../../store/vehicle/arrayMode/vehicleDataArray";
import SpriteText from "three-spritetext";
import { getVehicleConfigSync } from "../../../../config/vehicleConfig";

/**
 * VehicleTextRenderer
 * - Renders vehicle ID labels for array mode
 * - Updates positions every frame to follow vehicles
 */

interface VehicleTextRendererProps {
  numVehicles: number;
}

const VehicleTextRenderer: React.FC<VehicleTextRendererProps> = ({ numVehicles }) => {
  const groupRef = useRef<THREE.Group>(null);

  const config = getVehicleConfigSync();
  const {
    LABEL: { TEXT_HEIGHT: labelTextHeight, Z_OFFSET: labelZOffset }
  } = config;

  // Create sprite texts for all vehicles (only once)
  const spriteTexts = useMemo(() => {
    const sprites: SpriteText[] = [];
    for (let i = 0; i < numVehicles; i++) {
      const sprite = new SpriteText(i.toString());
      sprite.color = "#ffffff";
      sprite.backgroundColor = "rgba(0, 0, 0, 0.5)";
      sprite.textHeight = labelTextHeight;
      sprites.push(sprite);
    }
    return sprites;
  }, [numVehicles, labelTextHeight]);

  // Update positions every frame (Zero GC - Direct Float32Array access)
  useFrame(() => {
    if (!groupRef.current) return;

    // ✅ Get Float32Array reference once (Zero allocation)
    const data = vehicleDataArray.getData();

    // ✅ Zero GC Loop - Direct array access
    spriteTexts.forEach((sprite, i) => {
      const ptr = i * VEHICLE_DATA_SIZE;

      // Direct read from Float32Array (no object allocation)
      const x = data[ptr + MovementData.X];
      const y = data[ptr + MovementData.Y];
      const z = data[ptr + MovementData.Z];

      sprite.position.set(x, y, z + labelZOffset);
    });
  });

  return (
    <group ref={groupRef} name="vehicle-text-labels">
      {spriteTexts.map((sprite, i) => (
        <primitive key={i} object={sprite} />
      ))}
    </group>
  );
};

export default VehicleTextRenderer;
