import { CoordinateSystemTypeEnum, BasemapTypeEnum, LayerTypeEnum } from "./enums";

export interface EarthViewOptions {
    container: HTMLElement;
    basemap?: BasemapTypeEnum;
    center?: [number, number];
    zoom?: number;
    coordinateSystem?: CoordinateSystemTypeEnum;
    minZoom?: number;
    maxZoom?: number;
    onLoad?: (core: any) => void;
    onMoveEnd?: (center: [number, number], zoom: number) => void;
    onMapClick?: (event: { longitude: number; latitude: number }) => void;
    onCircleDrawn?: (data: CircleDrawData) => void;
    theme?: "light" | "dark";
    i18n?: "en" | "zh";
    enableDrawing?: boolean;
}
export interface ILayer {
    id: string;
    name: string;
    type: LayerTypeEnum;
    visible: boolean;
    opacity: number;
    zIndex?: number;
    data?: any;
}

export interface MarkerData {
    id: string;
    longitude: number;
    latitude: number;
    color?: number[];
    size?: number;
    title?: string;
    popupContent?: string;
}

export interface PolygonData {
    id: string;
    points: [number, number][];
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
    title?: string;
}

export interface PolylineData {
    id: string;
    points: [number, number][];
    color?: number[];
    width?: number;
    title?: string;
}

export interface CircleData {
    id: string;
    center: [number, number];
    radius: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
    title?: string;
}

export interface CircleDrawData {
    id: string;
    center: [number, number];
    radius: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export interface HeatmapData {
    longitude: number;
    latitude: number;
    value?: number;
}

export interface ClusterData {
    id: string;
    longitude: number;
    latitude: number;
    title?: string;
    popupContent?: string;
}

export interface BarChartData {
    id: string;
    longitude: number;
    latitude: number;
    value: number;
    title?: string;
    color?: number[];
}

export interface TileLayerConfig {
    urlTemplate: string;
    subDomains?: string[];
    attribution?: string;
    minZoom?: number;
    maxZoom?: number;
}

export interface PopupMarkerData {
    id: string;
    longitude: number;
    latitude: number;
    title?: string;
    description?: string;
    coverImage?: string;
    color?: number[];
    size?: number;
}

export interface MeasurementPoint {
    longitude: number;
    latitude: number;
}

export interface DistanceMeasurementData {
    id: string;
    points: MeasurementPoint[];
    distance: number;
    isDrawing?: boolean;
}

export interface AreaMeasurementData {
    id: string;
    points: MeasurementPoint[];
    area: number;
    isDrawing?: boolean;
}

export interface RectangleDrawData {
    id: string;
    center: [number, number];
    width: number;
    height: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export interface TriangleDrawData {
    id: string;
    center: [number, number];
    size: number;
    fillColor?: number[];
    outlineColor?: number[];
    outlineWidth?: number;
}

export interface LayerInfo {
    id: string;
    name: string;
    visible: boolean;
}