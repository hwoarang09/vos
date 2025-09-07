import { useEffect } from "react";
import { useMenuStore } from "@/store/menuStore";
import { useMapStore } from "@/store/edgeStore";
import { subMenuConfig } from "../menu/data/submenuConfig";
import { bottomMenuGroups } from "../menu/data/BottomMenuConfig";

const KeyboardShortcutHandler = () => {
  const { activeMainMenu, activeSubMenu, setActiveSubMenu, setActiveMainMenu } =
    useMenuStore();
  const { resetEdgeCreation } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle ESC key - cancel sub menu or main menu
      if (e.key === "Escape") {
        if (activeSubMenu) {
          // If submenu is active, close submenu but keep main menu
          e.preventDefault();
          setActiveSubMenu(null);
          resetEdgeCreation();
        } else if (activeMainMenu) {
          // If only main menu is active, close main menu
          e.preventDefault();
          setActiveMainMenu(null);
        }
        return;
      }

      // Handle number keys
      if (!/^[1-9]$/.test(e.key)) return;

      const keyNumber = parseInt(e.key, 10);

      // If main menu is active, handle submenu shortcuts
      if (activeMainMenu) {
        const index = keyNumber - 1;
        const subMenus = subMenuConfig[activeMainMenu];

        if (subMenus && index < subMenus.length) {
          e.preventDefault();
          const targetSubMenu = subMenus[index];
          setActiveSubMenu(targetSubMenu.id);
          resetEdgeCreation();
          return;
        }
      }

      // If no main menu is active, handle bottom menu shortcuts
      if (!activeMainMenu) {
        // Flatten bottom menu groups to get all menu items in order
        const allBottomMenuItems = bottomMenuGroups.flat();
        const index = keyNumber - 1;

        if (index < allBottomMenuItems.length) {
          e.preventDefault();
          const targetMainMenu = allBottomMenuItems[index];
          setActiveMainMenu(targetMainMenu.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeMainMenu,
    activeSubMenu,
    setActiveSubMenu,
    setActiveMainMenu,
    resetEdgeCreation,
  ]);

  return null;
};

export default KeyboardShortcutHandler;
