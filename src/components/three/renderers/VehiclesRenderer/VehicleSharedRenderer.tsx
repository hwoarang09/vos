import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vehicleSharedMovement } from "../../../../store/vehicle/sharedMode/vehicleMovement";
import { getVehicleConfigSync } from "../../../../config/vehicleConfig";
import { getSharedMemoryModeConfig } from "../../../../config/visualizationConfig";

/**
 * VehicleSharedRenderer
 * - Renders vehicles for shared-memory mode
 * - Reads from vehicleSharedMovement (SharedArrayBuffer)
 * - Uses InstancedMesh for performance
 * - Sensor visibility controlled by visualizationConfig
 */

interface VehicleSharedRendererProps {
  numVehicles: number;
}

const VehicleSharedRenderer: React.FC<VehicleSharedRendererProps> = ({
  numVehicles,
}) => {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const sensorMeshRef = useRef<THREE.InstancedMesh>(null);

  // Get visualization config
  const vizConfig = getSharedMemoryModeConfig();
  const showSensor = vizConfig.SHOW_SENSOR_EDGES;

  // Get vehicle config
  const config = getVehicleConfigSync();
  const {
    BODY: { LENGTH: bodyLength, WIDTH: bodyWidth, HEIGHT: bodyHeight },
    SENSOR: { LENGTH: sensorLength, WIDTH: sensorWidth, HEIGHT: sensorHeight },
    VEHICLE_COLOR: vehicleColor
  } = config;

  console.log(`[VehicleSharedRenderer] Rendering ${numVehicles} vehicles (body${showSensor ? ' + sensor' : ''} edges)`);

  // Create body geometry (normal box)
  const bodyGeometry = useMemo(() => {
    return new THREE.BoxGeometry(bodyLength, bodyWidth, bodyHeight);
  }, [bodyLength, bodyWidth, bodyHeight]);

  // Create sensor geometry (normal box)
  const sensorGeometry = useMemo(() => {
    return new THREE.BoxGeometry(sensorLength, sensorWidth, sensorHeight);
  }, [sensorLength, sensorWidth, sensorHeight]);

  // Create material for body (normal mesh material)
  const bodyMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(vehicleColor),
    });
  }, [vehicleColor]);

  // Create material for sensor (wireframe green)
  const sensorMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
  }, []);

  // Temporary objects for matrix calculations
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // Calculate sensor offset (sensor is in front of body)
  const sensorOffsetX = (bodyLength + sensorLength) * 0.5 + 0.05;

  // Initialize instance matrices
  useEffect(() => {
    const bodyMesh = bodyMeshRef.current;
    if (!bodyMesh) return;

    // Set initial instance matrices to identity
    for (let i = 0; i < numVehicles; i++) {
      tempMatrix.identity();
      bodyMesh.setMatrixAt(i, tempMatrix);
    }
    bodyMesh.instanceMatrix.needsUpdate = true;

    // Initialize sensor if enabled
    if (showSensor) {
      const sensorMesh = sensorMeshRef.current;
      if (sensorMesh) {
        for (let i = 0; i < numVehicles; i++) {
          tempMatrix.identity();
          sensorMesh.setMatrixAt(i, tempMatrix);
        }
        sensorMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [numVehicles, tempMatrix, showSensor]);

  // Update instance matrices every frame
  useFrame((state) => {
    const bodyMesh = bodyMeshRef.current;
    if (!bodyMesh) return;

    const sensorMesh = showSensor ? sensorMeshRef.current : null;

    // Read from shared memory
    for (let i = 0; i < numVehicles; i++) {
      const vehicle = vehicleSharedMovement.get(i);

      // Body position
      tempPosition.set(
        vehicle.movement.x,
        vehicle.movement.y,
        vehicle.movement.z
      );

      // Convert rotation from degrees to radians (Z-axis rotation)
      const rotRad = (vehicle.movement.rotation * Math.PI) / 180;
      tempQuaternion.setFromEuler(new THREE.Euler(0, 0, rotRad));

      // Set body matrix
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      bodyMesh.setMatrixAt(i, tempMatrix);

      // Sensor position (offset in front of body) - only if enabled
      if (showSensor && sensorMesh) {
        const sensorPos = new THREE.Vector3(sensorOffsetX, 0, 0);
        sensorPos.applyQuaternion(tempQuaternion);
        sensorPos.add(tempPosition);

        // Set sensor matrix
        tempMatrix.compose(sensorPos, tempQuaternion, tempScale);
        sensorMesh.setMatrixAt(i, tempMatrix);
      }
    }

    // Notify GPU of matrix updates
    bodyMesh.instanceMatrix.needsUpdate = true;
    if (showSensor && sensorMesh) {
      sensorMesh.instanceMatrix.needsUpdate = true;
    }

    // Log every 60 frames
    if (Math.floor(state.clock.elapsedTime * 60) % 60 === 0) {
      console.log(`[VehicleSharedRenderer] Updated ${numVehicles} instances (body${showSensor ? ' + sensor' : ''})`);
    }
  });

  if (numVehicles <= 0) {
    console.warn(`[VehicleSharedRenderer] numVehicles is ${numVehicles}, not rendering`);
    return null;
  }

  return (
    <>
      {/* Body edges */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[bodyGeometry, bodyMaterial, numVehicles]}
        frustumCulled={false}
      />

      {/* Sensor edges - only render if enabled */}
      {showSensor && (
        <instancedMesh
          ref={sensorMeshRef}
          args={[sensorGeometry, sensorMaterial, numVehicles]}
          frustumCulled={false}
        />
      )}
    </>
  );
};

export default VehicleSharedRenderer;

