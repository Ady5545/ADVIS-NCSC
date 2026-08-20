const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/LearnWorkspace.tsx', 'utf8');

// Replace {data.formula} with formatFormula(data.formula)
const helper = `
function formatFormula(formula: string) {
  return formula.replace(/\\d+/g, match => {
    const subscripts: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '⇷', '8': '₈', '9': '₉' };
    return match.split('').map(char => subscripts[char] || char).join('');
  });
}
`;

code = code.replace(/function MolecularAnalysisPanel/, helper + '\nfunction MolecularAnalysisPanel');
code = code.replace(/\{data\.formula\}/g, '{formatFormula(data.formula)}');

fs.writeFileSync('src/LearnEngine/LearnWorkspace.tsx', code, 'utf8');
