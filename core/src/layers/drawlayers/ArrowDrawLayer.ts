

import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Draw from "ol/interaction/Draw";

import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface ArrowDrawData {
    id: string;
    startPoint: [number, number];
    endPoint: [number, number];
    color?: number[];
    width?: number;
    style?: "solid" | "dashed";
    headSize?: number;
}

export class ArrowDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultWidth: number;
    private defaultStyle: "solid" | "dashed";
    private defaultHeadSize: number;
    private onDrawCompleteCallback: ((data: ArrowDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: ArrowDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;
    constructor(id: string, name: string, options?: {
        defaultColor?: number[];
        defaultWidth?: number;
        defaultStyle?: "solid" | "dashed";
        defaultHeadSize?: number;
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.ARROW_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultColor = options?.defaultColor || [255, 87, 34, 1];
        this.defaultWidth = options?.defaultWidth || 3;
        this.defaultStyle = options?.defaultStyle || "solid";
        this.defaultHeadSize = options?.defaultHeadSize || 50;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.ARROW_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style[] {
        const type = feature?.get("type");
        if (type === 'line') {
            const startPoint = feature?.get("startPoint");
            const endPoint = feature?.get("endPoint");
            const color = feature?.get("color") || this.defaultColor;
            const width = feature?.get("width") || this.defaultWidth;
            const styleType = feature?.get("style") || this.defaultStyle;
            const lineDash = styleType === "dashed" ? [10, 10] : undefined;
            if (!startPoint || !endPoint) {
                return [new Style({})];
            }
            const start = fromLonLat(startPoint);
            const end = fromLonLat(endPoint);
            return [new Style({
                geometry: new LineString([start, end]),
                stroke: new Stroke({
                    color: arrayToRgba(color),
                    width: width,
                    lineDash: lineDash,
                }),
            })];
        }
        if (type === 'arrowHead') {
            const angle = feature?.get("angle") || 0;
            const color = feature?.get("color") || this.defaultColor;
            const headSize = feature?.get("headSize") || this.defaultHeadSize;
            const endPoint = feature?.getGeometry()?.getCoordinates();
            if (!endPoint) {
                return [new Style({})];
            }
            const headX = endPoint[0];
            const headY = endPoint[1];
            const wingAngle1 = angle + Math.PI * 0.85;
            const wingAngle2 = angle - Math.PI * 0.85;
            const wingTip1X = headX + Math.cos(wingAngle1) * headSize;
            const wingTip1Y = headY + Math.sin(wingAngle1) * headSize;
            const wingTip2X = headX + Math.cos(wingAngle2) * headSize;
            const wingTip2Y = headY + Math.sin(wingAngle2) * headSize;
            const arrowPolygon = new Polygon([[
                [headX, headY],
                [wingTip1X, wingTip1Y],
                [wingTip2X, wingTip2Y],
                [headX, headY]
            ]]);
            return [new Style({
                geometry: arrowPolygon,
                fill: new Fill({ color: arrayToRgba(color) }),
                stroke: new Stroke({ color: arrayToRgba(color), width: 1 }),
            })];
        }

        return [new Style({})];
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: ArrowDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;

        const tempSource = new VectorSource();
        let startPoint: [number, number] | null = null;
        let endPoint: [number, number] | null = null;

        this.drawInteraction = new Draw({
            source: tempSource,
            type: "LineString",
            maxPoints: 2,
            geometryFunction: (coordinates, geometry) => {
                if (coordinates.length === 0) {
                    startPoint = null;
                    endPoint = null;
                    return geometry;
                }
                if (coordinates.length === 1) {
                    startPoint = coordinates[0] as [number, number];
                    endPoint = null;
                    if (!geometry) {
                        geometry = new LineString([startPoint, startPoint]);
                    } else {
                        geometry.setCoordinates([startPoint, startPoint]);
                    }
                    return geometry;
                }
                if (coordinates.length >= 2) {
                    startPoint = coordinates[0] as [number, number];
                    endPoint = coordinates[1] as [number, number];
                    if (!geometry) {
                        geometry = new LineString([startPoint, endPoint]);
                    } else {
                        geometry.setCoordinates([startPoint, endPoint]);
                    }
                    return geometry;
                }
                return geometry;
            },
            style: new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.defaultColor),
                    width: this.defaultWidth,
                    lineDash: this.defaultStyle === "dashed" ? [10, 10] : undefined,
                }),
            }),
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const id = generateId("arrow_");

            if (startPoint && endPoint) {
                const [startLng, startLat] = toLonLat(startPoint);
                const [endLng, endLat] = toLonLat(endPoint);
                const angle = Math.atan2(endPoint[1] - startPoint[1], endPoint[0] - startPoint[0]);

                
                const lineGeometry = new LineString([startPoint, endPoint]);
                const lineFeature = new Feature({
                    geometry: lineGeometry,
                    id: id,
                    startPoint: [startLng, startLat],
                    endPoint: [endLng, endLat],
                    type: 'line'
                });
                lineFeature.set("color", this.defaultColor);
                lineFeature.set("width", this.defaultWidth);
                lineFeature.set("style", this.defaultStyle);
                lineFeature.set("headSize", this.defaultHeadSize);

                
                const arrowPoint = new Point(endPoint);
                const arrowFeature = new Feature({
                    geometry: arrowPoint,
                    id: id + "_head",
                    parentId: id,
                    type: 'arrowHead',
                    angle: angle,
                    color: this.defaultColor,
                    headSize: this.defaultHeadSize
                });

                this.source?.addFeature(lineFeature);
                this.source?.addFeature(arrowFeature);
                this.features.set(id, lineFeature);

                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        startPoint: [startLng, startLat],
                        endPoint: [endLng, endLat],
                        color: this.defaultColor,
                        width: this.defaultWidth,
                        style: this.defaultStyle,
                        headSize: this.defaultHeadSize,
                    });
                }
            }

            startPoint = null;
            endPoint = null;
            tempSource.clear();
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
            this.onDrawCompleteCallback = null;
            this.mapView?.render();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public startEdit(id: string, onComplete?: (data: ArrowDrawData) => void): void {
        this.stopEdit();

        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.error(`Arrow with id ${id} not found`);
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
        });
        this.transformInteraction.setActive(true);

        const saveChanges = () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof LineString) {
                const coordinates = geometry.getCoordinates();
                if (coordinates && coordinates.length >= 2) {
                    const [startLng, startLat] = toLonLat(coordinates[0]);
                    const [endLng, endLat] = toLonLat(coordinates[1]);
                    const idVal = targetFeature.get("id");
                    if (this.onEditCompleteCallback && idVal) {
                        this.onEditCompleteCallback({
                            id: idVal,
                            startPoint: [startLng, startLat],
                            endPoint: [endLng, endLat],
                        });
                    }
                    targetFeature.set("startPoint", [startLng, startLat]);
                    targetFeature.set("endPoint", [endLng, endLat]);
                    targetFeature.changed();

                    
                    const arrowHeadFeature = this.features.get(idVal + "_head");
                    if (arrowHeadFeature) {
                        const newAngle = Math.atan2(coordinates[1][1] - coordinates[0][1], coordinates[1][0] - coordinates[0][0]);
                        arrowHeadFeature.setGeometry(new Point(coordinates[1]));
                        arrowHeadFeature.set("angle", newAngle);
                        arrowHeadFeature.changed();
                    }
                }
            }
        };

        this.transformInteraction.on("scaleend", saveChanges);
        this.transformInteraction.on("translateend", saveChanges);
        this.transformInteraction.on("rotateend", saveChanges);
        this.mapView?.addInteraction(this.transformInteraction);
    }

    public stopEdit(): void {
        if (this.transformInteraction) {
            this.mapView?.removeInteraction(this.transformInteraction);
            this.transformInteraction = null;
        }
        this.editingFeature = null;
        this.onEditCompleteCallback = null;
    }

    public addArrow(data: ArrowDrawData): void {
        const start = fromLonLat(data.startPoint);
        const end = fromLonLat(data.endPoint);

        const line = new LineString([start, end]);
        const lineFeature = new Feature({
            geometry: line,
            id: data.id,
            startPoint: data.startPoint,
            endPoint: data.endPoint,
            type: 'line'
        });
        lineFeature.set("color", data.color || this.defaultColor);
        lineFeature.set("width", data.width || this.defaultWidth);
        lineFeature.set("style", data.style || this.defaultStyle);

        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

        const arrowPoint = new Point(end);
        const arrowFeature = new Feature({
            geometry: arrowPoint,
            id: data.id + "_head",
            parentId: data.id,
            type: 'arrowHead',
            angle: angle,
            color: data.color || this.defaultColor,
            headSize: data.headSize || this.defaultHeadSize
        });

        this.source?.addFeature(lineFeature);
        this.source?.addFeature(arrowFeature);
        this.features.set(data.id, lineFeature);
        this.features.set(data.id + "_head", arrowFeature);
    }

    public removeArrow(id: string): void {
        const lineFeature = this.features.get(id);
        if (lineFeature) {
            this.source?.removeFeature(lineFeature);
            this.features.delete(id);
        }
        const arrowHeadFeature = this.features.get(id + "_head");
        if (arrowHeadFeature) {
            this.source?.removeFeature(arrowHeadFeature);
            this.features.delete(id + "_head");
        }
        if (this.editingFeature === lineFeature) {
            this.stopEdit();
        }
    }

    public getAllArrows(): ArrowDrawData[] {
        const result: ArrowDrawData[] = [];
        this.features.forEach((feature, id) => {
            if (!id.toString().endsWith("_head") && feature.get("startPoint")) {
                result.push({
                    id: id.toString(),
                    startPoint: feature.get("startPoint"),
                    endPoint: feature.get("endPoint"),
                    color: feature.get("color"),
                    width: feature.get("width"),
                    style: feature.get("style"),
                    headSize: feature.get("headSize"),
                });
            }
        });
        return result;
    }

    public getArrow(id: string): ArrowDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            startPoint: feature.get("startPoint"),
            endPoint: feature.get("endPoint"),
            color: feature.get("color"),
            width: feature.get("width"),
            style: feature.get("style"),
            headSize: feature.get("headSize"),
        };
    }

    public updateArrowStyle(
        id: string,
        color: number[],
        width: number,
        style: "solid" | "dashed",
        headSize: number
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("color", color);
        feature.set("width", width);
        feature.set("style", style);
        feature.set("headSize", headSize);
        feature.changed();

        
        const arrowHeadFeature = this.features.get(id + "_head");
        if (arrowHeadFeature) {
            arrowHeadFeature.set("color", color);
            arrowHeadFeature.set("headSize", headSize);
            arrowHeadFeature.changed();
        }
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

    public updateData(data: { arrows?: ArrowDrawData[] }): void {
        if (data.arrows) {
            this.clearAll();
            data.arrows.forEach((arrow) => this.addArrow(arrow));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}