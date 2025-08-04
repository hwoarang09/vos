import { useEffect } from "react";
import { useMenuStore } from "@/store/menuStore";
import { subMenuConfig } from "../menu/data/submenuConfig";

const KeyboardShortcutHandler = () => {
  const {
    activeMainMenu,
    setActiveSubMenu,
  } = useMenuStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMainMenu, subMenuConfig, setActiveSubMenu]);

  return null;
};

export default KeyboardShortcutHandler;
