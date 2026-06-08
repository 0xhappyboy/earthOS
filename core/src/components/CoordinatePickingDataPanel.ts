import { Theme } from "./types";
import { Translations } from "../i18n";

export interface PointData {
    id: string;
    name: string;
    longitude: number;
    latitude: number;
    timestamp: number;
}

export interface LineData {
    id: string;
    name: string;
    points: { longitude: number; latitude: number }[];
    timestamp: number;
}

export interface PolygonData {
    id: string;
    name: string;
    points: { longitude: number; latitude: number }[];
    timestamp: number;
}

export interface CoordinatePickingDataPanelOptions {
    onClose: () => void;
    onSelectCategory: (category: string) => void;
    onLocatePoint?: (longitude: number, latitude: number) => void;
    onLocateLine?: (points: { longitude: number; latitude: number }[]) => void;
    onLocatePolygon?: (points: { longitude: number; latitude: number }[]) => void;
    theme: Theme;
    t: Translations;
    getPointData?: () => PointData[];
    getLineData?: () => LineData[];
    getPolygonData?: () => PolygonData[];
}

export class CoordinatePickingDataPanel {
    private element: HTMLDivElement;
    private options: CoordinatePickingDataPanelOptions;
    private activeCategory: string | null = null;
    private detailPanel: HTMLDivElement | null = null;

    constructor(options: CoordinatePickingDataPanelOptions) {
        this.options = options;
        this.element = this.createElement();
        this.render();
    }

    private createElement(): HTMLDivElement {
        const isDark = this.options.theme === "dark";
        const panel = document.createElement("div");
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 60px;
            width: 280px;
            max-height: 500px;
            background: ${isDark ? "#1e1e1e" : "#ffffff"};
            border: 1px solid ${isDark ? "#333" : "#e0e0e0"};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        return panel;
    }

    private getPointData(): PointData[] {
        if (this.options.getPointData) {
            return this.options.getPointData();
        }
        return [];
    }

    private getLineData(): LineData[] {
        if (this.options.getLineData) {
            return this.options.getLineData();
        }
        return [];
    }

    private getPolygonData(): PolygonData[] {
        if (this.options.getPolygonData) {
            return this.options.getPolygonData();
        }
        return [];
    }

    private render(): void {
        this.element.innerHTML = "";
        const isDark = this.options.theme === "dark";

        const header = this.createHeader(isDark);
        this.element.appendChild(header);

        const menuContainer = document.createElement("div");
        menuContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
        `;

        const pointData = this.getPointData();
        const lineData = this.getLineData();
        const polygonData = this.getPolygonData();

        const categories = [
            { id: "point", label: "点数据", icon: "📍", count: pointData.length },
            { id: "line", label: "线数据", icon: "📏", count: lineData.length },
            { id: "polygon", label: "面数据", icon: "🔲", count: polygonData.length }
        ];

        categories.forEach((category) => {
            const isActive = this.activeCategory === category.id;
            let data: any[] = [];
            if (category.id === "point") data = pointData;
            else if (category.id === "line") data = lineData;
            else if (category.id === "polygon") data = polygonData;

            const menuItem = this.createMenuItem(category, isDark, isActive, data.length);
            menuContainer.appendChild(menuItem);

            if (isActive) {
                const subMenuContainer = this.createSubMenu(data, category.id, isDark);
                menuContainer.appendChild(subMenuContainer);
            }
        });

        this.element.appendChild(menuContainer);
    }

    private createHeader(isDark: boolean): HTMLDivElement {
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid ${isDark ? "#333" : "#e0e0e0"};
            background: ${isDark ? "#2d2d2d" : "#f5f5f5"};
            flex-shrink: 0;
        `;

        const title = document.createElement("span");
        title.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-weight: 500;`;
        title.textContent = "坐标数据";
        header.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2px;
            color: ${isDark ? "#ccc" : "#666"};
        `;
        closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        closeBtn.onclick = () => {
            this.hideDetailPanel();
            this.options.onClose();
        };
        header.appendChild(closeBtn);

        return header;
    }

