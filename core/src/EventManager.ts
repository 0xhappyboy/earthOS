import { DrawingManager } from "./DrawingManager";

export class EventManager {
    private drawingManager: DrawingManager | null = null;
    private mapView: any = null;
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor() {}

    public setDrawingManager(drawingManager: DrawingManager): void {
        this.drawingManager = drawingManager;
    }

    public setMapView(mapView: any): void {
        this.mapView = mapView;
    }

    public bindEvents(): void {
        if (this.keydownHandler) {
            document.removeEventListener("keydown", this.keydownHandler);
        }
        
        this.keydownHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                this.handleEscCancel();
            }
        };
        
        document.addEventListener("keydown", this.keydownHandler);
    }

    private handleEscCancel(): void {
        if (this.drawingManager?.isDrawing()) {
            this.drawingManager.cancelDrawing();
        }
    }

    public unbindEvents(): void {
        if (this.keydownHandler) {
            document.removeEventListener("keydown", this.keydownHandler);
            this.keydownHandler = null;
        }
    }

    public destroy(): void {
        this.unbindEvents();
        this.drawingManager = null;
        this.mapView = null;
    }
}