const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

src = src.replace('<mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -1.56]}>', '<mesh rotation={[0, 0, 0]} position={[0, 0, -1.56]}>');

fs.writeFileSync(file, src);
console.log("Patched cylinder head rotation.");
