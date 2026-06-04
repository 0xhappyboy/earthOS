import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";

export class CustomTileLayer extends BaseLayer {
    private tileLayer: TileLayer<XYZ> | null = null;
    private urlTemplate: string;
    private subDomains: string[];
    private attribution: string;
    private minZoom: number;
    private maxZoom: number;

    constructor(
        id: string,
        name: string,
        options: {
            urlTemplate: string;
            subDomains?: string[];
            attribution?: string;
            minZoom?: number;
            maxZoom?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.TILE, options);
        this.urlTemplate = options.urlTemplate;
        this.subDomains = options.subDomains || ["a", "b", "c"];
        this.attribution = options.attribution || "";
        this.minZoom = options.minZoom || 0;
        this.maxZoom = options.maxZoom || 19;
    }

    public createLayer(map: any): TileLayer<XYZ> {
        let url = this.urlTemplate;
        const sub = this.subDomains[Math.floor(Math.random() * this.subDomains.length)];
        url = url.replace(/\{s\}/g, sub);

        this.tileLayer = new TileLayer({
            source: new XYZ({
                url,
                attributions: this.attribution,
                minZoom: this.minZoom,
                maxZoom: this.maxZoom,
            }),
            properties: { id: this.id, name: this.name, type: LayerTypeEnum.TILE },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });

        map.addLayer(this.tileLayer);
        return this.tileLayer;
    }

    public updateData(data: { urlTemplate: string }): void {
        if (data.urlTemplate) {
            this.urlTemplate = data.urlTemplate;
            if (this.tileLayer) {
                const source = this.tileLayer.getSource();
                if (source) {
                    source.setUrl(this.urlTemplate);
                }
            }
        }
    }

    public getLayer(): TileLayer<XYZ> | null {
        return this.tileLayer;
    }

    public destroy(): void {
        if (this.tileLayer) {
            const map = typeof (this.tileLayer as any).getMap === 'function'
                ? (this.tileLayer as any).getMap()
                : null;
            if (map && typeof map.removeLayer === 'function') {
                map.removeLayer(this.tileLayer);
            }
            if (typeof this.tileLayer.dispose === 'function') {
                this.tileLayer.dispose();
            }
            this.tileLayer = null;
        }
        super.destroy();
    }
}