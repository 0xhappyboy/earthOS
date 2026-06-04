// core/src/components/DrawToolsPanel.ts

import { Icons } from "./icons";
import { Theme } from "./types";
import { Translations } from "../i18n";

export interface DrawToolsPanelProps {
    onDrawCircle: () => void;
    onEditCircle: () => void;
    theme: Theme;
    t: Translations;
}

export class DrawToolsPanel {
    private element: HTMLDivElement;
    private props: DrawToolsPanelProps;

    constructor(props: DrawToolsPanelProps) {
        this.props = props;
        this.element = this.createElement();
        this.render();
    }

    private createElement(): HTMLDivElement {
        const div = document.createElement("div");
        div.style.cssText = `
            width: 100%;
            height: 100%;
        `;
        return div;
    }

    private render(): void {
        this.element.innerHTML = "";
        const isDark = this.props.theme === "dark";
        
        // 绘制圆形
        const drawRow = document.createElement("div");
        drawRow.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            transition: all 0.2s;
        `;
        drawRow.onmouseenter = () => { drawRow.style.background = isDark ? "#2a2a2a" : "#f5f5f5"; };
        drawRow.onmouseleave = () => { drawRow.style.background = "transparent"; };
        drawRow.onclick = () => this.props.onDrawCircle();
        
        const drawIcon = document.createElement("span");
        drawIcon.innerHTML = Icons.Circle;
        drawRow.appendChild(drawIcon);
        
        const drawText = document.createElement("span");
        drawText.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px;`;
        drawText.textContent = this.props.t.drawCircle;
        drawRow.appendChild(drawText);
        
        this.element.appendChild(drawRow);
    }

    public updateTheme(theme: Theme): void {
        this.props.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}