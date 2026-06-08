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
import { toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface LineCoordinatePickData {
    id: string;
    points: { longitude: number; latitude: number }[];
    timestamp: number;
    name?: string;
}

export class LineCoordinatePickLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private lines: Map<string, LineCoordinatePickData> = new Map();
    private onCompleteCallback: ((data: LineCoordinatePickData) => void) | null = null;
    private mapView: any = null;
    private lineColor: number[];
    private lineWidth: number;
    private textColor: number[];
    private textSize: number;
    private features: Map<string, Feature> = new Map();
    private labelFeatures: Map<string, Feature> = new Map();

    constructor(
        id: string,
        name: string,
        options?: {
            lineColor?: number[];
            lineWidth?: number;
            textColor?: number[];
            textSize?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.LINE_COORDINATE_PICK, {
            ...options,
            zIndex: options?.zIndex ?? 50,
        });
        this.lineColor = options?.lineColor || [0, 200, 255, 1];
        this.lineWidth = options?.lineWidth || 3;
        this.textColor = options?.textColor || [255, 200, 0, 1];
        this.textSize = options?.textSize || 12;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.LINE_COORDINATE_PICK },
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

    public startPick(onComplete?: (data: LineCoordinatePickData) => void): void {
        this.stopPick();
        this.onCompleteCallback = onComplete || null;

        this.drawInteraction = new Draw({
            source: this.source!,
            type: "LineString",
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const coordinates = geometry.getCoordinates();

            const points = coordinates.map((coord: number[]) => {
                const [lng, lat] = toLonLat(coord);
                return { longitude: lng, latitude: lat };
            });

            const id = generateId("LineCoordinatePick_");
            const timestamp = Date.now();
            const midIndex = Math.floor(points.length / 2);
            const midCoord = coordinates[midIndex];

            const LineCoordinatePickData: LineCoordinatePickData = {
                id,
                points,
                timestamp,
                name: `线拾取 ${new Date(timestamp).toLocaleTimeString()}`
            };
            this.lines.set(id, LineCoordinatePickData);
            this.features.set(id, feature);
            feature.setStyle(new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.lineColor),
                    width: this.lineWidth,
                    lineDash: [10, 10],
                }),
            }));
            feature.set("id", id);
            feature.set("type", "line_pick");
            const labelFeature = new Feature({
                geometry: new Point(midCoord),
                id: id,
            });
            labelFeature.set("type", "line_pick");
            labelFeature.setStyle(new Style({
                text: new Text({
                    text: `线 ${this.lines.size}`,
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
            this.labelFeatures.set(id, labelFeature);
            this.source?.addFeature(labelFeature);

            if (this.onCompleteCallback) {
                this.onCompleteCallback(LineCoordinatePickData);
            }
            this.stopPick();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public stopPick(): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onCompleteCallback = null;
    }

    public removeLine(id: string): boolean {
        const feature = this.features.get(id);
        const labelFeature = this.labelFeatures.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
        if (labelFeature) {
            this.source?.removeFeature(labelFeature);
            this.labelFeatures.delete(id);
        }
        this.lines.delete(id);
        return true;
    }

    public clearAllLines(): void {
        this.clear();
        this.features.clear();
        this.labelFeatures.clear();
        this.lines.clear();
        this.stopPick();
    }

    public getAllLines(): LineCoordinatePickData[] {
        return Array.from(this.lines.values());
    }

    public getLine(id: string): LineCoordinatePickData | undefined {
        return this.lines.get(id);
    }

    public highlightLine(id: string): void {
        this.features.forEach((feature, fid) => {
            const isActive = fid === id;
            feature.setStyle(new Style({
                stroke: new Stroke({
                    color: arrayToRgba(isActive ? [255, 170, 0, 1] : this.lineColor),
                    width: this.lineWidth + (isActive ? 2 : 0),
                    lineDash: isActive ? [] : [10, 10],
                }),
            }));
        });
        this.labelFeatures.forEach((feature, fid) => {
            const isActive = fid === id;
            feature.setStyle(new Style({
                text: new Text({
                    text: isActive ? "● 线拾取 ●" : `线 ${this.lines.size}`,
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(isActive ? [255, 170, 0, 1] : this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
        });
        this.mapView?.render();
    }

    public clearHighlight(): void {
        this.features.forEach((feature) => {
            feature.setStyle(new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.lineColor),
                    width: this.lineWidth,
                    lineDash: [10, 10],
                }),
            }));
        });
        this.labelFeatures.forEach((feature) => {
            feature.setStyle(new Style({
                text: new Text({
                    text: `线 ${this.lines.size}`,
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
        });
        this.mapView?.render();
    }

    public stopDraw(): void {
        this.stopPick();
    }

    public isDrawActive(): boolean {
        return this.drawInteraction !== null;
    }

    public isEditActive(): boolean {
        return false;
    }

    public setEditable(editable: boolean): void {
        if (!editable) {
            this.stopPick();
        }
    }

    public stopEdit(): void {
        this.stopPick();
    }

    public getEditingId(): string | null {
        return null;
    }

    public cancelDraw(): void {
        this.stopPick();
    }

    public cancelEdit(): void {
        this.stopPick();
    }

    public updateData(data: any): void { }

    public destroy(): void {
        this.stopPick();
        super.destroy();
    }
}