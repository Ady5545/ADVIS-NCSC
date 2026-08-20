const fs = require('fs');
let code = fs.readFileSync('src/LearnEngine/ContinuousVisuals.tsx', 'utf8');

const metricInject = `      {/* Molecular Geometry Measurement Metrics */}
      {isSummary && data.bondType === 'COVALENT' && (
         <group>
            {isWater && (
               <MeasurementArc 
                 radius={bondLength * 0.5} 
                 angle={104.5 * (Math.PI / 180)} 
                 label="104.5°" 
                 startRotation={-Math.PI/2 - (104.5 * (Math.PI / 180))/2} 
               />
            )}
            {isBF3 && (
               <MeasurementArc 
                 radius={bondLength * 0.5} 
                 angle={120 * (Math.PI / 180)} 
                 label="120°" 
                 startRotation={-Math.PI/2 - (120 * (Math.PI / 180))/2} 
               />
            )}
            {isCH4 && (
               <MeasurementArc 
                 radius={bondLength * 0.5} 
                 angle={109.5 * (Math.PI / 180)} 
                 label="109.5°" 
                 startRotation={-Math.PI/2 - (109.5 * (Math.PI / 180))/2} 
               />
            )}
            {isCO2 && (
               <MeasurementArc 
                 radius={bondLength * 0.5} 
                 angle={180 * (Math.PI / 180)} 
                 label="180°" 
                 startRotation={0} 
               />
            )}
         </group>
      )}
`;

// Insert it right after the atoms/bonds group.
code = code.replace(/\{\/\* BF3 Specific Orbitals \*\/\}/, metricInject + '\n\n      {/* BF3 Specific Orbitals */}');

fs.writeFileSync('src/LearnEngine/ContinuousVisuals.tsx', code, 'utf8');
