import React from "react";
import { useTextStore } from "@store/map/textStore";
import { VehicleSystemType } from "../../../../types/vehicle";
import { useVehicleTestStore } from "@store/vehicle/vehicleTestStore";
import MapTextRenderer from "./instanced/MapTextRenderer";
import VehicleTextRenderer from "./instanced/VehicleTextRenderer";

interface Props {
  scale?: number;
  nodeColor?: string;
  edgeColor?: string;
  vehicleColor?: string;
}

const TextRenderer: React.FC<Props> = ({
  scale = 0.6,
  nodeColor = "#00e5ff",
  edgeColor = "#ff9800",
  vehicleColor = "#ffffff",
}) => {
  const { mode } = useTextStore();
  const {  numVehicles } = useVehicleTestStore();

  const isArrayMode = mode === VehicleSystemType.ArraySingle;
  
  return (
    <group name="text-renderer">
      {/* Map texts (Node/Edge) */}
      <MapTextRenderer
        mode={isArrayMode ? VehicleSystemType.ArraySingle : VehicleSystemType.RapierDict}
        scale={scale}
        nodeColor={nodeColor}
        edgeColor={edgeColor}
      />

      {/* Vehicle texts (only in array mode test) */}
      { 
        <VehicleTextRenderer
          numVehicles={numVehicles}
          scale={scale * 1.8}
          color={vehicleColor}
        />
      }
    </group>
  );
};

export default TextRenderer;