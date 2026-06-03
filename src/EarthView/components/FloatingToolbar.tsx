import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  DragHandleIcon,
  ColorIcon,
  StrokeWidthIcon,
  StrokeStyleIcon,
  DeleteIcon,
  CloseIcon,
} from "../../icons";
import { Translations } from "../../i18n";

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onColorChange: () => void;
  onStrokeWidthChange: () => void;
  onStrokeStyleChange: () => void;
  onDelete: () => void;
  onClose: () => void;
  theme: "light" | "dark";
  t: Translations;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  visible,
  position,
  onPositionChange,
  onColorChange,
  onStrokeWidthChange,
  onStrokeStyleChange,
  onDelete,
  onClose,
  theme,
  t,
  containerRef,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const isDark = theme === "dark";

  const buttonStyle = {
    width: "28px",
    height: "28px",
    background: isDark ? "#2d2d2d" : "#f0f0f0",
    border: `1px solid ${isDark ? "#444" : "#ddd"}`,
    borderRadius: "6px",
    color: isDark ? "#ccc" : "#666",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    flexShrink: 0,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { x: position.x, y: position.y };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      let newX = positionStartRef.current.x + dx;
      let newY = positionStartRef.current.y + dy;
      if (containerRef.current && toolbarRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        newX = Math.max(
          0,
          Math.min(newX, containerRect.width - toolbarRect.width),
        );
        newY = Math.max(
          0,
          Math.min(newY, containerRect.height - toolbarRect.height),
        );
      }
      onPositionChange({ x: newX, y: newY });
    },
    [isDragging, containerRef, onPositionChange],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)",
        border: `1px solid ${isDark ? "#444" : "#ddd"}`,
        borderRadius: "8px",
        padding: "6px 8px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          ...buttonStyle,
          width: "20px",
          cursor: "grab",
          background: isDark ? "#3d3d3d" : "#e8e8e8",
        }}
        onMouseEnter={(e) => {
          if (!isDragging)
            e.currentTarget.style.background = isDark ? "#4d4d4d" : "#ddd";
        }}
        onMouseLeave={(e) => {
          if (!isDragging)
            e.currentTarget.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        }}
      >
        <DragHandleIcon size={16} />
      </div>
      <button
        onClick={onColorChange}
        title={t.colorTitle}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
        }}
      >
        <ColorIcon size={16} />
      </button>
      <button
        onClick={onStrokeWidthChange}
        title={t.strokeWidthTitle}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
        }}
      >
        <StrokeWidthIcon size={16} />
      </button>
      <button
        onClick={onStrokeStyleChange}
        title={t.strokeStyleTitle}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
        }}
      >
        <StrokeStyleIcon size={16} />
      </button>
      <button
        onClick={onDelete}
        title={t.deleteTitle}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f44336";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
          e.currentTarget.style.color = isDark ? "#ccc" : "#666";
        }}
      >
        <DeleteIcon size={16} />
      </button>
      <button
        onClick={onClose}
        title={t.closeTitle}
        style={buttonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
        }}
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
};
