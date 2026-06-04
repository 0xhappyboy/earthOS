import Feature from "ol/Feature";
import Circle from "ol/geom/Circle";
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
import { LayerTypeEnum, CircleDrawData } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export class CircleDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private onDrawCompleteCallback: ((data: CircleDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: CircleDrawData) => void) | null = null;
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
        super(id, name, LayerTypeEnum.CIRCLE_DRAW, options);
        this.defaultFillColor = options?.defaultFillColor || [255, 0, 0, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [255, 0, 0, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 3;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: this.createStyle.bind(this),
            properties: { id, name, type: LayerTypeEnum.CIRCLE_DRAW },
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

    public startDraw(onComplete?: (data: CircleDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        const tempSource = new VectorSource();
        this.drawInteraction = new Draw({
            source: tempSource,
            type: "Circle",
            style: this.createStyle(),
        });
        this.drawInteraction.on("drawend", (event: any) => {
            const feature = event.feature.clone();
            const geometry = feature.getGeometry();
            const id = generateId("circle_");
            if (geometry instanceof Circle) {
                const center = toLonLat(geometry.getCenter());
                feature.set("id", id);
                feature.setStyle(this.createStyle());
                this.source?.addFeature(feature);
                this.features.set(id, feature);
                this.layer?.setZIndex(999);

                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        center: [center[0], center[1]],
                        radius: geometry.getRadius(),
                        fillColor: this.defaultFillColor,
                        outlineColor: this.defaultOutlineColor,
                        outlineWidth: this.defaultOutlineWidth,
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

    public startEdit(id: string, onComplete?: (data: CircleDrawData) => void): void {
        this.stopEdit();

        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.error(`Circle with id ${id} not found`);
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
            keepAspectRatio: () => true,
        });
        this.transformInteraction.setActive(true);
        this.transformInteraction.on("select", () => {
            this.transformInteraction?.setActive(true);
        });
        this.transformInteraction.on("scaleend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Circle) {
                const center = toLonLat(geometry.getCenter());
                const id = targetFeature.get("id");
                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [center[0], center[1]],
                        radius: geometry.getRadius(),
                    });
                }
            }
        });
        this.transformInteraction.on("translateend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Circle) {
                const center = toLonLat(geometry.getCenter());
                const id = targetFeature.get("id");
                if (this.onEditCompleteCallback && id) {
                    this.onEditCompleteCallback({
                        id: id,
                        center: [center[0], center[1]],
                        radius: geometry.getRadius(),
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

    public addCircle(data: CircleDrawData): void {
        const center = fromLonLat(data.center);
        const circle = new Circle(center, data.radius);
        const feature = new Feature({
            geometry: circle,
            id: data.id,
        });
        feature.setStyle(this.createStyle());
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeCircle(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllCircles(): CircleDrawData[] {
        const result: CircleDrawData[] = [];
        this.features.forEach((feature, id) => {
            const geometry = feature.getGeometry();
            if (geometry instanceof Circle) {
                const center = toLonLat(geometry.getCenter());
                result.push({
                    id,
                    center: [center[0], center[1]],
                    radius: geometry.getRadius(),
                });
            }
        });
        return result;
    }

    public getCircle(id: string): CircleDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        const geometry = feature.getGeometry();
        if (geometry instanceof Circle) {
            const center = toLonLat(geometry.getCenter());
            return {
                id,
                center: [center[0], center[1]],
                radius: geometry.getRadius(),
            };
        }
        return undefined;
    }

    public updateCircleStyle(id: string, fillColor: number[], outlineColor: number[], outlineWidth: number, outlineStyle: "solid" | "dashed"): void {
        const lineDash = outlineStyle === "dashed" ? [10, 10] : [0];
        (this.layer as VectorLayer<VectorSource>).setStyle(
            new Style({
                fill: new Fill({ color: arrayToRgba(fillColor) }),
                stroke: new Stroke({
                    color: arrayToRgba(outlineColor),
                    width: outlineWidth,
                    lineDash: lineDash,
                }),
            })
        );
        const feature = this.features.get(id);
        if (feature) feature.changed();
    }

    public stopDraw(): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = null;
    }

    public clearAllCircles(): void {
        this.clear();
        this.features.clear();
        this.stopEdit();
    }

    public updateData(data: { circles?: CircleDrawData[] }): void {
        if (data.circles) {
            this.clearAllCircles();
            data.circles.forEach((circle) => this.addCircle(circle));
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