    private createMenuItem(category: any, isDark: boolean, isActive: boolean, dataCount: number): HTMLDivElement {
        const menuItem = document.createElement("div");
        menuItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            cursor: pointer;
            background: ${isActive ? (isDark ? "#2a4a6a" : "#e3f2fd") : "transparent"};
            border-left: ${isActive ? "3px solid #00aaff" : "3px solid transparent"};
            transition: all 0.2s;
        `;

        menuItem.onmouseenter = () => {
            if (!isActive) {
                menuItem.style.background = isDark ? "#2a2a2a" : "#f5f5f5";
            }
        };
        menuItem.onmouseleave = () => {
            if (!isActive) {
                menuItem.style.background = "transparent";
            }
        };
        menuItem.onclick = () => {
            if (this.activeCategory === category.id) {
                this.activeCategory = null;
            } else {
                this.activeCategory = category.id;
            }
            this.hideDetailPanel();
            this.render();
            this.options.onSelectCategory(this.activeCategory || "");
        };

        const iconSpan = document.createElement("span");
        iconSpan.style.cssText = `font-size: 14px;`;
        iconSpan.textContent = category.icon;
        menuItem.appendChild(iconSpan);

        const labelSpan = document.createElement("span");
        labelSpan.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 12px; flex: 1;`;
        labelSpan.textContent = `${category.label} (${dataCount})`;
        menuItem.appendChild(labelSpan);

        const arrowSpan = document.createElement("span");
        arrowSpan.style.cssText = `color: ${isDark ? "#888" : "#999"}; font-size: 10px;`;
        arrowSpan.textContent = isActive ? "▼" : "▶";
        menuItem.appendChild(arrowSpan);

        return menuItem;
    }

    private createSubMenu(data: any[], categoryId: string, isDark: boolean): HTMLDivElement {
        const subMenuContainer = document.createElement("div");
        subMenuContainer.style.cssText = `
            background: ${isDark ? "#252525" : "#fafafa"};
            border-top: 1px solid ${isDark ? "#333" : "#eee"};
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            max-height: 300px;
            overflow-y: auto;
        `;

        if (data.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.style.cssText = `
                padding: 16px;
                text-align: center;
                color: ${isDark ? "#888" : "#999"};
                font-size: 11px;
            `;
            emptyState.textContent = "暂无数据，请先使用坐标拾取工具";
            subMenuContainer.appendChild(emptyState);
        } else {
            data.forEach((item, index) => {
                const dataItem = this.createDataItem(item, categoryId, index, isDark);
                subMenuContainer.appendChild(dataItem);
            });
        }

        return subMenuContainer;
    }

