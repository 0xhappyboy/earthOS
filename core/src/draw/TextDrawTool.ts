import { DrawTool } from "./DrawTool";
import { TextDrawLayer, TextDrawData } from "../layers/drawlayers/TextDrawLayer";
import { Translations } from "../i18n";

export class TextDrawTool implements DrawTool {
    id = "text-draw";
    name = "Text Annotation";
    icon = "📝";
    private textDrawLayer: TextDrawLayer;
    private onDrawComplete?: (data: TextDrawData) => void;
    private onEditComplete?: (data: TextDrawData) => void;

    constructor(textDrawLayer: TextDrawLayer, t: Translations) {
        this.textDrawLayer = textDrawLayer;
        this.name = t.drawText || "Text Annotation";
    }

    activate(): void {
        this.textDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.textDrawLayer.stopDraw();
        this.textDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.textDrawLayer.isDrawActive() || this.textDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.textDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.textDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    editProperties(id: string, onComplete?: (data: TextDrawData) => void, onDelete?: () => void): void {
        this.textDrawLayer.editProperties(id, onComplete, onDelete);
    }

    setOnDrawComplete(callback: (data: TextDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: TextDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getTextLayer(): TextDrawLayer {
        return this.textDrawLayer;
    }

    destroy(): void {
        this.textDrawLayer.destroy();
    }
}