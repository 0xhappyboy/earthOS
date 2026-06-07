import Graphic from "@arcgis/core/Graphic";
import Polyline from "@arcgis/core/geometry/Polyline";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export interface PolylineData {
  id: string;
  points: [number, number][];
  color?: number[];
  width?: number;
  title?: string;
}

export interface PolylineLayerConfig extends LayerConfig {
  polylines?: PolylineData[];
  defaultColor?: number[];
  defaultWidth?: number;
}

/**
 * Polyline/Track Layer - For drawing lines and tracks on the map
 */
export class PolylineLayer extends BaseLayer {
  private polylines: Map<string, Graphic> = new Map();
  private pendingPolylines: PolylineData[] = [];
  private defaultColor: number[];
  private defaultWidth: number;

  constructor(config: PolylineLayerConfig) {
    super(config);
    this.defaultColor = config.defaultColor ?? [0, 0, 255, 1];
    this.defaultWidth = config.defaultWidth ?? 3;

    if (config.polylines) {
      this.pendingPolylines = [...config.polylines];
    }
  }

  /**
   * Create ArcGIS GraphicsLayer instance
   */
  public createLayer(): GraphicsLayer {
    super.createLayer();
    this.pendingPolylines.forEach((polyline) => this.addPolyline(polyline));
    this.pendingPolylines = [];
    return this.graphicsLayer!;
  }

  /**
   * Add a polyline/track
   * Note: ArcGIS expects [latitude, longitude] order internally
   */
  public addPolyline(data: PolylineData): void {
    if (!this.graphicsLayer) {
      this.pendingPolylines.push(data);
      return;
    }

    const paths = [data.points.map(([lng, lat]) => [lat, lng])];
    const polyline = new Polyline({ paths });
    const symbol = new SimpleLineSymbol({
      color: data.color ?? this.defaultColor,
      width: data.width ?? this.defaultWidth,
    });
    const graphic = new Graphic({
      geometry: polyline,
      symbol: symbol,
      attributes: { id: data.id, title: data.title },
    });
    this.graphicsLayer.add(graphic);
    this.polylines.set(data.id, graphic);
  }

  /**
   * Remove a polyline
   */
  public removePolyline(id: string): void {
    const graphic = this.polylines.get(id);
    if (graphic && this.graphicsLayer) {
      this.graphicsLayer.remove(graphic);
      this.polylines.delete(id);
    }
  }

  /**
   * Update layer data
   */
  public updateData(data: { polylines?: PolylineData[] }): void {
    if (data.polylines) {
      this.clear();
      this.pendingPolylines = [...data.polylines];
      if (this.graphicsLayer) {
        this.pendingPolylines.forEach((polyline) => this.addPolyline(polyline));
        this.pendingPolylines = [];
      }
    }
  }
}