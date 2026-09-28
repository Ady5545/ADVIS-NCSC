type KeyframeValue = {
  position: number;
  value: number;
};

function track(id: string, values: KeyframeValue[]) {
  return {
    type: 'BasicKeyframedTrack',
    __debugName: id,
    keyframes: values.map((frame, index) => ({
      id: id + '-' + index,
      position: frame.position,
      connectedRight: index < values.length - 1,
      handles: [0.5, 1, 0.5, 0],
      value: frame.value,
    })),
  };
}

const orbTracks = {
  coreScale: track('Orb Presentation:["coreScale"]', [
    { position: 0, value: 0.62 }, { position: 0.8, value: 1.02 }, { position: 2.4, value: 1.08 }, { position: 4.8, value: 0.96 }, { position: 8, value: 1 },
  ]),
  shellScale: track('Orb Presentation:["shellScale"]', [
    { position: 0, value: 0.45 }, { position: 1.0, value: 0.96 }, { position: 3.1, value: 1.08 }, { position: 5.6, value: 0.94 }, { position: 8, value: 1 },
  ]),
  ringSpread: track('Orb Presentation:["ringSpread"]', [
    { position: 0, value: 0.28 }, { position: 0.9, value: 1.05 }, { position: 2.8, value: 1.15 }, { position: 5.8, value: 0.94 }, { position: 8, value: 1 },
  ]),
  ringSpeed: track('Orb Presentation:["ringSpeed"]', [
    { position: 0, value: 0.25 }, { position: 1.2, value: 0.85 }, { position: 3.0, value: 1.25 }, { position: 5.1, value: 0.7 }, { position: 6.5, value: 1.05 }, { position: 8, value: 0.62 },
  ]),
  halo: track('Orb Presentation:["halo"]', [
    { position: 0, value: 0.12 }, { position: 0.8, value: 1.0 }, { position: 2.6, value: 0.66 }, { position: 4.9, value: 1.08 }, { position: 8, value: 0.82 },
  ]),
  filamentIntensity: track('Orb Presentation:["filamentIntensity"]', [
    { position: 0, value: 0.03 }, { position: 1.1, value: 0.72 }, { position: 2.9, value: 0.25 }, { position: 5.3, value: 0.85 }, { position: 8, value: 0.48 },
  ]),
  particleEnergy: track('Orb Presentation:["particleEnergy"]', [
    { position: 0, value: 0.04 }, { position: 0.9, value: 0.88 }, { position: 3.7, value: 0.38 }, { position: 6.0, value: 1.0 }, { position: 8, value: 0.62 },
  ]),
  breathing: track('Orb Presentation:["breathing"]', [
    { position: 0, value: 0.15 }, { position: 1.6, value: 0.9 }, { position: 3.9, value: 0.2 }, { position: 6.3, value: 1.0 }, { position: 8, value: 0.55 },
  ]),
  technicalOpacity: track('Orb Presentation:["technicalOpacity"]', [
    { position: 0, value: 0.05 }, { position: 1.1, value: 0.92 }, { position: 3.2, value: 0.42 }, { position: 5.9, value: 1.0 }, { position: 8, value: 0.7 },
  ]),
  gridOpacity: track('Orb Presentation:["gridOpacity"]', [
    { position: 0, value: 0.05 }, { position: 1.0, value: 0.9 }, { position: 3.4, value: 0.36 }, { position: 6.4, value: 1.0 }, { position: 8, value: 0.7 },
  ]),
  radialIntensity: track('Orb Presentation:["radialIntensity"]', [
    { position: 0, value: 0.03 }, { position: 1.2, value: 0.76 }, { position: 3.9, value: 0.3 }, { position: 6.6, value: 0.95 }, { position: 8, value: 0.62 },
  ]),
  arcIntensity: track('Orb Presentation:["arcIntensity"]', [
    { position: 0, value: 0.02 }, { position: 0.85, value: 0.9 }, { position: 3.0, value: 0.24 }, { position: 5.7, value: 1.0 }, { position: 8, value: 0.68 },
  ]),
  microEnergy: track('Orb Presentation:["microEnergy"]', [
    { position: 0, value: 0.04 }, { position: 0.8, value: 0.9 }, { position: 2.7, value: 0.45 }, { position: 5.9, value: 1.0 }, { position: 8, value: 0.62 },
  ]),
  depthActivity: track('Orb Presentation:["depthActivity"]', [
    { position: 0, value: 0.03 }, { position: 1.0, value: 0.78 }, { position: 3.6, value: 0.22 }, { position: 6.2, value: 0.9 }, { position: 8, value: 0.55 },
  ]),
  circuitOpacity: track('Orb Presentation:["circuitOpacity"]', [
    { position: 0, value: 0.02 }, { position: 1.2, value: 0.8 }, { position: 3.5, value: 0.3 }, { position: 6.0, value: 0.95 }, { position: 8, value: 0.65 },
  ]),
  scanSpeed: track('Orb Presentation:["scanSpeed"]', [
    { position: 0, value: 0.2 }, { position: 1.1, value: 0.8 }, { position: 3.0, value: 1.4 }, { position: 5.0, value: 0.55 }, { position: 6.8, value: 1.2 }, { position: 8, value: 0.7 },
  ]),
};

