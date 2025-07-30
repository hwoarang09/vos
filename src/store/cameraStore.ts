import { create } from "zustand";
import { Vector3 } from "three";

interface CameraState {
  position: Vector3; // 카메라 위치
  target: Vector3; // 카메라 타겟
  setPosition: (position: Vector3) => void; // 위치 설정 함수
  setTarget: (target: Vector3) => void; // 타겟 설정 함수
}

export const useCameraStore = create<CameraState>((set) => ({
  position: new Vector3(0, 40, 20), // 초기 카메라 위치
  target: new Vector3(0, 0, 0), // 초기 타겟
  setPosition: (position) => set({ position }),
  setTarget: (target) => set({ target }),
}));
