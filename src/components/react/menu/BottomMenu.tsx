// components/react/menu/BottomMenu.tsx (수정된 버전)
import React from "react";
import { useMenuStore, TopMenuType } from "@store/menuStore";
import { TrainTrack, ChartPie, Car, ShipWheel } from "lucide-react";
import {
  MenuContainer,
  MenuButton,
  MenuDivider,
  BottomMenuItem,
  ACTIVE_STROKE_COLOR,
  INACTIVE_STROKE_COLOR,
  ACTIVE_FILL_COLOR,
  INACTIVE_FILL_COLOR,
} from "./shared";
import { tooltipsByLevel } from "./data/tooltipConfig";
import { bottomMenuGroups } from "./data/BottomMenuConfig";

const BottomMenu: React.FC = () => {
  const { activeTopMenu, setActiveTopMenu } = useMenuStore();

  const handleMenuClick = (menuId: TopMenuType) => {
    setActiveTopMenu(activeTopMenu === menuId ? null : menuId);
  };

  return (
    <MenuContainer position="bottom">
      {bottomMenuGroups.map((group, groupIndex) => (
        <React.Fragment key={`group-${groupIndex}`}>
          {group.map((item) => {
            const isActive = activeTopMenu === item.id;

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
