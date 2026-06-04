import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";

export interface PopupMarkerData {
    id: string;
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    coverImage?: string;
    color?: number[];
    size?: number;
}

export interface PopupMarkerLayerConfig extends LayerConfig {
    markers?: PopupMarkerData[];
    defaultColor?: number[];
    defaultSize?: number;
    popupWidth?: number;
    coverImageHeight?: number;
}

export class PopupMarkerLayer extends BaseLayer {
    private markers: Map<string, Graphic> = new Map();
    private pendingMarkers: PopupMarkerData[] = [];
    private defaultColor: number[];
    private defaultSize: number;
    private view: MapView | null = null;
    private currentPopupDiv: HTMLDivElement | null = null;
    private currentPopupGraphic: Graphic | null = null;
    private eventsAttached: boolean = false;
    private mapContainer: HTMLElement | null = null;
    private extentWatchHandle: any = null;

    private popupWidth: number;
    private coverImageHeight: number;

    constructor(config: PopupMarkerLayerConfig) {
        super(config);
        this.defaultColor = config.defaultColor ?? [255, 0, 0, 0.8];
        this.defaultSize = config.defaultSize ?? 12;
        this.popupWidth = config.popupWidth ?? 260;
        this.coverImageHeight = config.coverImageHeight ?? 120;

        if (config.markers) {
            this.pendingMarkers = [...config.markers];
        }
    }

    public createLayer(): GraphicsLayer {
        super.createLayer();
        return this.graphicsLayer!;
    }

    public setView(view: MapView): void {
        this.view = view;
        this.mapContainer = view.container as HTMLElement;
        if (!this.graphicsLayer) {
            this.graphicsLayer = new GraphicsLayer({
                id: this.id,
                title: this.name,
                visible: this.visible,
                opacity: this.opacity,
            });

            if (view.map) {
                view.map.add(this.graphicsLayer);
            }
        }

        this.attachClickEvent();

        if (this.pendingMarkers.length > 0) {
            this.pendingMarkers.forEach((marker) => this.addMarker(marker));
            this.pendingMarkers = [];
        }
    }

    private attachClickEvent(): void {
        if (!this.graphicsLayer || !this.view || this.eventsAttached) return;
        this.eventsAttached = true;
        this.view.on("click", (event) => {
            this.view?.hitTest(event).then((response) => {
                let hitMarker = false;
                for (let i = 0; i < response.results.length; i++) {
                    const hit: any = response.results[i];
                    if (hit.graphic && hit.graphic.layer && hit.graphic.layer.id === this.id) {
                        hitMarker = true;
                        this.showPopupForGraphic(hit.graphic);
                        return;
                    }
                }
                if (!hitMarker) {
                    this.hidePopup();
                }
            }).catch(() => { });
        });
    }

    private updatePopupPosition(): void {
        if (!this.currentPopupDiv || !this.currentPopupGraphic || !this.view || !this.mapContainer) return;

        const geometry = this.currentPopupGraphic.geometry;
        if (!geometry || geometry.type !== "point") return;

        const screenPoint = this.view.toScreen(geometry as Point);
        if (!screenPoint) return;

        const mapRect = this.mapContainer.getBoundingClientRect();
        const card = this.currentPopupDiv.querySelector('div:first-child') as HTMLElement;
        if (!card) return;

        const actualHeight = card.offsetHeight;
        let left = screenPoint.x - mapRect.left - this.popupWidth / 2;
        let top = screenPoint.y - mapRect.top - actualHeight - 15;

        const containerWidth = mapRect.width;
        const containerHeight = mapRect.height;

        left = Math.max(10, Math.min(left, containerWidth - this.popupWidth - 10));
        top = Math.max(10, Math.min(top, containerHeight - actualHeight - 10));

        this.currentPopupDiv.style.left = `${left}px`;
        this.currentPopupDiv.style.top = `${top}px`;
    }