    private createDataItem(data: any, categoryId: string, index: number, isDark: boolean): HTMLDivElement {
        const item = document.createElement("div");
        item.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px 8px 24px;
            border-bottom: 1px solid ${isDark ? "#333" : "#eee"};
            cursor: pointer;
            transition: all 0.2s;
        `;

        item.onmouseenter = () => {
            item.style.background = isDark ? "#2a2a2a" : "#f0f0f0";
        };
        item.onmouseleave = () => {
            item.style.background = "transparent";
        };

        const content = document.createElement("div");
        content.style.cssText = "flex: 1;";

        const nameText = document.createElement("div");
        nameText.style.cssText = `
            color: ${isDark ? "#fff" : "#333"};
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
        `;
        nameText.textContent = data.name;
        content.appendChild(nameText);

        let infoText = "";
        if (categoryId === "point") {
            infoText = `${data.longitude.toFixed(6)}, ${data.latitude.toFixed(6)}`;
        } else if (categoryId === "line") {
            infoText = `${data.points.length} 个点`;
        } else if (categoryId === "polygon") {
            infoText = `${data.points.length} 个点`;
        }

        const coordText = document.createElement("div");
        coordText.style.cssText = `
            color: ${isDark ? "#aaa" : "#666"};
            font-size: 10px;
            font-family: monospace;
        `;
        coordText.textContent = infoText;
        content.appendChild(coordText);

        item.appendChild(content);

        const detailBtn = document.createElement("button");
        detailBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            transition: all 0.2s;
            color: ${isDark ? "#00aaff" : "#0066cc"};
            margin-left: 8px;
        `;
        detailBtn.textContent = "详情";
        detailBtn.onmouseenter = () => {
            detailBtn.style.background = isDark ? "#444" : "#e0e0e0";
        };
        detailBtn.onmouseleave = () => {
            detailBtn.style.background = "none";
        };
        detailBtn.onclick = (e) => {
            e.stopPropagation();
            this.showDetailPanel(data, categoryId);
        };
        item.appendChild(detailBtn);

        item.onclick = () => {
            this.showDetailPanel(data, categoryId);
        };

        return item;
    }

