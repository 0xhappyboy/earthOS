import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import Circle from "@arcgis/core/geometry/Circle";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import MapView from "@arcgis/core/views/MapView";
import { BaseLayer } from "../BaseLayer";
import { LayerConfig } from "../types";

export interface CircleDrawData {
  id: string;
  center: [number, number];
  radius: number;
  fillColor?: number[];
  outlineColor?: number[];
  outlineWidth?: number;
}

export interface CircleDrawLayerConfig extends LayerConfig {
  defaultFillColor?: number[];
  defaultOutlineColor?: number[];
  defaultOutlineWidth?: number;
  circles?: CircleDrawData[];
}

/**
 * Circle Draw Layer - Dedicated layer for drawing circles interactively
 * Usage: First click sets center, second click sets radius
 * Supports: Edit existing circles (drag to move, drag edge to resize)
 */
export class CircleDrawLayer extends BaseLayer {
  private sketchViewModel: SketchViewModel | null = null;
  private view: MapView | null = null;
  private circles: Map<string, Graphic> = new Map();
  private pendingCircles: CircleDrawData[] = [];
  private defaultFillColor: number[];
  private defaultOutlineColor: number[];
  private defaultOutlineWidth: number;
  private onDrawCompleteCallback: ((data: CircleDrawData) => void) | null = null;
  private onEditCompleteCallback: ((data: CircleDrawData) => void) | null = null;
  private editingGraphic: Graphic | null = null;
  private isEditMode: boolean = false;

