import React from "react";

interface ScaleBarProps {
  scale: string;
  theme: "light" | "dark";
}

export const ScaleBar: React.FC<ScaleBarProps> = ({ scale, theme }) => {
  const isDark = theme === "dark";
  
  if (!scale) return null;
  
  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        zIndex: 100,
        background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
        padding: "4px 8px",
        borderRadius: "4px",
        backdropFilter: "blur(4px)",
        fontFamily: "monospace",
        fontSize: "11px",
        color: isDark ? "#fff" : "#333",
        pointerEvents: "none",
      }}
    >
      {scale}
    </div>
  );
};