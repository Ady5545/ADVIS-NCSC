const fs = require('fs');
const files = [
  'src/generators/MechanicalGenerator.tsx',
  'src/AutonomousModelEngine/HighFidelityGenerators.ts'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/explodedOffset:\s*\[[^\]]+\]/g, 'explodedOffset: [0, 0, 0]');
    fs.writeFileSync(file, content);
  }
}
