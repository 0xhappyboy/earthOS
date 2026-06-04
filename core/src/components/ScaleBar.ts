import { Theme } from "./types";

export class ScaleBar {
    private element: HTMLDivElement;

    constructor(container: HTMLElement, theme: Theme) {
        this.element = this.createElement(theme);
        container.appendChild(this.element);
    }

    private createElement(theme: Theme): HTMLDivElement {
        const isDark = theme === "dark";
        
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
        `;
        div.textContent = "";
        return div;
    }

    public updateScale(scale: string): void {
        this.element.textContent = scale;
    }

    public updateTheme(theme: Theme): void {
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
        this.element.style.color = isDark ? "#fff" : "#333";
    }

    public destroy(): void {
        this.element.remove();
    }
}