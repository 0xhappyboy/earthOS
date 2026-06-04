import { Icons } from "./icons";
import { BasemapOption, Theme } from "./types";
import { BasemapTypeEnum } from "../types";
import { Translations } from "../i18n";

export interface BasemapOptionsProps {
    currentBasemap: BasemapTypeEnum;
    onSelect: (basemap: BasemapTypeEnum) => void;
    theme: Theme;
    t: Translations;
    options: BasemapOption[];
}

export class BasemapOptions {
    private element: HTMLDivElement;
    private props: BasemapOptionsProps;

    constructor(props: BasemapOptionsProps) {
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
        
        for (const option of this.props.options) {
            const row = document.createElement("div");
            row.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                cursor: pointer;
                background: ${this.props.currentBasemap === option.value ? (isDark ? "#2a2a2a" : "#f0f0f0") : "transparent"};
                border-left: ${this.props.currentBasemap === option.value ? "3px solid #00aaff" : "3px solid transparent"};
                transition: all 0.2s;
            `;
            
            row.onmouseenter = () => {
                if (this.props.currentBasemap !== option.value) {
                    row.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
                }
            };
            row.onmouseleave = () => {
                if (this.props.currentBasemap !== option.value) {
                    row.style.background = "transparent";
                }
            };
            row.onclick = () => this.props.onSelect(option.value);
            
            const iconSpan = document.createElement("span");
            iconSpan.style.cssText = `font-size: 14px;`;
            iconSpan.textContent = option.icon;
            row.appendChild(iconSpan);
            
            const labelSpan = document.createElement("span");
            labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
            labelSpan.textContent = option.label;
            row.appendChild(labelSpan);
            
            if (this.props.currentBasemap === option.value) {
                const checkSpan = document.createElement("span");
                checkSpan.innerHTML = Icons.Check;
                checkSpan.style.cssText = `color: #00aaff;`;
                row.appendChild(checkSpan);
            }
            
            this.element.appendChild(row);
        }
    }

    public updateCurrentBasemap(basemap: BasemapTypeEnum): void {
        this.props.currentBasemap = basemap;
        this.render();
    }

    public updateTheme(theme: Theme): void {
        this.props.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }
}