import {
  TrainTrack,
  ChartPie,
  Car,
  ShipWheel,
  Folder,
  Table,
  Building,
} from "lucide-react";
import {
  BottomMenuItem,
  ACTIVE_STROKE_COLOR,
  INACTIVE_STROKE_COLOR,
  ACTIVE_FILL_COLOR,
  INACTIVE_FILL_COLOR,
  ICON_SIZE_MEDIUM,
} from "../shared";

// 그룹별로 메뉴 아이템들을 분류
export const bottomMenuGroups: BottomMenuItem[][] = [
  // 그룹 1: 맵 로더
  [
    {
      id: "MapLoader",
      label: "MapLoader",
      iconFn: (isActive) => (
        <Folder
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
  // 그룹 2: 통계
  [
    {
      id: "Statistics",
      label: "Statistics",
      iconFn: (isActive) => (
        <ChartPie
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
  // 그룹 3: 차량 & 운영
  [
    {
      id: "Vehicle",
      label: "Vehicle",
      iconFn: (isActive) => (
        <Car
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "Operation",
      label: "Operation",
      iconFn: (isActive) => (
        <ShipWheel
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 1.5,
          }}
        />
      ),
    },
  ],
  // 그룹 4: 맵빌더 & 레이아웃빌더
  [
    {
      id: "MapBuilder",
      label: "MapBuilder",
      iconFn: (isActive) => (
        <TrainTrack
          size={ICON_SIZE_MEDIUM}
          style={{
            fill: isActive ? ACTIVE_FILL_COLOR : INACTIVE_FILL_COLOR,
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 1.5,
          }}
        />
      ),
    },
    {
      id: "LayoutBuilder",
      label: "LayoutBuilder",
      iconFn: (isActive) => (
        <Building
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 1.5,
          }}
        />
      ),
    },
  ],
  // 그룹 5: 디버그
  [
    {
      id: "DataPanel",
      label: "DataPanel",
      iconFn: (isActive) => (
        <Table
          size={ICON_SIZE_MEDIUM}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
];
