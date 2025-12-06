import React, { useEffect, useState } from "react";
import { useMenuStore } from "@store/ui/menuStore";
import { useCFGStore } from "@store/system/cfgStore";
import { useVehicleTestStore } from "@store/vehicle/vehicleTestStore";
import { useCameraStore } from "@store/ui/cameraStore";
import { VehicleSystemMode } from "../../three/entities/vehicle/VehicleSystem";
import VehicleTestUI from "./VehicleTestUI";

/**
 * VehicleTestRunner
 * - Automatically loads test map and starts vehicle test when test menu is selected
 * - Manages test lifecycle: map loading -> vehicle initialization -> test running
 * - Delegates UI rendering to VehicleTestUI
 */

interface VehicleTestRunnerProps {
  mode: VehicleSystemMode;
  mapName: string;
  numVehicles: number;
  cameraConfig?: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

const VehicleTestRunner: React.FC<VehicleTestRunnerProps> = ({
  mode,
  mapName,
  numVehicles,
  cameraConfig,
}) => {
  const { setActiveMainMenu } = useMenuStore();
  const { loadCFGFiles } = useCFGStore();
  const { startTest, stopTest, isPanelVisible, setPanelVisible } = useVehicleTestStore();
  const { setCameraView } = useCameraStore();
  const [testState, setTestState] = useState<
    "loading-map" | "initializing" | "running" | "error"
  >("loading-map");

  // Auto-load test map on mount
  useEffect(() => {
    const loadTestMap = async () => {
      try {
        setTestState("loading-map");
        console.log(`[VehicleTest] Loading test map: ${mapName} for mode: ${mode}`);

        // Load test map
        await loadCFGFiles(mapName);

        console.log(`[VehicleTest] Map loaded successfully: ${mapName}`);
        setTestState("initializing");

        // Set camera position if configured
        if (cameraConfig) {
          setCameraView(cameraConfig.position, cameraConfig.target);
          console.log(`[VehicleTest] Camera set to:`, cameraConfig);
        }

        // Wait a bit for map to render
        setTimeout(() => {
          setTestState("running");
          // Start the test in the store
          startTest(mode, numVehicles);
          console.log(`[VehicleTest] Test started: ${numVehicles} vehicles in ${mode} mode on ${mapName}`);
        }, 500);
      } catch (err) {
        console.error("[VehicleTest] Failed to load test map:", err);
        setTestState("error");
      }
    };

    loadTestMap();

    // Don't stop test on unmount - let it keep running!
    // User can manually stop with Delete or Stop Test button
  }, [mode, mapName, numVehicles, cameraConfig, loadCFGFiles, startTest, setCameraView]);

  const handleClose = () => {
    // Just hide the panel, don't stop the test
    setPanelVisible(false);
  };

  const handleStopTest = () => {
    // Stop the test and close menu
    stopTest();
    setActiveMainMenu(null);
  };

  return (
    <VehicleTestUI
      testState={testState}
      mode={mode}
      mapName={mapName}
      numVehicles={numVehicles}
      isPanelVisible={isPanelVisible}
      onClose={handleClose}
      onStopTest={handleStopTest}
    />
  );
};

export default VehicleTestRunner;

