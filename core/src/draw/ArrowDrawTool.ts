import { DrawTool } from "./DrawTool";
import { ArrowDrawLayer, ArrowDrawData } from "../layers/drawlayers/ArrowDrawLayer";
import { Translations } from "../i18n";

export class ArrowDrawTool implements DrawTool {
    id = "arrow-draw";
    name = "箭头绘制";
    icon = "➡️";
    private arrowDrawLayer: ArrowDrawLayer;
    private onDrawComplete?: (data: ArrowDrawData) => void;
    private onEditComplete?: (data: ArrowDrawData) => void;

    constructor(arrowDrawLayer: ArrowDrawLayer, t: Translations) {
        this.arrowDrawLayer = arrowDrawLayer;
        this.name = t.drawArrow || "箭头绘制";
    }

    activate(): void {
        this.arrowDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.arrowDrawLayer.stopDraw();
        this.arrowDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.arrowDrawLayer.isDrawActive() || this.arrowDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.arrowDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.arrowDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: ArrowDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: ArrowDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getArrowLayer(): ArrowDrawLayer {
        return this.arrowDrawLayer;
    }

    destroy(): void {
        this.arrowDrawLayer.destroy();
    }
}