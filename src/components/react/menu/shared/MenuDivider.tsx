import React from "react";

export const MenuDivider: React.FC = () => (
  <div
    className="h-8 w-px"
    style={{
      background: "linear-gradient(to bottom, transparent, white, transparent)",
      opacity: 0.3,
    }}
  />
);
