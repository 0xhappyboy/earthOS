import { Theme } from "./types";
import { Translations } from "../i18n";

export interface ImageInputModalBoxOptions {
    initialImageUrl?: string;
    initialImageData?: string;
    initialWidth?: number;
    initialHeight?: number;
    initialOpacity?: number;
    onConfirm: (data: {
        imageUrl: string;
        imageData?: string;
        width: number;
        height: number;
        opacity: number;
    }) => void;
    onCancel: () => void;
    onDelete?: () => void;
    theme: Theme;
    t: Translations;
    container?: HTMLElement;
}

export class ImageInputModalBox {
    private element: HTMLDivElement;
    private overlay: HTMLDivElement;
    private options: ImageInputModalBoxOptions;
    private urlInput: HTMLInputElement;
    private widthInput: HTMLInputElement;
    private heightInput: HTMLInputElement;
    private opacityInput: HTMLInputElement;
    private opacityValue: HTMLSpanElement;
    private imagePreview: HTMLDivElement;
    private previewImg: HTMLImageElement;
    private uploadBtn: HTMLButtonElement;
    private fileInput: HTMLInputElement;
    private confirmBtn: HTMLButtonElement;
    private cancelBtn: HTMLButtonElement;
    private deleteBtn: HTMLButtonElement;
    private currentImageUrl: string;
    private currentImageData: string | undefined;
    private containerEl: HTMLElement;

    constructor(options: ImageInputModalBoxOptions, position?: { x: number; y: number }) {
        this.options = options;
        this.currentImageUrl = options.initialImageUrl || "";
        this.currentImageData = options.initialImageData;
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
        this.urlInput = this.element.querySelector(".image-input-modal-url") as HTMLInputElement;
        this.widthInput = this.element.querySelector(".image-input-modal-width") as HTMLInputElement;
        this.heightInput = this.element.querySelector(".image-input-modal-height") as HTMLInputElement;
        this.opacityInput = this.element.querySelector(".image-input-modal-opacity") as HTMLInputElement;
        this.opacityValue = this.element.querySelector(".image-input-modal-opacity-value") as HTMLSpanElement;
        this.imagePreview = this.element.querySelector(".image-input-modal-preview") as HTMLDivElement;
        this.previewImg = this.element.querySelector(".image-input-modal-preview-img") as HTMLImageElement;
        this.uploadBtn = this.element.querySelector(".image-input-modal-upload") as HTMLButtonElement;
        this.fileInput = this.element.querySelector(".image-input-modal-file-input") as HTMLInputElement;
        this.confirmBtn = this.element.querySelector(".image-input-modal-confirm") as HTMLButtonElement;
        this.cancelBtn = this.element.querySelector(".image-input-modal-cancel") as HTMLButtonElement;
        this.deleteBtn = this.element.querySelector(".image-input-modal-delete") as HTMLButtonElement;
        this.bindEvents();
        this.updatePreview();
    }

