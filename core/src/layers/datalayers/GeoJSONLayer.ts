import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { Feature } from "ol";

export class GeoJSONLayer extends BaseLayer {
    private geoJsonFormat: GeoJSON;

    constructor(
        id: string,
        name: string,
        options?: { visible?: boolean; opacity?: number; zIndex?: number }
    ) {
        super(id, name, LayerTypeEnum.GEOJSON, {
            ...options,
            zIndex: options?.zIndex ?? 15,
        });
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.GEOJSON },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
        this.geoJsonFormat = new GeoJSON();
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public loadGeoJSON(geojson: any): void {
        this.clear();
        const features = this.geoJsonFormat.readFeatures(geojson, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        });
        this.source?.addFeatures(features);
    }

    public async loadFromUrl(url: string): Promise<void> {
        const response = await fetch(url);
        const geojson = await response.json();
        this.loadGeoJSON(geojson);
    }

    public updateData(data: { url?: string; geojson?: any }): void {
        if (data.url) {
            this.loadFromUrl(data.url);
        } else if (data.geojson) {
            this.loadGeoJSON(data.geojson);
        }
    }

    public getAllFeatures(): Feature[] {
        const features: Feature[] = [];
        this.source?.forEachFeature((feature: Feature) => {
            features.push(feature);
        });
        return features;
    }

    public getLayer(): VectorLayer<VectorSource> | null {
        return this.layer;
    }
}