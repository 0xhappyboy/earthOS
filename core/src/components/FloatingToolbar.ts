import { Icons } from "../icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface FloatingToolbarOptions {
    onColorChange: (color: number[]) => void;
    onStrokeWidthChange: (width: number) => void;
    onStrokeStyleChange: (style: "solid" | "dashed") => void;
    onDelete: () => void;
    onClose: () => void;
    onPositionChange: (position: { x: number; y: number }) => void;
    theme: Theme;
    t: Translations;
    containerRef: HTMLElement;
    currentColor: number[];
    currentStrokeWidth: number;
    currentStrokeStyle: "solid" | "dashed";
    position?: { x: number; y: number };
}

export class FloatingToolbar {
    private element: HTMLDivElement;
    private options: FloatingToolbarOptions;
    private isDragging: boolean = false;
    private dragStart: { x: number; y: number } = { x: 0, y: 0 };
    private positionStart: { x: number; y: number } = { x: 0, y: 0 };
    private position: { x: number; y: number };
    private colorPickerPanel: HTMLDivElement | null = null;
    private strokeStylePanel: HTMLDivElement | null = null;
    private strokeWidthPanel: HTMLDivElement | null = null;
    private activePicker: string | null = null;

    constructor(options: FloatingToolbarOptions) {
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
        dragHandle.title = this.options.t.dragToMove;
        dragHandle.onmousedown = this.onMouseDown.bind(this);
        div.appendChild(dragHandle);
        const colorBtn = document.createElement("button");
        colorBtn.style.cssText = `${buttonStyle} background: transparent; padding: 2px;`;
        colorBtn.innerHTML = `<div style="width: 20px; height: 20px; background: rgba(${this.options.currentColor[0]}, ${this.options.currentColor[1]}, ${this.options.currentColor[2]}, ${this.options.currentColor[3] || 1}); border-radius: 4px; border: 1px solid ${isDark ? "#666" : "#ccc"};"></div>`;
        colorBtn.title = this.options.t.colorTitle;
        colorBtn.onclick = () => this.showColorPicker(colorBtn);
        div.appendChild(colorBtn);
        const strokeWidthBtn = document.createElement("button");
        strokeWidthBtn.style.cssText = buttonStyle;
        strokeWidthBtn.innerHTML = Icons.StrokeWidth;
        strokeWidthBtn.title = this.options.t.strokeWidthTitle;
        strokeWidthBtn.onclick = () => this.showStrokeWidthPicker(strokeWidthBtn);
        div.appendChild(strokeWidthBtn);
        const strokeStyleBtn = document.createElement("button");
        strokeStyleBtn.style.cssText = `${buttonStyle} border-style: ${this.options.currentStrokeStyle === "dashed" ? "dashed" : "solid"};`;
        strokeStyleBtn.innerHTML = Icons.StrokeStyle;
        strokeStyleBtn.title = this.options.t.strokeStyleTitle;
        strokeStyleBtn.onclick = () => this.showStrokeStylePicker(strokeStyleBtn);
        div.appendChild(strokeStyleBtn);
        const deleteBtn = document.createElement("button");
        deleteBtn.style.cssText = buttonStyle;
        deleteBtn.innerHTML = Icons.Delete;
        deleteBtn.title = this.options.t.deleteTitle;
        deleteBtn.onclick = () => this.options.onDelete();
        div.appendChild(deleteBtn);
        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = buttonStyle;
        closeBtn.innerHTML = Icons.Close;
        closeBtn.title = this.options.t.closeTitle;
        closeBtn.onclick = () => this.options.onClose();
        div.appendChild(closeBtn);
        return div;
    }

