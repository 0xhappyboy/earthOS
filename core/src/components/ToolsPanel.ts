import { Icons } from "../icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface ToolsPanelProps {
    onDistanceMeasure: () => void;
    onAreaMeasure: () => void;
    onClearMeasurements: () => void;
    onPointCoordinatePick: () => void;
    onLineCoordinatePick: () => void;
    onPolygonCoordinatePick: () => void;
    onShowCoordinateList: () => void;
    isMeasuring: boolean;
    currentMeasureType: "distance" | "area" | null;
    currentPickType: "point" | "line" | "polygon" | null;
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
        const measureTitle = this.createTitle("测量工具", isDark);
        this.element.appendChild(measureTitle);
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
        const pickTitle = this.createTitle("坐标拾取", isDark);
        this.element.appendChild(pickTitle);
        const pointPickRow = this.createPickRow(
            Icons.Point,
            "点拾取",
            "point",
            this.props.onPointCoordinatePick
        );
        this.element.appendChild(pointPickRow);
        const linePickRow = this.createPickRow(
            Icons.Line,
            "线拾取",
            "line",
            this.props.onLineCoordinatePick
        );
        this.element.appendChild(linePickRow);
        const polygonPickRow = this.createPickRow(
            Icons.Polygon,
            "面拾取",
            "polygon",
            this.props.onPolygonCoordinatePick
        );
        this.element.appendChild(polygonPickRow);

    }

    private createTitle(title: string, isDark: boolean): HTMLDivElement {
        const titleDiv = document.createElement("div");
        titleDiv.style.cssText = `
            padding: 8px 12px;
            font-size: 11px;
            font-weight: 600;
            color: ${isDark ? "#888" : "#999"};
            background: ${isDark ? "#252525" : "#f5f5f5"};
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            letter-spacing: 0.5px;
        `;
        titleDiv.textContent = title;
        return titleDiv;
    }

    private createSeparator(isDark: boolean): HTMLDivElement {
        const separator = document.createElement("div");
        separator.style.cssText = `
            height: 1px;
            background: ${isDark ? "#333" : "#eee"};
            margin: 4px 0;
        `;
        return separator;
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
        iconSpan.style.cssText = `font-size: 14px;`;
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

    private createPickRow(
        icon: string,
        label: string,
        type: "point" | "line" | "polygon",
        onClick: () => void
    ): HTMLDivElement {
        const isDark = this.props.theme === "dark";
        const isActive = this.props.currentPickType === type;

        const row = document.createElement("div");
        row.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            background: ${isActive ? (isDark ? "#2a6a4a" : "#e8f5e9") : "transparent"};
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
        iconSpan.style.cssText = `font-size: 14px;`;
        row.appendChild(iconSpan);

        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
        labelSpan.textContent = label;
        row.appendChild(labelSpan);

        if (isActive) {
            const activeDot = document.createElement("span");
            activeDot.style.cssText = `color: #4caf50; font-size: 10px;`;
            activeDot.textContent = "●";
            row.appendChild(activeDot);
        }

        return row;
    }

    private createToolRow(icon: string, label: string, onClick: () => void): HTMLDivElement {
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
        iconSpan.innerHTML = icon;
        iconSpan.style.cssText = `font-size: 14px;`;
        row.appendChild(iconSpan);

        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
        labelSpan.textContent = label;
        row.appendChild(labelSpan);

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