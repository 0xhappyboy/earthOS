import { useState, useCallback, MutableRefObject } from "react";
import { CircleDrawLayer, CircleDrawData } from "../../LayerManager";

interface UseDrawingProps {
  circleDrawLayerRef: MutableRefObject<CircleDrawLayer | null>;
  isMapLoading: boolean;
  isChangingBasemap: boolean;
  t: any;
  onCircleDrawn?: (data: CircleDrawData) => void;
}

export const useDrawing = (props: UseDrawingProps) => {
  const { circleDrawLayerRef, isMapLoading, isChangingBasemap, t, onCircleDrawn } = props;

  const [drawingStatus, setDrawingStatus] = useState<string | null>(null);

  const handleDrawCircle = useCallback(() => {
    if (circleDrawLayerRef.current && !isMapLoading && !isChangingBasemap) {
      setDrawingStatus(t.drawingCircle || "Drawing...");
      circleDrawLayerRef.current.startDraw((data) => {
        setDrawingStatus(null);
        onCircleDrawn?.(data);
      });
    }
  }, [onCircleDrawn, isMapLoading, isChangingBasemap, t, circleDrawLayerRef]);

  const handleStartEdit = useCallback(() => {
    const circles = circleDrawLayerRef.current?.getAllCircles();
    if (circles && circles.length > 0 && !isMapLoading && !isChangingBasemap) {
      setDrawingStatus(t.editingCircle || "Editing Circle...");
      circleDrawLayerRef.current?.startEdit(circles[0].id, () => {
        setDrawingStatus(null);
      });
    } else if (!isMapLoading && !isChangingBasemap) {
      alert(t.noCirclesToEdit);
    }
  }, [t, isMapLoading, isChangingBasemap, circleDrawLayerRef]);

  return {
    drawingStatus,
    setDrawingStatus,
    handleDrawCircle,
    handleStartEdit,
  };
};