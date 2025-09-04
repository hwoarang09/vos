import { useEffect } from "react";
import { useMenuStore } from "@/store/menuStore";
import { useMapStore } from "@/store/edgeStore";
import { subMenuConfig } from "../menu/data/submenuConfig";

const KeyboardShortcutHandler = () => {
  const { activeMainMenu, activeSubMenu, setActiveSubMenu } = useMenuStore();
  const { resetEdgeCreation } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle ESC key - cancel sub menu but keep main menu
      if (e.key === "Escape") {
        if (activeSubMenu) {
          e.preventDefault();
          setActiveSubMenu(null);
          // 연속 생성 모드도 초기화
          resetEdgeCreation();
        }
        return;
      }

      // Handle number keys for sub menu selection
      if (!/^[1-9]$/.test(e.key)) return;
      // ⛔ 활성화된 메인 메뉴가 없으면 단축키 무시
      if (!activeMainMenu) return;
      const index = parseInt(e.key, 10) - 1;
      const subMenus = subMenuConfig[activeMainMenu];

      if (!subMenus || index >= subMenus.length) return;

      e.preventDefault(); // 브라우저 버튼 반응 막기

      const targetSubMenu = subMenus[index];
      if (targetSubMenu) {
        setActiveSubMenu(targetSubMenu.id);
        // 서브메뉴 변경 시 엣지 생성 상태 초기화
        resetEdgeCreation();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMainMenu, activeSubMenu, setActiveSubMenu, resetEdgeCreation]);

  return null;
};

export default KeyboardShortcutHandler;
