import { LayerManager } from "./layers/LayerManager";
import {
    CircleDrawLayer,
    RectangleDrawLayer,
    TriangleDrawLayer,
    DistanceMeasurementLayer,
    AreaMeasurementLayer,
    MarkerLayer,
    PolygonLayer,
    PolylineLayer,
    CircleLayer,
    HeatmapLayer,
    ClusterLayer,
    GeoJSONLayer,
    CustomTileLayer,
    BarChartLayer,
    PopupMarkerLayer,
} from "./layers";
import { FloatingToolbar, MeasurementFloatingToolbar } from "./components";
import { BasemapTypeEnum, CoordinateSystemTypeEnum, CircleDrawData, RectangleDrawData, TriangleDrawData } from "./types";
import { getTranslation, Locale, Translations } from "./i18n";
import { DrawToolManager } from "./draw/DrawToolManager";
import { CircleDrawTool } from "./draw/CircleDrawTool";
import { RectangleDrawTool } from "./draw/RectangleDrawTool";
import { TriangleDrawTool } from "./draw/TriangleDrawTool";
import { LayerInfo } from "./components/types";
import { MapManager } from "./MapManager";
import { DrawToolType } from "./draw";
import { UIManager } from "./UIManager";
import { DrawingManager } from "./DrawingManager";

export interface EarthViewOptions {
    container?: HTMLElement;
    containerSelector?: string;
    id?: string;
    parent?: HTMLElement;
    parentSelector?: string;
    basemap?: BasemapTypeEnum;
    center?: [number, number];
    zoom?: number;
    coordinateSystem?: CoordinateSystemTypeEnum;
    onLoad?: (core: EarthView) => void;
    onMoveEnd?: (center: [number, number], zoom: number) => void;
    onMapClick?: (event: { longitude: number; latitude: number }) => void;
    onCircleDrawn?: (data: CircleDrawData) => void;
    theme?: "light" | "dark";
    i18n?: Locale;
    enableDrawing?: boolean;
}

export class EarthView {
    private mapManager: MapManager;
    private layerManager: LayerManager;
    private uiManager!: UIManager;
    private drawingManager: DrawingManager;
    private drawToolManager: DrawToolManager;
    private circleDrawLayer: CircleDrawLayer | null = null;
    private rectangleDrawLayer: RectangleDrawLayer | null = null;
    private triangleDrawLayer: TriangleDrawLayer | null = null;
    private distanceMeasureLayer: DistanceMeasurementLayer | null = null;
    private areaMeasureLayer: AreaMeasurementLayer | null = null;
    private circleDrawTool: CircleDrawTool | null = null;
    private rectangleDrawTool: RectangleDrawTool | null = null;
    private triangleDrawTool: TriangleDrawTool | null = null;
    private floatingToolbar: FloatingToolbar | null = null;
    private measurementFloatingToolbar: MeasurementFloatingToolbar | null = null;
    private drawingStatusDiv: HTMLDivElement | null = null;
    private measureStatusDiv: HTMLDivElement | null = null;
    private container: HTMLElement;
    private isOwnContainer: boolean = false;
    private theme: "light" | "dark" = "dark";
    private t: Translations;
    private locale: Locale = "zh";
    private isDestroyed: boolean = false;
    private enableDrawing: boolean = true;
    private onLoadCallback?: (core: EarthView) => void;
    private onMoveEndCallback?: (center: [number, number], zoom: number) => void;
    private onMapClickCallback?: (event: { longitude: number; latitude: number }) => void;
    private onCircleDrawnCallback?: (data: CircleDrawData) => void;
    private showFloatingToolbar: boolean = false;
    private floatingToolbarPosition: { x: number; y: number } = { x: 100, y: 100 };
    private showMeasurementToolbar: boolean = false;
    private measurementToolbarPosition: { x: number; y: number } = { x: 100, y: 100 };
    private selectedCircleId: string | null = null;
    private selectedRectangleId: string | null = null;
    private selectedTriangleId: string | null = null;
    private selectedMeasurementId: string | null = null;
    private currentColor: number[] = [255, 0, 0, 1];
    private currentStrokeWidth: number = 3;
    private currentStrokeStyle: "solid" | "dashed" = "solid";
    private currentScale: string = "";
    private isLoading: boolean = true;
    private isChangingBasemap: boolean = false;
    private drawingStatusText: string | null = null;
    private measureStatusText: string | null = null;

