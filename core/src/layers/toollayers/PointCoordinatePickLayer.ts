import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import Draw from "ol/interaction/Draw";
import { toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";
import CircleStyle from "ol/style/Circle";
import { Translations } from "../../i18n";

export interface PointCoordinatePickData {
    id: string;
    longitude: number;
    latitude: number;
    timestamp: number;
}

export class PointCoordinatePickLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private picks: Map<string, PointCoordinatePickData> = new Map();
    private onCompleteCallback: ((data: PointCoordinatePickData) => void) | null = null;
    private mapView: any = null;
    private textColor: number[];
    private textSize: number;
    private features: Map<string, Feature> = new Map();
    private t: Translations | null;

    constructor(
        id: string,
        name: string,
        options?: {
            textColor?: number[];
            textSize?: number;
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
            t: Translations;
        }
    ) {
        super(id, name, LayerTypeEnum.POINT_COORDINATE_PICK, {
            ...options,
            zIndex: options?.zIndex ?? 50,
        });
        this.textColor = options?.textColor || [0, 200, 255, 1];
        this.textSize = options?.textSize || 12;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.POINT_COORDINATE_PICK },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
        this.t = options?.t || null;
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startPick(onComplete?: (data: PointCoordinatePickData) => void): void {
        this.stopPick();
        this.onCompleteCallback = onComplete || null;

        this.drawInteraction = new Draw({
            source: this.source!,
            type: "Point",
        });
        this.drawInteraction.on("drawend", (event: any) => {
            const drawnFeature = event.feature;
            const geometry = drawnFeature.getGeometry();
            const coordinates = geometry.getCoordinates();
            const [lng, lat] = toLonLat(coordinates);
            const id = generateId("coord_");
            const timestamp = Date.now();
            drawnFeature.setStyle(new Style({
                image: new CircleStyle({
                    radius: 6,
                    fill: new Fill({ color: "#00aaff" }),
                    stroke: new Stroke({ color: "#ffffff", width: 2 }),
                }),
            }));
            drawnFeature.set("id", id);
            drawnFeature.set("type", "point_pick");
            this.features.set(id, drawnFeature);
            const labelFeature = new Feature({
                geometry: new Point(coordinates),
                id: id + "_label",
                longitude: lng,
                latitude: lat,
                timestamp: timestamp,
            });
            labelFeature.set("type", "point_pick");
            labelFeature.setStyle(new Style({
                text: new Text({
                    text: this.t?.pointPick.label_text || 'Point Pick',
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
            this.source?.addFeature(labelFeature);
            this.features.set(id + "_label", labelFeature);
            const pickData: PointCoordinatePickData = { id, longitude: lng, latitude: lat, timestamp };
            this.picks.set(id, pickData);
            if (this.onCompleteCallback) {
                this.onCompleteCallback(pickData);
            }
            this.stopPick();
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }
    public stopPick(): void {
        if (this.drawInteraction) {
            this.mapView?.removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
        }
        this.onCompleteCallback = null;
    }
    public removeCoordinate(id: string): boolean {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
        const labelFeature = this.features.get(id + "_label");
        if (labelFeature) {
            this.source?.removeFeature(labelFeature);
            this.features.delete(id + "_label");
        }
        this.picks.delete(id);
        return true;
    }

    public clearAllCoordinates(): void {
        this.clear();
        this.features.clear();
        this.picks.clear();
        this.stopPick();
    }

    public getAllCoordinates(): PointCoordinatePickData[] {
        return Array.from(this.picks.values());
    }

    public getCoordinate(id: string): PointCoordinatePickData | undefined {
        return this.picks.get(id);
    }

    public highlightCoordinate(id: string): void {
        this.features.forEach((feature, fid) => {
            const isActive = fid === id;
            feature.setStyle(new Style({
                text: new Text({
                    text: this.t?.pointPick.label_text || 'Point Pick',
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(isActive ? [255, 170, 0, 1] : this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
        });
        this.mapView?.render();
    }

    public clearHighlight(): void {
        this.features.forEach((feature) => {
            feature.setStyle(new Style({
                text: new Text({
                    text: this.t?.pointPick.label_text || 'Point Pick',
                    font: `${this.textSize}px sans-serif`,
                    fill: new Fill({ color: arrayToRgba(this.textColor) }),
                    stroke: new Stroke({ color: "#000000", width: 2 }),
                    textAlign: "center",
                    textBaseline: "bottom",
                    offsetY: -10,
                }),
            }));
        });
        this.mapView?.render();
    }

    public stopDraw(): void {
        this.stopPick();
    }

    public isDrawActive(): boolean {
        return this.drawInteraction !== null;
    }

    public isEditActive(): boolean {
        return false;
    }

    public setEditable(editable: boolean): void {
        if (!editable) {
            this.stopPick();
        }
    }

    public stopEdit(): void {
        this.stopPick();
    }

    public getEditingId(): string | null {
        return null;
    }

    public cancelDraw(): void {
        this.stopPick();
    }

    public cancelEdit(): void {
        this.stopPick();
    }

    public updateData(data: any): void { }

    public destroy(): void {
        this.stopPick();
        super.destroy();
    }
}