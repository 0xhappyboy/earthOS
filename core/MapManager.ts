import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat } from "ol/proj";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "./types";
import { toWGS84 } from "./CoordTransform";
import { defaults as defaultInteractions } from "ol/interaction";

const BASEMAP_CONFIG: Record<BasemapTypeEnum, { url: string; attribution?: string }> = {
    [BasemapTypeEnum.SATELLITE]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.STREETS]: {
        url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "OpenStreetMap",
    },
    [BasemapTypeEnum.TOPO]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.OCEANS]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.GRAY]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.DARK_GRAY]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.NATIONAL_GEOGRAPHIC]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.TERRAIN]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.HYBRID]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.LIGHT_GRAY]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.IMAGERY]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.PHYSICAL]: {
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Esri",
    },
    [BasemapTypeEnum.AMAP_STREETS]: {
        url: "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        attribution: "高德地图",
    },
    [BasemapTypeEnum.AMAP_SATELLITE]: {
        url: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
        attribution: "高德地图",
    },
    [BasemapTypeEnum.GOOGLE_STREETS]: {
        url: "http://www.google.cn/maps/vt?lyrs=m&x={x}&y={y}&z={z}",
        attribution: "Google",
    },
    [BasemapTypeEnum.GOOGLE_SATELLITE]: {
        url: "http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}",
        attribution: "Google",
    },
};

export class MapManager {
    private map: Map;
    private view: View;
    private currentBasemap: BasemapTypeEnum;
    private basemapLayer: TileLayer<XYZ>;

    constructor(
        container: HTMLElement,
        basemap: BasemapTypeEnum,
        center: [number, number],
        zoom: number,
        coordinateSystem: CoordinateSystemTypeEnum
    ) {
        let actualCenter = center;
        if (coordinateSystem !== CoordinateSystemTypeEnum.WGS84) {
            actualCenter = toWGS84(center[0], center[1], coordinateSystem);
        }

        this.currentBasemap = basemap;
        this.basemapLayer = this.createBasemapLayer(basemap);

        this.view = new View({
            center: fromLonLat(actualCenter),
            zoom: zoom,
            minZoom: 1,
            maxZoom: 19,
        });

        this.map = new Map({
            target: container,
            layers: [this.basemapLayer],
            view: this.view,
            controls: [],
            interactions: defaultInteractions({
                doubleClickZoom: false,
            }),
        });
    }

    private createBasemapLayer(basemap: BasemapTypeEnum): TileLayer<XYZ> {
        const config = BASEMAP_CONFIG[basemap];
        let source: XYZ;

        if (basemap === BasemapTypeEnum.STREETS) {
            source = new OSM() as unknown as XYZ;
        } else {
            let url = config.url;
            source = new XYZ({
                url: url,
                attributions: config.attribution,
            });
        }

        return new TileLayer({ source });
    }

    public getMap(): Map {
        return this.map;
    }

    public getView(): View {
        return this.view;
    }

    public getCenter(): [number, number] {
        const center = toLonLat(this.view.getCenter() || [0, 0]);
        return [center[0], center[1]];
    }

    public getZoom(): number {
        return this.view.getZoom() || 0;
    }

    public setCenter(center: [number, number], coordinateSystem?: CoordinateSystemTypeEnum): void {
        let actualCenter = center;
        if (coordinateSystem && coordinateSystem !== CoordinateSystemTypeEnum.WGS84) {
            actualCenter = toWGS84(center[0], center[1], coordinateSystem);
        }
        this.view.setCenter(fromLonLat(actualCenter));
    }

    public setZoom(zoom: number): void {
        this.view.setZoom(zoom);
    }

    public setBasemap(basemap: BasemapTypeEnum): void {
        this.map.removeLayer(this.basemapLayer);
        this.basemapLayer = this.createBasemapLayer(basemap);
        this.map.addLayer(this.basemapLayer);
        this.currentBasemap = basemap;
    }

    public getCurrentBasemap(): BasemapTypeEnum {
        return this.currentBasemap;
    }

    public setRotation(rotation: number): void {
        this.view.setRotation(rotation);
    }

    public destroy(): void {
        this.map.setTarget(undefined);
        this.map.dispose();
    }
}