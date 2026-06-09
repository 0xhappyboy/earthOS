import { LayerManager } from "./layers/LayerManager";
import {
    CircleDrawLayer,
    RectangleDrawLayer,
    TriangleDrawLayer,
    DistanceMeasurementLayer,
    AreaMeasurementLayer,
    ArrowDrawLayer,
    EllipseDrawLayer,
    FreehandDrawLayer,
    MarkerDrawLayer,
    TextDrawLayer,
    BezierDrawLayer,
    LineDrawLayer,
    SectorDrawLayer,
    PointCoordinatePickLayer,
    MarkerLayer,
    BarChartLayer,
    CircleLayer,
    ClusterLayer,
    GeoJSONLayer,
    HeatmapLayer,
    PolygonLayer,
    PolylineLayer,
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
import { BezierDrawData } from "./layers/drawlayers/BezierDrawLayer";
import { LineDrawData } from "./layers/drawlayers/LineDrawLayer";
import { SectorDrawData } from "./layers/drawlayers/SectorDrawLayer";
import { PointCoordinatePickData } from "./layers/toollayers/PointCoordinatePickLayer";
import { LineCoordinatePickLayer, LineCoordinatePickData } from "./layers/toollayers/LineCoordinatePickLayer";
import { PolygonCoordinatePickLayer, PolygonCoordinatePickData } from "./layers/toollayers/PolygonCoordinatePickLayer";
import { LineData, PointData, PolygonData } from "./components/CoordinatePickingDataPanel";
import { ImageDrawTool } from "./draw/ImageDrawTool";
import { ImageDrawLayer } from "./layers/drawlayers/ImageDrawLayer";
import { LayerFeature } from "./components/LayersPanel";

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
    private imageDrawLayer: ImageDrawLayer | null = null;
    private imageDrawTool: ImageDrawTool | null = null;
    private selectedImageId: string | null = null;
    private selectedPointPickId: string | null = null;
    private selectedLinePickId: string | null = null;
    private selectedPolygonPickId: string | null = null;

    constructor(options: EarthViewOptions) {
        const {
            container,
            containerSelector,
            id,
            parent,
            parentSelector,
            basemap = BasemapTypeEnum.SATELLITE,
            baseMapUrl,
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
        this.mapManager = new MapManager(
            this.container,
            basemap,
            center,
            zoom,
            coordinateSystem,
            baseMapUrl
        );
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
                onDrawImage: () => this.startDrawImage(),
                onGetLayerFeatures: (layerId) => {
                    const layer = this.layerManager.getLayer(layerId);
                    if (layer && layer instanceof MarkerLayer) {
                        const markers = layer.getAllMarkers();
                        return markers.map(marker => ({
                            id: marker.id,
                            name: marker.bubbleBoxTitle || marker.name || marker.id,
                            type: "point" as const,
                            coordinates: { longitude: marker.longitude, latitude: marker.latitude },
                            properties: marker,
                            timestamp: marker.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof PolygonLayer) {
                        const polygons = (layer as any).getAllPolygons?.() || [];
                        return polygons.map((polygon: any, index: number) => ({
                            id: polygon.id || `polygon_${index}`,
                            name: polygon.title || polygon.name || `面 ${index + 1}`,
                            type: "polygon" as const,
                            coordinates: polygon.points || polygon.coordinates,
                            properties: polygon,
                            timestamp: polygon.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof PolylineLayer) {
                        const polylines = (layer as any).getAllPolylines?.() || [];
                        return polylines.map((polyline: any, index: number) => ({
                            id: polyline.id || `polyline_${index}`,
                            name: polyline.title || polyline.name || `线 ${index + 1}`,
                            type: "line" as const,
                            coordinates: polyline.points || polyline.coordinates,
                            properties: polyline,
                            timestamp: polyline.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof CircleLayer) {
                        const circles = (layer as any).getAllCircles?.() || [];
                        return circles.map((circle: any, index: number) => ({
                            id: circle.id || `circle_${index}`,
                            name: circle.title || circle.name || `圆 ${index + 1}`,
                            type: "polygon" as const,
                            coordinates: { center: circle.center, radius: circle.radius },
                            properties: circle,
                            timestamp: circle.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof HeatmapLayer) {
                        const source = (layer as any).getLayer()?.getSource();
                        const features = source?.getFeatures() || [];
                        return features.map((feature: any, index: number) => {
                            const geom = feature.getGeometry();
                            let lng = feature.get('longitude');
                            let lat = feature.get('latitude');
                            if ((lng === undefined || lat === undefined) && geom) {
                                const coords = geom.getCoordinates();
                                lng = coords[0];
                                lat = coords[1];
                            }
                            return {
                                id: feature.get('id') || `heat_${index}`,
                                name: `HotPoint ${index + 1}`,
                                type: "point" as const,
                                coordinates: { longitude: lng, latitude: lat },
                                properties: feature.getProperties(),
                                timestamp: Date.now()
                            };
                        });
                    }
                    if (layer && layer instanceof ClusterLayer) {
                        const data = (layer as any).getData?.() || [];
                        return data.map((item: any, index: number) => ({
                            id: item.id || `cluster_${index}`,
                            name: item.title || `聚合点 ${index + 1}`,
                            type: "point" as const,
                            coordinates: { longitude: item.longitude, latitude: item.latitude },
                            properties: item,
                            timestamp: item.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof BarChartLayer) {
                        const data = (layer as any).getData?.() || [];
                        return data.map((item: any, index: number) => ({
                            id: item.id || `barchart_${index}`,
                            name: item.title || `柱 ${index + 1}`,
                            type: "point" as const,
                            coordinates: { longitude: item.longitude, latitude: item.latitude },
                            properties: item,
                            timestamp: item.timestamp || Date.now()
                        }));
                    }
                    if (layer && layer instanceof GeoJSONLayer) {
                        const features = layer.getAllFeatures();
                        return features.map((feature: any, index: number) => {
                            const geom = feature.getGeometry?.();
                            let type: "point" | "line" | "polygon" = "point";
                            let coordinates = null;

                            if (geom) {
                                const geomType = geom.getType();
                                if (geomType === "Point") {
                                    type = "point";
                                    const coords = geom.getCoordinates();
                                    coordinates = { longitude: coords[0], latitude: coords[1] };
                                } else if (geomType === "LineString") {
                                    type = "line";
                                    coordinates = geom.getCoordinates().map((c: number[]) => ({ longitude: c[0], latitude: c[1] }));
                                } else if (geomType === "Polygon") {
                                    type = "polygon";
                                    coordinates = geom.getCoordinates()[0].map((c: number[]) => ({ longitude: c[0], latitude: c[1] }));
                                }
                            }
                            return {
                                id: feature.getId?.() || `geojson_${index}`,
                                name: feature.get("name") || feature.get("title") || `Elements ${index + 1}`,
                                type,
                                coordinates,
                                properties: feature.getProperties?.(),
                                timestamp: Date.now()
                            };
                        });
                    }
                    return [];
                },
                onLocateFeature: (layerId, featureId) => {
                    const layer = this.layerManager.getLayer(layerId);
                    const getCoordinatesFromFeature = (feature: any): { lng: number; lat: number } | null => {
                        if (!feature) return null;
                        if (feature.longitude !== undefined && feature.latitude !== undefined) {
                            return { lng: feature.longitude, lat: feature.latitude };
                        }
                        if (feature.coordinates) {
                            if (feature.coordinates.longitude !== undefined && feature.coordinates.latitude !== undefined) {
                                return { lng: feature.coordinates.longitude, lat: feature.coordinates.latitude };
                            }
                            if (Array.isArray(feature.coordinates) && feature.coordinates.length >= 2) {
                                return { lng: feature.coordinates[0], lat: feature.coordinates[1] };
                            }
                        }
                        return null;
                    };
                    const getPointsFromFeature = (feature: any): Array<{ lng: number; lat: number }> | null => {
                        if (!feature) return null;
                        let points = feature.points || feature.coordinates;
                        if (!points || !Array.isArray(points) || points.length === 0) return null;

                        return points.map((p: any) => ({
                            lng: p.longitude ?? p[0],
                            lat: p.latitude ?? p[1]
                        }));
                    };
                    const getFeatureById = (): any => {
                        if (layer instanceof MarkerLayer) {
                            return layer.getMarker(featureId);
                        }
                        if (layer instanceof PolygonLayer) {
                            return (layer as any).getPolygon?.(featureId);
                        }
                        if (layer instanceof PolylineLayer) {
                            return (layer as any).getPolyline?.(featureId);
                        }
                        if (layer instanceof CircleLayer) {
                            return (layer as any).getCircle?.(featureId);
                        }
                        const features = (layer as any)?.getAllFeatures?.() || (layer as any)?.getData?.() || [];
                        return features.find((f: any) => f.id === featureId);
                    };
                    const feature = getFeatureById();
                    if (!feature) {
                        this.showToast("The element was not found.");
                        return;
                    }
                    let centerLng: number | undefined;
                    let centerLat: number | undefined;
                    let zoom = 16;
                    if (layer instanceof MarkerLayer) {
                        const coords = getCoordinatesFromFeature(feature);
                        if (coords) {
                            centerLng = coords.lng;
                            centerLat = coords.lat;
                            zoom = 18;
                        }
                    }
                    else if (layer instanceof CircleLayer) {
                        if (feature.center) {
                            centerLng = feature.center[0];
                            centerLat = feature.center[1];
                        } else {
                            const coords = getCoordinatesFromFeature(feature);
                            if (coords) {
                                centerLng = coords.lng;
                                centerLat = coords.lat;
                            }
                        }
                    }
                    else if (layer instanceof PolygonLayer || layer instanceof PolylineLayer) {
                        const pointsList = getPointsFromFeature(feature);
                        if (pointsList && pointsList.length > 0) {
                            const lons = pointsList.map(p => p.lng);
                            const lats = pointsList.map(p => p.lat);
                            centerLng = (Math.min(...lons) + Math.max(...lons)) / 2;
                            centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
                            const lonDiff = Math.max(...lons) - Math.min(...lons);
                            zoom = lonDiff > 0.5 ? 10 : lonDiff > 0.1 ? 12 : lonDiff > 0.05 ? 14 : 16;
                        }
                    }
                    else if (layer instanceof HeatmapLayer) {
                        const source = (layer as any).getLayer()?.getSource();
                        const features = source?.getFeatures() || [];
                        const targetFeature = features.find((f: any) => f.get('id') === featureId);
                        if (targetFeature) {
                            const lng = targetFeature.get('longitude');
                            const lat = targetFeature.get('latitude');
                            const geom = targetFeature.getGeometry();

                            if (lng !== undefined && lat !== undefined) {
                                centerLng = lng;
                                centerLat = lat;
                                zoom = 16;
                            } else if (geom) {
                                const coords = geom.getCoordinates();
                                centerLng = coords[0];
                                centerLat = coords[1];
                                zoom = 16;
                            }
                        }
                    }
                    else {
                        const coords = getCoordinatesFromFeature(feature);
                        if (coords) {
                            centerLng = coords.lng;
                            centerLat = coords.lat;
                            zoom = 16;
                        }
                    }
                    if (centerLng !== undefined && centerLat !== undefined) {
                        this.setCenter([centerLng, centerLat]);
                        this.setZoom(zoom);
                        this.showToast(`${this.t.locatedToPoint}: ${centerLng.toFixed(6)}, ${centerLat.toFixed(6)}`);
                    } else {
                        this.showToast("Unable to locate the element");
                    }
                },
                onCopyFeatureCoordinates: (layerId, featureId) => {
                    const layer = this.layerManager.getLayer(layerId);
                    let text = "";

                    if (layer && layer instanceof MarkerLayer) {
                        const marker = layer.getMarker(featureId);
                        if (marker) {
                            text = `${marker.longitude.toFixed(8)}, ${marker.latitude.toFixed(8)}`;
                        }
                    } else if (layer && layer instanceof HeatmapLayer) {
                        const source = (layer as any).getLayer()?.getSource();
                        const features = source?.getFeatures() || [];
                        const targetFeature = features.find((f: any) => f.get('id') === featureId);
                        if (targetFeature) {
                            const lng = targetFeature.get('longitude');
                            const lat = targetFeature.get('latitude');
                            const geom = targetFeature.getGeometry();

                            if (lng !== undefined && lat !== undefined) {
                                text = `${Number(lng).toFixed(8)}, ${Number(lat).toFixed(8)}`;
                            } else if (geom) {
                                const coords = geom.getCoordinates();
                                text = `${coords[0].toFixed(8)}, ${coords[1].toFixed(8)}`;
                            }
                        }
                    } else if (layer && layer instanceof PolygonLayer) {
                        const polygon = (layer as any).getPolygon?.(featureId);
                        if (polygon && polygon.points) {
                            text = polygon.points.map((p: any) => {
                                const lng = p.longitude ?? p[0];
                                const lat = p.latitude ?? p[1];
                                return `${lng.toFixed(8)}, ${lat.toFixed(8)}`;
                            }).join("\n");
                        }
                    } else if (layer && layer instanceof PolylineLayer) {
                        const polyline = (layer as any).getPolyline?.(featureId);
                        if (polyline && polyline.points) {
                            text = polyline.points.map((p: any) => {
                                const lng = p.longitude ?? p[0];
                                const lat = p.latitude ?? p[1];
                                return `${lng.toFixed(8)}, ${lat.toFixed(8)}`;
                            }).join("\n");
                        }
                    } else if (layer && layer instanceof CircleLayer) {
                        const circle = (layer as any).getCircle?.(featureId);
                        if (circle && circle.center) {
                            text = `Center: ${circle.center[0].toFixed(8)}, ${circle.center[1].toFixed(8)}\nRadius: ${circle.radius}m`;
                        }
                    } else {
                        const features = (layer as any)?.getAllFeatures?.() || [];
                        const feature = features.find((f: any) => f.id === featureId);
                        if (feature && feature.longitude !== undefined && feature.latitude !== undefined) {
                            text = `${feature.longitude.toFixed(8)}, ${feature.latitude.toFixed(8)}`;
                        }
                    }
                    if (text) {
                        navigator.clipboard.writeText(text);
                        this.showToast(this.t.coordinatesCopied);
                    } else {
                        this.showToast("No coordinates to copy");
                    }
                },
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
        this.setMeasureStatus(this.t.clickMapToPickPoint);
        this.pointCoordinatePickLayer?.startPick((data: PointCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentPointCoordinates.unshift(data);
            this.showToast(`${this.t.pointPickSuccess}: ${data.longitude.toFixed(6)}, ${data.latitude.toFixed(6)}`);
        });
    }

    public startLineCoordinatePick(): void {
        this.pointCoordinatePickLayer?.stopPick();
        this.polygonCoordinatePickLayer?.stopPick();
        this.setMeasureStatus(this.t.clickMapToDrawLine);
        this.lineCoordinatePickLayer?.startPick((data: LineCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentLineCoordinates.unshift(data);
            this.showToast(`${this.t.linePickSuccess} ${data.points.length} ${this.t.points}`);
        });
    }

    public startPolygonCoordinatePick(): void {
        this.pointCoordinatePickLayer?.stopPick();
        this.lineCoordinatePickLayer?.stopPick();
        this.setMeasureStatus(this.t.clickMapToDrawPolygon);
        this.polygonCoordinatePickLayer?.startPick((data: PolygonCoordinatePickData) => {
            this.setMeasureStatus(null);
            this.currentPolygonCoordinates.unshift(data);
            this.showToast(`${this.t.polygonPickSuccess} ${data.points.length} ${this.t.points}`);
        });
    }

    private showCoordinateList(): void {
        const totalPoints = this.currentPointCoordinates.length;
        const totalLines = this.currentLineCoordinates.length;
        const totalPolygons = this.currentPolygonCoordinates.length;
        if (totalPoints === 0 && totalLines === 0 && totalPolygons === 0) {
            this.showToast(this.t.noCoordinateData);
            return;
        }
        let message = `${this.t.coordinateData}\n\n`;
        if (totalPoints > 0) {
            message += `${this.t.pointData} (${totalPoints}):\n`;
            this.currentPointCoordinates.slice(0, 5).forEach((coord, index) => {
                message += `  ${index + 1}. ${coord.longitude.toFixed(6)}, ${coord.latitude.toFixed(6)}\n`;
            });
            if (totalPoints > 5) message += `  ... ${this.t.pointsCount}${totalPoints}\n`;
            message += "\n";
        }
        if (totalLines > 0) {
            message += `${this.t.lineData} (${totalLines}):\n`;
            this.currentLineCoordinates.slice(0, 5).forEach((line, index) => {
                message += `  ${index + 1}. ${line.points.length} ${this.t.points}, ${this.t.createdTime} ${new Date(line.timestamp).toLocaleTimeString()}\n`;
            });
            if (totalLines > 5) message += `  ... ${this.t.pointsCount}${totalLines}\n`;
            message += "\n";
        }
        if (totalPolygons > 0) {
            message += `${this.t.polygonData} (${totalPolygons}):\n`;
            this.currentPolygonCoordinates.slice(0, 5).forEach((polygon, index) => {
                message += `  ${index + 1}. ${polygon.points.length} ${this.t.points}, ${this.t.createdTime} ${new Date(polygon.timestamp).toLocaleTimeString()}\n`;
            });
            if (totalPolygons > 5) message += `  ... ${this.t.pointsCount}${totalPolygons}\n`;
            message += "\n";
        }
        message += `\n${this.t.copyAllPointCoordinates}`;
        // eslint-disable-next-line no-restricted-globals
        if (confirm(message)) {
            const text = this.currentPointCoordinates.map(c => `${c.longitude.toFixed(6)}, ${c.latitude.toFixed(6)}`).join("\n");
            navigator.clipboard.writeText(text);
            this.showToast(this.t.coordinatesCopied);
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
        this.circleDrawLayer = new CircleDrawLayer("circle-draw", this.t.circleDrawLayer);
        this.circleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.circleDrawLayer);
        this.rectangleDrawLayer = new RectangleDrawLayer("rectangle-draw", this.t.rectangleDrawLayer);
        this.rectangleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.rectangleDrawLayer);
        this.triangleDrawLayer = new TriangleDrawLayer("triangle-draw", this.t.triangleDrawLayer);
        this.triangleDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.triangleDrawLayer);
        this.imageDrawLayer = new ImageDrawLayer("image-draw", this.t.imageDrawLayer);
        this.imageDrawLayer.setView(this.mapManager.getMap());
        this.imageDrawLayer.setTheme(this.theme, this.t);
        this.imageDrawLayer.setZIndex(200);
        this.layerManager.addLayer(this.imageDrawLayer);
        this.pointCoordinatePickLayer = new PointCoordinatePickLayer("point-coordinate-pick", this.t.pointPickLayer, { t: this.t });
        this.pointCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.pointCoordinatePickLayer);
        this.lineCoordinatePickLayer = new LineCoordinatePickLayer("line-coordinate-pick", this.t.linePickLayer, { t: this.t });
        this.lineCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.lineCoordinatePickLayer);
        this.polygonCoordinatePickLayer = new PolygonCoordinatePickLayer("polygon-coordinate-pick", this.t.polygonPickLayer, { t: this.t });
        this.polygonCoordinatePickLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.polygonCoordinatePickLayer);
        this.freehandDrawLayer = new FreehandDrawLayer("freehand-draw", this.t.freehandDrawLayer);
        this.freehandDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.freehandDrawLayer);
        this.ellipseDrawLayer = new EllipseDrawLayer("ellipse-draw", this.t.ellipseDrawLayer);
        this.ellipseDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.ellipseDrawLayer);
        this.markerDrawLayer = new MarkerDrawLayer("marker-draw", this.t.markerDrawLayer);
        this.markerDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.markerDrawLayer);
        this.textDrawLayer = new TextDrawLayer("text-draw", this.t.textDrawLayer);
        this.textDrawLayer.setView(this.mapManager.getMap());
        this.textDrawLayer.setTheme(this.theme, this.t);
        this.layerManager.addLayer(this.textDrawLayer);
        this.arrowDrawLayer = new ArrowDrawLayer("arrow-draw", this.t.arrowDrawLayer);
        this.arrowDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.arrowDrawLayer);
        this.distanceMeasureLayer = new DistanceMeasurementLayer("distance-measurement", this.t.distanceMeasurementLayer);
        this.distanceMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.distanceMeasureLayer);
        this.areaMeasureLayer = new AreaMeasurementLayer("area-measurement", this.t.areaMeasurementLayer);
        this.areaMeasureLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.areaMeasureLayer);
        this.lineDrawLayer = new LineDrawLayer("line-draw", this.t.lineDrawLayer);
        this.lineDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.lineDrawLayer);
        this.bezierDrawLayer = new BezierDrawLayer("bezier-draw", this.t.bezierDrawLayer);
        this.bezierDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.bezierDrawLayer);
        this.sectorDrawLayer = new SectorDrawLayer("sector-draw", this.t.sectorDrawLayer);
        this.sectorDrawLayer.setView(this.mapManager.getMap());
        this.layerManager.addLayer(this.sectorDrawLayer);
        this.imageDrawTool = new ImageDrawTool(this.imageDrawLayer, this.t);
        this.imageDrawTool.setOnDrawComplete(() => this.onDrawingEnd());
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
            this.imageDrawTool!,
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
                msg = this.t.drawingRectangle;
                break;
            case DrawToolType.TRIANGLE:
                msg = this.t.drawingTriangle;
                break;
            case DrawToolType.FREEHAND:
                msg = this.t.drawingFreehand;
                break;
            case DrawToolType.FREEHAND_POLYGON:
                msg = this.t.drawingFreehandPolygon;
                break;
            case DrawToolType.ELLIPSE:
                msg = this.t.drawingEllipse;
                break;
            case DrawToolType.MARKER:
                msg = this.t.addingMarker;
                break;
            case DrawToolType.TEXT:
                msg = this.t.addingText;
                break;
            case DrawToolType.ARROW:
                msg = this.t.drawingArrow;
                break;
            case DrawToolType.LINE:
                msg = this.t.drawingLine;
                break;
            case DrawToolType.BEZIER:
                msg = this.t.drawingBezier;
                break;
            case DrawToolType.SECTOR:
                msg = this.t.drawingSector;
                break;
            default:
                msg = this.t.drawing;
        }
        this.setDrawingStatus(`${msg}${this.t.pressEscToCancel}`);
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
                if (id.startsWith("image_")) return 'image';
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
                case 'image':
                    this.imageDrawTool?.startEdit(id);
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
            if (this.imageDrawLayer?.isInputActive) {
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
            if (this.imageDrawLayer?.isInputActive) {
                return;
            }
            this.hideFloatingToolbar();
            this.hideMeasurementToolbar();
        });
    }

    private initRightClickMenu(): void {
        this.container.addEventListener("contextmenu", (e) => {
            if (this.imageDrawLayer?.isInputActive) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pixel = [x, y];
            const features = this.mapManager.getMap().getFeaturesAtPixel(pixel);
            const pointPick = features?.find((f: any) => f.get("type") === "point_pick");
            if (pointPick && this.pointCoordinatePickLayer) {
                const id = pointPick.get("id");
                const data = this.pointCoordinatePickLayer.getCoordinate(id);
                if (data) {
                    this.selectedPointPickId = id;
                    this.showMeasurementToolbarForFeature({ x, y });
                    return;
                }
            }
            const linePick = features?.find((f: any) => f.get("type") === "line_pick");
            if (linePick && this.lineCoordinatePickLayer) {
                const id = linePick.get("id");
                const data = this.lineCoordinatePickLayer.getLine(id);
                if (data) {
                    this.selectedLinePickId = id;
                    this.showMeasurementToolbarForFeature({ x, y });
                    return;
                }
            }
            const polygonPick = features?.find((f: any) => f.get("type") === "polygon_pick");
            if (polygonPick && this.polygonCoordinatePickLayer) {
                const id = polygonPick.get("id");
                const data = this.polygonCoordinatePickLayer.getPolygon(id);
                if (data) {
                    this.selectedPolygonPickId = id;
                    this.showMeasurementToolbarForFeature({ x, y });
                    return;
                }
            }
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
                if (data) {
                    this.selectedTextId = data.id;
                    this.textDrawTool?.editProperties(data.id);
                    return;
                }
            }
            const image = features?.find((f: any) => f.get("id")?.startsWith("image_"));
            if (image && this.imageDrawLayer) {
                const data = this.imageDrawLayer.getImage(image.get("id"));
                if (data) {
                    this.selectedImageId = data.id;
                    this.imageDrawTool?.editProperties(data.id);
                    return;
                }
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
        if (this.imageDrawLayer?.isInputActive) {
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
        this.imageDrawLayer?.stopEdit();
    }

    private showFloatingToolbarForCircle(pos: { x: number; y: number }, data: CircleDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }
        const targetId = data.id;
        let currentColor = data.fillColor || [255, 0, 0, 1];
        let currentStrokeWidth = data.outlineWidth || 3;
        let currentStrokeStyle = data.outlineStyle || "solid";
        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.circleDrawLayer?.updateCircleStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedCircleId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.circleDrawLayer?.updateCircleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    width,
                    currentStrokeStyle
                );
                this.selectedCircleId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.circleDrawLayer?.updateCircleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    currentStrokeWidth,
                    style
                );
                this.selectedCircleId = targetId;
            },
            onDelete: () => {
                this.circleDrawLayer?.removeCircle(targetId);
                if (this.selectedCircleId === targetId) this.selectedCircleId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedCircleId === targetId) this.selectedCircleId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForRectangle(pos: { x: number; y: number }, data: RectangleDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.fillColor || [0, 0, 255, 1];
        let currentStrokeWidth = data.outlineWidth || 3;
        let currentStrokeStyle: "solid" | "dashed" = "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.rectangleDrawLayer?.updateRectangleStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedRectangleId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.rectangleDrawLayer?.updateRectangleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    width,
                    currentStrokeStyle
                );
                this.selectedRectangleId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.rectangleDrawLayer?.updateRectangleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    currentStrokeWidth,
                    style
                );
                this.selectedRectangleId = targetId;
            },
            onDelete: () => {
                this.rectangleDrawLayer?.removeRectangle(targetId);
                if (this.selectedRectangleId === targetId) this.selectedRectangleId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedRectangleId === targetId) this.selectedRectangleId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForFreehand(pos: { x: number; y: number }, data: FreehandDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentFillColor = data.fillColor || [76, 175, 80, 0.3];
        let currentOutlineColor = data.outlineColor || [76, 175, 80, 1];
        let currentStrokeWidth = data.outlineWidth || 3;
        let currentStrokeStyle = data.outlineStyle || "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentFillColor = [color[0], color[1], color[2], 0.3];
                currentOutlineColor = [color[0], color[1], color[2], 1];
                this.freehandDrawLayer?.updateFreehandStyle(
                    targetId,
                    currentFillColor,
                    currentOutlineColor,
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedFreehandId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.freehandDrawLayer?.updateFreehandStyle(
                    targetId,
                    currentFillColor,
                    currentOutlineColor,
                    width,
                    currentStrokeStyle
                );
                this.selectedFreehandId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.freehandDrawLayer?.updateFreehandStyle(
                    targetId,
                    currentFillColor,
                    currentOutlineColor,
                    currentStrokeWidth,
                    style
                );
                this.selectedFreehandId = targetId;
            },
            onDelete: () => {
                this.freehandDrawLayer?.removeFreehand(targetId);
                if (this.selectedFreehandId === targetId) this.selectedFreehandId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedFreehandId === targetId) this.selectedFreehandId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentOutlineColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForLine(pos: { x: number; y: number }, data: LineDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.color || [255, 193, 7, 1];
        let currentStrokeWidth = data.width || 3;
        let currentStrokeStyle = data.style || "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.lineDrawLayer?.updateLineStyle(targetId, color, currentStrokeWidth, currentStrokeStyle);
                this.selectedLineId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.lineDrawLayer?.updateLineStyle(targetId, currentColor, width, currentStrokeStyle);
                this.selectedLineId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.lineDrawLayer?.updateLineStyle(targetId, currentColor, currentStrokeWidth, style);
                this.selectedLineId = targetId;
            },
            onDelete: () => {
                this.lineDrawLayer?.removeLine(targetId);
                if (this.selectedLineId === targetId) this.selectedLineId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedLineId === targetId) this.selectedLineId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForBezier(pos: { x: number; y: number }, data: BezierDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.color || [156, 39, 176, 1];
        let currentStrokeWidth = data.width || 3;
        let currentStrokeStyle = data.style || "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.bezierDrawLayer?.updateBezierStyle(targetId, color, currentStrokeWidth, currentStrokeStyle);
                this.selectedBezierId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.bezierDrawLayer?.updateBezierStyle(targetId, currentColor, width, currentStrokeStyle);
                this.selectedBezierId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.bezierDrawLayer?.updateBezierStyle(targetId, currentColor, currentStrokeWidth, style);
                this.selectedBezierId = targetId;
            },
            onDelete: () => {
                this.bezierDrawLayer?.removeBezier(targetId);
                if (this.selectedBezierId === targetId) this.selectedBezierId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedBezierId === targetId) this.selectedBezierId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForSector(pos: { x: number; y: number }, data: SectorDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.fillColor || [33, 150, 243, 0.3];
        let currentStrokeWidth = data.outlineWidth || 2;
        let currentStrokeStyle = data.outlineStyle || "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.sectorDrawLayer?.updateSectorStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedSectorId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.sectorDrawLayer?.updateSectorStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    width,
                    currentStrokeStyle
                );
                this.selectedSectorId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.sectorDrawLayer?.updateSectorStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    currentStrokeWidth,
                    style
                );
                this.selectedSectorId = targetId;
            },
            onDelete: () => {
                this.sectorDrawLayer?.removeSector(targetId);
                if (this.selectedSectorId === targetId) this.selectedSectorId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedSectorId === targetId) this.selectedSectorId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: [currentColor[0], currentColor[1], currentColor[2], 1],
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForEllipse(pos: { x: number; y: number }, data: EllipseDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.fillColor || [156, 39, 176, 0.3];
        let currentStrokeWidth = data.outlineWidth || 2;
        let currentStrokeStyle = data.outlineStyle || "solid";

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.ellipseDrawLayer?.updateEllipseStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedEllipseId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.ellipseDrawLayer?.updateEllipseStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    width,
                    currentStrokeStyle
                );
                this.selectedEllipseId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.ellipseDrawLayer?.updateEllipseStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    currentStrokeWidth,
                    style
                );
                this.selectedEllipseId = targetId;
            },
            onDelete: () => {
                this.ellipseDrawLayer?.removeEllipse(targetId);
                if (this.selectedEllipseId === targetId) this.selectedEllipseId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedEllipseId === targetId) this.selectedEllipseId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: [currentColor[0], currentColor[1], currentColor[2], 1],
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showFloatingToolbarForMarker(pos: { x: number; y: number }, data: MarkerDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.color || [255, 87, 34, 1];
        let currentSize = data.size || 10;

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.markerDrawLayer?.updateMarkerStyle(targetId, color, currentSize);
                this.selectedMarkerId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentSize = width;
                this.markerDrawLayer?.updateMarkerStyle(targetId, currentColor, width);
                this.selectedMarkerId = targetId;
            },
            onStrokeStyleChange: () => { },
            onDelete: () => {
                this.markerDrawLayer?.removeMarker(targetId);
                if (this.selectedMarkerId === targetId) this.selectedMarkerId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedMarkerId === targetId) this.selectedMarkerId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentSize,
            currentStrokeStyle: "solid",
            position: pos,
        });
    }

    public startDrawImage(): void {
        if (this.drawingManager.isDrawing()) this.drawingManager.cancelDrawing();
        this.drawingManager.startDrawingImage();
    }

    private showFloatingToolbarForArrow(pos: { x: number; y: number }, data: ArrowDrawData): void {
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }

        const targetId = data.id;
        let currentColor = data.color || [255, 87, 34, 1];
        let currentStrokeWidth = data.width || 3;
        let currentStrokeStyle = data.style || "solid";
        const currentHeadSize = data.headSize || 50;

        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.arrowDrawLayer?.updateArrowStyle(targetId, color, currentStrokeWidth, currentStrokeStyle, currentHeadSize);
                this.selectedArrowId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.arrowDrawLayer?.updateArrowStyle(targetId, currentColor, width, currentStrokeStyle, currentHeadSize);
                this.selectedArrowId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.arrowDrawLayer?.updateArrowStyle(targetId, currentColor, currentStrokeWidth, style, currentHeadSize);
                this.selectedArrowId = targetId;
            },
            onDelete: () => {
                this.arrowDrawLayer?.removeArrow(targetId);
                if (this.selectedArrowId === targetId) this.selectedArrowId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedArrowId === targetId) this.selectedArrowId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
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
        if (this.floatingToolbar) {
            this.floatingToolbar.destroy();
            this.floatingToolbar = null;
        }
        const targetId = data.id;
        let currentColor = data.fillColor || [255, 255, 0, 1];
        let currentStrokeWidth = data.outlineWidth || 3;
        let currentStrokeStyle = data.outlineStyle || "solid";
        this.floatingToolbar = new FloatingToolbar({
            onColorChange: (color) => {
                currentColor = color;
                this.triangleDrawLayer?.updateTriangleStyle(
                    targetId,
                    [color[0], color[1], color[2], 0.3],
                    [color[0], color[1], color[2], 1],
                    currentStrokeWidth,
                    currentStrokeStyle
                );
                this.selectedTriangleId = targetId;
            },
            onStrokeWidthChange: (width) => {
                currentStrokeWidth = width;
                this.triangleDrawLayer?.updateTriangleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    width,
                    currentStrokeStyle
                );
                this.selectedTriangleId = targetId;
            },
            onStrokeStyleChange: (style) => {
                currentStrokeStyle = style;
                this.triangleDrawLayer?.updateTriangleStyle(
                    targetId,
                    [currentColor[0], currentColor[1], currentColor[2], 0.3],
                    [currentColor[0], currentColor[1], currentColor[2], 1],
                    currentStrokeWidth,
                    style
                );
                this.selectedTriangleId = targetId;
            },
            onDelete: () => {
                this.triangleDrawLayer?.removeTriangle(targetId);
                if (this.selectedTriangleId === targetId) this.selectedTriangleId = null;
                this.hideFloatingToolbar();
            },
            onClose: () => {
                if (this.selectedTriangleId === targetId) this.selectedTriangleId = null;
                this.hideFloatingToolbar();
            },
            onPositionChange: (p) => { this.floatingToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            currentColor: currentColor,
            currentStrokeWidth: currentStrokeWidth,
            currentStrokeStyle: currentStrokeStyle,
            position: pos,
        });
    }

    private showMeasurementToolbarForFeature(pos: { x: number; y: number }): void {
        this.measurementToolbarPosition = pos;
        this.showMeasurementToolbar = true;
        if (this.measurementFloatingToolbar) {
            this.measurementFloatingToolbar.destroy();
            this.measurementFloatingToolbar = null;
        }
        this.measurementFloatingToolbar = new MeasurementFloatingToolbar({
            onDelete: () => {
                if (this.selectedMeasurementId) {
                    this.deleteMeasurement(this.selectedMeasurementId);
                    this.selectedMeasurementId = null;
                }
                else if (this.selectedPointPickId) {
                    this.deleteMeasurement(this.selectedPointPickId);
                    this.selectedPointPickId = null;
                }
                else if (this.selectedLinePickId) {
                    this.deleteMeasurement(this.selectedLinePickId);
                    this.selectedLinePickId = null;
                }
                else if (this.selectedPolygonPickId) {
                    this.deleteMeasurement(this.selectedPolygonPickId);
                    this.selectedPolygonPickId = null;
                }
                this.hideMeasurementToolbar();
            },
            onClose: () => this.hideMeasurementToolbar(),
            onPositionChange: (p) => { this.measurementToolbarPosition = p; },
            theme: this.theme,
            t: this.t,
            containerRef: this.container,
            position: pos,
        });
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
        this.selectedImageId = null;
        if (this.floatingToolbar) {
            this.floatingToolbar.setVisible(false);
        }
    }

    private hideMeasurementToolbar(): void {
        this.showMeasurementToolbar = false;
        this.selectedMeasurementId = null;
        this.selectedPointPickId = null;
        this.selectedLinePickId = null;
        this.selectedPolygonPickId = null;
        if (this.measurementFloatingToolbar) {
            this.measurementFloatingToolbar.setVisible(false);
        }
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
    public getBasemap(): BasemapTypeEnum | null {
        return this.mapManager.getCurrentBasemap();
    }
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
        if (id.startsWith("LineCoordinatePick_")) {
            if (this.lineCoordinatePickLayer?.removeLine(id)) {
                this.currentLineCoordinates = this.currentLineCoordinates.filter(c => c.id !== id);
                return true;
            }
        }
        if (id.startsWith("PolygonCoordinatePick_")) {
            if (this.polygonCoordinatePickLayer?.removePolygon(id)) {
                this.currentPolygonCoordinates = this.currentPolygonCoordinates.filter(c => c.id !== id);
                return true;
            }
        }
        if (id.startsWith("coord_")) {
            if (this.pointCoordinatePickLayer?.removeCoordinate(id)) {
                this.currentPointCoordinates = this.currentPointCoordinates.filter(c => c.id !== id);
                return true;
            }
        }
        if (this.distanceMeasureLayer?.deleteMeasurement(id)) {
            return true;
        }
        if (this.areaMeasureLayer?.deleteMeasurement(id)) {
            return true;
        }
        return false;
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
            name: `${this.t.pointData} ${index + 1}`,
            longitude: point.longitude,
            latitude: point.latitude,
            timestamp: point.timestamp
        }));
    }

    private getLineDataForPanel(): LineData[] {
        const lines = this.lineCoordinatePickLayer?.getAllLines() || [];
        return lines.map((line, index) => ({
            id: line.id,
            name: `${this.t.lineData} ${index + 1}`,
            points: line.points,
            timestamp: line.timestamp
        }));
    }

    private getPolygonDataForPanel(): PolygonData[] {
        const polygons = this.polygonCoordinatePickLayer?.getAllPolygons() || [];
        return polygons.map((polygon, index) => ({
            id: polygon.id,
            name: `${this.t.polygonData} ${index + 1}`,
            points: polygon.points,
            timestamp: polygon.timestamp
        }));
    }

    private locateToPoint(longitude: number, latitude: number): void {
        this.setCenter([longitude, latitude]);
        this.setZoom(18);
        this.showToast(`${this.t.locatedToPoint}: ${longitude.toFixed(6)}, ${latitude.toFixed(6)}`);
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
        this.showToast(`${this.t.locatedToLine} ${points.length} ${this.t.points}`);
    }

    public setBasemapByUrl(
        url: string,
    ): void {
        this.mapManager.setBasemapByUrl(url);
        this.uiManager.updateCurrentBasemap(null);
    }

    private locateToPolygon(points: { longitude: number; latitude: number }[]): void {
        this.locateToLine(points);
        this.showToast(`${this.t.locatedToPolygon} ${points.length} ${this.t.points}`);
    }

    public clearAllCoordinatePicks(): void {
        this.pointCoordinatePickLayer?.clearAllCoordinates();
        this.lineCoordinatePickLayer?.clearAllLines();
        this.polygonCoordinatePickLayer?.clearAllPolygons();
        this.currentPointCoordinates = [];
        this.currentLineCoordinates = [];
        this.currentPolygonCoordinates = [];
        this.showToast(this.t.allCoordinatesCleared);
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