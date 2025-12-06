import React from "react";
import { useMenuStore } from "@store/ui/menuStore";
import BayBuilder from "./BayBuilder/BayBuilder";
// import StationBuilder from "./StationBuilder/StationBuilder";  // 추후 구현
// import EquipmentBuilder from "./EquipmentBuilder/EquipmentBuilder";  // 추후 구현

/**
 * LayoutBuilder component - Layout creation router based on active menu
 */
const LayoutBuilder: React.FC = () => {
  const { activeMainMenu, activeSubMenu } = useMenuStore();

  // Only render when LayoutBuilder is active
  if (activeMainMenu !== "LayoutBuilder") {
    return null;
  }

  // Route to appropriate layout builder based on submenu
  switch (activeSubMenu) {
    case "layout-menu-1": // Bay Builder
      return <BayBuilder />;
    case "layout-menu-2": // Station Builder (TODO)
      // return <StationBuilder />;
      console.log("Station Builder not implemented yet");
      return null;
    case "layout-menu-3": // Equipment Builder (TODO)
      // return <EquipmentBuilder />;
      console.log("Equipment Builder not implemented yet");
      return null;
    default:
      return null;
  }
};

export default LayoutBuilder;
