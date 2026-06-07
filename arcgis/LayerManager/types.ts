import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

/**
 * Layer interface - All custom layers must implement this interface
 */
export interface ILayer {
    /** Unique layer identifier */
    id: string;
    /** Layer name */
    name: string;
    /** Layer visibility */
    visible: boolean;
    /** Layer opacity (0-1) */
    opacity?: number;
    /** Create and return ArcGIS GraphicsLayer instance */
    createLayer(): GraphicsLayer;
    /** Get ArcGIS GraphicsLayer instance */
    getLayer?(): GraphicsLayer | null;
    /** Update layer data */
    updateData?(data: any): void;
    /** Clear all graphics from layer */
    clear?(): void;
    /** Destroy layer */
    destroy(): void;
    /** Set visibility */
    setVisible?(visible: boolean): void;
    /** Set opacity */
    setOpacity?(opacity: number): void;
}

/**
 * Base layer configuration interface
 */
export interface LayerConfig {
    id: string;
    name: string;
    visible?: boolean;
    opacity?: number;
}