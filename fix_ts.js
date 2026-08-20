const fs = require('fs');

// Fix ChemistryPrimitives.tsx
let prims = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

// Fix 1: <line> to <primitive>
prims = prims.replace(
  /<line geometry=\{geometry\}>\s*<lineBasicMaterial color="#22d3ee" transparent opacity=\{0\.6\} \/>\s*<\/line>/g,
  '<primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.6 }))} />'
);

// Fix 2: radius -> size in Atom
prims = prims.replace(
  /const { color, radius } = getAtomProps\(element\);/g,
  'const { color, size: radius } = getAtomProps(element);'
);

// Fix 3: SelectionReticle radius -> size
prims = prims.replace(
  /<SelectionReticle radius=\{radius \+ 0\.8\} label=\{reticleLabel \|\| label\} \/>/g,
  '<SelectionReticle size={radius + 0.8} label={reticleLabel || label} />'
);

fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', prims, 'utf8');

// Fix ContinuousVisuals.tsx
let cont = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

// Fix targetScale type
cont = cont.replace(
  /const targetScale = visible \? scale : \[0, 0, 0\];/g,
  'const targetScale = visible ? scale : [0, 0, 0] as [number, number, number];'
);

fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', cont, 'utf8');

