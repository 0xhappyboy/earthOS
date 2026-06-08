import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";

import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId } from "../../utils";
import { Theme } from "../../components";
import { Translations } from "../../i18n";
import { Draw } from "ol/interaction";
// @ts-ignore
import Transform from "ol-ext/interaction/Transform";
import { ImageInputModalBox } from "../../components/ImageInputModalBox";

export interface ImageDrawData {
    id: string;
    position: [number, number];
    imageUrl: string;
    imageData?: string;
    width?: number;
    height?: number;
    opacity?: number;
    rotation?: number;
}

export class ImageDrawLayer extends BaseLayer {
    private drawInteraction: any = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultWidth: number;
    private defaultHeight: number;
    private defaultOpacity: number;
    private onDrawCompleteCallback: ((data: ImageDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: ImageDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;
    private imageInputModal: ImageInputModalBox | null = null;
    public isInputActive: boolean = false;
    private currentTheme: Theme = "dark";
    private currentTranslations: Translations | null = null;

    constructor(id: string, name: string, options?: {
        defaultWidth?: number;
        defaultHeight?: number;
        defaultOpacity?: number;
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.IMAGE_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultWidth = options?.defaultWidth || 32;
        this.defaultHeight = options?.defaultHeight || 32;
        this.defaultOpacity = options?.defaultOpacity || 1;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.IMAGE_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const imageUrl = feature?.get("imageUrl") || "";
        const width = feature?.get("width") || this.defaultWidth;
        const height = feature?.get("height") || this.defaultHeight;
        const opacity = feature?.get("opacity") || this.defaultOpacity;
        const rotation = feature?.get("rotation") || 0;

        if (!imageUrl) {
            return new Style({});
        }

        return new Style({
            image: new Icon({
                src: imageUrl,
                width: width,
                height: height,
                opacity: opacity,
                rotation: rotation,
                crossOrigin: "anonymous",
            }),
        });
    }

    public setTheme(theme: Theme, t: Translations): void {
        this.currentTheme = theme;
        this.currentTranslations = t;
    }

    private showImageInputModal(
        position: [number, number],
        initialData?: {
            imageUrl: string;
            imageData?: string;
            width: number;
            height: number;
            opacity: number;
        },
        onComplete?: (data: {
            imageUrl: string;
            imageData?: string;
            width: number;
            height: number;
            opacity: number;
        }) => void,
        onDelete?: () => void
    ): void {
        if (this.imageInputModal) {
            this.imageInputModal.destroy();
            this.imageInputModal = null;
        }

        this.isInputActive = true;

        const map = this.mapView;
        if (!map || typeof map.getTargetElement !== 'function') {
            console.error("ImageDrawLayer: mapView is not a valid map object");
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    imageUrl: "",
                    width: this.defaultWidth,
                    height: this.defaultHeight,
                    opacity: this.defaultOpacity,
                });
            }
            return;
        }

        const targetElement = map.getTargetElement();
        if (!targetElement) {
            console.error("ImageDrawLayer: cannot get map target element");
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    imageUrl: "",
                    width: this.defaultWidth,
                    height: this.defaultHeight,
                    opacity: this.defaultOpacity,
                });
            }
            return;
        }

        const pixel = map.getPixelFromCoordinate(position);
        if (!pixel || pixel.length < 2) {
            console.error("ImageDrawLayer: cannot get pixel from coordinate", position);
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    imageUrl: "",
                    width: this.defaultWidth,
                    height: this.defaultHeight,
                    opacity: this.defaultOpacity,
                });
            }
            return;
        }

        let left = pixel[0] - 150;
        let top = pixel[1] - 200;
        left = Math.max(10, Math.min(left, window.innerWidth - 310));
        top = Math.max(10, Math.min(top, window.innerHeight - 400));

        const simpleT = {
            addImage: "添加图片",
            enterImageUrl: "请输入图片URL或点击上传...",
            imageUrl: "图片URL",
            uploadImage: "上传图片",
            width: "宽度",
            height: "高度",
            opacity: "透明度",
            confirm: "确定",
            cancel: "取消",
            delete: "删除"
        } as any;

        this.imageInputModal = new ImageInputModalBox(
            {
                initialImageUrl: initialData?.imageUrl || "",
                initialImageData: initialData?.imageData,
                initialWidth: initialData?.width || this.defaultWidth,
                initialHeight: initialData?.height || this.defaultHeight,
                initialOpacity: initialData?.opacity || this.defaultOpacity,
                onConfirm: (data) => {
                    console.log("onConfirm called in ImageDrawLayer", data);
                    if (onComplete) {
                        onComplete(data);
                    }
                    this.hideImageInputModal();
                },
                onCancel: () => {
                    console.log("onCancel called in ImageDrawLayer");
                    if (onComplete) {
                        onComplete({
                            imageUrl: "",
                            width: this.defaultWidth,
                            height: this.defaultHeight,
                            opacity: this.defaultOpacity,
                        });
                    }
                    this.hideImageInputModal();
                },
                onDelete: onDelete,
                theme: this.currentTheme,
                t: simpleT,
            },
            { x: left, y: top }
        );
    }

    private hideImageInputModal(): void {
        if (this.imageInputModal) {
            this.imageInputModal.destroy();
            this.imageInputModal = null;
        }
        this.isInputActive = false;
    }

    public setView(view: any): void {
        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: ImageDrawData) => void): void {
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
            if (geometry instanceof Point) {
                const [x, y] = geometry.getCoordinates();
                const [lng, lat] = toLonLat([x, y]);
                this.showImageInputModal([x, y], undefined, (result) => {
                    if (tempSource) {
                        tempSource.clear();
                    }
                    if (this.drawInteraction) {
                        this.mapView?.removeInteraction(this.drawInteraction);
                        this.drawInteraction = null;
                    }
                    if (result.imageUrl && result.imageUrl.trim()) {
                        const id = generateId("image_");
                        const feature = new Feature({
                            geometry: new Point([x, y]),
                            id: id,
                            position: [lng, lat],
                            imageUrl: result.imageUrl,
                            imageData: result.imageData,
                        });
                        feature.set("width", result.width);
                        feature.set("height", result.height);
                        feature.set("opacity", result.opacity);
                        feature.set("rotation", 0);
                        this.source?.addFeature(feature);
                        this.features.set(id, feature);
                        this.layer?.setZIndex(999);
                        feature.changed();
                        if (this.mapView) {
                            this.mapView.renderSync();
                        }
                        if (this.onDrawCompleteCallback) {
                            this.onDrawCompleteCallback({
                                id,
                                position: [lng, lat],
                                imageUrl: result.imageUrl,
                                imageData: result.imageData,
                                width: result.width,
                                height: result.height,
                                opacity: result.opacity,
                                rotation: 0,
                            });
                        }
                    } else {
                        if (this.onDrawCompleteCallback) {
                            this.onDrawCompleteCallback(null as any);
                        }
                    }
                    this.onDrawCompleteCallback = null;
                    this.mapView?.render();
                });
            } else {
                tempSource.clear();
                this.mapView?.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
                this.onDrawCompleteCallback = null;
                this.mapView?.render();
            }
        });

        this.mapView?.addInteraction(this.drawInteraction);
    }

    public startEdit(id: string, onComplete?: (data: ImageDrawData) => void): void {
        this.stopEdit();
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
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
            keepAspectRatio: (event: any) => {
                return event.shiftKey;
            },
        });
        this.transformInteraction.setActive(true);
        this.transformInteraction.on("scaleend", () => {
            const scale = targetFeature.get("scale") || 1;
            const currentWidth = targetFeature.get("width") || this.defaultWidth;
            const currentHeight = targetFeature.get("height") || this.defaultHeight;
            const newWidth = Math.max(10, currentWidth * scale);
            const newHeight = Math.max(10, currentHeight * scale);
            targetFeature.set("width", newWidth);
            targetFeature.set("height", newHeight);
            targetFeature.set("scale", 1);  
            targetFeature.changed();
            const position = targetFeature.get("position");
            const featureId = targetFeature.get("id");
            if (this.onEditCompleteCallback && featureId) {
                this.onEditCompleteCallback({
                    id: featureId,
                    position: position,
                    imageUrl: targetFeature.get("imageUrl"),
                    imageData: targetFeature.get("imageData"),
                    width: newWidth,
                    height: newHeight,
                    opacity: targetFeature.get("opacity"),
                    rotation: targetFeature.get("rotation") || 0,
                });
            }
            this.mapView?.render();
        });
        this.transformInteraction.on("translateend", () => {
            const geometry = targetFeature.getGeometry();
            if (geometry instanceof Point) {
                const [x, y] = geometry.getCoordinates();
                const [lng, lat] = toLonLat([x, y]);
                targetFeature.set("position", [lng, lat]);
                targetFeature.changed();
                const featureId = targetFeature.get("id");
                if (this.onEditCompleteCallback && featureId) {
                    this.onEditCompleteCallback({
                        id: featureId,
                        position: [lng, lat],
                        imageUrl: targetFeature.get("imageUrl"),
                        imageData: targetFeature.get("imageData"),
                        width: targetFeature.get("width"),
                        height: targetFeature.get("height"),
                        opacity: targetFeature.get("opacity"),
                        rotation: targetFeature.get("rotation") || 0,
                    });
                }
            }
        });
        this.mapView?.addInteraction(this.transformInteraction);
        this.mapView?.render();
    }

    public stopEdit(): void {
        if (this.transformInteraction) {
            this.mapView?.removeInteraction(this.transformInteraction);
            this.transformInteraction = null;
        }
        if (this.imageInputModal) {
            this.imageInputModal.destroy();
            this.imageInputModal = null;
        }
        this.isInputActive = false;
        this.editingFeature = null;
        this.onEditCompleteCallback = null;
    }

    public editProperties(id: string, onComplete?: (data: ImageDrawData) => void, onDelete?: () => void): void {
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }
        const geometry = targetFeature.getGeometry();
        if (geometry instanceof Point) {
            const [x, y] = geometry.getCoordinates();
            const currentImageUrl = targetFeature.get("imageUrl") || "";
            const currentImageData = targetFeature.get("imageData");
            const currentWidth = targetFeature.get("width") || this.defaultWidth;
            const currentHeight = targetFeature.get("height") || this.defaultHeight;
            const currentOpacity = targetFeature.get("opacity") || this.defaultOpacity;

            const handleDelete = () => {
                this.removeImage(id);
                if (onDelete) {
                    onDelete();
                }
                if (onComplete) {
                    onComplete(null as any);
                }
            };

            this.showImageInputModal(
                [x, y],
                {
                    imageUrl: currentImageUrl,
                    imageData: currentImageData,
                    width: currentWidth,
                    height: currentHeight,
                    opacity: currentOpacity,
                },
                (result) => {
                    if (result.imageUrl && result.imageUrl.trim()) {
                        targetFeature.set("imageUrl", result.imageUrl);
                        if (result.imageData) {
                            targetFeature.set("imageData", result.imageData);
                        }
                        targetFeature.set("width", result.width);
                        targetFeature.set("height", result.height);
                        targetFeature.set("opacity", result.opacity);
                        targetFeature.changed();
                        this.mapView?.render();

                        const position = targetFeature.get("position");
                        if (onComplete) {
                            onComplete({
                                id,
                                position,
                                imageUrl: result.imageUrl,
                                imageData: result.imageData,
                                width: result.width,
                                height: result.height,
                                opacity: result.opacity,
                                rotation: targetFeature.get("rotation") || 0,
                            });
                        }
                    }
                },
                handleDelete
            );
        }
    }

    public addImage(data: ImageDrawData): void {
        const point = fromLonLat(data.position);
        const feature = new Feature({
            geometry: new Point(point),
            id: data.id,
            position: data.position,
            imageUrl: data.imageUrl,
            imageData: data.imageData,
        });
        feature.set("width", data.width || this.defaultWidth);
        feature.set("height", data.height || this.defaultHeight);
        feature.set("opacity", data.opacity || this.defaultOpacity);
        feature.set("rotation", data.rotation || 0);
        feature.set("scale", 1); 
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeImage(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllImages(): ImageDrawData[] {
        const result: ImageDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id,
                position: feature.get("position"),
                imageUrl: feature.get("imageUrl"),
                imageData: feature.get("imageData"),
                width: feature.get("width"),
                height: feature.get("height"),
                opacity: feature.get("opacity"),
                rotation: feature.get("rotation"),
            });
        });
        return result;
    }

    public getImage(id: string): ImageDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            position: feature.get("position"),
            imageUrl: feature.get("imageUrl"),
            imageData: feature.get("imageData"),
            width: feature.get("width"),
            height: feature.get("height"),
            opacity: feature.get("opacity"),
            rotation: feature.get("rotation"),
        };
    }

    public updateImageStyle(
        id: string,
        width: number,
        height: number,
        opacity: number,
        rotation?: number
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;

        feature.set("width", width);
        feature.set("height", height);
        feature.set("opacity", opacity);
        if (rotation !== undefined) {
            feature.set("rotation", rotation);
        }

        feature.changed();
        if (this.mapView) {
            this.mapView.renderSync();
            if (this.layer) {
                this.layer.changed();
            }
        }
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

    public updateData(data: { images?: ImageDrawData[] }): void {
        if (data.images) {
            this.clearAll();
            data.images.forEach((image) => this.addImage(image));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        if (this.imageInputModal) {
            this.imageInputModal.destroy();
            this.imageInputModal = null;
        }
        super.destroy();
    }
}