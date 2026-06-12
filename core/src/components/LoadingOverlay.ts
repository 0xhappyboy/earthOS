import { Theme } from "./types";
import { Translations } from "../i18n";

export class LoadingOverlay {
    private element: HTMLDivElement;
    private theme: Theme;
    private messageSpan: HTMLSpanElement;
    private spinner: HTMLDivElement;

    constructor(container: HTMLElement, theme: Theme) {
        this.theme = theme;
        this.element = this.createElement();
        container.appendChild(this.element);
        this.messageSpan = this.element.querySelector(".loading-message") as HTMLSpanElement;
        this.spinner = this.element.querySelector(".loading-spinner") as HTMLDivElement;
    }

    private createElement(): HTMLDivElement {
        const isDark = this.theme === "dark";
        const div = document.createElement("div");
        div.className = "earthview-loading-overlay";
        div.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            background: ${isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)"};
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 12px;
            display: none;
            user-select: none;
        `;

        this.spinner = document.createElement("div");
        this.spinner.className = "loading-spinner";
        this.spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid ${isDark ? "#444" : "#ddd"};
            border-top: 3px solid #00aaff;
            border-radius: 50%;
            animation: earthview-spin 1s linear infinite;
        `;
        div.appendChild(this.spinner);

        this.messageSpan = document.createElement("span");
        this.messageSpan.className = "loading-message";
        this.messageSpan.style.cssText = `
            color: ${isDark ? "#fff" : "#333"};
            font-size: 13px;
            background: ${isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)"};
            padding: 4px 12px;
            border-radius: 4px;
        `;
        this.messageSpan.textContent = "";
        div.appendChild(this.messageSpan);

        const style = document.createElement("style");
        style.textContent = `
            @keyframes earthview-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        return div;
    }

    public show(message: string): void {
        this.messageSpan.textContent = message;
        this.element.style.display = "flex";
    }

    public hide(): void {
        this.element.style.display = "none";
    }

    public updateTheme(theme: Theme): void {
        this.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
        this.spinner.style.border = `3px solid ${isDark ? "#444" : "#ddd"}`;
        this.spinner.style.borderTop = "3px solid #00aaff";
        this.messageSpan.style.color = isDark ? "#fff" : "#333";
        this.messageSpan.style.background = isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)";
    }

    public destroy(): void {
        this.element.remove();
    }
}