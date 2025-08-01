// components/react/menu/SubMenu.tsx
import React from "react";
import { useMenuStore } from "@store/menuStore";
import { MenuButton } from "./shared";
import { subMenuConfig } from "./data/submenuConfig";
const SubMenu: React.FC = () => {
  const {
    activeTopMenu,
    activeBottomMenu,
    setActiveBottomMenu,

    setRightPanelOpen,
  } = useMenuStore();

  // 위치 계산 로직 제거 - 가운데 정렬로 변경
  if (!activeTopMenu) return null;

  const menuItems = subMenuConfig[activeTopMenu] || [];

  const handleSubMenuClick = (menuId: string) => {
    setActiveBottomMenu(menuId);
    setRightPanelOpen(true);
  };

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-50 flex justify-center">
      <div
        className="flex space-x-2 p-2 rounded-xl shadow-lg border-2"
        style={{
          backgroundColor: "#464959", // 메인메뉴와 동일한 배경
          borderColor: "#889498", // 메인메뉴와 동일한 테두리
          opacity: 0.95,
        }}
      >
        {menuItems.map((item) => (
          <MenuButton
            key={item.id}
            isActive={activeBottomMenu === item.id}
            onClick={() => handleSubMenuClick(item.id)}
            size="large" // 서브메뉴는 large로 (더 크게)
          >
            {item.iconFn(activeBottomMenu === item.id)}
          </MenuButton>
        ))}
      </div>
    </div>
  );
};

export default SubMenu;
