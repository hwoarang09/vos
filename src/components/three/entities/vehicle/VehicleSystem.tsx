import { Physics } from "@react-three/rapier";
import VehicleRapierMode from "./vehicleRapierMode/VehicleRapierMode";
import VehicleArrayMode from "./vehicleArrayMode/vehicleArrayMode";
import VehicleSharedMemoryMode from "./VehicleSharedMemoryMode";
import VehiclesRenderer from "../../renderers/VehiclesRenderer/VehiclesRenderer";
import { getMaxVehicles } from "../../../../config/vehicleConfig";
import { getRapierModeConfig } from "../../../../config/visualizationConfig";

/**
 * VehicleSystem
 * - Unified component that combines vehicle logic and rendering
 * - Supports 3 modes: rapier-dict, array-single, shared-memory
 * - Easy mode switching for performance comparison
 */

export type VehicleSystemMode = "rapier-dict" | "array-single" | "shared-memory";

interface VehicleSystemProps {
  mode: VehicleSystemMode;
  numVehicles?: number;
  maxVehicles?: number;
}

const VehicleSystem: React.FC<VehicleSystemProps> = ({
  mode,
  numVehicles = 100,
  maxVehicles = getMaxVehicles(),
}) => {
  const needsPhysics = mode === "rapier-dict";
  const rapierConfig = getRapierModeConfig();

  const content = (
    <>
      {/* Rapier Dict mode: logic + rendering separated */}
      {mode === "rapier-dict" && (
        <>
          <VehicleRapierMode
            numVehicles={numVehicles}
            mode="rapier"
          />
          <VehiclesRenderer
            mode={mode}
            numVehicles={numVehicles}
          />
        </>
      )}

      {/* Array Single mode: logic + rendering separated */}
      {mode === "array-single" && (
        <>
          <VehicleArrayMode numVehicles={numVehicles} />
          <VehiclesRenderer
            mode={mode}
            numVehicles={numVehicles}
          />
        </>
      )}

      {/* Shared Memory mode: logic + rendering separated */}
      {mode === "shared-memory" && (
        <>
          <VehicleSharedMemoryMode numVehicles={numVehicles} />
          <VehiclesRenderer
            mode={mode}
            numVehicles={numVehicles}
          />
        </>
      )}
    </>
  );

  if (needsPhysics) {
    return (
      <Physics gravity={[0, 0, 0]} debug={rapierConfig.SHOW_PHYSICS_DEBUG}>
        {content}
      </Physics>
    );
  }

  return content;
};

export default VehicleSystem;