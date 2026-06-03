// EarthView/EarthView.tsx
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
import { getTranslation } from "../i18n";
import {
  EyeIcon,
  EyeOffIcon,
  DeleteIcon,
  CheckIcon,
  CircleIcon,
  EditIcon,
} from "../icons";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const mapRef = useRef<Map | null>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const circleDrawLayerRef = useRef<CircleDrawLayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    if (viewRef.current && !isLoading && !isChangingBasemap) {
      const newZoom = (viewRef.current.zoom || 12) + 1;
      viewRef.current.zoom = newZoom;
      setTimeout(updateScale, 100);
    }
  }, [updateScale, isLoading, isChangingBasemap]);

  const handleZoomOut = useCallback(() => {
    if (viewRef.current && !isLoading && !isChangingBasemap) {
      const newZoom = (viewRef.current.zoom || 12) - 1;
      viewRef.current.zoom = newZoom;
      setTimeout(updateScale, 100);
    }
  }, [updateScale, isLoading, isChangingBasemap]);

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

      // 底图切换后延迟隐藏加载状态
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
    if (circleDrawLayerRef.current && !isLoading && !isChangingBasemap) {
      setIsDrawing(true);
      circleDrawLayerRef.current.startDraw((data) => {
        setIsDrawing(false);
        onCircleDrawn?.(data);
        setActivePopup(null);
      });
    }
  }, [onCircleDrawn, isLoading, isChangingBasemap]);

  const handleStartEdit = useCallback(() => {
    const circles = circleDrawLayerRef.current?.getAllCircles();
    if (circles && circles.length > 0 && !isLoading && !isChangingBasemap) {
      circleDrawLayerRef.current?.startEdit(circles[0].id, (data) => {
        console.log("Edit complete:", data);
        setActivePopup(null);
      });
    } else if (!isLoading && !isChangingBasemap) {
      alert(t.noCirclesToEdit);
    }
  }, [t, isLoading, isChangingBasemap]);

  // 初始化地图
  useEffect(() => {
    isMountedRef.current = true;
    if (!containerRef.current) return;

    const internalCenter = getInternalCenter();

    const initMap = async () => {
      try {
        destroyMap();
        setIsLoading(true);
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
            name: t.drawCircle,
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
            setIsLoading(false);
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
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      destroyMap();
    };
  }, [
    currentBasemap,
    zoom,
    getInternalCenter,
    layers,
    onLoad,
    onMapClick,
    enableDrawing,
    destroyMap,
    updateLayerList,
    updateScale,
    t,
  ]);

  useEffect(() => {
    const handleLocate = (event: CustomEvent) => {
      if (!viewRef.current || isLoading || isChangingBasemap) return;
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
  }, [coordinateSystem, isLoading, isChangingBasemap]);

  // 加载状态组件
  const LoadingOverlay = ({ message }: { message: string }) => (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: `3px solid ${isDark ? "#444" : "#ddd"}`,
          borderTop: `3px solid #00aaff`,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <span
        style={{
          color: isDark ? "#fff" : "#333",
          fontSize: "13px",
          background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
          padding: "4px 12px",
          borderRadius: "4px",
        }}
      >
        {message}
      </span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const basemapOptions: {
    value: BasemapTypeEnum;
    label: string;
    icon: string;
  }[] = [
    { value: BasemapTypeEnum.SATELLITE, label: t.satellite, icon: "🛰️" },
    { value: BasemapTypeEnum.STREETS, label: t.streets, icon: "🗺️" },
    { value: BasemapTypeEnum.TOPO, label: t.topographic, icon: "⛰️" },
    { value: BasemapTypeEnum.DARK_GRAY, label: t.darkGray, icon: "🌙" },
    { value: BasemapTypeEnum.GRAY, label: t.lightGray, icon: "☀️" },
    { value: BasemapTypeEnum.HYBRID, label: t.hybrid, icon: "🔄" },
    { value: BasemapTypeEnum.TERRAIN, label: t.terrain, icon: "🗻" },
    { value: BasemapTypeEnum.OCEANS, label: t.oceans, icon: "🌊" },
    {
      value: BasemapTypeEnum.NATIONAL_GEOGRAPHIC,
      label: t.nationalGeographic,
      icon: "📰",
    },
    { value: BasemapTypeEnum.LIGHT_GRAY, label: t.lightGray, icon: "⬜" },
    { value: BasemapTypeEnum.IMAGERY, label: t.imagery, icon: "📷" },
    { value: BasemapTypeEnum.PHYSICAL, label: t.physical, icon: "🌎" },
  ];

  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  // 判断是否显示加载中
  const showLoading = isLoading || isChangingBasemap;
  const loadingMessage = isLoading ? t.loading : t.changingBasemap;

  return (
    <div className={className} style={containerStyle}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* 加载遮罩层 */}
      {showLoading && <LoadingOverlay message={loadingMessage} />}

      {/* 错误提示 */}
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

      {/* 弹窗和工具栏 - 只在非加载状态下显示 */}
      {!showLoading && (
        <>
          {activePopup === "layers" && (
            <PopupPanel
              title={t.layers}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              {layerList.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: isDark ? "#888" : "#999",
                    fontSize: "12px",
                  }}
                >
                  {t.noLayers}
                </div>
              ) : (
                layerList.map((layer) => (
                  <div
                    key={layer.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 12px",
                      borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flex: 1,
                      }}
                    >
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        title={layer.visible ? t.hideLayer : t.showLayer}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px",
                          color: layer.visible
                            ? isDark
                              ? "#00aaff"
                              : "#0077cc"
                            : isDark
                              ? "#888"
                              : "#ccc",
                        }}
                      >
                        {layer.visible ? (
                          <EyeIcon size={14} />
                        ) : (
                          <EyeOffIcon size={14} />
                        )}
                      </button>
                      <span
                        style={{
                          color: isDark ? "#fff" : "#333",
                          fontSize: "12px",
                          flex: 1,
                        }}
                      >
                        {layer.name}
                      </span>
                    </div>
                    {layer.id !== "circle-draw" && (
                      <button
                        onClick={() => removeLayer(layer.id)}
                        title={t.deleteLayerTitle}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px",
                          color: "#f44336",
                        }}
                      >
                        <DeleteIcon size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </PopupPanel>
          )}

          {activePopup === "basemap" && (
            <PopupPanel
              title={t.basemap}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              {basemapOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => switchBasemap(option.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    background:
                      currentBasemap === option.value
                        ? isDark
                          ? "#2a2a2a"
                          : "#f0f0f0"
                        : "transparent",
                    borderLeft:
                      currentBasemap === option.value
                        ? `3px solid #00aaff`
                        : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (currentBasemap !== option.value) {
                      e.currentTarget.style.background = isDark
                        ? "#2a2a2a"
                        : "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentBasemap !== option.value) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ fontSize: "14px" }}>{option.icon}</span>
                  <span
                    style={{
                      color: isDark ? "#fff" : "#333",
                      fontSize: "12px",
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </span>
                  {currentBasemap === option.value && <CheckIcon size={12} />}
                </div>
              ))}
            </PopupPanel>
          )}

          {activePopup === "draw" && (
            <PopupPanel
              title={t.drawTools}
              onClose={() => setActivePopup(null)}
              theme={theme}
              t={t}
            >
              <div
                onClick={() => {
                  handleDrawCircle();
                  setActivePopup(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "#2a2a2a"
                    : "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <CircleIcon size={14} />
                <span
                  style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}
                >
                  {t.drawCircle}
                </span>
              </div>
              <div
                onClick={() => {
                  handleStartEdit();
                  setActivePopup(null);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "#2a2a2a"
                    : "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <EditIcon size={14} />
                <span
                  style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}
                >
                  {t.editCircle}
                </span>
              </div>
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
        </>
      )}
    </div>
  );
};

export default EarthView;
