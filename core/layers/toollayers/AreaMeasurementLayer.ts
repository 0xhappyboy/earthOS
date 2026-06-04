import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Draw from "ol/interaction/Draw";
import { getArea } from "ol/sphere";
import { toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, MeasurementPoint, AreaMeasurementData } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export class AreaMeasurementLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private measurements: Map<string, AreaMeasurementData> = new Map();
    private onCompleteCallback: ((data: AreaMeasurementData) => void) | null = null;
    private mapView: any = null;
    private fillColor: number[];
    private lineColor: number[];
    private lineWidth: number;

    constructor(
        id: string,
        name: string,
        options?: {
            fillColor?: number[];
            lineColor?: number[];
            lineWidth?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.AREA_MEASUREMENT, {
            ...options,
            zIndex: options?.zIndex ?? 50,
        });
        this.fillColor = options?.fillColor || [0, 170, 255, 0.2];
        this.lineColor = options?.lineColor || [0, 170, 255, 1];
        this.lineWidth = options?.lineWidth || 2;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.AREA_MEASUREMENT },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startMeasure(onComplete?: (data: AreaMeasurementData) => void): void {
        this.stopMeasure();
        this.onCompleteCallback = onComplete || null;

        this.drawInteraction = new Draw({
            source: this.source!,
            type: "Polygon",
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const coordinates = geometry.getCoordinates()[0];

            const points: MeasurementPoint[] = coordinates.map((coord: number[]) => {
                const [lng, lat] = toLonLat(coord);
                return { longitude: lng, latitude: lat };
            }).slice(0, -1);

            const area = getArea(geometry);
            const id = generateId("area_");
            let centerX = 0, centerY = 0;
            for (const coord of coordinates.slice(0, -1)) {
                centerX += coord[0];
                centerY += coord[1];
            }
            centerX /= (coordinates.length - 1);
            centerY /= (coordinates.length - 1);
            const areaText = area >= 1000000
                ? `${(area / 1000000).toFixed(2)} km²`
                : `${area.toFixed(0)} m²`;

            const labelFeature = new Feature({
                geometry: new Point([centerX, centerY]),
                measurementId: id,
            });
            labelFeature.setStyle(new Style({
                text: new Text({
                    text: areaText,
                    font: "14px sans-serif",
                    fill: new Fill({ color: "#ffffff" }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                }),
            }));
            this.measurements.set(id, { id, points, area });
            feature.set("measurementId", id);
            feature.set("type", "area");
            feature.setStyle(new Style({
                fill: new Fill({ color: arrayToRgba(this.fillColor) }),
                stroke: new Stroke({
                    color: arrayToRgba(this.lineColor),
                    width: this.lineWidth,
                }),
            }));
            this.source?.addFeature(labelFeature);
            if (this.onCompleteCallback) {
                this.onCompleteCallback({ id, points, area });
            }
            this.stopMeasure();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public stopMeasure(): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onCompleteCallback = null;
    }

    public deleteMeasurement(id: string): boolean {
        const measurement = this.measurements.get(id);
        if (measurement) {
            let targetFeatures: Feature[] = [];
            this.source?.forEachFeature((feature) => {
                if (feature.get("measurementId") === id) {
                    targetFeatures.push(feature);
                }
            });
            targetFeatures.forEach(f => this.source?.removeFeature(f));
            this.measurements.delete(id);
            return true;
        }
        return false;
    }

    public findMeasurementIdByGraphic(graphic: any): string | null {
        return graphic.get("measurementId") || null;
    }

    public clearAllMeasurements(): void {
        this.clear();
        this.measurements.clear();
        this.stopMeasure();
    }

    public getAllMeasurements(): AreaMeasurementData[] {
        return Array.from(this.measurements.values());
    }

    public isCurrentlyMeasuring(): boolean {
        return this.drawInteraction !== null;
    }

    public updateData(data: any): void { }
}