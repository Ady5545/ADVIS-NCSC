const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const replacementLeft = `      {/* Fuel Rails & Injectors */}
      <mesh position={[-0.25, 1.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.7, 16]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#ef4444" {...state} />
      </mesh>
      {CYLINDER_Z.map((z, i) => (
         <group key={'inj_l_'+i} position={[-0.29, 1.20, z]} rotation={[0, 0, Math.PI/6]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.008, 0.08, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#fbbf24" {...state} />
            </mesh>
         </group>
      ))}
      {leftRunners.map((geo, i) => (`;

src = src.replace('{leftRunners.map((geo, i) => (', replacementLeft);

const replacementRight = `      {/* Right Fuel Rail */}
      <mesh position={[0.25, 1.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.7, 16]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#ef4444" {...state} />
      </mesh>
      {CYLINDER_Z.map((z, i) => (
         <group key={'inj_r_'+i} position={[0.29, 1.20, z]} rotation={[0, 0, -Math.PI/6]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.008, 0.08, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#fbbf24" {...state} />
            </mesh>
         </group>
      ))}
      {rightRunners.map((geo, i) => (`;

src = src.replace('{rightRunners.map((geo, i) => (', replacementRight);

fs.writeFileSync(file, src);
console.log("Patched intake with injectors.");

