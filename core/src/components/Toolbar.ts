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
    private scrollContainer: HTMLDivElement;
    private scrollUpBtn: HTMLButtonElement | null = null;
    private scrollDownBtn: HTMLButtonElement | null = null;
    private isScrolling: boolean = false;
    private scrollTimer: number | null = null;

    constructor(options: ToolbarOptions) {
        this.options = options;
        this.element = this.createElement();
        options.container.appendChild(this.element);
        this.scrollContainer = this.element.querySelector('.toolbar-scroll-container') as HTMLDivElement;
        this.attachScrollEvents();
        this.checkScrollPosition();
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
        gap: 4px;
        max-height: calc(100% - 20px);
        background: ${isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)"};
        border-radius: 8px;
        padding: 4px;
        backdrop-filter: blur(4px);
    `;
        this.scrollUpBtn = this.createScrollButton("▲", this.options.t.topScroll || "Top Scroll");
        div.appendChild(this.scrollUpBtn);
        this.scrollUpBtn.style.display = "none";
        const scrollContainer = document.createElement("div");
        scrollContainer.className = "toolbar-scroll-container";
        scrollContainer.style.cssText = `
        overflow-y: auto;
        overflow-x: hidden;
        max-height: calc(100% - 70px);
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 2px;
        scrollbar-width: none;
        -ms-overflow-style: none;
    `;
        const hideScrollbarStyle = document.createElement("style");
        hideScrollbarStyle.textContent = `
        .toolbar-scroll-container::-webkit-scrollbar {
            display: none;
        }
    `;
        scrollContainer.appendChild(hideScrollbarStyle);

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
        flex-shrink: 0;
    `;

        const layersBtn = this.createButton(Icons.Layers, "layers", buttonStyle);
        layersBtn.title = this.options.t.layersTitle;
        scrollContainer.appendChild(layersBtn);
        this.buttons.set("layers", layersBtn);

        const basemapBtn = this.createButton(Icons.Basemap, "basemap", buttonStyle);
        basemapBtn.title = this.options.t.basemapTitle;
        scrollContainer.appendChild(basemapBtn);
        this.buttons.set("basemap", basemapBtn);

        const drawBtn = this.createButton(Icons.Draw, "draw", buttonStyle);
        drawBtn.title = this.options.t.drawToolsTitle;
        scrollContainer.appendChild(drawBtn);
        this.buttons.set("draw", drawBtn);

        const toolsBtn = this.createButton(Icons.Tools, "tools", buttonStyle);
        toolsBtn.title = this.options.t.toolsTitle;
        scrollContainer.appendChild(toolsBtn);
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
        scrollContainer.appendChild(dataBtn);
        const divider = document.createElement("div");
        divider.style.cssText = `height: 1px; background: ${isDark ? "#444" : "#ddd"}; margin: 4px 0; flex-shrink: 0;`;
        scrollContainer.appendChild(divider);
        const zoomInBtn = this.createButton(Icons.ZoomIn, null, buttonStyle);
        zoomInBtn.title = this.options.t.zoomInTitle;
        zoomInBtn.onclick = () => this.options.onZoomIn();
        scrollContainer.appendChild(zoomInBtn);
        const zoomOutBtn = this.createButton(Icons.ZoomOut, null, buttonStyle);
        zoomOutBtn.title = this.options.t.zoomOutTitle;
        zoomOutBtn.onclick = () => this.options.onZoomOut();
        scrollContainer.appendChild(zoomOutBtn);
        const locateBtn = this.createButton(Icons.Locate, null, buttonStyle);
        locateBtn.title = this.options.t.locateMe;
        locateBtn.onclick = () => this.options.onLocate();
        scrollContainer.appendChild(locateBtn);
        div.appendChild(scrollContainer);
        this.scrollDownBtn = this.createScrollButton("▼", this.options.t.bottomScroll || "Bottom Scroll");
        div.appendChild(this.scrollDownBtn);
        this.scrollDownBtn.style.display = "none";
        return div;
    }

    private createScrollButton(icon: string, title: string): HTMLButtonElement {
        const isDark = this.options.theme === "dark";
        const btn = document.createElement("button");
        btn.innerHTML = icon;
        btn.title = title;
        btn.style.cssText = `
        width: 30px;
        height: 30px;
        background: ${isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)"};
        border: 1px solid ${isDark ? "#444" : "#ddd"};
        border-radius: 6px;
        color: ${isDark ? "#ccc" : "#666"};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-size: 12px;
        backdrop-filter: blur(4px);
        margin: 0;
        flex-shrink: 0;
    `;
        btn.onmouseenter = () => {
            btn.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
            btn.style.color = isDark ? "#fff" : "#333";
        };
        btn.onmouseleave = () => {
            btn.style.background = isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)";
            btn.style.color = isDark ? "#ccc" : "#666";
        };
        return btn;
    }

    private injectScrollbarStyles(isDark: boolean): void {
        const styleId = "earthview-toolbar-scroll-styles";
        if (document.getElementById(styleId)) return;
        const thumbColor = isDark ? "#555" : "#ccc";
        const trackColor = isDark ? "#2d2d2d" : "#f0f0f0";
        const css = `
            .toolbar-scroll-container {
                scrollbar-width: thin;
                scrollbar-color: ${thumbColor} ${trackColor};
            }
            .toolbar-scroll-container::-webkit-scrollbar {
                width: 4px;
            }
            .toolbar-scroll-container::-webkit-scrollbar-track {
                background: ${trackColor};
                border-radius: 4px;
            }
            .toolbar-scroll-container::-webkit-scrollbar-thumb {
                background: ${thumbColor};
                border-radius: 4px;
            }
            .toolbar-scroll-container::-webkit-scrollbar-thumb:hover {
                background: ${thumbColor};
            }
        `;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    private attachScrollEvents(): void {
        if (!this.scrollContainer) return;
        this.scrollContainer.addEventListener("scroll", () => {
            this.checkScrollPosition();
        });
        if (this.scrollUpBtn) {
            this.scrollUpBtn.onclick = () => {
                this.scrollContainer.scrollBy({ top: -80, behavior: "smooth" });
                this.checkScrollPosition();
            };
        }
        if (this.scrollDownBtn) {
            this.scrollDownBtn.onclick = () => {
                this.scrollContainer.scrollBy({ top: 80, behavior: "smooth" });
                this.checkScrollPosition();
            };
        }
        const resizeObserver = new ResizeObserver(() => {
            this.checkScrollPosition();
        });
        resizeObserver.observe(this.scrollContainer);
    }

    private checkScrollPosition(): void {
        if (!this.scrollContainer || !this.scrollUpBtn || !this.scrollDownBtn) return;

        const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
        const hasScroll = scrollHeight > clientHeight + 2;

        if (!hasScroll) {
            this.scrollUpBtn.style.display = "none";
            this.scrollDownBtn.style.display = "none";
            return;
        }

        this.scrollUpBtn.style.display = scrollTop > 5 ? "flex" : "none";
        this.scrollDownBtn.style.display = scrollTop + clientHeight < scrollHeight - 5 ? "flex" : "none";
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
            flex-shrink: 0;
        `;

        this.buttons.forEach((btn, key) => {
            const isActive = key === popup;
            btn.style.cssText = buttonStyle(isActive);
        });
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = "transparent";
        const existingStyle = document.getElementById("earthview-toolbar-scroll-styles");
        if (existingStyle) existingStyle.remove();
        this.injectScrollbarStyles(isDark);
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
            flex-shrink: 0;
        `;
        this.buttons.forEach((btn, key) => {
            const isActive = key === this.options.activePopup;
            btn.style.cssText = buttonStyle(isActive);
        });
        const scrollBtnStyle = `
            background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            color: ${isDark ? "#ccc" : "#666"};
        `;
        if (this.scrollUpBtn) this.scrollUpBtn.style.cssText += scrollBtnStyle;
        if (this.scrollDownBtn) this.scrollDownBtn.style.cssText += scrollBtnStyle;
        this.checkScrollPosition();
    }

    public destroy(): void {
        this.element.remove();
    }
}