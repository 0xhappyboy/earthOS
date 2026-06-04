import { Translations } from "../i18n";
import { BasemapTypeEnum } from "../types";

export type Theme = "light" | "dark";
export type PopupType = "layers" | "basemap" | "draw" | "tools" | null;

export interface LayerInfo {
    id: string;
    name: string;
    visible: boolean;
}

export interface BasemapOption {
    value: BasemapTypeEnum;
    label: string;
    icon: string;
}

export interface ColorPickerOptions {
    onSelect: (color: number[]) => void;
    onClose: () => void;
    currentColor?: number[];
    theme: Theme;
    t: Translations;
}

export interface StrokeStylePickerOptions {
    onSelect: (style: "solid" | "dashed") => void;
    onClose: () => void;
    currentStyle: "solid" | "dashed";
    theme: Theme;
    t: Translations;
}

export interface StrokeWidthPickerOptions {
    onSelect: (width: number) => void;
    onClose: () => void;
    currentWidth: number;
    theme: Theme;
    t: Translations;
}