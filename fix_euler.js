const fs = require('fs');

const file = 'src/AutonomousModelEngine/ManufacturedObjectGenerators.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace .applyEuler(new THREE.Euler(x, y, z)) with .rotateX(x).rotateY(y).rotateZ(z)
// But I need to be careful with regex.
// Since there might be a few of them, I can just replace `applyEuler` manually.

code = code.replace(/(\w+)\.applyEuler\(new THREE\.Euler\(([^,]+),\s*([^,]+),\s*([^\)]+)\)\)/g, "$1.rotateX($2).rotateY($3).rotateZ($4)");

fs.writeFileSync(file, code);
