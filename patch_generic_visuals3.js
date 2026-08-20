const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

const importStatement = `import { ContinuousCovalentVisuals, ContinuousIonicVisuals } from './ContinuousVisuals';\n`;
if (!code.includes('ContinuousCovalentVisuals')) {
   code = code.replace("import { CHEMISTRY_DATABASE } from './ChemistryDatabase';", "import { CHEMISTRY_DATABASE } from './ChemistryDatabase';\n" + importStatement);
}

const newReturn = `
  return (
    <>
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={!useLewis} />
      {useLewis ? (
        <LewisStructure formula={data.formula} currentStepPhase={phase} />
      ) : (
        <group>
          {data.bondType === 'IONIC' ? (
            <ContinuousIonicVisuals data={data} phase={phase} />
          ) : (
            <ContinuousCovalentVisuals data={data} phase={phase} />
          )}
        </group>
      )}
    </>
  );
`;

code = code.replace(/return \([\s\S]*?\<\/\>[\s\S]*?\)\;/g, newReturn.trim());

// Remove old functions CovalentVisuals, IonicVisuals, HybridizationVisuals
const covalentIdx = code.indexOf('function CovalentVisuals');
if (covalentIdx > -1) {
    code = code.substring(0, covalentIdx);
}

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
