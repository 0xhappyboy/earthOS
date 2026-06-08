export interface DrawTool {
    id: string;
    name: string;
    icon?: string;
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
    destroy(): void;
}

export interface DrawToolEvent {
    toolId: string;
    type: 'start' | 'complete' | 'cancel';
    data?: any;
}

export enum DrawToolType {
    CIRCLE = "circle-draw",
    RECTANGLE = "rectangle-draw",
    TRIANGLE = "triangle-draw",
    FREEHAND = "freehand-draw",
    FREEHAND_POLYGON = "freehand-polygon-draw",
    ELLIPSE = "ellipse-draw",
    SECTOR = "sector-draw",
    MARKER = "marker-draw",
    TEXT = "text-draw",
    ARROW = "arrow-draw",
    BEZIER = "bezier-draw",
    LINE = "line-draw",
    IMAGE = "image",
}