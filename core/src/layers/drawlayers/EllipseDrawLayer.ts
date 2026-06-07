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

export interface EllipseDrawData {
    id: string;
    center: [number, number];
    radiusX: number;
    radiusY: number;
    rotation: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
    outlineStyle?: "solid" | "dashed";
}

export class EllipseDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private defaultOutlineStyle: "solid" | "dashed";
    private onDrawCompleteCallback: ((data: EllipseDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: EllipseDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
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
        super(id, name, LayerTypeEnum.ELLIPSE_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFillColor = options?.defaultFillColor || [156, 39, 176, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [156, 39, 176, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 2;
        this.defaultOutlineStyle = options?.defaultOutlineStyle || "solid";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.ELLIPSE_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const fillColor = feature?.get("fillColor") || this.defaultFillColor;
        const outlineColor = feature?.get("outlineColor") || this.defaultOutlineColor;
        const outlineWidth = feature?.get("outlineWidth") || this.defaultOutlineWidth;
        const outlineStyle = feature?.get("outlineStyle") || this.defaultOutlineStyle;
        const lineDash = outlineStyle === "dashed" ? [10, 10] : undefined;

        return new Style({
            fill: new Fill({ color: arrayToRgba(fillColor) }),
            stroke: new Stroke({
                color: arrayToRgba(outlineColor),
                width: outlineWidth,
                lineDash: lineDash,
            }),
        });
    }

    private createEllipsePoints(center: [number, number], radiusX: number, radiusY: number, rotation: number, segments: number = 64): [number, number][] {
        const points: [number, number][] = [];
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = center[0] + radiusX * Math.cos(angle);
            const y = center[1] + radiusY * Math.sin(angle);
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const rotatedX = center[0] + (x - center[0]) * cos - (y - center[1]) * sin;
            const rotatedY = center[1] + (x - center[0]) * sin + (y - center[1]) * cos;
            points.push([rotatedX, rotatedY]);
        }
        return points;
    }

    private createEllipseGeometry(center: [number, number], radiusX: number, radiusY: number, rotation: number): Polygon {
        const points = this.createEllipsePoints(center, radiusX, radiusY, rotation);
        return new Polygon([points]);
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: EllipseDrawData) => void): void {
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
                        geometry = new Polygon([[[0, 0], [0, 0], [0, 0], [0, 0]]]);
                    }
                    return geometry;
                }
                if (coordinates.length >= 2) {
                    startPoint = coordinates[0] as [number, number];
                    endPoint = coordinates[1] as [number, number];
                    const dx = endPoint[0] - startPoint[0];
                    const dy = endPoint[1] - startPoint[1];
                    const radiusX = Math.abs(dx) / 2;
                    const radiusY = Math.abs(dy) / 2;
                    const centerX = (startPoint[0] + endPoint[0]) / 2;
                    const centerY = (startPoint[1] + endPoint[1]) / 2;
                    const points = this.createEllipsePoints([centerX, centerY], radiusX, radiusY, 0);
                    if (!geometry) {
                        geometry = new Polygon([points]);
                    } else {
                        geometry.setCoordinates([points]);
                    }
                }
                return geometry;
            },
            style: this.getStyleForFeature(),
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const geometry = event.feature.getGeometry();
            const id = generateId("ellipse_");

            if (geometry instanceof Polygon && startPoint && endPoint) {
                const dx = endPoint[0] - startPoint[0];
                const dy = endPoint[1] - startPoint[1];
                const radiusX = Math.abs(dx) / 2;
                const radiusY = Math.abs(dy) / 2;
                const centerX = (startPoint[0] + endPoint[0]) / 2;
                const centerY = (startPoint[1] + endPoint[1]) / 2;
                const [lng, lat] = toLonLat([centerX, centerY]);

                const feature = new Feature({
                    geometry: geometry.clone(),
                    id: id,
                    center: [lng, lat],
                    radiusX,
                    radiusY,
                    rotation: 0,
                });
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
                        center: [lng, lat],
                        radiusX,
                        radiusY,
                        rotation: 0,
                        fillColor: this.defaultFillColor,
                        outlineColor: this.defaultOutlineColor,
                        outlineWidth: this.defaultOutlineWidth,
                        outlineStyle: this.defaultOutlineStyle,
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

    public startEdit(id: string, onComplete?: (data: EllipseDrawData) => void): void {
        this.stopEdit();

        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.error(`Ellipse with id ${id} not found`);
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
            if (geometry instanceof Polygon) {
                const extent = geometry.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                const radiusX = (extent[2] - extent[0]) / 2;
                const radiusY = (extent[3] - extent[1]) / 2;
                const [lng, lat] = toLonLat([centerX, centerY]);
                const idVal = targetFeature.get("id");
                if (this.onEditCompleteCallback && idVal) {
                    this.onEditCompleteCallback({
                        id: idVal,
                        center: [lng, lat],
                        radiusX,
                        radiusY,
                        rotation: 0,
                    });
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

    public addEllipse(data: EllipseDrawData): void {
        const center = fromLonLat(data.center);
        const centerArray: [number, number] = [center[0], center[1]];
        const points = this.createEllipsePoints(centerArray, data.radiusX, data.radiusY, data.rotation);
        const polygon = new Polygon([points]);
        const feature = new Feature({
            geometry: polygon,
            id: data.id,
            center: data.center,
            radiusX: data.radiusX,
            radiusY: data.radiusY,
            rotation: data.rotation,
        });
        feature.set("fillColor", data.fillColor || this.defaultFillColor);
        feature.set("outlineColor", data.outlineColor || this.defaultOutlineColor);
        feature.set("outlineWidth", data.outlineWidth || this.defaultOutlineWidth);
        feature.set("outlineStyle", data.outlineStyle || this.defaultOutlineStyle);
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeEllipse(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllEllipses(): EllipseDrawData[] {
        const result: EllipseDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id,
                center: feature.get("center"),
                radiusX: feature.get("radiusX"),
                radiusY: feature.get("radiusY"),
                rotation: feature.get("rotation") || 0,
                fillColor: feature.get("fillColor"),
                outlineColor: feature.get("outlineColor"),
                outlineWidth: feature.get("outlineWidth"),
                outlineStyle: feature.get("outlineStyle"),
            });
        });
        return result;
    }

    public getEllipse(id: string): EllipseDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            center: feature.get("center"),
            radiusX: feature.get("radiusX"),
            radiusY: feature.get("radiusY"),
            rotation: feature.get("rotation") || 0,
            fillColor: feature.get("fillColor"),
            outlineColor: feature.get("outlineColor"),
            outlineWidth: feature.get("outlineWidth"),
            outlineStyle: feature.get("outlineStyle"),
        };
    }

    public updateEllipseStyle(
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
        feature.setStyle(this.getStyleForFeature(feature));
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

    public updateData(data: { ellipses?: EllipseDrawData[] }): void {
        if (data.ellipses) {
            this.clearAll();
            data.ellipses.forEach((ellipse) => this.addEllipse(ellipse));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}