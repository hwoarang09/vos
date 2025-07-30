const generateClusteredPositionsByBay = (
  count: number,
  rangeX: number,
  rangeZ: number,
  baySpacing: number = 50 // Bay 간 거리
) => {
  const positions: [number, number, number][] = [];
  const bayCount = 10; // 10개의 bay
  const bayWidth = rangeX / 6; // 각 bay의 가로 크기
  const bayHeight = rangeZ / 3; // 각 bay의 세로 크기
  const itemsPerBay = Math.floor(count / bayCount);

  for (let i = 0; i < bayCount; i++) {
    // Bay 중심 좌표
    const bayCenterX = (i % 5) * (bayWidth + baySpacing) - rangeX / 2;
    const bayCenterZ =
      Math.floor(i / 5) * (bayHeight + baySpacing) - rangeZ / 2;

    // Bay 내부 밀집된 좌표 생성
    for (let j = 0; j < itemsPerBay; j++) {
      const x = bayCenterX + Math.random() * bayWidth - bayWidth / 4; // 밀집 분포
      const z = bayCenterZ + Math.random() * bayHeight - bayHeight / 4; // 밀집 분포
      positions.push([x, 0, z]); // y는 0으로 고정
    }
  }

  return positions;
};

export default generateClusteredPositionsByBay;