    private showPopupForGraphic(graphic: Graphic): void {
        if (!this.view || !this.mapContainer) return;
        if (this.currentPopupGraphic === graphic && this.currentPopupDiv) {
            this.updatePopupPosition();
            return;
        }
        this.hidePopup();
        const geometry = graphic.geometry;
        if (!geometry || geometry.type !== "point") return;
        const attributes = graphic.attributes;
        const hasCover = attributes.coverImage && attributes.coverImage.trim() !== "";
        const hasTitle = attributes.title && attributes.title.trim() !== "";
        const hasDesc = attributes.description && attributes.description.trim() !== "";
        const FIXED_CARD_HEIGHT = 260;
        const IMAGE_HEIGHT = hasCover ? this.coverImageHeight : 0;
        const CONTENT_AREA_HEIGHT = FIXED_CARD_HEIGHT - IMAGE_HEIGHT - 24;
        const theme = document.body.getAttribute("data-theme") ||
            document.documentElement.getAttribute("data-theme") ||
            "dark";
        const isDark = theme === "dark";
        const bgColor = isDark ? "#1e1e1e" : "#ffffff";
        const borderColor = isDark ? "#333" : "#e0e0e0";
        const titleColor = isDark ? "#fff" : "#333";
        const descColor = isDark ? "#aaa" : "#666";
        const popupDiv = document.createElement("div");
        popupDiv.style.position = "absolute";
        popupDiv.style.display = "none";
        popupDiv.style.zIndex = "10000";
        popupDiv.style.pointerEvents = "auto";
        const card = document.createElement("div");
        card.style.width = `${this.popupWidth}px`;
        card.style.maxWidth = `${this.popupWidth}px`;
        card.style.height = `${FIXED_CARD_HEIGHT}px`;
        card.style.backgroundColor = bgColor;
        card.style.border = `1px solid ${borderColor}`;
        card.style.borderRadius = "8px";
        card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
        card.style.overflow = "hidden";
        card.style.position = "relative";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        let imageContainer: HTMLDivElement | null = null;
        if (hasCover) {
            imageContainer = document.createElement("div");
            imageContainer.style.height = `${IMAGE_HEIGHT}px`;
            imageContainer.style.overflow = "hidden";
            imageContainer.style.backgroundColor = "#f0f0f0";
            imageContainer.style.flexShrink = "0";
            const img = document.createElement("img");
            img.src = attributes.coverImage;
            img.alt = "";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.display = "block";
            imageContainer.appendChild(img);
            card.appendChild(imageContainer);
        }
        const contentDiv = document.createElement("div");
        contentDiv.style.padding = "12px";
        contentDiv.style.flex = "1";
        contentDiv.style.display = "flex";
        contentDiv.style.flexDirection = "column";
        contentDiv.style.overflow = "hidden";
        let titleDiv: HTMLDivElement | null = null;
        let descDiv: HTMLDivElement | null = null;
        if (hasTitle) {
            titleDiv = document.createElement("div");
            titleDiv.style.fontSize = "19px";
            titleDiv.style.fontWeight = "600";
            titleDiv.style.color = titleColor;
            titleDiv.style.lineHeight = "1.5";
            titleDiv.style.marginBottom = hasDesc ? "8px" : "0";
            titleDiv.style.wordWrap = "break-word";
            titleDiv.style.wordBreak = "break-word";
            titleDiv.style.display = "-webkit-box";
            titleDiv.style.webkitLineClamp = "2";
            titleDiv.style.webkitBoxOrient = "vertical";
            titleDiv.style.overflow = "hidden";
            titleDiv.textContent = attributes.title;
            contentDiv.appendChild(titleDiv);
        }
        if (hasDesc) {
            descDiv = document.createElement("div");
            descDiv.style.fontSize = "17px";
            descDiv.style.color = descColor;
            descDiv.style.lineHeight = "1.6";
            descDiv.style.wordWrap = "break-word";
            descDiv.style.wordBreak = "break-word";
            descDiv.style.overflowY = "auto";
            descDiv.style.flex = "1";
            descDiv.style.maxHeight = `${CONTENT_AREA_HEIGHT + IMAGE_HEIGHT}px`;
            descDiv.textContent = attributes.description;
            contentDiv.appendChild(descDiv);
        }
        card.appendChild(contentDiv);
        popupDiv.appendChild(card);
        if (getComputedStyle(this.mapContainer).position === 'static') {
            this.mapContainer.style.position = 'relative';
        }
        this.mapContainer.appendChild(popupDiv);
        this.currentPopupDiv = popupDiv;
        const pointGeom = geometry as Point;
        const screenPoint = this.view.toScreen(pointGeom);
        if (!screenPoint) {
            this.hidePopup();
            return;
        }
        const mapRect = this.mapContainer.getBoundingClientRect();
        let left = screenPoint.x - mapRect.left - this.popupWidth / 2;
        let top = screenPoint.y - mapRect.top - FIXED_CARD_HEIGHT - 15;
        const containerWidth = mapRect.width;
        const containerHeight = mapRect.height;
        left = Math.max(10, Math.min(left, containerWidth - this.popupWidth - 10));
        top = Math.max(10, Math.min(top, containerHeight - FIXED_CARD_HEIGHT - 10));
        popupDiv.style.left = `${left}px`;
        popupDiv.style.top = `${top}px`;
        popupDiv.style.display = "block";
        this.currentPopupGraphic = graphic;
        if (imageContainer) {
            const img = imageContainer.querySelector('img');
            if (img) {
                if (img.complete && img.naturalHeight > 0) {
                    imageContainer.style.display = "block";
                    if (titleDiv) {
                        titleDiv.style.fontSize = "14px";
                        titleDiv.style.lineHeight = "1.4";
                    }
                    if (descDiv) {
                        descDiv.style.fontSize = "12px";
                        descDiv.style.lineHeight = "1.5";
                        descDiv.style.maxHeight = `${CONTENT_AREA_HEIGHT - (hasTitle ? 30 : 0)}px`;
                    }
                } else {
                    imageContainer.style.display = "none";
                    img.onload = () => {
                        if (imageContainer && this.currentPopupDiv === popupDiv) {
                            imageContainer.style.display = "block";
                            if (titleDiv) {
                                titleDiv.style.fontSize = "14px";
                                titleDiv.style.lineHeight = "1.4";
                            }
                            if (descDiv) {
                                descDiv.style.fontSize = "12px";
                                descDiv.style.lineHeight = "1.5";
                                descDiv.style.maxHeight = `${CONTENT_AREA_HEIGHT - (hasTitle ? 30 : 0)}px`;
                            }
                        }
                    };
                    img.onerror = () => {
                        if (imageContainer && this.currentPopupDiv === popupDiv) {
                            imageContainer.style.display = "none";
                        }
                    };
                }
            }
        }
        if (this.extentWatchHandle) {
            this.extentWatchHandle.remove();
        }
        this.extentWatchHandle = this.view.watch("extent", () => {
            this.updatePopupPosition();
        });
    }

