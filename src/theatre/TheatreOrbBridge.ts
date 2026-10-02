import { useEffect, useRef } from 'react';
import { advisOrbObject, advisOrbSheet, type OrbPresentationValues } from './TheatreRuntime';

export function useTheatreOrbPresentation(enabled = true) {
  const valuesRef = useRef<OrbPresentationValues>(advisOrbObject.value);

  useEffect(() => {
    if (!enabled) {
      advisOrbSheet.sequence.pause();
      return;
    }

    const unsubscribe = advisOrbObject.onValuesChange((values) => {
      valuesRef.current = values as OrbPresentationValues;
    });

    advisOrbSheet.sequence.position = 0;
    const playback = advisOrbSheet.sequence.play({
      range: [0, 8],
      iterationCount: Infinity,
    });

    return () => {
      advisOrbSheet.sequence.pause();
      void playback.catch(() => undefined);
      unsubscribe();
    };
  }, [enabled]);

  return valuesRef;
}
