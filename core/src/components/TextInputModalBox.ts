import { Theme } from "./types";
import { Translations } from "../i18n";

export interface TextInputModalBoxOptions {
    initialText?: string;
    initialFontSize?: number;
    initialColor?: number[];
    initialFontWeight?: "normal" | "bold";
    initialFontStyle?: "normal" | "italic";
    onConfirm: (data: {
        text: string;
        fontSize: number;
        color: number[];
        fontWeight: "normal" | "bold";
        fontStyle: "normal" | "italic";
    }) => void;
    onCancel: () => void;
    onDelete?: () => void;
    theme: Theme;
    t: Translations;
    container?: HTMLElement;
}

export class TextInputModalBox {
    private element: HTMLDivElement;
    private overlay: HTMLDivElement;
    private options: TextInputModalBoxOptions;
    private textarea: HTMLTextAreaElement;
    private fontSizeSelect: HTMLSelectElement;
    private colorPreview: HTMLDivElement;
    private colorPicker: HTMLInputElement;
    private boldBtn: HTMLButtonElement;
    private italicBtn: HTMLButtonElement;
    private confirmBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private deleteBtn: HTMLButtonElement;
    private isBold: boolean = false;
    private isItalic: boolean = false;
    private currentColor: number[];
    private header: HTMLDivElement;
    private toolbar: HTMLDivElement;
    private footer: HTMLDivElement;
    private containerEl: HTMLElement;

