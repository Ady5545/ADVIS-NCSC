type Subscriber<T> = (values: T) => void;

export interface OrbPresentationValues {
  coreScale: number;
  shellScale: number;
  ringSpread: number;
  ringSpeed: number;
  halo: number;
  filamentIntensity: number;
  particleEnergy: number;
  breathing: number;
  technicalOpacity: number;
  gridOpacity: number;
  radialIntensity: number;
  arcIntensity: number;
  microEnergy: number;
  shellDrift: number;
  depthActivity: number;
  circuitOpacity: number;
  scanSpeed: number;
}

export interface V12PresentationValues {
  cameraRadius: number;
  cameraTheta: number;
  cameraPhi: number;
  explodedFactor: number;
  highlightIntensity: number;
  focusCylinder: number;
}

export interface MoleculePresentationValues {
  cameraDistance: number;
  rotationY: number;
  rotationX: number;
  annotationOpacity: number;
  presentationScale: number;
  highlightIntensity: number;
}

interface LocalSequence {
  position: number;
  play(options?: { range?: [number, number]; iterationCount?: number }): Promise<boolean>;
  pause(): void;
}

interface LocalObject<T extends object> {
  value: T;
  onValuesChange(callback: Subscriber<T>): () => void;
  sequence: LocalSequence;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function createLocalObject<T extends object>(
  initial: T,
  sample: (progress: number, current: T) => T
): LocalObject<T> {
  let current = { ...initial };
  const subscribers = new Set<Subscriber<T>>();
  let animationFrame: number | null = null;
  let cancelledToken = 0;

  const notify = () => {
    for (const subscriber of subscribers) subscriber(current);
  };

  const sequence: LocalSequence = {
    position: 0,
    play(options = {}) {
      const range = options.range ?? [0, 8];
      const iterationCount = options.iterationCount ?? 1;
      const durationMs = Math.max(1, (range[1] - range[0]) * 1000);
      const infinite = iterationCount === Infinity;
      const token = ++cancelledToken;

      if (animationFrame !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }

      if (typeof window === 'undefined') {
        current = sample(1, { ...current });
        sequence.position = range[1];
        notify();
        return Promise.resolve(true);
      }

      const startedAt = performance.now() - Math.max(0, sequence.position - range[0]) * 1000;

      return new Promise<boolean>((resolve) => {
        const tick = (now: number) => {
          if (token !== cancelledToken) {
            resolve(false);
            return;
          }

          const elapsed = now - startedAt;
          const cycleElapsed = infinite
            ? elapsed % durationMs
            : Math.min(elapsed, durationMs);
          const progress = durationMs <= 1 ? 1 : cycleElapsed / durationMs;

          sequence.position = range[0] + (range[1] - range[0]) * progress;
          current = sample(smoothstep(progress), { ...current });
          notify();

          if (!infinite && elapsed >= durationMs) {
            animationFrame = null;
            resolve(true);
            return;
          }

          animationFrame = window.requestAnimationFrame(tick);
        };

        animationFrame = window.requestAnimationFrame(tick);
      });
    },
    pause() {
      ++cancelledToken;
      if (animationFrame !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    },
  };

  return {
    get value() {
      return current;
    },
    set value(next: T) {
      current = { ...next };
      notify();
    },
    onValuesChange(callback) {
      subscribers.add(callback);
      callback(current);
      return () => subscribers.delete(callback);
    },
    sequence,
  } as LocalObject<T>;
}

const orbInitial: OrbPresentationValues = {
  coreScale: 1,
  shellScale: 1,
  ringSpread: 1,
  ringSpeed: 0.62,
  halo: 0.82,
  filamentIntensity: 0.48,
  particleEnergy: 0.62,
  breathing: 0.55,
  technicalOpacity: 0.70,
  gridOpacity: 0.70,
  radialIntensity: 0.62,
  arcIntensity: 0.68,
  microEnergy: 0.62,
  shellDrift: 0.5,
  depthActivity: 0.55,
  circuitOpacity: 0.65,
  scanSpeed: 0.70,
};

const v12Initial: V12PresentationValues = {
  cameraRadius: 9.8,
  cameraTheta: 0.55,
  cameraPhi: 1.05,
  explodedFactor: 0,
  highlightIntensity: 0.2,
  focusCylinder: 1,
};

const moleculeInitial: MoleculePresentationValues = {
  cameraDistance: 6,
  rotationY: 0,
  rotationX: 0,
  annotationOpacity: 0.7,
  presentationScale: 1,
  highlightIntensity: 0.35,
};

const orbWave = (p: number): OrbPresentationValues => ({
  coreScale: 0.98 + 0.08 * Math.sin(p * Math.PI * 2),
  shellScale: 0.98 + 0.06 * Math.sin(p * Math.PI * 2 + 0.8),
  ringSpread: 1.0 + 0.12 * Math.sin(p * Math.PI * 2 - 0.4),
  ringSpeed: 0.66 + 0.22 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4)),
  halo: 0.76 + 0.16 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2)),
  filamentIntensity: 0.46 + 0.28 * (0.5 + 0.5 * Math.sin(p * Math.PI * 6)),
  particleEnergy: 0.55 + 0.34 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4 + 0.5)),
  breathing: 0.5 + 0.44 * (0.5 + 0.5 * Math.sin(p * Math.PI * 2)),
  technicalOpacity: 0.64 + 0.18 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4)),
  gridOpacity: 0.64 + 0.16 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4 + 0.2)),
  radialIntensity: 0.60 + 0.30 * (0.5 + 0.5 * Math.sin(p * Math.PI * 6)),
  arcIntensity: 0.62 + 0.26 * (0.5 + 0.5 * Math.sin(p * Math.PI * 5)),
  microEnergy: 0.56 + 0.30 * (0.5 + 0.5 * Math.sin(p * Math.PI * 7)),
  shellDrift: 0.50 + 0.25 * Math.sin(p * Math.PI * 2),
  depthActivity: 0.52 + 0.30 * (0.5 + 0.5 * Math.sin(p * Math.PI * 3)),
  circuitOpacity: 0.62 + 0.20 * (0.5 + 0.5 * Math.sin(p * Math.PI * 5)),
  scanSpeed: 0.62 + 0.44 * (0.5 + 0.5 * Math.sin(p * Math.PI * 4)),
});

