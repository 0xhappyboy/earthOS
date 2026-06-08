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

## ⚙️ 安装

```bash
npm i @earthview/core
```

```bash
yarn add @earthview/core
```

## 快速启动

```typescript
// 1. 通过容器元素创建
const earth = new EarthView({ container: document.getElementById("map") });
// 2. 通过容器选择器创建
const earth = new EarthView({ containerSelector: "#map" });
// 3. 通过元素 ID 创建
const earth = new EarthView({ id: "map" });
// 4. 通过父元素自动创建容器
const earth = new EarthView({ parent: document.getElementById("wrapper") });
// 5. 通过父元素选择器自动创建容器
const earth = new EarthView({ parentSelector: "#wrapper" });
```

### 基础配置

```typescript
const earth = new EarthView({
  container: document.getElementById("map"),
  basemap: BasemapTypeEnum.SATELLITE, // 卫星图
  center: [-74.006, 40.7128], // 中心点 [经度, 纬度]
  zoom: 12, // 缩放级别
  coordinateSystem: CoordinateSystemTypeEnum.WGS84,
  theme: "dark", // 主题: "dark" | "light"
  i18n: "en", // 语言: "en" | "zh"
  enableDrawing: true, // 启用绘图
  onLoad: (core) => {
    console.log("加载完成");
  },
  onMoveEnd: (center, zoom) => {
    console.log(center, zoom);
  },
  onMapClick: (event) => {
    console.log(event.longitude, event.latitude);
  },
});
```

### JavaScript

```typescript
const container = document.getElementById("map");
const earth = new EarthView({
  container,
  basemap: BasemapTypeEnum.SATELLITE,
  center: [-74.006, 40.7128],
  zoom: 12,
  theme: "dark",
  onLoad: (core) => {
    console.log("Map loaded");
  },
});
```

### React

```typescript
import { useEffect, useRef } from "react";
import { EarthView, BasemapTypeEnum } from "./earthview-2/core";

const MapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const earthRef = useRef<EarthView | null>(null);

  useEffect(() => {
    if (containerRef.current && !earthRef.current) {
      earthRef.current = new EarthView({
        container: containerRef.current,
        basemap: BasemapTypeEnum.SATELLITE,
        center: [-74.006, 40.7128],
        zoom: 12
      });
    }
    return () => earthRef.current?.destroy();
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "500px" }} />;
};
```

### Vue3

```typescript
<template>
  <div ref="containerRef" style="width:100%;height:500px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { EarthView, BasemapTypeEnum } from "./earthview-2/core";

const containerRef = ref<HTMLDivElement | null>(null);
let earth: EarthView | null = null;

onMounted(() => {
  if (containerRef.value) {
    earth = new EarthView({
      container: containerRef.value,
      basemap: BasemapTypeEnum.SATELLITE,
      center: [-74.006, 40.7128],
      zoom: 12
    });
  }
});

onUnmounted(() => earth?.destroy());
</script>
```

### Vue2

```typescript
<template>
  <div ref="container" style="width:100%;height:500px"></div>
</template>

<script>
import { EarthView, BasemapTypeEnum } from "./earthview-2/core";

export default {
  mounted() {
    this.earth = new EarthView({
      container: this.$refs.container,
      basemap: BasemapTypeEnum.SATELLITE,
      center: [-74.006, 40.7128],
      zoom: 12
    });
  },
  beforeDestroy() {
    this.earth?.destroy();
  }
};
</script>
```

## 标记图层

### 例子

```typescipt
import { EarthView, MarkerLayer, MarkerLayerPointTypeEnum } from "@earthview/core";
// 创建地图
const earth = new EarthView({
    container: document.getElementById("map"),
    center: [-74.006, 40.7128],  // 纽约
    zoom: 12
});
// 创建标记图层
const markerLayer = new MarkerLayer("my-markers", "My Markers", {
    defaultColor: [255, 99, 71, 1],  // 默认颜色 (红)
    defaultSize: 16                   // 默认大小
});
// 添加到地图
earth.getLayerManager().addLayer(markerLayer);
// 添加标记点
await markerLayer.addMarker({
    id: "marker_1",
    longitude: -74.006,
    latitude: 40.7128,
    bubbleBoxTitle: "Times Square",
    bubbleBoxDescription: "New York landmark",
    pointType: MarkerLayerPointTypeEnum.CIRCLE,
    pointColor: "rgba(255, 0, 0, 0.8)",
    pointSize: 20,
    onClick: (data, event) => {
        console.log("Clicked:", data.bubbleBoxTitle);
    }
});
// 更新标记点
await markerLayer.updateMarker("marker_1", {
    pointColor: "rgba(0, 255, 0, 0.8)",
    pointSize: 24
});
// 获取所有标记点
const allMarkers = markerLayer.getAllMarkers();
// 删除标记点
markerLayer.removeMarker("marker_1");
// 清空所有标记点
markerLayer.clearAllMarkers();
```

### 参数解释

#### 标记图层数据接口

