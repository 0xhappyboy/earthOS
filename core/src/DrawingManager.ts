import { CircleDrawTool } from "./draw/CircleDrawTool";
import { RectangleDrawTool } from "./draw/RectangleDrawTool";
import { TriangleDrawTool } from "./draw/TriangleDrawTool";
import { DrawToolType } from "./draw/DrawTool";

export class DrawingManager {
    private activeToolType: DrawToolType | null = null;
    private circleTool: CircleDrawTool | null = null;
    private rectangleTool: RectangleDrawTool | null = null;
    private triangleTool: TriangleDrawTool | null = null;

    private onDrawingStartCallback?: (toolType: DrawToolType) => void;
    private onDrawingEndCallback?: () => void;

    constructor() { }

    public registerTools(
        circle: CircleDrawTool,
        rectangle: RectangleDrawTool,
        triangle: TriangleDrawTool
    ): void {
        this.circleTool = circle;
        this.rectangleTool = rectangle;
        this.triangleTool = triangle;
        this.circleTool?.setOnDrawComplete(() => {
            this.endDrawing();
        });
        this.rectangleTool?.setOnDrawComplete(() => {
            this.endDrawing();
        });
        this.triangleTool?.setOnDrawComplete(() => {
            this.endDrawing();
        });
        this.circleTool?.setOnEditComplete(() => {
            this.endDrawing();
        });
        this.rectangleTool?.setOnEditComplete(() => {
            this.endDrawing();
        });
        this.triangleTool?.setOnEditComplete(() => {
            this.endDrawing();
        });
    }

    public setCallbacks(onStart: (toolType: DrawToolType) => void, onEnd: () => void): void {
        this.onDrawingStartCallback = onStart;
        this.onDrawingEndCallback = onEnd;
    }

    public startDrawingCircle(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.CIRCLE;
        this.circleTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.CIRCLE);
    }

    public startDrawingRectangle(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.RECTANGLE;
        this.rectangleTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.RECTANGLE);
    }

    public startDrawingTriangle(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.TRIANGLE;
        this.triangleTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.TRIANGLE);
    }

    public cancelDrawing(): void {
        this.deactivateAll();
    }

    private deactivateAll(): void {
        const hadActive = this.activeToolType !== null;
        this.circleTool?.deactivate();
        this.rectangleTool?.deactivate();
        this.triangleTool?.deactivate();
        this.activeToolType = null;
        if (hadActive) {
            this.onDrawingEndCallback?.();
        }
    }

    private endDrawing(): void {
        if (this.activeToolType !== null) {
            this.activeToolType = null;
            this.onDrawingEndCallback?.();
        }
    }

    public getActiveTool(): DrawToolType | null {
        return this.activeToolType;
    }

    public isDrawing(): boolean {
        return this.activeToolType !== null;
    }

    public destroy(): void {
        this.deactivateAll();
        this.circleTool = null;
        this.rectangleTool = null;
        this.triangleTool = null;
    }
}