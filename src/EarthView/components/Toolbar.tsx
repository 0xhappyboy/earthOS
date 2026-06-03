import React from "react";
import {
  LayersIcon,
  BasemapIcon,
  DrawIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "../../icons";
import { Translations } from "../../i18n";

interface ToolbarProps {
  activePopup: "layers" | "basemap" | "draw" | null;
  onTogglePopup: (popup: "layers" | "basemap" | "draw" | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  theme: "light" | "dark";
  t: Translations;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activePopup,
  onTogglePopup,
  onZoomIn,
  onZoomOut,
  theme,
  t,
}) => {
  const isDark = theme === "dark";

  const buttonStyle = (isActive: boolean) => ({
    width: "30px",
    height: "30px",
    background: isActive
      ? "var(--accent-color, #00aaff)"
      : isDark
        ? "#2d2d2d"
        : "#f0f0f0",
    border: `1px solid ${isDark ? "#444" : "#ddd"}`,
    borderRadius: "6px",
    color: isActive ? "white" : isDark ? "#ccc" : "#666",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
        padding: "8px",
        borderRadius: "8px",
        backdropFilter: "blur(4px)",
      }}
    >
      <button
        onClick={() =>
          onTogglePopup(activePopup === "layers" ? null : "layers")
        }
        title={t.layersTitle}
        style={buttonStyle(activePopup === "layers")}
      >
        <LayersIcon size={16} />
      </button>

      <button
        onClick={() =>
          onTogglePopup(activePopup === "basemap" ? null : "basemap")
        }
        title={t.basemapTitle}
        style={buttonStyle(activePopup === "basemap")}
      >
        <BasemapIcon size={16} />
      </button>

      <button
        onClick={() => onTogglePopup(activePopup === "draw" ? null : "draw")}
        title={t.drawToolsTitle}
        style={buttonStyle(activePopup === "draw")}
      >
        <DrawIcon size={16} />
      </button>

      <div
        style={{
          height: "1px",
          background: isDark ? "#444" : "#ddd",
          margin: "4px 0",
        }}
      />

      <button
        onClick={onZoomIn}
        title={t.zoomInTitle}
        style={buttonStyle(false)}
      >
        <ZoomInIcon size={16} />
      </button>

      <button
        onClick={onZoomOut}
        title={t.zoomOutTitle}
        style={buttonStyle(false)}
      >
        <ZoomOutIcon size={16} />
      </button>
    </div>
  );
};
