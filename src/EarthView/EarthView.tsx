import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { toWGS84 } from "../CoordTransform";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "../types";
import { LayerManager, ILayer, CircleDrawData } from "../LayerManager";
import { PopupMarkerLayer } from "../LayerManager/DataLayers/PopupMarkerLayer";
import { EarthViewProps } from "./types";
import { PopupPanel } from "./components/PopupPanel";
import { Toolbar } from "./components/Toolbar";
import { ScaleBar } from "./components/ScaleBar";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { BasemapOptions } from "./components/BasemapOptions";
import { LayersPanel } from "./components/LayersPanel";
import { DrawToolsPanel } from "./components/DrawToolsPanel";
import { ToolsPanel } from "./components/ToolsPanel";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { MeasurementFloatingToolbar } from "./components/MeasurementFloatingToolbar";
import { getTranslation } from "../i18n";
import {
  useMapInitialization,
  useMapEvents,
  useMeasurement,
  useDrawing,
  useLayerManagement,
  useRightClickMenu,
} from "./hooks";

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
  const circleDrawLayerRef = useRef<any>(null);
  const distanceLayerRef = useRef<any>(null);
  const areaLayerRef = useRef<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isChangingBasemap, setIsChangingBasemap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const [currentScale, setCurrentScale] = useState<string>("");
  const [activePopup, setActivePopup] = useState<
    "layers" | "basemap" | "draw" | "tools" | null
  >(null);
  const [currentBasemap, setCurrentBasemap] =
    useState<BasemapTypeEnum>(basemap);
  const t = getTranslation(i18n);
  const isDark = theme === "dark";
  const [normalLayers, setNormalLayers] = useState<ILayer[]>([]);

  useEffect(() => {
    const normals: ILayer[] = [];
    const popups: PopupMarkerLayer[] = [];
    for (const layer of layers) {
      if (layer instanceof PopupMarkerLayer) {
        popups.push(layer);
      } else {
        normals.push(layer);
      }
    }
    setNormalLayers(normals);
    setPopupMarkerLayers(popups);
  }, [layers]);

  const getInternalCenter = useCallback((): [number, number] => {
    if (!center || center.length !== 2) return [0, 0];
    const [lng, lat] = center;
    if (coordinateSystem === CoordinateSystemTypeEnum.WGS84) {
      return [lng, lat];
    }
    const [convertedLng, convertedLat] = toWGS84(lng, lat, coordinateSystem);
    return [convertedLng, convertedLat];
  }, [center, coordinateSystem]);

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

  const { layerList, updateLayerList, toggleLayerVisibility, removeLayer } =
    useLayerManagement({
      layerManagerRef,
      t,
    });

  const { drawingStatus, handleDrawCircle, handleStartEdit } = useDrawing({
    circleDrawLayerRef,
    isMapLoading,
    isChangingBasemap,
    t,
    onCircleDrawn,
  });

  const [popupMarkerLayers, setPopupMarkerLayers] = useState<
    PopupMarkerLayer[]
  >([]);

  const allLayerList = useMemo(() => {
    const normalLayers = layerList;
    const popupLayers = popupMarkerLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
    }));
    return [...normalLayers, ...popupLayers];
  }, [layerList, popupMarkerLayers]);

  const handleToggleVisibility = useCallback(
    (layerId: string) => {
      const popupLayer = popupMarkerLayers.find((l) => l.id === layerId);
      if (popupLayer) {
        popupLayer.setVisible(!popupLayer.visible);
        setPopupMarkerLayers([...popupMarkerLayers]);
        return;
      }
      toggleLayerVisibility(layerId);
    },
    [popupMarkerLayers, toggleLayerVisibility],
  );

  const handleRemoveLayer = useCallback(
    (layerId: string) => {
      const popupLayer = popupMarkerLayers.find((l) => l.id === layerId);
      if (popupLayer) {
        popupLayer.destroy();
        const newPopups = popupMarkerLayers.filter((l) => l.id !== layerId);
        setPopupMarkerLayers(newPopups);
        return;
      }
      removeLayer(layerId);
    },
    [popupMarkerLayers, removeLayer],
  );

  const {
    isMeasuring,
    setIsMeasuring,
    currentMeasureType,
    setCurrentMeasureType,
    measurePreview,
    setMeasurePreview,
    measureStatus,
    setMeasureStatus,
    handleDistanceMeasure,
    handleAreaMeasure,
    handleClearMeasurements,
  } = useMeasurement({
    distanceLayerRef,
    areaLayerRef,
    viewRef,
    isMapLoading,
    isChangingBasemap,
    t,
  });

  const {
    showFloatingToolbar,
    setShowFloatingToolbar,
    floatingToolbarPosition,
    setFloatingToolbarPosition,
    selectedGraphicId,
    setSelectedGraphicId,
    showMeasurementToolbar,
    setShowMeasurementToolbar,
    measurementToolbarPosition,
    setMeasurementToolbarPosition,
    selectedMeasurementId,
    setSelectedMeasurementId,
    handleDeleteMeasurement,
  } = useRightClickMenu({
    viewRef,
    circleDrawLayerRef,
    distanceLayerRef,
    areaLayerRef,
  });

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

  useEffect(() => {
    if (!viewRef.current) return;

    const popupLayers = layers.filter(
      (l) => l.constructor.name === "PopupMarkerLayer",
    );
    if (popupLayers.length === 0) return;

    viewRef.current.when().then(() => {
      setTimeout(() => {
        for (const layer of popupLayers) {
          if (!(layer as any)._earthViewInitialized) {
            (layer as PopupMarkerLayer).init(viewRef.current!);
            (layer as any)._earthViewInitialized = true;
          }
        }
      }, 100);
    });
  }, [layers, viewRef.current]);

  try {
    useMapInitialization({
      containerRef,
      viewRef,
      mapRef,
      layerManagerRef,
      circleDrawLayerRef,
      distanceLayerRef,
      areaLayerRef,
      isMountedRef,
      currentBasemap,
      layers: [],
      enableDrawing,
      zoom,
      t,
      onMapClick,
      onLoad,
      updateLayerList,
      updateScale,
      setIsMapLoading,
      setError,
      destroyMap,
      getInternalCenter,
    });
  } catch (err) {
    console.error("init error");
    console.error(err);
  }

  useEffect(() => {
    if (!layerManagerRef.current) return;
    if (normalLayers.length === 0) return;
    for (const layer of normalLayers) {
      if (!layerManagerRef.current.getLayer(layer.id)) {
        layerManagerRef.current.addLayer(layer);
      }
    }
  }, [normalLayers, layerManagerRef.current]);

  useMapEvents({
    viewRef,
    isMapLoading,
    isChangingBasemap,
    coordinateSystem,
    updateScale,
  });

  useEffect(() => {
    if (!viewRef.current) return;
    const popupLayers = layers.filter(
      (l) => l.constructor.name === "PopupMarkerLayer",
    );
    if (popupLayers.length === 0) return;
    viewRef.current.when().then(() => {
      setTimeout(() => {
        for (const layer of popupLayers) {
          if (!(layer as any)._earthViewInitialized) {
            (layer as PopupMarkerLayer).init(viewRef.current!);
            (layer as any)._earthViewInitialized = true;
            console.log("PopupMarkerLayer initialized:", layer.id);
          }
        }
      }, 100);
    });
  }, [layers, viewRef.current]);

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

  const handleLocate = useCallback(() => {
    if (!viewRef.current || isMapLoading || isChangingBasemap) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        viewRef.current
          ?.goTo(
            { target: [longitude, latitude], zoom: 15 },
            { duration: 1000 },
          )
          .catch((err: Error) => console.warn("GoTo failed:", err));
      },
      (error) => {
        console.warn("Geolocation error:", error);
        alert("Unable to get your location. Please check browser permissions.");
      },
    );
  }, [isMapLoading, isChangingBasemap]);

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
          <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}>
            {drawingStatus}
          </span>
        </div>
      )}
      {measureStatus && !showLoading && (
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            background: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)",
            border: `1px solid ${isDark ? "#444" : "#ddd"}`,
            borderRadius: "8px",
            padding: "6px 12px",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              background: "#00aaff",
              borderRadius: "50%",
              animation: "pulse 1s infinite",
            }}
          />
          <span style={{ color: isDark ? "#fff" : "#333", fontSize: "12px" }}>
            {measureStatus}
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
                layerList={allLayerList}
                onToggleVisibility={handleToggleVisibility}
                onRemoveLayer={handleRemoveLayer}
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

          {activePopup === "tools" && (
            <PopupPanel
              title={t.tools}
              onClose={() => {
                setMeasureStatus(null);
                setActivePopup(null);
              }}
              theme={theme}
              t={t}
            >
              <ToolsPanel
                onDistanceMeasure={handleDistanceMeasure}
                onAreaMeasure={handleAreaMeasure}
                onClearMeasurements={handleClearMeasurements}
                isMeasuring={isMeasuring}
                currentMeasureType={currentMeasureType}
                measurePreview={measurePreview}
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
            onLocate={handleLocate}
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

          <MeasurementFloatingToolbar
            visible={showMeasurementToolbar}
            position={measurementToolbarPosition}
            onPositionChange={setMeasurementToolbarPosition}
            onDelete={handleDeleteMeasurement}
            onClose={() => {
              setShowMeasurementToolbar(false);
              setSelectedMeasurementId(null);
            }}
            theme={theme}
            t={t}
            containerRef={containerRef}
          />
        </>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default EarthView;
