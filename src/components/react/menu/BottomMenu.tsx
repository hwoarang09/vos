// components/react/menu/BottomMenu.tsx
import React from "react";
import { useMenuStore, TopMenuType } from "../../../store/menuStore";

interface BottomMenuItem {
  id: TopMenuType;
  label: string;
  icon: string;
}

const bottomMenuItems: BottomMenuItem[] = [
  { id: "Statistics", label: "Statistics", icon: "📊" },
  { id: "Vehicle", label: "Vehicle", icon: "🚗" },
  { id: "Operation", label: "Operation", icon: "🚦" },
  { id: "EdgeBuilder", label: "EdgeBuilder", icon: "🛤️" },
];

const BottomMenu: React.FC = () => {
  const { activeTopMenu, setActiveTopMenu } = useMenuStore();

  const handleMenuClick = (menuId: TopMenuType) => {
    setActiveTopMenu(activeTopMenu === menuId ? null : menuId);
  };

  return (
    <div className="fixed bottom-2 left-0 right-0 z-50 flex justify-center">
      <div
        className="flex space-x-4 p-2 rounded-2xl shadow-xl border-4"
        style={{
          backgroundColor: "#353948", // 전체 박스 배경
          borderColor: "#445063", // 전체 박스 테두리
        }}
      >
        {bottomMenuItems.map((item) => {
          const isActive = activeTopMenu === item.id;
          return (
            <button
              key={item.id}
              data-menu-id={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-16 h-16 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105 border-8`}
              style={{
                backgroundColor: isActive ? "#57A1D1" : "#262C3F",
                color: "white",
                border: "4px solid",
                borderColor: isActive ? "#71C8F4" : "transparent",
              }}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              {/* {item.label} */}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomMenu;
