import React from "react";

interface LoadingOverlayProps {
  message: string;
  theme?: "light" | "dark";
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
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
          border: "3px solid #444",
          borderTop: "3px solid #00aaff",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <span
        style={{
          color: "#fff",
          fontSize: "13px",
          background: "rgba(0,0,0,0.5)",
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
