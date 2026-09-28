import { getProject, types } from '@theatre/core';
import { advisTheatreState } from './theatreState';

export const advisTheatreProject = getProject('ADVIS-NCSC', {
  state: advisTheatreState as any,
});

export const advisOrbSheet = advisTheatreProject.sheet('ADVIS Orb');
export const advisOrbObject = advisOrbSheet.object('Orb Presentation', {
  coreScale: types.number(1, { range: [0, 1.5] }),
  shellScale: types.number(1, { range: [0, 1.5] }),
  ringSpread: types.number(1, { range: [0, 1.5] }),
  ringSpeed: types.number(0.6, { range: [0, 2] }),
  halo: types.number(0.8, { range: [0, 1.5] }),
  filamentIntensity: types.number(0.45, { range: [0, 1.5] }),
  particleEnergy: types.number(0.55, { range: [0, 1.5] }),
  breathing: types.number(0.5, { range: [0, 1] }),
  technicalOpacity: types.number(0.65, { range: [0, 1] }),
  gridOpacity: types.number(0.65, { range: [0, 1.2] }),
  radialIntensity: types.number(0.65, { range: [0, 1.5] }),
  arcIntensity: types.number(0.65, { range: [0, 1.5] }),
  microEnergy: types.number(0.5, { range: [0, 1.5] }),
  shellDrift: types.number(0.5, { range: [0, 1] }),
  depthActivity: types.number(0.5, { range: [0, 1] }),
});

export const advisV12Sheet = advisTheatreProject.sheet('V12 Presentation');
export const advisV12Object = advisV12Sheet.object('V12 Presentation', {
  cameraRadius: types.number(9.8, { range: [3, 16] }),
  cameraTheta: types.number(0.55, { range: [-Math.PI * 2, Math.PI * 2] }),
  cameraPhi: types.number(1.05, { range: [0.2, Math.PI - 0.2] }),
  explodedFactor: types.number(0, { range: [0, 1] }),
  highlightIntensity: types.number(0.2, { range: [0, 1] }),
  focusCylinder: types.number(1, { range: [1, 12] }),
});

export const advisMoleculeSheet = advisTheatreProject.sheet('Molecule Presentation');
export const advisMoleculeObject = advisMoleculeSheet.object('Molecule Presentation', {
  cameraDistance: types.number(6, { range: [2, 12] }),
  rotationY: types.number(0, { range: [-Math.PI * 2, Math.PI * 2] }),
  rotationX: types.number(0, { range: [-Math.PI, Math.PI] }),
  annotationOpacity: types.number(0.7, { range: [0, 1] }),
  presentationScale: types.number(1, { range: [0.5, 1.5] }),
  highlightIntensity: types.number(0.35, { range: [0, 1] }),
});

export type OrbPresentationValues = typeof advisOrbObject.value;
export type V12PresentationValues = typeof advisV12Object.value;
export type MoleculePresentationValues = typeof advisMoleculeObject.value;
