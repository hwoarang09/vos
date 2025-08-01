import { TopMenuType } from "@store/menuStore";

export type BottomMenuItem = {
  id: TopMenuType;
  label: string;
  iconFn: (isActive: boolean) => JSX.Element;
};

export type SubMenuItem = {
  id: string;
  label: string;
  iconFn: (isActive: boolean) => JSX.Element; // iconFn으로 업데이트
};

// 공통 색상 상수
export const ACTIVE_STROKE_COLOR = "rgba(255,255,255,0.9)";
export const INACTIVE_STROKE_COLOR = "rgba(255,255,255,0.8)";
export const ACTIVE_FILL_COLOR = "rgba(255,255,255,0.9)";
export const INACTIVE_FILL_COLOR = "rgba(255,255,255,0.8)";
