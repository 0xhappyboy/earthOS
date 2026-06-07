import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { ILayer, LayerConfig } from "./types";

/**
 * Base layer abstract class - Provides basic layer implementation
 */
export abstract class BaseLayer implements ILayer {
  public id: string;
  public name: string;
  public visible: boolean;
  public opacity: number;
  protected graphicsLayer: GraphicsLayer | null = null;

  constructor(config: LayerConfig) {
    this.id = config.id;
    this.name = config.name;
    this.visible = config.visible ?? true;
    this.opacity = config.opacity ?? 1;
  }

  public createLayer(): GraphicsLayer {
    this.graphicsLayer = new GraphicsLayer({
      id: this.id,
      title: this.name,
      visible: this.visible,
      opacity: this.opacity,
    });
    return this.graphicsLayer;
  }

  public getLayer(): GraphicsLayer | null {
    return this.graphicsLayer;
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.graphicsLayer) {
      this.graphicsLayer.visible = visible;
    }
  }

  public setOpacity(opacity: number): void {
    this.opacity = opacity;
    if (this.graphicsLayer) {
      this.graphicsLayer.opacity = opacity;
    }
  }

  public clear(): void {
    if (this.graphicsLayer) {
      this.graphicsLayer.removeAll();
    }
  }

  public destroy(): void {
    if (this.graphicsLayer) {
      this.graphicsLayer.destroy();
      this.graphicsLayer = null;
    }
  }

  public abstract updateData(data: any): void;
}