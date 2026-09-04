const fs = require('fs');
let code = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');
const lines = code.split('\n');
let uniqueLines = [];
let seenSemantic = false;
for (let line of lines) {
  if (line.includes('UniversalSemanticAssembler')) {
    if (seenSemantic) continue;
    seenSemantic = true;
  }
  uniqueLines.push(line);
}
fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', uniqueLines.join('\n'));
