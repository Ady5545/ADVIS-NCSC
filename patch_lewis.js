const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

const replacement = `
export function LewisStructure({ formula, steps, currentStepPhase }: { formula: string, steps?: any[], currentStepPhase?: string }) {
  return (
    <group>
      <HolographicGrid />
      <Html center zIndexRange={[100, 0]} transform distanceFactor={10} position={[0, 0, 0]}>
        <div className="bg-transparent border border-cyan-500/20 p-8 rounded-lg shadow-[inset_0_0_50px_rgba(34,211,238,0.05)] backdrop-blur-sm flex flex-col items-center justify-center font-mono text-cyan-50 relative overflow-hidden">
          {/* Scanning line effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/50 shadow-[0_0_10px_#22d3ee] animate-[scan_3s_linear_infinite]" style={{boxShadow: '0 0 10px #22d3ee'}}></div>
          
          <div className="text-[10px] tracking-[0.4em] text-cyan-400 mb-8 font-bold border-b border-cyan-500/30 pb-2 w-full text-center uppercase flex justify-between items-center">
            <span>LEWIS PROJECTION</span>
            <span>{formula}</span>
          </div>
          
          <div className="text-5xl font-bold tracking-[0.2em] relative flex items-center justify-center min-w-[300px] min-h-[150px]">
            {/* Custom rendering based on formula */}
            {formula === 'CO2' && <CO2Lewis phase={currentStepPhase} />}
            {formula === 'H2O' && <H2OLewis phase={currentStepPhase} />}
            {formula === 'NH3' && <NH3Lewis phase={currentStepPhase} />}
            {formula === 'CH4' && <CH4Lewis phase={currentStepPhase} />}
            {formula === 'BF3' && <BF3Lewis phase={currentStepPhase} />}
            {formula === 'NaCl' && <NaClLewis phase={currentStepPhase} />}
          </div>
          
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>
        </div>
      </Html>
    </group>
  );
}

function Dot({ show }: { show: boolean }) {
  return <div className={\`w-2 h-2 rounded-full bg-cyan-300 transition-all duration-500 \${show ? 'opacity-100 shadow-[0_0_8px_#22d3ee]' : 'opacity-0 scale-50'}\`} />;
}

function BondLine({ show }: { show: boolean }) {
  return <div className={\`w-8 h-[2px] bg-cyan-400 mx-2 transition-all duration-500 \${show ? 'opacity-100 shadow-[0_0_8px_#22d3ee] w-8' : 'opacity-0 w-0'}\`} />;
}
`;

// Replace LewisStructure, Dot, BondLine
code = code.replace(
  /export function LewisStructure\(\{ formula, steps, currentStepPhase \}\: \{ formula\: string, steps\?\: any\[\], currentStepPhase\?\: string \}\) \{[\s\S]*?function BondLine\(\{ show \}\: \{ show\: boolean \}\) \{[\s\S]*?\}\n/g,
  replacement
);

fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', code, 'utf8');
