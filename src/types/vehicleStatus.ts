// src/types/vehicleStatus.ts

export enum VehicleStatus {
  STOPPED = 0,
  MOVING = 1,
  ERROR = 99,
}

// 명확한 타입 정의
export interface VehicleState {
  status: number;
  velocity: number;
  acceleration: number;
  edgeRatio: number;
  currentEdgeIndex: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
}