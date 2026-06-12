import { Icons } from "../icons";
import { LayerInfo, Theme } from "./types";
import { Translations } from "../i18n";
import { LayerClassification } from "../types";

export interface LayersPanelOptions {
    layerList: LayerInfo[];
    onToggleVisibility: (layerId: string) => void;
    onRemoveLayer: (layerId: string) => void;
    onGetLayerFeatures?: (layerId: string) => LayerFeature[];
    onLocateFeature?: (layerId: string, featureId: string) => void;
    onCopyFeatureCoordinates?: (layerId: string, featureId: string) => void;
    theme: Theme;
    t: Translations;
}

export interface LayerFeature {
    id: string;
    name: string;
    type: "point" | "line" | "polygon";
    coordinates: any;
    properties?: Record<string, any>;
    timestamp?: number;
}

export class LayersPanel {
    private element: HTMLDivElement;
    private options: LayersPanelOptions;
    private activeCategory: LayerClassification | null = LayerClassification.DATA_LAYER;
    private featureListPanel: HTMLDivElement | null = null;
    private featureDetailPanel: HTMLDivElement | null = null;
    private currentFeatureListLayerId: string | null = null;
    private currentFeatureId: string | null = null;
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
            user-select: none; 
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
                return this.options.t.dataLayers || "Data Layers";
            case LayerClassification.DRAW_LAYER:
                return this.options.t.drawLayers || "Draw Layers";
            case LayerClassification.TOOL_LAYER:
                return this.options.t.toolLayers || "Tool Layers";
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
            user-select: none;
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
            this.hideFeatureListPanel();
            this.hideFeatureDetailPanel();
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
                cursor: ${classification === LayerClassification.DATA_LAYER ? "pointer" : "default"};
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
            if (classification === LayerClassification.DATA_LAYER) {
                row.onclick = (e) => {
                    e.stopPropagation();
                    this.showFeatureListPanel(layer.id, layer.name);
                };
            }
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

    private showFeatureListPanel(layerId: string, layerName: string): void {
        this.hideFeatureListPanel();
        this.hideFeatureDetailPanel();
        this.currentFeatureListLayerId = layerId;
        const isDark = this.options.theme === "dark";
        const mainPanelRect = this.element.getBoundingClientRect();
        let mapContainer: HTMLElement = this.element.closest('.earthview-container') as HTMLElement;
        if (!mapContainer) {
            mapContainer = document.body;
        }
        const containerRect = mapContainer.getBoundingClientRect();
        let top = mainPanelRect.top - containerRect.top - 38;
        let maxHeight = 330;
        const panelBottom = top + maxHeight + 38;
        if (panelBottom > containerRect.height) {
            const availableHeight = containerRect.height - top - 48;
            if (availableHeight > 100) {
                maxHeight = availableHeight;
            } else {
                const topSpace = mainPanelRect.top - containerRect.top - 10;
                if (topSpace > 200) {
                    top = topSpace - maxHeight - 10;
                } else {
                    maxHeight = Math.max(100, availableHeight);
                }
            }
        }
        if (top < 5) {
            top = 5;
        }
        this.featureListPanel = document.createElement("div");
        this.featureListPanel.style.cssText = `
        position: absolute;
        left: ${mainPanelRect.left - containerRect.left - 267}px;
        top: ${top}px;
        width: 260px;
        max-height: ${maxHeight}px;
        background: ${isDark ? "#1e1e1e" : "#ffffff"};
        border: 1px solid ${isDark ? "#333" : "#e0e0e0"};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;
        const header = document.createElement("div");
        header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2px 12px;  
        background: ${isDark ? "#2d2d2d" : "#f5f5f5"};
        border-bottom: 1px solid ${isDark ? "#333" : "#e0e0e0"};
        flex-shrink: 0;
        user-select: none;
    `;

        const title = document.createElement("span");
        title.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;`;
        title.textContent = `${layerName} - ${this.options.t.coordinateData || "coordinateData"}`;

        header.appendChild(title);

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
        closeBtn.onclick = () => this.hideFeatureListPanel();
        header.appendChild(closeBtn);

        this.featureListPanel.appendChild(header);

        const content = document.createElement("div");
        content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        min-height: 0;
    `;
        content.className = "earthview-popup-scroll";

        const features = this.options.onGetLayerFeatures ? this.options.onGetLayerFeatures(layerId) : [];

        if (features.length === 0) {
            const emptyDiv = document.createElement("div");
            emptyDiv.style.cssText = `
            padding: 16px;
            text-align: center;
            color: ${isDark ? "#888" : "#999"};
            font-size: 12px;
        `;
            emptyDiv.textContent = this.options.t.noDataAvailable || "noDataAvailable";
            content.appendChild(emptyDiv);
        } else {
            features.forEach((feature, index) => {
                const item = this.createFeatureItem(feature, index, layerId, isDark);
                content.appendChild(item);
            });
        }
        this.featureListPanel.appendChild(content);
        mapContainer.appendChild(this.featureListPanel);

        const closeOnOutsideClick = (e: MouseEvent) => {
            if (this.featureListPanel && !this.featureListPanel.contains(e.target as Node) &&
                !this.element.contains(e.target as Node)) {
                this.hideFeatureListPanel();
                document.removeEventListener("click", closeOnOutsideClick);
            }
        };
        setTimeout(() => {
            document.addEventListener("click", closeOnOutsideClick);
        }, 100);
    }

