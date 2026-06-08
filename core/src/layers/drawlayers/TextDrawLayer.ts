import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Draw from "ol/interaction/Draw";
// @ts-ignore
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
    private editingHelperFeature: Feature | null = null; // 辅助框 feature
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
        // 如果是辅助框，显示边框但不显示文字内容
        if (feature?.get("isHelper")) {
            return this.getHelperStyle();
        }

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

    // 获取辅助框的样式（显示控制框）
    private getHelperStyle(): Style {
        const isDark = this.currentTheme === "dark";
        // 计算文字的大致尺寸用于辅助框
        return new Style({
            fill: new Fill({ color: "rgba(0, 170, 255, 0.05)" }),
            stroke: new Stroke({
                color: "#ffaa00",
                width: 2,
                lineDash: [8, 6],
            }),
        });
    }

    // 创建辅助框几何体（矩形）
    private createHelperGeometry(center: [number, number], text: string, fontSize: number): Polygon {
        // 估算文字宽度（每个字符大约 fontSize * 0.6 像素，这里简化为字符数 * fontSize * 0.6）
        // 由于是地理坐标，需要根据缩放级别估算，这里简化处理
        const charWidth = fontSize * 0.6;
        const textWidth = text.length * charWidth;
        const textHeight = fontSize * 1.2;
        const halfWidth = textWidth / 2;
        const halfHeight = textHeight / 2;
        const [x, y] = center;

        return new Polygon([[
            [x - halfWidth, y - halfHeight],
            [x + halfWidth, y - halfHeight],
            [x + halfWidth, y + halfHeight],
            [x - halfWidth, y + halfHeight],
            [x - halfWidth, y - halfHeight]
        ]]);
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

        const simpleT = {
            addText: "添加文字",
            enterText: "请输入文字...",
            bold: "粗体",
            italic: "斜体",
            fontSize: "字号",
            color: "颜色",
            confirm: "确定",
            cancel: "取消",
            delete: "删除"
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
                        feature.set("scale", 1);

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

    // 开始编辑（移动/缩放模式）- 左键单击触发
    public startEdit(id: string, onComplete?: (data: TextDrawData) => void): void {
        this.stopEdit();
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }
        this.editingFeature = targetFeature;
        this.onEditCompleteCallback = onComplete || null;

        const geometry = targetFeature.getGeometry();
        if (!(geometry instanceof Point)) return;

        const [x, y] = geometry.getCoordinates();
        const content = targetFeature.get("content") || "";
        const fontSize = targetFeature.get("fontSize") || this.defaultFontSize;

        // 创建辅助框 feature（基于文字内容和字体大小估算）
        const helperGeometry = this.createHelperGeometry([x, y], content, fontSize);
        this.editingHelperFeature = new Feature({
            geometry: helperGeometry,
            isHelper: true,
        });
        this.editingHelperFeature.setStyle(this.getHelperStyle());
        this.source?.addFeature(this.editingHelperFeature);

        const tempSource = new VectorSource();
        tempSource.addFeature(this.editingHelperFeature);
        const tempFeatures = tempSource.getFeaturesCollection();

        this.transformInteraction = new Transform({
            features: tempFeatures as any,
            translate: true,
            scale: true,
            rotate: false,
            keepAspectRatio: (event: any) => event.shiftKey,
        });
        this.transformInteraction.setActive(true);

        // 缩放结束
        this.transformInteraction.on("scaleend", () => {
            if (!this.editingHelperFeature || !targetFeature) return;
            const helperGeom = this.editingHelperFeature.getGeometry();
            if (helperGeom instanceof Polygon) {
                const extent = helperGeom.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;
                // 根据辅助框宽度计算新的字体大小
                const newWidth = extent[2] - extent[0];
                const originalWidth = this.createHelperGeometry([x, y], content, fontSize).getExtent()[2] - extent[0];
                const scale = newWidth / originalWidth;
                const newFontSize = Math.max(8, fontSize * scale);

                const pointGeom = targetFeature.getGeometry() as Point;
                if (pointGeom) {
                    pointGeom.setCoordinates([centerX, centerY]);
                }
                targetFeature.set("fontSize", newFontSize);

                const [lng, lat] = toLonLat([centerX, centerY]);
                targetFeature.set("position", [lng, lat]);
                targetFeature.changed();

                // 更新辅助框
                const newHelperGeometry = this.createHelperGeometry([centerX, centerY], content, newFontSize);
                this.editingHelperFeature?.setGeometry(newHelperGeometry);

                const featureId = targetFeature.get("id");
                if (this.onEditCompleteCallback && featureId) {
                    this.onEditCompleteCallback({
                        id: featureId,
                        position: [lng, lat],
                        content: targetFeature.get("content"),
                        fontSize: newFontSize,
                        fontFamily: targetFeature.get("fontFamily"),
                        color: targetFeature.get("color"),
                        fontWeight: targetFeature.get("fontWeight"),
                        fontStyle: targetFeature.get("fontStyle"),
                        backgroundColor: targetFeature.get("backgroundColor"),
                        outlineColor: targetFeature.get("outlineColor"),
                        outlineWidth: targetFeature.get("outlineWidth"),
                    });
                }
                this.mapView?.render();
            }
        });

        // 移动结束
        this.transformInteraction.on("translateend", () => {
            if (!this.editingHelperFeature || !targetFeature) return;
            const helperGeom = this.editingHelperFeature.getGeometry();
            if (helperGeom instanceof Polygon) {
                const extent = helperGeom.getExtent();
                const centerX = (extent[0] + extent[2]) / 2;
                const centerY = (extent[1] + extent[3]) / 2;

                const pointGeom = targetFeature.getGeometry() as Point;
                if (pointGeom) {
                    pointGeom.setCoordinates([centerX, centerY]);
                }
                const [lng, lat] = toLonLat([centerX, centerY]);
                targetFeature.set("position", [lng, lat]);
                targetFeature.changed();

                // 更新辅助框位置
                const currentContent = targetFeature.get("content") || "";
                const currentFontSize = targetFeature.get("fontSize") || this.defaultFontSize;
                const newHelperGeometry = this.createHelperGeometry([centerX, centerY], currentContent, currentFontSize);
                this.editingHelperFeature?.setGeometry(newHelperGeometry);

                const featureId = targetFeature.get("id");
                if (this.onEditCompleteCallback && featureId) {
                    this.onEditCompleteCallback({
                        id: featureId,
                        position: [lng, lat],
                        content: targetFeature.get("content"),
                        fontSize: currentFontSize,
                        fontFamily: targetFeature.get("fontFamily"),
                        color: targetFeature.get("color"),
                        fontWeight: targetFeature.get("fontWeight"),
                        fontStyle: targetFeature.get("fontStyle"),
                        backgroundColor: targetFeature.get("backgroundColor"),
                        outlineColor: targetFeature.get("outlineColor"),
                        outlineWidth: targetFeature.get("outlineWidth"),
                    });
                }
                this.mapView?.render();
            }
        });

        this.mapView?.addInteraction(this.transformInteraction);
        this.mapView?.render();
    }

    // 编辑文字属性（内容、颜色等）- 右键单击触发
    public editProperties(id: string, onComplete?: (data: TextDrawData) => void, onDelete?: () => void): void {
        const targetFeature = this.features.get(id);
        if (!targetFeature) {
            return;
        }

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
                if (onComplete) {
                    onComplete(null as any);
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
                    if (result.text && result.text.trim()) {
                        targetFeature.set("content", result.text);
                        targetFeature.set("fontSize", result.fontSize);
                        targetFeature.set("color", result.color);
                        targetFeature.set("fontWeight", result.fontWeight);
                        targetFeature.set("fontStyle", result.fontStyle);
                        targetFeature.changed();
                        this.mapView?.render();

                        const position = targetFeature.get("position");
                        if (onComplete) {
                            onComplete({
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
                },
                handleDelete
            );
        }
    }

    public stopEdit(): void {
        if (this.transformInteraction) {
            this.mapView?.removeInteraction(this.transformInteraction);
            this.transformInteraction = null;
        }
        if (this.editingHelperFeature) {
            this.source?.removeFeature(this.editingHelperFeature);
            this.editingHelperFeature = null;
        }
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
        feature.set("scale", 1);
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