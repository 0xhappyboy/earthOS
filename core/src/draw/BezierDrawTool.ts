import { DrawTool } from "./DrawTool";
import { BezierDrawLayer, BezierDrawData } from "../layers/drawlayers/BezierDrawLayer";
import { Translations } from "../i18n";

export class BezierDrawTool implements DrawTool {
    id = "bezier-draw";
    name = "Bezier Curve";
    icon = "〰️";
    private bezierDrawLayer: BezierDrawLayer;
    private onDrawComplete?: (data: BezierDrawData) => void;
    private onEditComplete?: (data: BezierDrawData) => void;

    constructor(bezierDrawLayer: BezierDrawLayer, t: Translations) {
        this.bezierDrawLayer = bezierDrawLayer;
        this.name = t.drawBezier || "Bezier Curve";
    }

    activate(): void {
        this.bezierDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.bezierDrawLayer.stopDraw();
        this.bezierDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.bezierDrawLayer.isDrawActive() || this.bezierDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.bezierDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.bezierDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: BezierDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: BezierDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getBezierLayer(): BezierDrawLayer {
        return this.bezierDrawLayer;
    }

    destroy(): void {
        this.bezierDrawLayer.destroy();
    }
}