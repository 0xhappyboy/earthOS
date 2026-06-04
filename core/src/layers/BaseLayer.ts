import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { LayerTypeEnum } from "../types";

export interface ILayer {
    id: string;
    name: string;
    type: LayerTypeEnum;
    visible: boolean;
    opacity: number;
    zIndex: number;
    createLayer(map: any): VectorLayer<VectorSource> | any;
    getLayer(): any;
    setVisible(visible: boolean): void;
    setOpacity(opacity: number): void;
    setZIndex(zIndex: number): void;
    clear(): void;
    destroy(): void;
    updateData(data: any): void;
}

export abstract class BaseLayer implements ILayer {
    public id: string;
    public name: string;
    public type: LayerTypeEnum;
    public visible: boolean;
    public opacity: number;
    public zIndex: number;
    protected layer: any = null;
    protected source: VectorSource | null = null;

    constructor(id: string, name: string, type: LayerTypeEnum, options?: { visible?: boolean; opacity?: number; zIndex?: number }) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.visible = options?.visible ?? true;
        this.opacity = options?.opacity ?? 1;
        this.zIndex = options?.zIndex ?? 0;
    }

    public abstract createLayer(map: any): any;

    public getLayer(): any {
        return this.layer;
    }

    public setVisible(visible: boolean): void {
        this.visible = visible;
        if (this.layer) {
            this.layer.setVisible(visible);
        }
    }

    public setOpacity(opacity: number): void {
        this.opacity = opacity;
        if (this.layer) {
            this.layer.setOpacity(opacity);
        }
    }

    public setZIndex(zIndex: number): void {
        this.zIndex = zIndex;
        if (this.layer) {
            this.layer.setZIndex(zIndex);
        }
    }

    public clear(): void {
        if (this.source) {
            this.source.clear();
        }
    }

    public destroy(): void {
        if (this.layer) {
            const map = typeof this.layer.getMap === 'function' ? this.layer.getMap() : null;
            if (map && typeof map.removeLayer === 'function') {
                map.removeLayer(this.layer);
            }
            if (typeof this.layer.dispose === 'function') {
                this.layer.dispose();
            }
        }
        this.layer = null;
        this.source = null;
    }

    public abstract updateData(data: any): void;
}