  constructor(config: CircleDrawLayerConfig) {
    super(config);
    this.defaultFillColor = config.defaultFillColor ?? [255, 0, 0, 0.4];
    this.defaultOutlineColor = config.defaultOutlineColor ?? [255, 0, 0, 1];
    this.defaultOutlineWidth = config.defaultOutlineWidth ?? 3;

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
   * Set map view reference (required for drawing)
   */
  public setView(view: MapView): void {
    this.view = view;
    this.initSketchViewModel();
  }

  /**
   * Initialize SketchViewModel for circle drawing and editing
   */
  private initSketchViewModel(): void {
    if (!this.view || !this.graphicsLayer) {
      console.error("View or GraphicsLayer not ready");
      return;
    }
    if (this.sketchViewModel) {
      this.sketchViewModel.destroy();
      this.sketchViewModel = null;
    }
    this.sketchViewModel = new SketchViewModel({
      view: this.view,
      layer: this.graphicsLayer,
      polygonSymbol: new SimpleFillSymbol({
        color: this.defaultFillColor,
        outline: new SimpleLineSymbol({
          color: this.defaultOutlineColor,
          width: this.defaultOutlineWidth,
        }),
      }),
    });
    this.sketchViewModel.on("create", (event: any) => {
      if (event.state === "complete") {
        const graphic = event.graphic;
        if (graphic && graphic.geometry) {
          const geometry = graphic.geometry;
          const id = `circle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          graphic.attributes = { id, createdAt: Date.now() };
          this.circles.set(id, graphic);

          let centerLng = 0, centerLat = 0, radius = 0;

          if (geometry.type === "circle") {
            const circleGeom = geometry as Circle;
            const center = circleGeom.center;
            if (center) {
              centerLng = center.longitude ?? 0;
              centerLat = center.latitude ?? 0;
              radius = circleGeom.radius ?? 0;
            }
          } else if (geometry.type === "polygon") {
            const extent = geometry.extent;
            if (extent && extent.center) {
              centerLng = extent.center.longitude ?? 0;
              centerLat = extent.center.latitude ?? 0;
              radius = Math.max(extent.width, extent.height) / 2;
            }
          }

          if (this.onDrawCompleteCallback) {
            this.onDrawCompleteCallback({
              id,
              center: [centerLng, centerLat],
              radius: radius,
              fillColor: this.defaultFillColor,
              outlineColor: this.defaultOutlineColor,
              outlineWidth: this.defaultOutlineWidth,
            });
          }
        }
      }
    });
    this.sketchViewModel.on("update", (event: any) => {
      if (event.state === "complete" && this.editingGraphic) {
        const graphic = event.graphics[0];
        if (graphic && graphic.geometry) {
          const geometry = graphic.geometry;
          const id = this.editingGraphic.attributes.id;

          let centerLng = 0, centerLat = 0, radius = 0;

          if (geometry.type === "circle") {
            const circleGeom = geometry as Circle;
            const center = circleGeom.center;
            if (center) {
              centerLng = center.longitude ?? 0;
              centerLat = center.latitude ?? 0;
              radius = circleGeom.radius ?? 0;
            }
          } else if (geometry.type === "polygon") {
            const extent = geometry.extent;
            if (extent && extent.center) {
              centerLng = extent.center.longitude ?? 0;
              centerLat = extent.center.latitude ?? 0;
              radius = Math.max(extent.width, extent.height) / 2;
            }
          }
          this.circles.set(id, graphic);
          if (this.onEditCompleteCallback) {
            this.onEditCompleteCallback({
              id,
              center: [centerLng, centerLat],
              radius: radius,
              fillColor: this.defaultFillColor,
              outlineColor: this.defaultOutlineColor,
              outlineWidth: this.defaultOutlineWidth,
            });
          }
        }
        this.stopEdit();
      }
    });
  }

  /**
   * Start drawing a circle with two clicks: center then radius
   */
  public startDraw(onComplete?: (data: CircleDrawData) => void): void {
    if (!this.sketchViewModel) {
      console.error("SketchViewModel not initialized. Call setView() first.");
      return;
    }
    if (this.isEditMode) {
      this.stopEdit();
    }
    this.onDrawCompleteCallback = onComplete || null;
    this.sketchViewModel.create("circle");
    console.log("Drawing started - click to set center, then click to set radius");
  }

  /**
   * Stop current drawing
   */
  public stopDraw(): void {
    if (this.sketchViewModel) {
      this.sketchViewModel.cancel();
    }
    this.onDrawCompleteCallback = null;
  }

  /**
   * Start editing a circle by id
   * @param id - Circle id to edit
   * @param onComplete - Callback when edit is complete
   */
  public startEdit(id: string, onComplete?: (data: CircleDrawData) => void): void {
    if (!this.sketchViewModel) {
      console.error("SketchViewModel not initialized. Call setView() first.");
      return;
    }
    const graphic = this.circles.get(id);
    if (!graphic) {
      console.error(`Circle with id ${id} not found`);
      return;
    }
    if (this.onDrawCompleteCallback) {
      this.stopDraw();
    }
    this.isEditMode = true;
    this.editingGraphic = graphic;
    this.onEditCompleteCallback = onComplete || null;
    this.sketchViewModel.update([graphic]);
    console.log("Edit started - drag circle to move, drag edge to resize");
  }

  /**
   * Stop current editing
   */
  public stopEdit(): void {
    if (this.sketchViewModel) {
      this.sketchViewModel.cancel();
    }
    this.isEditMode = false;
    this.editingGraphic = null;
    this.onEditCompleteCallback = null;
  }

  /**
   * Check if currently in edit mode
   */
  public isEditing(): boolean {
    return this.isEditMode;
  }

  /**
   * Add a circle programmatically
   */
  public addCircle(data: CircleDrawData): void {
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
      attributes: { id: data.id, createdAt: Date.now() },
    });
    this.graphicsLayer.add(graphic);
    this.circles.set(data.id, graphic);
  }

  /**
   * Remove a circle by id
   */
  public removeCircle(id: string): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      this.graphicsLayer.remove(graphic);
      this.circles.delete(id);
    }
  }

  /**
   * Clear all circles
   */
  public clearAllCircles(): void {
    this.circles.forEach((graphic) => {
      if (this.graphicsLayer) {
        this.graphicsLayer.remove(graphic);
      }
    });
    this.circles.clear();
  }

  /**
   * Get all circles
   */
  public getAllCircles(): CircleDrawData[] {
    const result: CircleDrawData[] = [];
    this.circles.forEach((graphic, id) => {
      const geometry = graphic.geometry as Circle;
      const center = geometry.center;
      const radius = geometry.radius;

      if (center) {
        const longitude = center.longitude;
        const latitude = center.latitude;

        if (longitude !== null && longitude !== undefined &&
          latitude !== null && latitude !== undefined) {
          result.push({
            id,
            center: [longitude, latitude],
            radius: radius ?? 0,
          });
        }
      }
    });
    return result;
  }

  /**
   * Get a specific circle by id
   */
  public getCircle(id: string): CircleDrawData | undefined {
    const graphic = this.circles.get(id);
    if (!graphic) return undefined;

    const geometry = graphic.geometry as Circle;
    const center = geometry.center;
    const radius = geometry.radius;

    if (center) {
      const longitude = center.longitude;
      const latitude = center.latitude;

      if (longitude !== null && longitude !== undefined &&
        latitude !== null && latitude !== undefined) {
        return {
          id,
          center: [longitude, latitude],
          radius: radius ?? 0,
        };
      }
    }
    return undefined;
  }

  /**
   * Update layer data
   */
  public updateData(data: { circles?: CircleDrawData[] }): void {
    if (data.circles) {
      this.clearAllCircles();
      data.circles.forEach((circle) => this.addCircle(circle));
    }
  }

  /**
   * Destroy the layer
   */
  public destroy(): void {
    if (this.sketchViewModel) {
      this.sketchViewModel.destroy();
      this.sketchViewModel = null;
    }
    super.destroy();
  }

  /**
   * Update the fill and border colors of the circle.
   */
  public updateCircleColor(id: string, fillColor: number[], outlineColor: number[]): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      const symbol = graphic.symbol as SimpleFillSymbol;
      if (symbol) {
        symbol.color = fillColor;
        if (symbol.outline) {
          symbol.outline.color = outlineColor;
        }
        this.graphicsLayer.remove(graphic);
        this.graphicsLayer.add(graphic);
      }
    }
  }

  /**
   * Update the border thickness of the circle
   */
  public updateCircleStrokeWidth(id: string, width: number): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      const symbol = graphic.symbol as SimpleFillSymbol;
      if (symbol && symbol.outline) {
        symbol.outline.width = width;
        this.graphicsLayer.remove(graphic);
        this.graphicsLayer.add(graphic);
      }
    }
  }

  /**
   * Update the border style of the circle (solid/dashed).
   */
  public updateCircleStrokeStyle(id: string, style: "solid" | "dashed"): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      const symbol = graphic.symbol as SimpleFillSymbol;
      if (symbol && symbol.outline) {
        if (style === "dashed") {
          (symbol.outline as any).style = "dash";
        } else {
          (symbol.outline as any).style = "solid";
        }
        this.graphicsLayer.remove(graphic);
        this.graphicsLayer.add(graphic);
      }
    }
  }

  /**
   * Update the complete style of the circle
   */
  public updateCircleStyle(
    id: string,
    fillColor: number[],
    outlineColor: number[],
    outlineWidth: number,
    outlineStyle: "solid" | "dashed"
  ): void {
    const graphic = this.circles.get(id);
    if (graphic && this.graphicsLayer) {
      const newSymbol = new SimpleFillSymbol({
        color: fillColor,
        outline: new SimpleLineSymbol({
          color: outlineColor,
          width: outlineWidth,
          style: outlineStyle === "dashed" ? "dash" : "solid"
        })
      });
      graphic.symbol = newSymbol;
      this.graphicsLayer.remove(graphic);
      this.graphicsLayer.add(graphic);
    }
  }
}