    constructor(options: EarthViewOptions) {
        const {
            container,
            containerSelector,
            id,
            parent,
            parentSelector,
            basemap = BasemapTypeEnum.SATELLITE,
            center = [0, 0],
            zoom = 12,
            coordinateSystem = CoordinateSystemTypeEnum.WGS84,
            onLoad,
            onMoveEnd,
            onMapClick,
            onCircleDrawn,
            theme = "dark",
            i18n = "zh",
            enableDrawing = true,
        } = options;

        const { container: resolvedContainer, isOwn } = this.resolveContainer({
            container,
            containerSelector,
            id,
            parent,
            parentSelector
        });

        this.container = resolvedContainer;
        this.isOwnContainer = isOwn;
        this.theme = theme;
        this.locale = i18n;
        this.t = getTranslation(this.locale);
        this.onLoadCallback = onLoad;
        this.onMoveEndCallback = onMoveEnd;
        this.onMapClickCallback = onMapClick;
        this.onCircleDrawnCallback = onCircleDrawn;
        this.enableDrawing = enableDrawing;

        this.container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        this.container.style.cssText = 'position:relative;width:100%;height:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;';

        this.mapManager = new MapManager(this.container, basemap, center, zoom, coordinateSystem);
        this.layerManager = new LayerManager(this.mapManager.getMap());
        this.drawToolManager = new DrawToolManager();
        this.drawingManager = new DrawingManager();
        this.initUI();
        this.initLayers();
        this.initDrawingManager();
        this.bindEvents();
        this.initRightClickMenu();
        if (this.onLoadCallback) {
            setTimeout(() => this.onLoadCallback?.(this), 100);
        }
        setTimeout(() => this.hideLoading(), 500);
    }

    private resolveContainer(options: {
        container?: HTMLElement;
        containerSelector?: string;
        id?: string;
        parent?: HTMLElement;
        parentSelector?: string;
    }): { container: HTMLElement; isOwn: boolean } {
        const { container, containerSelector, id, parent, parentSelector } = options;
        if (container) {
            return { container, isOwn: false };
        }
        if (containerSelector) {
            const el = document.querySelector(containerSelector);
            if (!el) {
                throw new Error(`[EarthView] Container element not found: ${containerSelector}`);
            }
            return { container: el as HTMLElement, isOwn: false };
        }
        if (id) {
            const el = document.getElementById(id);
            if (!el) {
                throw new Error(`[EarthView] Container element not found: #${id}`);
            }
            return { container: el, isOwn: false };
        }
        if (parent) {
            const autoContainer = this.createAutoContainer();
            parent.appendChild(autoContainer);
            return { container: autoContainer, isOwn: true };
        }
        if (parentSelector) {
            const parentEl = document.querySelector(parentSelector);
            if (!parentEl) {
                throw new Error(`[EarthView] Parent element not found: ${parentSelector}`);
            }
            const autoContainer = this.createAutoContainer();
            parentEl.appendChild(autoContainer);
            return { container: autoContainer, isOwn: true };
        }

        throw new Error('[EarthView] Must provide one of: container, containerSelector, id, parent, or parentSelector');
    }

