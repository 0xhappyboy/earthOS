/**
 * Coordinate system type enumeration
 */
export enum CoordinateSystemTypeEnum {
    WGS84 = "wgs84",
    GCJ02 = "gcj02",
    BD09 = "bd09",
    WEB_MERCATOR = "web_mercator",
}

/**
 * Map basemap type enumeration
 */
export enum BasemapTypeEnum {
    SATELLITE = "satellite",
    STREETS = "streets",
    TOPO = "topo",
    OCEANS = "oceans",
    GRAY = "gray",
    DARK_GRAY = "dark-gray",
    NATIONAL_GEOGRAPHIC = "national-geographic",
    TERRAIN = "terrain",
    HYBRID = "hybrid",
    LIGHT_GRAY = "light-gray",
    IMAGERY = "imagery",
    PHYSICAL = "physical",
    AMAP_STREETS = "amap-streets",
    AMAP_SATELLITE = "amap-satellite",
    GOOGLE_STREETS = "google-streets",
    GOOGLE_SATELLITE = "google-satellite",
    CUSTOMIZE = "customize",
}

/**
 * Layer type enumeration
 */
export enum LayerTypeEnum {
    MARKER = "marker",
    POLYGON = "polygon",
    POLYLINE = "polyline",
    CIRCLE = "circle",
    HEATMAP = "heatmap",
    CLUSTER = "cluster",
    GEOJSON = "geojson",
    TILE = "tile",
    BARCHART = "barchart",
    CIRCLE_DRAW = "circle-draw",
    RECTANGLE_DRAW = "rectangle-draw",
    TRIANGLE_DRAW = "triangle-draw",
    DISTANCE_MEASUREMENT = "distance-measurement",
    AREA_MEASUREMENT = "area-measurement",
    FREEHAND_DRAW = "freehand-draw",
    ELLIPSE_DRAW = "ellipse-draw",
    MARKER_DRAW = "marker-draw",
    TEXT_DRAW = "text-draw",
    IMAGE_DRAW = "image-draw",
    ARROW_DRAW = "arrow-draw",
    LINE_DRAW = "line-draw",
    BEZIER_DRAW = "bezier-draw",
    SECTOR_DRAW = "sector-draw",
    POINT_COORDINATE_PICK = "point-coordinate-pick",
    LINE_COORDINATE_PICK = "line-coordinate-pick",
    POLYGON_COORDINATE_PICK = "polygon-coordinate-pick",
}


// layer classification
export enum LayerClassification {
    DATA_LAYER = "data_layer",
    DRAW_LAYER = "draw_layer",
    TOOL_LAYER = "tool_layer",
}