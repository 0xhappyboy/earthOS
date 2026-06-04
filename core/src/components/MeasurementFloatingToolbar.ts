import { Icons } from "./icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface MeasurementFloatingToolbarOptions {
    onDelete: () => void;
    onClose: () => void;
    onPositionChange: (position: { x: number; y: number }) => void;
    theme: Theme;
    t: Translations;
    containerRef: HTMLElement;
    position?: { x: number; y: number };
}

export class MeasurementFloatingToolbar {
    private element: HTMLDivElement;
    private options: MeasurementFloatingToolbarOptions;
    private isDragging: boolean = false;
    private dragStart: { x: number; y: number } = { x: 0, y: 0 };
    private positionStart: { x: number; y: number } = { x: 0, y: 0 };
    private position: { x: number; y: number };

    constructor(options: MeasurementFloatingToolbarOptions) {
        this.options = options;
        this.position = options.position || { x: 100, y: 100 };
        this.element = this.createElement();
        options.containerRef.appendChild(this.element);
        this.element.style.visibility = 'hidden';
        this.position = this.constrainPosition(this.position);
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        this.element.style.visibility = 'visible';
        this.attachDragEvents();
    }

    private createElement(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const div = document.createElement("div");
        div.style.cssText = `
            position: absolute;
            left: ${this.position.x}px;
            top: ${this.position.y}px;
            z-index: 200;
            display: flex;
            align-items: center;
            gap: 6px;
            background: ${isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 6px 8px;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: default;
        `;
        const buttonStyle = `
            width: 28px;
            height: 28px;
            background: ${isDark ? "#2d2d2d" : "#f0f0f0"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 6px;
            color: ${isDark ? "#ccc" : "#666"};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        `;
        const dragHandle = document.createElement("div");
        dragHandle.style.cssText = `
            ${buttonStyle}
            width: 20px;
            cursor: grab;
            background: ${isDark ? "#3d3d3d" : "#e8e8e8"};
        `;
        dragHandle.innerHTML = Icons.DragHandle;
        dragHandle.onmousedown = this.onMouseDown.bind(this);
        div.appendChild(dragHandle);
        const deleteBtn = document.createElement("button");
        deleteBtn.style.cssText = buttonStyle;
        deleteBtn.innerHTML = Icons.Delete;
        deleteBtn.title = this.options.t.delete;
        deleteBtn.onclick = () => this.options.onDelete();
        div.appendChild(deleteBtn);
        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = buttonStyle;
        closeBtn.innerHTML = Icons.Close;
        closeBtn.title = this.options.t.cancel;
        closeBtn.onclick = () => this.options.onClose();
        div.appendChild(closeBtn);
        return div;
    }

    private constrainPosition(position: { x: number; y: number }): { x: number; y: number } {
        const containerRect = this.options.containerRef.getBoundingClientRect();
        const toolbarRect = this.element.getBoundingClientRect();
        let toolbarWidth = toolbarRect.width;
        let toolbarHeight = toolbarRect.height;
        if (toolbarWidth === 0 || toolbarHeight === 0) {
            toolbarWidth = 100;
            toolbarHeight = 40;
        }
        const minX = 0;
        const minY = 0;
        const maxX = Math.max(0, containerRect.width - toolbarWidth);
        const maxY = Math.max(0, containerRect.height - toolbarHeight);
        return {
            x: Math.max(minX, Math.min(position.x, maxX)),
            y: Math.max(minY, Math.min(position.y, maxY)),
        };
    }

    private attachDragEvents(): void {
    }

    private onMouseDown(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target.closest('[style*="cursor: grab"]')) {
            return;
        }
        e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.positionStart = { x: this.position.x, y: this.position.y };
        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
        document.body.style.userSelect = "none";
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        let newX = this.positionStart.x + dx;
        let newY = this.positionStart.y + dy;
        this.position = this.constrainPosition({ x: newX, y: newY });
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        this.options.onPositionChange(this.position);
    }

    private onMouseUp(): void {
        this.isDragging = false;
        window.removeEventListener("mousemove", this.onMouseMove.bind(this));
        window.removeEventListener("mouseup", this.onMouseUp.bind(this));
        document.body.style.userSelect = "";
    }

    public showAtPosition(position: { x: number; y: number }): void {
        this.element.style.opacity = '0';
        this.element.style.display = 'flex';
        requestAnimationFrame(() => {
            const constrainedPos = this.constrainPosition(position);
            this.position = constrainedPos;
            this.element.style.left = `${constrainedPos.x}px`;
            this.element.style.top = `${constrainedPos.y}px`;
            this.element.style.opacity = '1';
        });
    }

    public updatePosition(position: { x: number; y: number }): void {
        this.position = this.constrainPosition(position);
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
    }

    public setVisible(visible: boolean): void {
        this.element.style.display = visible ? "flex" : "none";
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)";
        this.element.style.borderColor = isDark ? "#444" : "#ddd";
        const buttons = this.element.querySelectorAll("button");
        const dragHandle = this.element.querySelector("div");
        if (dragHandle) {
            (dragHandle as HTMLElement).style.background = isDark ? "#3d3d3d" : "#e8e8e8";
            (dragHandle as HTMLElement).style.borderColor = isDark ? "#444" : "#ddd";
        }
        buttons.forEach((btn) => {
            btn.style.background = isDark ? "#2d2d2d" : "#f0f0f0";
            btn.style.borderColor = isDark ? "#444" : "#ddd";
            btn.style.color = isDark ? "#ccc" : "#666";
        });
    }

    public destroy(): void {
        window.removeEventListener("mousemove", this.onMouseMove.bind(this));
        window.removeEventListener("mouseup", this.onMouseUp.bind(this));
        this.element.remove();
    }
}