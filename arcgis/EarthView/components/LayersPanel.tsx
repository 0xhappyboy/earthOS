import React from "react";
import { EyeIcon, EyeOffIcon, DeleteIcon } from "../../icons";
import { Translations } from "../../i18n";

interface LayersPanelProps {
  layerList: { id: string; name: string; visible: boolean }[];
  onToggleVisibility: (layerId: string) => void;
  onRemoveLayer: (layerId: string) => void;
  isDark: boolean;
  t: Translations;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layerList,
  onToggleVisibility,
  onRemoveLayer,
  isDark,
  t,
}) => {
  if (layerList.length === 0) {
    return (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: isDark ? "#888" : "#999",
          fontSize: "12px",
        }}
      >
        {t.noLayers}
      </div>
    );
  }

  return (
    <>
      {layerList.map((layer) => (
        <div
          key={layer.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
            borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <button
              onClick={() => onToggleVisibility(layer.id)}
              title={layer.visible ? t.hideLayer : t.showLayer}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                color: layer.visible ? (isDark ? "#00aaff" : "#0077cc") : (isDark ? "#888" : "#ccc"),
              }}
            >
              {layer.visible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
            </button>
            <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px", flex: 1 }}>
              {layer.name}
            </span>
          </div>
          {layer.id !== "circle-draw" && (
            <button
              onClick={() => onRemoveLayer(layer.id)}
              title={t.deleteLayerTitle}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2px",
                color: "#f44336",
              }}
            >
              <DeleteIcon size={12} />
            </button>
          )}
        </div>
      ))}
    </>
  );
};