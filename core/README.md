<h1 align="center">
    EarthView
</h1>
<h4 align="center">
A reliable geographic information graphics system developed based on OpenLayers.
</h4>
<p align="center">
  <a href="https://github.com/0xhappyboy/earthview/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-AGPL3.0-d1d1f6.svg?style=flat&labelColor=1C2C2E&color=BEC5C9&logo=googledocs&label=license&logoColor=BEC5C9" alt="License"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&labelColor=1C2C2E&color=007ACC&logo=typescript&logoColor=white" alt="TypeScript"></a>
<a href="https://github.com/0xhappyboy/earthview/stargazers"><img src="https://img.shields.io/github/stars/0xhappyboy/earthview.svg?style=flat&labelColor=1C2C2E&color=FFD700&logo=github&logoColor=white&label=stars" alt="GitHub stars"></a>
<a href="https://github.com/0xhappyboy/earthview/issues"><img src="https://img.shields.io/github/issues/0xhappyboy/earthview.svg?style=flat&labelColor=1C2C2E&color=FF6B6B&logo=github&logoColor=white&label=issues" alt="GitHub issues"></a>
<a href="https://github.com/0xhappyboy/earthview/network/members"><img src="https://img.shields.io/github/forks/0xhappyboy/earthview.svg?style=flat&labelColor=1C2C2E&color=42A5F5&logo=github&logoColor=white&label=forks" alt="GitHub forks"></a>
<a href="https://www.npmjs.com/package/@earthview/core"><img src="https://img.shields.io/npm/v/@earthview/core.svg?style=flat&labelColor=1C2C2E&color=FF5722&logo=npm&logoColor=white&label=npm%20version" alt="npm version"></a>
<a href="https://github.com/0xhappyboy/earthview/releases"><img src="https://img.shields.io/github/v/tag/0xhappyboy/earthview.svg?style=flat&labelColor=1C2C2E&color=9C27B0&logo=github&logoColor=white&label=latest%20release" alt="GitHub release"></a>
<a href="https://github.com/0xhappyboy/earthview/actions"><img src="https://img.shields.io/github/actions/workflow/status/0xhappyboy/earthview/release.yml?style=flat&labelColor=1C2C2E&color=4CAF50&logo=githubactions&logoColor=white&label=build" alt="Build Status"></a>
<a href="https://www.npmjs.com/package/@earthview/core"><img src="https://img.shields.io/npm/dt/@earthview/core?style=flat&labelColor=1C2C2E&color=00BCD4&logo=npm&logoColor=white&label=total%20downloads" alt="npm downloads"></a>
<a href="https://www.npmjs.com/package/@earthview/core"><img src="https://img.shields.io/npm/dm/@earthview/core?style=flat&labelColor=1C2C2E&color=00BCD4&logo=npm&logoColor=white&label=downloads/month" alt="npm downloads"></a>
<a href="https://www.npmjs.com/package/@earthview/core"><img src="https://img.shields.io/npm/dw/@earthview/core?style=flat&labelColor=1C2C2E&color=00BCD4&logo=npm&logoColor=white&label=downloads/week" alt="npm downloads"></a>
</p>
<p align="center">
<a href="./README_zh-CN.md">简体中文</a> | <a href="./README.md">English</a>
</p>

## ⚙️ Install

```bash
npm i @earthview/core
```

```bash
yarn add @earthview/core
```

## Quick Start

```typescript
// 1. Create with container element
const earth = new EarthView({ container: document.getElementById("map") });
// 2. Create with container selector
const earth = new EarthView({ containerSelector: "#map" });
// 3. Create with element ID
const earth = new EarthView({ id: "map" });
// 4. Create with parent element (auto-creates container)
const earth = new EarthView({ parent: document.getElementById("wrapper") });
// 5. Create with parent selector (auto-creates container)
const earth = new EarthView({ parentSelector: "#wrapper" });
```

### Basic Configuration

