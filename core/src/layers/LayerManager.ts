import { BaseLayer } from "./BaseLayer";
import { ILayerManager } from "./types";

export class LayerManager implements ILayerManager {
    private map: any;
    private layers: Map<string, BaseLayer> = new Map();
    private layerOrder: string[] = [];

    constructor(map: any) {
        this.map = map;
    }

    public addLayer(layer: BaseLayer, index?: number): void {
        if (this.layers.has(layer.id)) {
            console.warn(`Layer with id ${layer.id} already exists`);
            return;
        }
        const existingLayer = layer.getLayer();
        if (existingLayer && this.map.getLayers().getArray().includes(existingLayer)) {
            console.warn(`Layer ${layer.id} already added to map`);
            return;
        }
        this.layers.set(layer.id, layer);
        if (index !== undefined && index >= 0 && index <= this.layerOrder.length) {
            this.layerOrder.splice(index, 0, layer.id);
        } else {
            this.layerOrder.push(layer.id);
        }
        let olLayer = layer.getLayer();
        if (!olLayer) {
            olLayer = layer.createLayer(this.map);
        } else if (olLayer && !this.map.getLayers().getArray().includes(olLayer)) {
            this.map.addLayer(olLayer);
        }

        if (olLayer) {
            layer.setZIndex(this.getZIndexForLayer(layer.id));
        }
    }

    private getZIndexForLayer(id: string): number {
        const index = this.layerOrder.indexOf(id);
        return index;
    }

    public removeLayer(id: string): void {
        const layer = this.layers.get(id);
        if (layer) {
            layer.destroy();
            this.layers.delete(id);
            const index = this.layerOrder.indexOf(id);
            if (index !== -1) {
                this.layerOrder.splice(index, 1);
            }
        }
    }

    public getLayer(id: string): BaseLayer | undefined {
        return this.layers.get(id);
    }

    public getAllLayers(): BaseLayer[] {
        return this.layerOrder.map((id) => this.layers.get(id)!);
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
        this.layerOrder.forEach((id, targetIndex) => {
            const layer = this.layers.get(id);
            if (layer && layer.getLayer()) {
                layer.setZIndex(targetIndex);
            }
        });
    }

    public clearAll(): void {
        this.layers.forEach((layer) => {
            if (layer && typeof layer.destroy === 'function') {
                layer.destroy();
            }
        });
        this.layers.clear();
        this.layerOrder = [];
    }

    public getLayerCount(): number {
        return this.layers.size;
    }
}