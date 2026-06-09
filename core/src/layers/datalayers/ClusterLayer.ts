import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Cluster from "ol/source/Cluster";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import { fromLonLat } from "ol/proj";
import type { FeatureLike } from "ol/Feature";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, ClusterData } from "../../types";
import { arrayToRgba } from "../../utils";

export class ClusterLayer extends BaseLayer {
    private clusterSource: Cluster | null = null;
    private clusterLayer: VectorLayer<Cluster> | null = null;

    constructor(
        id: string,
        name: string,
        options?: {
            distance?: number;
            pointColor?: number[];
            clusterColor?: number[];
            visible?: boolean;
            opacity?: number;
            zIndex?: number;
        }
    ) {
        super(id, name, LayerTypeEnum.CLUSTER, {
            ...options,
            zIndex: options?.zIndex ?? 15,
        });
        this.source = new VectorSource();
        this.clusterSource = new Cluster({
            distance: options?.distance || 60,
            source: this.source,
        });

        this.clusterLayer = new VectorLayer({
            source: this.clusterSource,
            style: (feature: FeatureLike) => this.createStyle(feature),
            properties: { id, name, type: LayerTypeEnum.CLUSTER },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
        this.layer = this.clusterLayer;
    }

    private createStyle(feature: FeatureLike): Style {
        const features = feature.get("features");
        const size = features ? (features as Feature[]).length : 1;
        const isCluster = size > 1;

        const defaultPointColor = [255, 0, 0, 0.8];
        const defaultClusterColor = [0, 112, 255, 0.8];

        if (isCluster) {
            const radius = Math.min(40, 20 + size / 10);
            return new Style({
                image: new CircleStyle({
                    radius,
                    fill: new Fill({ color: arrayToRgba(defaultClusterColor) }),
                    stroke: new Stroke({ color: "#fff", width: 2 }),
                }),
                text: new Text({
                    text: size.toString(),
                    fill: new Fill({ color: "#fff" }),
                    font: "bold 14px sans-serif",
                }),
            });
        }

        return new Style({
            image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: arrayToRgba(defaultPointColor) }),
                stroke: new Stroke({ color: "#fff", width: 2 }),
            }),
        });
    }

    public createLayer(map: any): VectorLayer<Cluster> {
        if (!this.clusterLayer) {
            throw new Error("ClusterLayer not initialized");
        }
        map.addLayer(this.clusterLayer);
        return this.clusterLayer;
    }

    public setData(data: ClusterData[]): void {
        this.clear();
        if (!this.source) return;
        data.forEach((item) => {
            const feature = new Feature({
                geometry: new Point(fromLonLat([item.longitude, item.latitude])),
                id: item.id,
                title: item.title,
                popupContent: item.popupContent,
            });
            this.source?.addFeature(feature);
        });
    }

    public updateData(data: ClusterData[]): void {
        this.setData(data);
    }

    public getLayer(): VectorLayer<Cluster> | null {
        return this.clusterLayer;
    }

    public destroy(): void {
        if (this.clusterLayer) {
            const map = (this.clusterLayer as any).getMap?.();
            if (map && typeof map.removeLayer === 'function') {
                map.removeLayer(this.clusterLayer);
            }
            if (typeof this.clusterLayer.dispose === 'function') {
                this.clusterLayer.dispose();
            }
            this.clusterLayer = null;
        }
        this.clusterSource = null;
        super.destroy();
    }

    public getData(): ClusterData[] {
        const features: ClusterData[] = [];
        this.source?.forEachFeature((feature: Feature) => {
            const props = feature.getProperties();
            features.push({
                id: props.id,
                longitude: props.geometry?.getCoordinates()[0],
                latitude: props.geometry?.getCoordinates()[1],
                title: props.title,
                popupContent: props.popupContent
            });
        });
        return features;
    }
}