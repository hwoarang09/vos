// components/react/menu/shared/MenuContainer.tsx
import React from "react";

interface MenuContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  position?: "bottom" | "floating";
  floatingPosition?: { x: number; y: number };
}

export const MenuContainer: React.FC<MenuContainerProps> = ({
  children,
  className = "",
  style = {},
  position = "bottom",
  floatingPosition,
}) => {
  const baseStyle = {
    backgroundColor: "#353948",
    borderColor: "#778397",
    opacity: 0.98,
    ...style,
  };

  const positionClass =
    position === "bottom"
      ? "fixed bottom-2 left-0 right-0 z-50 flex justify-center"
      : "fixed z-50";

  const floatingStyle =
    position === "floating" && floatingPosition
      ? {
          left: floatingPosition.x,
          bottom: `calc(100vh - ${floatingPosition.y}px)`,
          transform: "translateX(-50%)",
        }
      : {};

  return (
    <div className={positionClass} style={floatingStyle}>
      <div
        className={`flex py-2 px-1 rounded-xl shadow-xl border-2 ${className}`}
        style={baseStyle}
      >
        {children}
      </div>
    </div>
  );
};
