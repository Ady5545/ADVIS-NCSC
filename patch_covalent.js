const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

// Use a regular expression or replace block to rewrite ContinuousCovalentVisuals
const newCovalent = `
export function ContinuousCovalentVisuals({ data, phase }: { data: any, phase: string }) {
  const isWater = data.formula === 'H2O';
  const isCO2 = data.formula === 'CO2';
  const isCH4 = data.formula === 'CH4';
  const isNH3 = data.formula === 'NH3';
  const isBF3 = data.formula === 'BF3';
  
  const centralElement = data.centralAtom || 'C';
  const ligandElement = data.ligands?.[0]?.atom || 'H';
  
  // Base states
  const isAtoms = phase === 'atoms';
  const isValence = phase === 'valence';
  const isGround = phase === 'ground_state';
  const isHyb = phase === 'hybridization';
  const isSigma = phase === 'sigma_bonds';
  const isBondsOnly = phase === 'bonds_only';
  const isLonePairs = phase === 'lone_pairs';
  const isSummary = phase === 'summary' || phase === 'geometry';

  // State grouping
  const showOrbitals = isGround || isHyb || isSigma;
  const showBonds = isSigma || isBondsOnly || isLonePairs || isSummary;
  const showLonePairs = isLonePairs || isSummary;
  const showElectrons = isValence || isGround || isHyb || isSigma || isBondsOnly;
  
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
  });

  const currentPositions = showBonds ? finalPositions : farPositions;

  return (
    <Float rotationIntensity={isSummary ? 0.5 : 0.1}>
      <HolographicGrid />
      <AnimGroup position={[0, 0, 0]}>
        <Atom position={[0, 0, 0]} element={centralElement} label={centralElement} showReticle={isSummary} reticleLabel={\`\${centralElement} CENTRAL\`} />
      </AnimGroup>
      
      {/* Ligands and Bonds */}
      {finalPositions.map((target, i) => {
         const pos = currentPositions[i];
         const vec = new THREE.Vector3(...pos);
         const targetVec = new THREE.Vector3(...target);
         const midPoint = targetVec.clone().multiplyScalar(0.5);
         
         // Animate electrons moving from atoms to the bonding region
         let e1Pos = vec.clone().multiplyScalar(0.7).toArray() as [number, number, number]; // From ligand
         let e2Pos = targetVec.clone().multiplyScalar(0.3).toArray() as [number, number, number]; // From central
         
         if (showBonds) {
             e1Pos = [midPoint.x + 0.1, midPoint.y + 0.1, midPoint.z];
             e2Pos = [midPoint.x - 0.1, midPoint.y - 0.1, midPoint.z];
         }
         
         return (
           <group key={i}>
             <AnimGroup visible={showBonds}>
               <Bond start={[0,0,0]} end={target} multiple={multipleBond} />
             </AnimGroup>
             <AnimGroup position={pos}>
               <Atom position={[0,0,0]} element={ligandElement} label={ligandElement} />
             </AnimGroup>
             
             {/* Shared Electron Pair */}
             <AnimGroup visible={showElectrons} position={e1Pos}>
                <Electron position={[0,0,0]} />
             </AnimGroup>
             <AnimGroup visible={showElectrons} position={e2Pos}>
                <Electron position={[0,0,0]} color="#38bdf8" />
             </AnimGroup>
           </group>
         );
      })}

      {/* BF3 Specific Orbitals */}
      {isBF3 && showOrbitals && (
         <group>
            <AnimGroup visible={isGround}>
               <SOrbital position={[0,0,0]} color="#3b82f6" />
               <POrbital position={[0,0,0]} rotation={[0,0,0]} color="#a855f7" />
            </AnimGroup>
            <AnimGroup visible={!isGround}>
               {hybridRotations.map((rot, i) => (
                  <HybridOrbital key={i} position={[0,0,0]} rotation={rot} color="#ec4899" />
               ))}
               <POrbital position={[0,0,0]} rotation={[Math.PI/2, 0, 0]} color="#a855f7" />
            </AnimGroup>
            
            {/* Show an electron moving from 2s to 2p during excitation */}
            {isGround && (
               <AnimGroup position={[0, 1.2, 0]}>
                  <Electron position={[0,0,0]} label="2s -> 2p" />
               </AnimGroup>
            )}
         </group>
      )}

      {/* CH4 Specific Orbitals */}
      {isCH4 && showOrbitals && (
         <group>
            <AnimGroup visible={isGround}>
               <SOrbital position={[0,0,0]} color="#3b82f6" />
               <POrbital position={[0,0,0]} rotation={[0,0,0]} color="#a855f7" />
               <POrbital position={[0,0,0]} rotation={[0,0,Math.PI/2]} color="#a855f7" />
            </AnimGroup>
            <AnimGroup visible={!isGround}>
               {hybridRotations.map((rot, i) => (
                  <HybridOrbital key={i} position={[0,0,0]} rotation={rot} color="#ec4899" />
               ))}
            </AnimGroup>
         </group>
      )}

      {/* Lone Pairs */}
      {isWater && (
         <group>
           <AnimGroup visible={showLonePairs} position={[0, bondLength*0.6, bondLength*0.6]} rotation={[Math.PI/4, 0, 0]}>
             <LonePair position={[0,0,0]} rotation={[0,0,0]} />
           </AnimGroup>
           <AnimGroup visible={showLonePairs} position={[0, bondLength*0.6, -bondLength*0.6]} rotation={[-Math.PI/4, 0, 0]}>
             <LonePair position={[0,0,0]} rotation={[0,0,0]} />
           </AnimGroup>
         </group>
      )}
      
      {isNH3 && (
         <AnimGroup visible={showLonePairs} position={[0, bondLength*0.8, 0]} rotation={[0, 0, 0]}>
            <LonePair position={[0,0,0]} rotation={[0,0,0]} />
         </AnimGroup>
      )}

      {/* Measurements */}
      <AnimGroup visible={isSummary}>
         {isWater && (
           <MeasurementArc radius={1.2} angle={104.5 * Math.PI/180} label="104.5°" startRotation={-(104.5/2) * Math.PI/180 - Math.PI/2} />
         )}
         {isBF3 && (
           <MeasurementArc radius={1.5} angle={120 * Math.PI/180} label="120°" startRotation={-Math.PI/6} />
         )}
         {isCH4 && (
           <MeasurementArc radius={1.5} angle={109.5 * Math.PI/180} label="109.5°" startRotation={0} />
         )}
         {isNH3 && (
           <MeasurementArc radius={1.5} angle={107 * Math.PI/180} label="107°" startRotation={-Math.PI/2 - (107/2)*Math.PI/180} />
         )}
      </AnimGroup>
      
    </Float>
  );
}
`;

code = code.replace(/export function ContinuousCovalentVisuals[\s\S]*?(?=$)/, newCovalent + '\n');
fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
