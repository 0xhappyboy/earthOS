import React from "react";

interface LoadingOverlayProps {
  message: string;
  theme: "light" | "dark";
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, theme }) => {
  const isDark = theme === "dark";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: `3px solid ${isDark ? "#444" : "#ddd"}`,
          borderTop: `3px solid #00aaff`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <span
        style={{
          color: isDark ? "#fff" : "#333",
          fontSize: "13px",
          background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
          padding: "4px 12px",
          borderRadius: "4px",
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};