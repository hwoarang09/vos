import React from 'react';
import { useMenuStore } from '../../../store/menuStore';
import CFGLoader from './CFGLoader';

/**
 * MapLoader component - Map loading router based on active menu
 */
const MapLoader: React.FC = () => {
  const { activeMainMenu, activeSubMenu } = useMenuStore();

  // Only render when MapLoader is active
  if (activeMainMenu !== 'MapLoader') {
    return null;
  }

  // Route to appropriate loader based on submenu
  switch (activeSubMenu) {
    case 'maploader-menu-1': // CFG 파일 불러오기
      return <CFGLoader />;
    case 'maploader-menu-2': // Import (TODO)
      console.log('Import functionality not implemented yet');
      return null;
    case 'maploader-menu-3': // Export (TODO)
      console.log('Export functionality not implemented yet');
      return null;
    default:
      return null;
  }
};

export default MapLoader;
