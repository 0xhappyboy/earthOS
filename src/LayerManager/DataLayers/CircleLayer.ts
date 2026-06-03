import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Circle from "@arcgis/core/geometry/Circle";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export interface CircleData {
  id: string;
  center: [number, number];
  radius: number;
  fillColor?: number[];
  outlineColor?: number[];
  outlineWidth?: number;
  title?: string;
}

export interface CircleLayerConfig extends LayerConfig {
  circles?: CircleData[];
  defaultFillColor?: number[];
  defaultOutlineColor?: number[];
  defaultOutlineWidth?: number;
}

/**
 * Circle Layer - For drawing circular areas on the map
 */
export class CircleLayer extends BaseLayer {
  private circles: Map<string, Graphic> = new Map();
  private pendingCircles: CircleData[] = [];
  private defaultFillColor: number[];
  private defaultOutlineColor: number[];
  private defaultOutlineWidth: number;

  constructor(config: CircleLayerConfig) {
    super(config);
    this.defaultFillColor = config.defaultFillColor ?? [0, 255, 0, 0.3];
    this.defaultOutlineColor = config.defaultOutlineColor ?? [0, 255, 0, 1];
    this.defaultOutlineWidth = config.defaultOutlineWidth ?? 2;

    if (config.circles) {
      this.pendingCircles = [...config.circles];
    }
  }

  /**
   * Create ArcGIS GraphicsLayer instance
   */
  public createLayer(): GraphicsLayer {
    super.createLayer();
    this.pendingCircles.forEach((circle) => this.addCircle(circle));
    this.pendingCircles = [];
    return this.graphicsLayer!;
  }

  /**
   * Add a circle
   * Note: ArcGIS expects [latitude, longitude] order internally
   */
  public addCircle(data: CircleData): void {
    if (!this.graphicsLayer) {
      this.pendingCircles.push(data);
      return;
    }

    const center = new Point({
      latitude: data.center[1],
      longitude: data.center[0],
    });
    const circle = new Circle({
      center: center,
      radius: data.radius,
    });
    const symbol = new SimpleFillSymbol({
      color: data.fillColor ?? this.defaultFillColor,
      outline: new SimpleLineSymbol({
        color: data.outlineColor ?? this.defaultOutlineColor,
        width: data.outlineWidth ?? this.defaultOutlineWidth,
      }),
    });
    const graphic = new Graphic({
      geometry: circle,
      symbol: symbol,
      attributes: { id: data.id, title: data.title },
    });
    this.graphicsLayer.add(graphic);
    this.circles.set(data.id, graphic);
  }

  /**
   * Remove a circle
   */
  public removeCircle(id: string): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      this.graphicsLayer.remove(graphic);
      this.circles.delete(id);
    }
  }

  /**
   * Update layer data
   */
  public updateData(data: { circles?: CircleData[] }): void {
    if (data.circles) {
      this.clear();
      this.pendingCircles = [...data.circles];
      if (this.graphicsLayer) {
        this.pendingCircles.forEach((circle) => this.addCircle(circle));
        this.pendingCircles = [];
      }
    }
  }
}