const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

code = code.replace("import { Float, Text, Torus } from '@react-three/drei';", "import { Float, Text, Torus, Html } from '@react-three/drei';");

const diagnostic = `
  const diagnosticOverlay = (
    <Html position={[0, -4, 0]} center>
      <div className="bg-black/80 text-cyan-400 p-2 text-xs font-mono border border-cyan-500 rounded whitespace-nowrap">
        DIAGNOSTICS:<br/>
        Renderer: GenericChemistryVisuals<br/>
        Entity: {entityName}<br/>
        Phase: {phase}
      </div>
    </Html>
  );
`;

code = code.replace(
  'const phase = s.slice(1).join(\'_\'); // e.g. h2o_atoms -> atoms',
  'const phase = s.slice(1).join(\'_\'); // e.g. h2o_atoms -> atoms\n' + diagnostic
);

code = code.replace(
  'return <IonicVisuals data={data} phase={phase} />;',
  'return <group>{diagnosticOverlay}<IonicVisuals data={data} phase={phase} /></group>;'
);

code = code.replace(
  'return <CovalentVisuals data={data} phase={phase} />;',
  'return <group>{diagnosticOverlay}<CovalentVisuals data={data} phase={phase} /></group>;'
);

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
