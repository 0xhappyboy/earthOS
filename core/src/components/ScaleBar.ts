import { Theme } from "./types";

export class ScaleBar {
    private element: HTMLDivElement;
    private theme: Theme;

    constructor(container: HTMLElement, theme: Theme) {
        this.theme = theme;
        this.element = this.createElement();
        container.appendChild(this.element);
    }

    private createElement(): HTMLDivElement {
        const isDark = this.theme === "dark";
        const div = document.createElement("div");
        div.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            z-index: 100;
            background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)"};
            padding: 4px 8px;
            border-radius: 4px;
            backdrop-filter: blur(4px);
            font-family: monospace;
            font-size: 11px;
            color: ${isDark ? "#fff" : "#333"};
            pointer-events: none;
            border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};
        `;
        div.textContent = "";
        return div;
    }

    public updateScale(scale: string): void {
        this.element.textContent = scale;
    }

    public updateTheme(theme: Theme): void {
        this.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
        this.element.style.color = isDark ? "#fff" : "#333";
        this.element.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    }

    public destroy(): void {
        this.element.remove();
    }
}