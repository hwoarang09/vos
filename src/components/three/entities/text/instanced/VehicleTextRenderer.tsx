import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { vehicleDataArray, VEHICLE_DATA_SIZE, MovementData } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { useDigitMaterials, CHAR_COUNT } from "./useDigitMaterials";
import {
  applyHighAltitudeCulling,
  updateVehicleTextTransforms,
  buildVehicleSlotData,
  SlotData
} from "./instancedTextUtils";

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
  const digitMaterials = useDigitMaterials({ color });
  const quad = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const dataRef = useRef<SlotData | null>(null);
  const instRefs = useRef<(THREE.InstancedMesh | null)[]>(new Array(CHAR_COUNT).fill(null));

  // 슬롯 데이터 초기화
  useEffect(() => {
    dataRef.current = buildVehicleSlotData(numVehicles, LABEL_LENGTH);
  }, [numVehicles]);

  // InstancedMesh 생성
  const meshes = useMemo(() => {
    const data = dataRef.current;
    if (!data || numVehicles === 0) return [];

    return digitMaterials.map((mat, d) => {
      const cnt = Math.max(1, data.counts[d]);
      return (
        <instancedMesh
          key={`veh-digit-${d}-${cnt}`}
          ref={(el) => (instRefs.current[d] = el)}
          args={[quad, mat, cnt]}
          frustumCulled={false}
        />
      );
    });
  }, [digitMaterials, quad, dataRef.current?.counts, numVehicles]);

  // 카운트 업데이트
  useEffect(() => {
    const data = dataRef.current;
    if (!data) return;

    for (let d = 0; d < CHAR_COUNT; d++) {
      const mesh = instRefs.current[d];
      if (mesh && data.counts[d] > 0) {
        mesh.count = data.counts[d];
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }, [dataRef.current?.counts]);

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

  return <group>{meshes}</group>;
};

export default VehicleTextRenderer;