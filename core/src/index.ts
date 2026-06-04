export { EarthViewCore } from "./EarthViewCore";
export type { EarthViewOptions } from "./types";

export {
    CoordinateSystemTypeEnum,
    BasemapTypeEnum,
    LayerTypeEnum,
} from "./types";

export type {
    MarkerData,
    PolygonData,
    PolylineData,
    CircleData,
    CircleDrawData,
    HeatmapData,
    ClusterData,
    BarChartData,
    TileLayerConfig,
    PopupMarkerData,
    DistanceMeasurementData,
    AreaMeasurementData,
    MeasurementPoint,
} from "./types";

export {
    toWGS84,
    fromWGS84,
    gcj02ToWgs84,
    bd09ToWgs84,
    isInChina,
} from "./CoordTransform";

export { getTranslation } from "./i18n";
export type { Locale, Translations } from "./i18n";

export {
    BaseLayer,
    LayerManager,
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
    CircleDrawLayer,
    DistanceMeasurementLayer,
    AreaMeasurementLayer,
} from "./layers";