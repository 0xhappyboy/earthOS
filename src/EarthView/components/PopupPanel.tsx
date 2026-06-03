import React from "react";
import { CloseIcon } from "../../icons";
import { Translations } from "../../i18n";

interface PopupPanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: "light" | "dark";
  t: Translations;
}

export const PopupPanel: React.FC<PopupPanelProps> = ({
  title,
  onClose,
  children,
  theme,
  t,
}) => {
  const isDark = theme === "dark";

  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "60px",
        width: "200px",
        maxHeight: "260px",
        background: isDark ? "#1e1e1e" : "#ffffff",
        border: `1px solid ${isDark ? "#333" : "#e0e0e0"}`,
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 200,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 10px",
          borderBottom: `1px solid ${isDark ? "#333" : "#e0e0e0"}`,
          background: isDark ? "#2d2d2d" : "#f5f5f5",
        }}
      >
        <span
          style={{
            color: isDark ? "#fff" : "#333",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {title}
        </span>
        <button
          onClick={onClose}
          title={t.close}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px",
          }}
        >
          <CloseIcon size={12} />
        </button>
      </div>
      <div
        style={{
          maxHeight: "210px",
          overflowY: "auto",
          padding: "4px 0",
          scrollbarWidth: "thin",
          scrollbarColor: isDark ? "#555 #2d2d2d" : "#ccc #f0f0f0",
        }}
        className="earthview-popup-scroll"
      >
        {children}
      </div>
      <style>{`
        .earthview-popup-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .earthview-popup-scroll::-webkit-scrollbar-track {
          background: ${isDark ? "#2d2d2d" : "#f0f0f0"};
          border-radius: 4px;
        }
        .earthview-popup-scroll::-webkit-scrollbar-thumb {
          background: ${isDark ? "#555" : "#ccc"};
          border-radius: 4px;
        }
        .earthview-popup-scroll::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "#777" : "#aaa"};
        }
      `}</style>
    </div>
  );
};
