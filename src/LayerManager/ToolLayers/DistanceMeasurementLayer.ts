import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Point from "@arcgis/core/geometry/Point";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

export interface MeasurementPoint {
    longitude: number;
    latitude: number;
}

export interface DistanceMeasurement {
    id: string;
    points: MeasurementPoint[];
    distance: number;
    graphics: Graphic[];
}

export interface DistanceMeasurementLayerConfig extends LayerConfig {
    lineColor?: number[];
    lineWidth?: number;
    textColor?: number[];
}

export class DistanceMeasurementLayer extends BaseLayer {
    private view: MapView | null = null;
    private sketchViewModel: SketchViewModel | null = null;
    private measurements: Map<string, DistanceMeasurement> = new Map();
    private currentPoints: MeasurementPoint[] = [];
    private isMeasuring: boolean = false;
    private measurementId: string | null = null;

    private lineColor: number[];
    private lineWidth: number;
    private textColor: number[];

    private onMeasureCompleteCallback: ((data: any) => void) | null = null;

    constructor(config: DistanceMeasurementLayerConfig) {
        super(config);
        this.lineColor = config.lineColor ?? [0, 170, 255, 1];
        this.lineWidth = config.lineWidth ?? 1;
        this.textColor = config.textColor ?? [0, 170, 255, 1];
    }

    public createLayer(): GraphicsLayer {
        super.createLayer();
        return this.graphicsLayer!;
    }

    public setView(view: MapView): void {
        this.view = view;
        this.initSketchViewModel();
    }

    private initSketchViewModel(): void {
        if (!this.view || !this.graphicsLayer) {
            console.error("View or GraphicsLayer not ready");
            return;
        }
        if (this.sketchViewModel) {
            this.sketchViewModel.destroy();
            this.sketchViewModel = null;
        }
        this.sketchViewModel = new SketchViewModel({
            view: this.view,
            layer: this.graphicsLayer,
            polylineSymbol: new SimpleLineSymbol({
                color: this.lineColor,
                width: this.lineWidth,
            }),
            updateOnGraphicClick: false,
        });
        this.sketchViewModel.on("create", (event: any) => {
            if (event.state === "start") {
                this.startNewMeasurement();
            } else if (event.state === "complete") {
                this.saveMeasurementFromGraphic(event.graphic);
                this.view?.graphics?.remove?.(event.graphic);
                if (this.graphicsLayer) {
                    this.graphicsLayer.add(event.graphic);
                }
            }
        });
    }

    private startNewMeasurement(): void {
        this.currentPoints = [];
        this.measurementId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.isMeasuring = true;
    }

    private calculateTotalDistance(points: MeasurementPoint[]): number {
        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            total += this.calculateDistance(points[i], points[i + 1]);
        }
        return total;
    }

    private calculateDistance(p1: MeasurementPoint, p2: MeasurementPoint): number {
        const polyline = new Polyline({
            paths: [[[p1.longitude, p1.latitude], [p2.longitude, p2.latitude]]],
            spatialReference: { wkid: 4326 }
        });
        // @ts-ignore
        return geometryEngine.geodesicLength(polyline, "meters");
    }

    private convertToWGS84(x: number, y: number): { longitude: number; latitude: number } {
        const lng = (x / 20037508.34) * 180;
        let lat = (y / 20037508.34) * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return { longitude: lng, latitude: lat };
    }

    private saveMeasurementFromGraphic(graphic: Graphic): void {
        if (!graphic || !graphic.geometry || !this.graphicsLayer) return;

        const geometry = graphic.geometry as Polyline;
        const paths = geometry.paths;
        if (!paths || paths.length === 0) return;

        const points = paths[0].map(p => this.convertToWGS84(p[0], p[1]));
        this.currentPoints = points;

        const totalDistance = this.calculateTotalDistance(this.currentPoints);

        graphic.attributes = {
            type: "distance",
            measurementId: this.measurementId,
            distance: totalDistance
        };

        let midLng = 0, midLat = 0;
        for (const p of this.currentPoints) {
            midLng += p.longitude;
            midLat += p.latitude;
        }
        midLng /= this.currentPoints.length;
        midLat /= this.currentPoints.length;

        const distanceText = totalDistance >= 1000
            ? `${(totalDistance / 1000).toFixed(2)} km`
            : `${totalDistance.toFixed(0)} m`;

        const textSymbol = new TextSymbol({
            text: distanceText,
            color: this.textColor,
            font: { size: 14, weight: "bold" },
            haloColor: [255, 255, 255, 0.9],
            haloSize: 2
        });

        const textPoint = new Point({
            longitude: midLng,
            latitude: midLat,
            spatialReference: { wkid: 4326 }
        });

        const textGraphic = new Graphic({
            geometry: textPoint,
            symbol: textSymbol,
            attributes: { type: "distance-label", measurementId: this.measurementId }
        });
        this.graphicsLayer.add(textGraphic);

        this.measurements.set(this.measurementId!, {
            id: this.measurementId!,
            points: [...this.currentPoints],
            distance: totalDistance,
            graphics: [graphic, textGraphic]
        });
        if (this.onMeasureCompleteCallback) {
            this.onMeasureCompleteCallback({
                points: this.currentPoints,
                distance: totalDistance,
                id: this.measurementId
            });
        }

        this.isMeasuring = false;
        this.measurementId = null;
    }

    public startMeasure(onComplete?: (data: any) => void): void {
        if (!this.sketchViewModel) {
            console.error("SketchViewModel not initialized");
            return;
        }
        this.onMeasureCompleteCallback = onComplete || null;
        this.sketchViewModel.create("polyline");
    }

    public stopMeasure(): void {
        if (this.sketchViewModel) {
            this.sketchViewModel.cancel();
        }
        this.isMeasuring = false;
        this.measurementId = null;
        this.onMeasureCompleteCallback = null;
    }

    public deleteMeasurement(id: string): boolean {
        const measurement = this.measurements.get(id);
        if (measurement) {
            measurement.graphics.forEach(graphic => {
                if (this.graphicsLayer) {
                    this.graphicsLayer.remove(graphic);
                }
            });
            this.measurements.delete(id);
            return true;
        }
        return false;
    }

    public findMeasurementIdByGraphic(graphic: Graphic): string | null {
        const attributes = graphic.attributes;
        if (attributes && attributes.measurementId) {
            return attributes.measurementId;
        }

        const entries = Array.from(this.measurements.entries());
        for (let i = 0; i < entries.length; i++) {
            const [id, measurement] = entries[i];
            if (measurement.graphics.includes(graphic)) {
                return id;
            }
        }
        return null;
    }

    public clearAllMeasurements(): void {
        const entries = Array.from(this.measurements.entries());
        for (let i = 0; i < entries.length; i++) {
            const measurement = entries[i][1];
            measurement.graphics.forEach(graphic => {
                if (this.graphicsLayer) {
                    this.graphicsLayer.remove(graphic);
                }
            });
        }
        this.measurements.clear();
        this.stopMeasure();
    }

    public getAllMeasurements(): DistanceMeasurement[] {
        return Array.from(this.measurements.values());
    }

    public isCurrentlyMeasuring(): boolean {
        return this.isMeasuring;
    }

    public destroy(): void {
        if (this.sketchViewModel) {
            this.sketchViewModel.destroy();
            this.sketchViewModel = null;
        }
        this.clearAllMeasurements();
        super.destroy();
    }

    public updateData(data: any): void { }
}