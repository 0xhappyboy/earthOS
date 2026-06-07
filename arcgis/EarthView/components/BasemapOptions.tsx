import React from "react";
import { BasemapTypeEnum } from "../../types";
import { CheckIcon } from "../../icons";
import { Translations } from "../../i18n";

interface BasemapOptionsProps {
  currentBasemap: BasemapTypeEnum;
  onSelect: (basemap: BasemapTypeEnum) => void;
  isDark: boolean;
  t: Translations;
}

export const BasemapOptions: React.FC<BasemapOptionsProps> = ({
  currentBasemap,
  onSelect,
  isDark,
  t,
}) => {
  const options: { value: BasemapTypeEnum; label: string; icon: string }[] = [
    { value: BasemapTypeEnum.SATELLITE, label: t.satellite, icon: "🛰️" },
    { value: BasemapTypeEnum.STREETS, label: t.streets, icon: "🗺️" },
    { value: BasemapTypeEnum.TOPO, label: t.topographic, icon: "⛰️" },
    { value: BasemapTypeEnum.DARK_GRAY, label: t.darkGray, icon: "🌙" },
    { value: BasemapTypeEnum.GRAY, label: t.lightGray, icon: "☀️" },
    { value: BasemapTypeEnum.HYBRID, label: t.hybrid, icon: "🔄" },
    { value: BasemapTypeEnum.TERRAIN, label: t.terrain, icon: "🗻" },
    { value: BasemapTypeEnum.OCEANS, label: t.oceans, icon: "🌊" },
    {
      value: BasemapTypeEnum.NATIONAL_GEOGRAPHIC,
      label: t.nationalGeographic,
      icon: "📰",
    },
    { value: BasemapTypeEnum.LIGHT_GRAY, label: t.lightGray, icon: "⬜" },
    { value: BasemapTypeEnum.IMAGERY, label: t.imagery, icon: "📷" },
    { value: BasemapTypeEnum.PHYSICAL, label: t.physical, icon: "🌎" },
  ];

  return (
    <>
      {options.map((option) => (
        <div
          key={option.value}
          onClick={() => onSelect(option.value)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            cursor: "pointer",
            background:
              currentBasemap === option.value
                ? isDark
                  ? "#2a2a2a"
                  : "#f0f0f0"
                : "transparent",
            borderLeft:
              currentBasemap === option.value
                ? `3px solid #00aaff`
                : "3px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (currentBasemap !== option.value) {
              e.currentTarget.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
            }
          }}
          onMouseLeave={(e) => {
            if (currentBasemap !== option.value) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <span style={{ fontSize: "14px" }}>{option.icon}</span>
          <span
            style={{
              color: isDark ? "#fff" : "#333",
              fontSize: "12px",
              flex: 1,
            }}
          >
            {option.label}
          </span>
          {currentBasemap === option.value && <CheckIcon size={12} />}
        </div>
      ))}
    </>
  );
};
