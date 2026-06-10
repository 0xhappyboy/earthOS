import { DrawTool } from "./DrawTool";
import { RectangleDrawLayer } from "../layers";
import { Translations } from "../i18n";
import { RectangleDrawData } from "../types";

export class RectangleDrawTool implements DrawTool {
    id = "rectangle-draw";
    name = "Rectangle Draw";
    icon = "◻️";
    private rectangleDrawLayer: RectangleDrawLayer;
    private onDrawComplete?: (data: RectangleDrawData) => void;
    private onEditComplete?: (data: RectangleDrawData) => void;

    constructor(rectangleDrawLayer: RectangleDrawLayer, t: Translations) {
        this.rectangleDrawLayer = rectangleDrawLayer;
        this.name = t.drawRectangle || "Rectangle Draw";
    }

    activate(): void {
        this.rectangleDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.rectangleDrawLayer.stopDraw();
        this.rectangleDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.rectangleDrawLayer.isDrawActive() || this.rectangleDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.rectangleDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.rectangleDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: RectangleDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: RectangleDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getRectangleLayer(): RectangleDrawLayer {
        return this.rectangleDrawLayer;
    }

    destroy(): void {
        this.rectangleDrawLayer.destroy();
    }
}