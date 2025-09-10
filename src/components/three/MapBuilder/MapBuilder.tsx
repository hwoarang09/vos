import React from "react";
import { useMenuStore } from "@store/menuStore";
import StraightEdge from "./StraightEdge/StraightEdge";
import Curve90Edge from "./Curve90Edge/Curve90Edge";
// import CurvedEdge from './CurvedEdge';  // 추후 구현
// import CircularEdge from './CircularEdge';  // 추후 구현

/**
 * MapBuilder component - Edge creation router based on active menu
 */
const MapBuilder: React.FC = () => {
  const { activeMainMenu, activeSubMenu } = useMenuStore();

  // Only render when MapBuilder is active
  if (activeMainMenu !== "MapBuilder") {
    return null;
  }

  // Route to appropriate edge builder based on submenu
  switch (activeSubMenu) {
    case "map-menu-1": // Straight Edge
      return <StraightEdge />;
    case "map-menu-2": // 90° Curve Edge
      return <Curve90Edge />;
    case "map-menu-3": // Circular Edge (TODO)
      // return <CircularEdge />;
      console.log("Circular Edge creation not implemented yet");
      return null;
    default:
      return null;
  }
};

export default MapBuilder;
