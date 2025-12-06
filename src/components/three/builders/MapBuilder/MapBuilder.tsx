import React from "react";
import { useMenuStore } from "@store/ui/menuStore";

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
      console.log("Straight Edge creation not implemented yet");
      return null;
    case "map-menu-2": // 90° Curve Edge
      console.log("90° Curv Edge creation not implemented yet");
      return null;
    case "map-menu-3": // Circular Edge (TODO)
      // return <CircularEdge />;
      console.log("Circular Edge creation not implemented yet");
      return null;
    default:
      return null;
  }
};

export default MapBuilder;
