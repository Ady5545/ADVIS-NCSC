const fs = require('fs');

const filesToFix = [
  'src/AutonomousModelEngine/GeometryGenerator.ts',
  'src/AutonomousModelEngine/ManufacturedObjectGenerators.ts',
  'src/AutonomousModelEngine/UniversalDecomposition.ts',
  'src/AutonomousModelEngine/UniversalSemanticAssembler.ts'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/materialType \}\;/g, 'materialType: materialType as any };');
    content = content.replace(/materialType: materialType,/g, 'materialType: materialType as any,');
    fs.writeFileSync(file, content);
  }
}
