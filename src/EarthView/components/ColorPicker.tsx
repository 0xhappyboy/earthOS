import React, { useRef, useEffect } from "react";
import { Translations } from "../../i18n";

interface ColorPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (color: number[]) => void;
  onClose: () => void;
  theme: "light" | "dark";
  t: Translations;
  currentColor?: number[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const PRESET_COLORS = [
  [255, 0, 0, 1],
  [255, 50, 50, 1],
  [255, 100, 100, 1],
  [220, 20, 60, 1],
  [255, 165, 0, 1],
  [255, 140, 0, 1],
  [255, 120, 0, 1],
  [255, 100, 0, 1],
  [255, 255, 0, 1],
  [255, 235, 0, 1],
  [255, 215, 0, 1],
  [240, 230, 140, 1],
  [0, 255, 0, 1],
  [0, 200, 0, 1],
  [0, 150, 0, 1],
  [34, 139, 34, 1],
  [0, 255, 255, 1],
  [0, 200, 200, 1],
  [0, 150, 150, 1],
  [64, 224, 208, 1],
  [0, 0, 255, 1],
  [0, 0, 200, 1],
  [0, 0, 150, 1],
  [25, 25, 112, 1],
  [128, 0, 128, 1],
  [138, 43, 226, 1],
  [153, 50, 204, 1],
  [186, 85, 211, 1],
  [255, 192, 203, 1],
  [255, 105, 180, 1],
  [255, 20, 147, 1],
  [219, 112, 147, 1],
  [139, 69, 19, 1],
  [160, 82, 45, 1],
  [210, 105, 30, 1],
  [205, 133, 63, 1],
  [255, 255, 255, 1],
  [211, 211, 211, 1],
  [128, 128, 128, 1],
  [64, 64, 64, 1],
  [0, 0, 0, 1],
  [30, 30, 30, 1],
  [50, 50, 50, 1],
  [80, 80, 80, 1],
  [255, 99, 71, 1],
  [255, 69, 0, 1],
  [173, 255, 47, 1],
  [0, 255, 127, 1],
  [0, 191, 255, 1],
  [30, 144, 255, 1],
  [75, 0, 130, 1],
  [238, 130, 238, 1],
  [255, 182, 193, 1],
  [255, 228, 196, 1],
  [245, 222, 179, 1],
  [255, 250, 205, 1],
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentColor,
  containerRef,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
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
    if (!containerRef.current) return { position: "absolute", top: 0, left: 0 };
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeX = position.x - containerRect.left;
    const relativeY = position.y - containerRect.top;
    let left = relativeX - 110;
    let top = relativeY - 10;
    const pickerWidth = 220;
    const pickerHeight = 200;
    left = Math.max(0, Math.min(left, containerRect.width - pickerWidth));
    top = Math.max(0, top - pickerHeight);
    return {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
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
          width: "220px",
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        className="color-picker-scroll"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: "4px",
          }}
        >
          {PRESET_COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => onSelect(color)}
              style={{
                width: "22px",
                height: "22px",
                background: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
                border:
                  currentColor &&
                  currentColor[0] === color[0] &&
                  currentColor[1] === color[1] &&
                  currentColor[2] === color[2]
                    ? `2px solid ${isDark ? "#fff" : "#333"}`
                    : `1px solid ${isDark ? "#555" : "#ccc"}`,
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              title={`RGB(${color[0]}, ${color[1]}, ${color[2]})`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        .color-picker-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .color-picker-scroll::-webkit-scrollbar-track {
          background: ${isDark ? "#2d2d2d" : "#f0f0f0"};
          border-radius: 4px;
        }
        .color-picker-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? "#555" : "#ccc"};
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
