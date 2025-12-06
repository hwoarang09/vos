import { getNextEdgeInLoop, VehicleLoop } from "@/utils/vehicle/loopMaker";
import { VehicleArrayStore } from "@store/vehicle/arrayMode/vehicleStore";
import { Edge } from "@/types/edge";
import { vehicleDataArray, SensorData, VEHICLE_DATA_SIZE } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { PresetIndex } from "@/store/vehicle/arrayMode/sensorPresets";

interface TransitionResult {
  finalEdgeIndex: number;
  finalRatio: number;
  activeEdge: Edge | null; // 현재 위치한 엣지 객체 반환
}

export function handleEdgeTransition(
  vehicleIndex: number,
  initialEdgeIndex: number,
  initialRatio: number,
  edgeArray: Edge[],
  vehicleLoopMap: Map<number, VehicleLoop>,
  edgeNameToIndex: Map<string, number>,
  store: VehicleArrayStore
): TransitionResult {
  
  let currentEdgeIdx = initialEdgeIndex;
  let currentRatio = initialRatio;
  let currentEdge = edgeArray[currentEdgeIdx];

  // 엣지 끝을 넘어섰는지 확인 (while loop)
  while (currentEdge && currentRatio >= 1.0) {
    const overflowDist = (currentRatio - 1.0) * currentEdge.distance;
    
    // [Topology Optimization]
    // 1. Diverge(분기)가 아니면 nextEdgeIndices[0]으로 바로 이동
    // 2. Diverge면 LoopMap 확인
    let nextEdgeIndex = -1;

    if (!currentEdge.toNodeIsDiverge && currentEdge.nextEdgeIndices?.length) {
       nextEdgeIndex = currentEdge.nextEdgeIndices[0];
    } else {
       const loop = vehicleLoopMap.get(vehicleIndex);
       if (loop) {
         const nextName = getNextEdgeInLoop(currentEdge.edge_name, loop.edgeSequence);
         const found = edgeNameToIndex.get(nextName);
         if (found !== undefined) nextEdgeIndex = found;
       }
       // Fallback
       if (nextEdgeIndex === -1 && currentEdge.nextEdgeIndices?.length) {
         nextEdgeIndex = currentEdge.nextEdgeIndices[0];
       }
    }

    // 갈 곳이 없거나 끊김
    if (nextEdgeIndex === -1 || !edgeArray[nextEdgeIndex]) {
      currentRatio = 1.0; // 끝에 멈춤
      break;
    }

    const nextEdge = edgeArray[nextEdgeIndex];

    // Store 업데이트 (차량 위치 이동)
    store.moveVehicleToEdge(vehicleIndex, nextEdgeIndex, overflowDist / nextEdge.distance);

    // Update sensor preset based on new edge type
    updateSensorPresetForEdge(vehicleIndex, nextEdge);

    currentEdgeIdx = nextEdgeIndex;
    currentEdge = nextEdge;
    currentRatio = overflowDist / nextEdge.distance;
  }

  return {
    finalEdgeIndex: currentEdgeIdx,
    finalRatio: currentRatio,
    activeEdge: currentEdge || null
  };
}

/**
 * Update sensor preset based on edge type
 */
function updateSensorPresetForEdge(vehicleIndex: number, edge: Edge): void {
  const data = vehicleDataArray.getData();
  const ptr = vehicleIndex * VEHICLE_DATA_SIZE;

  let presetIdx: number = PresetIndex.STRAIGHT;

  if (edge.vos_rail_type !== "LINEAR") {
    // Curve edge - determine left or right based on edge name or properties
    // For now, default to left curve (you can add more logic here)
    presetIdx = PresetIndex.CURVE_LEFT as number;
  }

  data[ptr + SensorData.PRESET_IDX] = presetIdx;
}
