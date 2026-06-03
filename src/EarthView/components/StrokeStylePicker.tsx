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
}

export const StrokeStylePicker: React.FC<StrokeStylePickerProps> = ({
  visible,
  position,
  onSelect,
  onClose,
  theme,
  t,
  currentStyle,
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

  const styles: { value: "solid" | "dashed"; label: string; preview: React.ReactNode }[] = [
    {
      value: "solid",
      label: t.solidLine,
      preview: (
        <svg width="40" height="4" viewBox="0 0 40 4">
          <line x1="0" y1="2" x2="40" y2="2" stroke={isDark ? "#fff" : "#333"} strokeWidth="2" />
        </svg>
      ),
    },
    {
      value: "dashed",
      label: t.dashedLine,
      preview: (
        <svg width="40" height="4" viewBox="0 0 40 4">
          <line x1="0" y1="2" x2="40" y2="2" stroke={isDark ? "#fff" : "#333"} strokeWidth="2" strokeDasharray="4 4" />
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
          padding: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          width: "180px",
        }}
      >
        {styles.map((style) => (
          <div
            key={style.value}
            onClick={() => onSelect(style.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 12px",
              cursor: "pointer",
              background: currentStyle === style.value ? (isDark ? "#3d3d3d" : "#e8e8e8") : "transparent",
              borderRadius: "6px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (currentStyle !== style.value) {
                e.currentTarget.style.background = isDark ? "#3a3a3a" : "#f0f0f0";
              }
            }}
            onMouseLeave={(e) => {
              if (currentStyle !== style.value) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {style.preview}
            <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px", flex: 1 }}>
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