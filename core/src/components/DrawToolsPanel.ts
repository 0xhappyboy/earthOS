import { Icons } from "./icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface DrawToolsPanelProps {
    onDrawCircle: () => void;
    onDrawRectangle: () => void;
    onDrawTriangle: () => void;
    onEditShape: () => void;
    theme: Theme;
    t: Translations;
}

export class DrawToolsPanel {
    private element: HTMLDivElement;
    private props: DrawToolsPanelProps;

    constructor(props: DrawToolsPanelProps) {
        this.props = props;
        this.element = this.createElement();
        this.render();
    }

    private createElement(): HTMLDivElement {
        const div = document.createElement("div");
        div.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        return div;
    }

    private render(): void {
        this.element.innerHTML = "";
        const isDark = this.props.theme === "dark";
        const circleRow = this.createToolRow(
            Icons.Circle,
            this.props.t.drawCircle,
            this.props.onDrawCircle
        );
        this.element.appendChild(circleRow);
        const rectangleRow = this.createToolRow(
            this.createRectangleIcon(),
            "绘制矩形",
            this.props.onDrawRectangle
        );
        this.element.appendChild(rectangleRow);
        const triangleRow = this.createToolRow(
            this.createTriangleIcon(),
            "绘制三角形",
            this.props.onDrawTriangle
        );
        this.element.appendChild(triangleRow);
    }

    private createToolRow(iconHtml: string, label: string, onClick: () => void): HTMLDivElement {
        const isDark = this.props.theme === "dark";

        const row = document.createElement("div");
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            transition: all 0.2s;
        `;
        row.onmouseenter = () => { row.style.background = isDark ? "#2a2a2a" : "#f5f5f5"; };
        row.onmouseleave = () => { row.style.background = "transparent"; };
        row.onclick = onClick;

        const iconSpan = document.createElement("span");
        iconSpan.innerHTML = iconHtml;
        row.appendChild(iconSpan);

        const textSpan = document.createElement("span");
        textSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px;`;
        textSpan.textContent = label;
        row.appendChild(textSpan);

        return row;
    }

    private createRectangleIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>`;
    }

    private createTriangleIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 22 22 2 22 12 2"/>
        </svg>`;
    }

    private createEditIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3l4 4-7 7-4 1 1-4 7-7z"/>
            <path d="M12 7L4 15v4h4l8-8"/>
        </svg>`;
    }

    public updateTheme(theme: Theme): void {
        this.props.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}