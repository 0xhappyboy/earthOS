import { LayerManager } from "./layers/LayerManager";
import {
    CircleDrawLayer,
    RectangleDrawLayer,
    TriangleDrawLayer,
    DistanceMeasurementLayer,
    AreaMeasurementLayer,
    MarkerLayer,
    ArrowDrawLayer,
    EllipseDrawLayer,
    FreehandDrawLayer,
    MarkerDrawLayer,
    TextDrawLayer,
    BezierDrawLayer,
    LineDrawLayer,
    SectorDrawLayer,
    PointCoordinatePickLayer,
} from "./layers";
import { FloatingToolbar, MeasurementFloatingToolbar, PopupPanel } from "./components";
import { BasemapTypeEnum, CoordinateSystemTypeEnum, CircleDrawData, RectangleDrawData, TriangleDrawData } from "./types";
import { getTranslation, Locale, Translations } from "./i18n";
import { DrawToolManager } from "./draw/DrawToolManager";
import { CircleDrawTool } from "./draw/CircleDrawTool";
import { RectangleDrawTool } from "./draw/RectangleDrawTool";
import { TriangleDrawTool } from "./draw/TriangleDrawTool";
import { LayerInfo } from "./components/types";
import { MapManager } from "./MapManager";
import { ArrowDrawTool, BezierDrawTool, DrawToolType, EllipseDrawTool, FreehandDrawTool, LineDrawTool, MarkerDrawTool, SectorDrawTool, TextDrawTool } from "./draw";
import { UIManager } from "./UIManager";
import { DrawingManager } from "./DrawingManager";
import { EventManager } from "./EventManager";
import { ArrowDrawData } from "./layers/drawlayers/ArrowDrawLayer";
import { EllipseDrawData } from "./layers/drawlayers/EllipseDrawLayer";
import { FreehandDrawData } from "./layers/drawlayers/FreehandDrawLayer";
import { MarkerDrawData } from "./layers/drawlayers/MarkerDrawLayer";
import { TextDrawData } from "./layers/drawlayers/TextDrawLayer";
import { BezierDrawData } from "./layers/drawlayers/BezierDrawLayer";
import { LineDrawData } from "./layers/drawlayers/LineDrawLayer";
import { SectorDrawData } from "./layers/drawlayers/SectorDrawLayer";
import { PointCoordinatePickData } from "./layers/toollayers/PointCoordinatePickLayer";
import { LineCoordinatePickLayer, LineCoordinatePickData } from "./layers/toollayers/LineCoordinatePickLayer";
import { PolygonCoordinatePickLayer, PolygonCoordinatePickData } from "./layers/toollayers/PolygonCoordinatePickLayer";
import { LineData, PointData, PolygonData } from "./components/CoordinatePickingDataPanel";
import { fromLonLat } from "ol/proj";

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
    private currentSize: number = 10;
    private currentScale: string = "";
    private isLoading: boolean = true;
    private isChangingBasemap: boolean = false;
    private drawingStatusText: string | null = null;
    private measureStatusText: string | null = null;

    private freehandDrawLayer: FreehandDrawLayer | null = null;
    private ellipseDrawLayer: EllipseDrawLayer | null = null;
    private markerDrawLayer: MarkerDrawLayer | null = null;
    private textDrawLayer: TextDrawLayer | null = null;
    private arrowDrawLayer: ArrowDrawLayer | null = null;

    private freehandDrawTool: FreehandDrawTool | null = null;
    private ellipseDrawTool: EllipseDrawTool | null = null;
    private markerDrawTool: MarkerDrawTool | null = null;
    private textDrawTool: TextDrawTool | null = null;
    private arrowDrawTool: ArrowDrawTool | null = null;

    private eventManager: EventManager;

    private selectedFreehandId: string | null = null;
    private selectedEllipseId: string | null = null;
    private selectedMarkerId: string | null = null;
    private selectedTextId: string | null = null;
    private selectedArrowId: string | null = null;

    private lineDrawLayer: LineDrawLayer | null = null;
    private bezierDrawLayer: BezierDrawLayer | null = null;
    private sectorDrawLayer: SectorDrawLayer | null = null;
    private lineDrawTool: LineDrawTool | null = null;
    private bezierDrawTool: BezierDrawTool | null = null;
    private sectorDrawTool: SectorDrawTool | null = null;

    private selectedLineId: string | null = null;
    private selectedBezierId: string | null = null;
    private selectedSectorId: string | null = null;


    private pointCoordinatePickLayer: PointCoordinatePickLayer | null = null;
    private lineCoordinatePickLayer: LineCoordinatePickLayer | null = null;
    private polygonCoordinatePickLayer: PolygonCoordinatePickLayer | null = null;

    private pointCoordinateListPanel: PopupPanel | null = null;
    private currentPointCoordinates: PointCoordinatePickData[] = [];
    private currentLineCoordinates: LineCoordinatePickData[] = [];
    private currentPolygonCoordinates: PolygonCoordinatePickData[] = [];

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
        this.eventManager = new EventManager();

        this.initUI();
        this.initLayers();
        this.initEventManager();
        this.initDrawingManager();
        this.bindEvents();
        this.initRightClickMenu();
        if (this.onLoadCallback) {
            setTimeout(() => this.onLoadCallback?.(this), 100);
        }
        setTimeout(() => this.hideLoading(), 500);
    }


    private initEventManager(): void {
        this.eventManager.setDrawingManager(this.drawingManager);
        this.eventManager.setMapView(this.mapManager.getMap());
        this.eventManager.bindEvents();
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
                onDrawFreehand: () => this.startDrawFreehand(),
                onDrawFreehandPolygon: () => this.startDrawFreehandPolygon(),
                onDrawEllipse: () => this.startDrawEllipse(),
                onDrawMarker: () => this.startDrawMarker(),
                onDrawText: () => this.startDrawText(),
                onDrawArrow: () => this.startDrawArrow(),
                onDrawLine: () => this.startDrawLine(),
                onDrawBezier: () => this.startDrawBezier(),
                onDrawSector: () => this.startDrawSector(),
                onEditShape: () => this.startEditShape(),
                onDistanceMeasure: () => this.startMeasureDistance(),
                onAreaMeasure: () => this.startMeasureArea(),
                onClearMeasurements: () => this.clearAllMeasurements(),
                onSetBasemap: (basemap) => this.setBasemap(basemap),
                onToggleLayerVisibility: (id) => this.setLayerVisibility(id, !this.getLayerVisibility(id)),
                onRemoveLayer: (id) => this.removeLayer(id),
                onPointCoordinatePick: () => this.startPointCoordinatePick(),
                onLineCoordinatePick: () => this.startLineCoordinatePick(),
                onPolygonCoordinatePick: () => this.startPolygonCoordinatePick(),
                onShowCoordinateList: () => this.showCoordinateList(),
                getPointData: () => this.getPointDataForPanel(),
                getLineData: () => this.getLineDataForPanel(),
                getPolygonData: () => this.getPolygonDataForPanel(),
                onLocateCoordinate: (lng, lat) => this.locateToPoint(lng, lat),
                onLocateLine: (points) => this.locateToLine(points),
                onLocatePolygon: (points) => this.locateToPolygon(points),
            },
            () => this.getLayerList(),
            () => this.getBasemap()
        );
        this.createStatusIndicators();
    }

    private updateCoordinateListPanel(): void {
        if (this.pointCoordinateListPanel) {
            const listContainer = this.pointCoordinateListPanel.getElement().querySelector(".coordinate-list-content");
            if (listContainer) {
                this.pointCoordinateListPanel.destroy();
                this.pointCoordinateListPanel = null;
                this.showCoordinateList();
            }
        }
    }

    private showToast(message: string): void {
        const toast = document.createElement("div");
        toast.style.cssText = `
        position: absolute;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
    `;
        toast.textContent = message;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }


    public startPointCoordinatePick(): void {

        this.lineCoordinatePickLayer?.stopPick();
        this.polygonCoordinatePickLayer?.stopPick();

        this.setMeasureStatus("点击地图拾取点坐标 (单击完成拾取)");
        this.pointCoordinatePickLayer?.startPick((data: PointCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentPointCoordinates.unshift(data);
            this.showToast(`已拾取点坐标: ${data.longitude.toFixed(6)}, ${data.latitude.toFixed(6)}`);
        });
    }


    public startLineCoordinatePick(): void {

        this.pointCoordinatePickLayer?.stopPick();
        this.polygonCoordinatePickLayer?.stopPick();

        this.setMeasureStatus("点击地图绘制线 (双击完成拾取)");
        this.lineCoordinatePickLayer?.startPick((data: LineCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentLineCoordinates.unshift(data);
            const pointCount = data.points.length;
            this.showToast(`已拾取线坐标: ${pointCount}个点`);
        });
    }


    public startPolygonCoordinatePick(): void {

        this.pointCoordinatePickLayer?.stopPick();
        this.lineCoordinatePickLayer?.stopPick();

        this.setMeasureStatus("点击地图绘制面 (双击完成拾取)");
        this.polygonCoordinatePickLayer?.startPick((data: PolygonCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentPolygonCoordinates.unshift(data);
            const pointCount = data.points.length;
            this.showToast(`已拾取面坐标: ${pointCount}个点`);
        });
    }


    private showCoordinateList(): void {
        const totalPoints = this.currentPointCoordinates.length;
        const totalLines = this.currentLineCoordinates.length;
        const totalPolygons = this.currentPolygonCoordinates.length;

        if (totalPoints === 0 && totalLines === 0 && totalPolygons === 0) {
            this.showToast("暂无拾取坐标数据");
            return;
        }

        let message = "=== 坐标拾取数据列表 ===\n\n";


        if (totalPoints > 0) {
            message += `📍 点数据 (${totalPoints}个):\n`;
            this.currentPointCoordinates.slice(0, 5).forEach((coord, index) => {
                message += `  ${index + 1}. ${coord.longitude.toFixed(6)}, ${coord.latitude.toFixed(6)}\n`;
            });
            if (totalPoints > 5) message += `  ... 共${totalPoints}个\n`;
            message += "\n";
        }


        if (totalLines > 0) {
            message += `📏 线数据 (${totalLines}条):\n`;
            this.currentLineCoordinates.slice(0, 5).forEach((line, index) => {
                message += `  ${index + 1}. ${line.points.length}个点, 创建于 ${new Date(line.timestamp).toLocaleTimeString()}\n`;
            });
            if (totalLines > 5) message += `  ... 共${totalLines}条\n`;
            message += "\n";
        }
        if (totalPolygons > 0) {
            message += `🔲 面数据 (${totalPolygons}个):\n`;
            this.currentPolygonCoordinates.slice(0, 5).forEach((polygon, index) => {
                message += `  ${index + 1}. ${polygon.points.length}个点, 创建于 ${new Date(polygon.timestamp).toLocaleTimeString()}\n`;
            });
            if (totalPolygons > 5) message += `  ... 共${totalPolygons}个\n`;
            message += "\n";
        }
        message += "\n点击确定复制全部点坐标";
        // eslint-disable-next-line no-restricted-globals
        if (confirm(message)) {
            const text = this.currentPointCoordinates.map(c => `${c.longitude.toFixed(6)}, ${c.latitude.toFixed(6)}`).join("\n");
            navigator.clipboard.writeText(text);
            this.showToast("已复制全部点坐标到剪贴板");
        }
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




        this.pointCoordinatePickLayer = new PointCoordinatePickLayer("point-coordinate-pick", "Point Coordinate Pick");
        this.pointCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.pointCoordinatePickLayer);


        this.lineCoordinatePickLayer = new LineCoordinatePickLayer("line-coordinate-pick", "Line Coordinate Pick");
        this.lineCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.lineCoordinatePickLayer);


        this.polygonCoordinatePickLayer = new PolygonCoordinatePickLayer("polygon-coordinate-pick", "Polygon Coordinate Pick");
        this.polygonCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.polygonCoordinatePickLayer);


        this.freehandDrawLayer = new FreehandDrawLayer("freehand-draw", "Freehand Draw");
        this.freehandDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.freehandDrawLayer);

        this.ellipseDrawLayer = new EllipseDrawLayer("ellipse-draw", "Ellipse Draw");
        this.ellipseDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.ellipseDrawLayer);

        this.markerDrawLayer = new MarkerDrawLayer("marker-draw", "Marker Draw");
        this.markerDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.markerDrawLayer);

        this.textDrawLayer = new TextDrawLayer("text-draw", "Text Draw");
        this.textDrawLayer.setView(this.mapManager.getMap());
        this.textDrawLayer.setTheme(this.theme, this.t);
        this.layerManager.addLayer(this.textDrawLayer);

        this.arrowDrawLayer = new ArrowDrawLayer("arrow-draw", "Arrow Draw");
        this.arrowDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.arrowDrawLayer);

        this.distanceMeasureLayer = new DistanceMeasurementLayer("distance-measurement", "Distance Measurement");
        this.distanceMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.distanceMeasureLayer);

        this.areaMeasureLayer = new AreaMeasurementLayer("area-measurement", "Area Measurement");
        this.areaMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.areaMeasureLayer);


        this.lineDrawLayer = new LineDrawLayer("line-draw", "Line Draw");
        this.lineDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.lineDrawLayer);


        this.bezierDrawLayer = new BezierDrawLayer("bezier-draw", "Bezier Draw");
        this.bezierDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.bezierDrawLayer);


        this.sectorDrawLayer = new SectorDrawLayer("sector-draw", "Sector Draw");
        this.sectorDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.sectorDrawLayer);


        this.lineDrawTool = new LineDrawTool(this.lineDrawLayer, this.t);
        this.bezierDrawTool = new BezierDrawTool(this.bezierDrawLayer, this.t);
        this.sectorDrawTool = new SectorDrawTool(this.sectorDrawLayer, this.t);


        this.lineDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.bezierDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.sectorDrawTool.setOnDrawComplete(() => this.onDrawingEnd());


        this.circleDrawTool = new CircleDrawTool(this.circleDrawLayer, this.t);
        this.rectangleDrawTool = new RectangleDrawTool(this.rectangleDrawLayer, this.t);
        this.triangleDrawTool = new TriangleDrawTool(this.triangleDrawLayer, this.t);


        this.freehandDrawTool = new FreehandDrawTool(this.freehandDrawLayer, this.t, false);


        this.ellipseDrawTool = new EllipseDrawTool(this.ellipseDrawLayer, this.t);
        this.markerDrawTool = new MarkerDrawTool(this.markerDrawLayer, this.t);
        this.textDrawTool = new TextDrawTool(this.textDrawLayer, this.t);
        this.arrowDrawTool = new ArrowDrawTool(this.arrowDrawLayer, this.t);


        this.circleDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.rectangleDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.triangleDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.freehandDrawTool.setOnDrawComplete(() => this.onDrawingEnd());

        this.ellipseDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.markerDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.textDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
        this.arrowDrawTool.setOnDrawComplete(() => this.onDrawingEnd());

        this.drawingManager.registerTools(
            this.circleDrawTool!,
            this.rectangleDrawTool!,
            this.triangleDrawTool!,
            this.freehandDrawTool!,
            this.ellipseDrawTool!,
            this.markerDrawTool!,
            this.textDrawTool!,
            this.arrowDrawTool!,
            this.lineDrawTool!,
            this.bezierDrawTool!,
            this.sectorDrawTool!,
        );

        this.drawingManager.setCallbacks(
            (type) => this.onDrawingStart(type),
            () => this.onDrawingEnd()
        );
        this.setupSelections();
    }

    private onDrawingStart(type: DrawToolType): void {
        let msg = "";
        switch (type) {
            case DrawToolType.CIRCLE:
                msg = this.t.drawingCircle;
                break;
            case DrawToolType.RECTANGLE:
                msg = "正在绘制矩形...";
                break;
            case DrawToolType.TRIANGLE:
                msg = "正在绘制三角形...";
                break;
            case DrawToolType.FREEHAND:
                msg = "正在手绘线...";
                break;
            case DrawToolType.FREEHAND_POLYGON:
                msg = "正在手绘多边形...";
                break;
            case DrawToolType.ELLIPSE:
                msg = "正在绘制椭圆...";
                break;
            case DrawToolType.MARKER:
                msg = "添加标记点...";
                break;
            case DrawToolType.TEXT:
                msg = "添加文字标注...";
                break;
            case DrawToolType.ARROW:
                msg = "正在绘制箭头...";
                break;
            default:
                msg = "正在绘制...";
        }
        this.setDrawingStatus(`${msg} (按 ESC 取消绘制)`);
    }

    private onDrawingEnd(): void {
        this.setDrawingStatus(null);
    }





    private setupSelections(): void {
        const map = this.mapManager.getMap();

        const getFeatureType = (feature: any): string | null => {
            const id = feature.get("id");
            if (!id) return null;
            if (typeof id === 'string') {
                if (id.startsWith("circle_")) return 'circle';
                if (id.startsWith("rectangle_")) return 'rectangle';
                if (id.startsWith("triangle_")) return 'triangle';
                if (id.startsWith("freehand_")) return 'freehand';
                if (id.startsWith("ellipse_")) return 'ellipse';
                if (id.startsWith("marker_")) return 'marker';
                if (id.startsWith("text_")) return 'text';
                if (id.startsWith("arrow_") && !id.endsWith("_head")) return 'arrow';
                if (id.startsWith("line_")) return 'line';
                if (id.startsWith("bezier_")) return 'bezier';
                if (id.startsWith("sector_")) return 'sector';
            }
            return null;
        };

        const getCurrentEditingId = (): string | null => {
            return this.circleDrawLayer?.getEditingId() ||
                this.rectangleDrawLayer?.getEditingId() ||
                this.triangleDrawLayer?.getEditingId() ||
                this.freehandDrawLayer?.getEditingId() ||
                this.ellipseDrawLayer?.getEditingId() ||
                this.markerDrawLayer?.getEditingId() ||
                this.textDrawLayer?.getEditingId() ||
                this.arrowDrawLayer?.getEditingId() ||
                this.lineDrawLayer?.getEditingId() ||
                this.bezierDrawLayer?.getEditingId() ||
                this.sectorDrawLayer?.getEditingId() ||
                null;
        };


        const isAnyLayerDrawing = (): boolean => {
            return !!(this.circleDrawLayer?.isDrawActive() ||
                this.rectangleDrawLayer?.isDrawActive() ||
                this.triangleDrawLayer?.isDrawActive() ||
                this.freehandDrawLayer?.isDrawActive() ||
                this.ellipseDrawLayer?.isDrawActive() ||
                this.markerDrawLayer?.isDrawActive() ||
                this.textDrawLayer?.isDrawActive() ||
                this.arrowDrawLayer?.isDrawActive() ||
                this.lineDrawLayer?.isDrawActive() ||
                this.bezierDrawLayer?.isDrawActive() ||
                this.sectorDrawLayer?.isDrawActive());
        };

        const startEditById = (id: string, type: string) => {
            if (!id) return;


            this.stopAllEditing();

            switch (type) {
                case 'circle':
                    this.circleDrawTool?.startEdit(id);
                    break;
                case 'rectangle':
                    this.rectangleDrawTool?.startEdit(id);
                    break;
                case 'triangle':
                    this.triangleDrawTool?.startEdit(id);
                    break;
                case 'freehand':
                    this.freehandDrawTool?.startEdit(id);
                    break;
                case 'ellipse':
                    this.ellipseDrawTool?.startEdit(id);
                    break;
                case 'marker':
                    this.markerDrawTool?.startEdit(id);
                    break;
                case 'text':
                    this.textDrawTool?.startEdit(id);
                    break;
                case 'arrow':
                    this.arrowDrawTool?.startEdit(id);
                    break;
                case 'line':
                    this.lineDrawTool?.startEdit(id);
                    break;
                case 'bezier':
                    this.bezierDrawTool?.startEdit(id);
                    break;
                case 'sector':
                    this.sectorDrawTool?.startEdit(id);
                    break;
            }
        };

        map.on("singleclick", (event: any) => {

            if (isAnyLayerDrawing()) {
                return;
            }


            if (this.textDrawLayer?.isInputActive) {
                return;
            }

            const features = map.getFeaturesAtPixel(event.pixel, {
                hitTolerance: 5
            });

            let targetFeature = null;
            let targetType = null;

            for (const feature of features) {
                const type = getFeatureType(feature);
                if (type) {
                    targetFeature = feature;
                    targetType = type;
                    break;
                }
            }

            if (targetFeature && targetType) {
                const clickedId = targetFeature.get("id");
                const currentEditingId = getCurrentEditingId();


                if (currentEditingId === clickedId) {
                    return;
                }


                if (clickedId) {
                    startEditById(clickedId, targetType);
                }
            } else {

                this.stopAllEditing();
            }
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


            const freehand = features?.find((f: any) => {
                const id = f.get("id");
                return id && typeof id === 'string' && id.startsWith("freehand_");
            });

            if (freehand && this.freehandDrawLayer) {
                const data = this.freehandDrawLayer.getFreehand(freehand.get("id"));
                if (data) {
                    this.selectedFreehandId = data.id;
                    this.showFloatingToolbarForFreehand({ x, y }, data);
                    return;
                }
            }


            const line = features?.find((f: any) => f.get("id")?.startsWith("line_"));
            if (line && this.lineDrawLayer) {
                const data = this.lineDrawLayer.getLine(line.get("id"));
                if (data) {
                    this.selectedLineId = data.id;
                    this.showFloatingToolbarForLine({ x, y }, data);
                    return;
                }
            }


            const bezier = features?.find((f: any) => f.get("id")?.startsWith("bezier_"));
            if (bezier && this.bezierDrawLayer) {
                const data = this.bezierDrawLayer.getBezier(bezier.get("id"));
                if (data) {
                    this.selectedBezierId = data.id;
                    this.showFloatingToolbarForBezier({ x, y }, data);
                    return;
                }
            }


            const sector = features?.find((f: any) => f.get("id")?.startsWith("sector_"));
            if (sector && this.sectorDrawLayer) {
                const data = this.sectorDrawLayer.getSector(sector.get("id"));
                if (data) {
                    this.selectedSectorId = data.id;
                    this.showFloatingToolbarForSector({ x, y }, data);
                    return;
                }
            }

            const ellipse = features?.find((f: any) => f.get("id")?.startsWith("ellipse_"));
            if (ellipse && this.ellipseDrawLayer) {
                const data = this.ellipseDrawLayer.getEllipse(ellipse.get("id"));
                if (data) { this.selectedEllipseId = data.id; this.showFloatingToolbarForEllipse({ x, y }, data); return; }
            }

            const marker = features?.find((f: any) => f.get("id")?.startsWith("marker_"));
            if (marker && this.markerDrawLayer) {
                const data = this.markerDrawLayer.getMarker(marker.get("id"));
                if (data) { this.selectedMarkerId = data.id; this.showFloatingToolbarForMarker({ x, y }, data); return; }
            }

            const text = features?.find((f: any) => f.get("id")?.startsWith("text_"));
            if (text && this.textDrawLayer) {
                const data = this.textDrawLayer.getText(text.get("id"));
                if (data) { this.selectedTextId = data.id; this.showFloatingToolbarForText({ x, y }, data); return; }
            }

            const arrow = features?.find((f: any) => f.get("id")?.startsWith("arrow_") && !f.get("id")?.toString().endsWith("_head"));
            if (arrow && this.arrowDrawLayer) {
                const data = this.arrowDrawLayer.getArrow(arrow.get("id"));
                if (data) { this.selectedArrowId = data.id; this.showFloatingToolbarForArrow({ x, y }, data); return; }
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
        if (this.textDrawLayer?.isInputActive) {
            return;
        }
        this.circleDrawLayer?.stopEdit();
        this.rectangleDrawLayer?.stopEdit();
        this.triangleDrawLayer?.stopEdit();
        this.freehandDrawLayer?.stopEdit();
        this.ellipseDrawLayer?.stopEdit();
        this.markerDrawLayer?.stopEdit();
        this.textDrawLayer?.stopEdit();
        this.arrowDrawLayer?.stopEdit();
        this.lineDrawLayer?.stopEdit();
        this.bezierDrawLayer?.stopEdit();
        this.sectorDrawLayer?.stopEdit();
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



    private showFloatingToolbarForFreehand(pos: { x: number; y: number }, data: FreehandDrawData): void {

        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [76, 175, 80, 0.3];
        this.currentStrokeWidth = data.outlineWidth || 3;
        this.currentStrokeStyle = data.outlineStyle || "solid";

        const targetId = data.id;
        this.selectedFreehandId = targetId;

        const targetLayer = this.freehandDrawLayer;
        if (!targetLayer) {
            console.error('FreehandDrawLayer is null');
            return;
        }


        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                this.currentColor = color;
                targetLayer.updateFreehandStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    this.currentStrokeWidth,
                    this.currentStrokeStyle
                );
            },
            onStrokeWidthChange: (width) => {
                this.currentStrokeWidth = width;
                targetLayer.updateFreehandStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    width,
                    this.currentStrokeStyle
                );
            },
            onStrokeStyleChange: (style) => {
                this.currentStrokeStyle = style;
                targetLayer.updateFreehandStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    this.currentStrokeWidth,
                    style
                );
            },
            onDelete: () => {
                console.log('Deleting freehand:', targetId);
                if (targetLayer && targetId) {

                    this.hideFloatingToolbar();

                    targetLayer.removeFreehand(targetId);

                    this.selectedFreehandId = null;

                    setTimeout(() => {
                        if (this.mapManager) {
                            this.mapManager.getMap().render();
                        }
                    }, 50);
                }
            },
            onClose: () => {
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => {
                this.floatingToolbarPosition = p;
            },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: this.currentColor,
            currentStrokeWidth: this.currentStrokeWidth,
            currentStrokeStyle: this.currentStrokeStyle,
            position: pos,
        });
    }




    private showFloatingToolbarForLine(pos: { x: number; y: number }, data: LineDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.color || [255, 193, 7, 1];
        this.currentStrokeWidth = data.width || 3;
        this.currentStrokeStyle = data.style || "solid";

        const targetId = data.id;
        this.selectedLineId = targetId;

        const targetLayer = this.lineDrawLayer;
        if (!targetLayer) return;

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                this.currentColor = color;
                targetLayer.updateLineStyle(
                    targetId,
                    [color[0], color[1], color[2], 1],
                    this.currentStrokeWidth,
                    this.currentStrokeStyle
                );
            },
            onStrokeWidthChange: (width) => {
                this.currentStrokeWidth = width;
                targetLayer.updateLineStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    width,
                    this.currentStrokeStyle
                );
            },
            onStrokeStyleChange: (style) => {
                this.currentStrokeStyle = style;
                targetLayer.updateLineStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    this.currentStrokeWidth,
                    style
                );
            },
            onDelete: () => {
                if (targetLayer && targetId) {
                    this.hideFloatingToolbar();
                    targetLayer.removeLine(targetId);
                    this.selectedLineId = null;
                    setTimeout(() => {
                        if (this.mapManager) {
                            this.mapManager.getMap().render();
                        }
                    }, 50);
                }
            },
            onClose: () => {
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => {
                this.floatingToolbarPosition = p;
            },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: this.currentColor,
            currentStrokeWidth: this.currentStrokeWidth,
            currentStrokeStyle: this.currentStrokeStyle,
            position: pos,
        });
    }




    private showFloatingToolbarForBezier(pos: { x: number; y: number }, data: BezierDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.color || [156, 39, 176, 1];
        this.currentStrokeWidth = data.width || 3;
        this.currentStrokeStyle = data.style || "solid";

        const targetId = data.id;
        this.selectedBezierId = targetId;

        const targetLayer = this.bezierDrawLayer;
        if (!targetLayer) return;

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                this.currentColor = color;
                targetLayer.updateBezierStyle(
                    targetId,
                    [color[0], color[1], color[2], 1],
                    this.currentStrokeWidth,
                    this.currentStrokeStyle
                );
            },
            onStrokeWidthChange: (width) => {
                this.currentStrokeWidth = width;
                targetLayer.updateBezierStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    width,
                    this.currentStrokeStyle
                );
            },
            onStrokeStyleChange: (style) => {
                this.currentStrokeStyle = style;
                targetLayer.updateBezierStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    this.currentStrokeWidth,
                    style
                );
            },
            onDelete: () => {
                if (targetLayer && targetId) {
                    this.hideFloatingToolbar();
                    targetLayer.removeBezier(targetId);
                    this.selectedBezierId = null;
                    setTimeout(() => {
                        if (this.mapManager) {
                            this.mapManager.getMap().render();
                        }
                    }, 50);
                }
            },
            onClose: () => {
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => {
                this.floatingToolbarPosition = p;
            },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: this.currentColor,
            currentStrokeWidth: this.currentStrokeWidth,
            currentStrokeStyle: this.currentStrokeStyle,
            position: pos,
        });
    }




    private showFloatingToolbarForSector(pos: { x: number; y: number }, data: SectorDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [33, 150, 243, 0.3];
        this.currentStrokeWidth = data.outlineWidth || 2;
        this.currentStrokeStyle = data.outlineStyle || "solid";

        const targetId = data.id;
        this.selectedSectorId = targetId;

        const targetLayer = this.sectorDrawLayer;
        if (!targetLayer) return;

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                this.currentColor = color;
                targetLayer.updateSectorStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    this.currentStrokeWidth,
                    this.currentStrokeStyle
                );
            },
            onStrokeWidthChange: (width) => {
                this.currentStrokeWidth = width;
                targetLayer.updateSectorStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    width,
                    this.currentStrokeStyle
                );
            },
            onStrokeStyleChange: (style) => {
                this.currentStrokeStyle = style;
                targetLayer.updateSectorStyle(
                    targetId,
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                    [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                    this.currentStrokeWidth,
                    style
                );
            },
            onDelete: () => {
                if (targetLayer && targetId) {
                    this.hideFloatingToolbar();
                    targetLayer.removeSector(targetId);
                    this.selectedSectorId = null;
                    setTimeout(() => {
                        if (this.mapManager) {
                            this.mapManager.getMap().render();
                        }
                    }, 50);
                }
            },
            onClose: () => {
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => {
                this.floatingToolbarPosition = p;
            },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: this.currentColor,
            currentStrokeWidth: this.currentStrokeWidth,
            currentStrokeStyle: this.currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForEllipse(pos: { x: number; y: number }, data: EllipseDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.fillColor || [156, 39, 176, 0.3];
        this.currentStrokeWidth = data.outlineWidth || 2;
        this.currentStrokeStyle = data.outlineStyle || "solid";

        this.showGenericFloatingToolbar(pos, {
            id: this.selectedEllipseId,
            updateStyle: (color, width, style) => {
                if (this.selectedEllipseId && this.ellipseDrawLayer) {
                    this.ellipseDrawLayer.updateEllipseStyle(
                        this.selectedEllipseId,
                        [color[0], color[1], color[2], 0.3],
                        [color[0], color[1], color[2], 1],
                        width,
                        style
                    );
                }
            },
            delete: () => {
                if (this.selectedEllipseId && this.ellipseDrawLayer) {
                    this.ellipseDrawLayer.removeEllipse(this.selectedEllipseId);
                    this.selectedEllipseId = null;
                }
                this.hideFloatingToolbar();
            }
        });
    }

    private showFloatingToolbarForMarker(pos: { x: number; y: number }, data: MarkerDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.color || [255, 87, 34, 1];
        this.currentSize = data.size || 10;


        if (this.floatingToolbar) {
            this.floatingToolbar.updatePosition(pos);
            this.floatingToolbar.setVisible(true);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    if (this.selectedMarkerId && this.markerDrawLayer) {
                        this.markerDrawLayer.updateMarkerStyle(
                            this.selectedMarkerId,
                            [color[0], color[1], color[2], 1],
                            this.currentSize
                        );
                    }
                },
                onStrokeWidthChange: (width) => {
                    this.currentSize = width;
                    if (this.selectedMarkerId && this.markerDrawLayer) {
                        this.markerDrawLayer.updateMarkerStyle(
                            this.selectedMarkerId,
                            this.currentColor,
                            width
                        );
                    }
                },
                onStrokeStyleChange: (style) => {

                },
                onDelete: () => {
                    if (this.selectedMarkerId && this.markerDrawLayer) {
                        this.markerDrawLayer.removeMarker(this.selectedMarkerId);
                        this.selectedMarkerId = null;
                    }
                    this.hideFloatingToolbar();
                },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (p) => { this.floatingToolbarPosition = p; },
                theme: this.theme, t: this.t, containerRef: this.container,
                currentColor: this.currentColor,
                currentStrokeWidth: this.currentSize,
                currentStrokeStyle: "solid",
                position: pos,
            });
        }
    }

    private showFloatingToolbarForText(pos: { x: number; y: number }, data: TextDrawData): void {
        // if (data.position) {
        //     const webMercatorPos = fromLonLat([data.position[0], data.position[1]]);
        //     this.mapManager.getView().setCenter(webMercatorPos);
        //     this.setZoom(18);
        // }
        // setTimeout(() => {
        //     this.textDrawTool?.startEdit(data.id);
        // }, 100);
        // this.hideFloatingToolbar();
    }

    private showFloatingToolbarForArrow(pos: { x: number; y: number }, data: ArrowDrawData): void {
        this.floatingToolbarPosition = pos;
        this.showFloatingToolbar = true;
        this.currentColor = data.color || [255, 87, 34, 1];
        this.currentStrokeWidth = data.width || 3;
        this.currentStrokeStyle = data.style || "solid";

        this.showGenericFloatingToolbar(pos, {
            id: this.selectedArrowId,
            updateStyle: (color, width, style) => {
                if (this.selectedArrowId && this.arrowDrawLayer) {
                    this.arrowDrawLayer.updateArrowStyle(
                        this.selectedArrowId,
                        [color[0], color[1], color[2], 1],
                        width,
                        style,
                        data.headSize || 50
                    );
                }
            },
            delete: () => {
                if (this.selectedArrowId && this.arrowDrawLayer) {
                    this.arrowDrawLayer.removeArrow(this.selectedArrowId);
                    this.selectedArrowId = null;
                }
                this.hideFloatingToolbar();
            }
        });
    }


    private showGenericFloatingToolbar(
        pos: { x: number; y: number },
        handlers: {
            id: string | null,
            updateStyle: (color: number[], width: number, style: "solid" | "dashed") => void,
            delete: () => void
        }
    ): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.updatePosition(pos);
            this.floatingToolbar.setVisible(true);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    handlers.updateStyle(color, this.currentStrokeWidth, this.currentStrokeStyle);
                },
                onStrokeWidthChange: (width) => {
                    this.currentStrokeWidth = width;
                    handlers.updateStyle(this.currentColor, width, this.currentStrokeStyle);
                },
                onStrokeStyleChange: (style) => {
                    this.currentStrokeStyle = style;
                    handlers.updateStyle(this.currentColor, this.currentStrokeWidth, style);
                },
                onDelete: () => {
                    handlers.delete();
                    this.hideFloatingToolbar();
                },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (p) => { this.floatingToolbarPosition = p; },
                theme: this.theme, t: this.t, containerRef: this.container,
                currentColor: this.currentColor,
                currentStrokeWidth: this.currentStrokeWidth,
                currentStrokeStyle: this.currentStrokeStyle,
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
        this.selectedFreehandId = null;
        this.selectedEllipseId = null;
        this.selectedMarkerId = null;
        this.selectedTextId = null;
        this.selectedArrowId = null;
        this.selectedLineId = null;
        this.selectedBezierId = null;
        this.selectedSectorId = null;
        if (this.floatingToolbar) {
            this.floatingToolbar.setVisible(false);

        }
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
    public setBasemap(basemap: BasemapTypeEnum): void {
        this.showLoading(this.t.changingBasemap);
        this.mapManager.setBasemap(basemap);
        this.uiManager.updateCurrentBasemap(basemap);
        setTimeout(() => this.hideLoading(), 500);
    }
    public getBasemap(): BasemapTypeEnum { return this.mapManager.getCurrentBasemap(); }

    public setTheme(theme: "light" | "dark"): void {
        this.theme = theme;
        this.container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        this.uiManager.updateTheme(theme);
        this.textDrawLayer?.setTheme(theme, this.t);
    }
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

    public removeLayer(id: string): void {
        this.layerManager.removeLayer(id);
        this.uiManager.updateLayerList();
    }
    public setLayerVisibility(id: string, visible: boolean): void {
        this.layerManager.getLayer(id)?.setVisible(visible);
        this.uiManager.updateLayerList();
    }

    public startDrawFreehand(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingFreehand();
    }

    public startDrawFreehandPolygon(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingFreehandPolygon();
    }

    public startDrawEllipse(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingEllipse();
    }

    public startDrawMarker(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingMarker();
    }

    public startDrawText(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingText();
    }

    public startDrawArrow(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingArrow();
    }

    public startDrawLine(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingLine();
    }

    public startDrawBezier(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingBezier();
    }

    public startDrawSector(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingSector();
    }

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




    private getPointDataForPanel(): PointData[] {
        const points = this.pointCoordinatePickLayer?.getAllCoordinates() || [];
        return points.map((point, index) => ({
            id: point.id,
            name: `点 ${index + 1}`,
            longitude: point.longitude,
            latitude: point.latitude,
            timestamp: point.timestamp
        }));
    }

    private getLineDataForPanel(): LineData[] {
        const lines = this.lineCoordinatePickLayer?.getAllLines() || [];
        return lines.map((line, index) => ({
            id: line.id,
            name: `线 ${index + 1}`,
            points: line.points,
            timestamp: line.timestamp
        }));
    }

    private getPolygonDataForPanel(): PolygonData[] {
        const polygons = this.polygonCoordinatePickLayer?.getAllPolygons() || [];
        return polygons.map((polygon, index) => ({
            id: polygon.id,
            name: `面 ${index + 1}`,
            points: polygon.points,
            timestamp: polygon.timestamp
        }));
    }

    private locateToPoint(longitude: number, latitude: number): void {
        this.setCenter([longitude, latitude]);
        this.setZoom(18);
        this.showToast(`已定位到: ${longitude.toFixed(6)}, ${latitude.toFixed(6)}`);
    }


    private locateToLine(points: { longitude: number; latitude: number }[]): void {
        if (points.length === 0) return;

        const lons = points.map(p => p.longitude);
        const lats = points.map(p => p.latitude);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;

        this.setCenter([centerLon, centerLat]);

        const lonDiff = maxLon - minLon;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lonDiff, latDiff);
        let zoom = 18;
        if (maxDiff > 0.5) zoom = 10;
        else if (maxDiff > 0.1) zoom = 12;
        else if (maxDiff > 0.05) zoom = 14;
        else if (maxDiff > 0.01) zoom = 16;
        this.setZoom(zoom);
        this.showToast(`已定位到线，包含 ${points.length} 个点`);
    }


    private locateToPolygon(points: { longitude: number; latitude: number }[]): void {
        this.locateToLine(points);
        this.showToast(`已定位到面，包含 ${points.length} 个顶点`);
    }

    public clearAllCoordinatePicks(): void {
        this.pointCoordinatePickLayer?.clearAllCoordinates();
        this.lineCoordinatePickLayer?.clearAllLines();
        this.polygonCoordinatePickLayer?.clearAllPolygons();
        this.currentPointCoordinates = [];
        this.currentLineCoordinates = [];
        this.currentPolygonCoordinates = [];
        this.showToast("已清除所有坐标拾取数据");
    }
    public destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.eventManager.destroy();
        this.uiManager.destroy();
        this.drawingManager.destroy();
        this.floatingToolbar?.destroy();
        this.measurementFloatingToolbar?.destroy();
        this.drawingStatusDiv?.remove();
        this.measureStatusDiv?.remove();
        this.freehandDrawTool?.destroy();
        this.ellipseDrawTool?.destroy();
        this.markerDrawTool?.destroy();
        this.textDrawTool?.destroy();
        this.arrowDrawTool?.destroy();
        this.layerManager.clearAll();
        this.mapManager.destroy();
        if (this.isOwnContainer && this.container.parentNode) {
            this.container.remove();
        }
    }

}