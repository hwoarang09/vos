// store/menuStore.ts
import { create } from "zustand";

export type TopMenuType = "Statistics" | "Vehicle" | "Operation" | "Builder";

export interface MenuState {
  // 현재 활성화된 메뉴들
  activeTopMenu: TopMenuType | null;
  activeBottomMenu: string | null;
  activeSubMenu: string | null;

  // 패널 상태
  rightPanelOpen: boolean;
  subMenuOpen: boolean;

  // 액션들
  setActiveTopMenu: (menu: TopMenuType | null) => void;
  setActiveBottomMenu: (menu: string | null) => void;
  setActiveSubMenu: (menu: string | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  setSubMenuOpen: (open: boolean) => void;

  // 편의 메서드
  closeAllMenus: () => void;
  openRightPanel: (bottomMenu: string, subMenu?: string) => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  activeTopMenu: null,
  activeBottomMenu: null,
  activeSubMenu: null,
  rightPanelOpen: false,
  subMenuOpen: false,

  setActiveTopMenu: (menu) =>
    set({
      activeTopMenu: menu,
      activeBottomMenu: null,
      activeSubMenu: null,
      subMenuOpen: false,
      rightPanelOpen: false,
    }),

  setActiveBottomMenu: (menu) =>
    set({
      activeBottomMenu: menu,
      activeSubMenu: null,
      subMenuOpen: false,
      rightPanelOpen: false,
    }),

  setActiveSubMenu: (menu) =>
    set({
      activeSubMenu: menu,
      subMenuOpen: !!menu,
    }),

  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  setSubMenuOpen: (open) => set({ subMenuOpen: open }),

  closeAllMenus: () =>
    set({
      activeTopMenu: null,
      activeBottomMenu: null,
      activeSubMenu: null,
      rightPanelOpen: false,
      subMenuOpen: false,
    }),

  openRightPanel: (bottomMenu, subMenu) =>
    set({
      activeBottomMenu: bottomMenu,
      activeSubMenu: subMenu || null,
      rightPanelOpen: true,
      subMenuOpen: !!subMenu,
    }),
}));
