import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { LayerConfig } from "../types";
import { BaseLayer } from "../BaseLayer";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export interface MarkerData {
  id: string;
  longitude: number;
  latitude: number;
  color?: number[];
  size?: number;
  title?: string;
  popupContent?: string;
}

export interface MarkerLayerConfig extends LayerConfig {
  markers?: MarkerData[];
  defaultColor?: number[];
  defaultSize?: number;
}

/**
 * Marker Layer - For displaying marker points on the map
 */
export class MarkerLayer extends BaseLayer {
  private markers: Map<string, Graphic> = new Map<string, Graphic>();
  private pendingMarkers: MarkerData[] = [];
  private defaultColor: number[];
  private defaultSize: number;

  constructor(config: MarkerLayerConfig) {
    super(config);
    this.defaultColor = config.defaultColor ?? [255, 0, 0, 0.8];
    this.defaultSize = config.defaultSize ?? 12;

    if (config.markers) {
      this.pendingMarkers = [...config.markers];
    }
  }

  /**
   * Create ArcGIS GraphicsLayer instance
   */
  public createLayer(): GraphicsLayer {
    super.createLayer();
    this.pendingMarkers.forEach((marker) => this.addMarker(marker));
    this.pendingMarkers = [];
    return this.graphicsLayer!;
  }

  /**
   * Add a marker point
   */
  public addMarker(data: MarkerData): void {
    if (!this.graphicsLayer) {
      this.pendingMarkers.push(data);
      return;
    }

    const point = new Point({ longitude: data.longitude, latitude: data.latitude });
    const symbol = new SimpleMarkerSymbol({
      color: data.color ?? this.defaultColor,
      size: data.size ?? this.defaultSize,
      outline: { color: [255, 255, 255], width: 2 },
    });
    const graphic = new Graphic({
      geometry: point,
      symbol: symbol,
      attributes: { id: data.id, title: data.title, popupContent: data.popupContent },
    });
    this.graphicsLayer.add(graphic);
    this.markers.set(data.id, graphic);
  }

  /**
   * Remove a marker point
   */
  public removeMarker(id: string): void {
    const graphic = this.markers.get(id);
    if (graphic && this.graphicsLayer) {
      this.graphicsLayer.remove(graphic);
      this.markers.delete(id);
    }
  }

  /**
   * Update marker position
   */
  public updateMarkerPosition(id: string, longitude: number, latitude: number): void {
    const graphic = this.markers.get(id);
    if (graphic && this.graphicsLayer) {
      graphic.geometry = new Point({ longitude, latitude });
    }
  }

  /**
   * Get all markers
   */
  public getAllMarkers(): MarkerData[] {
    const result: MarkerData[] = [];
    Array.from(this.markers.entries()).forEach(([id, graphic]) => {
      const geometry = graphic.geometry as Point;
      const longitude = geometry.longitude;
      const latitude = geometry.latitude;

      if (longitude !== null && longitude !== undefined &&
        latitude !== null && latitude !== undefined) {
        result.push({
          id,
          longitude,
          latitude,
        });
      }
    });
    return result;
  }

  /**
   * Update layer data
   */
  public updateData(data: { markers?: MarkerData[] }): void {
    if (data.markers) {
      this.clear();
      this.pendingMarkers = [...data.markers];
      if (this.graphicsLayer) {
        this.pendingMarkers.forEach((marker) => this.addMarker(marker));
        this.pendingMarkers = [];
      }
    }
  }
}