    private createOverlay(): HTMLDivElement {
        const overlay = document.createElement("div");
        overlay.className = "image-input-modal-overlay";
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
        div.className = "image-input-modal-container";
        div.style.cssText = `
            position: fixed;
            z-index: 10001;
            width: 300px;
            background: ${isDark ? "#2d2d2d" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#e0e0e0"};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        const header = this.createHeader(isDark);
        div.appendChild(header);

        const previewArea = this.createPreviewArea(isDark);
        div.appendChild(previewArea);

        const formArea = this.createFormArea(isDark);
        div.appendChild(formArea);

        const footer = this.createFooter(isDark);
        div.appendChild(footer);

        return div;
    }

    private createHeader(isDark: boolean): HTMLDivElement {
        const header = document.createElement("div");
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
        title.textContent = this.options.t.addImage;
        header.appendChild(title);
        return header;
    }

    private createPreviewArea(isDark: boolean): HTMLDivElement {
        const container = document.createElement("div");
        container.style.cssText = `
            padding: 12px;
            border-bottom: 1px solid ${isDark ? "#3d3d3d" : "#eee"};
        `;
        const previewLabel = document.createElement("div");
        previewLabel.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            margin-bottom: 6px;
        `;
        previewLabel.textContent = this.options.t.imagePreview;
        container.appendChild(previewLabel);

        this.imagePreview = document.createElement("div");
        this.imagePreview.className = "image-input-modal-preview";
        this.imagePreview.style.cssText = `
            background: ${isDark ? "#1e1e1e" : "#f0f0f0"};
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100px;
            border: 1px dashed ${isDark ? "#555" : "#ccc"};
        `;
        this.previewImg = document.createElement("img");
        this.previewImg.className = "image-input-modal-preview-img";
        this.previewImg.style.cssText = `
            max-width: 100%;
            max-height: 100px;
            object-fit: contain;
            display: none;
        `;
        this.imagePreview.appendChild(this.previewImg);

        const noImageText = document.createElement("span");
        noImageText.id = "no-image-text";
        noImageText.style.cssText = `
            color: ${isDark ? "#666" : "#999"};
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
        `;
        noImageText.textContent = this.options.t.noImage;
        this.imagePreview.appendChild(noImageText);
        container.appendChild(this.imagePreview);

        return container;
    }

    private createFormArea(isDark: boolean): HTMLDivElement {
        const form = document.createElement("div");
        form.style.cssText = `padding: 8px 12px;`;

        const urlRow = this.createInputRow(this.options.t.imageUrl, "text", this.currentImageUrl, isDark);
        this.urlInput = urlRow.input as HTMLInputElement;
        this.urlInput.className = "image-input-modal-url";
        form.appendChild(urlRow.container);

        const uploadRow = this.createUploadRow(isDark);
        form.appendChild(uploadRow);

        const widthRow = this.createNumberRow(this.options.t.width, "width", this.options.initialWidth || 32, 16, 512, isDark);
        this.widthInput = widthRow.input as HTMLInputElement;
        this.widthInput.className = "image-input-modal-width";
        form.appendChild(widthRow.container);

        const heightRow = this.createNumberRow(this.options.t.height, "height", this.options.initialHeight || 32, 16, 512, isDark);
        this.heightInput = heightRow.input as HTMLInputElement;
        this.heightInput.className = "image-input-modal-height";
        form.appendChild(heightRow.container);

        const opacityRow = this.createOpacityRow(isDark);
        this.opacityInput = opacityRow.input as HTMLInputElement;
        this.opacityInput.className = "image-input-modal-opacity";
        form.appendChild(opacityRow.container);

        return form;
    }

