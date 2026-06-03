import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Zoom from "@arcgis/core/widgets/Zoom";
import { toWGS84 } from "./CoordTransform";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "./types";
import {
  LayerManager,
  ILayer,
  CircleDrawLayer,
  CircleDrawData,
} from "./LayerManager";

export interface EarthViewProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  basemap?: BasemapTypeEnum;
  center?: [number, number];
  zoom?: number;
  coordinateSystem?: CoordinateSystemTypeEnum;
  layers?: ILayer[];
  onLoad?: (layerManager: LayerManager, view: MapView) => void;
  onMapClick?: (event: { longitude: number; latitude: number }) => void;
  enableDrawing?: boolean;
  onCircleDrawn?: (data: CircleDrawData) => void;
}

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const mapRef = useRef<Map | null>(null);
  const layerManagerRef = useRef<LayerManager | null>(null);
  const circleDrawLayerRef = useRef<CircleDrawLayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isMountedRef = useRef(true);

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

  const handleStartDraw = useCallback(() => {
    console.log("handleStartDraw called, isDrawing:", isDrawing);
    if (circleDrawLayerRef.current) {
      setIsDrawing(true);
      circleDrawLayerRef.current.startDraw((data) => {
        console.log("Draw complete:", data);
        setIsDrawing(false);
        onCircleDrawn?.(data);
      });
    } else {
      console.error("CircleDrawLayer not initialized");
    }
  }, [onCircleDrawn, isDrawing]);

  const handleCancelDraw = useCallback(() => {
    if (circleDrawLayerRef.current) {
      circleDrawLayerRef.current.stopDraw();
      setIsDrawing(false);
    }
  }, []);

  const handleClearAll = useCallback(() => {
    if (circleDrawLayerRef.current) {
      circleDrawLayerRef.current.clearAllCircles();
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!containerRef.current) return;
    const internalCenter = getInternalCenter();
    const initMap = async () => {
      try {
        destroyMap();
        const map = new Map({ basemap });
        mapRef.current = map;
        layerManagerRef.current = new LayerManager(map);
        layers.forEach((layer) => {
          layerManagerRef.current?.addLayer(layer);
        });
        if (enableDrawing) {
          const circleDrawLayer = new CircleDrawLayer({
            id: "circle-draw",
            name: "圆形绘图",
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

        const zoomWidget = new Zoom({ view: view });
        view.ui.add(zoomWidget, "top-right");

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
              console.log("CircleDrawLayer view set");
            }
          }, 100);

          setIsLoading(false);
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
    basemap,
    zoom,
    getInternalCenter,
    layers,
    onLoad,
    onMapClick,
    enableDrawing,
    destroyMap,
  ]);

  useEffect(() => {
    const handleLocate = (event: CustomEvent) => {
      if (!viewRef.current) return;
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
  }, [coordinateSystem]);

  const containerStyle: React.CSSProperties = {
    width: width,
    height: height,
    position: "relative",
    overflow: "hidden",
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {enableDrawing && !isLoading && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 100,
            display: "flex",
            gap: "8px",
            background: "rgba(0,0,0,0.7)",
            padding: "8px 12px",
            borderRadius: "8px",
            backdropFilter: "blur(4px)",
          }}
        >
          <button
            onClick={handleStartDraw}
            disabled={isDrawing}
            style={{
              padding: "6px 12px",
              background: isDrawing ? "#666" : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isDrawing ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            {isDrawing ? "绘制中..." : "🔴 画圆形"}
          </button>
          {isDrawing && (
            <button
              onClick={handleCancelDraw}
              style={{
                padding: "6px 12px",
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              ⏹️ 取消
            </button>
          )}
          <button
            onClick={handleClearAll}
            style={{
              padding: "6px 12px",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🗑️ 清除
          </button>
        </div>
      )}

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "14px",
            pointerEvents: "none",
          }}
        >
          Loading Map...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            background: "rgba(255,0,0,0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default EarthView;
