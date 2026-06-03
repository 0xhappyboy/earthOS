import Map from "@arcgis/core/Map";
import { ILayer } from "./types";

/**
 * Layer Manager - Manages addition, removal, and ordering of all layers
 */
export class LayerManager {
  private map: Map | null = null;
  private layers: Record<string, ILayer> = {};
  private layerOrder: string[] = [];

  constructor(map: Map | null) {
    this.map = map;
  }

  /**
   * Set map instance
   */
  public setMap(map: Map): void {
    this.map = map;
    this.layerOrder.forEach((id) => {
      const layer = this.layers[id];
      if (layer && this.map) {
        const arcgisLayer = layer.createLayer();
        this.map?.add(arcgisLayer, 0);
      }
    });
  }

  /**
   * Add layer
   * @param layer Layer instance
   * @param index Insert position, undefined adds to top
   */
  public addLayer(layer: ILayer, index?: number): void {
    if (this.layers[layer.id]) {
      console.warn(`Layer with id ${layer.id} already exists`);
      return;
    }

    this.layers[layer.id] = layer;

    if (index !== undefined && index >= 0 && index <= this.layerOrder.length) {
      this.layerOrder.splice(index, 0, layer.id);
    } else {
      this.layerOrder.push(layer.id);
    }

    if (this.map) {
      const arcgisLayer = layer.createLayer();
      const layerIndex = this.layerOrder.indexOf(layer.id);
      this.map.add(arcgisLayer, layerIndex);
    }
  }

  /**
   * Remove layer
   */
  public removeLayer(id: string): void {
    const layer = this.layers[id];
    if (layer) {
      layer.destroy();
      delete this.layers[id];
      const index = this.layerOrder.indexOf(id);
      if (index !== -1) {
        this.layerOrder.splice(index, 1);
      }
    }
  }

  /**
   * Get layer by id
   */
  public getLayer(id: string): ILayer | undefined {
    return this.layers[id];
  }

  /**
   * Get all layers
   */
  public getAllLayers(): ILayer[] {
    return this.layerOrder.map((id) => this.layers[id]);
  }

  /**
   * Move layer to new position
   * @param id Layer ID
   * @param newIndex New position, 0 is bottom
   */
  public moveLayer(id: string, newIndex: number): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= this.layerOrder.length) {
      return;
    }

    this.layerOrder.splice(currentIndex, 1);
    this.layerOrder.splice(newIndex, 0, id);

    this.reorderLayers();
  }

  /**
   * Bring layer to top
   */
  public bringToTop(id: string): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex !== -1) {
      this.layerOrder.splice(currentIndex, 1);
      this.layerOrder.push(id);
      this.reorderLayers();
    }
  }

  /**
   * Send layer to bottom
   */
  public sendToBottom(id: string): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex !== -1) {
      this.layerOrder.splice(currentIndex, 1);
      this.layerOrder.unshift(id);
      this.reorderLayers();
    }
  }

  /**
   * Reorder all layers
   */
  private reorderLayers(): void {
    if (!this.map) return;

    this.layerOrder.forEach((id, index) => {
      const layer = this.layers[id];
      if (layer && this.map) {
        const arcgisLayer = layer.getLayer?.();
        if (arcgisLayer && this.map.layers.includes(arcgisLayer)) {
          this.map.reorder(arcgisLayer, index);
        }
      }
    });
  }

  /**
   * Clear all layers
   */
  public clearAll(): void {
    Object.values(this.layers).forEach((layer) => {
      layer.destroy();
    });
    this.layers = {};
    this.layerOrder = [];
  }

  /**
   * Get layer count
   */
  public getLayerCount(): number {
    return Object.keys(this.layers).length;
  }
}