function v12Wave(p: number): V12PresentationValues {
  const camera = smoothstep(p);
  return {
    cameraRadius: 9.8 + (6.2 - 9.8) * Math.sin(camera * Math.PI),
    cameraTheta: 0.55 + (2.25 - 0.55) * camera,
    cameraPhi: 1.05 + 0.17 * Math.sin(camera * Math.PI),
    explodedFactor: camera > 0.50 ? 1 : 0,
    highlightIntensity: 0.2 + 0.7 * Math.sin(camera * Math.PI),
    focusCylinder: camera > 0.65 ? 6 : 1,
  };
}

function moleculeWave(p: number): MoleculePresentationValues {
  return {
    cameraDistance: 6 + (3.5 - 6) * Math.sin(p * Math.PI),
    rotationY: p * Math.PI * 4,
    rotationX: 0.18 * Math.sin(p * Math.PI * 2),
    annotationOpacity: 0.55 + 0.45 * Math.sin(p * Math.PI),
    presentationScale: 0.98 + 0.10 * Math.sin(p * Math.PI),
    highlightIntensity: 0.35 + 0.50 * Math.sin(p * Math.PI),
  };
}

export const advisOrbSheet = {
  sequence: { position: 0, play: (...args: Parameters<LocalSequence['play']>) => advisOrbObject.sequence.play(...args), pause: () => advisOrbObject.sequence.pause() },
};

export const advisOrbObject = createLocalObject(orbInitial, (progress) => orbWave(progress));

export const advisV12Sheet = {
  sequence: { position: 0, play: (...args: Parameters<LocalSequence['play']>) => advisV12Object.sequence.play(...args), pause: () => advisV12Object.sequence.pause() },
};

export const advisV12Object = createLocalObject(v12Initial, (progress) => v12Wave(progress));

export const advisMoleculeSheet = {
  sequence: { position: 0, play: (...args: Parameters<LocalSequence['play']>) => advisMoleculeObject.sequence.play(...args), pause: () => advisMoleculeObject.sequence.pause() },
};

export const advisMoleculeObject = createLocalObject(moleculeInitial, (progress) => moleculeWave(progress));

export const advisTheatreProject = {
  sheet(name: string) {
    if (name === 'ADVIS Orb') return advisOrbSheet;
    if (name === 'V12 Presentation') return advisV12Sheet;
    return advisMoleculeSheet;
  },
};
