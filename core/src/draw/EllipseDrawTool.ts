import { DrawTool } from "./DrawTool";
import { EllipseDrawLayer, EllipseDrawData } from "../layers/drawlayers/EllipseDrawLayer";
import { Translations } from "../i18n";

export class EllipseDrawTool implements DrawTool {
    id = "ellipse-draw";
    name = "Ellipse Draw";
    icon = "⚪";
    private ellipseDrawLayer: EllipseDrawLayer;
    private onDrawComplete?: (data: EllipseDrawData) => void;
    private onEditComplete?: (data: EllipseDrawData) => void;

    constructor(ellipseDrawLayer: EllipseDrawLayer, t: Translations) {
        this.ellipseDrawLayer = ellipseDrawLayer;
        this.name = t.drawEllipse || "Ellipse Draw";
    }

    activate(): void {
        this.ellipseDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.ellipseDrawLayer.stopDraw();
        this.ellipseDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.ellipseDrawLayer.isDrawActive() || this.ellipseDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.ellipseDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.ellipseDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: EllipseDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: EllipseDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getEllipseLayer(): EllipseDrawLayer {
        return this.ellipseDrawLayer;
    }

    destroy(): void {
        this.ellipseDrawLayer.destroy();
    }
}