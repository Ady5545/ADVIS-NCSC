const fs = require('fs');

let content = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');

// Import UniversalSemanticAssembler
content = content.replace(
  "import { UniversalDecomposition } from './UniversalDecomposition';",
  "import { UniversalDecomposition } from './UniversalDecomposition';\nimport { UniversalSemanticAssembler } from './UniversalSemanticAssembler';"
);

// Remove specific generators from generateGeometry
content = content.replace(/if \(normType\.includes\('fan'\) \|\| normType\.includes\('ceiling fan'\) \|\| normType\.includes\('fan blade'\)\) \{\s*return UniversalDecomposition\.generateCeilingFan\(parameters\);\s*\}/, '');
content = content.replace(/if \(normType\.includes\('camera'\) \|\| normType\.includes\('dslr'\) \|\| normType\.includes\('lens'\) \|\| normType\.includes\('mirrorless'\)\) \{\s*return UniversalDecomposition\.generateCamera\(parameters\);\s*\}/, '');
content = content.replace(/if \(normType\.includes\('drone'\) \|\| normType\.includes\('quadcopter'\) \|\| normType\.includes\('uav'\) \|\| normType\.includes\('multirotor'\)\) \{\s*return UniversalDecomposition\.generateDrone\(parameters\);\s*\}/, '');
content = content.replace(/if \(normType\.includes\('wheel'\) \|\| normType\.includes\('rim'\) \|\| normType\.includes\('tire'\) \|\| normType\.includes\('car wheel'\)\) \{\s*return UniversalDecomposition\.generateCarWheel\(parameters\);\s*\}/, '');
content = content.replace(/if \(normType\.includes\('gearbox'\) \|\| normType\.includes\('transmission'\) \|\| normType\.includes\('speed reducer'\)\) \{\s*return UniversalDecomposition\.generateGearbox\(parameters\);\s*\}/, '');
content = content.replace(/if \(normType\.includes\('helmet'\) \|\| normType\.includes\('hard hat'\) \|\| normType\.includes\('crash helmet'\)\) \{\s*return UniversalDecomposition\.generateHelmet\(parameters\);\s*\}/, '');

// Replace the fallback ManufacturedObjectGenerators.generatePrimitiveAssembly
content = content.replace(
  /return ManufacturedObjectGenerators\.generatePrimitiveAssembly\(objectType, parameters\);/g,
  "return UniversalSemanticAssembler.assemble(objectType, parameters);"
);

fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', content);