    private createInputRow(
        label: string,
        type: string,
        value: string,
        isDark: boolean
    ): { container: HTMLDivElement; input: HTMLInputElement } {
        const container = document.createElement("div");
        container.style.cssText = `margin-bottom: 8px;`;
        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `
            display: block;
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            margin-bottom: 4px;
        `;
        labelSpan.textContent = label;
        container.appendChild(labelSpan);
        const input = document.createElement("input");
        input.type = type;
        input.value = value;
        input.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            background: ${isDark ? "#1e1e1e" : "#fafafa"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 4px;
            color: ${isDark ? "#fff" : "#333"};
            font-size: 11px;
            box-sizing: border-box;
            outline: none;
        `;
        container.appendChild(input);
        return { container, input };
    }

    private createNumberRow(
        label: string,
        type: string,
        value: number,
        min: number,
        max: number,
        isDark: boolean
    ): { container: HTMLDivElement; input: HTMLInputElement } {
        const container = document.createElement("div");
        container.style.cssText = `
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            width: 50px;
        `;
        labelSpan.textContent = label;
        container.appendChild(labelSpan);
        const input = document.createElement("input");
        input.type = "number";
        input.value = value.toString();
        input.min = min.toString();
        input.max = max.toString();
        input.style.cssText = `
            flex: 1;
            padding: 6px 8px;
            background: ${isDark ? "#1e1e1e" : "#fafafa"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 4px;
            color: ${isDark ? "#fff" : "#333"};
            font-size: 11px;
            outline: none;
        `;
        container.appendChild(input);
        return { container, input };
    }

    private createUploadRow(isDark: boolean): HTMLDivElement {
        const container = document.createElement("div");
        container.style.cssText = `margin-bottom: 8px;`;
        this.uploadBtn = document.createElement("button");
        this.uploadBtn.className = "image-input-modal-upload";
        this.uploadBtn.textContent = this.options.t.uploadImage;
        this.uploadBtn.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            background: ${isDark ? "#3d3d3d" : "#e8e8e8"};
            border: 1px solid ${isDark ? "#555" : "#ddd"};
            border-radius: 4px;
            color: ${isDark ? "#ccc" : "#666"};
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        this.uploadBtn.onmouseenter = () => {
            this.uploadBtn.style.background = isDark ? "#4a4a4a" : "#e0e0e0";
        };
        this.uploadBtn.onmouseleave = () => {
            this.uploadBtn.style.background = isDark ? "#3d3d3d" : "#e8e8e8";
        };
        container.appendChild(this.uploadBtn);

        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.accept = "image/*";
        this.fileInput.className = "image-input-modal-file-input";
        this.fileInput.style.display = "none";
        container.appendChild(this.fileInput);

        this.uploadBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.fileInput) {
                this.fileInput.click();
            }
        };

        this.fileInput.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                this.uploadImage(target.files[0]);
            }
        };

        return container;
    }

    private createOpacityRow(isDark: boolean): { container: HTMLDivElement; input: HTMLInputElement } {
        const container = document.createElement("div");
        container.style.cssText = `
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            width: 50px;
        `;
        labelSpan.textContent = this.options.t.opacity;
        container.appendChild(labelSpan);

        this.opacityInput = document.createElement("input");
        this.opacityInput.type = "range";
        this.opacityInput.min = "0";
        this.opacityInput.max = "100";
        this.opacityInput.value = ((this.options.initialOpacity || 1) * 100).toString();
        this.opacityInput.style.cssText = `
            flex: 1;
            height: 4px;
            -webkit-appearance: none;
            background: ${isDark ? "#444" : "#ddd"};
            border-radius: 2px;
            outline: none;
        `;
        this.opacityInput.oninput = () => {
            if (this.opacityValue) {
                this.opacityValue.textContent = `${this.opacityInput.value}%`;
            }
        };
        container.appendChild(this.opacityInput);

        this.opacityValue = document.createElement("span");
        this.opacityValue.className = "image-input-modal-opacity-value";
        this.opacityValue.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            width: 40px;
            text-align: right;
        `;
        this.opacityValue.textContent = `${this.opacityInput.value}%`;
        container.appendChild(this.opacityValue);

        return { container, input: this.opacityInput };
    }

    private createFooter(isDark: boolean): HTMLDivElement {
        const footer = document.createElement("div");
        footer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 6px;
            padding: 8px 12px;
            background: ${isDark ? "#252525" : "#fafafa"};
            border-top: 1px solid ${isDark ? "#3d3d3d" : "#eee"};
        `;

        if (this.options.onDelete) {
            this.deleteBtn = this.createFooterButton(this.options.t.delete, isDark, false, true);
            this.deleteBtn.className = "image-input-modal-delete";
            footer.appendChild(this.deleteBtn);
        }

        this.cancelBtn = this.createFooterButton(this.options.t.cancel, isDark, false, false);
        this.cancelBtn.className = "image-input-modal-cancel";
        footer.appendChild(this.cancelBtn);

        this.confirmBtn = this.createFooterButton(this.options.t.confirm, isDark, true, false);
        this.confirmBtn.className = "image-input-modal-confirm";
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

    private updatePreview(): void {
        if (!this.imagePreview || !this.previewImg || !this.urlInput) {
            console.warn("updatePreview: required elements not ready");
            return;
        }
        const imageUrl = this.urlInput.value || this.currentImageUrl;
        const noImageText = this.imagePreview.querySelector("#no-image-text");
        if (imageUrl && imageUrl.trim()) {
            this.previewImg.src = imageUrl;
            this.previewImg.style.display = "block";
            if (noImageText) {
                (noImageText as HTMLElement).style.display = "none";
            }
            this.previewImg.onload = () => {
                if (this.widthInput && (!this.options.initialWidth || this.options.initialWidth === 32)) {
                    this.widthInput.value = Math.min(this.previewImg.naturalWidth, 200).toString();
                }
                if (this.heightInput && (!this.options.initialHeight || this.options.initialHeight === 32)) {
                    this.heightInput.value = Math.min(this.previewImg.naturalHeight, 200).toString();
                }
            };
            this.previewImg.onerror = () => {
                this.previewImg.style.display = "none";
                if (noImageText) {
                    (noImageText as HTMLElement).style.display = "flex";
                    (noImageText as HTMLElement).textContent = this.options.t.imageLoadFailed;
                }
            };
        } else {
            this.previewImg.style.display = "none";
            if (noImageText) {
                (noImageText as HTMLElement).style.display = "flex";
                (noImageText as HTMLElement).textContent = this.options.t.noImage;
            }
        }
    }

    private uploadImage(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            this.currentImageData = base64;
            this.currentImageUrl = base64;
            if (this.urlInput) {
                this.urlInput.value = base64;
            }
            this.updatePreview();
        };
        reader.readAsDataURL(file);
    }

    private centerModal(): void {
        const left = (window.innerWidth - 300) / 2;
        const top = (window.innerHeight - 420) / 2;
        this.element.style.left = `${Math.max(10, left)}px`;
        this.element.style.top = `${Math.max(10, top)}px`;
    }

    private setPosition(position: { x: number; y: number }): void {
        let left = position.x - 150;
        let top = position.y - 200;
        left = Math.max(10, Math.min(left, window.innerWidth - 310));
        top = Math.max(10, Math.min(top, window.innerHeight - 420));
        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    private bindEvents(): void {
        if (!this.urlInput || !this.confirmBtn || !this.cancelBtn) {
            console.error("ImageInputModalBox: Required elements not found");
            return;
        }
        this.urlInput.addEventListener("input", () => {
            this.currentImageUrl = this.urlInput.value;
            this.currentImageData = undefined;
            this.updatePreview();
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
            const imageUrl = this.urlInput.value.trim();
            if (imageUrl) {
                this.options.onConfirm({
                    imageUrl: imageUrl,
                    imageData: this.currentImageData,
                    width: this.widthInput ? parseInt(this.widthInput.value) || 32 : 32,
                    height: this.heightInput ? parseInt(this.heightInput.value) || 32 : 32,
                    opacity: this.opacityInput ? parseInt(this.opacityInput.value) / 100 : 1,
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

        if (this.widthInput) {
            this.widthInput.addEventListener("input", () => {
                this.updatePreviewSize();
            });
        }

        if (this.heightInput) {
            this.heightInput.addEventListener("input", () => {
                this.updatePreviewSize();
            });
        }

        if (this.opacityInput && this.opacityValue) {
            this.opacityInput.addEventListener("input", () => {
                this.opacityValue.textContent = `${this.opacityInput.value}%`;
                this.updatePreviewOpacity();
            });
        }

        this.element.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && document.body.contains(this.element)) {
                this.options.onCancel();
                this.destroy();
            }
        });
    }

    private updatePreviewSize(): void {
        const width = parseInt(this.widthInput.value) || 32;
        const height = parseInt(this.heightInput.value) || 32;
        this.previewImg.style.maxWidth = `${Math.min(width, 200)}px`;
        this.previewImg.style.maxHeight = `${Math.min(height, 200)}px`;
    }

    private updatePreviewOpacity(): void {
        const opacity = parseInt(this.opacityInput.value) / 100;
        this.previewImg.style.opacity = opacity.toString();
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        const isDark = theme === "dark";
        this.element.style.background = isDark ? "#2d2d2d" : "#ffffff";
        this.element.style.borderColor = isDark ? "#444" : "#e0e0e0";
    }

    public destroy(): void {
        this.overlay.remove();
        this.element.remove();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}