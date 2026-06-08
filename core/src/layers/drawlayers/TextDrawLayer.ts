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
import { Theme } from "../../components";
import { TextInputModalBox } from "../../components/TextInputModalBox";
import { Translations } from "../../i18n";

export interface TextDrawData {
    id: string;
    position: [number, number];
    content: string;
    fontSize?: number;
    fontFamily?: string;
    color?: number[];
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
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
    private textInputModal: TextInputModalBox | null = null;
    public isInputActive: boolean = false;
    private currentTheme: Theme = "dark";
    private currentTranslations: Translations | null = null;

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
        this.defaultFontSize = options?.defaultFontSize || 16;
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
        const fontWeight = feature?.get("fontWeight") || "normal";
        const fontStyle = feature?.get("fontStyle") || "normal";

        let fontString = "";
        if (fontStyle !== "normal") fontString += `${fontStyle} `;
        if (fontWeight !== "normal") fontString += `${fontWeight} `;
        fontString += `${fontSize}px ${fontFamily}`;

        return new Style({
            text: new Text({
                text: content,
                font: fontString,
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

    public setTheme(theme: Theme, t: Translations): void {
        this.currentTheme = theme;
        this.currentTranslations = t;
    }

    private showTextInputModal(
        position: [number, number],
        initialData?: {
            text: string;
            fontSize: number;
            color: number[];
            fontWeight: "normal" | "bold";
            fontStyle: "normal" | "italic";
        },
        onComplete?: (data: {
            text: string;
            fontSize: number;
            color: number[];
            fontWeight: "normal" | "bold";
            fontStyle: "normal" | "italic";
        }) => void,
        onDelete?: () => void
    ): void {
        if (this.textInputModal) {
            this.textInputModal.destroy();
            this.textInputModal = null;
        }

        this.isInputActive = true;

        const map = this.mapView;
        if (!map || typeof map.getTargetElement !== 'function') {
            console.error("TextDrawLayer: mapView is not a valid map object");
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    text: "",
                    fontSize: this.defaultFontSize,
                    color: this.defaultColor,
                    fontWeight: "normal",
                    fontStyle: "normal"
                });
            }
            return;
        }

        const targetElement = map.getTargetElement();
        if (!targetElement) {
            console.error("TextDrawLayer: cannot get map target element");
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    text: "",
                    fontSize: this.defaultFontSize,
                    color: this.defaultColor,
                    fontWeight: "normal",
                    fontStyle: "normal"
                });
            }
            return;
        }

        const pixel = map.getPixelFromCoordinate(position);
        if (!pixel || pixel.length < 2) {
            console.error("TextDrawLayer: cannot get pixel from coordinate", position);
            this.isInputActive = false;
            if (onComplete) {
                onComplete({
                    text: "",
                    fontSize: this.defaultFontSize,
                    color: this.defaultColor,
                    fontWeight: "normal",
                    fontStyle: "normal"
                });
            }
            return;
        }

        let left = pixel[0] - 140;
        let top = pixel[1] - 130;
        left = Math.max(10, Math.min(left, window.innerWidth - 290));
        top = Math.max(10, Math.min(top, window.innerHeight - 270));

        // 创建一个简单的 translations 对象用于 TextInputModalBox
        const simpleT = {
            addText: "添加文字",
            enterText: "请输入文字...",
            bold: "粗体",
            italic: "斜体",
            fontSize: "字号",
            color: "颜色",
            confirm: "确定",
            cancel: "取消"
        } as any;

        this.textInputModal = new TextInputModalBox(
            {
                initialText: initialData?.text || "",
                initialFontSize: initialData?.fontSize || this.defaultFontSize,
                initialColor: initialData?.color || this.defaultColor,
                initialFontWeight: initialData?.fontWeight || "normal",
                initialFontStyle: initialData?.fontStyle || "normal",
                onConfirm: (data) => {
                    if (onComplete) {
                        onComplete(data);
                    }
                    this.hideTextInputModal();
                },
                onCancel: () => {
                    if (onComplete) {
                        onComplete({
                            text: "",
                            fontSize: this.defaultFontSize,
                            color: this.defaultColor,
                            fontWeight: "normal",
                            fontStyle: "normal"
                        });
                    }
                    this.hideTextInputModal();
                },
                onDelete: onDelete,
                theme: this.currentTheme,
                t: simpleT,
            },
            { x: left, y: top }
        );
    }


    private hideTextInputModal(): void {
        if (this.textInputModal) {
            this.textInputModal.destroy();
            this.textInputModal = null;
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

                this.showTextInputModal([x, y], undefined, (result) => {
                    if (tempSource) {
                        tempSource.clear();
                    }
                    if (this.drawInteraction) {
                        this.mapView?.removeInteraction(this.drawInteraction);
                        this.drawInteraction = null;
                    }

                    if (result.text && result.text.trim()) {
                        const id = generateId("text_");
                        const feature = new Feature({
                            geometry: new Point([x, y]),
                            id: id,
                            position: [lng, lat],
                            content: result.text,
                        });

                        feature.set("fontSize", result.fontSize);
                        feature.set("fontFamily", this.defaultFontFamily);
                        feature.set("color", result.color);
                        feature.set("fontWeight", result.fontWeight);
                        feature.set("fontStyle", result.fontStyle);
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
                                content: result.text,
                                fontSize: result.fontSize,
                                fontFamily: this.defaultFontFamily,
                                color: result.color,
                                fontWeight: result.fontWeight,
                                fontStyle: result.fontStyle,
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

    public startEdit(id: string, onComplete?: (data: TextDrawData) => void, onDelete?: () => void): void {
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
            const currentFontSize = targetFeature.get("fontSize") || this.defaultFontSize;
            const currentColor = targetFeature.get("color") || this.defaultColor;
            const currentFontWeight = targetFeature.get("fontWeight") || "normal";
            const currentFontStyle = targetFeature.get("fontStyle") || "normal";
            const handleDelete = () => {
                this.removeText(id);
                if (onDelete) {
                    onDelete();
                }
                if (this.onEditCompleteCallback) {
                    this.onEditCompleteCallback(null as any);
                }
            };
            this.showTextInputModal(
                [x, y],
                {
                    text: currentText,
                    fontSize: currentFontSize,
                    color: currentColor,
                    fontWeight: currentFontWeight,
                    fontStyle: currentFontStyle,
                },
                (result) => {
                    if (result.text && result.text.trim() && result.text !== currentText) {
                        targetFeature.set("content", result.text);
                        targetFeature.set("fontSize", result.fontSize);
                        targetFeature.set("color", result.color);
                        targetFeature.set("fontWeight", result.fontWeight);
                        targetFeature.set("fontStyle", result.fontStyle);
                        targetFeature.changed();
                        this.mapView?.render();

                        const position = targetFeature.get("position");
                        if (this.onEditCompleteCallback) {
                            this.onEditCompleteCallback({
                                id,
                                position,
                                content: result.text,
                                fontSize: result.fontSize,
                                fontFamily: targetFeature.get("fontFamily"),
                                color: result.color,
                                fontWeight: result.fontWeight,
                                fontStyle: result.fontStyle,
                                backgroundColor: targetFeature.get("backgroundColor"),
                                outlineColor: targetFeature.get("outlineColor"),
                                outlineWidth: targetFeature.get("outlineWidth"),
                            });
                        }
                    }
                    this.editingFeature = null;
                    this.onEditCompleteCallback = null;
                },
                handleDelete
            );
        }
    }

    // 添加新方法用于编辑
    private showTextInputModalForEdit(
        position: [number, number],
        initialData: {
            text: string;
            fontSize: number;
            color: number[];
            fontWeight: "normal" | "bold";
            fontStyle: "normal" | "italic";
        },
        onComplete: (data: {
            text: string;
            fontSize: number;
            color: number[];
            fontWeight: "normal" | "bold";
            fontStyle: "normal" | "italic";
        }) => void
    ): void {
        if (this.textInputModal) {
            this.textInputModal.destroy();
            this.textInputModal = null;
        }

        this.isInputActive = true;

        const map = this.mapView;
        if (!map || typeof map.getTargetElement !== 'function') {
            this.isInputActive = false;
            onComplete(initialData);
            return;
        }

        const targetElement = map.getTargetElement();
        if (!targetElement) {
            this.isInputActive = false;
            onComplete(initialData);
            return;
        }

        const pixel = map.getPixelFromCoordinate(position);
        if (!pixel || pixel.length < 2) {
            this.isInputActive = false;
            onComplete(initialData);
            return;
        }

        let left = pixel[0] - 140;
        let top = pixel[1] - 130;
        left = Math.max(10, Math.min(left, window.innerWidth - 290));
        top = Math.max(10, Math.min(top, window.innerHeight - 270));

        // 使用 this.currentTheme 和 this.currentTranslations
        const t = this.currentTranslations || {
            addText: "添加文字",
            enterText: "请输入文字...",
            bold: "粗体",
            italic: "斜体",
            fontSize: "字号",
            color: "颜色",
            confirm: "确定",
            cancel: "取消"
        } as unknown as Translations;

        this.textInputModal = new TextInputModalBox(
            {
                initialText: initialData.text,
                initialFontSize: initialData.fontSize,
                initialColor: initialData.color,
                initialFontWeight: initialData.fontWeight,
                initialFontStyle: initialData.fontStyle,
                onConfirm: onComplete,
                onCancel: () => {
                    onComplete(initialData);
                    this.hideTextInputModal();
                },
                theme: this.currentTheme,
                t: t,
            },
            { x: left, y: top }
        );
    }


    public stopEdit(): void {
        if (this.textInputModal) {
            this.textInputModal.destroy();
            this.textInputModal = null;
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
        feature.set("fontWeight", data.fontWeight || "normal");
        feature.set("fontStyle", data.fontStyle || "normal");
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
                fontWeight: feature.get("fontWeight"),
                fontStyle: feature.get("fontStyle"),
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
            fontWeight: feature.get("fontWeight"),
            fontStyle: feature.get("fontStyle"),
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
        outlineWidth: number,
        fontWeight?: "normal" | "bold",
        fontStyle?: "normal" | "italic"
    ): void {
        const feature = this.features.get(id);
        if (!feature) return;
        feature.set("fontSize", fontSize);
        feature.set("fontFamily", fontFamily);
        feature.set("color", color);
        feature.set("backgroundColor", backgroundColor);
        feature.set("outlineColor", outlineColor);
        feature.set("outlineWidth", outlineWidth);
        if (fontWeight) feature.set("fontWeight", fontWeight);
        if (fontStyle) feature.set("fontStyle", fontStyle);
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
        return this.textInputModal !== null;
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
        if (this.textInputModal) {
            this.textInputModal.destroy();
            this.textInputModal = null;
        }
        super.destroy();
    }
}