export type Locale = "en" | "zh";

export interface Translations {
    pleaseEnterText: string;
    longitude: string;
    latitude: string;
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
    pointData: string;
    lineData: string;
    polygonData: string;
    coordinateData: string;
    details: string;
    copyCoordinates: string;
    locateOnMap: string;
    startPoint: string;
    endPoint: string;
    vertexCount: string;
    createdTime: string;
    noDataAvailable: string;
    pleaseUseCoordinatePickTool: string;
    coordinatesCopied: string;
    locatedToPoint: string;
    locatedToLine: string;
    locatedToPolygon: string;
    allCoordinatesCleared: string;
    noCoordinateData: string;
    copyAllPointCoordinates: string;
    pointPickSuccess: string;
    linePickSuccess: string;
    polygonPickSuccess: string;
    drawingStatusCancelHint: string;
    editingText: string;
    fontSize: string;
    color: string;
    bold: string;
    italic: string;
    imagePreview: string;
    noImage: string;
    imageLoadFailed: string;
    image: string;
    cancelDrawing: string;
    drawingRectangle: string;
    drawingTriangle: string;
    drawingFreehand: string;
    drawingFreehandPolygon: string;
    drawingEllipse: string;
    addingMarker: string;
    addingText: string;
    drawingArrow: string;
    drawingLine: string;
    drawingBezier: string;
    drawingSector: string;
    drawing: string;
    pressEscToCancel: string;
    clickMapToPickPoint: string;
    clickMapToDrawLine: string;
    clickMapToDrawPolygon: string;
    doubleClickToFinishPick: string;
    editText: string;
    strokeWidth: string;
    strokeStyle: string;
    dragToMove: string;
    noImagePreview: string;
    uploadFromComputer: string;
    enterImageUrl: string;
    deleteImage: string;
    cancelEdit: string;
    save: string;
    ok: string;
    lineTool: string;
    arrowTool: string;
    bezierTool: string;
    ellipseTool: string;
    rectangleTool: string;
    triangleTool: string;
    sectorTool: string;
    freehandTool: string;
    freehandPolygonTool: string;
    markerTool: string;
    textTool: string;
    imageTool: string;
    points: string;
    pointsCount: string;
    featureNotFound: string;
    cannotGetMapTarget: string;
    cannotGetPixelFromCoordinate: string;
    bezierFeatureNotFound: string;
    noSourceAvailable: string;
    dataLayers: string;
    drawLayers: string;
    toolLayers: string;
    freehandDrawLayer: string;
    ellipseDrawLayer: string;
    markerDrawLayer: string;
    textDrawLayer: string;
    imageDrawLayer: string;
    arrowDrawLayer: string;
    lineDrawLayer: string;
    bezierDrawLayer: string;
    sectorDrawLayer: string;
    pointPickLayer: string;
    linePickLayer: string;
    polygonPickLayer: string;
    featureType: string;
    properties: string;
    linePick: {
        default_name: string,
        label_prefix: string,
        highlight_text: string
    };
    pointPick: {
        default_name: string,
        label_text: string
    };
    polygonPick: {
        default_name: string,
        label_prefix: string,
        highlight_text: string
    };
}