    private onMouseDown(e: MouseEvent): void {
        e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.positionStart = { x: this.position.x, y: this.position.y };
        document.addEventListener("mousemove", this.onMouseMove.bind(this));
        document.addEventListener("mouseup", this.onMouseUp.bind(this));
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
    private constrainPosition(position: { x: number; y: number }): { x: number; y: number } {
        const containerRect = this.options.containerRef.getBoundingClientRect();
        const toolbarRect = this.element.getBoundingClientRect();
        let toolbarWidth = toolbarRect.width;
        let toolbarHeight = toolbarRect.height;
        if (toolbarWidth === 0 || toolbarHeight === 0) {
            toolbarWidth = 200;
            toolbarHeight = 48;
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

    private onMouseUp(): void {
        this.isDragging = false;
        document.removeEventListener("mousemove", this.onMouseMove.bind(this));
        document.removeEventListener("mouseup", this.onMouseUp.bind(this));
        document.body.style.userSelect = "";
    }

    private showColorPicker(btn: HTMLElement): void {
        this.hideAllPickers();
        this.activePicker = "color";
        const rect = btn.getBoundingClientRect();
        const containerRect = this.options.containerRef.getBoundingClientRect();
        this.colorPickerPanel = this.createColorPicker();
        this.colorPickerPanel.style.position = "absolute";
        this.colorPickerPanel.style.left = `${rect.left - containerRect.left - 110}px`;
        this.colorPickerPanel.style.top = `${rect.top - containerRect.top - 200}px`;
        this.options.containerRef.appendChild(this.colorPickerPanel);
    }

    private showStrokeWidthPicker(btn: HTMLElement): void {
        this.hideAllPickers();
        this.activePicker = "width";
        const rect = btn.getBoundingClientRect();
        const containerRect = this.options.containerRef.getBoundingClientRect();
        this.strokeWidthPanel = this.createStrokeWidthPicker();
        this.strokeWidthPanel.style.position = "absolute";
        this.strokeWidthPanel.style.left = `${rect.left - containerRect.left - 65}px`;
        this.strokeWidthPanel.style.top = `${rect.top - containerRect.top - 200}px`;
        this.options.containerRef.appendChild(this.strokeWidthPanel);
    }

    private showStrokeStylePicker(btn: HTMLElement): void {
        this.hideAllPickers();
        this.activePicker = "style";
        const rect = btn.getBoundingClientRect();
        const containerRect = this.options.containerRef.getBoundingClientRect();
        this.strokeStylePanel = this.createStrokeStylePicker();
        this.strokeStylePanel.style.position = "absolute";
        this.strokeStylePanel.style.left = `${rect.left - containerRect.left - 80}px`;
        this.strokeStylePanel.style.top = `${rect.top - containerRect.top - 80}px`;
        this.options.containerRef.appendChild(this.strokeStylePanel);
    }

    private createColorPicker(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const PRESET_COLORS = [
            [255, 0, 0, 1], [255, 50, 50, 1], [255, 100, 100, 1], [220, 20, 60, 1],
            [255, 165, 0, 1], [255, 140, 0, 1], [255, 120, 0, 1], [255, 100, 0, 1],
            [255, 255, 0, 1], [255, 235, 0, 1], [255, 215, 0, 1], [240, 230, 140, 1],
            [0, 255, 0, 1], [0, 200, 0, 1], [0, 150, 0, 1], [34, 139, 34, 1],
            [0, 255, 255, 1], [0, 200, 200, 1], [0, 150, 150, 1], [64, 224, 208, 1],
            [0, 0, 255, 1], [0, 0, 200, 1], [0, 0, 150, 1], [25, 25, 112, 1],
            [128, 0, 128, 1], [138, 43, 226, 1], [153, 50, 204, 1], [186, 85, 211, 1],
            [255, 192, 203, 1], [255, 105, 180, 1], [255, 20, 147, 1], [219, 112, 147, 1],
            [139, 69, 19, 1], [160, 82, 45, 1], [210, 105, 30, 1], [205, 133, 63, 1],
            [255, 255, 255, 1], [211, 211, 211, 1], [128, 128, 128, 1], [64, 64, 64, 1],
            [0, 0, 0, 1], [30, 30, 30, 1], [50, 50, 50, 1], [80, 80, 80, 1],
        ];
        const div = document.createElement("div");
        div.style.cssText = `
            background: ${isDark ? "#2d2d2d" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            width: 220px;
            z-index: 300;
        `;
        const grid = document.createElement("div");
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 4px;
        `;
        for (const color of PRESET_COLORS) {
            const btn = document.createElement("button");
            btn.style.cssText = `
                width: 22px;
                height: 22px;
                background: rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]});
                border: 1px solid ${isDark ? "#555" : "#ccc"};
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            btn.onclick = () => {
                this.options.onColorChange(color);
                this.hideAllPickers();
            };
            btn.onmouseenter = () => { btn.style.transform = "scale(1.1)"; };
            btn.onmouseleave = () => { btn.style.transform = "scale(1)"; };
            grid.appendChild(btn);
        }
        div.appendChild(grid);
        return div;
    }

    private createStrokeWidthPicker(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const PRESET_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20];
        const div = document.createElement("div");
        div.style.cssText = `
            background: ${isDark ? "#2d2d2d" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 6px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            width: 130px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 300;
        `;
        div.className = "earthview-stroke-width-scroll";
        this.injectStrokeWidthScrollbarStyles(isDark);
        const container = document.createElement("div");
        container.style.cssText = `display: flex; flex-direction: column; gap: 2px;`;
        for (const width of PRESET_WIDTHS) {
            const row = document.createElement("div");
            row.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 6px 12px;
                cursor: pointer;
                background: ${this.options.currentStrokeWidth === width ? (isDark ? "#3d3d3d" : "#e8e8e8") : "transparent"};
                transition: all 0.2s;
            `;
            row.onmouseenter = () => {
                if (this.options.currentStrokeWidth !== width) {
                    row.style.background = isDark ? "#3a3a3a" : "#f0f0f0";
                }
            };
            row.onmouseleave = () => {
                if (this.options.currentStrokeWidth !== width) {
                    row.style.background = "transparent";
                }
            };
            row.onclick = () => {
                this.options.onStrokeWidthChange(width);
                this.hideAllPickers();
            };

            const preview = document.createElement("div");
            preview.style.cssText = `
                width: 35px;
                height: ${Math.min(width, 8)}px;
                background: ${isDark ? "#fff" : "#333"};
                border-radius: 2px;
            `;
            row.appendChild(preview);
            const label = document.createElement("span");
            label.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 11px; flex: 1;`;
            label.textContent = `${width}px`;
            row.appendChild(label);
            if (this.options.currentStrokeWidth === width) {
                const check = document.createElement("span");
                check.style.cssText = `color: #00aaff; font-size: 12px;`;
                check.textContent = "✓";
                row.appendChild(check);
            }
            container.appendChild(row);
        }
        div.appendChild(container);
        return div;
    }

    private injectStrokeWidthScrollbarStyles(isDark: boolean): void {
        const styleId = "earthview-stroke-width-scroll-styles";
        const thumbColor = isDark ? "#555" : "#ccc";
        const trackColor = isDark ? "#2d2d2d" : "#f0f0f0";
        const thumbHoverColor = isDark ? "#777" : "#aaa";
        const css = `
            .earthview-stroke-width-scroll {
                scrollbar-width: thin;
                scrollbar-color: ${thumbColor} ${trackColor};
            }
            .earthview-stroke-width-scroll::-webkit-scrollbar {
                width: 4px;
            }
            .earthview-stroke-width-scroll::-webkit-scrollbar-track {
                background: ${trackColor};
                border-radius: 4px;
            }
            .earthview-stroke-width-scroll::-webkit-scrollbar-thumb {
                background: ${thumbColor};
                border-radius: 4px;
            }
            .earthview-stroke-width-scroll::-webkit-scrollbar-thumb:hover {
                background: ${thumbHoverColor};
            }
        `;
        let styleEl = document.getElementById(styleId) as HTMLStyleElement;
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
    }

    private createStrokeStylePicker(): HTMLDivElement {
        const isDark = this.options.theme === "dark";

        const div = document.createElement("div");
        div.style.cssText = `
            background: ${isDark ? "#2d2d2d" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            padding: 6px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            width: 160px;
            z-index: 300;
        `;

        const styles = [
            { value: "solid" as const, label: this.options.t.solidLine },
            { value: "dashed" as const, label: this.options.t.dashedLine }
        ];

        for (const style of styles) {
            const row = document.createElement("div");
            row.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                cursor: pointer;
                background: ${this.options.currentStrokeStyle === style.value ? (isDark ? "#3d3d3d" : "#e8e8e8") : "transparent"};
                transition: all 0.2s;
            `;
            row.onmouseenter = () => {
                if (this.options.currentStrokeStyle !== style.value) {
                    row.style.background = isDark ? "#3a3a3a" : "#f0f0f0";
                }
            };
            row.onmouseleave = () => {
                if (this.options.currentStrokeStyle !== style.value) {
                    row.style.background = "transparent";
                }
            };
            row.onclick = () => {
                this.options.onStrokeStyleChange(style.value);
                this.hideAllPickers();
            };

            const preview = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            preview.setAttribute("width", "40");
            preview.setAttribute("height", "4");
            preview.setAttribute("viewBox", "0 0 40 4");
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", "0");
            line.setAttribute("y1", "2");
            line.setAttribute("x2", "40");
            line.setAttribute("y2", "2");
            line.setAttribute("stroke", isDark ? "#fff" : "#333");
            line.setAttribute("stroke-width", "2");
            if (style.value === "dashed") {
                line.setAttribute("stroke-dasharray", "4 4");
            }
            preview.appendChild(line);
            row.appendChild(preview);

            const label = document.createElement("span");
            label.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
            label.textContent = style.label;
            row.appendChild(label);

            if (this.options.currentStrokeStyle === style.value) {
                const check = document.createElement("span");
                check.style.cssText = `color: #00aaff; font-size: 12px;`;
                check.textContent = "✓";
                row.appendChild(check);
            }

            div.appendChild(row);
        }

        return div;
    }

    private hideAllPickers(): void {
        if (this.colorPickerPanel) {
            this.colorPickerPanel.remove();
            this.colorPickerPanel = null;
        }
        if (this.strokeWidthPanel) {
            this.strokeWidthPanel.remove();
            this.strokeWidthPanel = null;
        }
        if (this.strokeStylePanel) {
            this.strokeStylePanel.remove();
            this.strokeStylePanel = null;
        }
        this.activePicker = null;
    }

    private attachDragEvents(): void {
        document.addEventListener("click", (e) => {
            if (this.activePicker && !this.element.contains(e.target as Node)) {
                this.hideAllPickers();
            }
        });
    }

    public updatePosition(position: { x: number; y: number }): void {
        this.position = this.constrainPosition(position);
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
    }

    public setVisible(visible: boolean): void {
        this.element.style.display = visible ? "flex" : "none";
        if (!visible) {
            this.hideAllPickers();
        }
    }

    public updateColor(color: number[]): void {
        this.options.currentColor = color;
        const colorBtn = this.element.querySelector("button:nth-child(2)");
        if (colorBtn) {
            const innerDiv = colorBtn.querySelector("div");
            if (innerDiv) {
                innerDiv.style.background = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] || 1})`;
            }
        }
    }

    public updateStrokeStyle(style: "solid" | "dashed"): void {
        this.options.currentStrokeStyle = style;
        const styleBtn = this.element.querySelector("button:nth-child(4)");
        if (styleBtn) {
            (styleBtn as HTMLElement).style.borderStyle = style === "dashed" ? "dashed" : "solid";
        }
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "rgba(30,30,30,0.95)" : "rgba(255,255,255,0.95)";
        this.element.style.borderColor = isDark ? "#444" : "#ddd";

        const buttons = this.element.querySelectorAll("button");
        buttons.forEach((btn, index) => {
            const isDragHandle = index === 0;
            btn.style.background = isDragHandle ? (isDark ? "#3d3d3d" : "#e8e8e8") : (isDark ? "#2d2d2d" : "#f0f0f0");
            btn.style.borderColor = isDark ? "#444" : "#ddd";
            btn.style.color = isDark ? "#ccc" : "#666";
        });
    }

    public destroy(): void {
        this.hideAllPickers();
        this.element.remove();
    }
}