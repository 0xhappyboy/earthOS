import { DrawTool } from "./DrawTool";
import { SectorDrawLayer, SectorDrawData } from "../layers/drawlayers/SectorDrawLayer";
import { Translations } from "../i18n";

export class SectorDrawTool implements DrawTool {
    id = "sector-draw";
    name = "Sector";
    icon = "🥧";
    private sectorDrawLayer: SectorDrawLayer;
    private onDrawComplete?: (data: SectorDrawData) => void;
    private onEditComplete?: (data: SectorDrawData) => void;

    constructor(sectorDrawLayer: SectorDrawLayer, t: Translations) {
        this.sectorDrawLayer = sectorDrawLayer;
        this.name = t.drawSector || "Sector";
    }

    activate(): void {
        this.sectorDrawLayer.setEditable(true);
    }

    deactivate(): void {
        this.sectorDrawLayer.stopDraw();
        this.sectorDrawLayer.stopEdit();
    }

    isActive(): boolean {
        return this.sectorDrawLayer.isDrawActive() || this.sectorDrawLayer.isEditActive();
    }

    startDraw(): void {
        this.sectorDrawLayer.startDraw((data) => {
            if (this.onDrawComplete) {
                this.onDrawComplete(data);
            }
        });
    }

    startEdit(id: string): void {
        this.sectorDrawLayer.startEdit(id, (data) => {
            if (this.onEditComplete) {
                this.onEditComplete(data);
            }
        });
    }

    setOnDrawComplete(callback: (data: SectorDrawData) => void): void {
        this.onDrawComplete = callback;
    }

    setOnEditComplete(callback: (data: SectorDrawData) => void): void {
        this.onEditComplete = callback;
    }

    getSectorLayer(): SectorDrawLayer {
        return this.sectorDrawLayer;
    }

    destroy(): void {
        this.sectorDrawLayer.destroy();
    }
}