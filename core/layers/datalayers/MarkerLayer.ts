import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, MarkerData } from "../../types";
import { arrayToRgba } from "../../utils";

export class MarkerLayer extends BaseLayer {
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultSize: number;

    constructor(
        id: string,
        name: string,
        options?: { defaultColor?: number[]; defaultSize?: number; visible?: boolean; opacity?: number; zIndex?: number }
    ) {
        super(id, name, LayerTypeEnum.MARKER, options);
        this.defaultColor = options?.defaultColor || [255, 0, 0, 0.8];
        this.defaultSize = options?.defaultSize || 12;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.MARKER },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public addMarker(data: MarkerData): void {
        const feature = new Feature({
            geometry: new Point(fromLonLat([data.longitude, data.latitude])),
            id: data.id,
            title: data.title,
            popupContent: data.popupContent,
        });

        const color = data.color || this.defaultColor;
        const size = data.size || this.defaultSize;

        feature.setStyle(
            new Style({
                image: new CircleStyle({
                    radius: size / 2,
                    fill: new Fill({ color: arrayToRgba(color) }),
                    stroke: new Stroke({ color: "#fff", width: 2 }),
                }),
            })
        );

        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeMarker(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
        }
    }

    public updateMarkerPosition(id: string, longitude: number, latitude: number): void {
        const feature = this.features.get(id);
        if (feature) {
            feature.setGeometry(new Point(fromLonLat([longitude, latitude])));
        }
    }

    public getAllMarkers(): MarkerData[] {
        const result: MarkerData[] = [];
        this.features.forEach((feature, id) => {
            const geom = feature.getGeometry() as Point;
            const coords = toLonLat(geom.getCoordinates());
            result.push({
                id,
                longitude: coords[0],
                latitude: coords[1],
                title: feature.get("title"),
                popupContent: feature.get("popupContent"),
            });
        });
        return result;
    }

    public updateData(data: { markers?: MarkerData[] }): void {
        if (data.markers) {
            this.clear();
            data.markers.forEach((marker) => this.addMarker(marker));
        }
    }
}