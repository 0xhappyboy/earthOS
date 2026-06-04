import { LayerManager, PopupMarkerLayer } from "../LayerManager";
import MapView from "@arcgis/core/views/MapView";
import { CircleDrawData } from "../LayerManager/DrawLayers/CircleDrawLayer";
import { BasemapTypeEnum, CoordinateSystemTypeEnum } from "../types";

export interface EarthViewProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  basemap?: BasemapTypeEnum;
  center?: [number, number];
  zoom?: number;
  coordinateSystem?: CoordinateSystemTypeEnum;
  layers?: (ILayer | PopupMarkerLayer)[];
  onLoad?: (layerManager: LayerManager, view: MapView) => void;
  onMapClick?: (event: { longitude: number; latitude: number }) => void;
  enableDrawing?: boolean;
  onCircleDrawn?: (data: CircleDrawData) => void;
  i18n?: "en" | "zh";
  theme?: "light" | "dark";
}

export interface ILayer {
  id: string;
  name: string;
  visible: boolean;
  opacity?: number;
  createLayer(): any;
  getLayer?(): any | null;
  updateData?(data: any): void;
  clear?(): void;
  destroy(): void;
  setVisible?(visible: boolean): void;
  setOpacity?(opacity: number): void;
}