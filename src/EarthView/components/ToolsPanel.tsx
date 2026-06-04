import React from "react";
import { RulerIcon, AreaIcon, ClearIcon } from "../../icons";
import { Translations } from "../../i18n";

interface ToolsPanelProps {
  onDistanceMeasure: () => void;
  onAreaMeasure: () => void;
  onClearMeasurements: () => void;
  isMeasuring: boolean;
  currentMeasureType: "distance" | "area" | null;
  measurePreview: { distance?: number; area?: number } | null;
  isDark: boolean;
  t: Translations;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  onDistanceMeasure,
  onAreaMeasure,
  onClearMeasurements,
  isMeasuring,
  currentMeasureType,
  measurePreview,
  isDark,
  t,
}) => {
  return (
    <>
      <div
        onClick={onDistanceMeasure}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          cursor: "pointer",
          borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
          background:
            isMeasuring && currentMeasureType === "distance"
              ? isDark
                ? "#2a4a6a"
                : "#e3f2fd"
              : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!(isMeasuring && currentMeasureType === "distance")) {
            e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
          }
        }}
        onMouseLeave={(e) => {
          if (!(isMeasuring && currentMeasureType === "distance")) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <RulerIcon size={14} />
        <span
          style={{ color: isDark ? "#fff" : "#333", fontSize: "12px", flex: 1 }}
        >
          {t.distanceMeasure}
        </span>
        {isMeasuring &&
          currentMeasureType === "distance" &&
          measurePreview?.distance !== undefined && (
            <span style={{ color: "#00aaff", fontSize: "10px" }}>
              {measurePreview.distance >= 1000
                ? `${(measurePreview.distance / 1000).toFixed(1)}km`
                : `${measurePreview.distance.toFixed(0)}m`}
            </span>
          )}
        {isMeasuring && currentMeasureType === "distance" && (
          <span style={{ color: "#00aaff", fontSize: "10px" }}>●</span>
        )}
      </div>

      <div
        onClick={onAreaMeasure}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          cursor: "pointer",
          borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
          background:
            isMeasuring && currentMeasureType === "area"
              ? isDark
                ? "#2a4a6a"
                : "#e3f2fd"
              : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!(isMeasuring && currentMeasureType === "area")) {
            e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
          }
        }}
        onMouseLeave={(e) => {
          if (!(isMeasuring && currentMeasureType === "area")) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <AreaIcon size={14} />
        <span
          style={{ color: isDark ? "#fff" : "#333", fontSize: "12px", flex: 1 }}
        >
          {t.areaMeasure}
        </span>
        {isMeasuring &&
          currentMeasureType === "area" &&
          measurePreview?.area !== undefined && (
            <span style={{ color: "#00aaff", fontSize: "10px" }}>
              {measurePreview.area >= 1000000
                ? `${(measurePreview.area / 1000000).toFixed(1)}km²`
                : `${measurePreview.area.toFixed(0)}m²`}
            </span>
          )}
        {isMeasuring && currentMeasureType === "area" && (
          <span style={{ color: "#00aaff", fontSize: "10px" }}>●</span>
        )}
      </div>
    </>
  );
};