    private hidePopup(): void {
        if (this.currentPopupDiv) {
            this.currentPopupDiv.remove();
            this.currentPopupDiv = null;
        }
        this.currentPopupGraphic = null;

        if (this.extentWatchHandle) {
            this.extentWatchHandle.remove();
            this.extentWatchHandle = null;
        }
    }

    public addMarker(data: PopupMarkerData): void {
        if (!this.graphicsLayer) {
            this.pendingMarkers.push(data);
            return;
        }
        const point = new Point({
            longitude: data.longitude,
            latitude: data.latitude
        });
        const symbol = new SimpleMarkerSymbol({
            color: data.color ?? this.defaultColor,
            size: data.size ?? this.defaultSize,
            outline: { color: [255, 255, 255], width: 2 },
        });
        const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            attributes: {
                id: data.id,
                title: data.title || "",
                description: data.description || "",
                coverImage: data.coverImage || "",
                longitude: data.longitude,
                latitude: data.latitude
            }
        });
        this.graphicsLayer.add(graphic);
        this.markers.set(data.id, graphic);
    }

    public removeMarker(id: string): void {
        const graphic = this.markers.get(id);
        if (graphic && this.graphicsLayer) {
            this.graphicsLayer.remove(graphic);
            this.markers.delete(id);
            if (this.currentPopupGraphic === graphic) {
                this.hidePopup();
            }
        }
    }

    public clearAllMarkers(): void {
        this.markers.forEach((graphic) => {
            if (this.graphicsLayer) {
                this.graphicsLayer.remove(graphic);
            }
        });
        this.markers.clear();
        this.hidePopup();
    }

    public getAllMarkers(): PopupMarkerData[] {
        const result: PopupMarkerData[] = [];
        this.markers.forEach((graphic, id) => {
            const geometry = graphic.geometry as Point;
            const attributes = graphic.attributes;
            result.push({
                id,
                longitude: geometry.longitude ?? 0,
                latitude: geometry.latitude ?? 0,
                title: attributes.title,
                description: attributes.description,
                coverImage: attributes.coverImage
            });
        });
        return result;
    }

    public updateData(data: { markers?: PopupMarkerData[] }): void {
        if (data.markers) {
            this.clear();
            this.pendingMarkers = [...data.markers];
            if (this.graphicsLayer) {
                this.pendingMarkers.forEach((marker) => this.addMarker(marker));
                this.pendingMarkers = [];
            }
        }
    }

    public destroy(): void {
        this.hidePopup();
        super.destroy();
    }
}