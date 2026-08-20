const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

const importStatement = `import { ContinuousCovalentVisuals, ContinuousIonicVisuals } from './ContinuousVisuals';\n`;

// Add import if missing
if (!code.includes('ContinuousCovalentVisuals')) {
   code = code.replace("import { CHEMISTRY_DATABASE } from './ChemistryDatabase';", "import { CHEMISTRY_DATABASE } from './ChemistryDatabase';\n" + importStatement);
}

// Replace the return block in GenericChemistryVisuals
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

// Strip old CovalentVisuals, IonicVisuals, HybridizationVisuals from GenericChemistryVisuals
code = code.replace(/function IonicVisuals[\s\S]*?(?=export|function InvalidAnalysisVisuals)/, '');
// Note: need to handle InvalidAnalysisVisuals correctly
// Let's just do a string replacement on the old code manually to avoid regex hell

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
