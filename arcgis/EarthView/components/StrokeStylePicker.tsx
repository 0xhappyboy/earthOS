import React, { useRef, useEffect } from "react";
import { Translations } from "../../i18n";

interface StrokeStylePickerProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (style: "solid" | "dashed") => void;
  onClose: () => void;
  theme: "light" | "dark";
  t: Translations;
  currentStyle: "solid" | "dashed";
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const StrokeStylePicker: React.FC<StrokeStylePickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentStyle,
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

    let left = relativeX - 80;
    let top = relativeY - 10;

    const pickerWidth = 160;
    const pickerHeight = 80;

    left = Math.max(0, Math.min(left, containerRect.width - pickerWidth));
    top = Math.max(0, top - pickerHeight);

    return {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 300,
    };
  };

  const styles: {
    value: "solid" | "dashed";
    label: string;
    preview: React.ReactNode;
  }[] = [
    {
      value: "solid",
      label: t.solidLine,
      preview: (
        <svg width="40" height="4" viewBox="0 0 40 4">
          <line
            x1="0"
            y1="2"
            x2="40"
            y2="2"
            stroke={isDark ? "#fff" : "#333"}
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      value: "dashed",
      label: t.dashedLine,
      preview: (
        <svg width="40" height="4" viewBox="0 0 40 4">
          <line
            x1="0"
            y1="2"
            x2="40"
            y2="2"
            stroke={isDark ? "#fff" : "#333"}
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <div ref={pickerRef} style={getPositionStyle()}>
      <div
        style={{
          background: isDark ? "#2d2d2d" : "#ffffff",
          border: `1px solid ${isDark ? "#444" : "#ddd"}`,
          borderRadius: "8px",
          padding: "6px 0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: "160px",
        }}
      >
        {styles.map((style) => (
          <div
            key={style.value}
            onClick={() => onSelect(style.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              cursor: "pointer",
              background:
                currentStyle === style.value
                  ? isDark
                    ? "#3d3d3d"
                    : "#e8e8e8"
                  : "transparent",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (currentStyle !== style.value) {
                e.currentTarget.style.background = isDark
                  ? "#3a3a3a"
                  : "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (currentStyle !== style.value) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {style.preview}
            <span
              style={{
                color: isDark ? "#fff" : "#333",
                fontSize: "12px",
                flex: 1,
              }}
            >
              {style.label}
            </span>
            {currentStyle === style.value && (
              <span style={{ color: "#00aaff", fontSize: "12px" }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
