// @types/edgeColors.ts
export const edgeColors = {
  linear: "#0066ff", // 파란색 - 직선
  curve90: "#ff69b4", // 분홍색 - 90도 곡선
  curve180: "#ff69b4", // 분홍색 - 180도 곡선
  default: "#888888", // 회색 - 기본값/알 수 없는 타입
};

/**
 * VOS rail type에 따른 색상 반환
 * @param vosRailType VOS rail type (LINEAR, CURVE_90, CURVE_180 등)
 * @returns 색상 hex 코드
 */
export const getEdgeColor = (vosRailType: string): string => {
  switch (vosRailType) {
    case "LINEAR":
    case "S":
      return edgeColors.linear;
    case "CURVE_90":
    case "CURVE_180":
    case "CURVE_CSC":
      return edgeColors.curve180;
    default:
      return edgeColors.default;
  }
};