```typescript
const earth = new EarthView({
  container: document.getElementById("map"),
  basemap: BasemapTypeEnum.SATELLITE, // Satellite map
  center: [-74.006, 40.7128], // Center point [longitude, latitude]
  zoom: 12, // Zoom level
  coordinateSystem: CoordinateSystemTypeEnum.WGS84,
  theme: "dark", // Theme: "dark" | "light"
  i18n: "en", // Language: "en" | "zh"
  enableDrawing: true, // Enable drawing
  onLoad: (core) => {
    console.log("Map loaded");
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

## MarkLayer

### Example

```typescript
import {
  EarthView,
  MarkerLayer,
  MarkerLayerPointTypeEnum,
} from "@earthview/core";
// Create map
const earth = new EarthView({
  container: document.getElementById("map"),
  center: [-74.006, 40.7128], // New York
  zoom: 12,
});
// Create marker layer
const markerLayer = new MarkerLayer("my-markers", "My Markers", {
  defaultColor: [255, 99, 71, 1], // Default color (red)
  defaultSize: 16, // Default size
});
// Add to map
earth.getLayerManager().addLayer(markerLayer);
// Add marker
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
  },
});
// Update marker
await markerLayer.updateMarker("marker_1", {
  pointColor: "rgba(0, 255, 0, 0.8)",
  pointSize: 24,
});
// Get all markers
const allMarkers = markerLayer.getAllMarkers();
// Remove marker
markerLayer.removeMarker("marker_1");
// Clear all markers
markerLayer.clearAllMarkers();
```

### Parameter explanation

#### Marker layer data interface

```typescipt
export interface MarkerLayerData {
    id: string;                              // Unique identifier (required)
    longitude: number;                       // Longitude coordinate (required)
    latitude: number;                        // Latitude coordinate (required)
    bubbleBoxTitle?: string;                 // Popup title
    bubbleBoxDescription?: string;           // Popup description content
    bubbleBoxCoverImage?: string;            // Popup cover image URL
    pointColor?: string;                     // Marker color, format: rgba(255,0,0,0.8)
    pointType?: MarkerLayerPointTypeEnum;    // Marker shape type
    pointSize?: number;                      // Marker size (pixels)
    pointText?: string;                      // Text content for text marker
    pointAnimationType?: MarkerLayerAnimationTypeEnum; // Animation effect type
    pointHtml?: string;                      // HTML content for HTML marker
    pointHtmlWidth?: number;                 // HTML marker width (pixels)
    pointHtmlHeight?: number;                // HTML marker height (pixels)
    onClick?: (data: MarkerLayerData, event: any) => void;      // Click callback
    onContextMenu?: (data: MarkerLayerData, event: any) => void; // Right-click callback
    onHover?: (data: MarkerLayerData, event: any) => void;       // Hover callback
}
```

#### Marker shape type enum

```typescipt
export enum MarkerLayerPointTypeEnum {
    SQUARE = "square",           // Square
    CIRCLE = "circle",           // Circle
    TRIANGLE = "triangle",       // Triangle
    PENTAGRAM = "pentagram",     // Pentagram
    TEXT = "text",               // Text marker
    DIAMOND = "diamond",         // Diamond
    CROSS = "cross",             // Cross
    X_SHAPE = "x_shape",         // X Shape
    HEXAGON = "hexagon",         // Hexagon
    FLAG = "flag",               // Flag
    HOUSE = "house",             // House
    ARROW = "arrow",             // Arrow
    TENT = "tent",               // Tent - Camp, temporary post
    BUNKER = "bunker",           // Bunker - Fortification, fire point
    LANDMINE = "landmine",       // Landmine - Minefield, explosives
    TANK = "tank",               // Tank - Armored unit, heavy equipment
    PLANE = "plane",             // Plane - Airport, airstrip, aviation facility
    SHIP = "ship",               // Ship - Port, landing point, naval facility
    RADAR = "radar",             // Radar - Monitoring station, early warning point
    MISSILE = "missile",         // Missile - Missile site, launch point
    FIRE_HYDRANT = "fire_hydrant", // Fire Hydrant - Fire facility
    FIRST_AID = "first_aid",     // First Aid - Medical supply point
    WATER_TOWER = "water_tower", // Water Tower - Water source, reservoir
    GENERATOR = "generator",     // Generator - Power facility
    MEGAPHONE = "megaphone",     // Megaphone - Broadcast point, alert point
    STREET_LAMP = "street_lamp", // Street Lamp - Lighting facility
    PARKING = "parking",         // Parking - Parking lot
    GAS_STATION = "gas_station", // Gas Station - Fuel/charging station
    TUNNEL = "tunnel",           // Tunnel - Tunnel entrance
    BRIDGE = "bridge",           // Bridge - Elevated road
    TRAFFIC_LIGHT = "traffic_light", // Traffic Light - Traffic signal point
    CAMERA = "camera",           // Camera - Monitoring point
    TOILET = "toilet",           // Toilet - Public restroom
    TRASH_CAN = "trash_can",     // Trash Can - Waste collection point
    BUS_STOP = "bus_stop",       // Bus Stop - Bus station
    SUBWAY = "subway",           // Subway - Subway entrance
    SCHOOL = "school",           // School - Educational institution
    HOSPITAL = "hospital",       // Hospital - Medical facility
    TREE = "tree",               // Tree - Forest, green area
    WATER_SOURCE = "water_source", // Water Source - River, lake, well
    MOUNTAIN = "mountain",       // Mountain - Peak, high point
    MINE = "mine",               // Mine - Mining point, quarry
    HEART = "heart",             // Heart - Important attention point
    STAR = "star",               // Star - Commendation point, excellent spot
    CLOUD = "cloud",             // Cloud - Cloud service node
    GEAR = "gear",               // Gear - Industrial facility
    LIGHTNING = "lightning",     // Lightning - Power facility
    PIN = "pin",                 // Pin - General marker point
    COMPASS = "compass",         // Compass - Direction reference point
    ANCHOR = "anchor",           // Anchor - Harbor, dock
}
```

#### Marker animation type enum

```typescipt
export enum MarkerLayerAnimationTypeEnum {
    PULSE = "pulse",         // Pulse animation - Marker size changes periodically
    FLASHING = "flashing",   // Flashing animation - Marker color alternates
    BREATHING = "breathing", // Breathing animation - Marker opacity changes slowly
    LIGHT = "light"          // Light animation - Glow effect around marker
}
```

#### MarkerLayer Demo

<img src="https://raw.githubusercontent.com/0xhappyboy/earthview/main/assets/marker_layer_demo.gif" width="100%">

## Data Layer Management Panel

<img src="https://raw.githubusercontent.com/0xhappyboy/earthview/main/assets/data_layer_manager_demo.gif" width="100%">
