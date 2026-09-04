const fs = require('fs');

const file = 'src/AutonomousModelEngine/ManufacturedObjectGenerators.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/\.applyEuler\(([^)]+)\)/g, ".applyQuaternion(new THREE.Quaternion().setFromEuler($1))");

fs.writeFileSync(file, code);
