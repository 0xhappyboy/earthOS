import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";
// @ts-ignore
import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface MarkerDrawData {
    id: string;
    position: [number, number];
    title?: string;
    description?: string;
    color?: number[];
    size?: number;
}

export class MarkerDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultSize: number;
    private onDrawCompleteCallback: ((data: MarkerDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: MarkerDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;

    constructor(id: string, name: string, options?: {
        defaultColor?: number[];
        defaultSize?: number;
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.MARKER_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultColor = options?.defaultColor || [255, 87, 34, 1];
        this.defaultSize = options?.defaultSize || 10;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.MARKER_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const color = feature?.get("color") || this.defaultColor;
        const size = feature?.get("size") || this.defaultSize;
        return new Style({
            image: new CircleStyle({
                radius: size / 2,
                fill: new Fill({ color: arrayToRgba(color) }),
                stroke: new Stroke({ color: "#fff", width: 2 }),
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

    public startDraw(onComplete?: (data: MarkerDrawData) => void): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onDrawCompleteCallback = onComplete || null;
        const tempSource = new VectorSource();
        this.drawInteraction = new Draw({
            source: tempSource, 
            type: "Point",
        });
        this.drawInteraction.on("drawend", (event: any) => {
            const geometry = event.feature.getGeometry();
            const id = generateId("marker_");

            if (geometry instanceof Point) {
                const [x, y] = geometry.getCoordinates();
                const [lng, lat] = toLonLat([x, y]);

                const feature = new Feature({
                    geometry: geometry.clone(),
                    id: id,
                    position: [lng, lat],
                });
                feature.set("color", this.defaultColor);
                feature.set("size", this.defaultSize);

                this.source?.addFeature(feature);
                this.features.set(id, feature);
                this.layer?.setZIndex(999);

                if (this.onDrawCompleteCallback) {
                    this.onDrawCompleteCallback({
                        id,
                        position: [lng, lat],
                        color: this.defaultColor,
                        size: this.defaultSize,
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

    public startEdit(id: string, onComplete?: (data: MarkerDrawData) => void): void {
        this.stopEdit();

        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            console.error(`Marker with id ${id} not found`);
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
            scale: false,
            rotate: false,
        });
        this.transformInteraction.setActive(true);

        this.transformInteraction.on("translateend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Point) {
                const [x, y] = geometry.getCoordinates();
                const [lng, lat] = toLonLat([x, y]);
                const idVal = targetFeature.get("id");
                if (this.onEditCompleteCallback && idVal) {
                    this.onEditCompleteCallback({
                        id: idVal,
                        position: [lng, lat],
                    });
                }
                targetFeature.set("position", [lng, lat]);
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

    public addMarker(data: MarkerDrawData): void {
        const point = fromLonLat(data.position);
        const feature = new Feature({
            geometry: new Point(point),
            id: data.id,
            position: data.position,
        });
        feature.set("color", data.color || this.defaultColor);
        feature.set("size", data.size || this.defaultSize);
        feature.set("title", data.title || "");
        feature.set("description", data.description || "");
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeMarker(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllMarkers(): MarkerDrawData[] {
        const result: MarkerDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id,
                position: feature.get("position"),
                title: feature.get("title"),
                description: feature.get("description"),
                color: feature.get("color"),
                size: feature.get("size"),
            });
        });
        return result;
    }

    public getMarker(id: string): MarkerDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            position: feature.get("position"),
            title: feature.get("title"),
            description: feature.get("description"),
            color: feature.get("color"),
            size: feature.get("size"),
        };
    }

    public updateMarkerStyle(id: string, color: number[], size: number): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("color", color);
        feature.set("size", size);
        feature.changed();
        this.mapView?.render();
    }

    public updateMarkerInfo(id: string, title: string, description: string): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("title", title);
        feature.set("description", description);
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

    public updateData(data: { markers?: MarkerDrawData[] }): void {
        if (data.markers) {
            this.clearAll();
            data.markers.forEach((marker) => this.addMarker(marker));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}