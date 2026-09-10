const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const startIdx = src.indexOf('{/* Split Big-End Journal Cap Housing */}');
const endIdx = src.indexOf('{/* Forced Pin Oiling Squirt Hole at Top of Eyelet */}', startIdx);
if (startIdx > -1 && endIdx > -1) {
    const endStr = '              </mesh>';
    const realEnd = src.indexOf(endStr, endIdx) + endStr.length;
    const targetStr = src.substring(startIdx, realEnd);
    // console.log("Found:", targetStr);
    
    // We will replace targetStr
    // There should be two occurrences: one with leftState and one with rightState
    
    let occurrences = 0;
    while(true) {
        const idx = src.indexOf('{/* Split Big-End Journal Cap Housing */}');
        if (idx === -1) break;
        const eIdx = src.indexOf('{/* Forced Pin Oiling Squirt Hole at Top of Eyelet */}', idx);
        const rEnd = src.indexOf('              </mesh>', eIdx) + '              </mesh>'.length;
        const block = src.substring(idx, rEnd);
        
        let stateName = 'leftState';
        if (block.includes('rightState')) stateName = 'rightState';
        else if (!block.includes('leftState')) {
             console.log("Could not determine state name!");
             break;
        }

        const replacement = `{/* Unified H-Beam Rod Extrusion */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  const smallR = 0.060;
                  const L = ROD_LENGTH;
                  
                  // Big end outer (top half)
                  shape.absarc(0, 0, bigR, 0, Math.PI, false);
                  // Transition to shank left
                  shape.lineTo(-0.042, 0.15);
                  shape.lineTo(-0.028, L - 0.1);
                  // Small end outer
                  shape.absarc(0, L, smallR, Math.PI, 0, true);
                  // Transition to shank right
                  shape.lineTo(0.028, L - 0.1);
                  shape.lineTo(0.042, 0.15);
                  shape.lineTo(bigR, 0);

                  // Big end inner hole
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);

                  // Small end inner hole
                  const smallHole = new THREE.Path();
                  smallHole.absarc(0, L, 0.042, 0, Math.PI * 2, true);
                  shape.holes.push(smallHole);
                  
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...${stateName}} />
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
                <EngineMaterial materialType="TITANIUM" {...${stateName}} />
              </mesh>
              {/* H-Beam Recess (Front) */}
              <mesh position={[0, ROD_LENGTH * 0.5, 0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...${stateName}} />
              </mesh>
              {/* H-Beam Recess (Back) */}
              <mesh position={[0, ROD_LENGTH * 0.5, -0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...${stateName}} />
              </mesh>
              {/* Tri-Metal Rod Bearing Shell Visible Inside Bore */}
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...${stateName}} />
              </mesh>
              <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...${stateName}} />
              </mesh>
              {/* Two High-Strength ARP 2000 Hex Rod Cap Bolts */}
              <HexBolt position={[-0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={${stateName}} />
              <HexBolt position={[0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={${stateName}} />`;

        src = src.replace(block, replacement);
        occurrences++;
    }
    
    fs.writeFileSync(file, src);
    console.log("Patched rods " + occurrences + " times.");
}
