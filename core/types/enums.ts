/**
 * Coordinate system type enumeration
 */
export enum CoordinateSystemTypeEnum {
    /** WGS84 - GPS, Google Maps, OpenStreetMap */
    WGS84 = "wgs84",
    /** GCJ02 - Mars Coordinate System (Amap, Tencent Maps) */
    GCJ02 = "gcj02",
    /** BD09 - Baidu Coordinate System */
    BD09 = "bd09",
    /** Web Mercator (EPSG:3857) */
    WEB_MERCATOR = "web_mercator",
}

/**
 * Map basemap type enumeration
 */
export enum BasemapTypeEnum {
    /** Satellite imagery */
    SATELLITE = "satellite",
    /** Street vector map */
    STREETS = "streets",
    /** Topographic map with contour lines */
    TOPO = "topo",
    /** Ocean thematic map */
    OCEANS = "oceans",
    /** Light gray simple map */
    GRAY = "gray",
    /** Dark gray simple map */
    DARK_GRAY = "dark-gray",
    /** National Geographic style */
    NATIONAL_GEOGRAPHIC = "national-geographic",
    /** Terrain map with hillshade */
    TERRAIN = "terrain",
    /** Hybrid map (satellite + roads) */
    HYBRID = "hybrid",
    /** Light gray simple map */
    LIGHT_GRAY = "light-gray",
    /** Pure imagery without labels */
    IMAGERY = "imagery",
    /** Physical terrain map */
    PHYSICAL = "physical",
}

/**
 * Layer type enumeration
 */
export enum LayerTypeEnum {
    // data layer
    MARKER = "marker",
    POLYGON = "polygon",
    POLYLINE = "polyline",
    CIRCLE = "circle",
    HEATMAP = "heatmap",
    CLUSTER = "cluster",
    GEOJSON = "geojson",
    TILE = "tile",
    BARCHART = "barchart",
    // draw layer
    CIRCLE_DRAW = "circle-draw",
    // tool layer
    DISTANCE_MEASUREMENT = "distance-measurement",
    AREA_MEASUREMENT = "area-measurement",
}