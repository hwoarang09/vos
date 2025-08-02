// components/react/menu/BottomMenu.tsx (최종 버전)
import React from "react";
import { useMenuStore, MainMenuType } from "@store/menuStore";
import {
  MenuContainer,
  MenuButton,
  MenuDivider,
  BottomMenuItem,
} from "./shared";
import { tooltipsByLevel } from "./data/tooltipConfig";
import { bottomMenuGroups } from "./data/BottomMenuConfig";

const BottomMenu: React.FC = () => {
  const { activeMainMenu, setActiveMainMenu } = useMenuStore();

  const handleMenuClick = (menuId: MainMenuType) => {
    // 같은 메뉴를 클릭하면 토글, 다른 메뉴를 클릭하면 해당 메뉴 활성화
    console.log('menuId : ', menuId, activeMainMenu === menuId ? null : menuId, 'activeMainMenu : ',activeMainMenu)
    setActiveMainMenu(activeMainMenu === menuId ? null : menuId);
  };

  return (
    <MenuContainer position="bottom">
      {bottomMenuGroups.map((group, groupIndex) => (
        <React.Fragment key={`group-${groupIndex}`}>
          {group.map((item) => {
            const isActive = activeMainMenu === item.id;

            return (
              <MenuButton
                key={item.id}
                isActive={isActive}
                onClick={() => handleMenuClick(item.id)}
                dataMenuId={item.id}
                size="small" // 메인메뉴는 작게
                buttonLevel={1} // 메인메뉴는 레벨 1
                tooltip={tooltipsByLevel[1][item.id]} // 툴팁 추가
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