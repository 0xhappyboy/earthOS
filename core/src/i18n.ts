export type Locale = "en" | "zh";

export interface Translations {
    loading: string;
    changingBasemap: string;
    layers: string;
    layersTitle: string;
    noLayers: string;
    hideLayer: string;
    showLayer: string;
    deleteLayerTitle: string;
    cannotRemoveDrawingLayer: string;
    basemap: string;
    basemapTitle: string;
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
    amapStreets: string;
    amapSatellite: string;
    googleStreets: string;
    googleSatellite: string;
    drawTools: string;
    drawToolsTitle: string;
    drawCircle: string;
    editCircle: string;
    noCirclesToEdit: string;
    close: string;
    zoomInTitle: string;
    zoomOutTitle: string;
    colorTitle: string;
    strokeWidthTitle: string;
    strokeStyleTitle: string;
    deleteTitle: string;
    closeTitle: string;
    solidLine: string;
    dashedLine: string;
    drawingCircle: string;
    editingCircle: string;
    locateMe: string;
    tools: string;
    toolsTitle: string;
    distanceMeasure: string;
    areaMeasure: string;
    clearMeasurements: string;
    measureDistance: string;
    measureArea: string;
    measuring: string;
    distance: string;
    area: string;
    squareMeters: string;
    squareKilometers: string;
    meters: string;
    kilometers: string;
    clickToStartMeasure: string;
    doubleClickToFinish: string;
    measurementLayer: string;
    noMeasurements: string;
    delete: string;
    cancel: string;
}

const zh: Translations = {
    colorTitle: "切换颜色",
    strokeWidthTitle: "调整线宽",
    strokeStyleTitle: "切换线型",
    deleteTitle: "删除图形",
    closeTitle: "关闭",
    solidLine: "实线",
    dashedLine: "虚线",
    loading: "加载地图中...",
    changingBasemap: "切换底图中...",
    layers: "图层管理",
    layersTitle: "图层管理",
    noLayers: "暂无图层",
    hideLayer: "隐藏",
    showLayer: "显示",
    deleteLayerTitle: "删除图层",
    cannotRemoveDrawingLayer: "无法删除绘图图层",
    basemap: "切换底图",
    basemapTitle: "切换底图",
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
    amapStreets: "高德街道图",
    amapSatellite: "高德卫星图",
    googleStreets: "谷歌街道图",
    googleSatellite: "谷歌卫星图",
    drawTools: "绘图工具",
    drawToolsTitle: "绘图工具",
    drawCircle: "绘制圆形",
    editCircle: "编辑圆形",
    noCirclesToEdit: "没有可编辑的圆形，请先绘制一个圆形",
    close: "关闭",
    zoomInTitle: "放大",
    zoomOutTitle: "缩小",
    drawingCircle: "正在绘制圆形...",
    editingCircle: "正在编辑圆形...",
    locateMe: "定位到我",
    tools: "工具",
    toolsTitle: "测量工具",
    distanceMeasure: "距离测量",
    areaMeasure: "面积测量",
    clearMeasurements: "清除测量",
    measureDistance: "测量距离",
    measureArea: "测量面积",
    measuring: "测量中...",
    distance: "距离",
    area: "面积",
    squareMeters: "平方米",
    squareKilometers: "平方公里",
    meters: "米",
    kilometers: "公里",
    clickToStartMeasure: "点击开始测量",
    doubleClickToFinish: "双击完成测量",
    measurementLayer: "测量图层",
    noMeasurements: "暂无测量数据",
    delete: "删除",
    cancel: "取消",
};

const en: Translations = {
    colorTitle: "Change Color",
    strokeWidthTitle: "Stroke Width",
    strokeStyleTitle: "Stroke Style",
    deleteTitle: "Delete",
    closeTitle: "Close",
    solidLine: "Solid",
    dashedLine: "Dashed",
    loading: "Loading Map...",
    changingBasemap: "Changing basemap...",
    layers: "Layers",
    layersTitle: "Layers",
    noLayers: "No layers",
    hideLayer: "Hide",
    showLayer: "Show",
    deleteLayerTitle: "Delete Layer",
    cannotRemoveDrawingLayer: "Cannot remove drawing layer",
    basemap: "Basemap",
    basemapTitle: "Basemap",
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
    amapStreets: "AMap Streets",
    amapSatellite: "AMap Satellite",
    googleStreets: "Google Streets",
    googleSatellite: "Google Satellite",
    drawTools: "Draw Tools",
    drawToolsTitle: "Draw Tools",
    drawCircle: "Draw Circle",
    editCircle: "Edit Circle",
    noCirclesToEdit: "No circles to edit. Please draw a circle first.",
    close: "Close",
    zoomInTitle: "Zoom In",
    zoomOutTitle: "Zoom Out",
    drawingCircle: "Drawing circle...",
    editingCircle: "Editing circle...",
    locateMe: "Locate Me",
    tools: "Tools",
    toolsTitle: "Measure Tools",
    distanceMeasure: "Distance Measure",
    areaMeasure: "Area Measure",
    clearMeasurements: "Clear Measurements",
    measureDistance: "Measure Distance",
    measureArea: "Measure Area",
    measuring: "Measuring...",
    distance: "Distance",
    area: "Area",
    squareMeters: "m²",
    squareKilometers: "km²",
    meters: "m",
    kilometers: "km",
    clickToStartMeasure: "Click to start measuring",
    doubleClickToFinish: "Double click to finish",
    measurementLayer: "Measurement Layer",
    noMeasurements: "No measurements",
    delete: "Delete",
    cancel: "Cancel",
};

export const getTranslation = (locale: Locale): Translations => {
    return locale === "zh" ? zh : en;
};