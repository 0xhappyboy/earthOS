import { BasemapTypeEnum, CoordinateSystemTypeEnum, CircleDrawData, MapType, LayerInfo } from "./types";
import { getTranslation, Locale } from "./i18n";
import { ThreeDMapManager } from "./map/ThreeDMapManager";
import { TwoDMapManager, TwoDMapManagerCallbacks } from "./map/TwoDMapManager";
import { UIManager } from "./UIManager";

export interface EarthViewOptions {
    container?: HTMLElement;
    containerSelector?: string;
    id?: string;
    parent?: HTMLElement;
    parentSelector?: string;
    basemap?: BasemapTypeEnum;
    baseMapUrl?: string;
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
    private container: HTMLElement;
    private isOwnContainer: boolean = false;
    private mapType: MapType = MapType.TWO_D;
    private twoDManager: TwoDMapManager | null = null;
    private threeDManager: ThreeDMapManager | null = null;
    private uiManager: UIManager | null = null;
    private mapContainer: HTMLElement;

    private savedBasemap: BasemapTypeEnum;
    private savedBaseMapUrl: string | undefined;
    private savedCenter: [number, number];
    private savedZoom: number;
    private savedCoordinateSystem: CoordinateSystemTypeEnum;
    private savedTheme: "light" | "dark";
    private savedLocale: Locale;
    private savedEnableDrawing: boolean;
    private onLoadCallback?: (core: EarthView) => void;
    private onMoveEndCallback?: (center: [number, number], zoom: number) => void;
    private onMapClickCallback?: (event: { longitude: number; latitude: number }) => void;
    private onCircleDrawnCallback?: (data: CircleDrawData) => void;

    constructor(options: EarthViewOptions) {
        const {
            container, containerSelector, id, parent, parentSelector,
            basemap = BasemapTypeEnum.SATELLITE,
            baseMapUrl,
            center = [0, 0],
            zoom = 12,
            coordinateSystem = CoordinateSystemTypeEnum.WGS84,
            onLoad, onMoveEnd, onMapClick, onCircleDrawn,
            theme = "dark",
            i18n = "zh",
            enableDrawing = true,
        } = options;

        const { container: resolvedContainer, isOwn } = this.resolveContainer({
            container, containerSelector, id, parent, parentSelector
        });

        this.container = resolvedContainer;
        this.isOwnContainer = isOwn;

        this.savedBasemap = basemap;
        this.savedBaseMapUrl = baseMapUrl;
        this.savedCenter = center;
        this.savedZoom = zoom;
        this.savedCoordinateSystem = coordinateSystem;
        this.savedTheme = theme;
        this.savedLocale = i18n;
        this.savedEnableDrawing = enableDrawing;
        this.onLoadCallback = onLoad;
        this.onMoveEndCallback = onMoveEnd;
        this.onMapClickCallback = onMapClick;
        this.onCircleDrawnCallback = onCircleDrawn;

        this.container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        this.container.style.cssText = 'position:relative;width:100%;height:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;';
        this.mapContainer = document.createElement('div');
        this.mapContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;z-index:1;';
        this.container.appendChild(this.mapContainer);
        this.initUI();
        this.init2D();
        if (this.onLoadCallback) {
            setTimeout(() => this.onLoadCallback?.(this), 100);
        }
    }

    private resolveContainer(options: {
        container?: HTMLElement;
        containerSelector?: string;
        id?: string;
        parent?: HTMLElement;
        parentSelector?: string;
    }): { container: HTMLElement; isOwn: boolean } {
        const { container, containerSelector, id, parent, parentSelector } = options;
        if (container) return { container, isOwn: false };
        if (containerSelector) {
            const el = document.querySelector(containerSelector);
            if (!el) throw new Error(`[EarthView] Container element not found: ${containerSelector}`);
            return { container: el as HTMLElement, isOwn: false };
        }
        if (id) {
            const el = document.getElementById(id);
            if (!el) throw new Error(`[EarthView] Container element not found: #${id}`);
            return { container: el, isOwn: false };
        }
        if (parent) {
            const autoContainer = this.createAutoContainer();
            parent.appendChild(autoContainer);
            return { container: autoContainer, isOwn: true };
        }
        if (parentSelector) {
            const parentEl = document.querySelector(parentSelector);
            if (!parentEl) throw new Error(`[EarthView] Parent element not found: ${parentSelector}`);
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
        const t = getTranslation(this.savedLocale);
        this.uiManager = new UIManager(
            this.container,
            this.savedTheme,
            t,
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
                onDrawImage: () => this.startDrawImage(),
                onGetLayerFeatures: (layerId) => this.getLayerFeatures(layerId),
                onLocateFeature: (layerId, featureId) => this.locateFeature(layerId, featureId),
                onCopyFeatureCoordinates: (layerId, featureId) => this.copyFeatureCoordinates(layerId, featureId),
            },
            () => this.getLayerList(),
            () => this.getBasemap()
        );
    }

