const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

code = code.replace(
  'return <CovalentVisuals data={data} phase={phase} />;',
  'return (\n<group>\n<mesh>\n<boxGeometry args={[5, 5, 5]} />\n<meshBasicMaterial color="red" />\n</mesh>\n<CovalentVisuals data={data} phase={phase} />\n</group>\n);'
);

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
