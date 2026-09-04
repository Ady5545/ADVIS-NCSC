const fs = require('fs');

let content = fs.readFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', 'utf8');

// Replace all non-zero explodedOffsets with [0, 0, 0]
content = content.replace(/explodedOffset:\s*\[[^\]]+\]/g, 'explodedOffset: [0, 0, 0]');

fs.writeFileSync('src/AutonomousModelEngine/GeometryGenerator.ts', content);

let content2 = fs.readFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', 'utf8');
content2 = content2.replace(/explodedOffset:\s*\[[^\]]+\]/g, 'explodedOffset: [0, 0, 0]');
fs.writeFileSync('src/AutonomousModelEngine/UniversalDecomposition.ts', content2);
