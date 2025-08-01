// components/react/menu/shared/MenuButton.tsx
import React, { useState } from "react";

interface MenuButtonProps {
  isActive: boolean;
  onClick: () => void;
  size?: "small" | "large";
  children: React.ReactNode;
  dataMenuId?: string;
  className?: string;
  showLabel?: boolean;
  // 툴팁과 하단 라벨
  tooltip?: string;
  bottomLabel?: string;
  // 커스터마이징 가능한 색상 props
  activeBackgroundColor?: string;
  inactiveBackgroundColor?: string;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  activeBoxShadow?: string;
  inactiveBoxShadow?: string;
  borderWidth?: string;
  borderRadius?: string;
}

export const MenuButton: React.FC<MenuButtonProps> = ({
  isActive,
  onClick,
  size = "large",
  children,
  dataMenuId,
  className = "",
  showLabel = true,
  tooltip,
  bottomLabel,
  // 기본값들 (현재 스타일)
  activeBackgroundColor = "rgba(94, 197, 255, 0.85)",
  inactiveBackgroundColor = "#262C3F",
  activeBorderColor = "rgba(156,237,255, 1.0)",
  inactiveBorderColor = "transparent",
  activeBoxShadow = "0 0 8px rgba(156,237,255, 0.4), 0 0 7px rgba(156,237,255, 0.4), inset 0 0 15px rgba(156,237,255, 0.8)",
  inactiveBoxShadow = "none",
  borderWidth = "2px",
  borderRadius = "rounded-xl",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // 크기 반대로: large는 서브메뉴용(더 큼), small은 메인메뉴용(더 작음)
  const sizeClass = size === "large" ? "w-16 h-16" : "w-10 h-8";
  const marginClass = size === "small" ? "mx-1" : ""; // 메인메뉴만 margin

  return (
    <div className="relative flex flex-col items-center">
      <button
        data-menu-id={dataMenuId}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`${sizeClass} ${marginClass} flex flex-col items-center justify-center ${borderRadius} text-xs font-medium transition-all duration-100 hover:scale-102 ${className}`}
        style={{
          backgroundColor: isActive
            ? activeBackgroundColor
            : inactiveBackgroundColor,
          border: `${borderWidth} solid`,
          borderColor: isActive ? activeBorderColor : inactiveBorderColor,
          boxShadow: isActive ? activeBoxShadow : inactiveBoxShadow,
        }}
      >
        {children}
      </button>

      {/* 하단 라벨 (서브메뉴 단축키용) */}
      {bottomLabel && (
        <span className="text-xs text-gray-400 mt-1 font-mono">
          {bottomLabel}
        </span>
      )}

      {/* 호버 툴팁 */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-sm rounded whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black border-t-opacity-80"></div>
        </div>
      )}
    </div>
  );
};
