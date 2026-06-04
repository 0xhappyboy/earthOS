import { DrawTool } from "./DrawTool";
import { CircleDrawData } from "../types";
import { CircleDrawLayer } from "../layers";
import { Translations } from "../i18n";

export class CircleDrawTool implements DrawTool {
    id = "circle-draw";
    name = "圆形绘制";
    icon = "⭕";
    private circleDrawLayer: CircleDrawLayer;
    private onDrawComplete?: (data: CircleDrawData) => void;
    private onEditComplete?: (data: CircleDrawData) => void;
    constructor(circleDrawLayer: CircleDrawLayer, t: Translations) {
        this.circleDrawLayer = circleDrawLayer;
        this.name = t.drawCircle || "圆形绘制";
    }
    activate(): void {
        this.circleDrawLayer.setEditable(true);
    }
    deactivate(): void {
        this.circleDrawLayer.stopDraw();
        this.circleDrawLayer.stopEdit();
    }
    isActive(): boolean {
        return this.circleDrawLayer.isDrawActive() || this.circleDrawLayer.isEditActive();
    }
    startDraw(): void {
        this.circleDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }
    startEdit(id: string): void {
        this.circleDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }
    setOnDrawComplete(callback: (data: CircleDrawData) => void): void {
        this.onDrawComplete = callback;
    }
    setOnEditComplete(callback: (data: CircleDrawData) => void): void {
        this.onEditComplete = callback;
    }
    getCircleLayer(): CircleDrawLayer {
        return this.circleDrawLayer;
    }
    destroy(): void {
        this.circleDrawLayer.destroy();
    }
}