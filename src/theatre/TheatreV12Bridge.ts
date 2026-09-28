import { advisV12Object, advisV12Sheet, type V12PresentationValues } from './TheatreRuntime';
import { applyTheatreCamera } from './TheatreCameraBridge';
import { emitTheatreEvent } from './TheatreEventBus';

let active = false;
let subscriptionReady = false;

const ensureSubscription = () => {
  if (subscriptionReady) return;
  subscriptionReady = true;
  advisV12Object.onValuesChange((values) => {
    if (!active) return;
    const typed = values as V12PresentationValues;
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
  advisV12Sheet.sequence.position = 0;
  const completed = await advisV12Sheet.sequence.play({ range: [0, 8], iterationCount: 1 });
  active = false;
  emitTheatreEvent('advis-theatre-v12', { active: false, ...advisV12Object.value });
  return completed;
}

export function stopV12CinematicPresentation(): void {
  active = false;
  advisV12Sheet.sequence.pause();
  emitTheatreEvent('advis-theatre-v12', { active: false, ...advisV12Object.value });
}