    private createFeatureItem(feature: LayerFeature, index: number, layerId: string, isDark: boolean): HTMLDivElement {
        const item = document.createElement("div");
        item.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
        cursor: pointer;
        transition: all 0.2s;
    `;

        item.onmouseenter = () => {
            item.style.background = isDark ? "#2a2a2a" : "#f0f0f0";
        };
        item.onmouseleave = () => {
            item.style.background = "transparent";
        };
        item.onclick = () => {
            this.showFeatureDetailPanel(feature, layerId);
        };

        const content = document.createElement("div");
        content.style.cssText = "flex: 1;";

        const nameText = document.createElement("div");
        nameText.style.cssText = `
        color: ${isDark ? "#fff" : "#333"};
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
    `;
        nameText.textContent = feature.name || `${this.getFeatureTypeLabel(feature.type)} ${index + 1}`;
        content.appendChild(nameText);

        const infoText = document.createElement("div");
        infoText.style.cssText = `
        color: ${isDark ? "#aaa" : "#666"};
        font-size: 10px;
        font-family: monospace;
    `;
        infoText.textContent = `${this.getFeatureTypeIcon(feature.type)} ${this.getFeatureTypeLabel(feature.type)}`;
        content.appendChild(infoText);

        item.appendChild(content);

        const detailBtn = document.createElement("button");
        detailBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        transition: all 0.2s;
        color: ${isDark ? "#00aaff" : "#0066cc"};
        margin-left: 8px;
    `;
        detailBtn.textContent = this.options.t.details || "details";
        detailBtn.onmouseenter = () => {
            detailBtn.style.background = isDark ? "#444" : "#e0e0e0";
        };
        detailBtn.onmouseleave = () => {
            detailBtn.style.background = "none";
        };
        detailBtn.onclick = (e) => {
            e.stopPropagation();
            this.showFeatureDetailPanel(feature, layerId);
        };
        item.appendChild(detailBtn);

        return item;
    }

    private getFeatureTypeIcon(type: "point" | "line" | "polygon"): string {
        switch (type) {
            case "point":
                return "📍";
            case "line":
                return "📏";
            case "polygon":
                return "🔲";
            default:
                return "📍";
        }
    }

    private getFeatureTypeLabel(type: "point" | "line" | "polygon"): string {
        switch (type) {
            case "point":
                return this.options.t.pointData || "pointData";
            case "line":
                return this.options.t.lineData || "lineData";
            case "polygon":
                return this.options.t.polygonData || "polygonData";
            default:
                return "";
        }
    }