    private showDetailPanel(data: any, categoryId: string): void {
        this.hideDetailPanel();

        const isDark = this.options.theme === "dark";
        const mainPanelRect = this.element.getBoundingClientRect();

        this.detailPanel = document.createElement("div");
        this.detailPanel.style.cssText = `
            position: fixed;
            left: ${mainPanelRect.left - 305}px;
            top: ${mainPanelRect.top}px;
            width: 300px;
            background: ${isDark ? "#1e1e1e" : "#ffffff"};
            border: 1px solid ${isDark ? "#444" : "#ddd"};
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 1001;
            overflow: hidden;
        `;

        const detailContent = document.createElement("div");

        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background: ${isDark ? "#2d2d2d" : "#f5f5f5"};
            border-bottom: 1px solid ${isDark ? "#444" : "#ddd"};
        `;

        const title = document.createElement("span");
        title.style.cssText = `color: ${isDark ? "#fff" : "#333"}; font-size: 13px; font-weight: 600;`;
        title.textContent = "坐标详情";
        header.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: ${isDark ? "#ccc" : "#666"};
            font-size: 16px;
        `;
        closeBtn.innerHTML = "✕";
        closeBtn.onclick = () => this.hideDetailPanel();
        header.appendChild(closeBtn);

        detailContent.appendChild(header);

        const body = document.createElement("div");
        body.style.cssText = `padding: 12px;`;

        let bodyHtml = `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">名称</div>
                <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 14px; font-weight: 500;">${data.name}</div>
            </div>
        `;

        if (categoryId === "point") {
            bodyHtml += `
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">经度 (Longitude)</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 13px; font-family: monospace;">${data.longitude.toFixed(8)}</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">纬度 (Latitude)</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 13px; font-family: monospace;">${data.latitude.toFixed(8)}</div>
                </div>
            `;
        } else if (categoryId === "line") {
            bodyHtml += `
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">线段数量</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 13px;">${data.points.length} 个点</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">起点坐标</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-family: monospace;">${data.points[0]?.longitude.toFixed(6)}, ${data.points[0]?.latitude.toFixed(6)}</div>
                </div>
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">终点坐标</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 12px; font-family: monospace;">${data.points[data.points.length - 1]?.longitude.toFixed(6)}, ${data.points[data.points.length - 1]?.latitude.toFixed(6)}</div>
                </div>
            `;
        } else if (categoryId === "polygon") {
            bodyHtml += `
                <div style="margin-bottom: 12px;">
                    <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">顶点数量</div>
                    <div style="color: ${isDark ? "#fff" : "#333"}; font-size: 13px;">${data.points.length} 个点</div>
                </div>
            `;
        }

        bodyHtml += `
            <div style="margin-bottom: 12px;">
                <div style="color: ${isDark ? "#888" : "#666"}; font-size: 11px; margin-bottom: 4px;">创建时间</div>
                <div style="color: ${isDark ? "#ddd" : "#555"}; font-size: 11px;">${new Date(data.timestamp).toLocaleString()}</div>
            </div>
        `;

        body.innerHTML = bodyHtml;
        detailContent.appendChild(body);

        const footer = document.createElement("div");
        footer.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 10px 12px;
            border-top: 1px solid ${isDark ? "#444" : "#ddd"};
            background: ${isDark ? "#252525" : "#fafafa"};
        `;

        const locateBtn = document.createElement("button");
        locateBtn.style.cssText = `
            flex: 1;
            background: #00aaff;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            transition: all 0.2s;
        `;
        locateBtn.textContent = "📍 在地图上定位";
        locateBtn.onmouseenter = () => {
            locateBtn.style.background = "#0088cc";
        };
        locateBtn.onmouseleave = () => {
            locateBtn.style.background = "#00aaff";
        };
        locateBtn.onclick = () => {
            if (categoryId === "point" && this.options.onLocatePoint) {
                this.options.onLocatePoint(data.longitude, data.latitude);
            } else if (categoryId === "line" && this.options.onLocateLine) {
                this.options.onLocateLine(data.points);
            } else if (categoryId === "polygon" && this.options.onLocatePolygon) {
                this.options.onLocatePolygon(data.points);
            }
            this.hideDetailPanel();
        };

        const copyBtn = document.createElement("button");
        copyBtn.style.cssText = `
            flex: 1;
            background: ${isDark ? "#444" : "#e0e0e0"};
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 4px;
            color: ${isDark ? "#fff" : "#333"};
            font-size: 12px;
            transition: all 0.2s;
        `;
        copyBtn.textContent = "📋 复制坐标";
        copyBtn.onmouseenter = () => {
            copyBtn.style.background = isDark ? "#555" : "#d0d0d0";
        };
        copyBtn.onmouseleave = () => {
            copyBtn.style.background = isDark ? "#444" : "#e0e0e0";
        };
        copyBtn.onclick = () => {
            let text = "";
            if (categoryId === "point") {
                text = `${data.longitude.toFixed(8)}, ${data.latitude.toFixed(8)}`;
            } else if (categoryId === "line") {
                text = data.points.map((p: any) => `${p.longitude.toFixed(8)}, ${p.latitude.toFixed(8)}`).join("\n");
            } else if (categoryId === "polygon") {
                text = data.points.map((p: any) => `${p.longitude.toFixed(8)}, ${p.latitude.toFixed(8)}`).join("\n");
            }
            navigator.clipboard.writeText(text);
            this.showToast("已复制坐标到剪贴板");
        };

        footer.appendChild(locateBtn);
        footer.appendChild(copyBtn);
        detailContent.appendChild(footer);

        this.detailPanel.appendChild(detailContent);
        document.body.appendChild(this.detailPanel);

        const closeOnOutsideClick = (e: MouseEvent) => {
            if (this.detailPanel && !this.detailPanel.contains(e.target as Node) && !this.element.contains(e.target as Node)) {
                this.hideDetailPanel();
                document.removeEventListener("click", closeOnOutsideClick);
            }
        };
        setTimeout(() => {
            document.addEventListener("click", closeOnOutsideClick);
        }, 100);
    }

    private hideDetailPanel(): void {
        if (this.detailPanel) {
            this.detailPanel.remove();
            this.detailPanel = null;
        }
    }

    private showToast(message: string): void {
        const toast = document.createElement("div");
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            white-space: nowrap;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    public refresh(): void {
        this.render();
    }

    public setActiveCategory(category: string | null): void {
        this.activeCategory = category;
        this.render();
    }

    public updateTheme(theme: Theme): void {
        this.options.theme = theme;
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    public destroy(): void {
        this.hideDetailPanel();
        this.element.remove();
    }
}