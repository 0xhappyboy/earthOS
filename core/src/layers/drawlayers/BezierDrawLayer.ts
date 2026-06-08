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
import CircleStyle from "ol/style/Circle";
import { Fill } from "ol/style";
import { Point } from "ol/geom";

export interface BezierDrawData {
    id: string;
    startPoint: [number, number];
    controlPoint1: [number, number];
    controlPoint2: [number, number];
    endPoint: [number, number];
    color?: number[];
    width?: number;
    style?: "solid" | "dashed";
}

export class BezierDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultWidth: number;
    private defaultStyle: "solid" | "dashed";
    private onDrawCompleteCallback: ((data: BezierDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: BezierDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;
    private tempPoints: [number, number][] = [];

    constructor(id: string, name: string, options?: {
        defaultColor?: number[];
        defaultWidth?: number;
        defaultStyle?: "solid" | "dashed";
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.BEZIER_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultColor = options?.defaultColor || [156, 39, 176, 1];
        this.defaultWidth = options?.defaultWidth || 3;
        this.defaultStyle = options?.defaultStyle || "solid";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.BEZIER_DRAW },
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

    private computeBezierPoints(
        p0: [number, number],
        p1: [number, number],
        p2: [number, number],
        p3: [number, number],
        segments: number = 100
    ): [number, number][] {
        const points: [number, number][] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
            const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
            points.push([x, y]);
        }
        return points;
    }

    private createBezierGeometry(
        start: [number, number],
        cp1: [number, number],
        cp2: [number, number],
        end: [number, number]
    ): LineString {
        const points = this.computeBezierPoints(start, cp1, cp2, end);
        return new LineString(points);
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: BezierDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.stopEdit();
        this.onDrawCompleteCallback = onComplete || null;
        this.tempPoints = [];
        const tempSource = new VectorSource();
        let currentPoints: [number, number][] = [];
        const helperSource = new VectorSource();
        const helperLayer = new VectorLayer({
            source: helperSource,
            style: (feature: any) => {
                const type = feature.get("type");
                if (type === "control-line") {
                    return new Style({
                        stroke: new Stroke({
                            color: "rgba(255,0,0,0.4)",
                            width: 1,
                            lineDash: [5, 5],
                        }),
                    });
                }
                return new Style({
                    stroke: new Stroke({
                        color: arrayToRgba(this.defaultColor),
                        width: this.defaultWidth,
                        lineDash: this.defaultStyle === "dashed" ? [10, 10] : undefined,
                    }),
                });
            },
        });
        this.mapView?.addLayer(helperLayer);

        const updateHelper = (points: [number, number][]) => {
            helperSource.clear();
            if (points.length >= 2) {
                for (let i = 0; i < points.length - 1; i++) {
                    const line = new Feature({
                        geometry: new LineString([points[i], points[i + 1]]),
                        type: "control-line",
                    });
                    helperSource.addFeature(line);
                }
            }
        };

        this.drawInteraction = new Draw({
            source: tempSource,
            type: "LineString",
            maxPoints: 4,
            freehand: false,
            style: new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.defaultColor),
                    width: this.defaultWidth,
                    lineDash: this.defaultStyle === "dashed" ? [10, 10] : undefined,
                }),
            }),
            geometryFunction: (coordinates, geometry) => {
                currentPoints = coordinates as [number, number][];
                updateHelper(currentPoints);
                if (currentPoints.length === 0) {
                    return geometry;
                }

                if (currentPoints.length === 1) {
                    if (!geometry) {
                        geometry = new LineString([currentPoints[0], currentPoints[0]]);
                    } else {
                        geometry.setCoordinates([currentPoints[0], currentPoints[0]]);
                    }
                    return geometry;
                }

                if (currentPoints.length === 2) {
                    if (!geometry) {
                        geometry = new LineString([currentPoints[0], currentPoints[1]]);
                    } else {
                        geometry.setCoordinates([currentPoints[0], currentPoints[1]]);
                    }
                    return geometry;
                }

                if (currentPoints.length === 3) {
                    const controlLine = new LineString([currentPoints[0], currentPoints[1], currentPoints[2]]);
                    if (!geometry) {
                        geometry = controlLine;
                    } else {
                        geometry.setCoordinates([currentPoints[0], currentPoints[1], currentPoints[2]]);
                    }
                    return geometry;
                }

                if (currentPoints.length === 4) {
                    const [start, cp1, cp2, end] = currentPoints;
                    const bezierPoints = this.computeBezierPoints(start, cp1, cp2, end, 100);
                    if (!geometry) {
                        geometry = new LineString(bezierPoints);
                    } else {
                        geometry.setCoordinates(bezierPoints);
                    }
                    return geometry;
                }

                return geometry;
            },
        });

        this.drawInteraction.on("drawstart", () => {
            currentPoints = [];
            tempSource.clear();
            helperSource.clear();
        });

        this.drawInteraction.on("drawend", (event: any) => {
            this.mapView?.removeLayer(helperLayer);
            if (currentPoints.length === 4) {
                const [start, cp1, cp2, end] = currentPoints;
                const bezierLine = this.createBezierGeometry(start, cp1, cp2, end);
                const id = generateId("bezier_");

                const [startLng, startLat] = toLonLat(start);
                const [cp1Lng, cp1Lat] = toLonLat(cp1);
                const [cp2Lng, cp2Lat] = toLonLat(cp2);
                const [endLng, endLat] = toLonLat(end);

                const newFeature = new Feature({
                    geometry: bezierLine,
                    id: id,
                    startPoint: [startLng, startLat],
                    controlPoint1: [cp1Lng, cp1Lat],
                    controlPoint2: [cp2Lng, cp2Lat],
                    endPoint: [endLng, endLat],
                });
                newFeature.set("color", this.defaultColor);
                newFeature.set("width", this.defaultWidth);
                newFeature.set("style", this.defaultStyle);

                this.source?.addFeature(newFeature);
                this.features.set(id, newFeature);
                this.layer?.setZIndex(999);

                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        startPoint: [startLng, startLat],
                        controlPoint1: [cp1Lng, cp1Lat],
                        controlPoint2: [cp2Lng, cp2Lat],
                        endPoint: [endLng, endLat],
                        color: this.defaultColor,
                        width: this.defaultWidth,
                        style: this.defaultStyle,
                    });
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

    public startEdit(id: string, onComplete?: (data: BezierDrawData) => void): void {
        this.stopEdit();
        this.stopDraw();
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.warn(`Bezier feature with id ${id} not found`);
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
                if (coordinates.length > 0) {
                    const [startLng, startLat] = toLonLat(coordinates[0]);
                    const [endLng, endLat] = toLonLat(coordinates[coordinates.length - 1]);
                    const originalStartPoint = targetFeature.get("startPoint");
                    const originalControlPoint1 = targetFeature.get("controlPoint1");
                    const originalControlPoint2 = targetFeature.get("controlPoint2");
                    const originalEndPoint = targetFeature.get("endPoint");
                    if (originalStartPoint && originalEndPoint) {
                        const originalStart = fromLonLat(originalStartPoint);
                        const originalEnd = fromLonLat(originalEndPoint);
                        const newStart = fromLonLat([startLng, startLat]);
                        const newEnd = fromLonLat([endLng, endLat]);
                        const offsetX = newStart[0] - originalStart[0];
                        const offsetY = newStart[1] - originalStart[1];
                        const originalDx = originalEnd[0] - originalStart[0];
                        const originalDy = originalEnd[1] - originalStart[1];
                        const newDx = newEnd[0] - newStart[0];
                        const newDy = newEnd[1] - newStart[1];
                        const originalLen = Math.sqrt(originalDx * originalDx + originalDy * originalDy);
                        const newLen = Math.sqrt(newDx * newDx + newDy * newDy);
                        const scale = originalLen > 0 ? newLen / originalLen : 1;
                        if (originalControlPoint1) {
                            const cp1 = fromLonLat(originalControlPoint1);
                            const newCp1X = originalStart[0] + (cp1[0] - originalStart[0]) * scale + offsetX;
                            const newCp1Y = originalStart[1] + (cp1[1] - originalStart[1]) * scale + offsetY;
                            const [cp1Lng, cp1Lat] = toLonLat([newCp1X, newCp1Y]);
                            targetFeature.set("controlPoint1", [cp1Lng, cp1Lat]);
                        }
                        if (originalControlPoint2) {
                            const cp2 = fromLonLat(originalControlPoint2);
                            const newCp2X = originalStart[0] + (cp2[0] - originalStart[0]) * scale + offsetX;
                            const newCp2Y = originalStart[1] + (cp2[1] - originalStart[1]) * scale + offsetY;
                            const [cp2Lng, cp2Lat] = toLonLat([newCp2X, newCp2Y]);
                            targetFeature.set("controlPoint2", [cp2Lng, cp2Lat]);
                        }
                        targetFeature.set("startPoint", [startLng, startLat]);
                        targetFeature.set("endPoint", [endLng, endLat]);
                        const start = fromLonLat([startLng, startLat]);
                        const cp1 = targetFeature.get("controlPoint1");
                        const cp2 = targetFeature.get("controlPoint2");
                        const end = fromLonLat([endLng, endLat]);
                        if (cp1 && cp2) {
                            const cp1Coord = fromLonLat(cp1);
                            const cp2Coord = fromLonLat(cp2);
                            const newBezier = this.createBezierGeometry(
                                [start[0], start[1]],
                                [cp1Coord[0], cp1Coord[1]],
                                [cp2Coord[0], cp2Coord[1]],
                                [end[0], end[1]]
                            );
                            targetFeature.setGeometry(newBezier);
                        }

                        targetFeature.changed();

                        const idVal = targetFeature.get("id");
                        if (this.onEditCompleteCallback && idVal) {
                            this.onEditCompleteCallback({
                                id: idVal,
                                startPoint: [startLng, startLat],
                                controlPoint1: targetFeature.get("controlPoint1"),
                                controlPoint2: targetFeature.get("controlPoint2"),
                                endPoint: [endLng, endLat],
                                color: targetFeature.get("color"),
                                width: targetFeature.get("width"),
                                style: targetFeature.get("style"),
                            });
                        }
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

    public addBezier(data: BezierDrawData): void {
        const start = fromLonLat(data.startPoint);
        const cp1 = fromLonLat(data.controlPoint1);
        const cp2 = fromLonLat(data.controlPoint2);
        const end = fromLonLat(data.endPoint);
        const bezierLine = this.createBezierGeometry(
            [start[0], start[1]],
            [cp1[0], cp1[1]],
            [cp2[0], cp2[1]],
            [end[0], end[1]]
        );
        const feature = new Feature({
            geometry: bezierLine,
            id: data.id,
            startPoint: data.startPoint,
            controlPoint1: data.controlPoint1,
            controlPoint2: data.controlPoint2,
            endPoint: data.endPoint,
        });
        feature.set("color", data.color || this.defaultColor);
        feature.set("width", data.width || this.defaultWidth);
        feature.set("style", data.style || this.defaultStyle);

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeBezier(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllBeziers(): BezierDrawData[] {
        const result: BezierDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id: id.toString(),
                startPoint: feature.get("startPoint"),
                controlPoint1: feature.get("controlPoint1"),
                controlPoint2: feature.get("controlPoint2"),
                endPoint: feature.get("endPoint"),
                color: feature.get("color"),
                width: feature.get("width"),
                style: feature.get("style"),
            });
        });
        return result;
    }

    public getBezier(id: string): BezierDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            startPoint: feature.get("startPoint"),
            controlPoint1: feature.get("controlPoint1"),
            controlPoint2: feature.get("controlPoint2"),
            endPoint: feature.get("endPoint"),
            color: feature.get("color"),
            width: feature.get("width"),
            style: feature.get("style"),
        };
    }

    public updateBezierStyle(
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
        this.tempPoints = [];
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

    public updateData(data: { beziers?: BezierDrawData[] }): void {
        if (data.beziers) {
            this.clearAll();
            data.beziers.forEach((bezier) => this.addBezier(bezier));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}