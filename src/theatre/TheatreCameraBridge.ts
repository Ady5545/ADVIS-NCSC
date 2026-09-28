import { emitTheatreEvent } from './TheatreEventBus';

export interface TheatreCameraValues {
  cameraRadius: number;
  cameraTheta: number;
  cameraPhi: number;
  target?: [number, number, number];
}

export function applyTheatreCamera(values: TheatreCameraValues): void {
  if (!Number.isFinite(values.cameraRadius) || !Number.isFinite(values.cameraTheta) || !Number.isFinite(values.cameraPhi)) {
    return;
  }

  const target = values.target ?? [0, 0, 0];
  const detail = {
    id: 'THEATRE_PRESENTATION',
    name: 'Theatre Presentation',
    description: 'Authored ADVIS cinematic camera choreography',
    radius: values.cameraRadius,
    theta: values.cameraTheta,
    phi: values.cameraPhi,
    target,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('advis-camera-preset', { detail }));
  }
  emitTheatreEvent('advis-theatre-presentation', detail);
}
