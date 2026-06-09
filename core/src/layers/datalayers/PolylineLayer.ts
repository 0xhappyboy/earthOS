import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, PolylineData } from "../../types";
import { arrayToRgba } from "../../utils";

export class PolylineLayer extends BaseLayer {
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultWidth: number;

    constructor(
        id: string,
        name: string,
        options?: { defaultColor?: number[]; defaultWidth?: number; visible?: boolean; opacity?: number; zIndex?: number }
    ) {
        super(id, name, LayerTypeEnum.POLYLINE, {
            ...options,
            zIndex: options?.zIndex ?? 10,
        });
        this.defaultColor = options?.defaultColor || [0, 0, 255, 1];
        this.defaultWidth = options?.defaultWidth || 3;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.POLYLINE },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public addPolyline(data: PolylineData): void {
        const points = data.points.map(([lng, lat]) => fromLonLat([lng, lat]));
        const line = new LineString(points);
        const feature = new Feature({
            geometry: line,
            id: data.id,
            title: data.title,
        });

        feature.setStyle(
            new Style({
                stroke: new Stroke({
                    color: arrayToRgba(data.color || this.defaultColor),
                    width: data.width || this.defaultWidth,
                }),
            })
        );

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removePolyline(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
    }

    public updateData(data: { polylines?: PolylineData[] }): void {
        if (data.polylines) {
            this.clear();
            data.polylines.forEach((polyline) => this.addPolyline(polyline));
        }
    }

    public getAllPolylines(): PolylineData[] {
        const result: PolylineData[] = [];
        this.features.forEach((feature, id) => {
            result.push(feature.getProperties() as PolylineData);
        });
        return result;
    }

    public getPolyline(id: string): PolylineData | undefined {
        const feature = this.features.get(id);
        if (feature) {
            return feature.getProperties() as PolylineData;
        }
        return undefined;
    }
}