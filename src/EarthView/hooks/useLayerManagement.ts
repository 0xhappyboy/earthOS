import { useState, useCallback, MutableRefObject } from "react";
import { LayerManager } from "../../LayerManager";

interface UseLayerManagementProps {
  layerManagerRef: MutableRefObject<LayerManager | null>;
  t: any;
}

export const useLayerManagement = (props: UseLayerManagementProps) => {
  const { layerManagerRef, t } = props;
  const [layerList, setLayerList] = useState<{ id: string; name: string; visible: boolean }[]>([]);
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
  }, [layerManagerRef]);
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const layer = layerManagerRef.current?.getLayer(layerId);
    if (layer) {
      const newVisible = !layer.visible;
      layer.setVisible?.(newVisible);
      setLayerList((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: newVisible } : l)),
      );
    }
  }, [layerManagerRef]);
  const removeLayer = useCallback(
    (layerId: string) => {
      if (
        layerId === "circle-draw" ||
        layerId === "distance-measurement" ||
        layerId === "area-measurement"
      ) {
        alert(t.cannotRemoveDrawingLayer);
        return;
      }
      layerManagerRef.current?.removeLayer(layerId);
      updateLayerList();
    },
    [layerManagerRef, updateLayerList, t],
  );
  return {
    layerList,
    updateLayerList,
    toggleLayerVisibility,
    removeLayer,
  };
};