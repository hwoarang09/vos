// store/menuStore.ts
import { create } from "zustand";

export type TopMenuType =
  | "Statistics"
  | "Vehicle"
  | "Operation"
  | "EdgeBuilder";

export interface MenuState {
  // 기존 상태들
  activeTopMenu: TopMenuType | null;
  activeBottomMenu: string | null;
  activeSubSubMenu: string | null; // 3단계 메뉴
  rightPanelOpen: boolean;

  // 툴팁 관련 상태
  hoveredMenuId: string | null;
  tooltipMessage: string | null;
  tooltipPosition: { x: number; y: number } | null;
  tooltipLevel: number | null;

  // 메소드들도 타입에 포함
  getCurrentTopLevel: () => number;
  setActiveTopMenu: (menu: TopMenuType | null) => void;
  setActiveBottomMenu: (menu: string | null) => void;
  setActiveSubSubMenu: (menu: string | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  showTooltip: (
    menuId: string,
    message: string,
    position: { x: number; y: number },
    buttonLevel: number
  ) => void;
  hideTooltip: () => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  // 기존 상태들
  activeTopMenu: null,
  activeBottomMenu: null,
  activeSubSubMenu: null,
  rightPanelOpen: false,

  // 툴팁 상태
  hoveredMenuId: null,
  tooltipMessage: null,
  tooltipPosition: null,
  tooltipLevel: null,

  // 현재 최상단 레벨 계산 메소드 (현재는 최대 2까지만)
  getCurrentTopLevel: () => {
    const { activeTopMenu, activeBottomMenu, activeSubSubMenu } = get();

    // TODO: 나중에 3단계 메뉴 구현시 아래 주석 해제
    // if (activeSubSubMenu) return 3; // 3단계 메뉴가 열리면 최상단은 3
    if (activeBottomMenu) return 2; // 2단계 메뉴가 열려도 최상단은 2 유지
    if (activeTopMenu) return 2; // 1단계 메뉴가 열리면 최상단은 2
    return 1; // 아무것도 없으면 최상단은 1
  },

  // 기존 메소드들
  setActiveTopMenu: (menu: TopMenuType | null) => {
    set({
      activeTopMenu: menu,
      // 상위 메뉴 닫으면 하위 메뉴들도 닫기
      activeBottomMenu: menu ? get().activeBottomMenu : null,
      activeSubSubMenu: menu ? get().activeSubSubMenu : null,
      // 툴팁 숨김
      hoveredMenuId: null,
      tooltipMessage: null,
      tooltipPosition: null,
      tooltipLevel: null,
    });
  },

  setActiveBottomMenu: (menu: string | null) => {
    set({
      activeBottomMenu: menu,
      // 하위 메뉴 정리
      activeSubSubMenu: menu ? get().activeSubSubMenu : null,
      // 툴팁 숨김
      hoveredMenuId: null,
      tooltipMessage: null,
      tooltipPosition: null,
      tooltipLevel: null,
    });
  },

  setActiveSubSubMenu: (menu: string | null) => {
    set({
      activeSubSubMenu: menu,
      // 툴팁 숨김
      hoveredMenuId: null,
      tooltipMessage: null,
      tooltipPosition: null,
      tooltipLevel: null,
    });
  },

  setRightPanelOpen: (open: boolean) => {
    set({ rightPanelOpen: open });
  },

  // 툴팁 관련
  showTooltip: (
    menuId: string,
    message: string,
    position: { x: number; y: number },
    buttonLevel: number
  ) => {
    const currentTopLevel = get().getCurrentTopLevel();

    // 현재 최상단 레벨과 버튼 레벨이 같을 때만 툴팁 표시
    if (buttonLevel === currentTopLevel) {
      set({
        hoveredMenuId: menuId,
        tooltipMessage: message,
        tooltipPosition: position,
        tooltipLevel: buttonLevel,
      });
    }
  },

  hideTooltip: () => {
    set({
      hoveredMenuId: null,
      tooltipMessage: null,
      tooltipPosition: null,
      tooltipLevel: null,
    });
  },
}));
