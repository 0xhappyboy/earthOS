export type Locale = "en" | "zh";

export interface Translations {
    confirm: string;
    addImage: string;
    imageUrl: string;
    uploadImage: string;
    width: string;
    height: string;
    opacity: string;
    drawImage: string;
    drawCoordinatePick: string;
    coordinatePick: string;
    coordinateList: string;
    noCoordinates: string;
    clearAll: string;
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
    drawRectangle: string;
    drawTriangle: string;
    editShape: string;
    editingRectangle: string;
    editingTriangle: string;
    circleDrawLayer: string;
    rectangleDrawLayer: string;
    triangleDrawLayer: string;
    distanceMeasurementLayer: string;
    areaMeasurementLayer: string;
    drawFreehandLine: string;
    drawFreehandPolygon: string;
    drawEllipse: string;
    drawMarker: string;
    drawText: string;
    drawArrow: string;
    drawLine: string;
    drawBezier: string;
    drawSector: string;
}

const zh: Translations = {
    confirm: "确定",
    addImage: "添加图片",
    imageUrl: "图片URL",
    uploadImage: "上传图片",
    width: "宽度",
    height: "高度",
    opacity: "透明度",
    delete: "删除",
    drawImage: "图片标注",
    drawCoordinatePick: "坐标拾取",
    coordinatePick: "坐标拾取",
    coordinateList: "坐标列表",
    noCoordinates: "暂无拾取坐标",
    clearAll: "清空全部",
    drawLine: "线段",
    drawBezier: "贝塞尔曲线",
    drawSector: "扇形",
    drawFreehandLine: "手绘线",
    drawFreehandPolygon: "手绘多边形",
    drawEllipse: "椭圆",
    drawMarker: "标记点",
    drawText: "文字标注",
    drawArrow: "箭头",
    circleDrawLayer: "圆形绘制图层",
    rectangleDrawLayer: "矩形绘制图层",
    triangleDrawLayer: "三角形绘制图层",
    distanceMeasurementLayer: "距离测量图层",
    areaMeasurementLayer: "面积测量图层",
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
    editingRectangle: "正在绘制矩形...",
    editingTriangle: "正在绘制三角形...",
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
    cancel: "取消",
    drawRectangle: "绘制矩形",
    drawTriangle: "绘制三角形",
    editShape: "编辑图形",
};

const en: Translations = {
    confirm: "Confirm",
    addImage: "Add Image",
    imageUrl: "Image URL",
    uploadImage: "Upload Image",
    width: "Width",
    height: "Height",
    opacity: "Opacity",
    drawImage: "Image",
    drawCoordinatePick: "Coordinate Pick",
    coordinatePick: "Coordinate Pick",
    coordinateList: "Coordinate List",
    noCoordinates: "No coordinates picked",
    clearAll: "Clear All",
    drawLine: "Line",
    drawBezier: "Bezier Curve",
    drawSector: "Sector",
    drawFreehandLine: "Freehand Line",
    drawFreehandPolygon: "Freehand Polygon",
    drawEllipse: "Ellipse",
    drawMarker: "Marker",
    drawText: "Text Label",
    drawArrow: "Arrow",
    circleDrawLayer: "Circle Draw Layer",
    rectangleDrawLayer: "Rectangle Draw Layer",
    triangleDrawLayer: "Triangle Draw Layer",
    distanceMeasurementLayer: "Distance Measurement Layer",
    areaMeasurementLayer: "Area Measurement Layer",
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
    drawingCircle: "Drawing Circle...",
    editingCircle: "Editing circle...",
    editingRectangle: "Drawing Rectangle...",
    editingTriangle: "Drawing Triangle...",
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
    drawRectangle: "Draw Rectangle",
    drawTriangle: "Draw Triangle",
    editShape: "Edit Shape",
};

export const getTranslation = (locale: Locale): Translations => {
    return locale === "zh" ? zh : en;
};