import { BasemapOption, BasemapOptions, DrawToolsPanel, LayersPanel, LoadingOverlay, PopupPanel, PopupType, ScaleBar, Toolbar, ToolsPanel } from "./components";
import { CoordinatePickingDataPanel, LineData, PointData, PolygonData } from "./components/CoordinatePickingDataPanel";
import { LayerFeature } from "./components/LayersPanel";
import { Translations } from "./i18n";
import { BasemapTypeEnum, LayerInfo } from "./types";

export interface UIManagerCallbacks {
    onTogglePopup: (popup: PopupType) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onLocate: () => void;
    onDrawCircle: () => void;
    onDrawRectangle: () => void;
    onDrawTriangle: () => void;
    onDrawFreehand: () => void;
    onDrawFreehandPolygon: () => void;
    onDrawEllipse: () => void;
    onDrawMarker: () => void;
    onDrawText: () => void;
    onDrawImage: () => void;
    onDrawArrow: () => void;
    onDrawLine: () => void;
    onDrawBezier: () => void;
    onDrawSector: () => void;
    onEditShape: () => void;
    onDistanceMeasure: () => void;
    onAreaMeasure: () => void;
    onClearMeasurements: () => void;
    onSetBasemap: (basemap: BasemapTypeEnum) => void;
    onToggleLayerVisibility: (layerId: string) => void;
    onRemoveLayer: (layerId: string) => void;
    onPointCoordinatePick: () => void;
    onLineCoordinatePick: () => void;
    onPolygonCoordinatePick: () => void;
    onShowCoordinateList: () => void;
    getPointData?: () => PointData[];
    getLineData?: () => LineData[];
    getPolygonData?: () => PolygonData[];
    onLocateCoordinate?: (longitude: number, latitude: number) => void;
    onLocateLine?: (points: { longitude: number; latitude: number }[]) => void;
    onLocatePolygon?: (points: { longitude: number; latitude: number }[]) => void;
    onGetLayerFeatures?: (layerId: string) => LayerFeature[];
    onLocateFeature?: (layerId: string, featureId: string) => void;
    onCopyFeatureCoordinates?: (layerId: string, featureId: string) => void;
}

export class UIManager {
    private container: HTMLElement;
    private toolbar: Toolbar | null = null;
    private scaleBar: ScaleBar | null = null;
    private loadingOverlay: LoadingOverlay | null = null;
    private activePopupPanel: PopupPanel | null = null;
    private activePopupType: PopupType = null;
    private theme: "light" | "dark";
    private t: Translations;
    private callbacks: UIManagerCallbacks;
    private getLayerListFn: () => LayerInfo[];
    private getCurrentBasemapFn: () => BasemapTypeEnum | null;
    private currentBasemap: BasemapTypeEnum;

    private basemapOptionsInstance: BasemapOptions | null = null;

    private layersPanelInstance: LayersPanel | null = null;


    private coordinatePickingDataPanel: CoordinatePickingDataPanel | null = null;

    constructor(
        container: HTMLElement,
        theme: "light" | "dark",
        t: Translations,
        callbacks: UIManagerCallbacks,
        getLayerList: () => LayerInfo[],
        getCurrentBasemap: () => BasemapTypeEnum | null
    ) {
        this.container = container;
        this.theme = theme;
        this.t = t;
        this.callbacks = callbacks;
        this.getLayerListFn = getLayerList;
        this.getCurrentBasemapFn = getCurrentBasemap;
        this.currentBasemap = getCurrentBasemap() || BasemapTypeEnum.SATELLITE;
        this.init();
    }