    private createAutoContainer(): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;margin:0;padding:0;box-sizing:border-box;';
        return container;
    }

    private initUI(): void {
        this.uiManager = new UIManager(
            this.container,
            this.theme,
            this.t,
            {
                onTogglePopup: (popup) => this.handleTogglePopup(popup),
                onZoomIn: () => this.zoomIn(),
                onZoomOut: () => this.zoomOut(),
                onLocate: () => this.locateUser(),
                onDrawCircle: () => this.startDrawCircle(),
                onDrawRectangle: () => this.startDrawRectangle(),
                onDrawTriangle: () => this.startDrawTriangle(),
                onEditShape: () => this.startEditShape(),
                onDistanceMeasure: () => this.startMeasureDistance(),
                onAreaMeasure: () => this.startMeasureArea(),
                onClearMeasurements: () => this.clearAllMeasurements(),
                onSetBasemap: (basemap) => this.setBasemap(basemap),
                onToggleLayerVisibility: (id) => this.setLayerVisibility(id, !this.getLayerVisibility(id)),
                onRemoveLayer: (id) => this.removeLayer(id),
            },
            () => this.getLayerList(),
            () => this.getBasemap()
        );
        this.createStatusIndicators();
    }

    private handleTogglePopup(popup: any): void {
    }

    private createStatusIndicators(): void {
        const isDark = this.theme === "dark";
        this.drawingStatusDiv = document.createElement("div");
        this.drawingStatusDiv.style.cssText = `
            position: absolute; top: 10px; left: 10px; z-index: 200;
            background: ${isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"}; border-radius: 8px;
            padding: 8px 16px; backdrop-filter: blur(4px);
            display: flex; align-items: center; gap: 10px;
            display: none;
        `;
        const spinner = document.createElement("div");
        spinner.style.cssText = `width:16px;height:16px;border:2px solid ${isDark ? "#555" : "#ccc"};border-top:2px solid #00aaff;border-radius:50%;animation:spin 0.8s linear infinite;`;
        this.drawingStatusDiv.appendChild(spinner);
        const statusText = document.createElement("span");
        statusText.style.cssText = `color:${isDark ? "#fff" : "#333"};font-size:12px;`;
        statusText.id = "drawing-status-text";
        this.drawingStatusDiv.appendChild(statusText);
        this.container.appendChild(this.drawingStatusDiv);

        this.measureStatusDiv = document.createElement("div");
        this.measureStatusDiv.style.cssText = `
            position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
            z-index: 200; background: ${isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"}; border-radius: 8px;
            padding: 6px 12px; backdrop-filter: blur(4px);
            display: flex; align-items: center; gap: 8px; pointer-events: none;
            display: none;
        `;
        const dot = document.createElement("div");
        dot.style.cssText = `width:8px;height:8px;background:#00aaff;border-radius:50%;animation:pulse 1s infinite;`;
        this.measureStatusDiv.appendChild(dot);
        const measureText = document.createElement("span");
        measureText.style.cssText = `color:${isDark ? "#fff" : "#333"};font-size:12px;`;
        measureText.id = "measure-status-text";
        this.measureStatusDiv.appendChild(measureText);
        this.container.appendChild(this.measureStatusDiv);

        const style = document.createElement("style");
        style.textContent = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.2)}}`;
        document.head.appendChild(style);
    }

    private initLayers(): void {
        if (!this.enableDrawing) return;
        this.circleDrawLayer = new CircleDrawLayer("circle-draw", "Circle Draw");
        this.circleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.circleDrawLayer);
        this.rectangleDrawLayer = new RectangleDrawLayer("rectangle-draw", "Rectangle Draw");
        this.rectangleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.rectangleDrawLayer);
        this.triangleDrawLayer = new TriangleDrawLayer("triangle-draw", "Triangle Draw");
        this.triangleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.triangleDrawLayer);
        this.distanceMeasureLayer = new DistanceMeasurementLayer("distance-measurement", "Distance Measurement");
        this.distanceMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.distanceMeasureLayer);
        this.areaMeasureLayer = new AreaMeasurementLayer("area-measurement", "Area Measurement");
        this.areaMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.areaMeasureLayer);
        this.circleDrawTool = new CircleDrawTool(this.circleDrawLayer, this.t);
        this.rectangleDrawTool = new RectangleDrawTool(this.rectangleDrawLayer, this.t);
        this.triangleDrawTool = new TriangleDrawTool(this.triangleDrawLayer, this.t);
        this.circleDrawTool.setOnDrawComplete(() => {
            this.onDrawingEnd();
        });
        this.rectangleDrawTool.setOnDrawComplete(() => {
            this.onDrawingEnd();
        });
        this.triangleDrawTool.setOnDrawComplete(() => {
            this.onDrawingEnd();
        });
        this.drawingManager.registerTools(this.circleDrawTool, this.rectangleDrawTool, this.triangleDrawTool);
        this.drawingManager.setCallbacks(
            (type) => this.onDrawingStart(type),
            () => this.onDrawingEnd()
        );
        this.setupSelections();
    }

    private onDrawingStart(type: DrawToolType): void {
        let msg = "";
        if (type === DrawToolType.CIRCLE) {
            msg = this.t.drawingCircle;
        } else if (type === DrawToolType.RECTANGLE) {
            msg = "正在绘制矩形...";
        } else if (type === DrawToolType.TRIANGLE) {
            msg = "正在绘制三角形...";
        }
        this.setDrawingStatus(msg);
    }

    private onDrawingEnd(): void {
        this.setDrawingStatus(null);
    }

    private setupSelections(): void {
        const map = this.mapManager.getMap();
        map.on("click", (event: any) => {
            const features = map.getFeaturesAtPixel(event.pixel);
            const circle = features?.find((f: any) => f.get("id")?.startsWith("circle_"));
            if (circle && this.circleDrawTool) { this.circleDrawTool.startEdit(circle.get("id")); return; }
            const rect = features?.find((f: any) => f.get("id")?.startsWith("rectangle_"));
            if (rect && this.rectangleDrawTool) { this.rectangleDrawTool.startEdit(rect.get("id")); return; }
            const tri = features?.find((f: any) => f.get("id")?.startsWith("triangle_"));
            if (tri && this.triangleDrawTool) { this.triangleDrawTool.startEdit(tri.get("id")); return; }
            this.stopAllEditing();
        });
    }

    private initDrawingManager(): void {
    }

    private bindEvents(): void {
        this.mapManager.getView().on("moveend" as any, () => {
            if (this.onMoveEndCallback && !this.isDestroyed) {
                this.onMoveEndCallback(this.getCenter(), this.getZoom());
            }
            this.updateScale();
        });
        if (this.onMapClickCallback) {
            this.mapManager.getMap().on("click", (event: any) => {
                const [lng, lat] = this.mapManager.getMap().getCoordinateFromPixel(event.pixel);
                this.onMapClickCallback?.({ longitude: lng, latitude: lat });
            });
        }
        this.mapManager.getMap().on("click", () => {
            this.hideFloatingToolbar();
            this.hideMeasurementToolbar();
        });
    }

    private initRightClickMenu(): void {
        this.container.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = [x, y];
            const features = this.mapManager.getMap().getFeaturesAtPixel(pixel);

            const circle = features?.find((f: any) => f.get("id")?.startsWith("circle_"));
            if (circle && this.circleDrawLayer) {
                const data = this.circleDrawLayer.getCircle(circle.get("id"));
                if (data) { this.selectedCircleId = data.id; this.showFloatingToolbarForCircle({ x, y }, data); return; }
            }
            const rectFeature = features?.find((f: any) => f.get("id")?.startsWith("rectangle_"));
            if (rectFeature && this.rectangleDrawLayer) {
                const data = this.rectangleDrawLayer.getRectangle(rectFeature.get("id"));
                if (data) { this.selectedRectangleId = data.id; this.showFloatingToolbarForRectangle({ x, y }, data); return; }
            }
            const tri = features?.find((f: any) => f.get("id")?.startsWith("triangle_"));
            if (tri && this.triangleDrawLayer) {
                const data = this.triangleDrawLayer.getTriangle(tri.get("id"));
                if (data) { this.selectedTriangleId = data.id; this.showFloatingToolbarForTriangle({ x, y }, data); return; }
            }
            const measure = features?.find((f: any) => f.get("measurementId"));
            if (measure) {
                this.selectedMeasurementId = measure.get("measurementId");
                this.showMeasurementToolbarForFeature({ x, y });
                return;
            }
            this.hideFloatingToolbar();
            this.hideMeasurementToolbar();
        });
    }

    public startDrawCircle(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingCircle();
    }

    public startDrawRectangle(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingRectangle();
    }

    public startDrawTriangle(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingTriangle();
    }

    public startEditShape(): void {
        const circles = this.circleDrawLayer?.getAllCircles() || [];
        if (circles.length > 0) { this.circleDrawTool?.startEdit(circles[circles.length - 1].id); return; }
        const rects = this.rectangleDrawLayer?.getAllRectangles() || [];
        if (rects.length > 0) { this.rectangleDrawTool?.startEdit(rects[rects.length - 1].id); return; }
        const tris = this.triangleDrawLayer?.getAllTriangles() || [];
        if (tris.length > 0) { this.triangleDrawTool?.startEdit(tris[tris.length - 1].id); return; }
        alert(this.t.noCirclesToEdit);
    }

    private stopAllEditing(): void {
        this.circleDrawLayer?.stopEdit();
        this.rectangleDrawLayer?.stopEdit();
        this.triangleDrawLayer?.stopEdit();
    }

    private showFloatingToolbarForCircle(pos: { x: number; y: number }, data: CircleDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [255, 0, 0, 1];
        this.currentStrokeWidth = data.outlineWidth || 3;
        if (this.floatingToolbar) {
            this.floatingToolbar.updatePosition(pos);
            this.floatingToolbar.setVisible(true);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(this.selectedCircleId, [color[0], color[1], color[2], 0.3], [color[0], color[1], color[2], 1], this.currentStrokeWidth, this.currentStrokeStyle);
                    }
                },
                onStrokeWidthChange: (width) => {
                    this.currentStrokeWidth = width;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(this.selectedCircleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], width, this.currentStrokeStyle);
                    }
                },
                onStrokeStyleChange: (style) => {
                    this.currentStrokeStyle = style;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(this.selectedCircleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], this.currentStrokeWidth, style);
                    }
                },
                onDelete: () => { if (this.selectedCircleId && this.circleDrawLayer) { this.circleDrawLayer.removeCircle(this.selectedCircleId); this.selectedCircleId = null; } this.hideFloatingToolbar(); },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (p) => { this.floatingToolbarPosition = p; },
                theme: this.theme, t: this.t, containerRef: this.container,
                currentColor: this.currentColor, currentStrokeWidth: this.currentStrokeWidth, currentStrokeStyle: this.currentStrokeStyle,
                position: pos,
            });
        }
    }

    private showFloatingToolbarForRectangle(pos: { x: number; y: number }, data: RectangleDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [0, 0, 255, 1];
        this.currentStrokeWidth = data.outlineWidth || 3;
        if (this.floatingToolbar) {
            this.floatingToolbar.updatePosition(pos);
            this.floatingToolbar.setVisible(true);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    if (this.selectedRectangleId && this.rectangleDrawLayer) {
                        this.rectangleDrawLayer.updateRectangleStyle(this.selectedRectangleId, [color[0], color[1], color[2], 0.3], [color[0], color[1], color[2], 1], this.currentStrokeWidth, this.currentStrokeStyle);
                    }
                },
                onStrokeWidthChange: (width) => {
                    this.currentStrokeWidth = width;
                    if (this.selectedRectangleId && this.rectangleDrawLayer) {
                        this.rectangleDrawLayer.updateRectangleStyle(this.selectedRectangleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], width, this.currentStrokeStyle);
                    }
                },
                onStrokeStyleChange: (style) => {
                    this.currentStrokeStyle = style;
                    if (this.selectedRectangleId && this.rectangleDrawLayer) {
                        this.rectangleDrawLayer.updateRectangleStyle(this.selectedRectangleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], this.currentStrokeWidth, style);
                    }
                },
                onDelete: () => { if (this.selectedRectangleId && this.rectangleDrawLayer) { this.rectangleDrawLayer.removeRectangle(this.selectedRectangleId); this.selectedRectangleId = null; } this.hideFloatingToolbar(); },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (p) => { this.floatingToolbarPosition = p; },
                theme: this.theme, t: this.t, containerRef: this.container,
                currentColor: this.currentColor, currentStrokeWidth: this.currentStrokeWidth, currentStrokeStyle: this.currentStrokeStyle,
                position: pos,
            });
        }
    }

    private showFloatingToolbarForTriangle(pos: { x: number; y: number }, data: TriangleDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [255, 255, 0, 1];
        this.currentStrokeWidth = data.outlineWidth || 3;
        if (this.floatingToolbar) {
            this.floatingToolbar.updatePosition(pos);
            this.floatingToolbar.setVisible(true);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    if (this.selectedTriangleId && this.triangleDrawLayer) {
                        this.triangleDrawLayer.updateTriangleStyle(this.selectedTriangleId, [color[0], color[1], color[2], 0.3], [color[0], color[1], color[2], 1], this.currentStrokeWidth, this.currentStrokeStyle);
                    }
                },
                onStrokeWidthChange: (width) => {
                    this.currentStrokeWidth = width;
                    if (this.selectedTriangleId && this.triangleDrawLayer) {
                        this.triangleDrawLayer.updateTriangleStyle(this.selectedTriangleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], width, this.currentStrokeStyle);
                    }
                },
                onStrokeStyleChange: (style) => {
                    this.currentStrokeStyle = style;
                    if (this.selectedTriangleId && this.triangleDrawLayer) {
                        this.triangleDrawLayer.updateTriangleStyle(this.selectedTriangleId, [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3], [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1], this.currentStrokeWidth, style);
                    }
                },
                onDelete: () => { if (this.selectedTriangleId && this.triangleDrawLayer) { this.triangleDrawLayer.removeTriangle(this.selectedTriangleId); this.selectedTriangleId = null; } this.hideFloatingToolbar(); },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (p) => { this.floatingToolbarPosition = p; },
                theme: this.theme, t: this.t, containerRef: this.container,
                currentColor: this.currentColor, currentStrokeWidth: this.currentStrokeWidth, currentStrokeStyle: this.currentStrokeStyle,
                position: pos,
            });
        }
    }

    private showMeasurementToolbarForFeature(pos: { x: number; y: number }): void {
        this.measurementToolbarPosition = pos;
        this.showMeasurementToolbar = true;
        if (this.measurementFloatingToolbar) {
            this.measurementFloatingToolbar.showAtPosition(pos);
            this.measurementFloatingToolbar.setVisible(true);
        } else {
            this.measurementFloatingToolbar = new MeasurementFloatingToolbar({
                onDelete: () => { if (this.selectedMeasurementId) { this.deleteMeasurement(this.selectedMeasurementId); } this.hideMeasurementToolbar(); },
                onClose: () => this.hideMeasurementToolbar(),
                onPositionChange: (p) => { this.measurementToolbarPosition = p; },
                theme: this.theme,
                t: this.t,
                containerRef: this.container,
                position: pos,
            });
        }
    }

    private hideFloatingToolbar(): void {
        this.showFloatingToolbar = false;
        this.selectedCircleId = null;
        this.selectedRectangleId = null;
        this.selectedTriangleId = null;
        this.floatingToolbar?.setVisible(false);
    }

    private hideMeasurementToolbar(): void {
        this.showMeasurementToolbar = false;
        this.selectedMeasurementId = null;
        this.measurementFloatingToolbar?.setVisible(false);
    }

    private getLayerList(): LayerInfo[] {
        return this.layerManager.getAllLayers().map(l => ({ id: l.id, name: l.name, visible: l.visible }));
    }

    private getLayerVisibility(id: string): boolean {
        return this.layerManager.getLayer(id)?.visible || false;
    }

    private updateScale(): void {
        const zoom = this.getZoom();
        if (zoom) {
            this.currentScale = zoom >= 10 ? `1:${Math.round(1000000 / Math.pow(2, zoom))}` : `1:${Math.round(10000000 / Math.pow(2, zoom))}`;
            this.uiManager.updateScale(this.currentScale);
        }
    }

    private setDrawingStatus(status: string | null): void {
        this.drawingStatusText = status;
        if (this.drawingStatusDiv) {
            const span = this.drawingStatusDiv.querySelector("#drawing-status-text");
            if (span) span.textContent = status || "";
            this.drawingStatusDiv.style.display = status ? "flex" : "none";
        }
    }

    private setMeasureStatus(status: string | null): void {
        this.measureStatusText = status;
        if (this.measureStatusDiv) {
            const span = this.measureStatusDiv.querySelector("#measure-status-text");
            if (span) span.textContent = status || "";
            this.measureStatusDiv.style.display = status ? "flex" : "none";
        }
    }

    private showLoading(message: string): void {
        this.isLoading = true;
        this.uiManager.showLoading(message);
    }

    private hideLoading(): void {
        this.isLoading = false;
        this.uiManager.hideLoading();
    }

    public getCenter(): [number, number] { return this.mapManager.getCenter(); }
    public getZoom(): number { return this.mapManager.getZoom(); }
    public setCenter(center: [number, number], cs?: CoordinateSystemTypeEnum): void { this.mapManager.setCenter(center, cs); }
    public setZoom(zoom: number): void { this.mapManager.setZoom(zoom); this.updateScale(); }
    public setBasemap(basemap: BasemapTypeEnum): void { this.showLoading(this.t.changingBasemap); this.mapManager.setBasemap(basemap); setTimeout(() => this.hideLoading(), 500); }
    public getBasemap(): BasemapTypeEnum { return this.mapManager.getCurrentBasemap(); }
    public setTheme(theme: "light" | "dark"): void { this.theme = theme; this.container.setAttribute("data-theme", theme); document.body.setAttribute("data-theme", theme); this.uiManager.updateTheme(theme); }
    public getTheme(): "light" | "dark" { return this.theme; }
    public setLocale(locale: Locale): void { this.locale = locale; this.t = getTranslation(locale); this.uiManager.updateLocale(this.t); }
    public getContainer(): HTMLElement { return this.container; }
    public getLayerManager(): LayerManager { return this.layerManager; }
    public getMap(): any { return this.mapManager.getMap(); }

    public addMarkerLayer(id: string, name: string, options?: any): MarkerLayer {
        const layer = new MarkerLayer(id, name, { ...options, visible: true, opacity: 1 });
        this.layerManager.addLayer(layer);
        return layer;
    }

    public removeLayer(id: string): void { this.layerManager.removeLayer(id); }
    public setLayerVisibility(id: string, visible: boolean): void { this.layerManager.getLayer(id)?.setVisible(visible); }

    public startMeasureDistance(): void {
        this.setMeasureStatus(this.t.clickToStartMeasure);
        this.distanceMeasureLayer?.startMeasure((data: any) => {
            if (data.isDrawing) {
                const dist = data.distance >= 1000 ? `${(data.distance / 1000).toFixed(2)} ${this.t.kilometers}` : `${data.distance.toFixed(0)} ${this.t.meters}`;
                this.setMeasureStatus(`${this.t.distance}: ${dist} | ${this.t.doubleClickToFinish}`);
            } else {
                this.setMeasureStatus(null);
            }
        });
    }

    public startMeasureArea(): void {
        this.setMeasureStatus(this.t.clickToStartMeasure);
        this.areaMeasureLayer?.startMeasure((data: any) => {
            const area = data.area >= 1000000 ? `${(data.area / 1000000).toFixed(2)} ${this.t.squareKilometers}` : `${data.area.toFixed(0)} ${this.t.squareMeters}`;
            this.setMeasureStatus(`${this.t.area}: ${area}`);
            setTimeout(() => this.setMeasureStatus(null), 2000);
        });
    }

    public clearAllMeasurements(): void {
        this.distanceMeasureLayer?.clearAllMeasurements();
        this.areaMeasureLayer?.clearAllMeasurements();
        this.setMeasureStatus(null);
    }

    public deleteMeasurement(id: string): boolean {
        return this.distanceMeasureLayer?.deleteMeasurement(id) || this.areaMeasureLayer?.deleteMeasurement(id) || false;
    }

    public zoomIn(): void { this.setZoom(this.getZoom() + 1); }
    public zoomOut(): void { this.setZoom(this.getZoom() - 1); }

    public locateUser(): void {
        if (!navigator.geolocation) return;
        this.showLoading(this.t.locateMe);
        navigator.geolocation.getCurrentPosition(
            (pos) => { this.setCenter([pos.coords.longitude, pos.coords.latitude]); this.setZoom(15); this.hideLoading(); },
            () => this.hideLoading()
        );
    }

    public destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.uiManager.destroy();
        this.drawingManager.destroy();
        this.floatingToolbar?.destroy();
        this.measurementFloatingToolbar?.destroy();
        this.drawingStatusDiv?.remove();
        this.measureStatusDiv?.remove();
        this.layerManager.clearAll();
        this.mapManager.destroy();
        if (this.isOwnContainer && this.container.parentNode) {
            this.container.remove();
        }
    }
}