const fs = require('fs');
let content = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf8');

content = content.replace(/const \{ HighFidelityGenerators \} = require\('\.\/HighFidelityGenerators'\);/g, '');
content = "import { HighFidelityGenerators } from './HighFidelityGenerators';\n" + content;

fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', content);
