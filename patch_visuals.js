const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

// Ensure we import the new primitives
if (!code.includes('HolographicGrid')) {
  code = code.replace(
    "import { Atom, POrbital, SOrbital, HybridOrbital, Electron, Bond, LonePair, LewisStructure, getAtomProps } from './ChemistryPrimitives';",
    "import { Atom, POrbital, SOrbital, HybridOrbital, Electron, Bond, LonePair, LewisStructure, getAtomProps, HolographicGrid, MeasurementArc, SelectionReticle } from './ChemistryPrimitives';"
  );
}

// Add HolographicGrid to CovalentVisuals and IonicVisuals
code = code.replace(
  /<Atom position=\{\[0\, 0\, 0\]\} element=\{centralElement\} label=\{centralElement\} \/>/g,
  "<HolographicGrid />\n            <Atom position={[0, 0, 0]} element={centralElement} label={centralElement} showReticle={phase === 'geometry' || phase === 'summary'} reticleLabel={`${centralElement} CENTRAL`} />"
);

// We should also replace the Atom calls in IonicVisuals
code = code.replace(
  /<Atom position=\{\[startX, 0, 0\]\} element="Na" label="Na" \/>/g,
  "<HolographicGrid />\n                <Atom position={[startX, 0, 0]} element=\"Na\" label=\"Na\" showReticle={true} reticleLabel=\"SODIUM (Na)\" />"
);
code = code.replace(
  /<Atom position=\{\[endX, 0, 0\]\} element="Cl" label="Cl" \/>/g,
  "<Atom position={[endX, 0, 0]} element=\"Cl\" label=\"Cl\" showReticle={true} reticleLabel=\"CHLORINE (Cl)\" />"
);

// Add MeasurementArc for specific molecules during geometry/summary phase
code = code.replace(
  /\{\/\* VSEPR Lone Pairs \*\/\}/g,
  `
            {/* Measurement Arcs */}
            {(phase === 'geometry' || phase === 'summary') && isWater && (
                <MeasurementArc radius={1.2} angle={104.5 * Math.PI/180} label="104.5°" startRotation={-(104.5/2) * Math.PI/180 - Math.PI/2} />
            )}
            {(phase === 'geometry' || phase === 'summary') && isBF3 && (
                <MeasurementArc radius={1.5} angle={120 * Math.PI/180} label="120°" startRotation={-Math.PI/6} />
            )}
            {/* VSEPR Lone Pairs */}`
);

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
