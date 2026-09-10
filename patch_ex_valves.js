const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const targetExhaust = `                {/* 2 Exhaust Valves (Angled toward -X at 18°) */}
                <group>
                  <mesh position={[-0.12, 0, -0.06]} rotation={[0, 0, 0.18]}>
                    <cylinderGeometry args={[0.016, 0.036, 0.23, 16]} />
                    <EngineMaterial materialType="TITANIUM" {...cylState} />
                  </mesh>
                  <mesh position={[-0.12, 0, 0.06]} rotation={[0, 0, 0.18]}>
                    <cylinderGeometry args={[0.016, 0.036, 0.23, 16]} />
                    <EngineMaterial materialType="TITANIUM" {...cylState} />
                  </mesh>`;

const replaceExhaust = `                {/* 2 Exhaust Valves (Angled toward -X at 18°) */}
                <group>
                  {[-0.06, 0.06].map((zOff, vi) => (
                    <group key={'exv_'+vi} position={[-0.12, 0, zOff]} rotation={[0, 0, 0.18]}>
                      {/* Valve Stem */}
                      <mesh position={[0, 0.08, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.18, 12]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Head Flare */}
                      <mesh position={[0, -0.04, 0]}>
                        <cylinderGeometry args={[0.008, 0.036, 0.06, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Face/Margin */}
                      <mesh position={[0, -0.07, 0]}>
                        <cylinderGeometry args={[0.036, 0.036, 0.005, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                    </group>
                  ))}`;

if (src.includes(targetExhaust)) {
  src = src.replace(targetExhaust, replaceExhaust);
  console.log("Patched exhaust valves.");
  fs.writeFileSync(file, src);
}
