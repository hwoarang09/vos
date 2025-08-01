// components/react/menu/BottomMenu.tsx (그룹화)
import React from "react";
import { useMenuStore, TopMenuType } from "@store/menuStore";
import { MenuContainer, MenuButton, MenuDivider } from "./shared";
import { bottomMenuGroups } from "./data/BottomMenuConfig";

// 메뉴별 툴팁 정의
const menuTooltips: Record<string, string> = {
  Statistics: "통계 및 분석",
  Vehicle: "차량 관리",
  Operation: "운영 관리",
  EdgeBuilder: "도로 편집기",
};

const BottomMenu: React.FC = () => {
  const { activeTopMenu, setActiveTopMenu } = useMenuStore();

  const handleMenuClick = (menuId: TopMenuType) => {
    setActiveTopMenu(activeTopMenu === menuId ? null : menuId);
  };

  return (
    <MenuContainer position="bottom">
      {bottomMenuGroups.map((group, groupIndex) => (
        <React.Fragment key={`group-${groupIndex}`}>
          {/* 그룹 내 버튼들 */}
          {group.map((item) => {
            const isActive = activeTopMenu === item.id;

            return (
              <MenuButton
                key={item.id}
                isActive={isActive}
                onClick={() => handleMenuClick(item.id)}
                dataMenuId={item.id}
                size="small" // 메인메뉴는 small로 (더 작게)
                tooltip={menuTooltips[item.id]}
              >
                {item.iconFn(isActive)}
              </MenuButton>
            );
          })}

          {/* 그룹 사이에만 구분선 추가 (마지막 그룹 제외) */}
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