    private startDrawCircle(): void { this.twoDManager?.startDrawCircle(); }
    private startDrawRectangle(): void { this.twoDManager?.startDrawRectangle(); }
    private startDrawTriangle(): void { this.twoDManager?.startDrawTriangle(); }
    private startDrawFreehand(): void { this.twoDManager?.startDrawFreehand(); }
    private startDrawFreehandPolygon(): void { this.twoDManager?.startDrawFreehandPolygon(); }
    private startDrawEllipse(): void { this.twoDManager?.startDrawEllipse(); }
    private startDrawMarker(): void { this.twoDManager?.startDrawMarker(); }
    private startDrawText(): void { this.twoDManager?.startDrawText(); }
    private startDrawArrow(): void { this.twoDManager?.startDrawArrow(); }
    private startDrawLine(): void { this.twoDManager?.startDrawLine(); }
    private startDrawBezier(): void { this.twoDManager?.startDrawBezier(); }
    private startDrawSector(): void { this.twoDManager?.startDrawSector(); }
    private startDrawImage(): void { this.twoDManager?.startDrawImage(); }
    private startEditShape(): void { this.twoDManager?.startEditShape(); }
    private startMeasureDistance(): void { this.twoDManager?.startMeasureDistance(); }
    private startMeasureArea(): void { this.twoDManager?.startMeasureArea(); }
    private clearAllMeasurements(): void { this.twoDManager?.clearAllMeasurements(); }
    private startPointCoordinatePick(): void { this.twoDManager?.startPointCoordinatePick(); }
    private startLineCoordinatePick(): void { this.twoDManager?.startLineCoordinatePick(); }
    private startPolygonCoordinatePick(): void { this.twoDManager?.startPolygonCoordinatePick(); }
    private showCoordinateList(): void { this.twoDManager?.showCoordinateList?.(); }
    private getPointDataForPanel(): any[] { return this.twoDManager?.getPointDataForPanel?.() || []; }
    private getLineDataForPanel(): any[] { return this.twoDManager?.getLineDataForPanel?.() || []; }
    private getPolygonDataForPanel(): any[] { return this.twoDManager?.getPolygonDataForPanel?.() || []; }
    private locateToPoint(lng: number, lat: number): void { this.twoDManager?.locateToPoint?.(lng, lat); }
    private locateToLine(points: any[]): void { this.twoDManager?.locateToLine?.(points); }
    private locateToPolygon(points: any[]): void { this.twoDManager?.locateToPolygon?.(points); }
    private locateUser(): void { this.twoDManager?.locateUser(); }
    private getLayerFeatures(layerId: string): any[] { return this.twoDManager?.getLayerFeatures?.(layerId) || []; }
    private locateFeature(layerId: string, featureId: string): void { this.twoDManager?.locateFeature?.(layerId, featureId); }
    private copyFeatureCoordinates(layerId: string, featureId: string): void { this.twoDManager?.copyFeatureCoordinates?.(layerId, featureId); }
    private getLayerList(): LayerInfo[] { return this.twoDManager?.getLayerList?.() || []; }
    private getLayerVisibility(id: string): boolean { return this.twoDManager?.getLayerVisibility?.(id) || false; }
    private handleTogglePopup(popup: any): void { this.twoDManager?.handleTogglePopup?.(popup); }
    private init2D(): void {
        this.mapContainer.innerHTML = '';
        this.mapContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;z-index:1;';
        const callbacks: TwoDMapManagerCallbacks = {
            onMoveEnd: (center, zoom) => this.onMoveEndCallback?.(center, zoom),
            onMapClick: (event) => this.onMapClickCallback?.(event),
            onCircleDrawn: (data) => this.onCircleDrawnCallback?.(data),
            showToast: (msg) => this.showToastMessage(msg),
        };
        this.twoDManager = new TwoDMapManager(
            this.mapContainer,
            this.savedBasemap,
            this.savedCenter,
            this.savedZoom,
            this.savedCoordinateSystem,
            this.savedTheme,
            this.savedLocale,
            this.savedEnableDrawing,
            callbacks,
            this.savedBaseMapUrl,
            false 
        );
        if (this.threeDManager) {
            this.threeDManager.setVisible?.(false);
        }
        this.mapType = MapType.TWO_D;
    }

    private init3D(): void {
        this.mapContainer.innerHTML = '';
        this.mapContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;margin:0;padding:0;overflow:hidden;box-sizing:border-box;z-index:1;';

        this.threeDManager = new ThreeDMapManager(
            this.mapContainer,
            this.savedBasemap,
            this.savedCenter,
            this.savedZoom,
            this.savedCoordinateSystem,
            this.savedBaseMapUrl
        );

        this.mapType = MapType.THREE_D;
    }

