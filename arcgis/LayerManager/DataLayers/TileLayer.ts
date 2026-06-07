import WebTileLayer from "@arcgis/core/layers/WebTileLayer";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Map from "@arcgis/core/Map";

export interface TileLayerConfig extends LayerConfig {
    urlTemplate: string;
    subDomains?: string[];
    copyright?: string;
    minZoom?: number;
    maxZoom?: number;
}

/**
 * Tile Layer - For loading custom tile maps
 */
export class TileLayer extends BaseLayer {
    private tileLayer: WebTileLayer | null = null;
    private urlTemplate: string;
    private subDomains: string[];
    private copyright: string;
    private minZoom: number;
    private maxZoom: number;
    private map: Map | null = null;
    private isDestroying: boolean = false;

    constructor(config: TileLayerConfig) {
        super(config);
        this.urlTemplate = config.urlTemplate;
        this.subDomains = config.subDomains ?? ["a", "b", "c"];
        this.copyright = config.copyright ?? "";
        this.minZoom = config.minZoom ?? 0;
        this.maxZoom = config.maxZoom ?? 19;
    }

    public createLayer(): GraphicsLayer {
        super.createLayer();
        return this.graphicsLayer!;
    }

    public setMap(map: Map): void {
        this.map = map;
        this.createTileLayer();
    }

    private zoomToScale(zoom: number): number {
        return 591657527.591555 / Math.pow(2, zoom);
    }

    private createTileLayer(): void {
        if (!this.map) return;

        if (this.tileLayer) {
            try {
                this.map.remove(this.tileLayer);
                this.tileLayer.destroy();
            } catch (e) { }
            this.tileLayer = null;
        }

        const urlTemplate = this.urlTemplate.replace(/\{s\}/g, () => {
            const sub = this.subDomains[Math.floor(Math.random() * this.subDomains.length)];
            return sub;
        });

        this.tileLayer = new WebTileLayer({
            urlTemplate: urlTemplate,
            copyright: this.copyright,
            minScale: this.zoomToScale(this.maxZoom),
            maxScale: this.zoomToScale(this.minZoom),
            visible: this.visible,
            opacity: this.opacity
        });

        if (this.map && this.tileLayer) {
            this.map.add(this.tileLayer);
        }
    }

    public updateData(data: any): void {
        if (data.urlTemplate) {
            this.urlTemplate = data.urlTemplate;
            if (this.map) {
                this.createTileLayer();
            }
        }
    }

    public setVisible(visible: boolean): void {
        super.setVisible(visible);
        if (this.tileLayer) {
            this.tileLayer.visible = visible;
        }
    }

    public setOpacity(opacity: number): void {
        super.setOpacity(opacity);
        if (this.tileLayer) {
            this.tileLayer.opacity = opacity;
        }
    }

    public destroy(): void {
        if (this.isDestroying) return;
        this.isDestroying = true;

        try {
            if (this.tileLayer) {
                if (this.map) {
                    try {
                        this.map.remove(this.tileLayer);
                    } catch (e) { }
                }
                try {
                    this.tileLayer.destroy();
                } catch (e) { }
                this.tileLayer = null;
            }
        } catch (error) { }

        super.destroy();
        this.isDestroying = false;
    }
}