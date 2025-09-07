// @types/nodeColors.ts
export const nodeColors = {
  tmp_: "#00ff00", // 초록색 - TMP_ 노드
  default: "#ffff00", // 노란색 - 기본 노드
};

/**
 * 노드 이름에 따른 색상 반환
 * @param nodeName 노드 이름
 * @returns 색상 hex 코드
 */
export const getNodeColor = (nodeName: string): string => {
  if (nodeName.startsWith("TMP_")) {
    return nodeColors.tmp_;
  }
  return nodeColors.default;
};
