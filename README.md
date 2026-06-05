<h1 align="center">
    EarthView
</h1>
<h4 align="center">
A reliable geographic information graphics system developed based on OpenLayers.
</h4>
<p align="center">
<a href="./README_zh-CN.md">简体中文</a> | <a href="./README.md">English</a>
</p>

## Example

### Use a bubble box to plot points.

```typescipt
// DOM container
<div ref={containerRef} style={{ width: "100%", height: "100vh" }} />

// Create EarthView core
const core = new EarthViewCore({
  container: containerRef.current,
  basemap: BasemapTypeEnum.SATELLITE,
  center: [-74.006, 40.7128],
  zoom: 12,
  theme: "dark",
  i18n: "en",
});
// Get layer manager
const layerManager = core.getLayerManager();
// Create popup marker layer
const popupLayer = new PopupMarkerLayer("popup-markers", "NYC Landmarks", {
  defaultColor: [255, 99, 71, 1],
  defaultSize: 12,
  popupWidth: 280,
  coverImageHeight: 130,
});
// Create marker
const marker = {
  id: "statue-of-liberty",
  longitude: -74.0445,
  latitude: 40.6892,
  title: "🗽 Statue of Liberty",
  description: "The Statue of Liberty is a colossal neoclassical sculpture.",
  coverImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg7_F1bqE2CjCMKLwgpgTeBYfjeJxh5l5qag&s",
  color: [66, 133, 244, 1],
  size: 14,
};
// Add marker to layer
popupLayer.addMarker(marker);
// Add layer to map
layerManager.addLayer(popupLayer);
popupLayer.setVisible(true);
```

<img src="./assets/demo.gif" width="100%">
