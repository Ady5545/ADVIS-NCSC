const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

const match = /const showElectrons = isValence \|\| isGround \|\| isHyb \|\| isSigma \|\| isBondsOnly;[\s\S]*?const currentPositions = showBonds \? finalPositions : farPositions;/;
const replacement = `const showElectrons = isValence || isGround || isHyb || isSigma || isBondsOnly;
  
  const bondMatch = phase.match(/^bond_(\\d+)$/);
  const currentBondIndex = bondMatch ? parseInt(bondMatch[1]) : -1;
  const isSequentialBonding = currentBondIndex !== -1;
  const showOrbitals = isGround || isHyb || isSigma || isSequentialBonding;

  const bondLength = 2.0;

  // Final geometry targets - dynamic based on lone pair repulsion
  let finalPositions: [number, number, number][] = [];
  let multipleBond = 1;
  let hybridRotations: [number, number, number][] = [];

  const getRot = (v: [number, number, number]): [number, number, number] => {
      const vec = new THREE.Vector3(...v).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec);
      const e = new THREE.Euler().setFromQuaternion(q);
      return [e.x, e.y, e.z];
  };

  if (isWater) { 
      // Before lone pairs: tetrahedral (109.5), After: bent (104.5)
      const angle = showLonePairs ? 104.5 * (Math.PI / 180) : 109.5 * (Math.PI / 180);
      finalPositions = [
          [-bondLength * Math.sin(angle/2), -bondLength * Math.cos(angle/2), 0],
          [bondLength * Math.sin(angle/2), -bondLength * Math.cos(angle/2), 0]
      ];
  } else if (isCO2) { // Linear 180
      finalPositions = [[-bondLength, 0, 0], [bondLength, 0, 0]];
      multipleBond = 2;
  } else if (isCH4) { // Tetrahedral 109.5
      const a = bondLength / Math.sqrt(3);
      finalPositions = [
          [a, a, a],
          [-a, -a, a],
          [-a, a, -a],
          [a, -a, -a]
      ];
      hybridRotations = finalPositions.map(p => getRot(p));
  } else if (isNH3) { 
      // Before lone pairs: tetrahedral (109.5), After: trigonal pyramidal (107)
      const angle = showLonePairs ? 107 * (Math.PI / 180) : 109.5 * (Math.PI / 180);
      const height = bondLength * Math.cos(Math.PI - angle);
      const radius = bondLength * Math.sin(Math.PI - angle);
      finalPositions = [
          [0, -height, radius],
          [radius * Math.cos(Math.PI/6), -height, -radius * Math.sin(Math.PI/6)],
          [-radius * Math.cos(Math.PI/6), -height, -radius * Math.sin(Math.PI/6)]
      ];
  } else if (isBF3) { // Trigonal Planar 120
      finalPositions = [
          [0, bondLength, 0],
          [bondLength * Math.cos(Math.PI/6), -bondLength * Math.sin(Math.PI/6), 0],
          [-bondLength * Math.cos(Math.PI/6), -bondLength * Math.sin(Math.PI/6), 0]
      ];
      hybridRotations = finalPositions.map(p => getRot(p));
  } else {
      finalPositions = [[-bondLength, 0, 0], [bondLength, 0, 0]];
  }

  // Pre-bonding positions (far away)
  const farPositions = finalPositions.map(p => {
     const vec = new THREE.Vector3(...p).normalize().multiplyScalar(4.0);
     return [vec.x, vec.y, vec.z] as [number, number, number];
  });`;

code = code.replace(match, replacement);

const match2 = /\{\/\* Ligands and Bonds \*\/\}[\s\S]*?\{\/\* BF3 Specific Orbitals \*\/\}/;
const replacement2 = `{\/\* Ligands and Bonds \*\/}
      {finalPositions.map((target, i) => {
         const isThisBondFormed = showBonds || (currentBondIndex >= i);
         const pos = isThisBondFormed ? target : farPositions[i];
         const vec = new THREE.Vector3(...pos);
         const targetVec = new THREE.Vector3(...target);
         const midPoint = targetVec.clone().multiplyScalar(0.5);
         
         // Animate electrons moving from atoms to the bonding region
         let e1Pos = vec.clone().multiplyScalar(0.7).toArray() as [number, number, number]; // From ligand
         let e2Pos = targetVec.clone().multiplyScalar(0.3).toArray() as [number, number, number]; // From central
         
         if (isThisBondFormed) {
             e1Pos = [midPoint.x + 0.1, midPoint.y + 0.1, midPoint.z];
             e2Pos = [midPoint.x - 0.1, midPoint.y - 0.1, midPoint.z];
         }
         
         const isElectronsVisible = showElectrons || currentBondIndex >= -1; // always visible in these phases if sequential

         return (
           <group key={i}>
             <Bond start={[0,0,0]} end={target} multiple={multipleBond} visible={isThisBondFormed} />
             <AnimGroup position={pos}>
               <Atom position={[0,0,0]} element={ligandElement} label={ligandElement} />
             </AnimGroup>
             
             {/* Shared Electron Pair */}
             <AnimGroup visible={isElectronsVisible && phase !== 'atoms'} position={e1Pos}>
                <Electron position={[0,0,0]} />
             </AnimGroup>
             <AnimGroup visible={isElectronsVisible && phase !== 'atoms'} position={e2Pos}>
                <Electron position={[0,0,0]} color="#38bdf8" />
             </AnimGroup>
           </group>
         );
      })}

      {/* BF3 Specific Orbitals */}`;

code = code.replace(match2, replacement2);
fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
