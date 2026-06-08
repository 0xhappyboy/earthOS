

import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";

import Transform from "ol-ext/interaction/Transform";
import { fromLonLat, toLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum } from "../../types";
import { generateId, arrayToRgba } from "../../utils";

export interface TextDrawData {
    id: string;
    position: [number, number];
    content: string;
    fontSize?: number;
    fontFamily?: string;
    color?: number[];
    backgroundColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export class TextDrawLayer extends BaseLayer {
    private drawInteraction: Draw | null = null;
    private transformInteraction: Transform | null = null;
    private features: Map<string, Feature> = new Map();
    private defaultFontSize: number;
    private defaultFontFamily: string;
    private defaultColor: number[];
    private defaultBackgroundColor: number[];
    private defaultOutlineColor: number[];
    private defaultOutlineWidth: number;
    private onDrawCompleteCallback: ((data: TextDrawData) => void) | null = null;
    private onEditCompleteCallback: ((data: TextDrawData) => void) | null = null;
    private editingFeature: Feature | null = null;
    private mapView: any = null;
    private pendingTextInput: HTMLInputElement | null = null;
    public isInputActive: boolean = false;

    constructor(id: string, name: string, options?: {
        defaultFontSize?: number;
        defaultFontFamily?: string;
        defaultColor?: number[];
        defaultBackgroundColor?: number[];
        defaultOutlineColor?: number[];
        defaultOutlineWidth?: number;
        visible?: boolean;
        opacity?: number;
        zIndex?: number;
    }) {
        super(id, name, LayerTypeEnum.TEXT_DRAW, {
            ...options,
            zIndex: options?.zIndex ?? 100,
        });
        this.defaultFontSize = options?.defaultFontSize || 14;
        this.defaultFontFamily = options?.defaultFontFamily || "sans-serif";
        this.defaultColor = options?.defaultColor || [255, 255, 255, 1];
        this.defaultBackgroundColor = options?.defaultBackgroundColor || [0, 0, 0, 0.7];
        this.defaultOutlineColor = options?.defaultOutlineColor || [0, 0, 0, 1];
        this.defaultOutlineWidth = options?.defaultOutlineWidth || 2;
        this.source = new VectorSource();
        this.layer = new VectorLayer({
            source: this.source,
            style: (feature: any) => this.getStyleForFeature(feature),
            properties: { id, name, type: LayerTypeEnum.TEXT_DRAW },
            visible: this.visible,
            opacity: this.opacity,
            zIndex: this.zIndex,
        });
    }

    private getStyleForFeature(feature?: any): Style {
        const content = feature?.get("content") || "";
        const fontSize = feature?.get("fontSize") || this.defaultFontSize;
        const fontFamily = feature?.get("fontFamily") || this.defaultFontFamily;
        const color = feature?.get("color") || this.defaultColor;
        const backgroundColor = feature?.get("backgroundColor") || this.defaultBackgroundColor;
        const outlineColor = feature?.get("outlineColor") || this.defaultOutlineColor;
        const outlineWidth = feature?.get("outlineWidth") || this.defaultOutlineWidth;

        return new Style({
            text: new Text({
                text: content,
                font: `${fontSize}px ${fontFamily}`,
                fill: new Fill({ color: arrayToRgba(color) }),
                stroke: new Stroke({
                    color: arrayToRgba(outlineColor),
                    width: outlineWidth,
                }),
                backgroundFill: new Fill({ color: arrayToRgba(backgroundColor) }),
                padding: [4, 8, 4, 8],
                textAlign: "center",
                textBaseline: "middle",
            }),
        });
    }



    private showTextInput(position: [number, number], onComplete: (text: string) => void): void {

        if (this.pendingTextInput) {
            this.pendingTextInput.remove();
            this.pendingTextInput = null;
        }

        this.isInputActive = true;

        this.pendingTextInput = document.createElement("input");
        this.pendingTextInput.type = "text";
        this.pendingTextInput.placeholder = "请输入文字...";
        this.pendingTextInput.style.cssText = `
        position: absolute;
        z-index: 10001;
        padding: 8px 12px;
        font-size: 14px;
        min-width: 180px;
        border: 2px solid #00aaff;
        border-radius: 6px;
        background: #ffffff;
        color: #333333;
        outline: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: sans-serif;
    `;

        const map = this.mapView;
        if (!map || typeof map.getTargetElement !== 'function') {
            console.error("TextDrawLayer: mapView is not a valid map object");
            this.isInputActive = false;
            onComplete("");
            return;
        }

        const targetElement = map.getTargetElement();
        if (!targetElement) {
            console.error("TextDrawLayer: cannot get map target element");
            this.isInputActive = false;
            onComplete("");
            return;
        }

        const containerRect = targetElement.getBoundingClientRect();
        const pixel = map.getPixelFromCoordinate(position);
        if (!pixel || pixel.length < 2) {
            console.error("TextDrawLayer: cannot get pixel from coordinate", position);
            this.isInputActive = false;
            onComplete("");
            return;
        }

        const left = pixel[0] - containerRect.left - 90;
        const top = pixel[1] - containerRect.top - 35;

        this.pendingTextInput.style.left = `${Math.max(5, left)}px`;
        this.pendingTextInput.style.top = `${Math.max(5, top)}px`;

        targetElement.appendChild(this.pendingTextInput);
        this.pendingTextInput.focus();
        this.pendingTextInput.select();

        let isCompleted = false;

        const cleanup = () => {
            if (isCompleted) return;
            isCompleted = true;

            if (this.pendingTextInput) {
                this.pendingTextInput.remove();
                this.pendingTextInput = null;
            }
            document.removeEventListener("keydown", handleKeydown);
            document.removeEventListener("click", handleClickOutside);
            this.isInputActive = false;
        };

        const handleComplete = (text: string) => {
            if (isCompleted) return;
            cleanup();
            onComplete(text);
        };

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                const text = this.pendingTextInput?.value || "";
                handleComplete(text);
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                handleComplete("");
            }
        };

