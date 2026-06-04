import { MapManager } from "./map/MapManager";
import { LayerManager } from "./layers/LayerManager";
import {
    CircleDrawLayer,
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
import {
    Toolbar,
    PopupPanel,
    LayersPanel,
    BasemapOptions,
    DrawToolsPanel,
    ToolsPanel,
    FloatingToolbar,
    MeasurementFloatingToolbar,
    ScaleBar,
    LoadingOverlay,
    PopupType,
    LayerInfo,
    BasemapOption,
} from "./components";
import {
    EarthViewOptions,
    BasemapTypeEnum,
    CoordinateSystemTypeEnum,
    CircleDrawData,
} from "./types";
import { getTranslation, Locale, Translations } from "./i18n";
import { DrawToolManager } from "./draw/DrawToolManager";
import { CircleDrawTool } from "./draw/CircleDrawTool";
import { DrawToolType } from "./draw/DrawTool";

export class EarthViewCore {
    private mapManager: MapManager;
    private layerManager: LayerManager;

    private circleDrawLayer: CircleDrawLayer | null = null;
    private distanceMeasureLayer: DistanceMeasurementLayer | null = null;
    private areaMeasureLayer: AreaMeasurementLayer | null = null;

    private drawToolManager: DrawToolManager = new DrawToolManager();
    private circleDrawTool: CircleDrawTool | null = null;

    private toolbar: Toolbar | null = null;
    private scaleBar: ScaleBar | null = null;
    private loadingOverlay: LoadingOverlay | null = null;
    private activePopupPanel: PopupPanel | null = null;
    private activePopupType: PopupType = null;

    private floatingToolbar: FloatingToolbar | null = null;
    private measurementFloatingToolbar: MeasurementFloatingToolbar | null = null;

    private drawingStatusDiv: HTMLDivElement | null = null;
    private measureStatusDiv: HTMLDivElement | null = null;

    private onMoveEndCallback?: (center: [number, number], zoom: number) => void;
    private onLoadCallback?: (core: EarthViewCore) => void;
    private onMapClickCallback?: (event: { longitude: number; latitude: number }) => void;
    private onCircleDrawnCallback?: (data: CircleDrawData) => void;

    private locale: Locale = "zh";
    private theme: "light" | "dark" = "dark";
    private t: Translations;
    private isDestroyed: boolean = false;
    private enableDrawing: boolean = true;
    private container: HTMLElement;

    private showFloatingToolbar: boolean = false;
    private floatingToolbarPosition: { x: number; y: number } = { x: 100, y: 100 };
    private showMeasurementToolbar: boolean = false;
    private measurementToolbarPosition: { x: number; y: number } = { x: 100, y: 100 };
    private selectedCircleId: string | null = null;
    private selectedMeasurementId: string | null = null;
    private currentColor: number[] = [255, 0, 0, 1];
    private currentStrokeWidth: number = 3;
    private currentStrokeStyle: "solid" | "dashed" = "solid";
    private currentScale: string = "";
    private isLoading: boolean = true;
    private isChangingBasemap: boolean = false;
    private errorMessage: string | null = null;
    private drawingStatusText: string | null = null;
    private measureStatusText: string | null = null;

    private basemapOptions: BasemapOption[] = [
        { value: BasemapTypeEnum.SATELLITE, label: "卫星图", icon: "🛰️" },
        { value: BasemapTypeEnum.STREETS, label: "街道图", icon: "🗺️" },
        { value: BasemapTypeEnum.TOPO, label: "地形图", icon: "⛰️" },
        { value: BasemapTypeEnum.DARK_GRAY, label: "深色图", icon: "🌙" },
        { value: BasemapTypeEnum.LIGHT_GRAY, label: "浅色图", icon: "☀️" },
    ];

    constructor(options: EarthViewOptions) {
        const {
            container,
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

        this.container = container;
        this.theme = theme;
        this.locale = i18n;
        this.t = getTranslation(this.locale);
        this.onLoadCallback = onLoad;
        this.onMoveEndCallback = onMoveEnd;
        this.onMapClickCallback = onMapClick;
        this.onCircleDrawnCallback = onCircleDrawn;
        this.enableDrawing = enableDrawing;

        container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);

        this.mapManager = new MapManager(
            container,
            basemap,
            center,
            zoom,
            coordinateSystem
        );
        this.layerManager = new LayerManager(this.mapManager.getMap());

        this.initUI();

        if (this.enableDrawing) {
            this.initCircleDrawLayer();
            this.initDistanceMeasureLayer();
            this.initAreaMeasureLayer();
            this.registerDrawTools();
        }

        this.bindEvents();

        if (this.onLoadCallback) {
            setTimeout(() => this.onLoadCallback?.(this), 100);
        }

        setTimeout(() => {
            this.setLoading(false, "");
        }, 500);
    }


    private registerDrawTools(): void {
        if (!this.circleDrawLayer) return;
        this.circleDrawTool = new CircleDrawTool(this.circleDrawLayer, this.t);
        this.circleDrawTool.setOnDrawComplete((data) => {
            this.onCircleDrawnCallback?.(data);
            this.setDrawingStatus(null);
        });
        this.circleDrawTool.setOnEditComplete((data) => {
            this.setDrawingStatus(null);
        });
        this.drawToolManager.registerTool(this.circleDrawTool);
    }

    public activateDrawTool(toolId: string): void {
        this.drawToolManager.activateTool(toolId);

        const tool = this.drawToolManager.getTool(toolId);
        if (tool) {
            this.setDrawingStatus(`${tool.name} ${this.t.drawingCircle || "绘制中..."}`);
        }
    }

    public deactivateDrawTool(): void {
        this.drawToolManager.deactivateCurrent();
        this.setDrawingStatus(null);
    }

    public getActiveDrawTool(): string | null {
        return this.drawToolManager.getActiveToolId();
    }

    public startDraw(): void {
        const activeTool = this.drawToolManager.getActiveTool();
        if (activeTool && activeTool.id === DrawToolType.CIRCLE && this.circleDrawTool) {
            this.circleDrawTool.startDraw();
        } else {
            console.warn("No active draw tool or circle tool not available");
        }
    }

    public startEditCircle(): void {
        const circles = this.circleDrawLayer?.getAllCircles();
        if (circles && circles.length > 0 && this.circleDrawTool) {
            this.setDrawingStatus(this.t.editingCircle);
            this.circleDrawTool.startEdit(circles[circles.length - 1].id);
        } else {
        }
    }

    public getAllCircles(): CircleDrawData[] {
        return this.circleDrawLayer?.getAllCircles() || [];
    }


    public startDrawCircle(onComplete?: (data: CircleDrawData) => void): void {
        if (!this.circleDrawLayer) this.initCircleDrawLayer();
        this.setDrawingStatus(this.t.drawingCircle);
        this.activateDrawTool(DrawToolType.CIRCLE);
        if (this.circleDrawTool && onComplete) {
            this.circleDrawTool.setOnDrawComplete((data) => {
                onComplete(data);
                this.setDrawingStatus(null);
            });
        }
        this.startDraw();
    }

    private initUI(): void {
        this.toolbar = new Toolbar({
            container: this.container,
            t: this.t,
            theme: this.theme,
            activePopup: this.activePopupType,
            onTogglePopup: this.handleTogglePopup.bind(this),
            onZoomIn: () => this.zoomIn(),
            onZoomOut: () => this.zoomOut(),
            onLocate: () => this.locateUser(),
        });
        this.scaleBar = new ScaleBar(this.container, this.theme);
        this.loadingOverlay = new LoadingOverlay(this.container, this.theme);
        this.createStatusIndicators();
    }

    private createStatusIndicators(): void {
        const isDark = this.theme === "dark";
        this.drawingStatusDiv = document.createElement("div");
        this.drawingStatusDiv.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 200;
            background: ${isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 8px 16px;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: none;
        `;
        const spinner = document.createElement("div");
        spinner.style.cssText = `
            width: 16px;
            height: 16px;
            border: 2px solid ${isDark ? "#555" : "#ccc"};
            border-top: 2px solid #00aaff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        `;
        this.drawingStatusDiv.appendChild(spinner);
        const statusText = document.createElement("span");
        statusText.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px;`;
        statusText.id = "drawing-status-text";
        this.drawingStatusDiv.appendChild(statusText);
        this.container.appendChild(this.drawingStatusDiv);
        this.measureStatusDiv = document.createElement("div");
        this.measureStatusDiv.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            background: ${isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 6px 12px;
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            pointer-events: none;
            display: none;
        `;
        const dot = document.createElement("div");
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            background: #00aaff;
            border-radius: 50%;
            animation: pulse 1s infinite;
        `;
        this.measureStatusDiv.appendChild(dot);
        const measureText = document.createElement("span");
        measureText.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px;`;
        measureText.id = "measure-status-text";
        this.measureStatusDiv.appendChild(measureText);
        this.container.appendChild(this.measureStatusDiv);
        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }

    private handleTogglePopup(popup: PopupType): void {
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
            this.activePopupPanel = null;
        }
        this.activePopupType = popup;
        this.toolbar?.updateActivePopup(popup);
        if (popup === null) return;
        let panel: PopupPanel;
        let content: HTMLElement;
        switch (popup) {
            case "layers":
                panel = new PopupPanel({
                    title: this.t.layers,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => this.handleTogglePopup(null),
                });
                const layersPanel = new LayersPanel({
                    layerList: this.getLayerList(),
                    onToggleVisibility: (id) => this.setLayerVisibility(id, !this.getLayerVisibility(id)),
                    onRemoveLayer: (id) => this.removeLayer(id),
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(layersPanel.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                break;

            case "basemap":
                panel = new PopupPanel({
                    title: this.t.basemap,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => this.handleTogglePopup(null),
                });
                const basemapOptions = new BasemapOptions({
                    currentBasemap: this.mapManager.getCurrentBasemap(),
                    onSelect: (basemap) => this.setBasemap(basemap),
                    theme: this.theme,
                    t: this.t,
                    options: this.basemapOptions,
                });
                panel.appendChild(basemapOptions.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                break;
            case "draw":
                panel = new PopupPanel({
                    title: this.t.drawTools,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => this.handleTogglePopup(null),
                });
                const drawPanel = new DrawToolsPanel({
                    onDrawCircle: () => this.startDrawCircle(),
                    onEditCircle: () => this.startEditCircle(),
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(drawPanel.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                break;
            case "tools":
                panel = new PopupPanel({
                    title: this.t.tools,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => {
                        this.handleTogglePopup(null);
                        this.setMeasureStatus(null);
                    },
                });
                const toolsPanel = new ToolsPanel({
                    onDistanceMeasure: () => this.startMeasureDistance(),
                    onAreaMeasure: () => this.startMeasureArea(),
                    onClearMeasurements: () => this.clearAllMeasurements(),
                    isMeasuring: false,
                    currentMeasureType: null,
                    measurePreview: null,
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(toolsPanel.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                break;
        }
    }

    private bindEvents(): void {
        const view = this.mapManager.getView();
        view.on("moveend" as any, () => {
            if (this.onMoveEndCallback && !this.isDestroyed) {
                this.onMoveEndCallback(this.getCenter(), this.getZoom());
            }
            this.updateScale();
        });
        if (this.onMapClickCallback) {
            this.mapManager.getMap().on("click", (event: any) => {
                const coordinate = event.coordinate;
                const [lng, lat] = this.mapManager.getMap().getCoordinateFromPixel(event.pixel);
                this.onMapClickCallback?.({ longitude: lng, latitude: lat });
            });
        }
    }

    private getLayerList(): LayerInfo[] {
        return this.layerManager.getAllLayers().map(layer => ({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
        }));
    }

    private getLayerVisibility(id: string): boolean {
        const layer = this.layerManager.getLayer(id);
        return layer ? layer.visible : false;
    }

    private updateScale(): void {
        const zoom = this.getZoom();
        if (zoom) {
            if (zoom >= 10) {
                this.currentScale = `1:${Math.round(1000000 / Math.pow(2, zoom))}`;
            } else {
                this.currentScale = `1:${Math.round(10000000 / Math.pow(2, zoom))}`;
            }
            this.scaleBar?.updateScale(this.currentScale);
        }
    }

    private setLoading(loading: boolean, message: string): void {
        this.isLoading = loading;
        if (loading) {
            this.loadingOverlay?.show(message);
        } else {
            this.loadingOverlay?.hide();
        }
    }

    private setDrawingStatus(status: string | null): void {
        this.drawingStatusText = status;
        if (this.drawingStatusDiv) {
            const textSpan = this.drawingStatusDiv.querySelector("#drawing-status-text");
            if (textSpan) {
                textSpan.textContent = status || "";
            }
            this.drawingStatusDiv.style.display = status ? "flex" : "none";
        }
    }

    private setMeasureStatus(status: string | null): void {
        this.measureStatusText = status;
        if (this.measureStatusDiv) {
            const textSpan = this.measureStatusDiv.querySelector("#measure-status-text");
            if (textSpan) {
                textSpan.textContent = status || "";
            }
            this.measureStatusDiv.style.display = status ? "flex" : "none";
        }
    }

    public getCenter(): [number, number] {
        return this.mapManager.getCenter();
    }

    public getZoom(): number {
        return this.mapManager.getZoom();
    }

    public setCenter(center: [number, number], coordinateSystem?: CoordinateSystemTypeEnum): void {
        this.mapManager.setCenter(center, coordinateSystem);
    }

    public setZoom(zoom: number): void {
        this.mapManager.setZoom(zoom);
        this.updateScale();
    }

    public setBasemap(basemap: BasemapTypeEnum): void {
        this.setLoading(true, this.t.changingBasemap);
        this.mapManager.setBasemap(basemap);
        setTimeout(() => {
            this.setLoading(false, "");
            this.handleTogglePopup(null);
        }, 500);
    }

    public getBasemap(): BasemapTypeEnum {
        return this.mapManager.getCurrentBasemap();
    }

    public setTheme(theme: "light" | "dark"): void {
        this.theme = theme;
        this.container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        this.toolbar?.updateTheme(theme);
        this.scaleBar?.updateTheme(theme);
        this.floatingToolbar?.updateTheme(theme);
        this.measurementFloatingToolbar?.updateTheme(theme);
        if (this.activePopupType) {
            const currentPopup = this.activePopupType;
            this.handleTogglePopup(null);
            this.handleTogglePopup(currentPopup);
        }
    }

    public getTheme(): "light" | "dark" {
        return this.theme;
    }

    public setLocale(locale: Locale): void {
        this.locale = locale;
        this.t = getTranslation(locale);
        this.toolbar?.destroy();
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
            this.activePopupPanel = null;
        }
        this.initUI();
        if (this.activePopupType) {
            this.handleTogglePopup(this.activePopupType);
        }
    }

    public getContainer(): HTMLElement {
        return this.container;
    }

    public getLayerManager(): LayerManager {
        return this.layerManager;
    }

    public addMarkerLayer(id: string, name: string, options?: { defaultColor?: number[]; defaultSize?: number }): MarkerLayer {
        const layer = new MarkerLayer(id, name, { ...options, visible: true, opacity: 1 });
        this.layerManager.addLayer(layer);
        return layer;
    }

    public removeLayer(id: string): void {
        this.layerManager.removeLayer(id);
        if (this.activePopupType === "layers") {
            this.handleTogglePopup("layers");
        }
    }

    public setLayerVisibility(id: string, visible: boolean): void {
        const layer = this.layerManager.getLayer(id);
        if (layer) {
            layer.setVisible(visible);
            if (this.activePopupType === "layers") {
                this.handleTogglePopup("layers");
            }
        }
    }

    public initCircleDrawLayer(options?: { defaultFillColor?: number[]; defaultOutlineColor?: number[]; defaultOutlineWidth?: number }): CircleDrawLayer {
        if (this.circleDrawLayer) return this.circleDrawLayer;
        this.circleDrawLayer = new CircleDrawLayer("circle-draw", "Circle Draw", options);
        this.circleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.circleDrawLayer);
        this.setupCircleSelection();
        return this.circleDrawLayer;
    }

    private setupCircleSelection(): void {
        this.mapManager.getMap().on("click", (event: any) => {
            const features = this.mapManager.getMap().getFeaturesAtPixel(event.pixel);
            const circleFeature = features?.find((f: any) => {
                const id = f.get("id");
                return id && id.toString().startsWith("circle_");
            });
            if (circleFeature && this.circleDrawLayer && this.circleDrawTool) {
                const id = circleFeature.get("id");
                if (this.circleDrawLayer.getEditingId() !== id) {
                    this.circleDrawTool.startEdit(id);
                }
            } else {
                this.circleDrawLayer?.stopEdit();
                this.hideFloatingToolbar();
            }
        });
    }

    private showFloatingToolbarForCircle(pixel: { x: number; y: number }, circleData: CircleDrawData): void {
        this.floatingToolbarPosition = { x: pixel.x, y: pixel.y };
        this.showFloatingToolbar = true;
        this.currentColor = circleData.fillColor || [255, 0, 0, 1];
        this.currentStrokeWidth = circleData.outlineWidth || 3;
        this.currentStrokeStyle = "solid";

        if (this.floatingToolbar) {
            this.floatingToolbar.setVisible(true);
            this.floatingToolbar.updatePosition(this.floatingToolbarPosition);
        } else {
            this.floatingToolbar = new FloatingToolbar({
                onColorChange: (color) => {
                    this.currentColor = color;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(
                            this.selectedCircleId,
                            [color[0], color[1], color[2], 0.3],
                            [color[0], color[1], color[2], 1],
                            this.currentStrokeWidth,
                            this.currentStrokeStyle
                        );
                    }
                },
                onStrokeWidthChange: (width) => {
                    this.currentStrokeWidth = width;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(
                            this.selectedCircleId,
                            [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                            [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                            width,
                            this.currentStrokeStyle
                        );
                    }
                },
                onStrokeStyleChange: (style) => {
                    this.currentStrokeStyle = style;
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.updateCircleStyle(
                            this.selectedCircleId,
                            [this.currentColor[0], this.currentColor[1], this.currentColor[2], 0.3],
                            [this.currentColor[0], this.currentColor[1], this.currentColor[2], 1],
                            this.currentStrokeWidth,
                            style
                        );
                    }
                },
                onDelete: () => {
                    if (this.selectedCircleId && this.circleDrawLayer) {
                        this.circleDrawLayer.removeCircle(this.selectedCircleId);
                    }
                    this.hideFloatingToolbar();
                },
                onClose: () => this.hideFloatingToolbar(),
                onPositionChange: (pos) => {
                    this.floatingToolbarPosition = pos;
                },
                theme: this.theme,
                t: this.t,
                containerRef: this.container,
                currentColor: this.currentColor,
                currentStrokeWidth: this.currentStrokeWidth,
                currentStrokeStyle: this.currentStrokeStyle,
            });
        }
    }

    private hideFloatingToolbar(): void {
        this.showFloatingToolbar = false;
        this.selectedCircleId = null;
        this.floatingToolbar?.setVisible(false);
    }

    public initDistanceMeasureLayer(options?: { lineColor?: number[]; lineWidth?: number }): DistanceMeasurementLayer {
        if (this.distanceMeasureLayer) return this.distanceMeasureLayer;
        this.distanceMeasureLayer = new DistanceMeasurementLayer("distance-measurement", "Distance Measurement", options);
        this.distanceMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.distanceMeasureLayer);
        this.setupMeasurementSelection();
        return this.distanceMeasureLayer;
    }

    public initAreaMeasureLayer(options?: { fillColor?: number[]; lineColor?: number[]; lineWidth?: number }): AreaMeasurementLayer {
        if (this.areaMeasureLayer) return this.areaMeasureLayer;
        this.areaMeasureLayer = new AreaMeasurementLayer("area-measurement", "Area Measurement", options);
        this.areaMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.areaMeasureLayer);
        return this.areaMeasureLayer;
    }

    private setupMeasurementSelection(): void {
        this.mapManager.getMap().on("click", (event: any) => {
            const features = this.mapManager.getMap().getFeaturesAtPixel(event.pixel);
            const measureFeature = features?.find((f: any) => f.get("measurementId"));

            if (measureFeature) {
                const id = measureFeature.get("measurementId");
                this.selectedMeasurementId = id;
                this.showMeasurementToolbarForFeature(event.pixel);
            } else {
                this.hideMeasurementToolbar();
            }
        });
    }

    private showMeasurementToolbarForFeature(pixel: { x: number; y: number }): void {
        this.measurementToolbarPosition = { x: pixel.x, y: pixel.y };
        this.showMeasurementToolbar = true;

        if (this.measurementFloatingToolbar) {
            this.measurementFloatingToolbar.setVisible(true);
            this.measurementFloatingToolbar.updatePosition(this.measurementToolbarPosition);
        } else {
            this.measurementFloatingToolbar = new MeasurementFloatingToolbar({
                onDelete: () => {
                    if (this.selectedMeasurementId) {
                        this.deleteMeasurement(this.selectedMeasurementId);
                    }
                    this.hideMeasurementToolbar();
                },
                onClose: () => this.hideMeasurementToolbar(),
                onPositionChange: (pos) => {
                    this.measurementToolbarPosition = pos;
                },
                theme: this.theme,
                t: this.t,
                containerRef: this.container,
            });
        }
    }

    private hideMeasurementToolbar(): void {
        this.showMeasurementToolbar = false;
        this.selectedMeasurementId = null;
        this.measurementFloatingToolbar?.setVisible(false);
    }

    public startMeasureDistance(onComplete?: (data: any) => void): void {
        if (!this.distanceMeasureLayer) {
            this.initDistanceMeasureLayer();
        }
        this.setMeasureStatus(this.t.clickToStartMeasure);
        this.distanceMeasureLayer?.startMeasure((data) => {
            if ('isDrawing' in data && data.isDrawing) {
                const distanceText = data.distance >= 1000
                    ? `${(data.distance / 1000).toFixed(2)} ${this.t.kilometers}`
                    : `${data.distance.toFixed(0)} ${this.t.meters}`;
                this.setMeasureStatus(`${this.t.distance}: ${distanceText} | ${this.t.doubleClickToFinish}`);
            } else {
                this.setMeasureStatus(null);
                onComplete?.(data);
            }
        });
    }

    public startMeasureArea(onComplete?: (data: any) => void): void {
        if (!this.areaMeasureLayer) {
            this.initAreaMeasureLayer();
        }
        this.setMeasureStatus(this.t.clickToStartMeasure);
        this.areaMeasureLayer?.startMeasure((data) => {
            const areaText = data.area >= 1000000
                ? `${(data.area / 1000000).toFixed(2)} ${this.t.squareKilometers}`
                : `${data.area.toFixed(0)} ${this.t.squareMeters}`;

            if ('isDrawing' in data && data.isDrawing) {
                this.setMeasureStatus(`${this.t.area}: ${areaText}`);
            } else {
                this.setMeasureStatus(`${this.t.area}: ${areaText}`);
                setTimeout(() => {
                    this.setMeasureStatus(null);
                }, 2000);
                onComplete?.(data);
            }
        });
    }

    public clearAllMeasurements(): void {
        this.distanceMeasureLayer?.clearAllMeasurements();
        this.areaMeasureLayer?.clearAllMeasurements();
        this.setMeasureStatus(null);
    }

    public deleteMeasurement(id: string): boolean {
        const deleted = this.distanceMeasureLayer?.deleteMeasurement(id) || this.areaMeasureLayer?.deleteMeasurement(id);
        return deleted || false;
    }

    public zoomIn(): void {
        const currentZoom = this.getZoom();
        this.setZoom(currentZoom + 1);
    }

    public zoomOut(): void {
        const currentZoom = this.getZoom();
        this.setZoom(currentZoom - 1);
    }

    public locateUser(): void {
        if (!navigator.geolocation) {
            return;
        }

        this.setLoading(true, this.t.locateMe);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.setCenter([longitude, latitude]);
                this.setZoom(15);
                this.setLoading(false, "");
            },
            (error) => {
                console.warn("Geolocation error:", error);
                this.setLoading(false, "");
            }
        );
    }

    public getMap(): any {
        return this.mapManager.getMap();
    }

    public destroy(): void {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        this.toolbar?.destroy();
        this.scaleBar?.destroy();
        this.loadingOverlay?.destroy();
        this.floatingToolbar?.destroy();
        this.measurementFloatingToolbar?.destroy();
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
        }
        if (this.drawingStatusDiv) this.drawingStatusDiv.remove();
        if (this.measureStatusDiv) this.measureStatusDiv.remove();

        this.drawToolManager.destroy();
        this.circleDrawLayer = null;
        this.circleDrawTool = null;
        this.distanceMeasureLayer = null;
        this.areaMeasureLayer = null;
        this.layerManager.clearAll();
        this.mapManager.destroy();
    }

}