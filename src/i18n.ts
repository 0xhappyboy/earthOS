export type Locale = "en" | "zh";

export interface Translations {
    changingBasemap: string;
    hideLayer: string;
    showLayer: string;
    deleteLayerTitle: string;
    close: string;
    loading: string;
    layers: string;
    basemap: string;
    drawTools: string;
    drawCircle: string;
    editCircle: string;
    noLayers: string;
    cannotRemoveDrawingLayer: string;
    noCirclesToEdit: string;
    satellite: string;
    streets: string;
    topographic: string;
    oceans: string;
    lightGray: string;
    darkGray: string;
    nationalGeographic: string;
    terrain: string;
    hybrid: string;
    imagery: string;
    physical: string;
    layersTitle: string;
    basemapTitle: string;
    drawToolsTitle: string;
    zoomInTitle: string;
    zoomOutTitle: string;
}

const zh: Translations = {
    changingBasemap: "切换底图中...",
    hideLayer: "隐藏",
    showLayer: "显示",
    deleteLayerTitle: "删除图层",
    close: "关闭",
    loading: "加载地图中...",
    layers: "图层管理",
    basemap: "切换底图",
    drawTools: "绘图工具",
    drawCircle: "绘制圆形",
    editCircle: "编辑圆形",
    noLayers: "暂无图层",
    cannotRemoveDrawingLayer: "无法删除绘图图层",
    noCirclesToEdit: "没有可编辑的圆形，请先绘制一个圆形",
    satellite: "卫星图",
    streets: "街道图",
    topographic: "地形图",
    oceans: "海洋图",
    lightGray: "浅灰图",
    darkGray: "深色图",
    nationalGeographic: "国家地理",
    terrain: "地形阴影",
    hybrid: "混合图",
    imagery: "纯影像",
    physical: "物理地形",
    layersTitle: "图层管理",
    basemapTitle: "切换底图",
    drawToolsTitle: "绘图工具",
    zoomInTitle: "放大",
    zoomOutTitle: "缩小",
};

const en: Translations = {
    changingBasemap: "Changing basemap...",
    hideLayer: "Hide",
    showLayer: "Show",
    deleteLayerTitle: "Delete Layer",
    close: "Close",
    loading: "Loading Map...",
    layers: "Layers",
    basemap: "Basemap",
    drawTools: "Draw Tools",
    drawCircle: "Draw Circle",
    editCircle: "Edit Circle",
    noLayers: "No layers",
    cannotRemoveDrawingLayer: "Cannot remove drawing layer",
    noCirclesToEdit: "No circles to edit. Please draw a circle first.",
    satellite: "Satellite",
    streets: "Streets",
    topographic: "Topographic",
    oceans: "Oceans",
    lightGray: "Light Gray",
    darkGray: "Dark Gray",
    nationalGeographic: "National Geographic",
    terrain: "Terrain",
    hybrid: "Hybrid",
    imagery: "Imagery",
    physical: "Physical",
    layersTitle: "Layers",
    basemapTitle: "Basemap",
    drawToolsTitle: "Draw Tools",
    zoomInTitle: "Zoom In",
    zoomOutTitle: "Zoom Out",
};

export const getTranslation = (locale: Locale): Translations => {
    return locale === "zh" ? zh : en;
};