    private showFeatureDetailPanel(feature: LayerFeature, layerId: string): void {
        this.hideFeatureDetailPanel();
        this.currentFeatureId = feature.id;
        const isDark = this.options.theme === "dark";
        const mainPanelRect = this.element.getBoundingClientRect();
        const featureListRect = this.featureListPanel?.getBoundingClientRect();
        let mapContainer: HTMLElement = this.element.closest('.earthview-container') as HTMLElement;
        if (!mapContainer) {
            mapContainer = document.body;
        }
        const containerRect = mapContainer.getBoundingClientRect();
        let left = mainPanelRect.left - containerRect.left - 560 + 4;
        if (featureListRect) {
            left = featureListRect.left - containerRect.left - 270 + 4;
        }
        if (left < 5) {
            left = 5;
        }
        let top = mainPanelRect.top - containerRect.top - 38;
        let maxHeight = 330;
        const panelBottom = top + maxHeight + 38;
        if (panelBottom > containerRect.height) {
            const availableHeight = containerRect.height - top - 48;
            if (availableHeight > 100) {
                maxHeight = availableHeight;
            } else {
                const topSpace = mainPanelRect.top - containerRect.top - 10;
                if (topSpace > 200) {
                    top = topSpace - maxHeight - 10;
                } else {
                    maxHeight = Math.max(100, availableHeight);
                }
            }
        }
        if (top < 5) {
            top = 5;
        }
        this.featureDetailPanel = document.createElement("div");
        this.featureDetailPanel.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top}px;
        width: 260px;
        max-height: ${maxHeight}px;
        background: ${isDark ? "#1e1e1e" : "#ffffff"};
        border: 1px solid ${isDark ? "#333" : "#e0e0e0"};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1002;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;

        const detailContent = document.createElement("div");
        detailContent.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 100%;
        max-height: ${maxHeight}px;
    `;

        const header = document.createElement("div");
        header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2px 12px;
        background: ${isDark ? "#2d2d2d" : "#f5f5f5"};
        border-bottom: 1px solid ${isDark ? "#444" : "#ddd"};
        flex-shrink: 0;
        user-select: none;
    `;

