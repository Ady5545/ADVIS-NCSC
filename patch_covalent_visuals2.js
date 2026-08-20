const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

const match = `const showElectrons = isValence || isGround || isHyb || isSigma || isBondsOnly;
  
  const bondMatch = phase.match(/^bond_(\\d+)$/);
  const currentBondIndex = bondMatch ? parseInt(bondMatch[1]) : -1;
  const isSequentialBonding = currentBondIndex !== -1;
  const showOrbitals = isGround || isHyb || isSigma || isSequentialBonding;`;

code = code.replace(
  `const showOrbitals = isGround || isHyb || isSigma;`, 
  `// showOrbitals declaration moved`
);

fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