const zh: Translations = {
    linePick: {
        default_name: "线拾取",
        label_prefix: "线",
        highlight_text: "● 线拾取 ●"
    },
    pointPick: {
        default_name: "点拾取",
        label_text: "坐标拾取"
    },
    polygonPick: {
        default_name: "面拾取",
        label_prefix: "面",
        highlight_text: "● 面拾取 ●"
    },
    featureType: "要素类型",
    properties: "属性",
    freehandDrawLayer: "手绘线图层",
    ellipseDrawLayer: "椭圆绘制图层",
    markerDrawLayer: "标记点图层",
    textDrawLayer: "文字标注图层",
    imageDrawLayer: "图片标注图层",
    arrowDrawLayer: "箭头绘制图层",
    lineDrawLayer: "线段绘制图层",
    bezierDrawLayer: "贝塞尔曲线图层",
    sectorDrawLayer: "扇形绘制图层",
    pointPickLayer: "点坐标拾取图层",
    linePickLayer: "线坐标拾取图层",
    polygonPickLayer: "面坐标拾取图层",
    dataLayers: "数据图层",
    drawLayers: "绘图图层",
    toolLayers: "工具图层",
    pleaseEnterText: "请输入文字",
    longitude: "经度",
    latitude: "纬度",
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
    drawingCircle: "正在绘制圆形",
    editingCircle: "正在编辑圆形",
    editingRectangle: "正在绘制矩形",
    editingTriangle: "正在绘制三角形",
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
    pointData: "点数据",
    lineData: "线数据",
    polygonData: "面数据",
    coordinateData: "坐标数据",
    details: "详情",
    copyCoordinates: "复制坐标",
    locateOnMap: "在地图上定位",
    startPoint: "起点坐标",
    endPoint: "终点坐标",
    vertexCount: "顶点数量",
    createdTime: "创建时间",
    noDataAvailable: "暂无数据",
    pleaseUseCoordinatePickTool: "暂无数据，请先使用坐标拾取工具",
    coordinatesCopied: "已复制坐标到剪贴板",
    locatedToPoint: "已定位到",
    locatedToLine: "已定位到线，包含",
    locatedToPolygon: "已定位到面，包含",
    allCoordinatesCleared: "已清除所有坐标拾取数据",
    noCoordinateData: "暂无拾取坐标数据",
    copyAllPointCoordinates: "点击确定复制全部点坐标",
    pointPickSuccess: "已拾取点坐标",
    linePickSuccess: "已拾取线坐标，共",
    polygonPickSuccess: "已拾取面坐标，共",
    drawingStatusCancelHint: "按 ESC 取消绘制",
    editingText: "编辑文字",
    fontSize: "字号",
    color: "颜色",
    bold: "粗体",
    italic: "斜体",
    imagePreview: "预览",
    noImage: "暂无图片",
    imageLoadFailed: "图片加载失败",
    image: "图片",
    cancelDrawing: "取消绘制",
    drawingRectangle: "正在绘制矩形",
    drawingTriangle: "正在绘制三角形",
    drawingFreehand: "正在手绘线",
    drawingFreehandPolygon: "正在手绘多边形",
    drawingEllipse: "正在绘制椭圆",
    addingMarker: "添加标记点",
    addingText: "添加文字标注",
    drawingArrow: "正在绘制箭头",
    drawingLine: "正在绘制线段",
    drawingBezier: "正在绘制贝塞尔曲线",
    drawingSector: "正在绘制扇形",
    drawing: "正在绘制",
    pressEscToCancel: " (按 ESC 取消绘制)",
    clickMapToPickPoint: "点击地图拾取点坐标 (单击完成拾取)",
    clickMapToDrawLine: "点击地图绘制线 (双击完成拾取)",
    clickMapToDrawPolygon: "点击地图绘制面 (双击完成拾取)",
    doubleClickToFinishPick: "双击完成拾取",
    editText: "编辑文字",
    strokeWidth: "线宽",
    strokeStyle: "线型",
    dragToMove: "拖动移动",
    noImagePreview: "暂无图片",
    uploadFromComputer: "从电脑上传",
    enterImageUrl: "输入图片URL",
    deleteImage: "删除图片",
    cancelEdit: "取消编辑",
    save: "保存",
    ok: "确定",
    lineTool: "线段",
    arrowTool: "箭头",
    bezierTool: "贝塞尔曲线",
    ellipseTool: "椭圆",
    rectangleTool: "矩形",
    triangleTool: "三角形",
    sectorTool: "扇形",
    freehandTool: "手绘线",
    freehandPolygonTool: "手绘多边形",
    markerTool: "标记点",
    textTool: "文字标注",
    imageTool: "图片标注",
    points: "个点",
    pointsCount: "个",
    featureNotFound: "未找到要素",
    cannotGetMapTarget: "无法获取地图容器元素",
    cannotGetPixelFromCoordinate: "无法从坐标获取像素位置",
    bezierFeatureNotFound: "未找到贝塞尔曲线要素",
    noSourceAvailable: "没有可用的数据源",
};

