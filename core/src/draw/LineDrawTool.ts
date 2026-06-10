import { DrawTool } from "./DrawTool";
import { LineDrawLayer, LineDrawData } from "../layers/drawlayers/LineDrawLayer";
import { Translations } from "../i18n";

export class LineDrawTool implements DrawTool {
    id = "line-draw";
    name = "Line";
    icon = "━━";
    private lineDrawLayer: LineDrawLayer;
    private onDrawComplete?: (data: LineDrawData) => void;
    private onEditComplete?: (data: LineDrawData) => void;

    constructor(lineDrawLayer: LineDrawLayer, t: Translations) {
        this.lineDrawLayer = lineDrawLayer;
        this.name = t.drawLine || "Line";
    }

    activate(): void {
        this.lineDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.lineDrawLayer.stopDraw();
        this.lineDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.lineDrawLayer.isDrawActive() || this.lineDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.lineDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.lineDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: LineDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: LineDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getLineLayer(): LineDrawLayer {
        return this.lineDrawLayer;
    }

    destroy(): void {
        this.lineDrawLayer.destroy();
    }
}