        const title = document.createElement("span");
        title.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;`;
        title.textContent = this.options.t.details || "details";

        header.appendChild(title);

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
        closeBtn.onclick = () => this.hideFeatureDetailPanel();
        header.appendChild(closeBtn);

        detailContent.appendChild(header);

        const body = document.createElement("div");
        body.style.cssText = `padding: 10px 12px; overflow-y: auto; flex: 1; min-height: 0;`;
        body.className = "earthview-popup-scroll";

        let bodyHtml = `
        <div style="margin-bottom: 12px;">
            <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.coordinateData || "Coordinate Data"}</div>
            <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 14px; font-weight: 500;">${feature.name || feature.id}</div>
        </div>
        <div style="margin-bottom: 12px;">
            <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.featureType || "Feature Type"}</div>
            <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px;">${this.getFeatureTypeLabel(feature.type)}</div>
        </div>
    `;

        if (feature.type === "point" && feature.coordinates) {
            bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.longitude || "longitude"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-family: monospace;">${feature.coordinates.longitude?.toFixed(8) || feature.coordinates[0]?.toFixed(8) || "-"}</div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.latitude || "latitude"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-family: monospace;">${feature.coordinates.latitude?.toFixed(8) || feature.coordinates[1]?.toFixed(8) || "-"}</div>
            </div>
        `;
        } else if (feature.type === "line" && feature.coordinates) {
            const points = feature.coordinates.points || feature.coordinates;
            bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.pointsCount || "Points Count"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px;">${points?.length || 0} ${this.options.t.points || "Points"}</div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.startPoint || "Start Point"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 11px; font-family: monospace;">${points?.[0]?.longitude?.toFixed(6) || points?.[0]?.[0]?.toFixed(6) || "-"}, ${points?.[0]?.latitude?.toFixed(6) || points?.[0]?.[1]?.toFixed(6) || "-"}</div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.endPoint || "End Point"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 11px; font-family: monospace;">${points?.[points.length - 1]?.longitude?.toFixed(6) || points?.[points.length - 1]?.[0]?.toFixed(6) || "-"}, ${points?.[points.length - 1]?.latitude?.toFixed(6) || points?.[points.length - 1]?.[1]?.toFixed(6) || "-"}</div>
            </div>
        `;
        } else if (feature.type === "polygon" && feature.coordinates) {
            const points = feature.coordinates.points || feature.coordinates;
            bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.vertexCount || "Vertex Count"}</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px;">${points?.length || 0} ${this.options.t.points || "Points"}</div>
            </div>
        `;
        }

        if (feature.properties) {
            bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.properties || "Properties"}</div>
                <div style="color: ${isDark ? "#ddd" : "#555"}; font-size: 11px; word-break: break-word;">${JSON.stringify(feature.properties, null, 2)}</div>
            </div>
        `;
        }
        if (feature.timestamp) {
            bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">${this.options.t.createdTime || "Created Time"}</div>
                <div style="color: ${isDark ? "#ddd" : "#555"}; font-size: 11px;">${new Date(feature.timestamp).toLocaleString()}</div>
            </div>
        `;
        }
        body.innerHTML = bodyHtml;
        detailContent.appendChild(body);

        const footer = document.createElement("div");
        footer.style.cssText = `
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid ${isDark ? "#444" : "#ddd"};
        background: ${isDark ? "#252525" : "#fafafa"};
        flex-shrink: 0;
    `;

        const locateBtn = document.createElement("button");
        locateBtn.style.cssText = `
        flex: 1;
        background: #00aaff;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        color: white;
        font-size: 12px;
        transition: all 0.2s;
    `;
        locateBtn.textContent = this.options.t.locateOnMap || "Locate Map";
        locateBtn.onmouseenter = () => { locateBtn.style.background = "#0088cc"; };
        locateBtn.onmouseleave = () => { locateBtn.style.background = "#00aaff"; };
        locateBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.options.onLocateFeature) {
                this.options.onLocateFeature(layerId, feature.id);
            }
        };

        const copyBtn = document.createElement("button");
        copyBtn.style.cssText = `
        flex: 1;
        background: ${isDark ? "#444" : "#e0e0e0"};
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        color: ${isDark ? "#fff" : "#333"};
        font-size: 12px;
        transition: all 0.2s;
    `;
        copyBtn.textContent = this.options.t.copyCoordinates || "Copy Coordinates";
        copyBtn.onmouseenter = () => { copyBtn.style.background = isDark ? "#555" : "#d0d0d0"; };
        copyBtn.onmouseleave = () => { copyBtn.style.background = isDark ? "#444" : "#e0e0e0"; };
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.options.onCopyFeatureCoordinates) {
                this.options.onCopyFeatureCoordinates(layerId, feature.id);
            } else {
                let text = "";
                if (feature.type === "point" && feature.coordinates) {
                    const lng = feature.coordinates.longitude ?? feature.coordinates[0];
                    const lat = feature.coordinates.latitude ?? feature.coordinates[1];
                    text = `${lng?.toFixed(8)}, ${lat?.toFixed(8)}`;
                } else if (feature.coordinates) {
                    const points = feature.coordinates.points || feature.coordinates;
                    text = points.map((p: any) => `${(p.longitude ?? p[0]).toFixed(8)}, ${(p.latitude ?? p[1]).toFixed(8)}`).join("\n");
                }
                navigator.clipboard.writeText(text);
                this.showToast(this.options.t.coordinatesCopied || "Coordinates Copied");
            }
        };

        footer.appendChild(locateBtn);
        footer.appendChild(copyBtn);
        detailContent.appendChild(footer);
        this.featureDetailPanel.appendChild(detailContent);
        mapContainer.appendChild(this.featureDetailPanel);

        const closeOnOutsideClick = (e: MouseEvent) => {
            if (this.featureDetailPanel && !this.featureDetailPanel.contains(e.target as Node) &&
                this.featureListPanel && !this.featureListPanel.contains(e.target as Node) &&
                !this.element.contains(e.target as Node)) {
                this.hideFeatureDetailPanel();
                document.removeEventListener("click", closeOnOutsideClick);
            }
        };
        setTimeout(() => {
            document.addEventListener("click", closeOnOutsideClick);
        }, 100);
    }

    private hideFeatureListPanel(): void {
        if (this.featureListPanel) {
            this.featureListPanel.remove();
            this.featureListPanel = null;
        }
        this.currentFeatureListLayerId = null;
        this.hideFeatureDetailPanel();
    }

    private hideFeatureDetailPanel(): void {
        if (this.featureDetailPanel) {
            this.featureDetailPanel.remove();
            this.featureDetailPanel = null;
        }
        this.currentFeatureId = null;
    }

    private showToast(message: string): void {
        const toast = document.createElement("div");
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
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
        this.hideFeatureListPanel();
        this.hideFeatureDetailPanel();
        this.element.remove();
    }
}