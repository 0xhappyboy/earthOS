import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { toWGS84 } from "../CoordTransform";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "../types";
import {
  LayerManager,
  ILayer,
  CircleDrawLayer,
  CircleDrawData,
} from "../LayerManager";
import { EarthViewProps } from "./types";
import { PopupPanel } from "./components/PopupPanel";
import { Toolbar } from "./components/Toolbar";
import { ScaleBar } from "./components/ScaleBar";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { BasemapOptions } from "./components/BasemapOptions";
import { LayersPanel } from "./components/LayersPanel";
import { DrawToolsPanel } from "./components/DrawToolsPanel";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { getTranslation } from "../i18n";

export const EarthView: React.FC<EarthViewProps> = ({
  width = "100%",
  height = "100%",
  style,
  className,
  basemap = BasemapTypeEnum.SATELLITE,
  center = [0, 0],
  zoom = 12,
  coordinateSystem = CoordinateSystemTypeEnum.WGS84,
  layers = [],
  onLoad,
  onMapClick,
  enableDrawing = true,
  onCircleDrawn,
  i18n = "zh",
  theme = "dark",
}) => {
  const [currentColor, setCurrentColor] = useState<number[]>([255, 0, 0, 1]);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(3);
  const [currentStrokeStyle, setCurrentStrokeStyle] = useState<
    "solid" | "dashed"
  >("solid");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const mapRef = useRef<Map | null>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const circleDrawLayerRef = useRef<CircleDrawLayer | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isChangingBasemap, setIsChangingBasemap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isMountedRef = useRef(true);
  const [currentScale, setCurrentScale] = useState<string>("");
  const [activePopup, setActivePopup] = useState<
    "layers" | "basemap" | "draw" | null
  >(null);
  const [currentBasemap, setCurrentBasemap] =
    useState<BasemapTypeEnum>(basemap);
  const [layerList, setLayerList] = useState<
    { id: string; name: string; visible: boolean }[]
  >([]);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({
    x: 100,
    y: 100,
  });
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(
    null,
  );

  const [drawingStatus, setDrawingStatus] = useState<string | null>(null);
  const t = getTranslation(i18n);
  const isDark = theme === "dark";
  const getInternalCenter = useCallback((): [number, number] => {
    if (!center || center.length !== 2) return [0, 0];
    const [lng, lat] = center;
    if (coordinateSystem === CoordinateSystemTypeEnum.WGS84) {
      return [lng, lat];
    }
    const [convertedLng, convertedLat] = toWGS84(lng, lat, coordinateSystem);
    return [convertedLng, convertedLat];
  }, [center, coordinateSystem]);
  const destroyMap = useCallback(() => {
    try {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      if (layerManagerRef.current) {
        layerManagerRef.current.clearAll();
        layerManagerRef.current = null;
      }
      mapRef.current = null;
    } catch (err) {
      console.warn("Error destroying map:", err);
    }
  }, []);
  const updateLayerList = useCallback(() => {
    if (layerManagerRef.current) {
      const allLayers = layerManagerRef.current.getAllLayers();
      setLayerList(
        allLayers.map((layer) => ({
          id: layer.id,
          name: layer.name,
          visible: layer.visible,
        })),
      );
    }
  }, []);
  const updateScale = useCallback(() => {
    if (viewRef.current && !isChangingBasemap) {
      const scale = viewRef.current.scale;
      if (scale) {
        if (scale >= 1000) {
          setCurrentScale(`1:${Math.round(scale / 1000)}K`);
        } else {
          setCurrentScale(`1:${Math.round(scale)}`);
        }
      }
    }
  }, [isChangingBasemap]);
  const handleZoomIn = useCallback(() => {
    if (viewRef.current && !isMapLoading && !isChangingBasemap) {
      const newZoom = (viewRef.current.zoom || 12) + 1;
      viewRef.current.zoom = newZoom;
      setTimeout(updateScale, 100);
    }
  }, [updateScale, isMapLoading, isChangingBasemap]);
  const handleZoomOut = useCallback(() => {
    if (viewRef.current && !isMapLoading && !isChangingBasemap) {
      const newZoom = (viewRef.current.zoom || 12) - 1;
      viewRef.current.zoom = newZoom;
      setTimeout(updateScale, 100);
    }
  }, [updateScale, isMapLoading, isChangingBasemap]);
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const layer = layerManagerRef.current?.getLayer(layerId);
    if (layer) {
      const newVisible = !layer.visible;
      layer.setVisible?.(newVisible);
      setLayerList((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: newVisible } : l)),
      );
    }
  }, []);
  const removeLayer = useCallback(
    (layerId: string) => {
      if (layerId === "circle-draw") {
        alert(t.cannotRemoveDrawingLayer);
        return;
      }
      layerManagerRef.current?.removeLayer(layerId);
      updateLayerList();
    },
    [updateLayerList, t],
  );
  const switchBasemap = useCallback((newBasemap: BasemapTypeEnum) => {
    if (!mapRef.current) return;
    setIsChangingBasemap(true);
    setError(null);
    try {
      mapRef.current.basemap = newBasemap as any;
      setCurrentBasemap(newBasemap);
      setActivePopup(null);
      setTimeout(() => {
        setIsChangingBasemap(false);
      }, 500);
    } catch (err) {
      console.error("Failed to switch basemap:", err);
      setError(err instanceof Error ? err.message : "Failed to switch basemap");
      setIsChangingBasemap(false);
    }
  }, []);
  const handleDrawCircle = useCallback(() => {
    if (circleDrawLayerRef.current && !isMapLoading && !isChangingBasemap) {
      setIsDrawing(true);
      setDrawingStatus(t.drawingCircle || "Drawing...");
      circleDrawLayerRef.current.startDraw((data) => {
        setIsDrawing(false);
        setDrawingStatus(null);
        onCircleDrawn?.(data);
        setActivePopup(null);
      });
    }
  }, [onCircleDrawn, isMapLoading, isChangingBasemap, t]);

  const handleStartEdit = useCallback(() => {
    const circles = circleDrawLayerRef.current?.getAllCircles();
    if (circles && circles.length > 0 && !isMapLoading && !isChangingBasemap) {
      setDrawingStatus(t.editingCircle || "Editing Circle...");
      circleDrawLayerRef.current?.startEdit(circles[0].id, (data) => {
        console.log("Edit complete:", data);
        setDrawingStatus(null);
        setActivePopup(null);
      });
    } else if (!isMapLoading && !isChangingBasemap) {
      alert(t.noCirclesToEdit);
    }
  }, [t, isMapLoading, isChangingBasemap]);

  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    const handleImmediateClick = (event: any) => {
      if (event.button !== 2) return;
      event.stopPropagation();
      view
        .hitTest(event)
        .then((response: any) => {
          const results = response.results;
          const graphicHit = results.find((hit: any) => {
            return hit.graphic && hit.graphic.layer?.id === "circle-draw";
          });
          if (graphicHit && graphicHit.graphic) {
            const graphic = graphicHit.graphic;
            const id = graphic.attributes?.id;
            if (id) {
              setSelectedGraphicId(id);
              setFloatingToolbarPosition({ x: event.x, y: event.y });
              setShowFloatingToolbar(true);
            }
          } else {
            setShowFloatingToolbar(false);
            setSelectedGraphicId(null);
          }
        })
        .catch((err: any) => {
          console.warn("HitTest error:", err);
          setShowFloatingToolbar(false);
          setSelectedGraphicId(null);
        });
    };
    const handleClick = () => {
      setShowFloatingToolbar(false);
      setSelectedGraphicId(null);
    };
    view.on("immediate-click", handleImmediateClick);
    view.on("click", handleClick);
    return () => {
      if (view) {
        try {
          (view as any).remove?.("immediate-click", handleImmediateClick);
          (view as any).remove?.("click", handleClick);
        } catch (e) {}
      }
    };
  }, [viewRef.current]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (viewRef.current) return;
    isMountedRef.current = true;
    const internalCenter = getInternalCenter();
    const initMap = async () => {
      try {
        setIsMapLoading(true);
        setError(null);
        const map = new Map({ basemap: currentBasemap });
        mapRef.current = map;
        layerManagerRef.current = new LayerManager(map);
        layers.forEach((layer) => {
          layerManagerRef.current?.addLayer(layer);
        });
        if (enableDrawing) {
          const circleDrawLayer = new CircleDrawLayer({
            id: "circle-draw",
            name: "Circle Draw",
            defaultFillColor: [255, 0, 0, 0.3],
            defaultOutlineColor: [255, 0, 0, 1],
            defaultOutlineWidth: 3,
          });
          circleDrawLayerRef.current = circleDrawLayer;
          layerManagerRef.current?.addLayer(circleDrawLayer);
        }
        const view = new MapView({
          container: containerRef.current!,
          map: map,
          center: internalCenter,
          zoom: zoom,
          constraints: {
            rotationEnabled: true,
            snapToZoom: false,
            minZoom: 1,
            maxZoom: 20,
          } as any,
          navigation: {
            mouseWheelZoomEnabled: true,
            browserTouchPanEnabled: true,
          } as any,
          ui: { components: [] },
        } as any);
        viewRef.current = view;
        view.watch("scale", () => updateScale());
        view.watch("zoom", () => setTimeout(updateScale, 100));
        if (onMapClick) {
          view.on("click", (event) => {
            const { longitude, latitude } = event.mapPoint;
            if (
              longitude !== null &&
              longitude !== undefined &&
              latitude !== null &&
              latitude !== undefined
            ) {
              onMapClick({ longitude, latitude });
            }
          });
        }
        await view.when();
        if (isMountedRef.current) {
          setTimeout(() => {
            if (circleDrawLayerRef.current && viewRef.current) {
              circleDrawLayerRef.current.setView(viewRef.current);
            }
            updateLayerList();
            updateScale();
            setIsMapLoading(false);
          }, 100);
          window.dispatchEvent(new CustomEvent("EarthView-loaded"));
          onLoad?.(layerManagerRef.current!, view);
        }
      } catch (err) {
        console.error("Failed to initialize map:", err);
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to initialize map",
          );
          setIsMapLoading(false);
        }
      }
    };
    initMap();
    return () => {
      isMountedRef.current = false;
      destroyMap();
    };
  }, []);

  useEffect(() => {
    const handleLocate = (event: CustomEvent) => {
      if (!viewRef.current || isMapLoading || isChangingBasemap) return;
      const { center: newCenter, zoom: newZoom, system } = event.detail;
      if (newCenter && newCenter.length === 2) {
        const systemToUse = system || coordinateSystem;
        let wgs84Lng = newCenter[0];
        let wgs84Lat = newCenter[1];
        if (systemToUse !== CoordinateSystemTypeEnum.WGS84) {
          [wgs84Lng, wgs84Lat] = toWGS84(
            newCenter[0],
            newCenter[1],
            systemToUse,
          );
        }
        viewRef.current
          .goTo(
            { target: [wgs84Lng, wgs84Lat], zoom: newZoom || 12 },
            { duration: 1000 },
          )
          .catch((err: Error) => console.warn("GoTo failed:", err));
      }
    };
    window.addEventListener("EarthView-locate", handleLocate as EventListener);
    return () => {
      window.removeEventListener(
        "EarthView-locate",
        handleLocate as EventListener,
      );
    };
  }, [coordinateSystem, isMapLoading, isChangingBasemap]);
  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
    ...style,
  };
  const showLoading = isMapLoading || isChangingBasemap;
  const loadingMessage = isMapLoading ? t.loading : t.changingBasemap;
  return (
    <div className={className} style={containerStyle}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {drawingStatus && !showLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 200,
            background: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "#444" : "#ddd"}`,
            borderRadius: "8px",
            padding: "8px 16px",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: `2px solid ${isDark ? "#555" : "#ccc"}`,
              borderTop: `2px solid #00aaff`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            style={{
              color: isDark ? "#fff" : "#333",
              fontSize: "12px",
            }}
          >
            {drawingStatus}
          </span>
        </div>
      )}

      {showLoading && <LoadingOverlay message={loadingMessage} theme={theme} />}

      {error && !showLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            background: "rgba(255,0,0,0.9)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            maxWidth: "80%",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {error}
        </div>
      )}

      {!isMapLoading && (
        <>
          {activePopup === "layers" && (
            <PopupPanel
              title={t.layers}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              <LayersPanel
                layerList={layerList}
                onToggleVisibility={toggleLayerVisibility}
                onRemoveLayer={removeLayer}
                isDark={isDark}
                t={t}
              />
            </PopupPanel>
          )}
          {activePopup === "basemap" && (
            <PopupPanel
              title={t.basemap}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              <BasemapOptions
                currentBasemap={currentBasemap}
                onSelect={switchBasemap}
                isDark={isDark}
                t={t}
              />
            </PopupPanel>
          )}
          {activePopup === "draw" && (
            <PopupPanel
              title={t.drawTools}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              <DrawToolsPanel
                onDrawCircle={handleDrawCircle}
                onEditCircle={handleStartEdit}
                isDark={isDark}
                t={t}
              />
            </PopupPanel>
          )}
          <Toolbar
            activePopup={activePopup}
            onTogglePopup={setActivePopup}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            theme={theme}
            t={t}
          />
          <ScaleBar scale={currentScale} theme={theme} />
          <FloatingToolbar
            visible={showFloatingToolbar}
            position={floatingToolbarPosition}
            onPositionChange={setFloatingToolbarPosition}
            onColorChange={(color) => {
              setCurrentColor(color);
              if (selectedGraphicId && circleDrawLayerRef.current) {
                circleDrawLayerRef.current.updateCircleStyle(
                  selectedGraphicId,
                  [color[0], color[1], color[2], 0.3],
                  [color[0], color[1], color[2], 1],
                  currentStrokeWidth,
                  currentStrokeStyle,
                );
              }
            }}
            onStrokeWidthChange={(width) => {
              setCurrentStrokeWidth(width);
              if (selectedGraphicId && circleDrawLayerRef.current) {
                circleDrawLayerRef.current.updateCircleStyle(
                  selectedGraphicId,
                  [currentColor[0], currentColor[1], currentColor[2], 0.3],
                  [currentColor[0], currentColor[1], currentColor[2], 1],
                  width,
                  currentStrokeStyle,
                );
              }
            }}
            onStrokeStyleChange={(style) => {
              setCurrentStrokeStyle(style);
              if (selectedGraphicId && circleDrawLayerRef.current) {
                circleDrawLayerRef.current.updateCircleStyle(
                  selectedGraphicId,
                  [currentColor[0], currentColor[1], currentColor[2], 0.3],
                  [currentColor[0], currentColor[1], currentColor[2], 1],
                  currentStrokeWidth,
                  style,
                );
              }
            }}
            onDelete={() => {
              if (selectedGraphicId && circleDrawLayerRef.current) {
                circleDrawLayerRef.current.removeCircle(selectedGraphicId);
              }
              setShowFloatingToolbar(false);
              setSelectedGraphicId(null);
            }}
            onClose={() => {
              setShowFloatingToolbar(false);
              setSelectedGraphicId(null);
            }}
            theme={theme}
            t={t}
            containerRef={containerRef}
            currentColor={currentColor}
            currentStrokeWidth={currentStrokeWidth}
            currentStrokeStyle={currentStrokeStyle}
          />
        </>
      )}
    </div>
  );
};

export default EarthView;
