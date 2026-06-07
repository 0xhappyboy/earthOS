/**
 * Coordinate system type enumeration
 * Used to identify and convert different geographic coordinate systems
 */
export enum CoordinateSystemTypeEnum {
    /** WGS84 (EPSG:4326) - GPS, Google Maps, OpenStreetMap, LLM default output */
    WGS84 = "wgs84",
    /** GCJ02 (Mars Coordinate System) - Amap, Tencent Maps, all domestic map service providers in China, offset about 300-500 meters from WGS84 */
    GCJ02 = "gcj02",
    /** BD09 (Baidu Coordinate System) - Baidu Maps uses this, secondary encryption offset based on GCJ02 */
    BD09 = "bd09",
    /** Web Mercator (EPSG:3857) - Unit in meters, used for web map tile calculation and projection */
    WEB_MERCATOR = "web_mercator",
}

/**
 * Map basemap type enumeration
 * Defines the background layer styles for ArcGIS maps
 */
export enum BasemapTypeEnum {
    /** Satellite imagery - Real satellite photos, suitable for viewing actual terrain and building distribution */
    SATELLITE = "satellite",
    /** Street vector map - Standard street map, suitable for navigation, urban analysis, and route planning */
    STREETS = "streets",
    /** Topographic map - Includes contour lines and elevation information, suitable for outdoor activities and geological research */
    TOPO = "topo",
    /** Ocean thematic map - Emphasizes ocean geographic features, suitable for marine research and navigation planning */
    OCEANS = "oceans",
    /** Light gray simple map - Light gray background, suitable for data visualization overlay to highlight custom data layers */
    GRAY = "gray",
    /** Dark gray simple map - Dark gray background, suitable for dark theme UI, night mode, or high-contrast data display */
    DARK_GRAY = "dark-gray",
    /** National Geographic style - Classic map style from National Geographic, suitable for elegant map display */
    NATIONAL_GEOGRAPHIC = "national-geographic",
    /** Terrain map - Natural terrain map with hillshade, suitable for geographic and environmental analysis */
    TERRAIN = "terrain",
    /** Hybrid map - Satellite imagery overlaid with roads and labels, combining realistic views with navigation information */
    HYBRID = "hybrid",
    /** Light gray simple map - Very light gray background, suitable for clean and minimalist data visualization */
    LIGHT_GRAY = "light-gray",
    /** Pure imagery - Unlabeled pure satellite imagery, suitable for analysis scenarios requiring raw imagery */
    IMAGERY = "imagery",
    /** Physical terrain map - Shows natural physical features (mountains, rivers, deserts, etc.), suitable for geographic education */
    PHYSICAL = "physical",
}