const en: Translations = {
    linePick: {
        default_name: "Line Pick",
        label_prefix: "Line",
        highlight_text: "● Line Pick ●"
    },
    pointPick: {
        default_name: "Point Pick",
        label_text: "Coordinate Pick"
    },
    polygonPick: {
        default_name: "Polygon Pick",
        label_prefix: "Polygon",
        highlight_text: "● Polygon Pick ●"
    },
    featureType: "Feature Type",
    properties: "Properties",
    freehandDrawLayer: "Freehand Draw Layer",
    ellipseDrawLayer: "Ellipse Draw Layer",
    markerDrawLayer: "Marker Draw Layer",
    textDrawLayer: "Text Draw Layer",
    imageDrawLayer: "Image Draw Layer",
    arrowDrawLayer: "Arrow Draw Layer",
    lineDrawLayer: "Line Draw Layer",
    bezierDrawLayer: "Bezier Curve Layer",
    sectorDrawLayer: "Sector Draw Layer",
    pointPickLayer: "Point Pick Layer",
    linePickLayer: "Line Pick Layer",
    polygonPickLayer: "Polygon Pick Layer",
    dataLayers: "Data Layers",
    drawLayers: "Draw Layers",
    toolLayers: "Tool Layers",
    pleaseEnterText: "Please enter text",
    longitude: "Longitude",
    latitude: "Latitude",
    confirm: "OK",
    addImage: "Add Image",
    imageUrl: "Image URL",
    uploadImage: "Upload Image",
    width: "Width",
    height: "Height",
    opacity: "Opacity",
    delete: "Delete",
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
    drawingCircle: "Drawing Circle",
    editingCircle: "Editing circle",
    editingRectangle: "Drawing Rectangle",
    editingTriangle: "Drawing Triangle",
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
    cancel: "Cancel",
    drawRectangle: "Draw Rectangle",
    drawTriangle: "Draw Triangle",
    editShape: "Edit Shape",
    pointData: "Points",
    lineData: "Lines",
    polygonData: "Polygons",
    coordinateData: "Coordinate Data",
    details: "Details",
    copyCoordinates: "Copy Coordinates",
    locateOnMap: "Locate on Map",
    startPoint: "Start Point",
    endPoint: "End Point",
    vertexCount: "Vertex Count",
    createdTime: "Created Time",
    noDataAvailable: "No data available",
    pleaseUseCoordinatePickTool: "No data available, please use coordinate pick tool first",
    coordinatesCopied: "Coordinates copied to clipboard",
    locatedToPoint: "Located to",
    locatedToLine: "Located to line with",
    locatedToPolygon: "Located to polygon with",
    allCoordinatesCleared: "All coordinate picks cleared",
    noCoordinateData: "No coordinate data",
    copyAllPointCoordinates: "Click OK to copy all point coordinates",
    pointPickSuccess: "Point picked",
    linePickSuccess: "Line picked with",
    polygonPickSuccess: "Polygon picked with",
    drawingStatusCancelHint: "Press ESC to cancel drawing",
    editingText: "Edit Text",
    fontSize: "Font Size",
    color: "Color",
    bold: "Bold",
    italic: "Italic",
    imagePreview: "Preview",
    noImage: "No image",
    imageLoadFailed: "Image load failed",
    image: "Image",
    cancelDrawing: "Cancel Drawing",
    drawingRectangle: "Drawing Rectangle",
    drawingTriangle: "Drawing Triangle",
    drawingFreehand: "Drawing Freehand Line",
    drawingFreehandPolygon: "Drawing Freehand Polygon",
    drawingEllipse: "Drawing Ellipse",
    addingMarker: "Adding Marker",
    addingText: "Adding Text Label",
    drawingArrow: "Drawing Arrow",
    drawingLine: "Drawing Line",
    drawingBezier: "Drawing Bezier Curve",
    drawingSector: "Drawing Sector",
    drawing: "Drawing",
    pressEscToCancel: " (Press ESC to cancel)",
    clickMapToPickPoint: "Click map to pick point (Click to finish)",
    clickMapToDrawLine: "Click map to draw line (Double click to finish)",
    clickMapToDrawPolygon: "Click map to draw polygon (Double click to finish)",
    doubleClickToFinishPick: "Double click to finish",
    editText: "Edit Text",
    strokeWidth: "Stroke Width",
    strokeStyle: "Stroke Style",
    dragToMove: "Drag to move",
    noImagePreview: "No image preview",
    uploadFromComputer: "Upload from computer",
    enterImageUrl: "Enter image URL",
    deleteImage: "Delete image",
    cancelEdit: "Cancel",
    save: "Save",
    ok: "OK",
    lineTool: "Line",
    arrowTool: "Arrow",
    bezierTool: "Bezier Curve",
    ellipseTool: "Ellipse",
    rectangleTool: "Rectangle",
    triangleTool: "Triangle",
    sectorTool: "Sector",
    freehandTool: "Freehand Line",
    freehandPolygonTool: "Freehand Polygon",
    markerTool: "Marker",
    textTool: "Text",
    imageTool: "Image",
    points: "points",
    pointsCount: "",
    featureNotFound: "Feature not found",
    cannotGetMapTarget: "Cannot get map target element",
    cannotGetPixelFromCoordinate: "Cannot get pixel from coordinate",
    bezierFeatureNotFound: "Bezier feature not found",
    noSourceAvailable: "No source available",
};

export const getTranslation = (locale: Locale): Translations => {
    return locale === "zh" ? zh : en;
};