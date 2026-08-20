const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', 'utf8');

const newReturn = `
  return (
    <>
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <group>
        {data.bondType === 'IONIC' ? (
          <ContinuousIonicVisuals data={data} phase={phase} />
        ) : (
          <ContinuousCovalentVisuals data={data} phase={phase} />
        )}
      </group>
      
      {/* Lewis Structure as an overlay in the corner */}
      {useLewis && (
        <Html position={[0, 0, 0]} style={{ position: 'absolute', top: '-40vh', right: '-40vw', pointerEvents: 'none' }}>
          <div style={{ transform: 'scale(0.6)', transformOrigin: 'top right' }}>
            <LewisStructure formula={data.formula} currentStepPhase={phase} />
          </div>
        </Html>
      )}
    </>
  );
`;

code = code.replace(/return \([\s\S]*?\<\/\>[\s\S]*?\)\;/g, newReturn.trim());

// We also need to fix LewisStructure so it doesn't use `center` if we manually position it, or we just keep it as is and let the wrapper handle it.
// Actually, let's just edit GenericChemistryVisuals.tsx directly using script.

fs.writeFileSync('src/LearnEngine/GenericChemistryVisuals.tsx', code, 'utf8');
