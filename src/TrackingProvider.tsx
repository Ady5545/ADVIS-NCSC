import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type Handedness = 'Left' | 'Right';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface NormalizedHand {
  handedness: Handedness;
  confidence: number;
  landmarks: NormalizedLandmark[];
}

export interface NormalizedHandState {
  isTracking: boolean;
  hands: NormalizedHand[];
  timestamp: number;
}

interface TrackingContextType {
  handState: NormalizedHandState;
  setHandState: React.Dispatch<React.SetStateAction<NormalizedHandState>>;
  providerName: string;
}

const defaultState: NormalizedHandState = {
  isTracking: false,
  hands: [],
  timestamp: 0
};

const TrackingContext = createContext<TrackingContextType>({
  handState: defaultState,
  setHandState: () => {},
  providerName: 'NONE'
});

export const useTrackingState = () => useContext(TrackingContext);

export const TrackingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [handState, setHandState] = useState<NormalizedHandState>(defaultState);

  return (
    <TrackingContext.Provider value={{ handState, setHandState, providerName: 'MediaPipe' }}>
      {children}
    </TrackingContext.Provider>
  );
};
