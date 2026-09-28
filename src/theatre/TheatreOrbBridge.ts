import { useEffect, useRef } from 'react';
import { advisOrbObject, advisOrbSheet, type OrbPresentationValues } from './TheatreRuntime';

export function useTheatreOrbPresentation() {
  const valuesRef = useRef<OrbPresentationValues>(advisOrbObject.value);

  useEffect(() => {
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
  }, []);

  return valuesRef;
}