    private init(): void {
        this.toolbar = new Toolbar({
            container: this.container,
            t: this.t,
            theme: this.theme,
            activePopup: this.activePopupType,
            onTogglePopup: this.handleTogglePopup.bind(this),
            onZoomIn: () => this.callbacks.onZoomIn(),
            onZoomOut: () => this.callbacks.onZoomOut(),
            onLocate: () => this.callbacks.onLocate(),
            onShowCoordinatePickingDataPanel: () => this.showCoordinatePickingDataPanel(),
        });
        this.scaleBar = new ScaleBar(this.container, this.theme);
        this.loadingOverlay = new LoadingOverlay(this.container, this.theme);
    }

    private getBasemapOptions(): BasemapOption[] {
        return [
            { value: BasemapTypeEnum.SATELLITE, label: this.t.satellite, icon: "🛰️" },
            { value: BasemapTypeEnum.STREETS, label: this.t.streets, icon: "🗺️" },
            { value: BasemapTypeEnum.TOPO, label: this.t.topographic, icon: "⛰️" },
            { value: BasemapTypeEnum.HYBRID, label: this.t.hybrid, icon: "🔄" },
            { value: BasemapTypeEnum.TERRAIN, label: this.t.terrain, icon: "🗻" },
            { value: BasemapTypeEnum.OCEANS, label: this.t.oceans, icon: "🌊" },
            { value: BasemapTypeEnum.DARK_GRAY, label: this.t.darkGray, icon: "🌙" },
            { value: BasemapTypeEnum.LIGHT_GRAY, label: this.t.lightGray, icon: "☀️" },
            { value: BasemapTypeEnum.NATIONAL_GEOGRAPHIC, label: this.t.nationalGeographic, icon: "📰" },
            { value: BasemapTypeEnum.IMAGERY, label: this.t.imagery, icon: "📷" },
            { value: BasemapTypeEnum.PHYSICAL, label: this.t.physical, icon: "🌎" },
            { value: BasemapTypeEnum.AMAP_STREETS, label: this.t.amapStreets, icon: "🗺️" },
            { value: BasemapTypeEnum.AMAP_SATELLITE, label: this.t.amapSatellite, icon: "🛰️" },
            { value: BasemapTypeEnum.GOOGLE_STREETS, label: this.t.googleStreets, icon: "🗺️" },
            { value: BasemapTypeEnum.GOOGLE_SATELLITE, label: this.t.googleSatellite, icon: "🛰️" },
        ];
    }

    private handleTogglePopup(popup: PopupType): void {
        if (this.coordinatePickingDataPanel) {
            this.coordinatePickingDataPanel.destroy();
            this.coordinatePickingDataPanel = null;
        }
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
            this.activePopupPanel = null;
        }
        this.activePopupType = popup;
        this.toolbar?.updateActivePopup(popup);
        if (popup === null) return;

