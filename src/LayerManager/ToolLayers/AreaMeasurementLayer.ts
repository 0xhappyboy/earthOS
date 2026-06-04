import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import Point from "@arcgis/core/geometry/Point";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";

export interface MeasurementPoint {
    longitude: number;
    latitude: number;
}

export interface AreaMeasurement {
    id: string;
    points: MeasurementPoint[];
    area: number;
    polygonGraphic: Graphic;
    labelGraphic: Graphic;
}

export interface AreaMeasurementLayerConfig extends LayerConfig {
    lineColor?: number[];
    lineWidth?: number;
    fillColor?: number[];
    textColor?: number[];
}

export class AreaMeasurementLayer extends BaseLayer {
    private view: MapView | null = null;
    private sketchViewModel: SketchViewModel | null = null;
    private measurements: Map<string, AreaMeasurement> = new Map();
    private currentPoints: MeasurementPoint[] = [];
    private isMeasuring: boolean = false;
    private measurementId: string | null = null;

    private lineColor: number[];
    private lineWidth: number;
    private fillColor: number[];
    private textColor: number[];

    private onMeasureCompleteCallback: ((data: any) => void) | null = null;

    constructor(config: AreaMeasurementLayerConfig) {
        super(config);
        this.lineColor = config.lineColor ?? [0, 170, 255, 1];
        this.lineWidth = config.lineWidth ?? 1;
        this.fillColor = config.fillColor ?? [0, 170, 255, 0.2];
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
            polygonSymbol: new SimpleFillSymbol({
                color: this.fillColor,
                outline: new SimpleLineSymbol({
                    color: this.lineColor,
                    width: this.lineWidth,
                }),
            }),
            updateOnGraphicClick: false,
        });
        this.sketchViewModel.on("create", (event: any) => {
            if (event.state === "start") {
                this.startNewMeasurement();
            } else if (event.state === "complete") {
                this.saveMeasurementFromGraphic(event.graphic);
            }
        });
    }

    private startNewMeasurement(): void {
        this.currentPoints = [];
        this.measurementId = `area_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.isMeasuring = true;
    }

    private calculatePolygonCenter(points: MeasurementPoint[]): MeasurementPoint {
        let sumLng = 0, sumLat = 0;
        for (let i = 0; i < points.length; i++) {
            sumLng += points[i].longitude;
            sumLat += points[i].latitude;
        }
        return {
            longitude: sumLng / points.length,
            latitude: sumLat / points.length
        };
    }

    private convertToWGS84(x: number, y: number): { longitude: number; latitude: number } {
        const lng = (x / 20037508.34) * 180;
        let lat = (y / 20037508.34) * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return { longitude: lng, latitude: lat };
    }

    private saveMeasurementFromGraphic(graphic: Graphic): void {
        if (!graphic || !graphic.geometry || !this.graphicsLayer) return;
        const geometry = graphic.geometry as Polygon;
        const rings = geometry.rings;
        if (!rings || rings.length === 0) return;
        const points = rings[0].slice(0, -1).map(p => this.convertToWGS84(p[0], p[1]));
        this.currentPoints = points;
        let area = 0;
        try {
            // @ts-ignore
            area = geometryEngine.geodesicArea(geometry, "square-meters");
        } catch (e) {
            console.warn("Area calculation error, using planar area");
            // @ts-ignore
            area = geometryEngine.planarArea(geometry, "square-meters");
        }
        graphic.attributes = {
            type: "area",
            measurementId: this.measurementId,
            area: area
        };
        const center = this.calculatePolygonCenter(this.currentPoints);
        const areaText = area >= 1000000
            ? `${(area / 1000000).toFixed(2)} km²`
            : `${area.toFixed(0)} m²`;
        const textSymbol = new TextSymbol({
            text: areaText,
            color: this.textColor,
            font: { size: 14, weight: "bold" },
            haloColor: [255, 255, 255, 0.9],
            haloSize: 2
        });
        const textPoint = new Point({
            longitude: center.longitude,
            latitude: center.latitude,
            spatialReference: { wkid: 4326 }
        });
        const textGraphic = new Graphic({
            geometry: textPoint,
            symbol: textSymbol,
            attributes: { type: "area-label", measurementId: this.measurementId }
        });
        this.graphicsLayer.add(textGraphic);
        this.measurements.set(this.measurementId!, {
            id: this.measurementId!,
            points: [...this.currentPoints],
            area,
            polygonGraphic: graphic,
            labelGraphic: textGraphic
        });
        if (this.onMeasureCompleteCallback) {
            this.onMeasureCompleteCallback({
                points: this.currentPoints,
                area,
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
        this.sketchViewModel.create("polygon");
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
            if (this.graphicsLayer) {
                if (measurement.polygonGraphic) {
                    this.graphicsLayer.remove(measurement.polygonGraphic);
                }
                if (measurement.labelGraphic) {
                    this.graphicsLayer.remove(measurement.labelGraphic);
                }
            }
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
            if (measurement.polygonGraphic === graphic || measurement.labelGraphic === graphic) {
                return id;
            }
        }
        return null;
    }

    public clearAllMeasurements(): void {
        const entries = Array.from(this.measurements.entries());
        for (let i = 0; i < entries.length; i++) {
            const measurement = entries[i][1];
            if (this.graphicsLayer) {
                this.graphicsLayer.remove(measurement.polygonGraphic);
                this.graphicsLayer.remove(measurement.labelGraphic);
            }
        }
        this.measurements.clear();
        this.stopMeasure();
    }

    public getAllMeasurements(): AreaMeasurement[] {
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