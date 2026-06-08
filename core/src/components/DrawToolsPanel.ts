import { Icons } from "./icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface DrawToolsPanelProps {
    onDrawCircle: () => void;
    onDrawRectangle: () => void;
    onDrawTriangle: () => void;
    onDrawFreehand: () => void;
    onDrawFreehandPolygon: () => void;
    onDrawEllipse: () => void;
    onDrawMarker: () => void;
    onDrawText: () => void;
    onDrawArrow: () => void;
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
        this.addSectionTitle("线段");
        this.element.appendChild(this.createToolRow(this.createArrowIcon(), "箭头", this.props.onDrawArrow));
        this.addSectionTitle("几何图形");
        this.element.appendChild(this.createToolRow(Icons.Circle, this.props.t.drawCircle, this.props.onDrawCircle));
        this.element.appendChild(this.createToolRow(this.createEllipseIcon(), "椭圆", this.props.onDrawEllipse));
        this.element.appendChild(this.createToolRow(this.createRectangleIcon(), "绘制矩形", this.props.onDrawRectangle));
        this.element.appendChild(this.createToolRow(this.createTriangleIcon(), "绘制三角形", this.props.onDrawTriangle));
        this.addSectionTitle("几何图形");
        this.element.appendChild(this.createToolRow(Icons.Circle, this.props.t.drawCircle, this.props.onDrawCircle));
        this.element.appendChild(this.createToolRow(this.createEllipseIcon(), "椭圆", this.props.onDrawEllipse));
        this.element.appendChild(this.createToolRow(this.createRectangleIcon(), "绘制矩形", this.props.onDrawRectangle));
        this.element.appendChild(this.createToolRow(this.createTriangleIcon(), "绘制三角形", this.props.onDrawTriangle));
        this.addSectionTitle("自由绘制");
        this.element.appendChild(this.createToolRow(this.createFreehandIcon(), "手绘线", this.props.onDrawFreehand));
        this.element.appendChild(this.createToolRow(this.createFreehandPolygonIcon(), "手绘多边形", this.props.onDrawFreehandPolygon));
        this.addSectionTitle("标注工具");
        this.element.appendChild(this.createToolRow(this.createMarkerIcon(), "标注点", this.props.onDrawMarker));
        this.element.appendChild(this.createToolRow(this.createTextIcon(), "文字标注", this.props.onDrawText));
    }

    private addSectionTitle(title: string): void {
        const isDark = this.props.theme === "dark";
        const titleDiv = document.createElement("div");
        titleDiv.style.cssText = `
            padding: 8px 12px 4px 12px;
            color: ${isDark ? "#888" : "#999"};
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.5px;
        `;
        titleDiv.textContent = title;
        this.element.appendChild(titleDiv);
    }

    private addSeparator(): void {
        const isDark = this.props.theme === "dark";
        const separator = document.createElement("div");
        separator.style.cssText = `
            height: 1px;
            background: ${isDark ? "#333" : "#eee"};
            margin: 4px 0;
        `;
        this.element.appendChild(separator);
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

    private createFreehandIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 15l4-4 4 4 4-4 4 4" fill="none"/>
            <path d="M3 21h18" fill="none"/>
        </svg>`;
    }

    private createFreehandPolygonIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 12 3 21 11 18 21 6 21 3 11" fill="none"/>
            <path d="M12 21v-8" fill="none"/>
        </svg>`;
    }

    private createEllipseIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="6"/>
        </svg>`;
    }

    private createMarkerIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
        </svg>`;
    }

    private createTextIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="7" x2="20" y2="7"/>
            <line x1="12" y1="7" x2="12" y2="21"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
        </svg>`;
    }

    private createArrowIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="15 6 19 12 15 18"/>
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