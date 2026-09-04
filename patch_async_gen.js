const fs = require('fs');

let code = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');
code = code.replace(/public static generateGeometry\(/g, "public static async generateGeometry(");
code = code.replace(/return UniversalSemanticAssembler.assemble\(/g, "return await UniversalSemanticAssembler.assemble(");
code = code.replace(/export class GeometryGenerator/g, "import { UniversalSemanticAssembler } from './UniversalSemanticAssembler';\nexport class GeometryGenerator");
// Fix double imports
let lines = code.split('\n');
let seen = false;
let newLines = [];
for (let line of lines) {
  if (line.includes("import { UniversalSemanticAssembler } from './UniversalSemanticAssembler';")) {
    if (seen) continue;
    seen = true;
  }
  newLines.push(line);
}
fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', newLines.join('\n'));

let code2 = fs.readFileSync('src/AutonomousModelEngine/ModelBuilder.ts', 'utf8');
code2 = code2.replace(/assembly = GeometryGenerator/g, "assembly = await GeometryGenerator");
code2 = code2.replace(/const assembly: GeneratedAssemblyPayload = GeometryGenerator.generateGeometry/g, "const assembly: GeneratedAssemblyPayload = await GeometryGenerator.generateGeometry");
fs.writeFileSync('src/AutonomousModelEngine/ModelBuilder.ts', code2);
