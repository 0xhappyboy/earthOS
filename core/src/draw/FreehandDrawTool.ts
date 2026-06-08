import { DrawTool } from "./DrawTool";
import { FreehandDrawLayer, FreehandDrawData } from "../layers/drawlayers/FreehandDrawLayer";
import { Translations } from "../i18n";

export class FreehandDrawTool implements DrawTool {
    id = "freehand-draw";
    name = "手绘线";
    icon = "✏️";
    private isPolygonMode: boolean = false;
    private freehandDrawLayer: FreehandDrawLayer;
    private onDrawComplete?: (data: FreehandDrawData) => void;
    private onEditComplete?: (data: FreehandDrawData) => void;

    constructor(freehandDrawLayer: FreehandDrawLayer, t: Translations, isPolygon: boolean = false) {
        this.freehandDrawLayer = freehandDrawLayer;
        this.isPolygonMode = isPolygon;
        this.name = isPolygon ? (t.drawFreehandPolygon || "手绘多边形") : (t.drawFreehandLine || "手绘线");
    }

    activate(): void {
        this.freehandDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.freehandDrawLayer.stopDraw();
        this.freehandDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.freehandDrawLayer.isDrawActive() || this.freehandDrawLayer.isEditActive();
    }

    startDraw(isPolygon: boolean = false): void {
        this.name = isPolygon ? "手绘多边形" : "手绘线";
        this.freehandDrawLayer.startDraw(isPolygon, (data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.freehandDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: FreehandDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: FreehandDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getFreehandLayer(): FreehandDrawLayer {
        return this.freehandDrawLayer;
    }

    destroy(): void {
        this.freehandDrawLayer.destroy();
    }
}