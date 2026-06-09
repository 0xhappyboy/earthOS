import { LayerTypeEnum } from "./enums";

export interface ILayer {
    id: string;
    name: string;
    type: LayerTypeEnum;
    visible: boolean;
    opacity: number;
    zIndex?: number;
    data?: any;
}

// ==================== Market Layer Data Start ====================
export interface MarkerLayerData {
    id: string;
    name?: string;
    longitude: number;
    latitude: number;
    bubbleBoxTitle?: string;
    bubbleBoxDescription?: string;
    bubbleBoxCoverImage?: string;
    pointColor?: string;
    pointType?: MarkerLayerPointTypeEnum,
    pointSize?: number;
    pointText?: string,
    pointAnimationType?: MarkerLayerAnimationTypeEnum,
    pointHtml?: string,
    pointHtmlWidth?: number,
    pointHtmlHeight?: number,
    onClick?: (data: MarkerLayerData, event: any) => void;
    onContextMenu?: (data: MarkerLayerData, event: any) => void;
    onHover?: (data: MarkerLayerData, event: any) => void;
    timestamp?: number;
}

export enum MarkerLayerPointTypeEnum {
    SQUARE = "square",
    CIRCLE = "circle",
    TRIANGLE = "triangle",
    PENTAGRAM = "pentagram",
    TEXT = "text",
    DIAMOND = "diamond",
    CROSS = "cross",
    X_SHAPE = "x_shape",
    HEXAGON = "hexagon",
    FLAG = "flag",
    HOUSE = "house",
    ARROW = "arrow",
    TENT = "tent",                    // Tent - Camp, temporary post
    BUNKER = "bunker",                // Bunker - Fortification, fire point
    LANDMINE = "landmine",            // Landmine - Minefield, explosives
    TANK = "tank",                    // Tank - Armored unit, heavy equipment
    PLANE = "plane",                  // Plane - Airport, airstrip, aviation facility
    SHIP = "ship",                    // Ship - Port, landing point, naval facility
    RADAR = "radar",                  // Radar - Monitoring station, early warning point
    MISSILE = "missile",              // Missile - Missile site, launch point
    FIRE_HYDRANT = "fire_hydrant",    // Fire Hydrant - Fire facility, fire point
    FIRST_AID = "first_aid",          // First Aid - Medical supply point
    WATER_TOWER = "water_tower",      // Water Tower - Water source, reservoir
    GENERATOR = "generator",          // Generator - Power facility, backup power
    MEGAPHONE = "megaphone",          // Megaphone - Broadcast point, alert point
    STREET_LAMP = "street_lamp",      // Street Lamp - Lighting facility, emergency light
    PARKING = "parking",              // Parking - Parking lot, parking area
    GAS_STATION = "gas_station",      // Gas Station - Gas station, charging station
    TUNNEL = "tunnel",                // Tunnel - Tunnel entrance, culvert
    BRIDGE = "bridge",                // Bridge - Bridge, elevated road
    TRAFFIC_LIGHT = "traffic_light",  // Traffic Light - Traffic signal point
    CAMERA = "camera",                // Camera - Monitoring point, speed camera
    TOILET = "toilet",                // Toilet - Public restroom
    TRASH_CAN = "trash_can",          // Trash Can - Waste collection point
    BUS_STOP = "bus_stop",            // Bus Stop - Bus station
    SUBWAY = "subway",                // Subway - Subway entrance
    SCHOOL = "school",                // School - School, educational institution
    HOSPITAL = "hospital",            // Hospital - Hospital, clinic (distinct from cross)
    TREE = "tree",                    // Tree - Forest, green area
    WATER_SOURCE = "water_source",    // Water Source - River, lake, well
    MOUNTAIN = "mountain",            // Mountain - Peak, high point
    MINE = "mine",                    // Mine - Mining point, quarry
    HEART = "heart",                  // Heart - Important attention point, donation spot
    STAR = "star",                    // Star - Commendation point, excellent spot
    CLOUD = "cloud",                  // Cloud - Cloud service node, weather observation point
    GEAR = "gear",                    // Gear - Industrial facility, factory
    LIGHTNING = "lightning",          // Lightning - Power facility, hazard warning
    PIN = "pin",                      // Pin - General marker point, favorite point
    COMPASS = "compass",              // Compass - Direction reference, navigation point
    ANCHOR = "anchor",                // Anchor - Harbor, dock
}

export enum MarkerLayerAnimationTypeEnum {
    PULSE = "pulse",
    FLASHING = "flashing",
    BREATHING = "breathing",
    LIGHT = "light"
}

// ==================== Market Layer Data End ====================


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
    id: string;
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