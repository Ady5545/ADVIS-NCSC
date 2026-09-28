import { useEffect, useRef } from 'react';
import type { SystemState } from '../App';
import { advisOrbObject, advisOrbSheet, type OrbPresentationValues } from './TheatreRuntime';

const stateRanges: Record<SystemState, [number, number]> = {
  BOOTING: [0, 1.35],
  ONLINE: [0, 8],
  LISTENING: [0.8, 3.8],
  THINKING: [2.2, 5.9],
  SPEAKING: [4.2, 7.8],
  OFFLINE: [6.2, 8],
  ERROR: [5.4, 6.7],
  CONNECTING: [0.2, 2.2],
  ONLINE_ACTIVE: [0.8, 4.6],
  SEARCHING: [0.55, 3.65],
  ANALYZING: [3.0, 7.25],
};

export function useTheatreOrbPresentation(enabled = true, systemState: SystemState = 'ONLINE') {
  const valuesRef = useRef<OrbPresentationValues>(advisOrbObject.value);

  useEffect(() => {
    if (!enabled) {
      advisOrbSheet.sequence.pause();
      return;
    }

    const unsubscribe = advisOrbObject.onValuesChange((values) => {
      valuesRef.current = values as OrbPresentationValues;
    });

    const range = stateRanges[systemState] ?? [0, 8];
    advisOrbSheet.sequence.position = range[0];
    const playback = advisOrbSheet.sequence.play({
      range,
      iterationCount: systemState === 'BOOTING' ? 1 : Infinity,
    });

    return () => {
      advisOrbSheet.sequence.pause();
      void playback.catch(() => undefined);
      unsubscribe();
    };
  }, [enabled, systemState]);

  return valuesRef;
}
