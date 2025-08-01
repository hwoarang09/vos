// components/react/menu/SubMenu.tsx (수정된 버전)
import React from "react";
import { useMenuStore } from "@store/menuStore";
import { MenuButton } from "./shared";
import { subMenuConfig } from "./data/submenuConfig";
import { tooltipsByLevel } from "./data/tooltipConfig";

const SubMenu: React.FC = () => {
  const {
    activeTopMenu,
    activeBottomMenu,
    setActiveBottomMenu,
    setActiveSubSubMenu, // 3단계 메뉴용
    setRightPanelOpen,
  } = useMenuStore();

  if (!activeTopMenu) return null;

  const menuItems = subMenuConfig[activeTopMenu] || [];

  const handleSubMenuClick = (menuId: string) => {
    setActiveBottomMenu(menuId);

    // 서브메뉴 클릭시 3단계 메뉴가 있는지 확인하고 처리
    // 예: EdgeBuilder의 일부 메뉴만 3단계까지 있다고 가정
    const hasSubSubMenu =
      activeTopMenu === "EdgeBuilder" &&
      ["edge-menu-1", "edge-menu-2"].includes(menuId);

    if (hasSubSubMenu) {
      // 3단계 메뉴가 있는 경우 - 여기서는 임시로 첫 번째 서브서브메뉴 자동 선택
      setActiveSubSubMenu(`${menuId}-sub-1`);
    } else {
      // 3단계 메뉴가 없는 경우 - 바로 우측 패널 열기
      setRightPanelOpen(true);
    }
  };

  return (
    <div className="fixed bottom-[64px] left-0 right-0 z-50 flex justify-center">
      <div
        className="flex space-x-2 p-2 rounded-xl shadow-lg border-2"
        style={{
          backgroundColor: "#464959",
          borderColor: "#889498",
          opacity: 0.95,
        }}
      >
        {menuItems.map((item, index) => (
          <MenuButton
            key={item.id}
            isActive={activeBottomMenu === item.id}
            onClick={() => handleSubMenuClick(item.id)}
            size="large" // 서브메뉴는 크게
            buttonLevel={2} // 서브메뉴는 레벨 2
            bottomLabel={(index + 1).toString()}
            tooltip={tooltipsByLevel[2][item.id]} // 서브메뉴 툴팁
          >
            {item.iconFn(activeBottomMenu === item.id)}
          </MenuButton>
        ))}
      </div>
    </div>
  );
};

export default SubMenu;
