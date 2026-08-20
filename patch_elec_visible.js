const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

code = code.replace(
  /const isElectronsVisible = showElectrons \|\| currentBondIndex >= -1; \/\/ always visible in these phases if sequential/g,
  'const isElectronsVisible = showElectrons || currentBondIndex !== -1;'
);

fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
