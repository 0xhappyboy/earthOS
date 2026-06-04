import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map";

export interface ClusterData {
    id: string;
    longitude: number;
    latitude: number;
    title?: string;
    popupContent?: string;
}

export interface ClusterLayerConfig extends LayerConfig {
    data?: ClusterData[];
    clusterRadius?: number;
    clusterMinSize?: number;
    clusterMaxSize?: number;
    pointColor?: number[];
    clusterColor?: number[];
}

/**
 * Cluster Layer - For clustering large number of points
 */
export class ClusterLayer extends BaseLayer {
    private featureLayer: FeatureLayer | null = null;
    private data: ClusterData[] = [];
    private clusterRadius: number;
    private clusterMinSize: number;
    private clusterMaxSize: number;
    private pointColor: number[];
    private clusterColor: number[];
    private map: Map | null = null;
    private isDestroying: boolean = false;

    constructor(config: ClusterLayerConfig) {
        super(config);
        this.clusterRadius = config.clusterRadius ?? 60;
        this.clusterMinSize = config.clusterMinSize ?? 20;
        this.clusterMaxSize = config.clusterMaxSize ?? 60;
        this.pointColor = config.pointColor ?? [255, 0, 0, 0.8];
        this.clusterColor = config.clusterColor ?? [0, 112, 255, 0.8];
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
            } catch (e) { }
            this.featureLayer = null;
        }

        const features = this.data.map((item, index) => {
            return new Graphic({
                geometry: new Point({
                    longitude: item.longitude,
                    latitude: item.latitude
                }),
                attributes: {
                    objectid: index,
                    id: item.id,
                    title: item.title || "",
                    popupContent: item.popupContent || ""
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
                    { name: "popupContent", type: "string" }
                ],
                featureReduction: {
                    type: "cluster",
                    clusterRadius: this.clusterRadius,
                    clusterMinSize: this.clusterMinSize,
                    clusterMaxSize: this.clusterMaxSize,
                    clusterSymbol: {
                        type: "simple-marker",
                        color: this.clusterColor,
                        size: "${cluster_count}",
                        outline: { color: [255, 255, 255], width: 2 }
                    } as any
                } as any,
                renderer: {
                    type: "simple",
                    symbol: {
                        type: "simple-marker",
                        color: this.pointColor,
                        size: 8,
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
            console.error("Failed to create cluster layer:", error);
        }
    }

    public updateData(data: ClusterData[]): void {
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