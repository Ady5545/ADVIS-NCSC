const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ChemistryVisuals.tsx', 'utf8');

if (!code.includes('GenericChemistryVisuals')) {
   code = `import { GenericChemistryVisuals } from './GenericChemistryVisuals';\n` + code;
   
   // Replace the main ChemistryVisuals export function
   const searchStr = `export function ChemistryVisuals({ visualStateId }: ChemistryVisualsProps) {`;
   
   const replacement = `export function ChemistryVisuals({ visualStateId }: ChemistryVisualsProps) {
  // Use generic visualizer if it's not a legacy BF3 state
  if (!visualStateId.startsWith('bf3_')) {
     const entityName = visualStateId.split('_')[0];
     return <GenericChemistryVisuals entityName={entityName} stateId={visualStateId} />;
  }
`;
   
   code = code.replace(searchStr, replacement);
   fs.writeFileSync('src/LearnEngine/ChemistryVisuals.tsx', code, 'utf8');
}
console.log("Patched ChemistryVisuals.");
