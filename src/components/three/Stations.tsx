import React, { useRef, useEffect } from "react";
import { InstancedMesh, Object3D, Vector3 } from "three";
import { useCameraStore } from "../../store/cameraStore";
import generateClusteredPositionsByBay from "./Stations/generateClusteredPositionsByBay";

const Stations: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const { setPosition, setTarget } = useCameraStore(); // 카메라 스토어 함수 가져오기
  const stationCount = 6000;
  const positions = generateClusteredPositionsByBay(stationCount, 500, 300);
  const tempObject = new Object3D();

  useEffect(() => {
    if (!meshRef.current) return;

    positions.forEach(([x, y, z], i) => {
      tempObject.position.set(x, y, z);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  const handlePointerDown = (event: any) => {
    const instanceId = event.instanceId;

    if (instanceId !== undefined) {
      event.stopPropagation();
      const [x, y, z] = positions[instanceId];

      console.log("Clicked station position: ", x, y, z);
      // 카메라 위치와 타겟 업데이트
      setPosition(new Vector3(x, y + 150, z)); // 클릭한 station 위로 이동
      setTarget(new Vector3(x, y, z)); // 클릭한 station을 바라보도록 설정
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, stationCount]} // geometry, material, instanceCount
      onPointerDown={handlePointerDown} // 클릭 이벤트
    >
      <boxGeometry args={[1, 1, 1]} /> {/* 사각형 기본 형태 */}
      <meshStandardMaterial color="blue" />
    </instancedMesh>
  );
};

export default Stations;
