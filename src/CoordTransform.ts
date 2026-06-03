import { CoordinateSystemTypeEnum } from "./types";

const PI = Math.PI;
const a = 6378245.0; // Semi-major axis of the Earth's ellipsoid
const ee = 0.00669342162296594323; // Square of the first eccentricity

/**
 * Check if the coordinate is outside of China
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns True if the coordinate is outside Chinese territory
 */
function outOfChina(lng: number, lat: number): boolean {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

/**
 * Latitude transformation for GCJ02 calculation
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns Transformed latitude value
 */
function transformLat(lng: number, lat: number): number {
    let ret =
        -100.0 +
        2.0 * lng +
        3.0 * lat +
        0.2 * lat * lat +
        0.1 * lng * lat +
        0.2 * Math.sqrt(Math.abs(lng));
    ret +=
        (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
        (2.0 / 3.0);
    ret +=
        (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) *
        (2.0 / 3.0);
    ret +=
        (160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) *
        (2.0 / 3.0);
    return ret;
}

/**
 * Longitude transformation for GCJ02 calculation
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns Transformed longitude value
 */
function transformLng(lng: number, lat: number): number {
    let ret =
        300.0 +
        lng +
        2.0 * lat +
        0.1 * lng * lng +
        0.1 * lng * lat +
        0.1 * Math.sqrt(Math.abs(lng));
    ret +=
        (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) *
        (2.0 / 3.0);
    ret +=
        (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) *
        (2.0 / 3.0);
    ret +=
        (150.0 * Math.sin((lng / 12.0) * PI) +
            300.0 * Math.sin((lng * PI) / 30.0)) *
        (2.0 / 3.0);
    return ret;
}

/**
 * Convert GCJ02 (Mars Coordinate System) to WGS84
 * GCJ02 is used by Amap, Tencent Maps, and other Chinese map providers
 * @param lng - Longitude in GCJ02
 * @param lat - Latitude in GCJ02
 * @returns [longitude, latitude] in WGS84
 */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
    if (outOfChina(lng, lat)) {
        return [lng, lat];
    }

    let dlat = transformLat(lng - 105.0, lat - 35.0);
    let dlng = transformLng(lng - 105.0, lat - 35.0);
    const radlat = (lat / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    return [lng - dlng, lat - dlat];
}

/**
 * Convert WGS84 to GCJ02 (Mars Coordinate System)
 * @param lng - Longitude in WGS84
 * @param lat - Latitude in WGS84
 * @returns [longitude, latitude] in GCJ02
 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
    if (outOfChina(lng, lat)) {
        return [lng, lat];
    }

    let dlat = transformLat(lng - 105.0, lat - 35.0);
    let dlng = transformLng(lng - 105.0, lat - 35.0);
    const radlat = (lat / 180.0) * PI;
    let magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    const sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / (((a * (1 - ee)) / (magic * sqrtmagic)) * PI);
    dlng = (dlng * 180.0) / ((a / sqrtmagic) * Math.cos(radlat) * PI);
    return [lng + dlng, lat + dlat];
}

/**
 * Convert GCJ02 to BD09 (Baidu Coordinate System)
 * @param lng - Longitude in GCJ02
 * @param lat - Latitude in GCJ02
 * @returns [longitude, latitude] in BD09
 */
export function gcj02ToBd09(lng: number, lat: number): [number, number] {
    const x = lng;
    const y = lat;
    const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * PI);
    const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * PI);
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    return [bdLng, bdLat];
}

/**
 * Convert BD09 (Baidu Coordinate System) to GCJ02
 * @param lng - Longitude in BD09
 * @param lat - Latitude in BD09
 * @returns [longitude, latitude] in GCJ02
 */
export function bd09ToGcj02(lng: number, lat: number): [number, number] {
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * PI);
    const gcjLng = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    return [gcjLng, gcjLat];
}

/**
 * Convert BD09 (Baidu Coordinate System) directly to WGS84
 * @param lng - Longitude in BD09
 * @param lat - Latitude in BD09
 * @returns [longitude, latitude] in WGS84
 */
export function bd09ToWgs84(lng: number, lat: number): [number, number] {
    const [gcjLng, gcjLat] = bd09ToGcj02(lng, lat);
    return gcj02ToWgs84(gcjLng, gcjLat);
}

/**
 * Convert Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
 * Web Mercator uses meters as units, commonly used for web map tiles
 * @param x - X coordinate in Web Mercator (meters)
 * @param y - Y coordinate in Web Mercator (meters)
 * @returns [longitude, latitude] in WGS84
 */
export function webMercatorToWgs84(x: number, y: number): [number, number] {
    const lng = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = (Math.atan(Math.exp((lat * PI) / 180)) * 360) / PI - 90;
    return [lng, lat];
}

/**
 * Convert WGS84 to Web Mercator (EPSG:3857)
 * @param lng - Longitude in WGS84
 * @param lat - Latitude in WGS84
 * @returns [x, y] coordinates in Web Mercator (meters)
 */
export function wgs84ToWebMercator(lng: number, lat: number): [number, number] {
    const x = (lng * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + lat) * PI) / 360)) / (PI / 180);
    y = (y * 20037508.34) / 180;
    return [x, y];
}

/**
 * Universal conversion function: Convert coordinates from any system to WGS84
 * @param lng - Longitude
 * @param lat - Latitude
 * @param fromSystem - Source coordinate system enum
 * @returns [longitude, latitude] in WGS84
 */
export function toWGS84(
    lng: number,
    lat: number,
    fromSystem: CoordinateSystemTypeEnum
): [number, number] {
    switch (fromSystem) {
        case CoordinateSystemTypeEnum.WGS84:
            return [lng, lat];

        case CoordinateSystemTypeEnum.GCJ02:
            return gcj02ToWgs84(lng, lat);

        case CoordinateSystemTypeEnum.BD09:
            return bd09ToWgs84(lng, lat);

        case CoordinateSystemTypeEnum.WEB_MERCATOR:
            return webMercatorToWgs84(lng, lat);

        default:
            console.warn(
                `Unknown coordinate system: ${fromSystem}, returning original`
            );
            return [lng, lat];
    }
}

/**
 * Universal conversion function: Convert from WGS84 to any target coordinate system
 * @param lng - Longitude in WGS84
 * @param lat - Latitude in WGS84
 * @param toSystem - Target coordinate system enum
 * @returns [longitude, latitude] in the target coordinate system
 */
export function fromWGS84(
    lng: number,
    lat: number,
    toSystem: CoordinateSystemTypeEnum
): [number, number] {
    switch (toSystem) {
        case CoordinateSystemTypeEnum.WGS84:
            return [lng, lat];

        case CoordinateSystemTypeEnum.GCJ02:
            return wgs84ToGcj02(lng, lat);

        case CoordinateSystemTypeEnum.BD09: {
            const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat);
            return gcj02ToBd09(gcjLng, gcjLat);
        }

        case CoordinateSystemTypeEnum.WEB_MERCATOR:
            return wgs84ToWebMercator(lng, lat);

        default:
            console.warn(`Unknown coordinate system: ${toSystem}, returning original`);
            return [lng, lat];
    }
}

/**
 * Check if the coordinate is within Chinese territory
 * Used to determine whether GCJ02 transformation is needed
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns True if the coordinate is inside China
 */
export function isInChina(lng: number, lat: number): boolean {
    return !outOfChina(lng, lat);
}