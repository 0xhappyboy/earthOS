import { Icons } from "../icons";
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
    onShowCoordinatePickingDataPanel?: () => void;
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
        const layersBtn = this.createButton(Icons.Layers, "layers", buttonStyle);
        layersBtn.title = this.options.t.layersTitle;
        div.appendChild(layersBtn);
        this.buttons.set("layers", layersBtn);

        const basemapBtn = this.createButton(Icons.Basemap, "basemap", buttonStyle);
        basemapBtn.title = this.options.t.basemapTitle;
        div.appendChild(basemapBtn);
        this.buttons.set("basemap", basemapBtn);

        const drawBtn = this.createButton(Icons.Draw, "draw", buttonStyle);
        drawBtn.title = this.options.t.drawToolsTitle;
        div.appendChild(drawBtn);
        this.buttons.set("draw", drawBtn);

        const toolsBtn = this.createButton(Icons.Tools, "tools", buttonStyle);
        toolsBtn.title = this.options.t.toolsTitle;
        div.appendChild(toolsBtn);
        this.buttons.set("tools", toolsBtn);

        const dataBtn = document.createElement("button");
        dataBtn.style.cssText = buttonStyle(false);
        dataBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>`;
        dataBtn.title = this.options.t.coordinateData;
        dataBtn.onclick = () => {
            this.options.onShowCoordinatePickingDataPanel?.();
        };
        div.appendChild(dataBtn);

        const divider = document.createElement("div");
        divider.style.cssText = `height: 1px; background: ${isDark ? "#444" : "#ddd"}; margin: 4px 0;`;
        div.appendChild(divider);

        const zoomInBtn = this.createButton(Icons.ZoomIn, null, buttonStyle);
        zoomInBtn.title = this.options.t.zoomInTitle;
        zoomInBtn.onclick = () => this.options.onZoomIn();
        div.appendChild(zoomInBtn);

        const zoomOutBtn = this.createButton(Icons.ZoomOut, null, buttonStyle);
        zoomOutBtn.title = this.options.t.zoomOutTitle;
        zoomOutBtn.onclick = () => this.options.onZoomOut();
        div.appendChild(zoomOutBtn);

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