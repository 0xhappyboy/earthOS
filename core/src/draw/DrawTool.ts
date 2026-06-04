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
    POLYGON = "polygon-draw",
    LINE = "line-draw",
    POINT = "point-draw",
}