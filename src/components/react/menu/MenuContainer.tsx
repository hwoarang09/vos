// components/react/menu/MenuContainer.tsx
import React, { useEffect } from "react";
import BottomMenu from "./BottomMenu";
import RightPanel from "./RightPanel";
import SubMenu from "./SubMenu";
import MapLoader from "../MapLoader/MapLoader";
import DebugPanel from "../debug/DebugPanel";
import { useMenuStore } from "../../../store/menuStore";
import { useMqttStore } from "../../../store/mqttStore";
import { mqttUrl } from "../../../config/mqttConfig";
// App.tsx 또는 최상위 컴포넌트에 추가
import { GlobalTooltip } from "./GlobalTooltip";

const MenuContainer: React.FC = () => {
  const { activeMainMenu, rightPanelOpen } = useMenuStore();
  const { initializeClient } = useMqttStore();

  // 기존 MQTT 초기화 로직 유지
  useEffect(() => {
    initializeClient(mqttUrl);
  }, [initializeClient]);

  return (
    <>
      {/* 상단 영역 - 비워둠 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: 80,
        }}
      >
        {/* 필요시 여기에 다른 컴포넌트 추가 */}
      </div>

      {/* 하단 메뉴 */}
      <BottomMenu />

      {/* 서브 메뉴 - activeTopMenu가 있을 때만 표시 */}
      {activeMainMenu && <SubMenu />}

      {/* 우측 패널 - 상단/하단 메뉴 높이 고려 */}
      {rightPanelOpen && (
        <div
          style={{
            position: "fixed",
            top: 80,
            right: 0,
            bottom: 120, // 바텀메뉴가 더 커졌으니 여유공간 확보
            width: 320,
            zIndex: 20,
          }}
        >
          <RightPanel />
        </div>
      )}

      {/* Debug Panel - Debug 메뉴가 활성화되었을 때만 표시 */}
      {activeMainMenu === "Debug" && <DebugPanel />}

      {/* Global Tooltip - 항상 렌더링 */}
      <GlobalTooltip />

      {/* Map Loader - 맵 로딩 기능 */}
      <MapLoader />
    </>
  );
};

export default MenuContainer;
