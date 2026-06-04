// core/src/components/LoadingOverlay.ts

import { Theme } from "./types";

export class LoadingOverlay {
    private element: HTMLDivElement;

    constructor(container: HTMLElement, theme: Theme) {
        this.element = this.createElement(theme);
        container.appendChild(this.element);
    }

    private createElement(theme: Theme): HTMLDivElement {
        const div = document.createElement("div");
        div.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 12px;
            display: none;
        `;
        
        const spinner = document.createElement("div");
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid #444;
            border-top: 3px solid #00aaff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;
        div.appendChild(spinner);
        
        const messageSpan = document.createElement("span");
        messageSpan.style.cssText = `
            color: #fff;
            font-size: 13px;
            background: rgba(0,0,0,0.5);
            padding: 4px 12px;
            border-radius: 4px;
        `;
        messageSpan.textContent = "";
        div.appendChild(messageSpan);
        
        // 添加动画样式
        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        return div;
    }

    public show(message: string): void {
        const messageSpan = this.element.querySelector("span:last-child");
        if (messageSpan) {
            messageSpan.textContent = message;
        }
        this.element.style.display = "flex";
    }

    public hide(): void {
        this.element.style.display = "none";
    }

    public updateTheme(theme: Theme): void {
        // 主题不变，保持深色
    }

    public destroy(): void {
        this.element.remove();
    }
}