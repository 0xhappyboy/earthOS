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
import { LayerTypeEnum, PopupMarkerData } from "../../types";
import { arrayToRgba } from "../../utils";

export interface PopupMarkerLayerOptions {
    defaultColor?: number[];
    defaultSize?: number;
    popupWidth?: number;
    coverImageHeight?: number;
}

export class PopupMarkerLayer extends BaseLayer {
    private features: Map<string, Feature> = new Map();
    private defaultColor: number[];
    private defaultSize: number;
    private popupWidth: number;
    private coverImageHeight: number;
    private view: any = null;
    private currentPopup: HTMLDivElement | null = null;
    private currentFeature: Feature | null = null;

    constructor(
        id: string,
        name: string,
        options?: PopupMarkerLayerOptions & { visible?: boolean; opacity?: number; zIndex?: number }
    ) {
        super(id, name, LayerTypeEnum.MARKER, options);
        this.defaultColor = options?.defaultColor || [255, 0, 0, 0.8];
        this.defaultSize = options?.defaultSize || 12;
        this.popupWidth = options?.popupWidth || 260;
        this.coverImageHeight = options?.coverImageHeight || 120;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            properties: { id, name, type: LayerTypeEnum.MARKER },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    public setView(view: any): void {
        this.view = view;
        this.attachClickEvent();
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    private attachClickEvent(): void {
        if (!this.view) return;
        
        this.view.on("click", (event: any) => {
            const features = this.view.getFeaturesAtPixel(event.pixel);
            const feature = features?.find((f: any) => f.get("_popupLayer") === this.id);
            
            if (feature) {
                this.showPopup(feature, event);
            } else {
                this.hidePopup();
            }
        });
    }

    public addMarker(data: PopupMarkerData): void {
        const feature = new Feature({
            geometry: new Point(fromLonLat([data.longitude, data.latitude])),
            id: data.id,
            title: data.title,
            description: data.description,
            coverImage: data.coverImage,
            _popupLayer: this.id,
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
            if (this.currentFeature === feature) {
                this.hidePopup();
            }
        }
    }

    private showPopup(feature: Feature, event: any): void {
        this.hidePopup();
        this.currentFeature = feature;

        const attrs = feature.getProperties();
        const hasCover = attrs.coverImage && attrs.coverImage.trim() !== "";
        const hasTitle = attrs.title && attrs.title.trim() !== "";
        const hasDesc = attrs.description && attrs.description.trim() !== "";
        
        const theme = document.body.getAttribute("data-theme") || "dark";
        const isDark = theme === "dark";
        const bgColor = isDark ? "#1e1e1e" : "#ffffff";
        const borderColor = isDark ? "#333" : "#e0e0e0";
        const titleColor = isDark ? "#fff" : "#333";
        const descColor = isDark ? "#aaa" : "#666";

        const popupDiv = document.createElement("div");
        popupDiv.style.position = "absolute";
        popupDiv.style.zIndex = "10000";
        popupDiv.style.background = bgColor;
        popupDiv.style.border = `1px solid ${borderColor}`;
        popupDiv.style.borderRadius = "8px";
        popupDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        popupDiv.style.width = `${this.popupWidth}px`;
        popupDiv.style.maxWidth = `${this.popupWidth}px`;
        popupDiv.style.overflow = "hidden";

        let html = "";
        if (hasCover) {
            html += `<div style="height: ${this.coverImageHeight}px; overflow: hidden;">
                        <img src="${attrs.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                     </div>`;
        }
        html += `<div style="padding: 12px;">`;
        if (hasTitle) {
            html += `<div style="font-size: 14px; font-weight: 600; color: ${titleColor}; margin-bottom: 8px;">${attrs.title}</div>`;
        }
        if (hasDesc) {
            html += `<div style="font-size: 12px; color: ${descColor}; line-height: 1.5;">${attrs.description}</div>`;
        }
        html += `</div>`;

        popupDiv.innerHTML = html;

        const container = this.view.getContainer();
        container.style.position = "relative";
        container.appendChild(popupDiv);

        const geom = feature.getGeometry() as Point;
        const screen = this.view.getPixelFromCoordinate(geom.getCoordinates());

        const left = screen[0] - this.popupWidth / 2;
        const top = screen[1] - popupDiv.offsetHeight - 15;
        popupDiv.style.left = `${Math.max(10, Math.min(left, container.clientWidth - this.popupWidth - 10))}px`;
        popupDiv.style.top = `${Math.max(10, top)}px`;

        this.currentPopup = popupDiv;
    }

    private hidePopup(): void {
        if (this.currentPopup) {
            this.currentPopup.remove();
            this.currentPopup = null;
        }
        this.currentFeature = null;
    }

    public clearAllMarkers(): void {
        this.clear();
        this.features.clear();
        this.hidePopup();
    }

    public getAllMarkers(): PopupMarkerData[] {
        const result: PopupMarkerData[] = [];
        this.features.forEach((feature, id) => {
            const geom = feature.getGeometry() as Point;
            const coords = toLonLat(geom.getCoordinates());
            result.push({
                id,
                longitude: coords[0],
                latitude: coords[1],
                title: feature.get("title"),
                description: feature.get("description"),
                coverImage: feature.get("coverImage"),
            });
        });
        return result;
    }

    public updateData(data: { markers: PopupMarkerData[] }): void {
        if (data.markers) {
            this.clearAllMarkers();
            data.markers.forEach((marker) => this.addMarker(marker));
        }
    }
}