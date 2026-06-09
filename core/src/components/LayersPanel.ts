import { Icons } from "../icons";
import { LayerInfo, Theme } from "./types";
import { Translations } from "../i18n";
import { LayerClassification } from "../types";

export interface LayersPanelOptions {
    layerList: LayerInfo[];
    onToggleVisibility: (layerId: string) => void;
    onRemoveLayer: (layerId: string) => void;
    theme: Theme;
    t: Translations;
}

export class LayersPanel {
    private element: HTMLDivElement;
    private options: LayersPanelOptions;
    private activeCategory: string | null = null;
    private readonly SYSTEM_LAYER_IDS = [
        "circle-draw",
        "rectangle-draw",
        "triangle-draw",
        "distance-measurement",
        "area-measurement"
    ];

    constructor(options: LayersPanelOptions) {
        this.options = options;
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

    private isSystemLayer(layerId: string): boolean {
        return this.SYSTEM_LAYER_IDS.includes(layerId);
    }

    private getLayerDisplayName(layer: LayerInfo): string {
        switch (layer.id) {
            case "circle-draw":
                return this.options.t.circleDrawLayer;
            case "rectangle-draw":
                return this.options.t.rectangleDrawLayer;
            case "triangle-draw":
                return this.options.t.triangleDrawLayer;
            case "distance-measurement":
                return this.options.t.distanceMeasurementLayer;
            case "area-measurement":
                return this.options.t.areaMeasurementLayer;
            case "freehand-draw":
                return this.options.t.freehandDrawLayer;
            case "ellipse-draw":
                return this.options.t.ellipseDrawLayer;
            case "marker-draw":
                return this.options.t.markerDrawLayer;
            case "text-draw":
                return this.options.t.textDrawLayer;
            case "image-draw":
                return this.options.t.imageDrawLayer;
            case "arrow-draw":
                return this.options.t.arrowDrawLayer;
            case "line-draw":
                return this.options.t.lineDrawLayer;
            case "bezier-draw":
                return this.options.t.bezierDrawLayer;
            case "sector-draw":
                return this.options.t.sectorDrawLayer;
            case "point-coordinate-pick":
                return this.options.t.pointPickLayer;
            case "line-coordinate-pick":
                return this.options.t.linePickLayer;
            case "polygon-coordinate-pick":
                return this.options.t.polygonPickLayer;
            default:
                return layer.name;
        }
    }

    private getLayerClassification(layerId: string): LayerClassification {
        const drawLayerIds = [
            "circle-draw", "rectangle-draw", "triangle-draw",
            "freehand-draw", "ellipse-draw", "marker-draw",
            "text-draw", "image-draw", "arrow-draw",
            "line-draw", "bezier-draw", "sector-draw"
        ];
        const toolLayerIds = [
            "distance-measurement", "area-measurement",
            "point-coordinate-pick", "line-coordinate-pick", "polygon-coordinate-pick"
        ];

        if (drawLayerIds.includes(layerId)) {
            return LayerClassification.DRAW_LAYER;
        } else if (toolLayerIds.includes(layerId)) {
            return LayerClassification.TOOL_LAYER;
        }
        return LayerClassification.DATA_LAYER;
    }

    private getClassificationIcon(classification: LayerClassification): string {
        switch (classification) {
            case LayerClassification.DATA_LAYER:
                return "📊";
            case LayerClassification.DRAW_LAYER:
                return "✏️";
            case LayerClassification.TOOL_LAYER:
                return "🛠️";
            default:
                return "📁";
        }
    }

    private getClassificationLabel(classification: LayerClassification): string {
        switch (classification) {
            case LayerClassification.DATA_LAYER:
                return this.options.t.dataLayers || "数据图层";
            case LayerClassification.DRAW_LAYER:
                return this.options.t.drawLayers || "绘图图层";
            case LayerClassification.TOOL_LAYER:
                return this.options.t.toolLayers || "工具图层";
            default:
                return "";
        }
    }

    private getClassificationOrder(): LayerClassification[] {
        return [
            LayerClassification.DATA_LAYER,
            LayerClassification.DRAW_LAYER,
            LayerClassification.TOOL_LAYER
        ];
    }

    private render(): void {
        this.element.innerHTML = "";

        if (this.options.layerList.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.style.cssText = `
                padding: 16px;
                text-align: center;
                color: ${this.options.theme === "dark" ? "#888" : "#999"};
                font-size: 12px;
            `;
            emptyDiv.textContent = this.options.t.noLayers;
            this.element.appendChild(emptyDiv);
            return;
        }
        const isDark = this.options.theme === "dark";
        const groupedLayers: Map<LayerClassification, LayerInfo[]> = new Map();
        for (const layer of this.options.layerList) {
            const classification = this.getLayerClassification(layer.id);
            if (!groupedLayers.has(classification)) {
                groupedLayers.set(classification, []);
            }
            groupedLayers.get(classification)!.push(layer);
        }
        const order = this.getClassificationOrder();
        for (const classification of order) {
            const layers = groupedLayers.get(classification) || [];
            const isActive = this.activeCategory === classification;
            const label = this.getClassificationLabel(classification);
            const icon = this.getClassificationIcon(classification);
            const count = layers.length;
            const header = this.createCategoryHeader(classification, label, icon, isActive, isDark, count);
            this.element.appendChild(header);
            if (isActive && layers.length > 0) {
                const subMenu = this.createSubMenu(layers, isDark, classification);
                this.element.appendChild(subMenu);
            } else if (isActive && layers.length === 0) {
                const emptySubMenu = this.createEmptySubMenu(isDark);
                this.element.appendChild(emptySubMenu);
            }
        }
    }

    private createCategoryHeader(
        classification: LayerClassification,
        label: string,
        icon: string,
        isActive: boolean,
        isDark: boolean,
        count: number
    ): HTMLDivElement {
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            cursor: pointer;
            background: ${isActive ? (isDark ? "#2a4a6a" : "#e3f2fd") : "transparent"};
            border-left: ${isActive ? "3px solid #00aaff" : "3px solid transparent"};
            transition: all 0.2s;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
        `;

        header.onmouseenter = () => {
            if (!isActive) {
                header.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
            }
        };
        header.onmouseleave = () => {
            if (!isActive) {
                header.style.background = "transparent";
            }
        };
        header.onclick = () => {
            if (this.activeCategory === classification) {
                this.activeCategory = null;
            } else {
                this.activeCategory = classification;
            }
            this.render();
        };
        const iconSpan = document.createElement("span");
        iconSpan.style.cssText = `font-size: 14px;`;
        iconSpan.textContent = icon;
        header.appendChild(iconSpan);
        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
        labelSpan.textContent = `${label} (${count})`;
        header.appendChild(labelSpan);
        const arrowSpan = document.createElement("span");
        arrowSpan.style.cssText = `color: ${isDark ? "#888" : "#999"}; font-size: 10px;`;
        arrowSpan.textContent = isActive ? "▼" : "▶";
        header.appendChild(arrowSpan);
        return header;
    }

    private createSubMenu(layers: LayerInfo[], isDark: boolean, classification: LayerClassification): HTMLDivElement {
        const subMenu = document.createElement("div");
        subMenu.style.cssText = `
        background: ${isDark ? "#252525" : "#fafafa"};
        border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
    `;
        for (const layer of layers) {
            const row = document.createElement("div");
            row.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px 8px 24px;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
        `;

            const leftDiv = document.createElement("div");
            leftDiv.style.cssText = `display: flex; align-items: center; gap: 8px; flex: 1;`;
            const visibilityBtn = document.createElement("button");
            visibilityBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2px;
            color: ${layer.visible ? (isDark ? "#00aaff" : "#0077cc") : (isDark ? "#888" : "#ccc")};
        `;
            visibilityBtn.innerHTML = layer.visible ? Icons.Eye : Icons.EyeOff;
            visibilityBtn.title = layer.visible ? this.options.t.hideLayer : this.options.t.showLayer;
            visibilityBtn.onclick = (e) => {
                e.stopPropagation();
                this.options.onToggleVisibility(layer.id);
            };
            leftDiv.appendChild(visibilityBtn);
            const nameSpan = document.createElement("span");
            nameSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
            nameSpan.textContent = this.getLayerDisplayName(layer);
            leftDiv.appendChild(nameSpan);
            row.appendChild(leftDiv);
            if (classification === LayerClassification.DATA_LAYER && !this.isSystemLayer(layer.id)) {
                const deleteBtn = document.createElement("button");
                deleteBtn.style.cssText = `
                background: none;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2px;
                color: #f44336;
            `;
                deleteBtn.innerHTML = Icons.Delete;
                deleteBtn.title = this.options.t.deleteLayerTitle;
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.options.onRemoveLayer(layer.id);
                };
                row.appendChild(deleteBtn);
            }

            subMenu.appendChild(row);
        }

        return subMenu;
    }

    private createEmptySubMenu(isDark: boolean): HTMLDivElement {
        const emptyDiv = document.createElement("div");
        emptyDiv.style.cssText = `
        background: ${isDark ? "#252525" : "#fafafa"};
        padding: 12px;
        text-align: center;
        color: ${isDark ? "#888" : "#999"};
        font-size: 11px;
        border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
    `;
        emptyDiv.textContent = this.options.t.noLayers;
        return emptyDiv;
    }

    public updateData(layerList: LayerInfo[]): void {
        this.options.layerList = layerList;
        this.render();
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        this.render();
    }

    public setActiveCategory(classification: LayerClassification | null): void {
        this.activeCategory = classification;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public destroy(): void {
        this.element.remove();
    }
}