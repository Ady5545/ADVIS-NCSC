import { advisV12Object, advisV12Sheet, type V12PresentationValues } from './TheatreRuntime';
import { applyTheatreCamera } from './TheatreCameraBridge';
import { emitTheatreEvent } from './TheatreEventBus';

export const v12PresentationFrame = {
  active: false,
  values: {
    cameraRadius: 9.8,
    cameraTheta: 0.55,
    cameraPhi: 1.05,
    explodedFactor: 0,
    highlightIntensity: 0.2,
    focusCylinder: 1,
  } as V12PresentationValues,
};

let active = false;
let subscriptionReady = false;

const ensureSubscription = () => {
  if (subscriptionReady) return;
  subscriptionReady = true;
  advisV12Object.onValuesChange((values) => {
    if (!active) return;
    const typed = values as V12PresentationValues;
    v12PresentationFrame.active = active;
    v12PresentationFrame.values = typed;
    applyTheatreCamera({
      cameraRadius: typed.cameraRadius,
      cameraTheta: typed.cameraTheta,
      cameraPhi: typed.cameraPhi,
    });
    emitTheatreEvent('advis-theatre-v12', { ...typed, active: true });
  });
};

export async function startV12CinematicPresentation(): Promise<boolean> {
  ensureSubscription();
  active = true;
  v12PresentationFrame.active = true;
  advisV12Sheet.sequence.position = 0;
  const completed = await advisV12Sheet.sequence.play({ range: [0, 8], iterationCount: 1 });
  active = false;
  v12PresentationFrame.active = false;
  v12PresentationFrame.values = advisV12Object.value as V12PresentationValues;
  emitTheatreEvent('advis-theatre-v12', { active: false, ...advisV12Object.value });
  return completed;
}

export function stopV12CinematicPresentation(): void {
  active = false;
  v12PresentationFrame.active = false;
  v12PresentationFrame.values = advisV12Object.value as V12PresentationValues;
  advisV12Sheet.sequence.pause();
  emitTheatreEvent('advis-theatre-v12', { active: false, ...advisV12Object.value });
}
