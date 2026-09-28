import { advisMoleculeObject, advisMoleculeSheet, type MoleculePresentationValues } from './TheatreRuntime';
import { applyTheatreCamera } from './TheatreCameraBridge';
import { emitTheatreEvent } from './TheatreEventBus';

let active = false;
let subscriptionReady = false;

const ensureSubscription = () => {
  if (subscriptionReady) return;
  subscriptionReady = true;
  advisMoleculeObject.onValuesChange((values) => {
    if (!active) return;
    const typed = values as MoleculePresentationValues;
    applyTheatreCamera({
      cameraRadius: typed.cameraDistance,
      cameraTheta: typed.rotationY,
      cameraPhi: Math.PI / 2 + typed.rotationX * 0.35,
    });
    emitTheatreEvent('advis-theatre-molecule', { ...typed, active: true });
  });
};

export async function startMoleculeCinematicPresentation(): Promise<boolean> {
  ensureSubscription();
  active = true;
  advisMoleculeSheet.sequence.position = 0;
  const completed = await advisMoleculeSheet.sequence.play({ range: [0, 8], iterationCount: 1 });
  active = false;
  emitTheatreEvent('advis-theatre-molecule', { active: false, ...advisMoleculeObject.value });
  return completed;
}

export function stopMoleculeCinematicPresentation(): void {
  active = false;
  advisMoleculeSheet.sequence.pause();
  emitTheatreEvent('advis-theatre-molecule', { active: false, ...advisMoleculeObject.value });
}
