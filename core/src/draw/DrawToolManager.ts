import { DrawTool, DrawToolEvent } from "./DrawTool";
import { CircleDrawTool } from "./CircleDrawTool";
import { RectangleDrawTool } from "./RectangleDrawTool";
import { TriangleDrawTool } from "./TriangleDrawTool";
import { FreehandDrawTool } from "./FreehandDrawTool";
import { EllipseDrawTool } from "./EllipseDrawTool";
import { MarkerDrawTool } from "./MarkerDrawTool";
import { TextDrawTool } from "./TextDrawTool";
import { ArrowDrawTool } from "./ArrowDrawTool";
import { 
    CircleDrawLayer, 
    RectangleDrawLayer, 
    TriangleDrawLayer,
    FreehandDrawLayer,
    EllipseDrawLayer,
    MarkerDrawLayer,
    TextDrawLayer,
    ArrowDrawLayer
} from "../layers";
import { Translations } from "../i18n";

export class DrawToolManager {
    private tools: Map<string, DrawTool> = new Map();
    private activeTool: DrawTool | null = null;
    private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

    public registerCircleTool(layer: CircleDrawLayer, t: Translations): CircleDrawTool {
        const tool = new CircleDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerRectangleTool(layer: RectangleDrawLayer, t: Translations): RectangleDrawTool {
        const tool = new RectangleDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerTriangleTool(layer: TriangleDrawLayer, t: Translations): TriangleDrawTool {
        const tool = new TriangleDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerFreehandTool(layer: FreehandDrawLayer, t: Translations): FreehandDrawTool {
        const tool = new FreehandDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerEllipseTool(layer: EllipseDrawLayer, t: Translations): EllipseDrawTool {
        const tool = new EllipseDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerMarkerTool(layer: MarkerDrawLayer, t: Translations): MarkerDrawTool {
        const tool = new MarkerDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerTextTool(layer: TextDrawLayer, t: Translations): TextDrawTool {
        const tool = new TextDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    public registerArrowTool(layer: ArrowDrawLayer, t: Translations): ArrowDrawTool {
        const tool = new ArrowDrawTool(layer, t);
        this.registerTool(tool);
        return tool;
    }

    private registerTool(tool: DrawTool): void {
        if (this.tools.has(tool.id)) {
            console.warn(`Tool with id ${tool.id} already registered`);
            return;
        }
        this.tools.set(tool.id, tool);
    }

    public unregisterTool(toolId: string): void {
        const tool = this.tools.get(toolId);
        if (tool && this.activeTool === tool) {
            this.deactivateCurrent();
        }
        this.tools.delete(toolId);
    }

    public getTool(toolId: string): DrawTool | undefined {
        return this.tools.get(toolId);
    }

    public activateTool(toolId: string): void {
        if (this.activeTool) {
            this.activeTool.deactivate();
        }

        const tool = this.tools.get(toolId);
        if (tool) {
            this.activeTool = tool;
            tool.activate();
            this.emit('tool-activated', { toolId, name: tool.name });
        }
    }

    public deactivateCurrent(): void {
        if (this.activeTool) {
            this.activeTool.deactivate();
            this.activeTool = null;
            this.emit('tool-deactivated', null);
        }
    }

    public getActiveTool(): DrawTool | null {
        return this.activeTool;
    }

    public getActiveToolId(): string | null {
        return this.activeTool?.id || null;
    }

    public isToolActive(toolId: string): boolean {
        return this.activeTool?.id === toolId;
    }

    public on(event: 'tool-activated' | 'tool-deactivated' | 'draw-start' | 'draw-complete' | 'draw-cancel', callback: (data: any) => void): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(callback);
    }

    public off(event: string, callback: (data: any) => void): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(callback);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    private emit(event: string, data: any): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(cb => cb(data));
        }
    }

    public getAllTools(): DrawTool[] {
        return Array.from(this.tools.values());
    }

    public destroy(): void {
        this.tools.forEach(tool => tool.destroy());
        this.tools.clear();
        this.eventHandlers.clear();
        this.activeTool = null;
    }
}