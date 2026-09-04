const fs = require('fs');
let code = fs.readFileSync('src/AutonomousModelEngine/UniversalSemanticAssembler.ts', 'utf8');

// Parse strings like "0,1.2,0" back to array
code = code.replace(
  /const position: \[number, number, number\] = comp\.position \? \[comp\.position\[0\]\*scale, comp\.position\[1\]\*scale, comp\.position\[2\]\*scale\] : \[0, 0, 0\];/g,
  `const posArr = (typeof comp.position === 'string' ? comp.position.split(',').map(Number) : comp.position) || [0,0,0];
        const position: [number, number, number] = [posArr[0]*scale, posArr[1]*scale, posArr[2]*scale];`
);

code = code.replace(
  /const size: \[number, number, number\] = comp\.size \? \[comp\.size\[0\]\*scale, comp\.size\[1\]\*scale, comp\.size\[2\]\*scale\] : \[0\.1\*scale, 0\.1\*scale, 0\.1\*scale\];/g,
  `const sizeArr = (typeof comp.size === 'string' ? comp.size.split(',').map(Number) : comp.size) || [0.1,0.1,0.1];
        const size: [number, number, number] = [sizeArr[0]*scale, sizeArr[1]*scale, sizeArr[2]*scale];`
);

code = code.replace(
  /const rot = comp\.rotation \|\| \[0, 0, 0\];/g,
  `const rot = (typeof comp.rotation === 'string' ? comp.rotation.split(',').map(Number) : comp.rotation) || [0,0,0];`
);

fs.writeFileSync('src/AutonomousModelEngine/UniversalSemanticAssembler.ts', code);
