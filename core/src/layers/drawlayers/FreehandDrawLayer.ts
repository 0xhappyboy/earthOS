// FreehandDrawLayer.ts - 完全简化版本

import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import Draw from "ol/interaction/Draw";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface FreehandDrawData {
    id: string;
    points: [number, number][];
    isPolygon: boolean;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
    outlineStyle?: "solid" | "dashed";
}

export class FreehandDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private defaultOutlineStyle: "solid" | "dashed";
    private onDrawCompleteCallback: ((data: FreehandDrawData) => void) | null = null;
    private mapView: any = null;

    constructor(id: string, name: string, options?: {
        defaultFillColor?: number[];
        defaultOutlineColor?: number[];
        defaultOutlineWidth?: number;
        defaultOutlineStyle?: "solid" | "dashed";
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.FREEHAND_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFillColor = options?.defaultFillColor || [76, 175, 80, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [76, 175, 80, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 3;
        this.defaultOutlineStyle = options?.defaultOutlineStyle || "solid";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.FREEHAND_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const isPolygon = feature?.get("isPolygon") || false;
        const fillColor = feature?.get("fillColor") || this.defaultFillColor;
        const outlineColor = feature?.get("outlineColor") || this.defaultOutlineColor;
        const outlineWidth = feature?.get("outlineWidth") || this.defaultOutlineWidth;
        const outlineStyle = feature?.get("outlineStyle") || this.defaultOutlineStyle;
        const lineDash = outlineStyle === "dashed" ? [10, 10] : undefined;

        if (isPolygon) {
            return new Style({
                fill: new Fill({ color: arrayToRgba(fillColor) }),
                stroke: new Stroke({
                    color: arrayToRgba(outlineColor),
                    width: outlineWidth,
                    lineDash: lineDash,
                }),
            });
        }

        return new Style({
            stroke: new Stroke({
                color: arrayToRgba(outlineColor),
                width: outlineWidth,
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



    public startDraw(isPolygon: boolean, onComplete?: (data: FreehandDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        const tempSource = new VectorSource();
        const drawStyle = new Style({
            stroke: new Stroke({
                color: arrayToRgba(this.defaultOutlineColor),
                width: this.defaultOutlineWidth,
                lineDash: this.defaultOutlineStyle === "dashed" ? [10, 10] : undefined,
            }),
            fill: new Fill({
                color: arrayToRgba(this.defaultFillColor),
            }),
        });
        this.drawInteraction = new Draw({
            source: tempSource,
            type: isPolygon ? "Polygon" : "LineString",
            style: drawStyle,
        });
        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature.clone();
            const geometry = feature.getGeometry();
            const id = generateId("freehand_");
            const isPolygonGeom = geometry instanceof Polygon;

            let points: [number, number][] = [];

            if (geometry instanceof LineString) {
                const coords = geometry.getCoordinates();
                for (let i = 0; i < coords.length; i++) {
                    const [lng, lat] = toLonLat(coords[i]);
                    points.push([lng, lat]);
                }
            } else if (geometry instanceof Polygon) {
                const coords = geometry.getCoordinates()[0];
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lng, lat] = toLonLat(coords[i]);
                    points.push([lng, lat]);
                }
            }


            tempSource.clear();


            feature.setId(id);
            feature.set("id", id);
            feature.set("isPolygon", isPolygonGeom);
            feature.set("points", points);
            feature.set("fillColor", this.defaultFillColor);
            feature.set("outlineColor", this.defaultOutlineColor);
            feature.set("outlineWidth", this.defaultOutlineWidth);
            feature.set("outlineStyle", this.defaultOutlineStyle);


            this.source?.addFeature(feature);
            this.features.set(id, feature);
            this.layer?.setZIndex(999);

            if (this.onDrawCompleteCallback) {
                this.onDrawCompleteCallback({
                    id,
                    points,
                    isPolygon: isPolygonGeom,
                    fillColor: this.defaultFillColor,
                    outlineColor: this.defaultOutlineColor,
                    outlineWidth: this.defaultOutlineWidth,
                    outlineStyle: this.defaultOutlineStyle,
                });
            }

            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
            this.onDrawCompleteCallback = null;
            this.mapView?.render();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public startEdit(id: string, onComplete?: (data: FreehandDrawData) => void): void {

        if (onComplete) {
            const feature = this.features.get(id);
            if (feature) {
                onComplete({
                    id,
                    points: feature.get("points"),
                    isPolygon: feature.get("isPolygon"),
                });
            }
        }
    }

    public stopEdit(): void {

    }



    public addFreehand(data: FreehandDrawData): void {


        if (!this.source) {
            console.error('No source available in addFreehand');
            return;
        }

        const points: [number, number][] = [];
        for (let i = 0; i < data.points.length; i++) {
            const p = data.points[i];
            const [x, y] = fromLonLat(p);
            points.push([x, y]);
        }

        let feature: Feature;
        const featureId = data.id || generateId("freehand_");

        if (data.isPolygon && points.length >= 3) {
            const ring = [...points, points[0]];
            const polygon = new Polygon([ring]);
            feature = new Feature({
                geometry: polygon,
                id: featureId,
                isPolygon: true,
                points: data.points
            });
        } else {
            const line = new LineString(points);
            feature = new Feature({
                geometry: line,
                id: featureId,
                isPolygon: false,
                points: data.points
            });
        }
        feature.set("fillColor", data.fillColor || this.defaultFillColor);
        feature.set("outlineColor", data.outlineColor || this.defaultOutlineColor);
        feature.set("outlineWidth", data.outlineWidth || this.defaultOutlineWidth);
        feature.set("outlineStyle", data.outlineStyle || this.defaultOutlineStyle);
        this.source.addFeature(feature);
        this.features.set(featureId, feature);

    }



    public removeFreehand(id: string): void {
        const layerSource = this.layer?.getSource();
        if (!layerSource) {
            console.error('No layer source available');
            return;
        }
        let feature = this.features.get(id);
        if (!feature) {
            const allFeatures = layerSource.getFeatures();
            feature = allFeatures.find((f: any) => f.get('id') === id) || null;
        }
        if (feature) {
            layerSource.removeFeature(feature);
            this.features.delete(id);
        } else {
            console.warn('Feature not found with id:', id);
            return;
        }
        this.layer?.changed();
        if (this.mapView) {
            this.mapView.render();
        }
    }

    public getAllFreehands(): FreehandDrawData[] {
        const result: FreehandDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id,
                points: feature.get("points"),
                isPolygon: feature.get("isPolygon"),
                fillColor: feature.get("fillColor"),
                outlineColor: feature.get("outlineColor"),
                outlineWidth: feature.get("outlineWidth"),
                outlineStyle: feature.get("outlineStyle"),
            });
        });
        return result;
    }

    public getFreehand(id: string): FreehandDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) {
            console.warn(`Freehand feature with id ${id} not found`);
            return undefined;
        }
        let points = feature.get("points");
        if (!points || !Array.isArray(points)) {
            const geometry = feature.getGeometry();
            if (geometry instanceof LineString) {
                const coords = geometry.getCoordinates();
                points = coords.map(coord => {
                    const [lng, lat] = toLonLat(coord);
                    return [lng, lat];
                });
            } else if (geometry instanceof Polygon) {
                const coords = geometry.getCoordinates()[0];
                points = coords.slice(0, -1).map(coord => {
                    const [lng, lat] = toLonLat(coord);
                    return [lng, lat];
                });
            }
        }
        return {
            id,
            points: points || [],
            isPolygon: feature.get("isPolygon") || false,
            fillColor: feature.get("fillColor") || this.defaultFillColor,
            outlineColor: feature.get("outlineColor") || this.defaultOutlineColor,
            outlineWidth: feature.get("outlineWidth") || this.defaultOutlineWidth,
            outlineStyle: feature.get("outlineStyle") || this.defaultOutlineStyle,
        };
    }




    public updateFreehandStyle(
        id: string,
        fillColor: number[],
        outlineColor: number[],
        outlineWidth: number,
        outlineStyle: "solid" | "dashed"
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;

        feature.set("fillColor", fillColor);
        feature.set("outlineColor", outlineColor);
        feature.set("outlineWidth", outlineWidth);
        feature.set("outlineStyle", outlineStyle);


        feature.setStyle(undefined);
        feature.changed();

        if (this.mapView) {
            this.mapView.render();
        }
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
    }

    public isDrawActive(): boolean {
        return this.drawInteraction !== null;
    }

    public isEditActive(): boolean {
        return false;
    }

    public setEditable(editable: boolean): void {
        if (!editable) {
            this.stopDraw();
        }
    }

    public getEditingId(): string | null {
        return null;
    }

    public cancelDraw(): void {
        this.stopDraw();
    }

    public cancelEdit(): void {

    }

    public updateData(data: { freehands?: FreehandDrawData[] }): void {
        if (data.freehands) {
            this.clearAll();
            data.freehands.forEach((freehand) => this.addFreehand(freehand));
        }
    }

    public destroy(): void {
        this.stopDraw();
        super.destroy();
    }
}