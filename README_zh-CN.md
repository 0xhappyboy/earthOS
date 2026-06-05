<h1 align="center">
    地球视图(EarthView)
</h1>
<h4 align="center">
基于OpenLayers开发的可靠地理信息图形系统.
</h4>
<p align="center">
    <a href="https://github.com/HippoxHQ/hippox-desktop/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-AGPL3.0-d1d1f6.svg?style=flat&labelColor=1C2C2E&color=BEC5C9&logo=googledocs&label=license&logoColor=BEC5C9" alt="License"></a>
</p>
<p align="center">
<a href="./README_zh-CN.md">简体中文</a> | <a href="./README.md">English</a>
</p>

## 例子

### 气泡图绘制点.

```typescipt
// DOM container
// DOM 容器
<div ref={containerRef} style={{ width: "100%", height: "100vh" }} />

// 创建 EarthView 核心对象
const core = new EarthViewCore({
  container: containerRef.current,
  basemap: BasemapTypeEnum.SATELLITE,
  center: [-74.006, 40.7128],
  zoom: 12,
  theme: "dark",
  i18n: "zh",
});

// 获取图层管理器
const layerManager = core.getLayerManager();

// 创建弹窗标绘点图层
const popupLayer = new PopupMarkerLayer("popup-markers", "纽约地标", {
  defaultColor: [255, 99, 71, 1],
  defaultSize: 12,
  popupWidth: 280,
  coverImageHeight: 130,
});

// 创建标绘点对象
const marker = {
  id: "statue-of-liberty",
  longitude: -74.0445,
  latitude: 40.6892,
  title: "🗽 自由女神像",
  description: "自由女神像是法国送给美国的礼物，于1886年落成。",
  coverImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg7_F1bqE2CjCMKLwgpgTeBYfjeJxh5l5qag&s",
  color: [66, 133, 244, 1],
  size: 14,
};

// 添加标绘点到图层
popupLayer.addMarker(marker);

// 添加图层到地图
layerManager.addLayer(popupLayer);
popupLayer.setVisible(true);
```

<img src="./assets/demo.gif" width="100%">