    private showToastMessage(message: string): void {
        const toast = document.createElement("div");
        toast.style.cssText = `position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:8px 16px;border-radius:8px;font-size:12px;z-index:10000;pointer-events:none;white-space:nowrap;`;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    private destroyCurrentManager(): void {
        if (this.twoDManager) {
            this.twoDManager.destroyMapOnly?.();
            this.twoDManager = null;
        }
        if (this.threeDManager) {
            this.threeDManager.destroy();
            this.threeDManager = null;
        }
    }

    public setMapType(type: MapType): void {
        if (this.mapType === type) return;

        if (type === MapType.TWO_D) {
            if (this.threeDManager) {
                this.threeDManager.setVisible?.(false);
                this.threeDManager.destroy();
                this.threeDManager = null;
            }
            this.init2D();
            this.showToastMessage('已切换到 2D 模式');
        } else {
            if (this.twoDManager) {
                this.twoDManager.destroyMapOnly?.();
                this.twoDManager = null;
            }
            this.init3D();
            this.showToastMessage('已切换到 3D 地球模式');
        }
    }

    public getMapType(): MapType {
        return this.mapType;
    }

    public getCenter(): [number, number] {
        if (this.twoDManager) return this.twoDManager.getCenter();
        if (this.threeDManager) return this.threeDManager.getCenter();
        return this.savedCenter;
    }

    public getZoom(): number {
        if (this.twoDManager) return this.twoDManager.getZoom();
        if (this.threeDManager) return this.threeDManager.getZoom();
        return this.savedZoom;
    }

    public setCenter(center: [number, number], cs?: CoordinateSystemTypeEnum): void {
        this.savedCenter = center;
        if (this.twoDManager) this.twoDManager.setCenter(center, cs);
        if (this.threeDManager) this.threeDManager.setCenter(center);
    }

    public setZoom(zoom: number): void {
        this.savedZoom = zoom;
        if (this.twoDManager) this.twoDManager.setZoom(zoom);
        if (this.threeDManager) this.threeDManager.setZoom(zoom);
    }

    public setBasemap(basemap: BasemapTypeEnum): void {
        this.savedBasemap = basemap;
        if (this.twoDManager) this.twoDManager.setBasemap(basemap);
        if (this.threeDManager) this.threeDManager.setBasemap(basemap);
        this.uiManager?.updateCurrentBasemap(basemap);
    }

    public setBasemapByUrl(url: string): void {
        if (this.twoDManager) this.twoDManager.setBasemapByUrl(url);
        this.uiManager?.updateCurrentBasemap(null);
    }

    public getBasemap(): BasemapTypeEnum | null {
        if (this.twoDManager) return this.twoDManager.getBasemap();
        return this.savedBasemap;
    }

    public zoomIn(): void {
        if (this.twoDManager) this.twoDManager.zoomIn();
        if (this.threeDManager) this.threeDManager.setZoom(this.getZoom() + 1);
    }

    public zoomOut(): void {
        if (this.twoDManager) this.twoDManager.zoomOut();
        if (this.threeDManager) this.threeDManager.setZoom(this.getZoom() - 1);
    }

    public setTheme(theme: "light" | "dark"): void {
        this.savedTheme = theme;
        this.container.setAttribute("data-theme", theme);
        document.body.setAttribute("data-theme", theme);
        if (this.twoDManager) this.twoDManager.updateTheme(theme);
        if (this.uiManager) this.uiManager.updateTheme(theme);
    }

    public getTheme(): "light" | "dark" {
        return this.savedTheme;
    }

    public setLocale(locale: Locale): void {
        this.savedLocale = locale;
        if (this.twoDManager) this.twoDManager.updateLocale(locale);
        if (this.uiManager) {
            const t = getTranslation(locale);
            this.uiManager.updateLocale(t);
        }
    }

    public getContainer(): HTMLElement {
        return this.container;
    }

    public getLayerManager() {
        return this.twoDManager?.getLayerManager() || null;
    }

    public getMap(): any {
        return this.twoDManager?.getMap() || null;
    }

    public removeLayer(id: string): void {
        this.twoDManager?.removeLayer(id);
        this.uiManager?.updateLayerList();
    }

    public setLayerVisibility(id: string, visible: boolean): void {
        this.twoDManager?.setLayerVisibility(id, visible);
        this.uiManager?.updateLayerList();
    }

    public getThreeDManager(): ThreeDMapManager | null {
        return this.threeDManager;
    }

    public destroy(): void {
        this.destroyCurrentManager();
        this.uiManager?.destroy();
        if (this.isOwnContainer && this.container.parentNode) {
            this.container.remove();
        }
    }
}