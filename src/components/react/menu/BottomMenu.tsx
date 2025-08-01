// components/react/menu/BottomMenu.tsx
import React from "react";
import { useMenuStore, TopMenuType } from "@store/menuStore";
import { TrainTrack, ChartPie, Car, ShipWheel } from "lucide-react";

type BottomMenuItem = {
  id: TopMenuType;
  label: string;
  iconFn: (isActive: boolean) => JSX.Element;
};

const bottomMenuItems: BottomMenuItem[] = [
  {
    id: "Statistics",
    label: "Statistics",
    iconFn: (isActive) => (
      <ChartPie
        size={28}
        style={{
          // fill: isActive ? "black" : "white",
          stroke: isActive ? "black" : "white",
          strokeWidth: 2,
        }}
      />
    ),
  },
  {
    id: "Vehicle",
    label: "Vehicle",
    iconFn: (isActive) => (
      <Car
        size={36}
        style={{
          fill: isActive ? "white" : "black",
          stroke: isActive ? "black" : "white",
          strokeWidth: 2,
        }}
      />
    ),
  },
  {
    id: "Operation",
    label: "Operation",
    iconFn: (isActive) => (
      <ShipWheel
        size={32}
        style={{
          fill: isActive ? "white" : "black",
          stroke: isActive ? "black" : "white",
          strokeWidth: 1.5,
        }}
      />
    ),
  },
  {
    id: "EdgeBuilder",
    label: "EdgeBuilder",
    iconFn: (isActive) => (
      <TrainTrack
        size={32}
        style={{
          fill: isActive ? "black" : "white",
          stroke: isActive ? "black" : "white",
          strokeWidth: 1.5,
        }}
      />
    ),
  },
];

const BottomMenu: React.FC = () => {
  const { activeTopMenu, setActiveTopMenu } = useMenuStore();

  const handleMenuClick = (menuId: TopMenuType) => {
    setActiveTopMenu(activeTopMenu === menuId ? null : menuId);
  };

  return (
    <div className="fixed bottom-2 left-0 right-0 z-50 flex justify-center">
      <div
        className="flex p-2 rounded-2xl shadow-xl border-4"
        style={{
          backgroundColor: "#353948", // 전체 박스 배경
          borderColor: "#778397", // 전체 박스 테두리
          opacity: 0.98,
        }}
      >
        {bottomMenuItems.map((item, index) => {
          const isActive = activeTopMenu === item.id;
          const isFirst = index === 0;
          const isLast = index === bottomMenuItems.length - 2;

          return (
            <div key={item.id} className="flex items-center">
              <button
                data-menu-id={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="w-16 h-16 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all duration-100 hover:scale-102 mx-3"
                style={{
                  backgroundColor: isActive
                    ? "rgba(94, 197, 255, 0.85)"
                    : "#262C3F",
                  // color: "white",
                  border: "2px solid",
                  borderColor: isActive
                    ? "rgba(156,237,255, 1.0)"
                    : "transparent",
                  boxShadow: isActive
                    ? "0 0 8px rgba(156,237,255, 0.4), 0 0 7px rgba(156,237,255, 0.4), inset 0 0 15px rgba(156,237,255, 0.8)"
                    : "none",
                }}
              >
                <span className="text-2xl mb-1">{item.iconFn(isActive)}</span>
              </button>

              {/* 첫 번째 버튼 뒤에만 구분선 */}
              {isFirst && (
                <div
                  className="h-8 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, white, transparent)",
                    opacity: 0.3,
                  }}
                />
              )}

              {/* 마지막 버튼 앞에만 구분선 */}
              {isLast && (
                <div
                  className="h-8 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, white, transparent)",
                    opacity: 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottomMenu;
