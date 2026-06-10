import { DrawTool } from "./DrawTool";
import { ImageDrawLayer, ImageDrawData } from "../layers/drawlayers/ImageDrawLayer";
import { Translations } from "../i18n";

export class ImageDrawTool implements DrawTool {
    id = "image-draw";
    name = "Image Annotation";
    icon = "🖼️";
    private imageDrawLayer: ImageDrawLayer;
    private onDrawComplete?: (data: ImageDrawData) => void;
    private onEditComplete?: (data: ImageDrawData) => void;

    constructor(imageDrawLayer: ImageDrawLayer, t: Translations) {
        this.imageDrawLayer = imageDrawLayer;
        this.name = t.drawImage || "Image Annotation";
    }

    activate(): void {
        this.imageDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.imageDrawLayer.stopDraw();
        this.imageDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.imageDrawLayer.isDrawActive() || this.imageDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.imageDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.imageDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    editProperties(id: string, onComplete?: (data: ImageDrawData) => void, onDelete?: () => void): void {
        this.imageDrawLayer.editProperties(id, onComplete, onDelete);
    }

    setOnDrawComplete(callback: (data: ImageDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: ImageDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getImageLayer(): ImageDrawLayer {
        return this.imageDrawLayer;
    }

    destroy(): void {
        this.imageDrawLayer.destroy();
    }
}