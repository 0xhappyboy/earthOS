import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map";

export interface HeatmapData {
    longitude: number;
    latitude: number;
    value?: number;
}

export interface HeatmapLayerConfig extends LayerConfig {
    data?: HeatmapData[];
    colorStops?: { color: number[]; ratio: number }[];
    blurRadius?: number;
    maxPixelIntensity?: number;
    minPixelIntensity?: number;
}

/**
 * Heatmap Layer - For visualizing point density
 * 注意：FeatureLayer 需要直接添加到 Map，不能添加到 GraphicsLayer
 */
export class HeatmapLayer extends BaseLayer {
    private featureLayer: FeatureLayer | null = null;
    private data: HeatmapData[] = [];
    private colorStops: { color: number[]; ratio: number }[];
    private blurRadius: number;
    private maxPixelIntensity: number;
    private minPixelIntensity: number;
    private map: Map | null = null;
    private isDestroying: boolean = false;

    constructor(config: HeatmapLayerConfig) {
        super(config);
        this.colorStops = config.colorStops ?? [
            { color: [0, 0, 255, 0.6], ratio: 0 },
            { color: [0, 255, 255, 0.7], ratio: 0.3 },
            { color: [0, 255, 0, 0.8], ratio: 0.5 },
            { color: [255, 255, 0, 0.9], ratio: 0.7 },
            { color: [255, 0, 0, 1], ratio: 1 }
        ];
        this.blurRadius = config.blurRadius ?? 15;
        this.maxPixelIntensity = config.maxPixelIntensity ?? 100;
        this.minPixelIntensity = config.minPixelIntensity ?? 0;
        if (config.data) {
            this.data = [...config.data];
        }
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
            } catch (e) {
            }
            this.featureLayer = null;
        }

        const features = this.data.map((item, index) => {
            const value = item.value ?? 1;
            return new Graphic({
                geometry: new Point({
                    longitude: item.longitude,
                    latitude: item.latitude
                }),
                attributes: {
                    id: index,
                    value: value
                }
            });
        });

        try {
            this.featureLayer = new FeatureLayer({
                source: features,
                objectIdField: "id",
                fields: [
                    { name: "id", type: "oid" },
                    { name: "value", type: "integer" }
                ],
                renderer: {
                    type: "heatmap",
                    field: "value",
                    colorStops: this.colorStops.map(stop => ({
                        color: stop.color,
                        ratio: stop.ratio
                    })),
                    blurRadius: this.blurRadius,
                    maxPixelIntensity: this.maxPixelIntensity,
                    minPixelIntensity: this.minPixelIntensity
                } as any,
                opacity: this.opacity,
                visible: this.visible
            } as any);

            if (this.map && this.featureLayer) {
                this.map.add(this.featureLayer);
            }
        } catch (error) {
            console.error("Failed to create heatmap layer:", error);
        }
    }

    public updateData(data: HeatmapData[]): void {
        this.data = data;
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
                    } catch (e) {
                    }
                }
                try {
                    this.featureLayer.destroy();
                } catch (e) {
                    console.warn("Error destroying feature layer:", e);
                }
                this.featureLayer = null;
            }
        } catch (error) {
            console.warn("Error in heatmap destroy:", error);
        }

        super.destroy();
        this.isDestroying = false;
    }
}