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
import { LayerTypeEnum } from "../../types";
import { arrayToRgba } from "../../utils";

export interface MarkerLayerData {
    id: string;
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    coverImage?: string;
    color?: number[];
    size?: number;
    onClick?: (data: MarkerLayerData, event: any) => void;
    onContextMenu?: (data: MarkerLayerData, event: any) => void;
    onHover?: (data: MarkerLayerData, event: any) => void;
}

export interface MarkerLayerOptions {
    defaultColor?: number[];
    defaultSize?: number;
    popupWidth?: number;
    coverImageHeight?: number;
}

export class MarkerLayer extends BaseLayer {
    private moveHandler: (() => void) | null = null;
    private features: Map<string, Feature> = new Map();
    private markersData: Map<string, MarkerLayerData> = new Map();
    private defaultColor: number[];
    private defaultSize: number;
    private popupWidth: number;
    private coverImageHeight: number;
    private view: any = null;
    private currentPopup: HTMLDivElement | null = null;
    private currentFeature: Feature | null = null;
    private currentHoverTimeout: number | null = null;
    private needsUpdate: boolean = false;
    private animationFrameId: number | null = null;
    private postRenderHandler: (() => void) | null = null;
    private updateFrame: number | null = null;

    constructor(
        id: string,
        name: string,
        options?: MarkerLayerOptions & { visible?: boolean; opacity?: number; zIndex?: number }
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

    public setView(map: any): void {
        this.view = map;
        this.attachEvents();
        this.postRenderHandler = () => {
            this.updatePopupPosition();
        };
        this.view.on("postrender", this.postRenderHandler);
    }

    private scheduleUpdate(): void {
        if (this.animationFrameId !== null) return;

        this.animationFrameId = requestAnimationFrame(() => {
            if (this.needsUpdate) {
                this.updatePopupPosition();
                this.needsUpdate = false;
            }
            this.animationFrameId = null;
        });
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    private attachEvents(): void {
        if (!this.view) return;
        this.view.on("click", (event: any) => {
            const features = this.view.getFeaturesAtPixel(event.pixel);
            const feature = features?.find((f: any) => f.get("_popupLayer") === this.id);
            if (feature) {
                const id = feature.get("id");
                const markerData = this.markersData.get(id);
                if (markerData && markerData.onClick) {
                    markerData.onClick(markerData, event);
                }
                this.showPopup(feature, event);
            } else {
                this.hidePopup();
            }
        });
        this.view.on("contextmenu", (event: any) => {
            const features = this.view.getFeaturesAtPixel(event.pixel);
            const feature = features?.find((f: any) => f.get("_popupLayer") === this.id);
            if (feature) {
                event.preventDefault();
                const id = feature.get("id");
                const markerData = this.markersData.get(id);
                if (markerData && markerData.onContextMenu) {
                    markerData.onContextMenu(markerData, event);
                }
            }
        });
        this.view.on("pointermove", (event: any) => {
            const features = this.view.getFeaturesAtPixel(event.pixel);
            const feature = features?.find((f: any) => f.get("_popupLayer") === this.id);
            if (feature) {
                const targetElement = this.view.getTargetElement();
                if (targetElement) {
                    targetElement.style.cursor = 'pointer';
                }
                const id = feature.get("id");
                const markerData = this.markersData.get(id);
                if (markerData && markerData.onHover) {
                    if (this.currentHoverTimeout) {
                        clearTimeout(this.currentHoverTimeout);
                    }
                    this.currentHoverTimeout = window.setTimeout(() => {
                        if (markerData.onHover) {
                            markerData.onHover(markerData, event);
                        }
                        this.currentHoverTimeout = null;
                    }, 100);
                }
            } else {
                const targetElement = this.view.getTargetElement();
                if (targetElement) {
                    targetElement.style.cursor = '';
                }
                if (this.currentHoverTimeout) {
                    clearTimeout(this.currentHoverTimeout);
                    this.currentHoverTimeout = null;
                }
            }
        });
    }

    public addMarker(data: MarkerLayerData): void {
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
        this.markersData.set(data.id, data);
    }

    public removeMarker(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            this.markersData.delete(id);
            if (this.currentFeature === feature) {
                this.hidePopup();
            }
        }
    }

    public updateMarker(id: string, data: Partial<MarkerLayerData>): void {
        const feature = this.features.get(id);
        const existingData = this.markersData.get(id);
        if (!feature || !existingData) return;

        if (data.longitude !== undefined && data.latitude !== undefined) {
            feature.setGeometry(new Point(fromLonLat([data.longitude, data.latitude])));
        }

        if (data.title !== undefined) feature.set("title", data.title);
        if (data.description !== undefined) feature.set("description", data.description);
        if (data.coverImage !== undefined) feature.set("coverImage", data.coverImage);

        if (data.color !== undefined || data.size !== undefined) {
            const color = data.color || existingData.color || this.defaultColor;
            const size = data.size || existingData.size || this.defaultSize;
            feature.setStyle(
                new Style({
                    image: new CircleStyle({
                        radius: size / 2,
                        fill: new Fill({ color: arrayToRgba(color) }),
                        stroke: new Stroke({ color: "#fff", width: 2 }),
                    }),
                })
            );
        }

        this.markersData.set(id, { ...existingData, ...data });
        feature.changed();
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
        const container = this.view.getTargetElement();
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(popupDiv);
        const geom = feature.getGeometry() as Point;
        const screen = this.view.getPixelFromCoordinate(geom.getCoordinates());
        const containerRect = container.getBoundingClientRect();
        const popupWidth = popupDiv.offsetWidth;
        const popupHeight = popupDiv.offsetHeight;
        const isInViewport = screen[0] >= 0 && screen[0] <= containerRect.width &&
            screen[1] >= 0 && screen[1] <= containerRect.height;
        if (!isInViewport) {
            popupDiv.style.display = 'none';
            this.currentPopup = popupDiv;
            return;
        }
        let left = screen[0] - containerRect.left - popupWidth / 2;
        let top = screen[1] - containerRect.top - popupHeight - 15;
        if (top < 5) {
            top = screen[1] - containerRect.top + 15;
        }
        left = Math.max(5, Math.min(left, containerRect.width - popupWidth - 5));
        top = Math.max(5, Math.min(top, containerRect.height - popupHeight - 5));
        popupDiv.style.left = `${left}px`;
        popupDiv.style.top = `${top}px`;
        popupDiv.style.display = 'block';
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
        this.markersData.clear();
        this.hidePopup();
    }

    public getAllMarkers(): MarkerLayerData[] {
        const result: MarkerLayerData[] = [];
        this.markersData.forEach((data, id) => {
            result.push({ ...data });
        });
        return result;
    }

    public getMarker(id: string): MarkerLayerData | undefined {
        return this.markersData.get(id);
    }

    public updateData(data: { markers: MarkerLayerData[] }): void {
        if (data.markers) {
            this.clearAllMarkers();
            data.markers.forEach((marker) => this.addMarker(marker));
        }
    }

    private updatePopupPosition(): void {
        if (!this.currentPopup || !this.currentFeature) return;
        if (this.updateFrame) cancelAnimationFrame(this.updateFrame);
        this.updateFrame = requestAnimationFrame(() => {
            if (!this.currentPopup || !this.currentFeature) return;
            const geom = this.currentFeature.getGeometry() as Point;
            const screen = this.view.getPixelFromCoordinate(geom.getCoordinates());
            const container = this.view.getTargetElement();
            const containerRect = container.getBoundingClientRect();
            const popupWidth = this.currentPopup.offsetWidth;
            const popupHeight = this.currentPopup.offsetHeight;
            const isInViewport = screen[0] >= 0 && screen[0] <= containerRect.width &&
                screen[1] >= 0 && screen[1] <= containerRect.height;
            if (!isInViewport) {
                this.currentPopup.style.display = 'none';
                return;
            }
            this.currentPopup.style.display = 'block';
            let left = screen[0] - containerRect.left - popupWidth / 2;
            let top = screen[1] - containerRect.top - popupHeight - 15;
            left = Math.max(5, Math.min(left, containerRect.width - popupWidth - 5));
            top = Math.max(5, Math.min(top, containerRect.height - popupHeight - 5));
            this.currentPopup.style.left = `${left}px`;
            this.currentPopup.style.top = `${top}px`;
        });
    }

    public destroy(): void {
        if (this.updateFrame) {
            cancelAnimationFrame(this.updateFrame);
        }
        if (this.currentHoverTimeout) {
            clearTimeout(this.currentHoverTimeout);
            this.currentHoverTimeout = null;
        }
        if (this.view && this.postRenderHandler) {
            this.view.un("postrender", this.postRenderHandler);
            this.postRenderHandler = null;
        }
        super.destroy();
    }
}