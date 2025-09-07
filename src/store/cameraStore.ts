import { create } from "zustand";
import * as THREE from "three";

type CameraState = {
  position: THREE.Vector3;
  target: THREE.Vector3;

  // 1회성 회전 요청(도 단위). 처리되면 0으로 리셋
  rotateZDeg: number;

  setPosition: (pos: THREE.Vector3 | THREE.Vector3Like) => void;
  setTarget: (t: THREE.Vector3 | THREE.Vector3Like) => void;

  requestRotateZ: (deltaDeg: number) => void;
  _resetRotateZ: () => void;
};

export const useCameraStore = create<CameraState>((set) => ({
  position: new THREE.Vector3(10, 10, 10),
  target: new THREE.Vector3(0, 0, 0),

  rotateZDeg: 0,

  setPosition: (pos) => set((s) => ({ position: s.position.copy(pos as any) })),

  setTarget: (t) => set((s) => ({ target: s.target.copy(t as any) })),

  requestRotateZ: (deltaDeg) => set({ rotateZDeg: deltaDeg }),
  _resetRotateZ: () => set({ rotateZDeg: 0 }),
}));