        const handleClickOutside = (e: MouseEvent) => {

            if (isCompleted) return;

            if (this.pendingTextInput && !this.pendingTextInput.contains(e.target as Node)) {
                const text = this.pendingTextInput.value || "";
                handleComplete(text);
            }
        };

        document.addEventListener("keydown", handleKeydown);

        setTimeout(() => {
            document.addEventListener("click", handleClickOutside);
        }, 100);
    }

    public setView(view: any): void {

        this.mapView = view;
    }

    public createLayer(map: any): VectorLayer<VectorSource> {
        map.addLayer(this.layer);
        return this.layer;
    }

    public startDraw(onComplete?: (data: TextDrawData) => void): void {
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

                this.showTextInput([x, y], (text: string) => {

                    if (tempSource) {
                        tempSource.clear();
                    }
                    if (this.drawInteraction) {
                        this.mapView?.removeInteraction(this.drawInteraction);
                        this.drawInteraction = null;
                    }

                    if (text && text.trim()) {
                        const id = generateId("text_");
                        const feature = new Feature({
                            geometry: new Point([x, y]),
                            id: id,
                            position: [lng, lat],
                            content: text,
                        });
                        feature.set("fontSize", this.defaultFontSize);
                        feature.set("fontFamily", this.defaultFontFamily);
                        feature.set("color", this.defaultColor);
                        feature.set("backgroundColor", this.defaultBackgroundColor);
                        feature.set("outlineColor", this.defaultOutlineColor);
                        feature.set("outlineWidth", this.defaultOutlineWidth);

                        this.source?.addFeature(feature);
                        this.features.set(id, feature);
                        this.layer?.setZIndex(999);

                        if (this.onDrawCompleteCallback) {
                            this.onDrawCompleteCallback({
                                id,
                                position: [lng, lat],
                                content: text,
                                fontSize: this.defaultFontSize,
                                fontFamily: this.defaultFontFamily,
                                color: this.defaultColor,
                                backgroundColor: this.defaultBackgroundColor,
                                outlineColor: this.defaultOutlineColor,
                                outlineWidth: this.defaultOutlineWidth,
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

    public startEdit(id: string, onComplete?: (data: TextDrawData) => void): void {
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }
        this.editingFeature = targetFeature;
        this.onEditCompleteCallback = onComplete || null;
        const geometry = targetFeature.getGeometry();
        if (geometry instanceof Point) {
            const [x, y] = geometry.getCoordinates();
            const currentText = targetFeature.get("content") || "";

            this.showTextInput([x, y], (text: string) => {
                if (text && text.trim() && text !== currentText) {
                    targetFeature.set("content", text);
                    targetFeature.changed();
                    this.mapView?.render();

                    const position = targetFeature.get("position");
                    if (this.onEditCompleteCallback) {
                        this.onEditCompleteCallback({
                            id,
                            position,
                            content: text,
                        });
                    }
                }
                this.editingFeature = null;
                this.onEditCompleteCallback = null;
            });
        }
    }

    public stopEdit(): void {
        if (this.pendingTextInput) {
            this.pendingTextInput.remove();
            this.pendingTextInput = null;
        }
        this.isInputActive = false;
        this.editingFeature = null;
        this.onEditCompleteCallback = null;
    }



    public addText(data: TextDrawData): void {
        const point = fromLonLat(data.position);
        const feature = new Feature({
            geometry: new Point(point),
            id: data.id,
            position: data.position,
            content: data.content,
        });
        feature.set("fontSize", data.fontSize || this.defaultFontSize);
        feature.set("fontFamily", data.fontFamily || this.defaultFontFamily);
        feature.set("color", data.color || this.defaultColor);
        feature.set("backgroundColor", data.backgroundColor || this.defaultBackgroundColor);
        feature.set("outlineColor", data.outlineColor || this.defaultOutlineColor);
        feature.set("outlineWidth", data.outlineWidth || this.defaultOutlineWidth);
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
    }

    public removeText(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.source?.removeFeature(feature);
            this.features.delete(id);
            if (this.editingFeature === feature) {
                this.stopEdit();
            }
        }
    }

    public getAllTexts(): TextDrawData[] {
        const result: TextDrawData[] = [];
        this.features.forEach((feature, id) => {
            result.push({
                id,
                position: feature.get("position"),
                content: feature.get("content"),
                fontSize: feature.get("fontSize"),
                fontFamily: feature.get("fontFamily"),
                color: feature.get("color"),
                backgroundColor: feature.get("backgroundColor"),
                outlineColor: feature.get("outlineColor"),
                outlineWidth: feature.get("outlineWidth"),
            });
        });
        return result;
    }

    public getText(id: string): TextDrawData | undefined {
        const feature = this.features.get(id);
        if (!feature) return undefined;
        return {
            id,
            position: feature.get("position"),
            content: feature.get("content"),
            fontSize: feature.get("fontSize"),
            fontFamily: feature.get("fontFamily"),
            color: feature.get("color"),
            backgroundColor: feature.get("backgroundColor"),
            outlineColor: feature.get("outlineColor"),
            outlineWidth: feature.get("outlineWidth"),
        };
    }

    public updateTextStyle(
        id: string,
        fontSize: number,
        fontFamily: string,
        color: number[],
        backgroundColor: number[],
        outlineColor: number[],
        outlineWidth: number
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("fontSize", fontSize);
        feature.set("fontFamily", fontFamily);
        feature.set("color", color);
        feature.set("backgroundColor", backgroundColor);
        feature.set("outlineColor", outlineColor);
        feature.set("outlineWidth", outlineWidth);
        feature.changed();
        this.mapView?.render();
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
        return this.pendingTextInput !== null;
    }

    public setEditable(editable: boolean): void {
        if (!editable) {
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

    public updateData(data: { texts?: TextDrawData[] }): void {
        if (data.texts) {
            this.clearAll();
            data.texts.forEach((text) => this.addText(text));
        }
    }

    public destroy(): void {
        this.stopDraw();
        this.stopEdit();
        super.destroy();
    }
}