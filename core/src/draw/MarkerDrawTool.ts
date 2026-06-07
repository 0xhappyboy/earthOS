import { DrawTool } from "./DrawTool";
import { MarkerDrawLayer, MarkerDrawData } from "../layers/drawlayers/MarkerDrawLayer";
import { Translations } from "../i18n";

export class MarkerDrawTool implements DrawTool {
    id = "marker-draw";
    name = "标记点绘制";
    icon = "📍";
    private markerDrawLayer: MarkerDrawLayer;
    private onDrawComplete?: (data: MarkerDrawData) => void;
    private onEditComplete?: (data: MarkerDrawData) => void;

    constructor(markerDrawLayer: MarkerDrawLayer, t: Translations) {
        this.markerDrawLayer = markerDrawLayer;
        this.name = t.drawMarker || "标记点绘制";
    }

    activate(): void {
        this.markerDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.markerDrawLayer.stopDraw();
        this.markerDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.markerDrawLayer.isDrawActive() || this.markerDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.markerDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.markerDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: MarkerDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: MarkerDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getMarkerLayer(): MarkerDrawLayer {
        return this.markerDrawLayer;
    }

    destroy(): void {
        this.markerDrawLayer.destroy();
    }
}