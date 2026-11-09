const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const startIdx = src.indexOf('<mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>', src.indexOf('Bank 2 (Right) Titanium H-Beam Rod'));
if (startIdx > -1) {
    const endIdx = src.indexOf('<mesh position={[0, ROD_LENGTH + 0.055, 0]}>', startIdx);
    const endStr = '              </mesh>';
    const realEnd = src.indexOf(endStr, endIdx) + endStr.length;
    const targetStr = src.substring(startIdx, realEnd);
    
    const replacement = `{/* Unified H-Beam Rod Extrusion */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  const smallR = 0.060;
                  const L = ROD_LENGTH;
                  shape.absarc(0, 0, bigR, 0, Math.PI, false);
                  shape.lineTo(-0.042, 0.15);
                  shape.lineTo(-0.028, L - 0.1);
                  shape.absarc(0, L, smallR, Math.PI, 0, true);
                  shape.lineTo(0.028, L - 0.1);
                  shape.lineTo(0.042, 0.15);
                  shape.lineTo(bigR, 0);
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);
                  const smallHole = new THREE.Path();
                  smallHole.absarc(0, L, 0.042, 0, Math.PI * 2, true);
                  shape.holes.push(smallHole);
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...rightState} />
              </mesh>
              {/* Rod Cap (Bottom half of big end) */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  shape.absarc(0, 0, bigR, Math.PI, 0, false);
                  shape.lineTo(bigR, -0.02);
                  shape.lineTo(-bigR, -0.02);
                  shape.lineTo(-bigR, 0);
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH * 0.5, 0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH * 0.5, -0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...rightState} />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...rightState} />
              </mesh>
              <HexBolt position={[-0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={rightState} />
              <HexBolt position={[0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={rightState} />`;

    src = src.replace(targetStr, replacement);
    fs.writeFileSync(file, src);
    console.log("Patched right rod.");
} else {
    console.log("Could not find start index for right rod.");
}
