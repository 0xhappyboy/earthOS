import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import Heatmap from "ol/layer/Heatmap";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, HeatmapData } from "../../types";

export class HeatmapLayer extends BaseLayer {
    private heatmapLayer: Heatmap | null = null;
    private data: HeatmapData[] = [];

    constructor(
        id: string,
        name: string,
        options?: {
            blur?: number;
            radius?: number;
            colorStops?: [number, string][];
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.HEATMAP, options);
        this.source = new VectorSource();
        this.heatmapLayer = new Heatmap({
            source: this.source,
            blur: options?.blur || 15,
            radius: options?.radius || 8,
            weight: "weight",
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });

        if (options?.colorStops) {
            (this.heatmapLayer as any).setGradient(options.colorStops);
        }
    }

    public createLayer(map: any): Heatmap {
        if (!this.heatmapLayer) {
            throw new Error("HeatmapLayer not initialized");
        }
        map.addLayer(this.heatmapLayer);
        return this.heatmapLayer;
    }

    public setData(data: HeatmapData[]): void {
        this.data = data;
        this.clear();

        if (!this.source) return;

        data.forEach((item) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([item.longitude, item.latitude])),
                weight: item.value || 1,
            });
            this.source?.addFeature(feature);
        });
    }

    public updateData(data: HeatmapData[]): void {
        this.setData(data);
    }

    public getLayer(): Heatmap | null {
        return this.heatmapLayer;
    }
}