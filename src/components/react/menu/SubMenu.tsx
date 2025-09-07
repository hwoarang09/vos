// components/react/menu/SubMenu.tsx (최종 버전)
import React from "react";
import { useMenuStore } from "@store/menuStore";
import { MenuButton } from "./shared";
import { subMenuConfig } from "./data/submenuConfig";
import { tooltipsByLevel } from "./data/tooltipConfig";

const SubMenu: React.FC = () => {
  const {
    activeMainMenu, // 메인 메뉴 상태
    activeSubMenu, // 서브 메뉴 상태
    setActiveSubMenu, // 서브 메뉴 설정
    setActiveThirdMenu, // 3단계 메뉴 설정
    setRightPanelOpen,
  } = useMenuStore();

  // 메인 메뉴가 활성화되지 않았으면 서브메뉴 표시하지 않음

  if (!activeMainMenu) return null;

  const menuItems = subMenuConfig[activeMainMenu] || [];

  const handleSubMenuClick = (menuId: string) => {
    // 같은 메뉴를 클릭하면 토글, 다른 메뉴를 클릭하면 해당 메뉴 활성화
    const newActiveSubMenu = activeSubMenu === menuId ? null : menuId;
    setActiveSubMenu(newActiveSubMenu);

    // 서브메뉴가 선택된 경우에만 3단계 메뉴 처리
    if (newActiveSubMenu) {
      // 서브메뉴 클릭시 3단계 메뉴가 있는지 확인하고 처리
      // 예: MapBuilder의 일부 메뉴만 3단계까지 있다고 가정
      const hasThirdLevelMenu =
        activeMainMenu === "MapBuilder" &&
        // ["map-menu-1", "map-menu-2"].includes(menuId);
        ["잠시"].includes(menuId);

      if (hasThirdLevelMenu) {
        // 3단계 메뉴가 있는 경우 - 임시로 첫 번째 3단계 메뉴 자동 선택
        setActiveThirdMenu(`${menuId}-sub-1`);
      } else {
        // 3단계 메뉴가 없는 경우 - 바로 우측 패널 열기
        setRightPanelOpen(true);
      }
    } else {
      // 서브메뉴가 해제된 경우 - 3단계 메뉴와 우측 패널도 닫기
      setActiveThirdMenu(null);
      setRightPanelOpen(false);
    }
  };

  return (
    <div className="fixed bottom-[80px] left-0 right-0 z-50 flex justify-center">
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
            isActive={activeSubMenu === item.id}
            onClick={() => handleSubMenuClick(item.id)}
            size="large" // 서브메뉴는 크게
            buttonLevel={2} // 서브메뉴는 레벨 2
            bottomLabel={(index + 1).toString()}
            tooltip={tooltipsByLevel[2][item.id]} // 서브메뉴 툴팁
          >
            {item.iconFn(activeSubMenu === item.id)}
          </MenuButton>
        ))}
      </div>
    </div>
  );
};

export default SubMenu;
