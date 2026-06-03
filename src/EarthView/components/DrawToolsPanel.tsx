import React from "react";
import { CircleIcon, EditIcon } from "../../icons";
import { Translations } from "../../i18n";

interface DrawToolsPanelProps {
  onDrawCircle: () => void;
  onEditCircle: () => void;
  isDark: boolean;
  t: Translations;
}

export const DrawToolsPanel: React.FC<DrawToolsPanelProps> = ({
  onDrawCircle,
  onEditCircle,
  isDark,
  t,
}) => {
  return (
    <>
      <div
        onClick={onDrawCircle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          cursor: "pointer",
          borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <CircleIcon size={14} />
        <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}>
          {t.drawCircle}
        </span>
      </div>
      <div
        onClick={onEditCircle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 12px",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <EditIcon size={14} />
        <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}>
          {t.editCircle}
        </span>
      </div>
    </>
  );
};