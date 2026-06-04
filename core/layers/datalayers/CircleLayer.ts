import Feature from "ol/Feature";
import Circle from "ol/geom/Circle";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, CircleData } from "../../types";
import { arrayToRgba } from "../../utils";

export class CircleLayer extends BaseLayer {
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
        super(id, name, LayerTypeEnum.CIRCLE, options);
        this.defaultFillColor = options?.defaultFillColor || [0, 255, 0, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [0, 255, 0, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 2;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.CIRCLE },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public addCircle(data: CircleData): void {
        const center = fromLonLat(data.center);
        const circle = new Circle(center, data.radius);
        const feature = new Feature({
            geometry: circle,
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

    public removeCircle(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
    }

    public updateData(data: { circles?: CircleData[] }): void {
        if (data.circles) {
            this.clear();
            data.circles.forEach((circle) => this.addCircle(circle));
        }
    }
}