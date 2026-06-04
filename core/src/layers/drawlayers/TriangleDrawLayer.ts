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

export interface TriangleDrawData {
    id: string;
    center: [number, number];
    size: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export class TriangleDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private onDrawCompleteCallback: ((data: TriangleDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: TriangleDrawData) => void) | null = null;
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
        super(id, name, LayerTypeEnum.TRIANGLE_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFillColor = options?.defaultFillColor || [255, 255, 0, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [255, 255, 0, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 1;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: this.createStyle.bind(this),
            properties: { id, name, type: LayerTypeEnum.TRIANGLE_DRAW },
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

    private createEquilateralTriangle(center: [number, number], size: number): [number, number][] {
        const height = size * Math.sqrt(3) / 2;
        return [
            [center[0], center[1] + height / 2],
            [center[0] - size / 2, center[1] - height / 2],
            [center[0] + size / 2, center[1] - height / 2],
            [center[0], center[1] + height / 2],
        ];
    }

    public startDraw(onComplete?: (data: TriangleDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        let points: [number, number][] = [];
        this.drawInteraction = new Draw({
            source: this.source!,
            type: "LineString",
            maxPoints: 2,
            geometryFunction: (coordinates, geometry) => {
                points = coordinates as [number, number][];
                if (points.length < 2) {
                    if (!geometry) {
                        geometry = new Polygon([[[0, 0], [0, 0], [0, 0], [0, 0]]]);
                    }
                    return geometry;
                }
                const p1 = points[0];
                const p2 = points[1];
                const dx = p2[0] - p1[0];
                const dy = p2[1] - p1[1];
                const sideLength = Math.sqrt(dx * dx + dy * dy);
                if (sideLength < 0.001) {
                    if (!geometry) {
                        geometry = new Polygon([[[0, 0], [0, 0], [0, 0], [0, 0]]]);
                    }
                    return geometry;
                }
                const midX = (p1[0] + p2[0]) / 2;
                const midY = (p1[1] + p2[1]) / 2;
                const height = sideLength * Math.sqrt(3) / 2;
                let perpX = -dy;
                let perpY = dx;
                const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
                if (perpLen > 0) {
                    perpX /= perpLen;
                    perpY /= perpLen;
                }
                const topX = midX + perpX * height;
                const topY = midY + perpY * height;
                const ring = [
                    [topX, topY],
                    [p1[0], p1[1]],
                    [p2[0], p2[1]],
                    [topX, topY],
                ];
                if (!geometry) {
                    geometry = new Polygon([ring]);
                } else {
                    geometry.setCoordinates([ring]);
                }
                return geometry;
            },
            style: this.createStyle(),
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            const id = generateId("triangle_");

            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const size = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
                const [lng, lat] = toLonLat([centerX, centerY]);

                feature.set("id", id);
                feature.set("center", [lng, lat]);
                feature.set("size", size);
                feature.setStyle(this.createStyle());
                this.features.set(id, feature);
                this.layer?.setZIndex(999);

                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        center: [lng, lat],
                        size,
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

    public startEdit(id: string, onComplete?: (data: TriangleDrawData) => void): void {
        this.stopEdit();

        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.error(`Triangle with id ${id} not found`);
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
                const size = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
                const [lng, lat] = toLonLat([centerX, centerY]);
                const id = targetFeature.get("id");

                const newTriangle = this.createEquilateralTriangle([centerX, centerY], size);
                const newPolygon = new Polygon([newTriangle]);
                targetFeature.setGeometry(newPolygon);

                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [lng, lat],
                        size,
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
                const size = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
                const [lng, lat] = toLonLat([centerX, centerY]);
                const id = targetFeature.get("id");
                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [lng, lat],
                        size,
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

    public addTriangle(data: TriangleDrawData): void {
        const center = fromLonLat(data.center) as [number, number];
        const triangleCoords = this.createEquilateralTriangle(center, data.size);
        const polygon = new Polygon([triangleCoords]);
        const feature = new Feature({
            geometry: polygon,
            id: data.id,
            center: data.center,
            size: data.size,
        });
        feature.setStyle(this.createStyle());
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeTriangle(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllTriangles(): TriangleDrawData[] {
        const result: TriangleDrawData[] = [];
        this.features.forEach((feature, id) => {
            const geometry = feature.getGeometry();
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const size = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
                const [lng, lat] = toLonLat([centerX, centerY]);
                result.push({
                    id,
                    center: [lng, lat],
                    size,
                });
            }
        });
        return result;
    }

    public getTriangle(id: string): TriangleDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        const geometry = feature.getGeometry();
        if (geometry instanceof Polygon) {
            const extent = geometry.getExtent();
            const centerX = (extent[0] + extent[2]) / 2;
            const centerY = (extent[1] + extent[3]) / 2;
            const size = Math.max(extent[2] - extent[0], extent[3] - extent[1]);
            const [lng, lat] = toLonLat([centerX, centerY]);
            return {
                id,
                center: [lng, lat],
                size,
            };
        }
        return undefined;
    }

    public updateTriangleStyle(
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

    public clearAllTriangles(): void {
        this.clear();
        this.features.clear();
        this.stopEdit();
    }

    public updateData(data: { triangles?: TriangleDrawData[] }): void {
        if (data.triangles) {
            this.clearAllTriangles();
            data.triangles.forEach((triangle) => this.addTriangle(triangle));
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