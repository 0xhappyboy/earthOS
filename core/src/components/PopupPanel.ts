import { Theme } from "./types";
import { Translations } from "../i18n";
import { Icons } from "../icons";

export interface PopupPanelOptions {
    title: string;
    theme: Theme;
    t: Translations;
    onClose: () => void;
}

export class PopupPanel {
    private element: HTMLDivElement;
    private options: PopupPanelOptions;
    private contentContainer!: HTMLDivElement;

    constructor(options: PopupPanelOptions) {
        this.options = options;
        this.element = this.createElement();
    }

    private createElement(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const panel = document.createElement("div");
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 60px;
            width: 200px;
            max-height: 328px;
            background: ${isDark ? "#1e1e1e" : "#ffffff"};
            border: 1px solid ${isDark ? "#333" : "#e0e0e0"};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 200;
            overflow: hidden;
        `;
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 2px 10px;
            border-bottom: 1px solid ${isDark ? "#333" : "#e0e0e0"};
            background: ${isDark ? "#2d2d2d" : "#f5f5f5"};
        `;

        const titleSpan = document.createElement("span");
        titleSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-weight: 500;`;
        titleSpan.textContent = this.options.title;
        header.appendChild(titleSpan);

        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: ${isDark ? "#ccc" : "#666"};
    font-size: 16px;
`;
        closeBtn.innerHTML = "✕";
        closeBtn.title = this.options.t.close;
        closeBtn.onclick = () => this.options.onClose();

        header.appendChild(closeBtn);
        panel.appendChild(header);
        this.contentContainer = document.createElement("div");
        this.contentContainer.style.cssText = `
            max-height: 288px;
            overflow-y: auto;
            padding: 4px 0;
        `;
        this.contentContainer.className = "earthview-popup-scroll";
        panel.appendChild(this.contentContainer);
        this.injectScrollbarStyles(isDark);
        return panel;
    }

    private injectScrollbarStyles(isDark: boolean): void {
        if (document.getElementById("earthview-popup-scroll-styles")) {
            const styleEl = document.getElementById("earthview-popup-scroll-styles") as HTMLStyleElement;
            if (styleEl) {
                styleEl.textContent = this.getScrollbarStyles(isDark);
            }
            return;
        }
        const style = document.createElement("style");
        style.id = "earthview-popup-scroll-styles";
        style.textContent = this.getScrollbarStyles(isDark);
        document.head.appendChild(style);
    }

    private getScrollbarStyles(isDark: boolean): string {
        const thumbColor = isDark ? "#555" : "#ccc";
        const trackColor = isDark ? "#2d2d2d" : "#f0f0f0";
        const thumbHoverColor = isDark ? "#777" : "#aaa";

        return `
            .earthview-popup-scroll {
                scrollbar-width: thin;
                scrollbar-color: ${thumbColor} ${trackColor};
            }
            .earthview-popup-scroll::-webkit-scrollbar {
                width: 4px;
            }
            .earthview-popup-scroll::-webkit-scrollbar-track {
                background: ${trackColor};
                border-radius: 4px;
            }
            .earthview-popup-scroll::-webkit-scrollbar-thumb {
                background: ${thumbColor};
                border-radius: 4px;
            }
            .earthview-popup-scroll::-webkit-scrollbar-thumb:hover {
                background: ${thumbHoverColor};
            }
        `;
    }

    public getContentContainer(): HTMLDivElement {
        return this.contentContainer;
    }

    public appendChild(child: HTMLElement): void {
        this.contentContainer.appendChild(child);
    }

    public updateTheme(theme: Theme): void {
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "#1e1e1e" : "#ffffff";
        this.element.style.borderColor = isDark ? "#333" : "#e0e0e0";
        const header = this.element.querySelector("div:first-child") as HTMLDivElement;
        if (header) {
            header.style.borderBottomColor = isDark ? "#333" : "#e0e0e0";
            header.style.background = isDark ? "#2d2d2d" : "#f5f5f5";
            const titleSpan = header.querySelector("span");
            if (titleSpan) {
                titleSpan.style.color = isDark ? "#fff" : "#333";
            }
            const closeBtn = header.querySelector("button");
            if (closeBtn) {
                closeBtn.style.color = isDark ? "#ccc" : "#666";
            }
        }
        const styleEl = document.getElementById("earthview-popup-scroll-styles") as HTMLStyleElement;
        if (styleEl) {
            styleEl.textContent = this.getScrollbarStyles(isDark);
        }
    }

    public destroy(): void {
        this.element.remove();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}