        let panel: PopupPanel;
        switch (popup) {
            case "layers":
                panel = new PopupPanel({
                    title: this.t.layers,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => {
                        this.layersPanelInstance = null;
                        this.handleTogglePopup(null);
                    },
                });
                this.layersPanelInstance = new LayersPanel({
                    layerList: this.getLayerListFn(),
                    onToggleVisibility: (id) => this.callbacks.onToggleLayerVisibility(id),
                    onRemoveLayer: (id) => this.callbacks.onRemoveLayer(id),
                    onGetLayerFeatures: (layerId) => {
                        if (this.callbacks.onGetLayerFeatures) {
                            return this.callbacks.onGetLayerFeatures(layerId);
                        }
                        return [];
                    },
                    onLocateFeature: (layerId, featureId) => {
                        if (this.callbacks.onLocateFeature) {
                            this.callbacks.onLocateFeature(layerId, featureId);
                        }
                    },
                    onCopyFeatureCoordinates: (layerId, featureId) => {
                        if (this.callbacks.onCopyFeatureCoordinates) {
                            this.callbacks.onCopyFeatureCoordinates(layerId, featureId);
                        }
                    },
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(this.layersPanelInstance.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                panel.onAttached();
                this.adjustPopupPosition(panel);
                break;
            case "basemap":
                panel = new PopupPanel({
                    title: this.t.basemap,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => {
                        this.basemapOptionsInstance = null;
                        this.handleTogglePopup(null);
                    },
                });
                this.basemapOptionsInstance = new BasemapOptions({
                    currentBasemap: this.currentBasemap,
                    onSelect: (basemap) => {
                        this.callbacks.onSetBasemap(basemap);
                    },
                    theme: this.theme,
                    t: this.t,
                    options: this.getBasemapOptions(),
                });
                panel.appendChild(this.basemapOptionsInstance.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                panel.onAttached();
                this.adjustPopupPosition(panel);
                break;
            case "draw":
                panel = new PopupPanel({
                    title: this.t.drawTools,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => this.handleTogglePopup(null),
                });
                const drawPanel = new DrawToolsPanel({
                    onDrawCircle: () => this.callbacks.onDrawCircle(),
                    onDrawRectangle: () => this.callbacks.onDrawRectangle(),
                    onDrawTriangle: () => this.callbacks.onDrawTriangle(),
                    onDrawFreehand: () => this.callbacks.onDrawFreehand(),
                    onDrawFreehandPolygon: () => this.callbacks.onDrawFreehandPolygon(),
                    onDrawEllipse: () => this.callbacks.onDrawEllipse(),
                    onDrawMarker: () => this.callbacks.onDrawMarker(),
                    onDrawText: () => this.callbacks.onDrawText(),
                    onDrawArrow: () => this.callbacks.onDrawArrow(),
                    onDrawLine: () => this.callbacks.onDrawLine(),
                    onDrawBezier: () => this.callbacks.onDrawBezier(),
                    onDrawSector: () => this.callbacks.onDrawSector(),
                    onDrawImage: this.callbacks.onDrawImage,
                    onEditShape: () => this.callbacks.onEditShape(),
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(drawPanel.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                panel.onAttached();
                this.adjustPopupPosition(panel);
                break;
            case "tools":
                panel = new PopupPanel({
                    title: this.t.tools,
                    theme: this.theme,
                    t: this.t,
                    onClose: () => {
                        this.handleTogglePopup(null);
                    },
                });
                const toolsPanel = new ToolsPanel({
                    onDistanceMeasure: () => this.callbacks.onDistanceMeasure(),
                    onAreaMeasure: () => this.callbacks.onAreaMeasure(),
                    onClearMeasurements: () => this.callbacks.onClearMeasurements(),
                    onPointCoordinatePick: () => this.callbacks.onPointCoordinatePick(),
                    onLineCoordinatePick: () => this.callbacks.onLineCoordinatePick(),
                    onPolygonCoordinatePick: () => this.callbacks.onPolygonCoordinatePick(),
                    onShowCoordinateList: () => this.callbacks.onShowCoordinateList(),
                    isMeasuring: false,
                    currentMeasureType: null,
                    currentPickType: null,
                    measurePreview: null,
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(toolsPanel.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
                panel.onAttached();
                this.adjustPopupPosition(panel);
                break;
        }
    }

    private adjustPopupPosition(panel: PopupPanel): void {
        setTimeout(() => {
            const panelElement = panel.getElement();
            if (!panelElement) return;
            const containerRect = this.container.getBoundingClientRect();
            const panelRect = panelElement.getBoundingClientRect();
            const panelBottom = panelRect.bottom;
            const containerBottom = containerRect.bottom;
            if (panelBottom > containerBottom) {
                const availableHeight = containerBottom - panelRect.top - 10;
                if (availableHeight > 100) {
                    panelElement.style.maxHeight = `${availableHeight}px`;
                } else {
                    panelElement.style.maxHeight = `100px`;
                }
            }
        }, 10);
    }

    public updateCurrentBasemap(basemap: BasemapTypeEnum | null): void {
        if (basemap === null) {
            return;
        }
        this.currentBasemap = basemap;
        if (this.basemapOptionsInstance) {
            this.basemapOptionsInstance.updateCurrentBasemap(basemap);
        }
    }

    public refreshBasemapOptions(): void {
        if (this.basemapOptionsInstance && this.activePopupType === "basemap") {
            this.basemapOptionsInstance.updateProps({
                options: this.getBasemapOptions(),
                t: this.t,
                theme: this.theme,
                currentBasemap: this.currentBasemap
            });
        }
    }

    public updateLayerList(): void {

        if (this.activePopupType === "layers" && this.layersPanelInstance) {
            this.layersPanelInstance.updateData(this.getLayerListFn());
        }
    }

    public showLoading(message: string): void {
        this.loadingOverlay?.show(message);
    }

    public hideLoading(): void {
        this.loadingOverlay?.hide();
    }

    public updateScale(scale: string): void {
        this.scaleBar?.updateScale(scale);
    }

    public updateTheme(theme: "light" | "dark"): void {
        this.theme = theme;
        this.toolbar?.updateTheme(theme);
        this.scaleBar?.updateTheme(theme);


        if (this.basemapOptionsInstance) {
            this.basemapOptionsInstance.updateTheme(theme);
        }


        if (this.layersPanelInstance) {
            this.layersPanelInstance.updateTheme(theme);
        }

        if (this.activePopupType) {
            const currentPopup = this.activePopupType;
            this.handleTogglePopup(null);
            this.handleTogglePopup(currentPopup);
        }
    }

    public updateLocale(t: Translations): void {
        this.t = t;
        this.toolbar?.destroy();
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
            this.activePopupPanel = null;
        }
        this.init();
        this.refreshBasemapOptions();
        if (this.activePopupType) {
            this.handleTogglePopup(this.activePopupType);
        }
    }

    private showCoordinatePickingDataPanel(): void {
        if (this.coordinatePickingDataPanel) {
            this.coordinatePickingDataPanel.destroy();
            this.coordinatePickingDataPanel = null;
            return;
        }
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
            this.activePopupPanel = null;
        }
        this.activePopupType = null;
        this.toolbar?.updateActivePopup(null);
        const dataPanel = new CoordinatePickingDataPanel({
            onClose: () => {
                if (this.coordinatePickingDataPanel) {
                    this.coordinatePickingDataPanel.destroy();
                    this.coordinatePickingDataPanel = null;
                }
            },
            onSelectCategory: (category: string) => {
            },
            onLocatePoint: (longitude, latitude) => {
                if (this.callbacks.onLocateCoordinate) {
                    this.callbacks.onLocateCoordinate(longitude, latitude);
                }
            },
            onLocateLine: (points) => {
                if (this.callbacks.onLocateLine) {
                    this.callbacks.onLocateLine(points);
                }
            },
            onLocatePolygon: (points) => {
                if (this.callbacks.onLocatePolygon) {
                    this.callbacks.onLocatePolygon(points);
                }
            },
            getPointData: () => {
                if (this.callbacks.getPointData) {
                    return this.callbacks.getPointData();
                }
                return [];
            },
            getLineData: () => {
                if (this.callbacks.getLineData) {
                    return this.callbacks.getLineData();
                }
                return [];
            },
            getPolygonData: () => {
                if (this.callbacks.getPolygonData) {
                    return this.callbacks.getPolygonData();
                }
                return [];
            },
            theme: this.theme,
            t: this.t,
        });

        this.container.appendChild(dataPanel.getElement());
        this.coordinatePickingDataPanel = dataPanel;
    }

    public destroy(): void {
        this.toolbar?.destroy();
        this.scaleBar?.destroy();
        this.loadingOverlay?.destroy();
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
        }
        if (this.coordinatePickingDataPanel) {
            this.coordinatePickingDataPanel.destroy();
        }
        this.basemapOptionsInstance = null;
        this.layersPanelInstance = null;
    }

    public getContainer(): HTMLElement {
        return this.container;
    }
}