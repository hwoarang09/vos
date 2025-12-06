import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVehicleRapierStore } from "../../../../store/vehicle/rapierMode/vehicleStore";
import { getVehicleConfigSync } from "../../../../config/vehicleConfig";
import { getRapierModeConfig } from "../../../../config/visualizationConfig";

/**
 * VehicleRapierRenderer
 * - Renders vehicles for rapier-dict mode
 * - Reads directly from RigidBody (source of truth)
 * - Uses InstancedMesh for performance
 * - Sensor visibility controlled by visualizationConfig
 */

interface VehicleRapierRendererProps {
  actualNumVehicles: number;
}

const VehicleRapierRenderer: React.FC<VehicleRapierRendererProps> = ({
  actualNumVehicles,
}) => {
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null);
  const sensorMeshRef = useRef<THREE.InstancedMesh>(null);
  const rapierStore = useVehicleRapierStore();

  // Get visualization config
  const vizConfig = getRapierModeConfig();
  const showSensor = vizConfig.SHOW_SENSOR_EDGES;

  // Get vehicle config
  const config = getVehicleConfigSync();
  const {
    BODY: { LENGTH: bodyLength, WIDTH: bodyWidth, HEIGHT: bodyHeight },
    SENSOR: { LENGTH: sensorLength, WIDTH: sensorWidth, HEIGHT: sensorHeight },
    VEHICLE_COLOR: vehicleColor
  } = config;

  console.log(`[VehicleRapierRenderer] Rendering ${actualNumVehicles} vehicles (body${showSensor ? ' + sensor' : ''} edges)`);

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
    for (let i = 0; i < actualNumVehicles; i++) {
      tempMatrix.identity();
      bodyMesh.setMatrixAt(i, tempMatrix);
    }
    bodyMesh.instanceMatrix.needsUpdate = true;

    // Initialize sensor if enabled
    if (showSensor) {
      const sensorMesh = sensorMeshRef.current;
      if (sensorMesh) {
        for (let i = 0; i < actualNumVehicles; i++) {
          tempMatrix.identity();
          sensorMesh.setMatrixAt(i, tempMatrix);
        }
        sensorMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [actualNumVehicles, tempMatrix, showSensor]);

  // Update instance matrices every frame
  useFrame((state) => {
    const bodyMesh = bodyMeshRef.current;
    if (!bodyMesh) return;

    const sensorMesh = showSensor ? sensorMeshRef.current : null;

    // Read directly from RigidBody (source of truth)
    for (let i = 0; i < actualNumVehicles; i++) {
      const rigidBody = rapierStore.getRigidBody(i);

      if (rigidBody) {
        const translation = rigidBody.translation();
        const rotation = rigidBody.rotation();

        // Body position
        tempPosition.set(translation.x, translation.y, translation.z);
        tempQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

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
    }

    // Notify GPU of matrix updates
    bodyMesh.instanceMatrix.needsUpdate = true;
    if (showSensor && sensorMesh) {
      sensorMesh.instanceMatrix.needsUpdate = true;
    }

    // Log every 60 frames
    if (Math.floor(state.clock.elapsedTime * 60) % 60 === 0) {
      console.log(`[VehicleRapierRenderer] Updated ${actualNumVehicles} instances (body${showSensor ? ' + sensor' : ''})`);
    }
  });

  if (actualNumVehicles <= 0) {
    console.warn(`[VehicleRapierRenderer] actualNumVehicles is ${actualNumVehicles}, not rendering`);
    return null;
  }

  return (
    <>
      {/* Body mesh */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[bodyGeometry, bodyMaterial, actualNumVehicles]}
        frustumCulled={false}
      />

      {/* Sensor wireframe - only render if enabled */}
      {showSensor && (
        <instancedMesh
          ref={sensorMeshRef}
          args={[sensorGeometry, sensorMaterial, actualNumVehicles]}
          frustumCulled={false}
        />
      )}
    </>
  );
};

export default VehicleRapierRenderer;

