import MapView from "@arcgis/core/views/MapView";
import { useState, useCallback, MutableRefObject } from "react";
import { AreaMeasurementLayer } from "../../LayerManager/ToolLayers/AreaMeasurementLayer";
import { DistanceMeasurementLayer } from "../../LayerManager/ToolLayers/DistanceMeasurementLayer";

interface UseMeasurementProps {
  distanceLayerRef: MutableRefObject<DistanceMeasurementLayer | null>;
  areaLayerRef: MutableRefObject<AreaMeasurementLayer | null>;
  viewRef: React.RefObject<MapView | null>;
  isMapLoading: boolean;
  isChangingBasemap: boolean;
  t: any;
}

export const useMeasurement = (props: UseMeasurementProps) => {
  const { distanceLayerRef, areaLayerRef, viewRef, isMapLoading, isChangingBasemap, t } = props;
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasureType, setCurrentMeasureType] = useState<"distance" | "area" | null>(null);
  const [measurePreview, setMeasurePreview] = useState<{ distance?: number; area?: number } | null>(null);
  const [measureStatus, setMeasureStatus] = useState<string | null>(null);
  const handleDistanceMeasure = useCallback(() => {
    if (
      distanceLayerRef.current &&
      viewRef.current &&
      !isMapLoading &&
      !isChangingBasemap
    ) {
      setMeasureStatus(t.clickToStartMeasure);
      distanceLayerRef.current.startMeasure((data: any) => {
        if (data.isDrawing) {
          const distanceText =
            data.distance >= 1000
              ? `${(data.distance / 1000).toFixed(2)} ${t.kilometers}`
              : `${data.distance.toFixed(0)} ${t.meters}`;
          setMeasureStatus(
            `${t.distance}: ${distanceText} | ${t.doubleClickToFinish}`,
          );
        } else {
          setMeasureStatus(null);
        }
      });
    }
  }, [isMapLoading, isChangingBasemap, t, distanceLayerRef, viewRef]);

  const handleAreaMeasure = useCallback(() => {
    if (
      areaLayerRef.current &&
      viewRef.current &&
      !isMapLoading &&
      !isChangingBasemap
    ) {
      setMeasureStatus(t.clickToStartMeasure);
      areaLayerRef.current.startMeasure((data: any) => {
        const areaText =
          data.area >= 1000000
            ? `${(data.area / 1000000).toFixed(2)} ${t.squareKilometers}`
            : `${data.area.toFixed(0)} ${t.squareMeters}`;
        setMeasureStatus(`${t.area}: ${areaText}`);
        setTimeout(() => {
          setMeasureStatus(null);
        }, 2000);
      });
    }
  }, [isMapLoading, isChangingBasemap, t, areaLayerRef, viewRef]);

  const handleClearMeasurements = useCallback(() => {
    distanceLayerRef.current?.clearAllMeasurements();
    areaLayerRef.current?.clearAllMeasurements();
    if (isMeasuring) {
      setIsMeasuring(false);
      setCurrentMeasureType(null);
      setMeasurePreview(null);
      setMeasureStatus(null);
    }
  }, [isMeasuring, distanceLayerRef, areaLayerRef]);

  return {
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
  };
};