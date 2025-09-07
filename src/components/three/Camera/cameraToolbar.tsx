// 예: HUD나 상단 툴바 컴포넌트
import React from "react";
import { useCameraStore } from "@store/cameraStore";

export default function CameraToolbar() {
  const requestRotateZ = useCameraStore((s) => s.requestRotateZ);

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <button
        onClick={() => {
          console.log("+_click");
          requestRotateZ(+10);
        }}
        className="px-3 py-1 rounded bg-black/60 text-white"
      >
        Z +10°
      </button>
      <button
        onClick={() => requestRotateZ(-10)}
        className="px-3 py-1 rounded bg-black/60 text-white"
      >
        Z −10°
      </button>
    </div>
  );
}
