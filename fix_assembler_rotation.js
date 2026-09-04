const fs = require('fs');

let code = fs.readFileSync('src/AutonomousModelEngine/UniversalSemanticAssembler.ts', 'utf8');

code = code.replace(
  /geom\.applyQuaternion\(new THREE\.Quaternion\(\)\.setFromEuler\(new THREE\.Euler\(rx, ry, rz\)\)\);/g,
  "geom.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx * Math.PI / 180, ry * Math.PI / 180, rz * Math.PI / 180)));"
);

fs.writeFileSync('src/AutonomousModelEngine/UniversalSemanticAssembler.ts', code);

let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace(
  /Define position and rotation relative to the object's origin./g,
  "Define position and rotation relative to the object's origin. Rotation must be in DEGREES."
);
fs.writeFileSync('server.js', serverCode);

