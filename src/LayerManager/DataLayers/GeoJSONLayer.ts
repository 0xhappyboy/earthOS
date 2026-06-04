import GeoJSONLayerLib from "@arcgis/core/layers/GeoJSONLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map";

export interface GeoJSONLayerConfig extends LayerConfig {
    url?: string;
    geojson?: any;
    renderer?: any;
    popupTemplate?: any;
}

export class GeoJSONLayer extends BaseLayer {
    private featureLayer: FeatureLayer | null = null;
    private url: string | null = null;
    private geojson: any = null;
    private renderer: any = null;
    private popupTemplate: any = null;
    private map: Map | null = null;
    private isDestroying: boolean = false;

    constructor(config: GeoJSONLayerConfig) {
        super(config);
        this.url = config.url ?? null;
        this.geojson = config.geojson ?? null;
        this.renderer = config.renderer ?? {
            type: "simple",
            symbol: {
                type: "simple-marker",
                size: 8,
                color: [255, 0, 0, 0.8],
                outline: { color: [255, 255, 255], width: 1 }
            }
        };
        this.popupTemplate = config.popupTemplate;
    }

    public createLayer(): GraphicsLayer {
        super.createLayer();
        return this.graphicsLayer!;
    }

    public setMap(map: Map): void {
        this.map = map;
        if (this.url || this.geojson) {
            this.loadGeoJSON();
        }
    }

    private async loadGeoJSON(): Promise<void> {
        if (!this.map) return;

        if (this.featureLayer) {
            try {
                this.map.remove(this.featureLayer);
                this.featureLayer.destroy();
            } catch (e) { }
            this.featureLayer = null;
        }

        try {
            let data = this.geojson;
            if (this.url && !data) {
                const response = await fetch(this.url);
                data = await response.json();
            }
            if (!data) return;
            const features = this.convertGeoJSONToGraphics(data);
            if (features.length === 0) {
                console.warn("No valid features found in GeoJSON");
                return;
            }
            this.featureLayer = new FeatureLayer({
                source: features,
                objectIdField: "objectid",
                fields: [
                    { name: "objectid", type: "oid" },
                    { name: "name", type: "string" }
                ],
                renderer: this.renderer,
                popupTemplate: this.popupTemplate,
                opacity: this.opacity,
                visible: this.visible
            } as any);
            if (this.map && this.featureLayer) {
                this.map.add(this.featureLayer);
                console.log(`GeoJSON loaded with ${features.length} features`);
            }
        } catch (error) {
            console.error("Failed to load GeoJSON:", error);
        }
    }

    private convertGeoJSONToGraphics(geojson: any): Graphic[] {
        const graphics: Graphic[] = [];

        if (!geojson || !geojson.features) {
            console.warn("Invalid GeoJSON format: missing features array");
            return graphics;
        }

        geojson.features.forEach((feature: any, index: number) => {
            const geometry = feature.geometry;
            if (!geometry) return;

            const coordinates = geometry.coordinates;
            let point: Point | null = null;

            if (geometry.type === "Point") {
                point = new Point({
                    longitude: coordinates[0],
                    latitude: coordinates[1]
                });
            } else if (geometry.type === "MultiPoint") {
                point = new Point({
                    longitude: coordinates[0][0],
                    latitude: coordinates[0][1]
                });
            }

            if (point) {
                const name = feature.properties?.name || feature.properties?.title || `Feature ${index}`;
                graphics.push(new Graphic({
                    geometry: point,
                    attributes: {
                        objectid: index,
                        name: name,
                        ...feature.properties
                    }
                }));
            }
        });

        return graphics;
    }

    public loadFromUrl(url: string): void {
        this.url = url;
        if (this.map) {
            this.loadGeoJSON();
        }
    }

    public loadFromGeoJSON(geojson: any): void {
        this.geojson = geojson;
        if (this.map) {
            this.loadGeoJSON();
        }
    }

    public updateData(data: any): void {
        if (data.url) {
            this.loadFromUrl(data.url);
        } else if (data.geojson) {
            this.loadFromGeoJSON(data.geojson);
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
                    try { this.map.remove(this.featureLayer); } catch (e) { }
                }
                try { this.featureLayer.destroy(); } catch (e) { }
                this.featureLayer = null;
            }
        } catch (error) { }

        super.destroy();
        this.isDestroying = false;
    }
}