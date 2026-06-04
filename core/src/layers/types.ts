import { ILayer } from "./BaseLayer";

export interface ILayerManager {
    addLayer(layer: ILayer, index?: number): void;
    removeLayer(id: string): void;
    getLayer(id: string): ILayer | undefined;
    getAllLayers(): ILayer[];
    moveLayer(id: string, newIndex: number): void;
    bringToTop(id: string): void;
    sendToBottom(id: string): void;
    clearAll(): void;
    getLayerCount(): number;
}

export interface LayerConfig {
    id: string;
    name: string;
    visible?: boolean;
    opacity?: number;
    zIndex?: number;
}