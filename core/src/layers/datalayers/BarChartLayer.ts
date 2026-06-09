import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, BarChartData } from "../../types";
import { arrayToRgba } from "../../utils";
import CircleStyle from "ol/style/Circle";

export class BarChartLayer extends BaseLayer {
    private features: Map<string, Feature> = new Map();
    private maxValue: number = 1;
    private maxHeight: number;
    private defaultColor: number[];
    private unit: string;

    constructor(
        id: string,
        name: string,
        options?: {
            maxHeight?: number;
            defaultColor?: number[];
            unit?: string;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.BARCHART, {
            ...options,
            zIndex: options?.zIndex ?? 15,
        });
        this.maxHeight = options?.maxHeight || 100;
        this.defaultColor = options?.defaultColor || [255, 0, 0, 0.8];
        this.unit = options?.unit || "";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.BARCHART },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    private calcMaxValue(data: BarChartData[]): void {
        this.maxValue = 1;
        for (const item of data) {
            if (item.value > this.maxValue) {
                this.maxValue = item.value;
            }
        }
    }

    private getHeight(value: number): number {
        return (value / this.maxValue) * this.maxHeight;
    }

    private getColor(value: number): number[] {
        const ratio = value / this.maxValue;
        if (ratio < 0.2) return [0, 255, 0, 0.8];
        if (ratio < 0.4) return [100, 255, 0, 0.8];
        if (ratio < 0.6) return [255, 255, 0, 0.8];
        if (ratio < 0.8) return [255, 150, 0, 0.8];
        return [255, 0, 0, 0.8];
    }

    public setData(data: BarChartData[]): void {
        this.calcMaxValue(data);
        this.clear();
        data.forEach((item) => {
            const height = this.getHeight(item.value);
            const color = item.color || this.getColor(item.value);
            const feature = new Feature({
                geometry: new Point(fromLonLat([item.longitude, item.latitude])),
                id: item.id,
                title: item.title,
                value: item.value,
                height,
                color: arrayToRgba(color),
            });
            feature.setStyle(
                new Style({
                    fill: new Fill({ color: arrayToRgba(color) }),
                    image: new CircleStyle({
                        radius: Math.sqrt(height) / 2,
                        fill: new Fill({ color: arrayToRgba(color) }),
                    }),
                })
            );
            this.source?.addFeature(feature);
            this.features.set(item.id, feature);
        });
    }

    public getData(): BarChartData[] {
        const result: BarChartData[] = [];
        this.features.forEach((feature, id) => {
            const props = feature.getProperties();
            result.push({
                id: id,
                longitude: props.geometry?.getCoordinates()[0],
                latitude: props.geometry?.getCoordinates()[1],
                value: props.value,
                title: props.title
            });
        });
        return result;
    }

    public updateData(data: BarChartData[]): void {
        this.setData(data);
    }
}