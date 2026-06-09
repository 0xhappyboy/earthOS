import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Text from "ol/style/Text";
import { fromLonLat } from "ol/proj";
import { BaseLayer } from "../BaseLayer";
import { LayerTypeEnum, MarkerLayerData, MarkerLayerPointTypeEnum, MarkerLayerAnimationTypeEnum } from "../../types";
import { arrayToRgba } from "../../utils";
import { Icon, RegularShape } from "ol/style";

export interface MarkerLayerOptions {
    defaultColor?: number[];
    defaultSize?: number;
    popupWidth?: number;
    coverImageHeight?: number;
}

interface AnimationFrameInfo {
    startTime: number;
    frameId: number;
}

export class MarkerLayer extends BaseLayer {
    private moveHandler: (() => void) | null = null;
    private features: Map<string, Feature> = new Map();
    private markersData: Map<string, MarkerLayerData> = new Map();
    private animationFrames: Map<string, AnimationFrameInfo> = new Map();
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

    private createPointStyle(data: MarkerLayerData): Style {
        const pointType = data.pointType || MarkerLayerPointTypeEnum.CIRCLE;
        const pointColor = data.pointColor || arrayToRgba(this.defaultColor);
        const pointSize = data.pointSize || this.defaultSize;
        const pointText = data.pointText || "标绘点";
        const strokeColor = "#ffffff";
        const strokeWidth = 2;
        const pointHtml = data.pointHtml;
        if (pointType === MarkerLayerPointTypeEnum.TEXT) {
            return new Style({
                text: new Text({
                    text: pointText,
                    font: `${pointSize}px sans-serif`,
                    fill: new Fill({ color: pointColor }),
                    stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
                    textAlign: "center",
                    textBaseline: "middle",
                }),
            });
        }


        if (pointType === MarkerLayerPointTypeEnum.CIRCLE) {
            return new Style({
                image: new CircleStyle({
                    radius: pointSize / 2,
                    fill: new Fill({ color: pointColor }),
                    stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
                }),
            });
        }


        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = pointSize * 2.5;
        canvas.width = size;
        canvas.height = size;
        const center = size / 2;

        if (!ctx) {

            return new Style({
                image: new CircleStyle({
                    radius: pointSize / 2,
                    fill: new Fill({ color: pointColor }),
                    stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
                }),
            });
        }

        ctx.fillStyle = pointColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.save();
        ctx.translate(center, center);

        switch (pointType) {

            case MarkerLayerPointTypeEnum.SQUARE:
                const halfSize = pointSize / 1.8;
                ctx.fillRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
                ctx.strokeRect(-halfSize, -halfSize, halfSize * 2, halfSize * 2);
                break;

            case MarkerLayerPointTypeEnum.TRIANGLE:
                const triHeight = pointSize / 0.9;
                const triHalfBase = pointSize / 1.8;
                ctx.beginPath();
                ctx.moveTo(0, -triHeight / 2);
                ctx.lineTo(triHalfBase, triHeight / 2);
                ctx.lineTo(-triHalfBase, triHeight / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.PENTAGRAM:
                const outerRadius = pointSize / 1.2;
                const innerRadius = outerRadius / 2.2;
                const points = 5;
                ctx.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI * 2) / (points * 2) - Math.PI / 2;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.DIAMOND:
                const diamondWidth = pointSize / 1.2;
                const diamondHeight = pointSize / 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -diamondHeight / 2);
                ctx.lineTo(diamondWidth / 2, 0);
                ctx.lineTo(0, diamondHeight / 2);
                ctx.lineTo(-diamondWidth / 2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.CROSS:
                const barWidth = pointSize / 3;
                const barLength = pointSize * 1.2;
                ctx.fillRect(-barLength / 2, -barWidth / 2, barLength, barWidth);
                ctx.strokeRect(-barLength / 2, -barWidth / 2, barLength, barWidth);
                ctx.fillRect(-barWidth / 2, -barLength / 2, barWidth, barLength);
                ctx.strokeRect(-barWidth / 2, -barLength / 2, barWidth, barLength);
                break;

            case MarkerLayerPointTypeEnum.X_SHAPE:
                const xBarWidth = pointSize / 4;
                const xBarLength = pointSize * 1.4;
                ctx.save();
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-xBarLength / 2, -xBarWidth / 2, xBarLength, xBarWidth);
                ctx.strokeRect(-xBarLength / 2, -xBarWidth / 2, xBarLength, xBarWidth);
                ctx.rotate(Math.PI / 2);
                ctx.fillRect(-xBarLength / 2, -xBarWidth / 2, xBarLength, xBarWidth);
                ctx.strokeRect(-xBarLength / 2, -xBarWidth / 2, xBarLength, xBarWidth);
                ctx.restore();
                break;

            case MarkerLayerPointTypeEnum.HEXAGON:
                const hexRadius = pointSize / 1.3;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * 60 - 30) * Math.PI / 180;
                    const x = hexRadius * Math.cos(angle);
                    const y = hexRadius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.FLAG:
                const poleHeight = pointSize / 1.2;
                const flagWidth = pointSize / 1.5;
                const flagHeight = pointSize / 1.8;
                ctx.fillRect(-flagWidth / 2, -poleHeight / 2, pointSize / 6, poleHeight);
                ctx.strokeRect(-flagWidth / 2, -poleHeight / 2, pointSize / 6, poleHeight);
                ctx.fillRect(-flagWidth / 2, -poleHeight / 2, flagWidth, flagHeight);
                ctx.strokeRect(-flagWidth / 2, -poleHeight / 2, flagWidth, flagHeight);
                break;

