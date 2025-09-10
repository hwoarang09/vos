import { MainMenuType } from "@/types";
export type BottomMenuItem = {
  id: MainMenuType;
  label: string;
  iconFn: (isActive: boolean) => JSX.Element;
};

export type SubMenuItem = {
  id: string;
  label: string;
  iconFn: (isActive: boolean) => JSX.Element; // iconFn으로 업데이트
};

// 공통 색상 상수
export const ACTIVE_STROKE_COLOR = "rgb(250,250,250)";
export const INACTIVE_STROKE_COLOR = "rgb(200,200,200)";
export const ACTIVE_FILL_COLOR = "rgba(255,255,255,0.9)";
export const INACTIVE_FILL_COLOR = "rgba(255,255,255,0.8)";

// 툴팁 색상 상수
export const TOOLTIP_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.95)";
export const TOOLTIP_TEXT_COLOR = "rgba(255, 140, 0, 1)"; // 진한 주황색 (채도 높음)
export const TOOLTIP_BORDER_COLOR = "rgba(255,255,255,0.4)";
export const TOOLTIP_ARROW_BACKGROUND_COLOR = "rgba(85,90,98,0.99)";
export const TOOLTIP_ARROW_BORDER_COLOR = "rgba(230,230,230, 0.99)";

// 툴팁 스타일 상수
export const TOOLTIP_BORDER_RADIUS = "12px"; // 둥근 모서리

// 메뉴 크기 상수
export const MENU_BUTTON_LARGE_SIZE = { width: "w-12", height: "h-12" }; // 64px x 64px
export const MENU_BUTTON_SMALL_SIZE = { width: "w-12", height: "h-10" }; // 48px x 40px

// 아이콘 크기 상수
export const ICON_SIZE_LARGE = 30; // 서브메뉴용 큰 아이콘
export const ICON_SIZE_MEDIUM = 24; // 메인메뉴용 중간 아이콘
export const ICON_SIZE_SMALL = 20; // 작은 아이콘
export const ICON_SIZE_EXTRA_SMALL = 16; // 매우 작은 아이콘
// MenuButton 색상 상수
export const MENU_BUTTON_ACTIVE_BACKGROUND = "rgba(94, 197, 255, 0.85)";
export const MENU_BUTTON_INACTIVE_BACKGROUND = "#262C3F";
export const MENU_BUTTON_ACTIVE_BORDER = "rgba(156,237,255, 1.0)";
export const MENU_BUTTON_INACTIVE_BORDER = "transparent";
export const MENU_BUTTON_HOVER_BORDER = "rgba(255,255,255,0.4)"; // 툴팁 텍스트 색상과 동일
export const MENU_BUTTON_ACTIVE_SHADOW =
  "0 0 8px rgba(156,237,255, 0.4), 0 0 7px rgba(156,237,255, 0.4), inset 0 0 15px rgba(156,237,255, 0.8)";
export const MENU_BUTTON_HOVER_SHADOW =
  "0 0 6px rgba(255,255,255, 0.3), 0 0 4px rgba(255,255,255, 0.2)"; // 부드러운 흰색 글로우
export const MENU_BUTTON_INACTIVE_SHADOW = "none";
