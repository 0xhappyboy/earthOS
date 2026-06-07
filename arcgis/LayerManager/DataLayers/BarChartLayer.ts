import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map";

export interface BarChartData {
    id: string;
    longitude: number;
    latitude: number;
    value: number;
    title?: string;
    color?: number[];
}

export interface BarChartLayerConfig extends LayerConfig {
    data?: BarChartData[];
    maxHeight?: number;
    defaultColor?: number[];
    unit?: string;
}

export class BarChartLayer extends BaseLayer {
    private featureLayer: FeatureLayer | null = null;
    private data: BarChartData[] = [];
    private maxHeight: number;
    private defaultColor: number[];
    private unit: string;
    private maxValue: number = 1;
    private map: Map | null = null;
    private isDestroying: boolean = false;

    constructor(config: BarChartLayerConfig) {
        super(config);
        this.maxHeight = config.maxHeight ?? 100;
        this.defaultColor = config.defaultColor ?? [255, 0, 0, 0.8];
        this.unit = config.unit ?? "";
        if (config.data) {
            this.data = [...config.data];
            this.calcMaxValue();
        }
    }

    private calcMaxValue(): void {
        this.maxValue = 1;
        for (const item of this.data) {
            if (item.value > this.maxValue) {
                this.maxValue = item.value;
            }
        }
    }

    private getHeight(value: number): number {
        return (value / this.maxValue) * this.maxHeight;
    }

    private getColor(value: number): number[] {
        const ratio = value / this.maxValue;
        if (ratio < 0.2) return [0, 255, 0, 0.8];
        if (ratio < 0.4) return [100, 255, 0, 0.8];
        if (ratio < 0.6) return [255, 255, 0, 0.8];
        if (ratio < 0.8) return [255, 150, 0, 0.8];
        return [255, 0, 0, 0.8];
    }

    public createLayer(): GraphicsLayer {
        super.createLayer();
        return this.graphicsLayer!;
    }

    public setMap(map: Map): void {
        this.map = map;
        if (this.data.length > 0) {
            this.createFeatureLayer();
        }
    }

    private createFeatureLayer(): void {
        if (!this.map) return;

        if (this.featureLayer) {
            try {
                this.map.remove(this.featureLayer);
                this.featureLayer.destroy();
            } catch (e) { }
            this.featureLayer = null;
        }

        const features = this.data.map((item, index) => {
            const height = this.getHeight(item.value);
            const color = item.color ?? this.getColor(item.value);

            return new Graphic({
                geometry: new Point({
                    longitude: item.longitude,
                    latitude: item.latitude
                }),
                attributes: {
                    objectid: index,
                    id: item.id,
                    title: item.title || "",
                    value: item.value,
                    height: height,
                    color: color,
                    unit: this.unit
                }
            });
        });
        try {
            this.featureLayer = new FeatureLayer({
                source: features,
                objectIdField: "objectid",
                fields: [
                    { name: "objectid", type: "oid" },
                    { name: "id", type: "string" },
                    { name: "title", type: "string" },
                    { name: "value", type: "double" },
                    { name: "height", type: "double" },
                    { name: "color", type: "string" },
                    { name: "unit", type: "string" }
                ],
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "simple-marker",
                        color: [255, 0, 0, 0.8],
                        size: 12,
                        outline: { color: [255, 255, 255], width: 1 }
                    }
                } as any,
                opacity: this.opacity,
                visible: this.visible
            } as any);

            if (this.map && this.featureLayer) {
                this.map.add(this.featureLayer);
            }
        } catch (error) {
            console.error("Failed to create barchart layer:", error);
        }
    }

    public updateData(data: BarChartData[]): void {
        this.data = data;
        this.calcMaxValue();
        if (this.map) {
            this.createFeatureLayer();
        }
    }

    public setVisible(visible: boolean): void {
        super.setVisible(visible);
        if (this.featureLayer) {
            this.featureLayer.visible = visible;
        }
    }

    public setOpacity(opacity: number): void {
        super.setOpacity(opacity);
        if (this.featureLayer) {
            this.featureLayer.opacity = opacity;
        }
    }

    public destroy(): void {
        if (this.isDestroying) return;
        this.isDestroying = true;

        try {
            if (this.featureLayer) {
                if (this.map) {
                    try {
                        this.map.remove(this.featureLayer);
                    } catch (e) { }
                }
                try {
                    this.featureLayer.destroy();
                } catch (e) { }
                this.featureLayer = null;
            }
        } catch (error) { }

        super.destroy();
        this.isDestroying = false;
    }
}