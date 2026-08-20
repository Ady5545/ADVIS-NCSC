const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryPrimitives.tsx', 'utf8');

// Change LewisStructure so it accepts an `overlayMode` boolean to disable `<Html center>` and instead use simple div, or change the `center` prop to conditional.
code = code.replace(
  `export function LewisStructure({ formula, steps, currentStepPhase }: { formula: string, steps?: any[], currentStepPhase?: string }) {`,
  `export function LewisStructure({ formula, steps, currentStepPhase, isOverlay }: { formula: string, steps?: any[], currentStepPhase?: string, isOverlay?: boolean }) {`
);

code = code.replace(
  `return (\n    <Html center zIndexRange={[100, 0]}>`,
  `return (\n    <Html center={!isOverlay} zIndexRange={[100, 0]}>`
);

fs.writeFileSync('src/LearnEngine/ChemistryPrimitives.tsx', code, 'utf8');
