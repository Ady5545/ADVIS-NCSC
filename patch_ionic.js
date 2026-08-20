const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

const newIonic = `
export function ContinuousIonicVisuals({ data, phase }: { data: any, phase: string }) {
  const isTransfer = phase === 'transfer';
  const isIons = phase === 'ions' || phase === 'attraction' || phase === 'summary';
  const isAttraction = phase === 'attraction' || phase === 'summary';

  const naTargetX = isAttraction ? -1.5 : -2.5;
  const clTargetX = isAttraction ? 1.5 : 2.5;
  
  // Electron transfer logic
  // We want the electron to start at Na, then when transfer begins, move towards Cl
  let electronTarget = [naTargetX + 1.2, 0, 0];
  
  if (isTransfer) {
    electronTarget = [0, 1.0, 0]; // midpoint arc
  } else if (isIons || isAttraction) {
    electronTarget = [clTargetX - 1.2, 0, 0];
  }

  return (
    <Float rotationIntensity={isAttraction ? 0.5 : 0.1}>
      <HolographicGrid />
      <AnimGroup position={[naTargetX, 0, 0]}>
        <Atom position={[0, 0, 0]} element="Na" label={isIons ? "Na⁺" : "Na"} showReticle={true} reticleLabel="SODIUM (Na)" />
      </AnimGroup>
      
      <AnimGroup position={[clTargetX, 0, 0]}>
        <Atom position={[0, 0, 0]} element="Cl" label={isIons ? "Cl⁻" : "Cl"} showReticle={true} reticleLabel="CHLORINE (Cl)" />
        {/* Chlorine's original 7 valence electrons */}
        <AnimGroup visible={phase !== 'atoms'}>
           <Electron position={[-1.2, 0.4, 0]} />
           <Electron position={[1.2, 0, 0]} />
           <Electron position={[0, 1.2, 0]} />
           <Electron position={[0, -1.2, 0]} />
           <Electron position={[0.8, 0.8, 0]} />
           <Electron position={[-0.8, -0.8, 0]} />
           <Electron position={[0.8, -0.8, 0]} />
        </AnimGroup>
      </AnimGroup>

      {/* The transferring Valence Electron */}
      <AnimGroup position={electronTarget as [number, number, number]} visible={phase !== 'atoms'}>
        <Electron position={[0, 0, 0]} label="e⁻" color="#fbbf24" />
      </AnimGroup>

      {/* Electrostatic Attraction field */}
      <AnimGroup visible={isAttraction}>
        <Bond start={[-1.5, 0, 0]} end={[1.5, 0, 0]} type="ionic" />
      </AnimGroup>
    </Float>
  );
}
`;

code = code.replace(/export function ContinuousIonicVisuals[\s\S]*?(?=export function ContinuousCovalentVisuals)/, newIonic + '\n');
fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
