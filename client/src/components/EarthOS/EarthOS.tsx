import React from 'react';

export interface EarthOSProps {
}

interface EarthOSState {
  isDragging: boolean;
  activeSplitter: number | null;
  startPosition: number;
  startSizes: number[];
  paneSizes: number[];
}

export class EarthOS extends React.Component<EarthOSProps, EarthOSState> {
  constructor(props: EarthOSProps) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps: EarthOSProps) {
  }

  initializePaneSizes = () => {
  }

  render() {
    return (
      <>
      </>
    );
  }
}
