const fs = require('fs');
const file = 'src/SpatialObjectEngine.tsx';
let src = fs.readFileSync(file, 'utf8');

// The V12 assembly currently directly invokes the components from MechanicalGenerator:
// Let's find where <EngineBlockAssembly /> is called.

console.log("Analyzing SpatialObjectEngine...");
if (src.includes('<EngineBlockAssembly')) {
  console.log("Found EngineBlockAssembly in SpatialObjectEngine.");
}
