import { useState, useCallback, MutableRefObject, useEffect } from "react";
import MapView from "@arcgis/core/views/MapView";
import { CircleDrawLayer } from "../../LayerManager";
import { AreaMeasurementLayer } from "../../LayerManager/ToolLayers/AreaMeasurementLayer";
import { DistanceMeasurementLayer } from "../../LayerManager/ToolLayers/DistanceMeasurementLayer";

interface UseRightClickMenuProps {
  viewRef: React.RefObject<MapView | null>;
  circleDrawLayerRef: MutableRefObject<CircleDrawLayer | null>;
  distanceLayerRef: MutableRefObject<DistanceMeasurementLayer | null>;
  areaLayerRef: MutableRefObject<AreaMeasurementLayer | null>;
}

export const useRightClickMenu = (props: UseRightClickMenuProps) => {
  const { viewRef, circleDrawLayerRef, distanceLayerRef, areaLayerRef } = props;
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({ x: 100, y: 100 });
  const [selectedGraphicId, setSelectedGraphicId] = useState<string | null>(null);
  const [showMeasurementToolbar, setShowMeasurementToolbar] = useState(false);
  const [measurementToolbarPosition, setMeasurementToolbarPosition] = useState({ x: 100, y: 100 });
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const handleDeleteMeasurement = useCallback(() => {
    if (selectedMeasurementId) {
      const deleted =
        distanceLayerRef.current?.deleteMeasurement(selectedMeasurementId) ||
        areaLayerRef.current?.deleteMeasurement(selectedMeasurementId);
      if (deleted) {
        setShowMeasurementToolbar(false);
        setSelectedMeasurementId(null);
      }
    }
  }, [selectedMeasurementId, distanceLayerRef, areaLayerRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      console.warn("useRightClickMenu: viewRef.current is null");
      return;
    }

    const handleImmediateClick = (event: any) => {
      if (event.button !== 2) return;
      event.stopPropagation();
      view
        .hitTest(event)
        .then((response: any) => {
          const results = response.results;
          const circleHit = results.find((hit: any) => {
            return hit.graphic && hit.graphic.layer?.id === "circle-draw";
          });

          if (circleHit && circleHit.graphic) {
            const graphic = circleHit.graphic;
            const id = graphic.attributes?.id;
            if (id) {
              console.log("Circle right-click detected, id:", id);
              setSelectedGraphicId(id);
              setFloatingToolbarPosition({ x: event.x, y: event.y });
              setShowFloatingToolbar(true);
              setShowMeasurementToolbar(false);
              setSelectedMeasurementId(null);
              return;
            }
          }
          const measurementHit = results.find((hit: any) => {
            const layerId = hit.graphic?.layer?.id;
            return layerId === "distance-measurement" || layerId === "area-measurement";
          });
          if (measurementHit && measurementHit.graphic) {
            const graphic = measurementHit.graphic;
            let id = distanceLayerRef.current?.findMeasurementIdByGraphic(graphic);
            if (!id) {
              id = areaLayerRef.current?.findMeasurementIdByGraphic(graphic);
            }
            if (id) {
              console.log("Measurement right-click detected, id:", id);
              setSelectedMeasurementId(id);
              setMeasurementToolbarPosition({ x: event.x, y: event.y });
              setShowMeasurementToolbar(true);
              setShowFloatingToolbar(false);
              setSelectedGraphicId(null);
              return;
            }
          }
          setShowFloatingToolbar(false);
          setSelectedGraphicId(null);
          setShowMeasurementToolbar(false);
          setSelectedMeasurementId(null);
        })
        .catch((err: any) => {
          console.warn("HitTest error:", err);
          setShowFloatingToolbar(false);
          setSelectedGraphicId(null);
          setShowMeasurementToolbar(false);
          setSelectedMeasurementId(null);
        });
    };

    const handleClick = () => {
      setShowFloatingToolbar(false);
      setSelectedGraphicId(null);
      setShowMeasurementToolbar(false);
      setSelectedMeasurementId(null);
    };

    view.on("immediate-click", handleImmediateClick);
    view.on("click", handleClick);

    return () => {
      if (view) {
        try {
          (view as any).remove?.("immediate-click", handleImmediateClick);
          (view as any).remove?.("click", handleClick);
        } catch (e) {
          console.warn("Error removing event listeners:", e);
        }
      }
    };
  }, [viewRef.current]);

  return {
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
  };
};