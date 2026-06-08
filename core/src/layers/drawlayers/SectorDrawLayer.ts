import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";
import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";
import { LineString, Point } from "ol/geom";
import CircleStyle from "ol/style/Circle";

export interface SectorDrawData {
    id: string;
    center: [number, number];
    radius: number;
    startAngle: number;
    endAngle: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
    outlineStyle?: "solid" | "dashed";
}

export class SectorDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFillColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private defaultOutlineStyle: "solid" | "dashed";
    private onDrawCompleteCallback: ((data: SectorDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: SectorDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;
    private tempPoints: [number, number][] = [];

    constructor(id: string, name: string, options?: {
        defaultFillColor?: number[];
        defaultOutlineColor?: number[];
        defaultOutlineWidth?: number;
        defaultOutlineStyle?: "solid" | "dashed";
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.SECTOR_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFillColor = options?.defaultFillColor || [33, 150, 243, 0.3];
        this.defaultOutlineColor = options?.defaultOutlineColor || [33, 150, 243, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 2;
        this.defaultOutlineStyle = options?.defaultOutlineStyle || "solid";
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.SECTOR_DRAW },
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

    private createSectorGeometry(
        center: [number, number],
        radius: number,
        startAngle: number,
        endAngle: number,
        segments: number = 64
    ): Polygon {
        const points: [number, number][] = [[center[0], center[1]]];

        let start = startAngle;
        let end = endAngle;
        if (start > end) {
            end += 2 * Math.PI;
        }

        const angleStep = (end - start) / segments;

        for (let i = 0; i <= segments; i++) {
            const angle = start + i * angleStep;
            const x = center[0] + radius * Math.cos(angle);
            const y = center[1] + radius * Math.sin(angle);
            points.push([x, y]);
        }

        points.push([center[0], center[1]]);
        return new Polygon([points]);
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: SectorDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;

        const tempSource = new VectorSource();

        this.drawInteraction = new Draw({
            source: tempSource,
            type: "LineString",
            maxPoints: 3,
            freehand: false,
            style: new Style({
                stroke: new Stroke({
                    color: arrayToRgba(this.defaultOutlineColor),
                    width: this.defaultOutlineWidth,
                    lineDash: this.defaultOutlineStyle === "dashed" ? [10, 10] : undefined,
                }),
            }),
        });

        this.drawInteraction.on("drawend", (event: any) => {
            const geometry = event.feature.getGeometry();
            if (geometry instanceof LineString) {
                const coordinates = geometry.getCoordinates();
                if (coordinates.length === 3) {
                    const pointA = coordinates[0] as [number, number];
                    const center = coordinates[1] as [number, number];
                    const pointB = coordinates[2] as [number, number];
                    const dx1 = pointA[0] - center[0];
                    const dy1 = pointA[1] - center[1];
                    const radius = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                    const angleA = Math.atan2(dy1, dx1);
                    const dx2 = pointB[0] - center[0];
                    const dy2 = pointB[1] - center[1];
                    let angleB = Math.atan2(dy2, dx2);
                    let angleDiff = angleB - angleA;
                    if (angleDiff < 0) {
                        angleDiff += 2 * Math.PI;
                    }
                    if (angleDiff > Math.PI) {
                        angleDiff = 2 * Math.PI - angleDiff;
                        const actualStartAngle = angleB;
                        const actualEndAngle = angleB + angleDiff;
                        const id = generateId("sector_");
                        const [centerLng, centerLat] = toLonLat(center);
                        const sector = this.createSectorGeometry(
                            [center[0], center[1]],
                            radius,
                            actualStartAngle,
                            actualEndAngle
                        );
                        const feature = new Feature({
                            geometry: sector,
                            id: id,
                            center: [centerLng, centerLat],
                            radius: radius,
                            startAngle: actualStartAngle,
                            endAngle: actualEndAngle,
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
                                center: [centerLng, centerLat],
                                radius: radius,
                                startAngle: actualStartAngle,
                                endAngle: actualEndAngle,
                                fillColor: this.defaultFillColor,
                                outlineColor: this.defaultOutlineColor,
                                outlineWidth: this.defaultOutlineWidth,
                                outlineStyle: this.defaultOutlineStyle,
                            });
                        }
                    } else {
                        const actualStartAngle = angleA;
                        const actualEndAngle = angleA + angleDiff;
                        const id = generateId("sector_");
                        const [centerLng, centerLat] = toLonLat(center);
                        const sector = this.createSectorGeometry(
                            [center[0], center[1]],
                            radius,
                            actualStartAngle,
                            actualEndAngle
                        );
                        const feature = new Feature({
                            geometry: sector,
                            id: id,
                            center: [centerLng, centerLat],
                            radius: radius,
                            startAngle: actualStartAngle,
                            endAngle: actualEndAngle,
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
                                center: [centerLng, centerLat],
                                radius: radius,
                                startAngle: actualStartAngle,
                                endAngle: actualEndAngle,
                                fillColor: this.defaultFillColor,
                                outlineColor: this.defaultOutlineColor,
                                outlineWidth: this.defaultOutlineWidth,
                                outlineStyle: this.defaultOutlineStyle,
                            });
                        }
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

    public startEdit(id: string, onComplete?: (data: SectorDrawData) => void): void {
        this.stopEdit();
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }
        this.editingFeature = targetFeature;
        this.onEditCompleteCallback = onComplete || null;
        const savedStartAngle = targetFeature.get("startAngle") || 0;
        const savedEndAngle = targetFeature.get("endAngle") || Math.PI * 2;
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
                const radius = Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 2;
                const [lng, lat] = toLonLat([centerX, centerY]);
                targetFeature.set("center", [lng, lat]);
                targetFeature.set("radius", radius);
                targetFeature.set("startAngle", savedStartAngle);
                targetFeature.set("endAngle", savedEndAngle);
                targetFeature.changed();
                const idVal = targetFeature.get("id");
                if (this.onEditCompleteCallback && idVal) {
                    this.onEditCompleteCallback({
                        id: idVal,
                        center: [lng, lat],
                        radius: radius,
                        startAngle: savedStartAngle,
                        endAngle: savedEndAngle,
                        fillColor: targetFeature.get("fillColor"),
                        outlineColor: targetFeature.get("outlineColor"),
                        outlineWidth: targetFeature.get("outlineWidth"),
                        outlineStyle: targetFeature.get("outlineStyle"),
                    });
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

    public addSector(data: SectorDrawData): void {
        const center = fromLonLat(data.center);
        const sector = this.createSectorGeometry(
            [center[0], center[1]],
            data.radius,
            data.startAngle,
            data.endAngle
        );

        const feature = new Feature({
            geometry: sector,
            id: data.id,
            center: data.center,
            radius: data.radius,
            startAngle: data.startAngle,
            endAngle: data.endAngle,
        });
        feature.set("fillColor", data.fillColor || this.defaultFillColor);
        feature.set("outlineColor", data.outlineColor || this.defaultOutlineColor);
        feature.set("outlineWidth", data.outlineWidth || this.defaultOutlineWidth);
        feature.set("outlineStyle", data.outlineStyle || this.defaultOutlineStyle);

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeSector(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllSectors(): SectorDrawData[] {
        const result: SectorDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id: id.toString(),
                center: feature.get("center"),
                radius: feature.get("radius"),
                startAngle: feature.get("startAngle") || 0,
                endAngle: feature.get("endAngle") || Math.PI * 2,
                fillColor: feature.get("fillColor"),
                outlineColor: feature.get("outlineColor"),
                outlineWidth: feature.get("outlineWidth"),
                outlineStyle: feature.get("outlineStyle"),
            });
        });
        return result;
    }

    public getSector(id: string): SectorDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            center: feature.get("center"),
            radius: feature.get("radius"),
            startAngle: feature.get("startAngle") || 0,
            endAngle: feature.get("endAngle") || Math.PI * 2,
            fillColor: feature.get("fillColor"),
            outlineColor: feature.get("outlineColor"),
            outlineWidth: feature.get("outlineWidth"),
            outlineStyle: feature.get("outlineStyle"),
        };
    }

    public updateSectorStyle(
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

    public updateData(data: { sectors?: SectorDrawData[] }): void {
        if (data.sectors) {
            this.clearAll();
            data.sectors.forEach((sector) => this.addSector(sector));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}