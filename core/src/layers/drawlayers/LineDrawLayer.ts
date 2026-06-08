import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";
// @ts-ignore
import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface LineDrawData {
    id: string;
    startPoint: [number, number];
    endPoint: [number, number];
    color?: number[];
    width?: number;
    style?: "solid" | "dashed";
}

export class LineDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultWidth: number;
    private defaultStyle: "solid" | "dashed";
    private onDrawCompleteCallback: ((data: LineDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: LineDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;

    constructor(id: string, name: string, options?: {
        defaultColor?: number[];
        defaultWidth?: number;
        defaultStyle?: "solid" | "dashed";
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.LINE_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultColor = options?.defaultColor || [255, 193, 7, 1];
        this.defaultWidth = options?.defaultWidth || 3;
        this.defaultStyle = options?.defaultStyle || "solid";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.LINE_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const color = feature?.get("color") || this.defaultColor;
        const width = feature?.get("width") || this.defaultWidth;
        const styleType = feature?.get("style") || this.defaultStyle;
        const lineDash = styleType === "dashed" ? [10, 10] : undefined;

        return new Style({
            stroke: new Stroke({
                color: arrayToRgba(color),
                width: width,
                lineDash: lineDash,
            }),
        });
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: LineDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        const tempSource = new VectorSource();
        this.drawInteraction = new Draw({
            source: tempSource,
            type: "LineString",
            maxPoints: 2,
            geometryFunction: (coordinates, geometry) => {
                if (coordinates && coordinates.length >= 2) {
                    const start = coordinates[0] as [number, number];
                    const end = coordinates[1] as [number, number];
                    if (!geometry) {
                        geometry = new LineString([start, end]);
                    } else {
                        geometry.setCoordinates([start, end]);
                    }
                }
                return geometry;
            },
            style: this.getStyleForFeature(),
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const geometry = event.feature.getGeometry();
            const id = generateId("line_");

            if (geometry instanceof LineString) {
                const coordinates = geometry.getCoordinates();
                if (coordinates && coordinates.length >= 2) {
                    const [startX, startY] = coordinates[0];
                    const [endX, endY] = coordinates[1];
                    const [startLng, startLat] = toLonLat([startX, startY]);
                    const [endLng, endLat] = toLonLat([endX, endY]);

                    const feature = new Feature({
                        geometry: geometry.clone(),
                        id: id,
                        startPoint: [startLng, startLat],
                        endPoint: [endLng, endLat],
                    });
                    feature.set("color", this.defaultColor);
                    feature.set("width", this.defaultWidth);
                    feature.set("style", this.defaultStyle);

                    this.source?.addFeature(feature);
                    this.features.set(id, feature);
                    this.layer?.setZIndex(999);

                    if (this.onDrawCompleteCallback) {
                        this.onDrawCompleteCallback({
                            id,
                            startPoint: [startLng, startLat],
                            endPoint: [endLng, endLat],
                            color: this.defaultColor,
                            width: this.defaultWidth,
                            style: this.defaultStyle,
                        });
                    }
                }
            }

            tempSource.clear();
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
            this.onDrawCompleteCallback = null;
            this.mapView?.render();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public startEdit(id: string, onComplete?: (data: LineDrawData) => void): void {
        this.stopEdit();
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }
        this.editingFeature = targetFeature;
        this.onEditCompleteCallback = onComplete || null;

        const tempSource = new VectorSource();
        tempSource.addFeature(targetFeature);
        const tempFeatures = tempSource.getFeaturesCollection();

        this.transformInteraction = new Transform({
            features: tempFeatures as any,
            translate: true,
            scale: true,
            rotate: true,
            keepAspectRatio: () => false,
        });
        this.transformInteraction.setActive(true);
        const saveChanges = () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof LineString) {
                const coordinates = geometry.getCoordinates();
                if (coordinates.length >= 2) {
                    const [startLng, startLat] = toLonLat(coordinates[0]);
                    const [endLng, endLat] = toLonLat(coordinates[1]);
                    const idVal = targetFeature.get("id");

                    targetFeature.set("startPoint", [startLng, startLat]);
                    targetFeature.set("endPoint", [endLng, endLat]);
                    targetFeature.changed();

                    if (this.onEditCompleteCallback && idVal) {
                        this.onEditCompleteCallback({
                            id: idVal,
                            startPoint: [startLng, startLat],
                            endPoint: [endLng, endLat],
                            color: targetFeature.get("color"),
                            width: targetFeature.get("width"),
                            style: targetFeature.get("style"),
                        });
                    }
                }
            }
            this.mapView?.render();
        };

        this.transformInteraction.on("scaleend", saveChanges);
        this.transformInteraction.on("translateend", saveChanges);
        this.transformInteraction.on("rotateend", saveChanges);

        this.mapView?.addInteraction(this.transformInteraction);
    }

    public stopEdit(): void {
        if (this.transformInteraction) {
            this.mapView?.removeInteraction(this.transformInteraction);
            this.transformInteraction.dispose?.();
            this.transformInteraction = null;
        }
        this.editingFeature = null;
        this.onEditCompleteCallback = null;
    }

    public addLine(data: LineDrawData): void {
        const start = fromLonLat(data.startPoint);
        const end = fromLonLat(data.endPoint);
        const line = new LineString([start, end]);

        const feature = new Feature({
            geometry: line,
            id: data.id,
            startPoint: data.startPoint,
            endPoint: data.endPoint,
        });
        feature.set("color", data.color || this.defaultColor);
        feature.set("width", data.width || this.defaultWidth);
        feature.set("style", data.style || this.defaultStyle);

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeLine(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllLines(): LineDrawData[] {
        const result: LineDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id: id.toString(),
                startPoint: feature.get("startPoint"),
                endPoint: feature.get("endPoint"),
                color: feature.get("color"),
                width: feature.get("width"),
                style: feature.get("style"),
            });
        });
        return result;
    }

    public getLine(id: string): LineDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            startPoint: feature.get("startPoint"),
            endPoint: feature.get("endPoint"),
            color: feature.get("color"),
            width: feature.get("width"),
            style: feature.get("style"),
        };
    }

    public updateLineStyle(
        id: string,
        color: number[],
        width: number,
        style: "solid" | "dashed"
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("color", color);
        feature.set("width", width);
        feature.set("style", style);
        feature.changed();
        this.mapView?.render();
    }

    public stopDraw(): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = null;
    }

    public clearAll(): void {
        this.clear();
        this.features.clear();
        this.stopEdit();
    }

    public isDrawActive(): boolean {
        return this.drawInteraction !== null;
    }

    public isEditActive(): boolean {
        return this.transformInteraction !== null;
    }

    public setEditable(editable: boolean): void {
        if (editable) {
            this.layer.set('pointer-events', true);
        } else {
            this.stopEdit();
            this.stopDraw();
        }
    }

    public getEditingId(): string | null {
        return this.editingFeature?.get("id") || null;
    }

    public cancelDraw(): void {
        this.stopDraw();
    }

    public cancelEdit(): void {
        this.stopEdit();
    }

    public updateData(data: { lines?: LineDrawData[] }): void {
        if (data.lines) {
            this.clearAll();
            data.lines.forEach((line) => this.addLine(line));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}