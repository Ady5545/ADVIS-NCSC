const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const targetStr = `{/* Front Aerodynamic Wedge Counterweight Web (opposite crankpin) */}
            <group position={[-cpX * 0.48, -cpY * 0.48, -0.09]} rotation={[0, 0, theta + Math.PI]}>
              <mesh>
                <boxGeometry args={[0.42, 0.28, 0.065]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {/* Knife-Edged Leading Bevel Chamfer */}
              <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.065, 16]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {/* Dynamic Balance Heavy-Metal Mallory Alloy Drilling Pockets */}
              {[-0.12, 0, 0.12].map((xOff, xi) => (
                <mesh key={'bal_f_' + xi} position={[xOff, -0.08, 0.033]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.015, 16]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
                </mesh>
              ))}
            </group>
            {/* Rear Aerodynamic Wedge Counterweight Web (opposite crankpin) */}
            <group position={[-cpX * 0.48, -cpY * 0.48, 0.09]} rotation={[0, 0, theta + Math.PI]}>
              <mesh>
                <boxGeometry args={[0.42, 0.28, 0.065]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.065, 16]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {[-0.12, 0, 0.12].map((xOff, xi) => (
                <mesh key={'bal_r_' + xi} position={[xOff, -0.08, -0.033]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.015, 16]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
                </mesh>
              ))}
            </group>`;

const replacement = `            {/* Front & Rear Sculpted Counterweight Webs */}
            {[-0.13, 0.065].map((zOffset, zIdx) => (
              <group key={'web_'+zIdx} position={[0, 0, zOffset]} rotation={[0, 0, theta]}>
                <mesh>
                  <extrudeGeometry args={[(() => {
                    const shape = new THREE.Shape();
                    // Web shape covering crank pin to counterweight
                    // Crank pin is at (0, CRANK_RADIUS). Center is (0,0).
                    // Counterweight goes in opposite direction (-Y).
                    shape.moveTo(0.12, CRANK_RADIUS);
                    shape.lineTo(0.12, 0);
                    // flare out for counterweight
                    shape.lineTo(0.28, -0.15);
                    // bottom arc
                    shape.absarc(0, -0.18, 0.32, -0.2, Math.PI + 0.2, true);
                    // back in
                    shape.lineTo(-0.12, 0);
                    shape.lineTo(-0.12, CRANK_RADIUS);
                    // top arc around crankpin
                    shape.absarc(0, CRANK_RADIUS, 0.12, Math.PI, 0, true);
                    return shape;
                  })(), { depth: 0.065, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 }]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
                {/* Balance Drillings */}
                {[-0.18, 0, 0.18].map((xOff, xi) => (
                  <mesh key={'bal_'+xi} position={[xOff, -0.35, zIdx === 0 ? 0.065 : -0.01]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
                    <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
                  </mesh>
                ))}
              </group>
            ))}`;

src = src.replace(targetStr, replacement);
fs.writeFileSync(file, src);
console.log("Patched crank throw webs.");
