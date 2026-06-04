import { useEffect, useRef, MutableRefObject } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import { LayerManager, CircleDrawLayer, ILayer } from "../../LayerManager";
import { AreaMeasurementLayer } from "../../LayerManager/ToolLayers/AreaMeasurementLayer";
import { DistanceMeasurementLayer } from "../../LayerManager/ToolLayers/DistanceMeasurementLayer";
import { BasemapTypeEnum } from "../../types";

interface UseMapInitializationProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewRef: MutableRefObject<MapView | null>;
  mapRef: MutableRefObject<Map | null>;
  layerManagerRef: MutableRefObject<LayerManager | null>;
  circleDrawLayerRef: MutableRefObject<CircleDrawLayer | null>;
  distanceLayerRef: MutableRefObject<DistanceMeasurementLayer | null>;
  areaLayerRef: MutableRefObject<AreaMeasurementLayer | null>;
  isMountedRef: MutableRefObject<boolean>;
  currentBasemap: BasemapTypeEnum;
  layers: ILayer[];
  enableDrawing: boolean;
  zoom: number;
  t: any;
  onMapClick?: (event: { longitude: number; latitude: number }) => void;
  onLoad?: (layerManager: LayerManager, view: MapView) => void;
  updateLayerList: () => void;
  updateScale: () => void;
  setIsMapLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  destroyMap: () => void;
  getInternalCenter: () => [number, number];
}

export const useMapInitialization = (props: UseMapInitializationProps) => {
  const {
    containerRef,
    viewRef,
    mapRef,
    layerManagerRef,
    circleDrawLayerRef,
    distanceLayerRef,
    areaLayerRef,
    isMountedRef,
    currentBasemap,
    layers,
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
  } = props;

  useEffect(() => {
    if (!containerRef.current) return;
    if (viewRef.current) {
      destroyMap();
      return;
    }
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
            defaultOutlineWidth: 1,
          });
          circleDrawLayerRef.current = circleDrawLayer;
          layerManagerRef.current?.addLayer(circleDrawLayer);

          const distanceLayer = new DistanceMeasurementLayer({
            id: "distance-measurement",
            name: t.distanceMeasure,
            lineColor: [0, 170, 255, 1],
            lineWidth: 1,
            textColor: [0, 170, 255, 1],
          });
          distanceLayerRef.current = distanceLayer;
          layerManagerRef.current?.addLayer(distanceLayer);

          const areaLayer = new AreaMeasurementLayer({
            id: "area-measurement",
            name: t.areaMeasure,
            lineColor: [0, 170, 255, 1],
            lineWidth: 1,
            fillColor: [0, 170, 255, 0.2],
            textColor: [0, 170, 255, 1],
          });
          areaLayerRef.current = areaLayer;
          layerManagerRef.current?.addLayer(areaLayer);
        }
        const view = new MapView({
          container: containerRef.current!,
          map: map,
          center: internalCenter,
          zoom: zoom,
          viewingMode: "local",
          ground: "world-elevation",
          constraints: {
            rotationEnabled: true,
            snapToZoom: false,
            minZoom: 1,
            maxZoom: 20,
          } as any,
          navigation: {
            mouseWheelZoomEnabled: true,
            browserTouchPanEnabled: true,
            doubleClickZoom: false,
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
            if (distanceLayerRef.current && viewRef.current) {
              distanceLayerRef.current.setView(viewRef.current);
            }
            if (areaLayerRef.current && viewRef.current) {
              areaLayerRef.current.setView(viewRef.current);
            }
            if (layerManagerRef.current && viewRef.current) {
              layerManagerRef.current.setView(viewRef.current);
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
  }, [containerRef]);
};