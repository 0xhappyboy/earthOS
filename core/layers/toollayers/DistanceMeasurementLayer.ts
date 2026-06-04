import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Draw from "ol/interaction/Draw";
import { getLength } from "ol/sphere";
import { toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, MeasurementPoint, DistanceMeasurementData } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export class DistanceMeasurementLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private measurements: Map<string, DistanceMeasurementData> = new Map();
    private onCompleteCallback: ((data: DistanceMeasurementData) => void) | null = null;
    private mapView: any = null;
    private lineColor: number[];
    private lineWidth: number;

    constructor(
        id: string,
        name: string,
        options?: {
            lineColor?: number[];
            lineWidth?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.DISTANCE_MEASUREMENT, {
            ...options,
            zIndex: options?.zIndex ?? 50,
        });
        this.lineColor = options?.lineColor || [0, 170, 255, 1];
        this.lineWidth = options?.lineWidth || 2;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.DISTANCE_MEASUREMENT },
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

    public startMeasure(onComplete?: (data: any) => void): void {
        this.stopMeasure();
        this.onCompleteCallback = onComplete || null;

        this.drawInteraction = new Draw({
            source: this.source!,
            type: "LineString",
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const coordinates = geometry.getCoordinates();

            const points: MeasurementPoint[] = coordinates.map((coord: number[]) => {
                const [lng, lat] = toLonLat(coord);
                return { longitude: lng, latitude: lat };
            });

            let totalDistance = 0;
            for (let i = 0; i < points.length - 1; i++) {
                totalDistance += this.calculateDistance(points[i], points[i + 1]);
            }
            const id = generateId("dist_");
            const midIndex = Math.floor(points.length / 2);
            const distanceText = totalDistance >= 1000
                ? `${(totalDistance / 1000).toFixed(2)} km`
                : `${totalDistance.toFixed(0)} m`;
            const labelFeature = new Feature({
                geometry: new Point([coordinates[midIndex][0], coordinates[midIndex][1]]),
                measurementId: id,
            });
            labelFeature.setStyle(new Style({
                text: new Text({
                    text: distanceText,
                    font: "14px sans-serif",
                    fill: new Fill({ color: "#ffffff" }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    offsetY: -10,
                    textAlign: "center",
                }),
            }));
            this.measurements.set(id, { id, points, distance: totalDistance });
            feature.set("measurementId", id);
            feature.set("type", "distance");
            feature.setStyle(new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.lineColor),
                    width: this.lineWidth,
                }),
            }));
            this.source?.addFeature(labelFeature);
            if (this.onCompleteCallback) {
                this.onCompleteCallback({
                    points,
                    distance: totalDistance,
                    id,
                    isDrawing: false,
                });
            }

            this.stopMeasure();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    private calculateDistance(p1: MeasurementPoint, p2: MeasurementPoint): number {
        const line = new LineString([
            [p1.longitude, p1.latitude],
            [p2.longitude, p2.latitude],
        ]);
        return getLength(line, { projection: "EPSG:4326" });
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

    public getAllMeasurements(): DistanceMeasurementData[] {
        return Array.from(this.measurements.values());
    }

    public isCurrentlyMeasuring(): boolean {
        return this.drawInteraction !== null;
    }

    public updateData(data: any): void { }
}