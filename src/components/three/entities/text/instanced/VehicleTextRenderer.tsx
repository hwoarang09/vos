import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vehicleDataArray, VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { CHAR_COUNT } from "./useDigitMaterials";
import {
  applyHighAltitudeCulling,
  updateVehicleTextTransforms,
  buildVehicleSlotData,
  SlotData
} from "./instancedTextUtils";
import { BaseInstancedText } from "./BaseInstancedText";

const LOD_DIST_SQ = 400 * 400;
const CAM_HEIGHT_CUTOFF = 50;
const LABEL_LENGTH = 8; // VEH00001

interface Props {
  numVehicles: number;
  scale?: number;
  color?: string;
  zOffset?: number;
}

const VehicleTextRenderer: React.FC<Props> = ({
  numVehicles,
  scale = 0.5,
  color = "#ffffff",
  zOffset = 1,
}) => {
  const dataRef = useRef<SlotData | null>(null);
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(new Array(CHAR_COUNT).fill(null));

  // 슬롯 데이터 초기화
  useEffect(() => {
    dataRef.current = buildVehicleSlotData(numVehicles, LABEL_LENGTH);
  }, [numVehicles]);

  // 렌더링 루프
  useFrame(({ camera }) => {
    const D = dataRef.current;
    if (!D || numVehicles === 0) return;

    const vehicleData = vehicleDataArray.getData();
    const { z: cz } = camera.position;

    // 고도 컬링
    if (applyHighAltitudeCulling(cz, CAM_HEIGHT_CUTOFF, D, instRefs.current)) {
      return;
    }

    const charSpacing = 0.15 * scale;
    const halfLen = (LABEL_LENGTH - 1) / 2;

    updateVehicleTextTransforms(
      D as Required<SlotData>,
      vehicleData,
      camera.position,
      instRefs.current,
      {
        scale,
        charSpacing,
        halfLen,
        zOffset,
        lodDistSq: LOD_DIST_SQ,
      },
      {
        VEHICLE_DATA_SIZE,
        MovementData_X: MovementData.X,
        MovementData_Y: MovementData.Y,
        MovementData_Z: MovementData.Z,
      }
    );
  });

  return (
    <BaseInstancedText
      data={dataRef.current}
      instRefs={instRefs}
      color={color}
    />
  );
};

export default VehicleTextRenderer;