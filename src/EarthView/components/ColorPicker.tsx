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
}

const PRESET_COLORS = [
  [255, 0, 0, 1],
  [255, 165, 0, 1],
  [255, 255, 0, 1],
  [0, 255, 0, 1],
  [0, 255, 255, 1],
  [0, 0, 255, 1],
  [128, 0, 128, 1],
  [255, 192, 203, 1],
  [255, 255, 255, 1],
  [128, 128, 128, 1],
  [0, 0, 0, 1],
  [139, 69, 19, 1],
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentColor,
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
          padding: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: "200px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "8px",
          }}
        >
          {PRESET_COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => onSelect(color)}
              style={{
                width: "24px",
                height: "24px",
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};