    private readonly PRESET_FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42];

    constructor(options: TextInputModalBoxOptions, position?: { x: number; y: number }) {
        this.options = options;
        this.currentColor = options.initialColor || [255, 255, 255, 1];
        this.isBold = options.initialFontWeight === "bold";
        this.isItalic = options.initialFontStyle === "italic";
        this.containerEl = options.container || document.body;
        this.overlay = this.createOverlay();
        this.element = this.createElement();
        this.containerEl.appendChild(this.overlay);
        this.containerEl.appendChild(this.element);
        if (position) {
            this.setPosition(position);
        } else {
            this.centerModal();
        }
        this.textarea = this.element.querySelector(".text-input-modal-textarea") as HTMLTextAreaElement;
        this.fontSizeSelect = this.element.querySelector(".text-input-modal-font-size") as HTMLSelectElement;
        this.colorPreview = this.element.querySelector(".text-input-modal-color-preview") as HTMLDivElement;
        this.colorPicker = this.element.querySelector(".text-input-modal-color-picker") as HTMLInputElement;
        this.boldBtn = this.element.querySelector(".text-input-modal-bold") as HTMLButtonElement;
        this.italicBtn = this.element.querySelector(".text-input-modal-italic") as HTMLButtonElement;
        this.confirmBtn = this.element.querySelector(".text-input-modal-confirm") as HTMLButtonElement;
        this.cancelBtn = this.element.querySelector(".text-input-modal-cancel") as HTMLButtonElement;
        this.deleteBtn = this.element.querySelector(".text-input-modal-delete") as HTMLButtonElement;
        this.header = this.element.querySelector(".text-input-modal-header") as HTMLDivElement;
        this.toolbar = this.element.querySelector(".text-input-modal-toolbar") as HTMLDivElement;
        this.footer = this.element.querySelector(".text-input-modal-footer") as HTMLDivElement;
        this.bindEvents();
        this.updateColorPreview();
        this.updateStyleButtons();
        this.updateTextareaStyle();
        this.focusTextarea();
    }

    private createOverlay(): HTMLDivElement {
        const overlay = document.createElement("div");
        overlay.className = "text-input-modal-overlay";
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            z-index: 10000;
        `;
        overlay.onclick = (e) => {
            e.stopPropagation();
            this.options.onCancel();
            this.destroy();
        };
        return overlay;
    }

    private createElement(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const div = document.createElement("div");
        div.className = "text-input-modal-container";
        div.style.cssText = `
            position: fixed;
            z-index: 10001;
            width: 280px;
            background: ${isDark ? "#2d2d2d" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#e0e0e0"};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        this.header = this.createHeader(isDark);
        div.appendChild(this.header);

        const textarea = this.createTextarea(isDark);
        div.appendChild(textarea);

        this.toolbar = this.createToolbar(isDark);
        div.appendChild(this.toolbar);

        this.footer = this.createFooter(isDark);
        div.appendChild(this.footer);

        return div;
    }

    private createHeader(isDark: boolean): HTMLDivElement {
        const header = document.createElement("div");
        header.className = "text-input-modal-header";
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid ${isDark ? "#3d3d3d" : "#eee"};
            background: ${isDark ? "#252525" : "#f5f5f5"};
        `;
        const title = document.createElement("span");
        title.style.cssText = `
            color: ${isDark ? "#fff" : "#333"};
            font-size: 12px;
            font-weight: 500;
        `;
        title.textContent = this.options.t.editText;
        header.appendChild(title);
        return header;
    }

    private createTextarea(isDark: boolean): HTMLTextAreaElement {
        const textarea = document.createElement("textarea");
        textarea.className = "text-input-modal-textarea";
        textarea.placeholder = this.options.t.pleaseEnterText;
        textarea.value = this.options.initialText || "";
        textarea.style.cssText = `
            width: 100%;
            min-height: 70px;
            padding: 8px 12px;
            background: ${isDark ? "#1e1e1e" : "#fafafa"};
            border: none;
            color: ${isDark ? "#fff" : "#333"};
            font-size: ${this.options.initialFontSize || 14}px;
            font-weight: ${this.isBold ? "bold" : "normal"};
            font-style: ${this.isItalic ? "italic" : "normal"};
            font-family: inherit;
            resize: vertical;
            outline: none;
            box-sizing: border-box;
            line-height: 1.4;
            font-size: 13px;
        `;
        return textarea;
    }

    private createToolbar(isDark: boolean): HTMLDivElement {
        const toolbar = document.createElement("div");
        toolbar.className = "text-input-modal-toolbar";
        toolbar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            padding: 8px 10px;
            border-top: 1px solid ${isDark ? "#3d3d3d" : "#eee"};
            border-bottom: 1px solid ${isDark ? "#3d3d3d" : "#eee"};
            background: ${isDark ? "#252525" : "#fafafa"};
        `;

        const fontSizeContainer = this.createFontSizeSelector(isDark);
        toolbar.appendChild(fontSizeContainer);

        const divider1 = this.createDivider(isDark);
        toolbar.appendChild(divider1);

        this.boldBtn = this.createStyleButton("B", this.options.t.bold, isDark, this.isBold, "text-input-modal-bold");
        toolbar.appendChild(this.boldBtn);

        this.italicBtn = this.createStyleButton("I", this.options.t.italic, isDark, this.isItalic, "text-input-modal-italic");
        toolbar.appendChild(this.italicBtn);

        const divider2 = this.createDivider(isDark);
        toolbar.appendChild(divider2);

        const colorContainer = this.createColorSelector(isDark);
        toolbar.appendChild(colorContainer);

        return toolbar;
    }

    private createFontSizeSelector(isDark: boolean): HTMLDivElement {
        const container = document.createElement("div");
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        const label = document.createElement("span");
        label.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
        `;
        label.textContent = this.options.t.fontSize;
        container.appendChild(label);

        this.fontSizeSelect = document.createElement("select");
        this.fontSizeSelect.className = "text-input-modal-font-size";
        this.fontSizeSelect.style.cssText = `
            background: ${isDark ? "#3d3d3d" : "#ffffff"};
            border: 1px solid ${isDark ? "#555" : "#ddd"};
            border-radius: 4px;
            color: ${isDark ? "#fff" : "#333"};
            font-size: 11px;
            padding: 2px 6px;
            cursor: pointer;
            outline: none;
        `;

        const currentSize = this.options.initialFontSize || 14;
        for (const size of this.PRESET_FONT_SIZES) {
            const option = document.createElement("option");
            option.value = size.toString();
            option.textContent = `${size}`;
            if (size === currentSize) {
                option.selected = true;
            }
            this.fontSizeSelect.appendChild(option);
        }
        container.appendChild(this.fontSizeSelect);

        return container;
    }

    private createStyleButton(icon: string, title: string, isDark: boolean, isActive: boolean, className: string): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.className = className;
        btn.textContent = icon;
        btn.title = title;
        btn.style.cssText = `
            width: 24px;
            height: 24px;
            background: ${isActive ? "#00aaff" : (isDark ? "#3d3d3d" : "#e8e8e8")};
            border: 1px solid ${isDark ? "#555" : "#ddd"};
            border-radius: 4px;
            color: ${isActive ? "#fff" : (isDark ? "#ccc" : "#666")};
            cursor: pointer;
            font-size: 12px;
            font-weight: ${icon === "B" ? "bold" : "normal"};
            font-style: ${icon === "I" ? "italic" : "normal"};
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        btn.onmouseenter = () => {
            if (!isActive) {
                btn.style.background = isDark ? "#4a4a4a" : "#e0e0e0";
            }
        };
        btn.onmouseleave = () => {
            if (!isActive) {
                btn.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
            }
        };
        return btn;
    }

    private createColorSelector(isDark: boolean): HTMLDivElement {
        const container = document.createElement("div");
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        const label = document.createElement("span");
        label.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
        `;
        label.textContent = this.options.t.color;
        container.appendChild(label);

        this.colorPreview = document.createElement("div");
        this.colorPreview.className = "text-input-modal-color-preview";
        this.colorPreview.style.cssText = `
            width: 24px;
            height: 24px;
            border-radius: 4px;
            border: 1px solid ${isDark ? "#555" : "#ddd"};
            cursor: pointer;
            transition: all 0.2s;
        `;
        this.colorPreview.onmouseenter = () => {
            this.colorPreview.style.transform = "scale(1.05)";
        };
        this.colorPreview.onmouseleave = () => {
            this.colorPreview.style.transform = "scale(1)";
        };
        container.appendChild(this.colorPreview);

        this.colorPicker = document.createElement("input");
        this.colorPicker.type = "color";
        this.colorPicker.className = "text-input-modal-color-picker";
        this.colorPicker.style.cssText = `
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        `;
        this.colorPicker.value = this.rgbaToHex(this.currentColor);
        container.appendChild(this.colorPicker);

        return container;
    }

    private createDivider(isDark: boolean): HTMLDivElement {
        const divider = document.createElement("div");
        divider.style.cssText = `
            width: 1px;
            height: 16px;
            background: ${isDark ? "#444" : "#ddd"};
        `;
        return divider;
    }

    private createFooter(isDark: boolean): HTMLDivElement {
        const footer = document.createElement("div");
        footer.className = "text-input-modal-footer";
        footer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            padding: 8px 10px;
            background: ${isDark ? "#252525" : "#fafafa"};
        `;

        if (this.options.onDelete) {
            this.deleteBtn = this.createFooterButton(this.options.t.delete, isDark, false, true);
            this.deleteBtn.className = "text-input-modal-delete";
            footer.appendChild(this.deleteBtn);
        }

        this.cancelBtn = this.createFooterButton(this.options.t.cancel, isDark, false, false);
        this.cancelBtn.className = "text-input-modal-cancel";

        this.confirmBtn = this.createFooterButton(this.options.t.confirm, isDark, true, false);
        this.confirmBtn.className = "text-input-modal-confirm";

        footer.appendChild(this.cancelBtn);
        footer.appendChild(this.confirmBtn);

        return footer;
    }

    private createFooterButton(text: string, isDark: boolean, isPrimary: boolean, isDelete: boolean = false): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.style.cssText = `
            padding: 4px 14px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            ${isDelete ? `
                background: #f44336;
                color: white;
            ` : isPrimary ? `
                background: #00aaff;
                color: white;
            ` : `
                background: ${isDark ? "#3d3d3d" : "#e8e8e8"};
                color: ${isDark ? "#ccc" : "#666"};
                border: 1px solid ${isDark ? "#555" : "#ddd"};
            `}
        `;

        if (isDelete) {
            btn.onmouseenter = () => { btn.style.background = "#d32f2f"; };
            btn.onmouseleave = () => { btn.style.background = "#f44336"; };
        } else if (isPrimary) {
            btn.onmouseenter = () => { btn.style.background = "#0088cc"; };
            btn.onmouseleave = () => { btn.style.background = "#00aaff"; };
        } else {
            btn.onmouseenter = () => {
                btn.style.background = isDark ? "#4a4a4a" : "#e0e0e0";
            };
            btn.onmouseleave = () => {
                btn.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
            };
        }
        return btn;
    }

    private rgbaToHex(color: number[]): string {
        const r = Math.round(color[0]);
        const g = Math.round(color[1]);
        const b = Math.round(color[2]);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    private hexToRgba(hex: string): number[] {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 1];
    }

    private updateColorPreview(): void {
        this.colorPreview.style.backgroundColor = `rgba(${this.currentColor[0]}, ${this.currentColor[1]}, ${this.currentColor[2]}, ${this.currentColor[3] || 1})`;
    }

    private updateStyleButtons(): void {
        const isDark = this.options.theme === "dark";
        this.boldBtn.style.background = this.isBold ? "#00aaff" : (isDark ? "#3d3d3d" : "#e8e8e8");
        this.boldBtn.style.color = this.isBold ? "#fff" : (isDark ? "#ccc" : "#666");
        this.italicBtn.style.background = this.isItalic ? "#00aaff" : (isDark ? "#3d3d3d" : "#e8e8e8");
        this.italicBtn.style.color = this.isItalic ? "#fff" : (isDark ? "#ccc" : "#666");
    }

    private updateTextareaStyle(): void {
        const fontSize = parseInt(this.fontSizeSelect.value);
        this.textarea.style.fontSize = `${fontSize}px`;
        this.textarea.style.fontWeight = this.isBold ? "bold" : "normal";
        this.textarea.style.fontStyle = this.isItalic ? "italic" : "normal";
        this.textarea.style.color = `rgba(${this.currentColor[0]}, ${this.currentColor[1]}, ${this.currentColor[2]}, ${this.currentColor[3] || 1})`;
    }

    private focusTextarea(): void {
        setTimeout(() => {
            this.textarea.focus();
            this.textarea.select();
        }, 50);
    }

    private centerModal(): void {
        const left = (window.innerWidth - 280) / 2;
        const top = (window.innerHeight - 240) / 2;
        this.element.style.left = `${Math.max(10, left)}px`;
        this.element.style.top = `${Math.max(10, top)}px`;
    }

    private setPosition(position: { x: number; y: number }): void {
        let left = position.x - 140;
        let top = position.y - 130;
        left = Math.max(10, Math.min(left, window.innerWidth - 290));
        top = Math.max(10, Math.min(top, window.innerHeight - 270));
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    private bindEvents(): void {
        if (!this.fontSizeSelect || !this.colorPreview || !this.colorPicker ||
            !this.boldBtn || !this.italicBtn || !this.confirmBtn || !this.cancelBtn || !this.textarea) {
            console.error("TextInputModalBox: Required elements not found");
            return;
        }

        this.fontSizeSelect.addEventListener("change", () => {
            this.updateTextareaStyle();
        });

        this.colorPreview.addEventListener("click", (e) => {
            e.stopPropagation();
            this.colorPicker.click();
        });

        this.colorPicker.addEventListener("change", (e) => {
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            this.currentColor = this.hexToRgba(target.value);
            this.updateColorPreview();
            this.updateTextareaStyle();
        });

        this.boldBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.isBold = !this.isBold;
            this.updateStyleButtons();
            this.updateTextareaStyle();
        });

        this.italicBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.isItalic = !this.isItalic;
            this.updateStyleButtons();
            this.updateTextareaStyle();
        });

        if (this.deleteBtn) {
            this.deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.options.onDelete) {
                    this.options.onDelete();
                }
                this.destroy();
            });
        }

        this.confirmBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const text = this.textarea.value.trim();
            if (text) {
                this.options.onConfirm({
                    text,
                    fontSize: parseInt(this.fontSizeSelect.value),
                    color: this.currentColor,
                    fontWeight: this.isBold ? "bold" : "normal",
                    fontStyle: this.isItalic ? "italic" : "normal",
                });
            } else {
                this.options.onCancel();
            }
            this.destroy();
        });

        this.cancelBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.options.onCancel();
            this.destroy();
        });

        this.textarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                this.confirmBtn.click();
            } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                this.cancelBtn.click();
            }
        });

        this.element.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "#2d2d2d" : "#ffffff";
        this.element.style.borderColor = isDark ? "#444" : "#e0e0e0";
        if (this.header) {
            this.header.style.background = isDark ? "#252525" : "#f5f5f5";
            this.header.style.borderBottomColor = isDark ? "#3d3d3d" : "#eee";
            const title = this.header.querySelector("span");
            if (title) {
                title.style.color = isDark ? "#fff" : "#333";
            }
        }
        if (this.textarea) {
            this.textarea.style.background = isDark ? "#1e1e1e" : "#fafafa";
            this.textarea.style.color = isDark ? "#fff" : "#333";
        }
        if (this.toolbar) {
            this.toolbar.style.background = isDark ? "#252525" : "#fafafa";
            this.toolbar.style.borderTopColor = isDark ? "#3d3d3d" : "#eee";
            this.toolbar.style.borderBottomColor = isDark ? "#3d3d3d" : "#eee";
        }
        if (this.footer) {
            this.footer.style.background = isDark ? "#252525" : "#fafafa";
        }
        this.updateStyleButtons();
        if (this.colorPreview) {
            this.colorPreview.style.borderColor = isDark ? "#555" : "#ddd";
        }
        if (this.fontSizeSelect) {
            this.fontSizeSelect.style.background = isDark ? "#3d3d3d" : "#ffffff";
            this.fontSizeSelect.style.borderColor = isDark ? "#555" : "#ddd";
            this.fontSizeSelect.style.color = isDark ? "#fff" : "#333";
        }
        const dividers = this.element.querySelectorAll(".text-input-modal-divider");
        dividers.forEach((divider) => {
            (divider as HTMLElement).style.background = isDark ? "#444" : "#ddd";
        });
    }

    public destroy(): void {
        this.overlay.remove();
        this.element.remove();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}