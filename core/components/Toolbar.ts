// core/src/components/Toolbar.ts

import { Icons } from "./icons";
import { PopupType, Theme } from "./types";
import { Translations } from "../i18n";

export interface ToolbarOptions {
    container: HTMLElement;
    t: Translations;
    theme: Theme;
    activePopup: PopupType;
    onTogglePopup: (popup: PopupType) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocate: () => void;
}

export class Toolbar {
    private element: HTMLDivElement;
    private options: ToolbarOptions;
    private buttons: Map<PopupType, HTMLButtonElement> = new Map();

    constructor(options: ToolbarOptions) {
        this.options = options;
        this.element = this.createElement();
        options.container.appendChild(this.element);
    }

    private createElement(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        
        const div = document.createElement("div");
        div.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)"};
            padding: 8px;
            border-radius: 8px;
            backdrop-filter: blur(4px);
        `;

        const buttonStyle = (isActive: boolean): string => `
            width: 30px;
            height: 30px;
            background: ${isActive ? "#00aaff" : (isDark ? "#2d2d2d" : "#f0f0f0")};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 6px;
            color: ${isActive ? "white" : (isDark ? "#ccc" : "#666")};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;

        // 图层按钮
        const layersBtn = this.createButton(Icons.Layers, "layers", buttonStyle);
        layersBtn.title = this.options.t.layersTitle;
        div.appendChild(layersBtn);
        this.buttons.set("layers", layersBtn);

        // 底图按钮
        const basemapBtn = this.createButton(Icons.Basemap, "basemap", buttonStyle);
        basemapBtn.title = this.options.t.basemapTitle;
        div.appendChild(basemapBtn);
        this.buttons.set("basemap", basemapBtn);

        // 绘图按钮
        const drawBtn = this.createButton(Icons.Draw, "draw", buttonStyle);
        drawBtn.title = this.options.t.drawToolsTitle;
        div.appendChild(drawBtn);
        this.buttons.set("draw", drawBtn);

        // 工具按钮
        const toolsBtn = this.createButton(Icons.Tools, "tools", buttonStyle);
        toolsBtn.title = this.options.t.toolsTitle;
        div.appendChild(toolsBtn);
        this.buttons.set("tools", toolsBtn);

        // 分隔线
        const divider = document.createElement("div");
        divider.style.cssText = `height: 1px; background: ${isDark ? "#444" : "#ddd"}; margin: 4px 0;`;
        div.appendChild(divider);

        // 放大按钮
        const zoomInBtn = this.createButton(Icons.ZoomIn, null, buttonStyle);
        zoomInBtn.title = this.options.t.zoomInTitle;
        zoomInBtn.onclick = () => this.options.onZoomIn();
        div.appendChild(zoomInBtn);

        // 缩小按钮
        const zoomOutBtn = this.createButton(Icons.ZoomOut, null, buttonStyle);
        zoomOutBtn.title = this.options.t.zoomOutTitle;
        zoomOutBtn.onclick = () => this.options.onZoomOut();
        div.appendChild(zoomOutBtn);

        // 定位按钮
        const locateBtn = this.createButton(Icons.Locate, null, buttonStyle);
        locateBtn.title = this.options.t.locateMe;
        locateBtn.onclick = () => this.options.onLocate();
        div.appendChild(locateBtn);

        return div;
    }

    private createButton(iconHtml: string, popupType: PopupType | null, buttonStyle: (isActive: boolean) => string): HTMLButtonElement {
        const btn = document.createElement("button");
        const isActive = popupType !== null && this.options.activePopup === popupType;
        btn.style.cssText = buttonStyle(isActive);
        btn.innerHTML = iconHtml;
        
        if (popupType !== null) {
            btn.onclick = () => {
                const newActive = this.options.activePopup === popupType ? null : popupType;
                this.options.onTogglePopup(newActive);
            };
        }
        
        return btn;
    }

    public updateActivePopup(popup: PopupType): void {
        const isDark = this.options.theme === "dark";
        const buttonStyle = (isActive: boolean): string => `
            width: 30px;
            height: 30px;
            background: ${isActive ? "#00aaff" : (isDark ? "#2d2d2d" : "#f0f0f0")};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 6px;
            color: ${isActive ? "white" : (isDark ? "#ccc" : "#666")};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        
        this.buttons.forEach((btn, key) => {
            const isActive = key === popup;
            btn.style.cssText = buttonStyle(isActive);
        });
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
        
        const buttonStyle = (isActive: boolean): string => `
            width: 30px;
            height: 30px;
            background: ${isActive ? "#00aaff" : (isDark ? "#2d2d2d" : "#f0f0f0")};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 6px;
            color: ${isActive ? "white" : (isDark ? "#ccc" : "#666")};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
        
        this.buttons.forEach((btn, key) => {
            const isActive = key === this.options.activePopup;
            btn.style.cssText = buttonStyle(isActive);
        });
    }

    public destroy(): void {
        this.element.remove();
    }
}