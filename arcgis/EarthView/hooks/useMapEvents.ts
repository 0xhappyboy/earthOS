import { useEffect } from "react";
import MapView from "@arcgis/core/views/MapView";
import { toWGS84 } from "../../CoordTransform";
import { CoordinateSystemTypeEnum } from "../../types";

interface UseMapEventsProps {
  viewRef: React.RefObject<MapView | null>;
  isMapLoading: boolean;
  isChangingBasemap: boolean;
  coordinateSystem: CoordinateSystemTypeEnum;
  updateScale: () => void;
}

export const useMapEvents = (props: UseMapEventsProps) => {
  const { viewRef, isMapLoading, isChangingBasemap, coordinateSystem, updateScale } = props;
  useEffect(() => {
    const handleLocateEvent = (event: CustomEvent) => {
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
    window.addEventListener(
      "EarthView-locate",
      handleLocateEvent as EventListener,
    );
    return () => {
      window.removeEventListener(
        "EarthView-locate",
        handleLocateEvent as EventListener,
      );
    };
  }, [coordinateSystem, isMapLoading, isChangingBasemap, viewRef]);

  return { updateScale };
};