```typescipt
export interface MarkerLayerData {
    id: string;                              // 唯一标识符 (必填)
    longitude: number;                       // 经度坐标 (必填)
    latitude: number;                        // 纬度坐标 (必填)
    bubbleBoxTitle?: string;                 // 气泡弹窗标题
    bubbleBoxDescription?: string;           // 气泡弹窗描述内容
    bubbleBoxCoverImage?: string;            // 气泡弹窗封面图片 URL
    pointColor?: string;                     // 标记点颜色，格式: rgba(255,0,0,0.8)
    pointType?: MarkerLayerPointTypeEnum;    // 标记点形状类型
    pointSize?: number;                      // 标记点大小 (像素)
    pointText?: string;                      // 文字标记的文本内容
    pointAnimationType?: MarkerLayerAnimationTypeEnum; // 动画效果类型
    pointHtml?: string;                      // HTML 标记的 HTML 内容
    pointHtmlWidth?: number;                 // HTML 标记宽度 (像素)
    pointHtmlHeight?: number;                // HTML 标记高度 (像素)
    onClick?: (data: MarkerLayerData, event: any) => void;      // 点击回调
    onContextMenu?: (data: MarkerLayerData, event: any) => void; // 右键回调
    onHover?: (data: MarkerLayerData, event: any) => void;       // 悬停回调
}
```

#### 标记点形状类型枚举

```typescipt
export enum MarkerLayerPointTypeEnum {
    SQUARE = "square",           // 正方形
    CIRCLE = "circle",           // 圆形
    TRIANGLE = "triangle",       // 三角形
    PENTAGRAM = "pentagram",     // 五角星
    TEXT = "text",               // 文字标记
    DIAMOND = "diamond",         // 菱形
    CROSS = "cross",             // 十字形
    X_SHAPE = "x_shape",         // X 形
    HEXAGON = "hexagon",         // 六边形
    FLAG = "flag",               // 旗帜
    HOUSE = "house",             // 房屋
    ARROW = "arrow",             // 箭头
    TENT = "tent",               // 帐篷 - 营地、临时据点
    BUNKER = "bunker",           // 碉堡 - 防御工事、火力点
    LANDMINE = "landmine",       // 地雷 - 雷区、爆炸物
    TANK = "tank",               // 坦克 - 装甲单位、重型装备
    PLANE = "plane",             // 飞机 - 机场、航空设施
    SHIP = "ship",               // 舰船 - 港口、码头
    RADAR = "radar",             // 雷达 - 监测站、预警点
    MISSILE = "missile",         // 导弹 - 导弹阵地、发射点
    FIRE_HYDRANT = "fire_hydrant", // 消防栓 - 消防设施
    FIRST_AID = "first_aid",     // 急救 - 医疗补给点
    WATER_TOWER = "water_tower", // 水塔 - 水源、蓄水池
    GENERATOR = "generator",     // 发电机 - 电力设施
    MEGAPHONE = "megaphone",     // 扩音器 - 广播点、警报点
    STREET_LAMP = "street_lamp", // 路灯 - 照明设施
    PARKING = "parking",         // 停车场 - 停车区域
    GAS_STATION = "gas_station", // 加油站 - 加油/充电站
    TUNNEL = "tunnel",           // 隧道 - 隧道入口
    BRIDGE = "bridge",           // 桥梁 - 跨线桥
    TRAFFIC_LIGHT = "traffic_light", // 红绿灯 - 交通信号点
    CAMERA = "camera",           // 摄像头 - 监控点
    TOILET = "toilet",           // 厕所 - 公共卫生间
    TRASH_CAN = "trash_can",     // 垃圾桶 - 垃圾收集点
    BUS_STOP = "bus_stop",       // 公交站 - 公交车站
    SUBWAY = "subway",           // 地铁 - 地铁入口
    SCHOOL = "school",           // 学校 - 教育机构
    HOSPITAL = "hospital",       // 医院 - 医疗机构
    TREE = "tree",               // 树木 - 森林、绿化区
    WATER_SOURCE = "water_source", // 水源 - 河流、湖泊、水井
    MOUNTAIN = "mountain",       // 山峰 - 高地
    MINE = "mine",               // 矿藏 - 采矿点
    HEART = "heart",             // 爱心 - 重要关注点
    STAR = "star",               // 星形 - 推荐地点
    CLOUD = "cloud",             // 云 - 云服务节点
    GEAR = "gear",               // 齿轮 - 工业设施
    LIGHTNING = "lightning",     // 闪电 - 电力设施
    PIN = "pin",                 // 图钉 - 通用标记点
    COMPASS = "compass",         // 指南针 - 方向参考点
    ANCHOR = "anchor",           // 船锚 - 港口、码头
}
```

#### 标记点动画类型枚举

```typescipt
export enum MarkerLayerAnimationTypeEnum {
    PULSE = "pulse",         // 脉冲动画 - 标记点大小周期性变化
    FLASHING = "flashing",   // 闪烁动画 - 标记点颜色交替变化
    BREATHING = "breathing", // 呼吸动画 - 标记点透明度缓慢变化
    LIGHT = "light"          // 光晕动画 - 标记点周围光晕效果
}
```

#### 标记图层演示

<img src="./assets/marker_layer_demo.gif" width="100%">

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
