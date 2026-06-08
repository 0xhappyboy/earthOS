import { BasemapOption, BasemapOptions, DrawToolsPanel, LayersPanel, LoadingOverlay, PopupPanel, PopupType, ScaleBar, Toolbar, ToolsPanel } from "./components";
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
    private getCurrentBasemapFn: () => BasemapTypeEnum;
    private currentBasemap: BasemapTypeEnum;

    private basemapOptionsInstance: BasemapOptions | null = null;

    private layersPanelInstance: LayersPanel | null = null;

    constructor(
        container: HTMLElement,
        theme: "light" | "dark",
        t: Translations,
        callbacks: UIManagerCallbacks,
        getLayerList: () => LayerInfo[],
        getCurrentBasemap: () => BasemapTypeEnum
    ) {
        this.container = container;
        this.theme = theme;
        this.t = t;
        this.callbacks = callbacks;
        this.getLayerListFn = getLayerList;
        this.getCurrentBasemapFn = getCurrentBasemap;
        this.currentBasemap = getCurrentBasemap();
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
                    theme: this.theme,
                    t: this.t,
                });
                panel.appendChild(this.layersPanelInstance.getElement());
                this.activePopupPanel = panel;
                this.container.appendChild(panel.getElement());
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
                    onEditShape: () => this.callbacks.onEditShape(),
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
                        this.callbacks.onClearMeasurements();
                    },
                });
                const toolsPanel = new ToolsPanel({
                    onDistanceMeasure: () => this.callbacks.onDistanceMeasure(),
                    onAreaMeasure: () => this.callbacks.onAreaMeasure(),
                    onClearMeasurements: () => this.callbacks.onClearMeasurements(),
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


    public updateCurrentBasemap(basemap: BasemapTypeEnum): void {
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

    public destroy(): void {
        this.toolbar?.destroy();
        this.scaleBar?.destroy();
        this.loadingOverlay?.destroy();
        if (this.activePopupPanel) {
            this.activePopupPanel.destroy();
        }
        this.basemapOptionsInstance = null;
        this.layersPanelInstance = null;
    }

    public getContainer(): HTMLElement {
        return this.container;
    }
}