import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";
// @ts-ignore
import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";
import { Circle } from "ol/geom";

export interface RectangleDrawData {
    id: string;
    center: [number, number];
    width: number;
    height: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export class RectangleDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private onDrawCompleteCallback: ((data: RectangleDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: RectangleDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;

    constructor(id: string, name: string, options?: {
        defaultFillColor?: number[];
        defaultOutlineColor?: number[];
        defaultOutlineWidth?: number;
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.RECTANGLE_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFillColor = options?.defaultFillColor || [0, 0, 255, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [0, 0, 255, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 1;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: this.createStyle.bind(this),
            properties: { id, name, type: LayerTypeEnum.RECTANGLE_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private createStyle(): Style {
        return new Style({
            fill: new Fill({ color: arrayToRgba(this.defaultFillColor) }),
            stroke: new Stroke({
                color: arrayToRgba(this.defaultOutlineColor),
                width: this.defaultOutlineWidth,
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

    public startDraw(onComplete?: (data: RectangleDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        this.drawInteraction = new Draw({
            source: this.source!,
            type: "Circle",
            geometryFunction: (coordinates, geometry) => {
                if (!geometry) {
                    geometry = new Polygon([[[0, 0], [0, 0], [0, 0], [0, 0]]]);
                }
                if (coordinates && coordinates.length >= 2) {
                    const start = coordinates[0] as [number, number];
                    const end = coordinates[1] as [number, number];
                    const minX = Math.min(start[0], end[0]);
                    const maxX = Math.max(start[0], end[0]);
                    const minY = Math.min(start[1], end[1]);
                    const maxY = Math.max(start[1], end[1]);
                    const ring = [
                        [minX, minY],
                        [maxX, minY],
                        [maxX, maxY],
                        [minX, maxY],
                        [minX, minY],
                    ];
                    geometry.setCoordinates([ring]);
                }
                return geometry;
            },
            style: this.createStyle(),
        });
        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const id = generateId("rectangle_");
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const width = extent[2] - extent[0];
                const height = extent[3] - extent[1];
                const [lng, lat] = toLonLat([centerX, centerY]);
                feature.set("id", id);
                feature.set("center", [lng, lat]);
                feature.set("width", width);
                feature.set("height", height);
                feature.setStyle(this.createStyle());
                this.features.set(id, feature);
                this.layer?.setZIndex(999);
                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        center: [lng, lat],
                        width,
                        height,
                        fillColor: this.defaultFillColor,
                        outlineColor: this.defaultOutlineColor,
                        outlineWidth: this.defaultOutlineWidth,
                    });
                }
            }
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
            this.onDrawCompleteCallback = null;
            this.mapView?.render();
        });
        this.mapView?.addInteraction(this.drawInteraction);
    }

    public startEdit(id: string, onComplete?: (data: RectangleDrawData) => void): void {
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
            rotate: false,
            keepAspectRatio: () => false,
        });
        this.transformInteraction.setActive(true);
        this.transformInteraction.on("select", () => {
            this.transformInteraction?.setActive(true);
        });
        this.transformInteraction.on("scaleend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const width = extent[2] - extent[0];
                const height = extent[3] - extent[1];
                const [lng, lat] = toLonLat([centerX, centerY]);
                const id = targetFeature.get("id");
                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [lng, lat],
                        width,
                        height,
                    });
                }
            }
        });
        this.transformInteraction.on("translateend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const width = extent[2] - extent[0];
                const height = extent[3] - extent[1];
                const [lng, lat] = toLonLat([centerX, centerY]);
                const id = targetFeature.get("id");
                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [lng, lat],
                        width,
                        height,
                    });
                }
            }
        });
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

    public addRectangle(data: RectangleDrawData): void {
        const center = fromLonLat(data.center);
        const halfW = data.width / 2;
        const halfH = data.height / 2;
        const rings = [[
            [center[0] - halfW, center[1] - halfH],
            [center[0] + halfW, center[1] - halfH],
            [center[0] + halfW, center[1] + halfH],
            [center[0] - halfW, center[1] + halfH],
            [center[0] - halfW, center[1] - halfH],
        ]];
        const polygon = new Polygon(rings);
        const feature = new Feature({
            geometry: polygon,
            id: data.id,
            center: data.center,
            width: data.width,
            height: data.height,
        });
        feature.setStyle(this.createStyle());
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeRectangle(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllRectangles(): RectangleDrawData[] {
        const result: RectangleDrawData[] = [];
        this.features.forEach((feature, id) => {
            const geometry = feature.getGeometry();
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const width = extent[2] - extent[0];
                const height = extent[3] - extent[1];
                const [lng, lat] = toLonLat([centerX, centerY]);
                result.push({
                    id,
                    center: [lng, lat],
                    width,
                    height,
                });
            }
        });
        return result;
    }

    public getRectangle(id: string): RectangleDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        const geometry = feature.getGeometry();
        if (geometry instanceof Polygon) {
            const extent = geometry.getExtent();
            const centerX = (extent[0] + extent[2]) / 2;
            const centerY = (extent[1] + extent[3]) / 2;
            const width = extent[2] - extent[0];
            const height = extent[3] - extent[1];
            const [lng, lat] = toLonLat([centerX, centerY]);
            return {
                id,
                center: [lng, lat],
                width,
                height,
            };
        }
        return undefined;
    }

    public updateRectangleStyle(
        id: string,
        fillColor: number[],
        outlineColor: number[],
        outlineWidth: number,
        outlineStyle: "solid" | "dashed"
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;
        const lineDash = outlineStyle === "dashed" ? [10, 10] : undefined;
        feature.setStyle(new Style({
            fill: new Fill({ color: arrayToRgba(fillColor) }),
            stroke: new Stroke({
                color: arrayToRgba(outlineColor),
                width: outlineWidth,
                lineDash: lineDash,
            }),
        }));
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

    public clearAllRectangles(): void {
        this.clear();
        this.features.clear();
        this.stopEdit();
    }

    public updateData(data: { rectangles?: RectangleDrawData[] }): void {
        if (data.rectangles) {
            this.clearAllRectangles();
            data.rectangles.forEach((rectangle) => this.addRectangle(rectangle));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
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
}