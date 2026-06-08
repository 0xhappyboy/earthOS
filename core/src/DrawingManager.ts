
import { CircleDrawTool } from "./draw/CircleDrawTool";
import { RectangleDrawTool } from "./draw/RectangleDrawTool";
import { TriangleDrawTool } from "./draw/TriangleDrawTool";
import { FreehandDrawTool } from "./draw/FreehandDrawTool";
import { EllipseDrawTool } from "./draw/EllipseDrawTool";
import { MarkerDrawTool } from "./draw/MarkerDrawTool";
import { TextDrawTool } from "./draw/TextDrawTool";
import { ArrowDrawTool } from "./draw/ArrowDrawTool";
import { DrawToolType } from "./draw/DrawTool";
import { BezierDrawTool } from "./draw/BezierDrawTool";
import { LineDrawTool } from "./draw/LineDrawTool";
import { SectorDrawTool } from "./draw/SectorDrawTool";
import { ImageDrawTool } from "./draw/ImageDrawTool";  

export class DrawingManager {
    private activeToolType: DrawToolType | null = null;
    private circleTool: CircleDrawTool | null = null;
    private rectangleTool: RectangleDrawTool | null = null;
    private triangleTool: TriangleDrawTool | null = null;
    private freehandTool: FreehandDrawTool | null = null;
    private ellipseTool: EllipseDrawTool | null = null;
    private markerTool: MarkerDrawTool | null = null;
    private textTool: TextDrawTool | null = null;
    private arrowTool: ArrowDrawTool | null = null;
    private imageTool: ImageDrawTool | null = null;  
    private lineTool: LineDrawTool | null = null;
    private bezierTool: BezierDrawTool | null = null;
    private sectorTool: SectorDrawTool | null = null;
    private onDrawingStartCallback?: (toolType: DrawToolType) => void;
    private onDrawingEndCallback?: () => void;

    constructor() { }

    public registerTools(
        circle: CircleDrawTool,
        rectangle: RectangleDrawTool,
        triangle: TriangleDrawTool,
        freehand: FreehandDrawTool,
        ellipse: EllipseDrawTool,
        marker: MarkerDrawTool,
        text: TextDrawTool,
        arrow: ArrowDrawTool,
        line: LineDrawTool,
        bezier: BezierDrawTool,
        sector: SectorDrawTool,
        image: ImageDrawTool,  
    ): void {
        this.circleTool = circle;
        this.rectangleTool = rectangle;
        this.triangleTool = triangle;
        this.freehandTool = freehand;
        this.ellipseTool = ellipse;
        this.markerTool = marker;
        this.textTool = text;
        this.arrowTool = arrow;
        this.lineTool = line;
        this.bezierTool = bezier;
        this.sectorTool = sector;
        this.imageTool = image;  
        this.circleTool?.setOnDrawComplete(() => this.endDrawing());
        this.rectangleTool?.setOnDrawComplete(() => this.endDrawing());
        this.triangleTool?.setOnDrawComplete(() => this.endDrawing());
        this.freehandTool?.setOnDrawComplete(() => this.endDrawing());
        this.ellipseTool?.setOnDrawComplete(() => this.endDrawing());
        this.markerTool?.setOnDrawComplete(() => this.endDrawing());
        this.textTool?.setOnDrawComplete(() => this.endDrawing());
        this.arrowTool?.setOnDrawComplete(() => this.endDrawing());
        this.imageTool?.setOnDrawComplete(() => this.endDrawing());  
        this.circleTool?.setOnEditComplete(() => this.endDrawing());
        this.rectangleTool?.setOnEditComplete(() => this.endDrawing());
        this.triangleTool?.setOnEditComplete(() => this.endDrawing());
        this.freehandTool?.setOnEditComplete(() => this.endDrawing());
        this.ellipseTool?.setOnEditComplete(() => this.endDrawing());
        this.markerTool?.setOnEditComplete(() => this.endDrawing());
        this.textTool?.setOnEditComplete(() => this.endDrawing());
        this.arrowTool?.setOnEditComplete(() => this.endDrawing());
        this.imageTool?.setOnEditComplete(() => this.endDrawing());  
        this.lineTool?.setOnDrawComplete(() => this.endDrawing());
        this.bezierTool?.setOnDrawComplete(() => this.endDrawing());
        this.sectorTool?.setOnDrawComplete(() => this.endDrawing());
        this.lineTool?.setOnEditComplete(() => this.endDrawing());
        this.bezierTool?.setOnEditComplete(() => this.endDrawing());
        this.sectorTool?.setOnEditComplete(() => this.endDrawing());
    }

    public startDrawingLine(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.LINE;
        this.lineTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.LINE);
    }

    public startDrawingBezier(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.BEZIER;
        this.bezierTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.BEZIER);
    }

    public startDrawingSector(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.SECTOR;
        this.sectorTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.SECTOR);
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

    public startDrawingFreehand(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.FREEHAND;
        this.freehandTool?.startDraw(false);
        this.onDrawingStartCallback?.(DrawToolType.FREEHAND);
    }

    public startDrawingFreehandPolygon(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.FREEHAND_POLYGON;
        this.freehandTool?.startDraw(true);
        this.onDrawingStartCallback?.(DrawToolType.FREEHAND_POLYGON);
    }

    public startDrawingEllipse(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.ELLIPSE;
        this.ellipseTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.ELLIPSE);
    }

    public startDrawingMarker(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.MARKER;
        this.markerTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.MARKER);
    }

    public startDrawingText(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.TEXT;
        this.textTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.TEXT);
    }
    public startDrawingArrow(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.ARROW;
        this.arrowTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.ARROW);
    }
    public startDrawingImage(): void {
        this.deactivateAll();
        this.activeToolType = DrawToolType.IMAGE;
        this.imageTool?.startDraw();
        this.onDrawingStartCallback?.(DrawToolType.IMAGE);
    }
    public cancelDrawing(): void {
        this.deactivateAll();
    }
    private deactivateAll(): void {
        const hadActive = this.activeToolType !== null;
        this.circleTool?.deactivate();
        this.rectangleTool?.deactivate();
        this.triangleTool?.deactivate();
        this.freehandTool?.deactivate();
        this.ellipseTool?.deactivate();
        this.markerTool?.deactivate();
        this.textTool?.deactivate();
        this.arrowTool?.deactivate();
        this.imageTool?.deactivate();  
        this.lineTool?.deactivate();
        this.bezierTool?.deactivate();
        this.sectorTool?.deactivate();
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
        this.freehandTool = null;
        this.ellipseTool = null;
        this.markerTool = null;
        this.textTool = null;
        this.arrowTool = null;
        this.imageTool = null;  
        this.lineTool = null;
        this.bezierTool = null;
        this.sectorTool = null;
    }
}