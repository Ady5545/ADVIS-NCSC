import { startMoleculeCinematicPresentation, stopMoleculeCinematicPresentation } from './TheatreMoleculeBridge';
import { startV12CinematicPresentation, stopV12CinematicPresentation } from './TheatreV12Bridge';

export async function playV12Presentation(): Promise<boolean> {
  stopMoleculeCinematicPresentation();
  return startV12CinematicPresentation();
}

export async function playMoleculePresentation(): Promise<boolean> {
  stopV12CinematicPresentation();
  return startMoleculeCinematicPresentation();
}

export function stopAllTheatrePresentations(): void {
  stopV12CinematicPresentation();
  stopMoleculeCinematicPresentation();
}
