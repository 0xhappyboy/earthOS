import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, PolygonData } from "../../types";
import { arrayToRgba } from "../../utils";

export class PolygonLayer extends BaseLayer {
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;

    constructor(
        id: string,
        name: string,
        options?: {
            defaultFillColor?: number[];
            defaultOutlineColor?: number[];
            defaultOutlineWidth?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.POLYGON, options);
        this.defaultFillColor = options?.defaultFillColor || [255, 0, 0, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [255, 0, 0, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 2;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.POLYGON },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public addPolygon(data: PolygonData): void {
        const rings = [data.points.map(([lng, lat]) => fromLonLat([lng, lat]))];
        const polygon = new Polygon(rings);
        const feature = new Feature({
            geometry: polygon,
            id: data.id,
            title: data.title,
        });

        feature.setStyle(
            new Style({
                fill: new Fill({ color: arrayToRgba(data.fillColor || this.defaultFillColor) }),
                stroke: new Stroke({
                    color: arrayToRgba(data.outlineColor || this.defaultOutlineColor),
                    width: data.outlineWidth || this.defaultOutlineWidth,
                }),
            })
        );

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removePolygon(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
    }

    public updateData(data: { polygons?: PolygonData[] }): void {
        if (data.polygons) {
            this.clear();
            data.polygons.forEach((polygon) => this.addPolygon(polygon));
        }
    }
}