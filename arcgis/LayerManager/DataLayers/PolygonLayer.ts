import Graphic from "@arcgis/core/Graphic";
import Polygon from "@arcgis/core/geometry/Polygon";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export interface PolygonData {
  id: string;
  points: [number, number][];
  fillColor?: number[];
  outlineColor?: number[];
  outlineWidth?: number;
  title?: string;
}

export interface PolygonLayerConfig extends LayerConfig {
  polygons?: PolygonData[];
  defaultFillColor?: number[];
  defaultOutlineColor?: number[];
  defaultOutlineWidth?: number;
}

/**
 * Polygon Layer - For drawing polygon areas on the map
 */
export class PolygonLayer extends BaseLayer {
  private polygons: Map<string, Graphic> = new Map();
  private pendingPolygons: PolygonData[] = [];
  private defaultFillColor: number[];
  private defaultOutlineColor: number[];
  private defaultOutlineWidth: number;

  constructor(config: PolygonLayerConfig) {
    super(config);
    this.defaultFillColor = config.defaultFillColor ?? [255, 0, 0, 0.3];
    this.defaultOutlineColor = config.defaultOutlineColor ?? [255, 0, 0, 1];
    this.defaultOutlineWidth = config.defaultOutlineWidth ?? 2;

    if (config.polygons) {
      this.pendingPolygons = [...config.polygons];
    }
  }

  /**
   * Create ArcGIS GraphicsLayer instance
   */
  public createLayer(): GraphicsLayer {
    super.createLayer();
    this.pendingPolygons.forEach((polygon) => this.addPolygon(polygon));
    this.pendingPolygons = [];
    return this.graphicsLayer!;
  }

  /**
   * Add a polygon
   * Note: ArcGIS expects [latitude, longitude] order internally
   */
  public addPolygon(data: PolygonData): void {
    if (!this.graphicsLayer) {
      this.pendingPolygons.push(data);
      return;
    }

    const rings = [data.points.map(([lng, lat]) => [lat, lng])];
    const polygon = new Polygon({ rings });
    const symbol = new SimpleFillSymbol({
      color: data.fillColor ?? this.defaultFillColor,
      outline: new SimpleLineSymbol({
        color: data.outlineColor ?? this.defaultOutlineColor,
        width: data.outlineWidth ?? this.defaultOutlineWidth,
      }),
    });
    const graphic = new Graphic({
      geometry: polygon,
      symbol: symbol,
      attributes: { id: data.id, title: data.title },
    });
    this.graphicsLayer.add(graphic);
    this.polygons.set(data.id, graphic);
  }

  /**
   * Remove a polygon
   */
  public removePolygon(id: string): void {
    const graphic = this.polygons.get(id);
    if (graphic && this.graphicsLayer) {
      this.graphicsLayer.remove(graphic);
      this.polygons.delete(id);
    }
  }

  /**
   * Update layer data
   */
  public updateData(data: { polygons?: PolygonData[] }): void {
    if (data.polygons) {
      this.clear();
      this.pendingPolygons = [...data.polygons];
      if (this.graphicsLayer) {
        this.pendingPolygons.forEach((polygon) => this.addPolygon(polygon));
        this.pendingPolygons = [];
      }
    }
  }
}