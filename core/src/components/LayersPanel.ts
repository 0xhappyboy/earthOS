import { Icons } from "../icons";
import { LayerInfo, Theme } from "./types";
import { Translations } from "../i18n";

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
            default:
                return layer.name;
        }
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

        for (const layer of this.options.layerList) {
            const row = document.createElement("div");
            row.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 12px;
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
            visibilityBtn.onclick = () => this.options.onToggleVisibility(layer.id);
            leftDiv.appendChild(visibilityBtn);
            const nameSpan = document.createElement("span");
            nameSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
            nameSpan.textContent = this.getLayerDisplayName(layer);
            leftDiv.appendChild(nameSpan);
            row.appendChild(leftDiv);
            if (!this.isSystemLayer(layer.id)) {
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
                deleteBtn.onclick = () => this.options.onRemoveLayer(layer.id);
                row.appendChild(deleteBtn);
            }

            this.element.appendChild(row);
        }
    }

    public updateData(layerList: LayerInfo[]): void {
        this.options.layerList = layerList;
        this.render();
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}