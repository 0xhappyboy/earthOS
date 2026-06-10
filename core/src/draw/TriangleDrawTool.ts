import { DrawTool } from "./DrawTool";
import { TriangleDrawLayer } from "../layers";
import { Translations } from "../i18n";
import { TriangleDrawData } from "../types";

export class TriangleDrawTool implements DrawTool {
    id = "triangle-draw";
    name = "Triangle Draw";
    icon = "▲";
    private triangleDrawLayer: TriangleDrawLayer;
    private onDrawComplete?: (data: TriangleDrawData) => void;
    private onEditComplete?: (data: TriangleDrawData) => void;

    constructor(triangleDrawLayer: TriangleDrawLayer, t: Translations) {
        this.triangleDrawLayer = triangleDrawLayer;
        this.name = t.drawTriangle || "Triangle Draw";
    }

    activate(): void {
        this.triangleDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.triangleDrawLayer.stopDraw();
        this.triangleDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.triangleDrawLayer.isDrawActive() || this.triangleDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.triangleDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.triangleDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: TriangleDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: TriangleDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getTriangleLayer(): TriangleDrawLayer {
        return this.triangleDrawLayer;
    }

    destroy(): void {
        this.triangleDrawLayer.destroy();
    }
}