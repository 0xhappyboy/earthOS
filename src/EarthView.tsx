import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Point from "@arcgis/core/geometry/Point";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import Expand from "@arcgis/core/widgets/Expand";
import Zoom from "@arcgis/core/widgets/Zoom";
import { toWGS84 } from "./CoordTransform";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "./types";

export interface EarthViewProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  basemap?: BasemapTypeEnum;
  // Longitude, Latitude
  center?: [number, number];
  zoom?: number;
  /** The input coordinate system is WGS84 by default. */
  coordinateSystem?: CoordinateSystemTypeEnum;
}

export const EarthView: React.FC<EarthViewProps> = ({
  width = "100%",
  height = "100%",
  style,
  className = BasemapTypeEnum.SATELLITE,
  basemap = "satellite",
  center = [0, 0],
  zoom = 12,
  coordinateSystem = CoordinateSystemTypeEnum.WGS84,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      if (graphicsLayerRef.current) {
        graphicsLayerRef.current = null;
      }
    } catch (err) {
      console.warn("Error destroying map:", err);
    }
  }, []);

  const addMarker = useCallback(
    (longitude: number, latitude: number, color?: number[]) => {
      if (!viewRef.current || !graphicsLayerRef.current) return;
      try {
        const point = new Point({ longitude, latitude });
        const symbol = new SimpleMarkerSymbol({
          color: color || [255, 0, 0, 0.8],
          size: 12,
          outline: { color: [255, 255, 255], width: 2 },
        });
        const graphic = new Graphic({ geometry: point, symbol });
        graphicsLayerRef.current.removeAll();
        graphicsLayerRef.current.add(graphic);
      } catch (err) {
        console.warn("Failed to add marker:", err);
      }
    },
    [],
  );

  const goToLocation = useCallback(
    (
      longitude: number,
      latitude: number,
      targetZoom?: number,
      inputSystem?: CoordinateSystemTypeEnum,
    ) => {
      if (!viewRef.current) return;
      const system = inputSystem || coordinateSystem;
      let wgs84Lng = longitude;
      let wgs84Lat = latitude;
      if (system !== CoordinateSystemTypeEnum.WGS84) {
        [wgs84Lng, wgs84Lat] = toWGS84(longitude, latitude, system);
      }
      try {
        viewRef.current
          .goTo(
            { target: [wgs84Lng, wgs84Lat], zoom: targetZoom || 12 },
            { duration: 1000 },
          )
          .catch((err: Error) => console.warn("GoTo failed:", err));
        addMarker(wgs84Lng, wgs84Lat);
      } catch (err) {
        console.warn("GoTo error:", err);
      }
    },
    [addMarker, coordinateSystem],
  );

  useEffect(() => {
    isMountedRef.current = true;
    if (!containerRef.current) return;
    const internalCenter = getInternalCenter();
    const initMap = async () => {
      try {
        destroyMap();
        const map = new Map({ basemap });
        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);
        graphicsLayerRef.current = graphicsLayer;
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
        await view.when();
        if (isMountedRef.current) {
          setIsLoading(false);
          window.dispatchEvent(new CustomEvent("EarthView-loaded"));
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
  }, [basemap, zoom, destroyMap, getInternalCenter]);

  useEffect(() => {
    const handleLocate = (event: CustomEvent) => {
      const { center: newCenter, zoom: newZoom, system } = event.detail;
      if (newCenter && newCenter.length === 2) {
        goToLocation(newCenter[0], newCenter[1], newZoom, system);
      }
    };
    const handleAddMarker = (event: CustomEvent) => {
      const { lng, lat, color, system } = event.detail;
      let wgs84Lng = lng;
      let wgs84Lat = lat;
      if (system && system !== CoordinateSystemTypeEnum.WGS84) {
        [wgs84Lng, wgs84Lat] = toWGS84(lng, lat, system);
      } else if (coordinateSystem !== CoordinateSystemTypeEnum.WGS84) {
        [wgs84Lng, wgs84Lat] = toWGS84(lng, lat, coordinateSystem);
      }
      addMarker(wgs84Lng, wgs84Lat, color);
    };
    window.addEventListener("EarthView-locate", handleLocate as EventListener);
    window.addEventListener(
      "EarthView-add-marker",
      handleAddMarker as EventListener,
    );
    return () => {
      window.removeEventListener(
        "EarthView-locate",
        handleLocate as EventListener,
      );
      window.removeEventListener(
        "EarthView-add-marker",
        handleAddMarker as EventListener,
      );
    };
  }, [goToLocation, addMarker, coordinateSystem]);

  useEffect(() => {
    const handleGetCenter = (event: CustomEvent) => {
      if (viewRef.current && event.detail?.callbackId) {
        const center = viewRef.current.center;
        const { longitude, latitude } = center;
        window.dispatchEvent(
          new CustomEvent(
            `EarthView-center-response-${event.detail.callbackId}`,
            {
              detail: {
                center: [longitude, latitude],
                zoom: viewRef.current.zoom,
              },
            },
          ),
        );
      }
    };
    window.addEventListener(
      "EarthView-get-center",
      handleGetCenter as EventListener,
    );
    return () => {
      window.removeEventListener(
        "EarthView-get-center",
        handleGetCenter as EventListener,
      );
    };
  }, []);

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
