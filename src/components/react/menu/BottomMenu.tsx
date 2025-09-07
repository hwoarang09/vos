// components/react/menu/BottomMenu.tsx (최종 버전)
import React from "react";
import { useMenuStore } from "@store/menuStore";
import { MainMenuType } from "@/types";
import { MenuContainer, MenuButton, MenuDivider } from "./shared";
import { tooltipsByLevel } from "./data/tooltipConfig";
import { bottomMenuGroups } from "./data/BottomMenuConfig";

const BottomMenu: React.FC = () => {
  const { activeMainMenu, setActiveMainMenu } = useMenuStore();

  const handleMenuClick = (menuId: MainMenuType) => {
    // 같은 메뉴를 클릭하면 토글, 다른 메뉴를 클릭하면 해당 메뉴 활성화
    console.log(
      "menuId : ",
      menuId,
      activeMainMenu === menuId ? null : menuId,
      "activeMainMenu : ",
      activeMainMenu
    );
    setActiveMainMenu(activeMainMenu === menuId ? null : menuId);
  };

  // Calculate shortcut numbers for all menu items across groups
  const allMenuItems = bottomMenuGroups.flat();

  return (
    <MenuContainer position="bottom">
      {bottomMenuGroups.map((group, groupIndex) => (
        <React.Fragment key={`group-${groupIndex}`}>
          {group.map((item) => {
            const isActive = activeMainMenu === item.id;
            // Find the index of this item in the flattened array to get the shortcut number
            const shortcutNumber =
              allMenuItems.findIndex((menuItem) => menuItem.id === item.id) + 1;

            return (
              <MenuButton
                key={item.id}
                isActive={isActive}
                onClick={() => handleMenuClick(item.id)}
                dataMenuId={item.id}
                size="small" // 메인메뉴는 작게
                buttonLevel={1} // 메인메뉴는 레벨 1
                tooltip={tooltipsByLevel[1][item.id as MainMenuType]} // 툴팁 추가
                bottomLabel={shortcutNumber.toString()} // 단축키 번호 표시
              >
                {item.iconFn(isActive)}
              </MenuButton>
            );
          })}

          {/* 그룹 사이에만 구분선 추가 */}
          {groupIndex < bottomMenuGroups.length - 1 && (
            <div className="w-2 flex items-center justify-center mx-1">
              <MenuDivider />
            </div>
          )}
        </React.Fragment>
      ))}
    </MenuContainer>
  );
};

export default BottomMenu;
