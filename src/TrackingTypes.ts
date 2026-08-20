export type Handedness = 'Left' | 'Right';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
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
