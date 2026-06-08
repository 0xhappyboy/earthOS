import { Icons } from "../icons";
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
    onDrawLine: () => void;
    onDrawBezier: () => void;
    onDrawSector: () => void;
    onEditShape: () => void;
    onDrawImage: () => void;
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
        this.addSectionTitle(this.props.t.lineTool);
        this.element.appendChild(this.createToolRow(this.createLineIcon(), this.props.t.lineTool, this.props.onDrawLine));
        this.element.appendChild(this.createToolRow(this.createArrowIcon(), this.props.t.arrowTool, this.props.onDrawArrow));
        this.element.appendChild(this.createToolRow(this.createBezierIcon(), this.props.t.bezierTool, this.props.onDrawBezier));
        this.addSectionTitle(this.props.t.drawTools);
        this.element.appendChild(this.createToolRow(Icons.Circle, this.props.t.drawCircle, this.props.onDrawCircle));
        this.element.appendChild(this.createToolRow(this.createEllipseIcon(), this.props.t.ellipseTool, this.props.onDrawEllipse));
        this.element.appendChild(this.createToolRow(this.createRectangleIcon(), this.props.t.rectangleTool, this.props.onDrawRectangle));
        this.element.appendChild(this.createToolRow(this.createTriangleIcon(), this.props.t.triangleTool, this.props.onDrawTriangle));
        this.element.appendChild(this.createToolRow(this.createSectorIcon(), this.props.t.sectorTool, this.props.onDrawSector));
        this.addSectionTitle(this.props.t.drawFreehandLine);
        this.element.appendChild(this.createToolRow(this.createFreehandIcon(), this.props.t.drawFreehandLine, this.props.onDrawFreehand));
        this.element.appendChild(this.createToolRow(this.createFreehandPolygonIcon(), this.props.t.drawFreehandPolygon, this.props.onDrawFreehandPolygon));
        this.addSectionTitle(this.props.t.drawMarker);
        this.element.appendChild(this.createToolRow(this.createMarkerIcon(), this.props.t.drawMarker, this.props.onDrawMarker));
        this.element.appendChild(this.createToolRow(this.createTextIcon(), this.props.t.drawText, this.props.onDrawText));
        this.element.appendChild(this.createToolRow(this.createImageIcon(), this.props.t.drawImage, this.props.onDrawImage));
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

    private createLineIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
        </svg>`;
    }

    private createBezierIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4 L8 8" />
            <path d="M20 20 L16 16" />
            <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="20" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
            <path d="M4 4 Q8 16 16 16" fill="none" stroke-width="2"/>
            <path d="M4 4 Q12 0 20 20" fill="none" stroke-width="1" stroke-dasharray="3,3"/>
        </svg>`;
    }

    private createSectorIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="12" x2="12" y2="2"/>
            <line x1="12" y1="12" x2="19" y2="8"/>
            <path d="M12 2 A10 10 0 0 1 19 8" fill="currentColor" opacity="0.3"/>
        </svg>`;
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

    private createImageIcon(): string {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <polyline points="21 15 16 10 5 21"/>
            <line x1="10" y1="21" x2="21" y2="21"/>
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

    public updateTheme(theme: Theme): void {
        this.props.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}