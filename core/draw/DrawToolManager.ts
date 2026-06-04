import { DrawTool, DrawToolEvent } from "./DrawTool";

export class DrawToolManager {
    private tools: Map<string, DrawTool> = new Map();
    private activeTool: DrawTool | null = null;
    private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

    registerTool(tool: DrawTool): void {
        if (this.tools.has(tool.id)) {
            console.warn(`Tool with id ${tool.id} already registered`);
            return;
        }
        this.tools.set(tool.id, tool);
    }

    unregisterTool(toolId: string): void {
        const tool = this.tools.get(toolId);
        if (tool && this.activeTool === tool) {
            this.deactivateCurrent();
        }
        this.tools.delete(toolId);
    }

    getTool(toolId: string): DrawTool | undefined {
        return this.tools.get(toolId);
    }

    activateTool(toolId: string): void {
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

    deactivateCurrent(): void {
        if (this.activeTool) {
            this.activeTool.deactivate();
            this.activeTool = null;
            this.emit('tool-deactivated', null);
        }
    }

    getActiveTool(): DrawTool | null {
        return this.activeTool;
    }

    getActiveToolId(): string | null {
        return this.activeTool?.id || null;
    }

    isToolActive(toolId: string): boolean {
        return this.activeTool?.id === toolId;
    }

    on(event: 'tool-activated' | 'tool-deactivated' | 'draw-start' | 'draw-complete' | 'draw-cancel', callback: (data: any) => void): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(callback);
    }

    off(event: string, callback: (data: any) => void): void {
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

    destroy(): void {
        this.tools.forEach(tool => tool.destroy());
        this.tools.clear();
        this.eventHandlers.clear();
        this.activeTool = null;
    }
}