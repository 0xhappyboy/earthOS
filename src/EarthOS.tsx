import React from 'react';

import * as esriLoader from 'esri-loader';

export interface EarthOSProps {
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  basemap?: string;
  center?: [number, number];
  zoom?: number;
}

interface EarthOSState {
  isDragging: boolean;
  activeSplitter: number | null;
  startPosition: number;
  startSizes: number[];
  paneSizes: number[];
}

export class EarthOS extends React.Component<EarthOSProps, EarthOSState> {
  private mapContainer: HTMLDivElement | null = null;
  private view: any = null;
  private map: any = null;

  constructor(props: EarthOSProps) {
    super(props);
    this.state = {
      isDragging: false,
      activeSplitter: null,
      startPosition: 0,
      startSizes: [],
      paneSizes: [],
    };
  }

  componentDidMount() {
    this.initializeMap();
  }

  componentWillUnmount() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }

  componentDidUpdate(prevProps: EarthOSProps) {
    if (this.view && (prevProps.width !== this.props.width || prevProps.height !== this.props.height)) {
      setTimeout(() => {
        if (this.view) {
          this.view.resize();
        }
      }, 0);
    }
  }

  initializePaneSizes = () => {
  };

  initializeMap = async () => {
    try {
      const options = {
        version: '4.28',
        css: true
      };
      const [Map, MapView] = await esriLoader.loadModules([
        'esri/Map',
        'esri/views/MapView'
      ], options);
      if (!this.mapContainer) return;
      this.map = new Map({
        basemap: this.props.basemap || 'satellite'
      });
      this.view = new MapView({
        container: this.mapContainer,
        map: this.map,
        center: this.props.center || [0, 0],
        zoom: this.props.zoom || 2,
        constraints: {
          rotationEnabled: true,
          snapToZoom: false,
          minZoom: 1,
          maxZoom: 20
        },
        navigation: {
          mouseWheelZoomEnabled: true,
          browserTouchPanEnabled: true
        },
        ui: {
          // components: []
        }
      });
      await this.view.when();
    } catch (error) {
    }
  };
  render() {
    const { width = '100%', height = '100%', style, className } = this.props;
    const containerStyle: React.CSSProperties = {
      width: width,
      height: height,
      position: 'relative',
      overflow: 'hidden',
      ...style
    };
    return (
      <div
        className={className}
        style={containerStyle}
        ref={(ref) => {
          this.mapContainer = ref;
        }}
      >
        {!this.view && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              pointerEvents: 'none'
            }}
          >
            loding...
          </div>
        )}
      </div>
    );
  }
}