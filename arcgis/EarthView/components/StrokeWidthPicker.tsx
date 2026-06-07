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
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const PRESET_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20];

export const StrokeWidthPicker: React.FC<StrokeWidthPickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentWidth,
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

    let left = relativeX - 65;
    let top = relativeY - 10;

    const pickerWidth = 130;
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
          padding: "6px 0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: "130px",
          maxHeight: "200px",
          overflowY: "auto",
        }}
        className="stroke-width-scroll"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {PRESET_WIDTHS.map((width) => (
            <div
              key={width}
              onClick={() => onSelect(width)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 12px",
                cursor: "pointer",
                background:
                  currentWidth === width
                    ? isDark
                      ? "#3d3d3d"
                      : "#e8e8e8"
                    : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentWidth !== width) {
                  e.currentTarget.style.background = isDark
                    ? "#3a3a3a"
                    : "#f0f0f0";
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
                  width: "35px",
                  height: `${Math.min(width, 8)}px`,
                  background: isDark ? "#fff" : "#333",
                  borderRadius: "2px",
                }}
              />
              <span
                style={{
                  color: isDark ? "#fff" : "#333",
                  fontSize: "11px",
                  flex: 1,
                }}
              >
                {width}px
              </span>
              {currentWidth === width && (
                <span style={{ color: "#00aaff", fontSize: "12px" }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .stroke-width-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .stroke-width-scroll::-webkit-scrollbar-track {
          background: ${isDark ? "#2d2d2d" : "#f0f0f0"};
          border-radius: 4px;
        }
        .stroke-width-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? "#555" : "#ccc"};
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
