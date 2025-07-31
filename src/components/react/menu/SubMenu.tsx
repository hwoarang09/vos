// components/react/menu/SubMenu.tsx
import React, { useState, useRef, useEffect } from "react";
import { useMenuStore } from "../../../store/menuStore";
import { Button } from "@/components/ui/button";

// 각 메뉴별 서브메뉴 정의
const subMenuConfig = {
  Statistics: [
    { id: "stats-menu-1", label: "Realtime", icon: "📈" },
    { id: "stats-menu-2", label: "Daily", icon: "📅" },
    { id: "stats-menu-3", label: "Weekly", icon: "📊" },
    { id: "stats-menu-4", label: "Monthly", icon: "📆" },
    { id: "stats-menu-5", label: "Performance", icon: "⚡" },
  ],
  Vehicle: [
    { id: "vehicle-menu-1", label: "All", icon: "🚗" },
    { id: "vehicle-menu-2", label: "Active", icon: "🟢" },
    { id: "vehicle-menu-3", label: "Idle", icon: "🟡" },
    { id: "vehicle-menu-4", label: "Maintenance", icon: "🔧" },
    { id: "vehicle-menu-5", label: "History", icon: "📋" },
  ],
  Operation: [
    { id: "operation-menu-1", label: "Routes", icon: "🗺️" },
    { id: "operation-menu-2", label: "Schedule", icon: "⏰" },
    { id: "operation-menu-3", label: "Monitor", icon: "👁️" },
    { id: "operation-menu-4", label: "Alerts", icon: "🔔" },
    { id: "operation-menu-5", label: "Logs", icon: "📝" },
  ],
  Builder: [
    { id: "edge-menu-1", label: "Straight", icon: "➖" },
    { id: "edge-menu-2", label: "Curved", icon: "↪️" },
    { id: "edge-menu-3", label: "Junction", icon: "🔀" },
    { id: "edge-menu-4", label: "Special", icon: "⚙️" },
    { id: "edge-menu-5", label: "Tools", icon: "🔗" },
  ],
};

const SubMenu: React.FC = () => {
  const {
    activeTopMenu,
    activeBottomMenu,
    setActiveBottomMenu,
    setActiveTopMenu,
    setRightPanelOpen,
  } = useMenuStore();

  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTopMenu) {
      // 바텀메뉴 버튼들의 위치를 찾아서 서브메뉴 위치 계산
      const activeButton = document.querySelector(
        `[data-menu-id="${activeTopMenu}"]`
      ) as HTMLElement;

      if (activeButton) {
        const rect = activeButton.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const topY = rect.top;

        setMenuPosition({
          x: centerX,
          y: topY - 8, // 바텀메뉴에 더 가깝게
        });
      }
    }
  }, [activeTopMenu]);

  if (!activeTopMenu) return null;

  const menuItems = subMenuConfig[activeTopMenu] || [];

  const handleSubMenuClick = (menuId: string) => {
    setActiveBottomMenu(menuId);
    setRightPanelOpen(true); // 바로 우측 패널 열기
  };

  return (
    <>
      {/* 서브메뉴만 표시 - 배경 오버레이 제거 */}
      <div
        ref={menuRef}
        className="fixed z-50"
        style={{
          left: menuPosition.x,
          bottom: `calc(100vh - ${menuPosition.y}px)`,
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="flex space-x-2 p-2 rounded-xl shadow-lg border-2"
          style={{
            backgroundColor: "#353948", // 바텀메뉴와 동일한 배경
            borderColor: "#445063", // 바텀메뉴와 동일한 테두리
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSubMenuClick(item.id)}
              className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 text-xs font-medium border-2`}
              style={{
                backgroundColor:
                  activeBottomMenu === item.id ? "#57A1D1" : "#262C3F",
                color: "white",
                borderColor:
                  activeBottomMenu === item.id ? "#71C8F4" : "transparent",
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span style={{ fontSize: "8px", marginTop: "1px" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default SubMenu;
