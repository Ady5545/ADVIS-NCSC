const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

const h2oOrbitals = `
      {/* H2O Specific Orbitals */}
      {isWater && showOrbitals && (
         <group>
            {finalPositions.map((target, i) => {
                const rot = getRot(target);
                // Only show the bonding orbital if this bond is not formed, OR if it's forming
                return (
                   <HybridOrbital key={'h2o_hyb_'+i} position={[0,0,0]} rotation={rot} color="#ec4899" />
                );
            })}
            <HybridOrbital position={[0,0,0]} rotation={getRot([0, bondLength*0.6, bondLength*0.6])} color="#ec4899" />
            <HybridOrbital position={[0,0,0]} rotation={getRot([0, bondLength*0.6, -bondLength*0.6])} color="#ec4899" />
         </group>
      )}

      {/* BF3 Specific Orbitals */}`;

code = code.replace(/\{\/\* BF3 Specific Orbitals \*\/\}/, h2oOrbitals);
fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
