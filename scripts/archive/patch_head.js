const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const targetStr = `{/* Main Sculpted Head Block Body */}
        <mesh>
          <boxGeometry args={[0.55, 0.35, 3.12]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>`;

const replacementStr = `{/* Main Sculpted Head Block Body */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, -1.56]}>
          <extrudeGeometry args={[(() => {
            const shape = new THREE.Shape();
            shape.moveTo(-0.25, -0.17); // bottom inner (valley side)
            shape.lineTo(-0.20, -0.17);
            shape.lineTo(0.20, -0.17);
            shape.lineTo(0.25, -0.17);  // bottom outer (exhaust side)
            shape.lineTo(0.28, 0.0);    // up to exhaust port bulge
            shape.lineTo(0.22, 0.15);   // tapering up
            shape.lineTo(0.12, 0.28);   // outer cam housing
            shape.lineTo(0.0, 0.25);    // spark plug valley
            shape.lineTo(-0.12, 0.28);  // inner cam housing
            shape.lineTo(-0.28, 0.1);   // intake port flange
            shape.lineTo(-0.25, -0.17); // close
            return shape;
          })(), { depth: 3.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 }]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>`;

src = src.replace(targetStr, replacementStr);
fs.writeFileSync(file, src);
console.log("Patched cylinder head.");