            case MarkerLayerPointTypeEnum.HOUSE:
                const houseWidth = pointSize / 1.2;
                const houseHeight = pointSize / 1.5;
                const roofHeight = pointSize / 1.8;
                ctx.fillRect(-houseWidth / 2, -houseHeight / 3, houseWidth, houseHeight);
                ctx.strokeRect(-houseWidth / 2, -houseHeight / 3, houseWidth, houseHeight);
                ctx.beginPath();
                ctx.moveTo(-houseWidth / 2, -houseHeight / 3);
                ctx.lineTo(0, -houseHeight / 3 - roofHeight);
                ctx.lineTo(houseWidth / 2, -houseHeight / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.ARROW:
                const arrowSize = pointSize / 1.2;
                const arrowTail = pointSize / 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -arrowSize / 2);
                ctx.lineTo(arrowSize / 2, arrowSize / 2);
                ctx.lineTo(0, arrowSize / 3);
                ctx.lineTo(-arrowSize / 2, arrowSize / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(-pointSize / 8, arrowSize / 3, pointSize / 4, arrowTail);
                ctx.strokeRect(-pointSize / 8, arrowSize / 3, pointSize / 4, arrowTail);
                break;


            case MarkerLayerPointTypeEnum.TENT:

                const tentWidth = pointSize / 1.2;
                const tentHeight = pointSize / 1.2;
                ctx.beginPath();
                ctx.moveTo(-tentWidth / 2, tentHeight / 3);
                ctx.lineTo(0, -tentHeight / 2);
                ctx.lineTo(tentWidth / 2, tentHeight / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillRect(-tentWidth / 6, tentHeight / 3, tentWidth / 3, tentHeight / 3);
                ctx.strokeRect(-tentWidth / 6, tentHeight / 3, tentWidth / 3, tentHeight / 3);
                break;

            case MarkerLayerPointTypeEnum.BUNKER:

                const bunkerRadius = pointSize / 1.5;
                ctx.beginPath();
                ctx.arc(0, bunkerRadius / 3, bunkerRadius, 0, Math.PI, true);
                ctx.fill();
                ctx.stroke();

                ctx.fillRect(-pointSize / 6, -pointSize / 4, pointSize / 3, pointSize / 4);
                ctx.strokeRect(-pointSize / 6, -pointSize / 4, pointSize / 3, pointSize / 4);
                break;

            case MarkerLayerPointTypeEnum.LANDMINE:

                const mineRadius = pointSize / 2;
                ctx.beginPath();
                ctx.arc(0, 0, mineRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                for (let i = 0; i < 4; i++) {
                    const angle = i * Math.PI / 2;
                    const x = mineRadius * 0.7 * Math.cos(angle);
                    const y = mineRadius * 0.7 * Math.sin(angle);
                    ctx.beginPath();
                    ctx.arc(x, y, pointSize / 8, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }
                break;

            case MarkerLayerPointTypeEnum.TANK:

                ctx.fillRect(-pointSize / 1.5, -pointSize / 3, pointSize / 0.8, pointSize / 1.5);
                ctx.strokeRect(-pointSize / 1.5, -pointSize / 3, pointSize / 0.8, pointSize / 1.5);

                ctx.beginPath();
                ctx.arc(0, -pointSize / 6, pointSize / 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.fillRect(pointSize / 4, -pointSize / 4, pointSize / 1.5, pointSize / 8);
                ctx.strokeRect(pointSize / 4, -pointSize / 4, pointSize / 1.5, pointSize / 8);

                ctx.fillRect(-pointSize / 1.8, pointSize / 5, pointSize / 0.9, pointSize / 6);
                ctx.strokeRect(-pointSize / 1.8, pointSize / 5, pointSize / 0.9, pointSize / 6);
                break;

            case MarkerLayerPointTypeEnum.PLANE:

                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 2);
                ctx.lineTo(pointSize / 1.5, pointSize / 3);
                ctx.lineTo(pointSize / 3, pointSize / 3);
                ctx.lineTo(pointSize / 3, pointSize / 2);
                ctx.lineTo(0, pointSize / 3);
                ctx.lineTo(-pointSize / 3, pointSize / 2);
                ctx.lineTo(-pointSize / 3, pointSize / 3);
                ctx.lineTo(-pointSize / 1.5, pointSize / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.SHIP:

                ctx.beginPath();
                ctx.moveTo(-pointSize / 1.5, 0);
                ctx.lineTo(0, pointSize / 2);
                ctx.lineTo(pointSize / 1.5, 0);
                ctx.lineTo(pointSize / 2, -pointSize / 3);
                ctx.lineTo(-pointSize / 2, -pointSize / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.fillRect(-pointSize / 6, -pointSize / 2, pointSize / 5, pointSize / 3);
                ctx.strokeRect(-pointSize / 6, -pointSize / 2, pointSize / 5, pointSize / 3);
                break;

            case MarkerLayerPointTypeEnum.RADAR:

                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(pointSize / 1.2, -pointSize / 1.2);
                ctx.lineTo(pointSize / 1.8, -pointSize / 1.8);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.MISSILE:

                ctx.beginPath();
                ctx.ellipse(0, -pointSize / 6, pointSize / 2.5, pointSize / 1.2, 0, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.5);
                ctx.lineTo(pointSize / 4, -pointSize / 2.5);
                ctx.lineTo(-pointSize / 4, -pointSize / 2.5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-pointSize / 3, pointSize / 2);
                ctx.lineTo(0, pointSize / 3);
                ctx.lineTo(pointSize / 3, pointSize / 2);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.FIRE_HYDRANT:
                ctx.fillRect(-pointSize / 4, -pointSize / 2, pointSize / 2, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 4, -pointSize / 2, pointSize / 2, pointSize / 1.2);
                ctx.beginPath();
                ctx.arc(0, -pointSize / 2, pointSize / 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.FIRST_AID:
                ctx.fillRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.strokeRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.fillStyle = "#ff0000";
                ctx.fillRect(-pointSize / 8, -pointSize / 2.5, pointSize / 4, pointSize / 1.2);
                ctx.fillRect(-pointSize / 2.5, -pointSize / 8, pointSize / 1.2, pointSize / 4);
                ctx.fillStyle = pointColor;
                ctx.strokeStyle = strokeColor;
                break;

            case MarkerLayerPointTypeEnum.WATER_TOWER:
                ctx.fillRect(-pointSize / 3, -pointSize / 2, pointSize / 1.5, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 3, -pointSize / 2, pointSize / 1.5, pointSize / 1.2);
                ctx.beginPath();
                ctx.arc(0, -pointSize / 2.5, pointSize / 2.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.GENERATOR:
                ctx.fillRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 4, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.MEGAPHONE:
                ctx.beginPath();
                ctx.moveTo(-pointSize / 2, -pointSize / 3);
                ctx.lineTo(pointSize / 2, -pointSize / 4);
                ctx.lineTo(pointSize / 2, pointSize / 4);
                ctx.lineTo(-pointSize / 2, pointSize / 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(-pointSize / 1.8, pointSize / 4, pointSize / 3, pointSize / 6);
                ctx.strokeRect(-pointSize / 1.8, pointSize / 4, pointSize / 3, pointSize / 6);
                break;

            case MarkerLayerPointTypeEnum.STREET_LAMP:
                ctx.fillRect(-pointSize / 12, -pointSize / 1.5, pointSize / 6, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 12, -pointSize / 1.5, pointSize / 6, pointSize / 1.2);
                ctx.beginPath();
                ctx.arc(0, -pointSize / 1.5, pointSize / 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.PARKING:
                ctx.fillStyle = "#0066cc";
                ctx.fillRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.strokeRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${pointSize / 1.5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("P", 0, 0);
                ctx.fillStyle = pointColor;
                ctx.strokeStyle = strokeColor;
                break;

            case MarkerLayerPointTypeEnum.GAS_STATION:
                ctx.fillRect(-pointSize / 4, -pointSize / 2, pointSize / 2, pointSize);
                ctx.strokeRect(-pointSize / 4, -pointSize / 2, pointSize / 2, pointSize);
                ctx.beginPath();
                ctx.moveTo(pointSize / 4, -pointSize / 3);
                ctx.lineTo(pointSize / 1.5, -pointSize / 2);
                ctx.lineTo(pointSize / 1.5, 0);
                ctx.lineTo(pointSize / 4, pointSize / 3);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.TUNNEL:
                ctx.beginPath();
                ctx.rect(-pointSize / 1.5, 0, pointSize / 0.75, pointSize / 1.5);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 1.5, 0, Math.PI, true);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.BRIDGE:
                ctx.fillRect(-pointSize / 1.5, -pointSize / 4, pointSize / 0.75, pointSize / 4);
                ctx.strokeRect(-pointSize / 1.5, -pointSize / 4, pointSize / 0.75, pointSize / 4);
                ctx.beginPath();
                ctx.arc(0, -pointSize / 6, pointSize / 2, 0, Math.PI, false);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.TRAFFIC_LIGHT:
                ctx.fillRect(-pointSize / 3, -pointSize / 1.5, pointSize / 1.5, pointSize / 0.8);
                ctx.strokeRect(-pointSize / 3, -pointSize / 1.5, pointSize / 1.5, pointSize / 0.8);
                const lightRadius = pointSize / 6;
                ctx.beginPath();
                ctx.arc(0, -pointSize / 3, lightRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, lightRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, pointSize / 3, lightRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.CAMERA:
                ctx.beginPath();
                ctx.arc(0, -pointSize / 6, pointSize / 2.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(-pointSize / 4, pointSize / 4, pointSize / 2, pointSize / 4);
                ctx.strokeRect(-pointSize / 4, pointSize / 4, pointSize / 2, pointSize / 4);
                break;

            case MarkerLayerPointTypeEnum.TOILET:
                ctx.fillRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.strokeRect(-pointSize / 2, -pointSize / 2, pointSize, pointSize);
                ctx.fillStyle = "#ffffff";
                ctx.font = `${pointSize / 1.5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("WC", 0, 0);
                ctx.fillStyle = pointColor;
                ctx.strokeStyle = strokeColor;
                break;

            case MarkerLayerPointTypeEnum.TRASH_CAN:
                ctx.fillRect(-pointSize / 3, -pointSize / 2, pointSize / 1.5, pointSize);
                ctx.strokeRect(-pointSize / 3, -pointSize / 2, pointSize / 1.5, pointSize);
                ctx.fillRect(-pointSize / 2, -pointSize / 1.8, pointSize, pointSize / 6);
                ctx.strokeRect(-pointSize / 2, -pointSize / 1.8, pointSize, pointSize / 6);
                break;

            case MarkerLayerPointTypeEnum.BUS_STOP:
                ctx.fillRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.fillStyle = "#ffffff";
                ctx.font = `${pointSize / 1.5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("BUS", 0, 0);
                ctx.fillStyle = pointColor;
                break;

            case MarkerLayerPointTypeEnum.SUBWAY:
                ctx.fillRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${pointSize / 1.5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("M", 0, 0);
                ctx.fillStyle = pointColor;
                break;
            case MarkerLayerPointTypeEnum.SCHOOL:
                ctx.fillRect(-pointSize / 2, -pointSize / 3, pointSize, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 2, -pointSize / 3, pointSize, pointSize / 1.2);
                ctx.fillRect(-pointSize / 6, -pointSize / 1.2, pointSize / 3, pointSize / 1.5);
                ctx.strokeRect(-pointSize / 6, -pointSize / 1.2, pointSize / 3, pointSize / 1.5);
                ctx.beginPath();
                ctx.moveTo(-pointSize / 2, -pointSize / 3);
                ctx.lineTo(0, -pointSize / 1.2);
                ctx.lineTo(pointSize / 2, -pointSize / 3);
                ctx.fill();
                ctx.stroke();
                break;
            case MarkerLayerPointTypeEnum.HOSPITAL:
                ctx.fillRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.strokeRect(-pointSize / 1.8, -pointSize / 2, pointSize / 0.9, pointSize / 1.2);
                ctx.fillStyle = "#ffffff";
                ctx.font = `bold ${pointSize / 1.5}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("H", 0, 0);
                ctx.fillStyle = pointColor;
                break;
            case MarkerLayerPointTypeEnum.TREE:
                ctx.fillRect(-pointSize / 8, 0, pointSize / 4, pointSize / 1.5);
                ctx.strokeRect(-pointSize / 8, 0, pointSize / 4, pointSize / 1.5);
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.5);
                ctx.lineTo(-pointSize / 2, 0);
                ctx.lineTo(pointSize / 2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.WATER_SOURCE:
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.8);
                ctx.bezierCurveTo(
                    -pointSize / 1.5, -pointSize / 4,
                    -pointSize / 1.5, pointSize / 2,
                    0, pointSize / 2
                );
                ctx.bezierCurveTo(
                    pointSize / 1.5, pointSize / 2,
                    pointSize / 1.5, -pointSize / 4,
                    0, -pointSize / 1.8
                );
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.MOUNTAIN:
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.5);
                ctx.lineTo(-pointSize / 1.2, pointSize / 2);
                ctx.lineTo(pointSize / 1.2, pointSize / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 2);
                ctx.lineTo(-pointSize / 4, 0);
                ctx.lineTo(pointSize / 4, 0);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = pointColor;
                break;

            case MarkerLayerPointTypeEnum.MINE:
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.5);
                ctx.lineTo(pointSize / 1.5, 0);
                ctx.lineTo(0, pointSize / 1.5);
                ctx.lineTo(-pointSize / 1.5, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-pointSize / 4, -pointSize / 4);
                ctx.lineTo(pointSize / 4, pointSize / 4);
                ctx.moveTo(pointSize / 4, -pointSize / 4);
                ctx.lineTo(-pointSize / 4, pointSize / 4);
                ctx.stroke();
                break;
            case MarkerLayerPointTypeEnum.HEART:
                ctx.beginPath();
                const heartX = 0;
                const heartY = -pointSize / 4;
                const heartSize = pointSize / 1.5;
                ctx.moveTo(heartX, heartY + heartSize / 3);
                ctx.bezierCurveTo(
                    heartX - heartSize / 2, heartY - heartSize / 3,
                    heartX - heartSize, heartY + heartSize / 2,
                    heartX, heartY + heartSize
                );
                ctx.bezierCurveTo(
                    heartX + heartSize, heartY + heartSize / 2,
                    heartX + heartSize / 2, heartY - heartSize / 3,
                    heartX, heartY + heartSize / 3
                );
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.STAR:
                const starSize = pointSize / 1.2;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    const angle = (i * 90 - 45) * Math.PI / 180;
                    const x1 = starSize * Math.cos(angle);
                    const y1 = starSize * Math.sin(angle);
                    const x2 = (starSize / 2.5) * Math.cos(angle + 45 * Math.PI / 180);
                    const y2 = (starSize / 2.5) * Math.sin(angle + 45 * Math.PI / 180);
                    if (i === 0) ctx.moveTo(x1, y1);
                    else ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.CLOUD:
                const cloudSize = pointSize / 1.5;
                ctx.beginPath();
                ctx.arc(-cloudSize / 2, -cloudSize / 4, cloudSize / 2, 0, 2 * Math.PI);
                ctx.arc(cloudSize / 2, -cloudSize / 4, cloudSize / 2, 0, 2 * Math.PI);
                ctx.arc(0, 0, cloudSize / 1.5, 0, 2 * Math.PI);
                ctx.arc(-cloudSize / 1.5, cloudSize / 4, cloudSize / 2.5, 0, 2 * Math.PI);
                ctx.arc(cloudSize / 1.5, cloudSize / 4, cloudSize / 2.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.GEAR:
                const gearRadius = pointSize / 1.5;
                const toothCount = 8;
                const toothLength = pointSize / 4;
                ctx.beginPath();
                for (let i = 0; i < toothCount; i++) {
                    const angle = (i * 360 / toothCount) * Math.PI / 180;
                    const x1 = gearRadius * Math.cos(angle);
                    const y1 = gearRadius * Math.sin(angle);
                    const x2 = (gearRadius + toothLength) * Math.cos(angle);
                    const y2 = (gearRadius + toothLength) * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x1, y1);
                    else ctx.lineTo(x1, y1);
                    ctx.lineTo(x2, y2);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, gearRadius / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.LIGHTNING:
                ctx.beginPath();
                ctx.moveTo(-pointSize / 6, -pointSize / 1.5);
                ctx.lineTo(pointSize / 4, -pointSize / 6);
                ctx.lineTo(0, -pointSize / 6);
                ctx.lineTo(pointSize / 6, pointSize / 1.5);
                ctx.lineTo(-pointSize / 4, pointSize / 6);
                ctx.lineTo(0, pointSize / 6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.PIN:
                ctx.beginPath();
                ctx.arc(0, -pointSize / 4, pointSize / 3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-pointSize / 6, -pointSize / 8);
                ctx.lineTo(0, pointSize / 2);
                ctx.lineTo(pointSize / 6, -pointSize / 8);
                ctx.fill();
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.COMPASS:
                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 1.5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -pointSize / 1.8);
                ctx.lineTo(pointSize / 8, 0);
                ctx.lineTo(0, pointSize / 1.8);
                ctx.lineTo(-pointSize / 8, 0);
                ctx.closePath();
                ctx.fillStyle = "#ff0000";
                ctx.fill();
                ctx.fillStyle = pointColor;
                ctx.stroke();
                break;

            case MarkerLayerPointTypeEnum.ANCHOR:
                const anchorSize = pointSize / 1.5;
                ctx.beginPath();
                ctx.arc(0, anchorSize / 3, anchorSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                ctx.fillRect(-pointSize / 8, -anchorSize / 2, pointSize / 4, anchorSize);
                ctx.strokeRect(-pointSize / 8, -anchorSize / 2, pointSize / 4, anchorSize);
                ctx.fillRect(-anchorSize / 1.5, -anchorSize / 4, anchorSize / 0.75, pointSize / 6);
                ctx.strokeRect(-anchorSize / 1.5, -anchorSize / 4, anchorSize / 0.75, pointSize / 6);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, pointSize / 2, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
                break;
        }
        ctx.restore();
        return new Style({
            image: new Icon({
                img: canvas,
                size: [size, size],
            }),
        });
    }

    private startAnimation(feature: Feature, animationType: MarkerLayerAnimationTypeEnum): void {
        const id = feature.get("id");
        if (!id) return;
        this.stopAnimation(id);
        const baseStyle = this.createPointStyle(this.markersData.get(id)!);
        const startTime = performance.now();
        const animate = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            let animatedStyle: Style;
            switch (animationType) {
                case MarkerLayerAnimationTypeEnum.PULSE:
                    const pulseScale = 0.7 + 0.3 * (Math.sin(elapsed * 0.008) + 1) / 2;
                    animatedStyle = this.createScaledStyle(this.markersData.get(id)!, pulseScale);
                    break;
                case MarkerLayerAnimationTypeEnum.FLASHING:
                    const flashIntensity = 0.3 + 0.7 * (Math.sin(elapsed * 0.012) + 1) / 2;
                    animatedStyle = this.createBlendedStyle(this.markersData.get(id)!, flashIntensity);
                    break;
                case MarkerLayerAnimationTypeEnum.BREATHING:
                    const breathOpacity = 0.3 + 0.7 * (Math.sin(elapsed * 0.005) + 1) / 2;
                    animatedStyle = this.createOpacityStyle(this.markersData.get(id)!, breathOpacity);
                    break;
                case MarkerLayerAnimationTypeEnum.LIGHT:
                    const lightIntensity = 0.3 + 0.7 * (Math.sin(elapsed * 0.01) + 1) / 2;
                    animatedStyle = this.createGlowStyle(this.markersData.get(id)!, lightIntensity);
                    break;

                default:
                    return;
            }
            feature.setStyle(animatedStyle);
            feature.changed();
            const frameId = requestAnimationFrame(animate);
            this.animationFrames.set(id, { startTime, frameId });
        };

        const frameId = requestAnimationFrame(animate);
        this.animationFrames.set(id, { startTime, frameId });
    }

    /**
     * Create scaled style for pulse animation
     */
    private createScaledStyle(data: MarkerLayerData, scale: number): Style {
        const scaledSize = Math.max(6, (data.pointSize || this.defaultSize) * scale);
        const scaledData = { ...data, pointSize: scaledSize };
        return this.createPointStyle(scaledData);
    }

    /**
     * Create blended style for flashing animation
     */
    private createBlendedStyle(data: MarkerLayerData, intensity: number): Style {
        const safeIntensity = Math.max(0.3, Math.min(1, intensity));
        const baseColor = data.pointColor || arrayToRgba(this.defaultColor);
        const blendedColor = `rgba(255, ${Math.floor(255 * safeIntensity)}, ${Math.floor(255 * safeIntensity)}, 0.9)`;
        const blendedData = { ...data, pointColor: blendedColor };
        return this.createPointStyle(blendedData);
    }

    /**
 * Create opacity style for breathing animation
 */
    private createOpacityStyle(data: MarkerLayerData, opacity: number): Style {
        const safeOpacity = Math.max(0.2, Math.min(1, opacity));
        const baseColor = data.pointColor || arrayToRgba(this.defaultColor);
        const opacityColor = baseColor.replace(/[\d.]+\)$/g, `${safeOpacity})`);
        const opacityData = { ...data, pointColor: opacityColor };
        return this.createPointStyle(opacityData);
    }

    /**
     * Create glow style for light animation
     */
    private createGlowStyle(data: MarkerLayerData, intensity: number): Style {
        const baseColor = data.pointColor || arrayToRgba(this.defaultColor);
        const glowSize = (data.pointSize || this.defaultSize) * (1 + intensity * 0.5);
        const glowData = { ...data, pointSize: glowSize };
        return this.createPointStyle(glowData);
    }

    /**
     * Stop animation for a marker
     */
    private stopAnimation(id: string): void {
        const animationInfo = this.animationFrames.get(id);
        if (animationInfo) {
            cancelAnimationFrame(animationInfo.frameId);
            this.animationFrames.delete(id);
        }
    }

    private async createHtmlStyle(data: MarkerLayerData): Promise<Style> {
        const pointColor = data.pointColor || arrayToRgba(this.defaultColor);
        const strokeColor = "#ffffff";
        const strokeWidth = 2;
        const pointHtml = data.pointHtml || "";
        const htmlWidth = data.pointHtmlWidth || 100;
        const htmlHeight = data.pointHtmlHeight || 20;
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.top = '-9999px';
        tempDiv.style.left = '-9999px';
        tempDiv.style.backgroundColor = pointColor;
        tempDiv.style.border = `${strokeWidth}px solid ${strokeColor}`;
        tempDiv.style.borderRadius = '6px';
        tempDiv.style.padding = '4px 8px';
        tempDiv.style.fontSize = '14px';
        tempDiv.style.fontFamily = 'sans-serif';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.color = '#ffffff';
        tempDiv.innerHTML = pointHtml;
        document.body.appendChild(tempDiv);
        const actualWidth = Math.max(tempDiv.offsetWidth + 16, htmlWidth);
        const actualHeight = Math.max(tempDiv.offsetHeight + 8, htmlHeight);
        document.body.removeChild(tempDiv);
        const canvas = document.createElement('canvas');
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${actualWidth}" height="${actualHeight}">
            <rect width="100%" height="100%" fill="${pointColor}" rx="6" ry="6" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="
                    width: ${actualWidth}px;
                    height: ${actualHeight}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: sans-serif;
                    font-size: 14px;
                    color: #ffffff;
                    text-align: center;
                    padding: 4px 8px;
                    box-sizing: border-box;
                ">
                    ${pointHtml}
                </div>
            </foreignObject>
        </svg>
    `;
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(new Style({
                    image: new Icon({
                        img: canvas,
                        size: [actualWidth, actualHeight],
                    }),
                }));
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
        });
    }

    public async addMarker(data: MarkerLayerData): Promise<void> {
        const feature = new Feature({
            geometry: new Point(fromLonLat([data.longitude, data.latitude])),
            id: data.id,
            name: data.name || 'Marker',
            bubbleBoxTitle: data.bubbleBoxTitle,
            bubbleBoxDescription: data.bubbleBoxDescription,
            bubbleBoxCoverImage: data.bubbleBoxCoverImage,
            timestamp: data.timestamp || Date.now(),
            _popupLayer: this.id,
        });
        if (data.pointHtml) {
            const style = await this.createHtmlStyle(data);
            feature.setStyle(style);
        } else {
            feature.setStyle(this.createPointStyle(data));
        }
        this.source?.addFeature(feature);
        this.features.set(data.id, feature);
        this.markersData.set(data.id, data);

        if (data.pointAnimationType) {
            this.startAnimation(feature, data.pointAnimationType);
        }
    }

    public removeMarker(id: string): void {
        const feature = this.features.get(id);
        if (feature) {
            this.stopAnimation(id);
            this.source?.removeFeature(feature);
            this.features.delete(id);
            this.markersData.delete(id);
            if (this.currentFeature === feature) {
                this.hidePopup();
            }
        }
    }

    public async updateMarker(id: string, data: Partial<MarkerLayerData>): Promise<void> {
        const feature = this.features.get(id);
        const existingData = this.markersData.get(id);
        if (!feature || !existingData) return;
        const oldAnimationType = existingData.pointAnimationType;
        const newAnimationType = data.pointAnimationType;
        if (data.longitude !== undefined && data.latitude !== undefined) {
            feature.setGeometry(new Point(fromLonLat([data.longitude, data.latitude])));
        }
        if (data.bubbleBoxTitle !== undefined) feature.set("bubbleBoxTitle", data.bubbleBoxTitle);
        if (data.bubbleBoxDescription !== undefined) feature.set("bubbleBoxDescription", data.bubbleBoxDescription);
        if (data.bubbleBoxCoverImage !== undefined) feature.set("bubbleBoxCoverImage", data.bubbleBoxCoverImage);
        const mergedData = { ...existingData, ...data };
        if (data.pointColor !== undefined || data.pointSize !== undefined ||
            data.pointType !== undefined || data.pointText !== undefined ||
            data.pointHtml !== undefined) {
            if (mergedData.pointHtml) {
                const style = await this.createHtmlStyle(mergedData);
                feature.setStyle(style);
            } else {
                feature.setStyle(this.createPointStyle(mergedData));
            }
        }
        this.markersData.set(id, mergedData);
        feature.changed();
        if (oldAnimationType !== newAnimationType) {
            if (oldAnimationType) {
                this.stopAnimation(id);
            }
            if (newAnimationType) {
                this.startAnimation(feature, newAnimationType);
            }
        } else if (newAnimationType && (data.pointColor !== undefined || data.pointSize !== undefined)) {
            this.stopAnimation(id);
            this.startAnimation(feature, newAnimationType);
        }
    }

    private showPopup(feature: Feature, event: any): void {
        this.hidePopup();
        this.currentFeature = feature;
        const id = feature.get("id");
        const markerData = this.markersData.get(id);
        const g = feature.getGeometry() as Point;
        const coordinates = g.getCoordinates();
        if (this.view && coordinates) {
            this.view.getView().animate({
                center: coordinates,
                duration: 300
            });
        }
        if (markerData && markerData.onClick) {
            markerData.onClick(markerData, event);
        }
        const attrs = feature.getProperties();
        const hasCover = attrs.bubbleBoxCoverImage && attrs.bubbleBoxCoverImage.trim() !== "";
        const hasTitle = attrs.bubbleBoxTitle && attrs.bubbleBoxTitle.trim() !== "";
        const hasDesc = attrs.bubbleBoxDescription && attrs.bubbleBoxDescription.trim() !== "";
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
                    <img src="${attrs.bubbleBoxCoverImage}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>`;
        }
        html += `<div style="padding: 12px;">`;
        if (hasTitle) {
            html += `<div style="font-size: 14px; font-weight: 600; color: ${titleColor}; margin-bottom: 8px;">${attrs.bubbleBoxTitle}</div>`;
        }
        if (hasDesc) {
            html += `<div style="font-size: 12px; color: ${descColor}; line-height: 1.5;">${attrs.bubbleBoxDescription}</div>`;
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
        this.animationFrames.forEach((_, id) => {
            this.stopAnimation(id);
        });
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
        this.animationFrames.forEach((_, id) => {
            this.stopAnimation(id);
        });
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