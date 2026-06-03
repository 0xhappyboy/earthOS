import React, { useRef, useEffect } from "react";
import { Translations } from "../../i18n";

interface StrokeWidthPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (width: number) => void;
  onClose: () => void;
  theme: "light" | "dark";
  t: Translations;
  currentWidth: number;
}

const PRESET_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10];

export const StrokeWidthPicker: React.FC<StrokeWidthPickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentWidth,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const getPositionStyle = (): React.CSSProperties => {
    return {
      position: "fixed",
      left: `${position.x}px`,
      top: `${position.y - 10}px`,
      transform: "translateY(-100%)",
      zIndex: 300,
    };
  };

  return (
    <div ref={pickerRef} style={getPositionStyle()}>
      <div
        style={{
          background: isDark ? "#2d2d2d" : "#ffffff",
          border: `1px solid ${isDark ? "#444" : "#ddd"}`,
          borderRadius: "8px",
          padding: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: "140px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {PRESET_WIDTHS.map((width) => (
            <div
              key={width}
              onClick={() => onSelect(width)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                cursor: "pointer",
                background: currentWidth === width ? (isDark ? "#3d3d3d" : "#e8e8e8") : "transparent",
                borderRadius: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentWidth !== width) {
                  e.currentTarget.style.background = isDark ? "#3a3a3a" : "#f0f0f0";
                }
              }}
              onMouseLeave={(e) => {
                if (currentWidth !== width) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: `${Math.min(width, 10)}px`,
                  background: isDark ? "#fff" : "#333",
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px", flex: 1 }}>
                {width}px
              </span>
              {currentWidth === width && (
                <span style={{ color: "#00aaff", fontSize: "12px" }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};