const v12Tracks = {
  cameraRadius: track('V12 Presentation:["cameraRadius"]', [
    { position: 0, value: 9.8 }, { position: 2.5, value: 8.2 }, { position: 5.0, value: 6.2 }, { position: 8, value: 9.8 },
  ]),
  cameraTheta: track('V12 Presentation:["cameraTheta"]', [
    { position: 0, value: 0.55 }, { position: 2.5, value: 1.45 }, { position: 5.0, value: 2.25 }, { position: 8, value: 0.55 },
  ]),
  cameraPhi: track('V12 Presentation:["cameraPhi"]', [
    { position: 0, value: 1.05 }, { position: 2.5, value: 0.95 }, { position: 5.0, value: 1.22 }, { position: 8, value: 1.05 },
  ]),
  explodedFactor: track('V12 Presentation:["explodedFactor"]', [
    { position: 0, value: 0 }, { position: 3.2, value: 0 }, { position: 4.6, value: 1 }, { position: 6.2, value: 1 }, { position: 8, value: 0 },
  ]),
  highlightIntensity: track('V12 Presentation:["highlightIntensity"]', [
    { position: 0, value: 0.2 }, { position: 3.5, value: 1 }, { position: 5.4, value: 0.35 }, { position: 8, value: 0.7 },
  ]),
  focusCylinder: track('V12 Presentation:["focusCylinder"]', [
    { position: 0, value: 1 }, { position: 3.2, value: 1 }, { position: 5.2, value: 6 }, { position: 8, value: 1 },
  ]),
};

const moleculeTracks = {
  cameraDistance: track('Molecule Presentation:["cameraDistance"]', [
    { position: 0, value: 6 }, { position: 2, value: 4.2 }, { position: 5, value: 3.5 }, { position: 8, value: 6 },
  ]),
  rotationY: track('Molecule Presentation:["rotationY"]', [
    { position: 0, value: 0 }, { position: 2, value: 1.3 }, { position: 5, value: 2.7 }, { position: 8, value: 4.0 },
  ]),
  rotationX: track('Molecule Presentation:["rotationX"]', [
    { position: 0, value: 0 }, { position: 2.2, value: 0.15 }, { position: 5.2, value: -0.1 }, { position: 8, value: 0 },
  ]),
  annotationOpacity: track('Molecule Presentation:["annotationOpacity"]', [
    { position: 0, value: 0 }, { position: 1.8, value: 1 }, { position: 6, value: 1 }, { position: 8, value: 0.55 },
  ]),
  presentationScale: track('Molecule Presentation:["presentationScale"]', [
    { position: 0, value: 0.72 }, { position: 1.2, value: 1 }, { position: 4.5, value: 1.08 }, { position: 8, value: 1 },
  ]),
  highlightIntensity: track('Molecule Presentation:["highlightIntensity"]', [
    { position: 0, value: 0.2 }, { position: 2.4, value: 1 }, { position: 5.5, value: 0.65 }, { position: 8, value: 0.35 },
  ]),
};

function withTracks(name: string, object: string, tracks: Record<string, ReturnType<typeof track>>) {
  const trackData: Record<string, ReturnType<typeof track>> = {};
  const trackIdByPropPath: Record<string, string> = {};

  for (const [prop, definition] of Object.entries(tracks)) {
    const id = `advis-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${prop}`;
    trackData[id] = definition;
    trackIdByPropPath[JSON.stringify([prop])] = id;
  }

  return {
    staticOverrides: { byObject: {} },
    sequence: {
      subUnitsPerUnit: 30,
      length: 8,
      type: 'PositionalSequence',
      tracksByObject: {
        [object]: {
          trackData,
          trackIdByPropPath,
        },
      },
    },
  };
}

export const advisTheatreState = {
  sheetsById: {
    'ADVIS Orb': withTracks('ADVIS Orb', 'Orb Presentation', orbTracks),
    'V12 Presentation': withTracks('V12 Presentation', 'V12 Presentation', v12Tracks),
    'Molecule Presentation': withTracks('Molecule Presentation', 'Molecule Presentation', moleculeTracks),
  },
  definitionVersion: '0.4.0',
  revisionHistory: ['advis-theatre-deep-detail-orb-2026-09-28'],
} as const;
