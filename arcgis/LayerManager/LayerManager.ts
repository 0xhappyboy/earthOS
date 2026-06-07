import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { ILayer } from "./types";

/**
 * Layer Manager - Manages addition, removal, and ordering of all layers
 */
export class LayerManager {
  private map: Map | null = null;
  private mapView: MapView | null = null;
  private layers: Record<string, ILayer> = {};
  private layerOrder: string[] = [];

  constructor(map: Map | null) {
    this.map = map;
  }

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

  public setView(view: MapView): void {
    this.mapView = view;
    Object.values(this.layers).forEach((layer) => {
      if ((layer as any).setView) {
        (layer as any).setView(view);
      }
    });
  }

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
    if (this.mapView && (layer as any).setView) {
      (layer as any).setView(this.mapView);
    }
    if (this.map) {
      const arcgisLayer = layer.createLayer();
      const layerIndex = this.layerOrder.indexOf(layer.id);
      if ((layer as any).setMap) {
        (layer as any).setMap(this.map);
      } else {
        this.map.add(arcgisLayer, layerIndex);
      }
    }
  }


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

  public getLayer(id: string): ILayer | undefined {
    return this.layers[id];
  }

  public getAllLayers(): ILayer[] {
    return this.layerOrder.map((id) => this.layers[id]);
  }

  public moveLayer(id: string, newIndex: number): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= this.layerOrder.length) {
      return;
    }
    this.layerOrder.splice(currentIndex, 1);
    this.layerOrder.splice(newIndex, 0, id);
    this.reorderLayers();
  }

  public bringToTop(id: string): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex !== -1) {
      this.layerOrder.splice(currentIndex, 1);
      this.layerOrder.push(id);
      this.reorderLayers();
    }
  }

  public sendToBottom(id: string): void {
    const currentIndex = this.layerOrder.indexOf(id);
    if (currentIndex !== -1) {
      this.layerOrder.splice(currentIndex, 1);
      this.layerOrder.unshift(id);
      this.reorderLayers();
    }
  }

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

  public clearAll(): void {
    Object.values(this.layers).forEach((layer) => {
      layer.destroy();
    });
    this.layers = {};
    this.layerOrder = [];
  }

  public getLayerCount(): number {
    return Object.keys(this.layers).length;
  }
}