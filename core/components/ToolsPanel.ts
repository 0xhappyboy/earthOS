import { Icons } from "./icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface ToolsPanelProps {
    onDistanceMeasure: () => void;
    onAreaMeasure: () => void;
    onClearMeasurements: () => void;
    isMeasuring: boolean;
    currentMeasureType: "distance" | "area" | null;
    measurePreview: { distance?: number; area?: number } | null;
    theme: Theme;
    t: Translations;
}

export class ToolsPanel {
    private element: HTMLDivElement;
    private props: ToolsPanelProps;

    constructor(props: ToolsPanelProps) {
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
        const distanceRow = this.createMeasureRow(
            Icons.Ruler,
            this.props.t.distanceMeasure,
            "distance",
            this.props.onDistanceMeasure
        );
        this.element.appendChild(distanceRow);
        const areaRow = this.createMeasureRow(
            Icons.Area,
            this.props.t.areaMeasure,
            "area",
            this.props.onAreaMeasure
        );
        this.element.appendChild(areaRow);
    }

    private createMeasureRow(
        icon: string,
        label: string,
        type: "distance" | "area",
        onClick: () => void
    ): HTMLDivElement {
        const isDark = this.props.theme === "dark";
        const isActive = this.props.isMeasuring && this.props.currentMeasureType === type;
        
        const row = document.createElement("div");
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            background: ${isActive ? (isDark ? "#2a4a6a" : "#e3f2fd") : "transparent"};
            transition: all 0.2s;
        `;
        
        row.onmouseenter = () => {
            if (!isActive) {
                row.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
            }
        };
        row.onmouseleave = () => {
            if (!isActive) {
                row.style.background = "transparent";
            }
        };
        row.onclick = onClick;
        const iconSpan = document.createElement("span");
        iconSpan.innerHTML = icon;
        row.appendChild(iconSpan);
        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
        labelSpan.textContent = label;
        row.appendChild(labelSpan);
        if (isActive && this.props.measurePreview) {
            const preview = this.props.measurePreview;
            let previewText = "";
            if (type === "distance" && preview.distance !== undefined) {
                previewText = preview.distance >= 1000
                    ? `${(preview.distance / 1000).toFixed(1)}km`
                    : `${preview.distance.toFixed(0)}m`;
            } else if (type === "area" && preview.area !== undefined) {
                previewText = preview.area >= 1000000
                    ? `${(preview.area / 1000000).toFixed(1)}km²`
                    : `${preview.area.toFixed(0)}m²`;
            }
            
            if (previewText) {
                const previewSpan = document.createElement("span");
                previewSpan.style.cssText = `color: #00aaff; font-size: 10px;`;
                previewSpan.textContent = previewText;
                row.appendChild(previewSpan);
            }
        }
        if (isActive) {
            const activeDot = document.createElement("span");
            activeDot.style.cssText = `color: #00aaff; font-size: 10px;`;
            activeDot.textContent = "●";
            row.appendChild(activeDot);
        }
        return row;
    }

    public updateData(props: Partial<ToolsPanelProps>): void {
        Object.assign(this.props, props);
        this.render();
    }

    public updateTheme(theme: Theme): void {
        this.props.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}