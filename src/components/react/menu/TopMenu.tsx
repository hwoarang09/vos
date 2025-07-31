// components/react/menu/TopMenu.tsx
import React from "react";
import { useMenuStore, TopMenuType } from "../../../store/menuStore";
import packageJson from "../../../../package.json";

interface TopMenuItem {
  id: TopMenuType;
  label: string;
  icon: string;
}

const topMenuItems: TopMenuItem[] = [
  { id: "Statistics", label: "Statistics", icon: "📊" },
  { id: "Vehicle", label: "Vehicle", icon: "🚗" },
  { id: "Operation", label: "Operation", icon: "🚦" },
  { id: "EdgeBuilder", label: "Edge Builder", icon: "🛤️" },
];

const TopMenu: React.FC = () => {
  const { activeTopMenu, setActiveTopMenu } = useMenuStore();

  const handleMenuClick = (menuId: TopMenuType) => {
    if (activeTopMenu === menuId) {
      setActiveTopMenu(null); // 같은 메뉴 클릭시 닫기
    } else {
      setActiveTopMenu(menuId);
    }
  };

  return (
    <div className="bg-gray-900 text-white border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 왼쪽: 프로젝트 제목 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">R3F Rail System</h1>
          <div className="text-base text-gray-400">v{packageJson.version}</div>
        </div>

        {/* 중앙: 메뉴 버튼들 - 더 크게 */}
        <div className="flex space-x-2">
          {topMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`
                px-8 py-3 rounded-lg text-xl font-medium transition-colors duration-200
                ${
                  activeTopMenu === item.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }
              `}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* 오른쪽: 상태 정보 */}
        <div className="flex items-center space-x-4">
          <div className="text-base text-gray-400">
            MQTT: <span className="text-green-400">Connected</span>
          </div>
          <button className="text-gray-400 hover:text-white text-xl">⚙️</button>
        </div>
      </div>
    </div>
  );
};

export default TopMenu;
