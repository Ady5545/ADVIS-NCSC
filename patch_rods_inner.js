const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target1 = `return (
          <React.Fragment key={'rod_pair_' + i}>
            {/* Bank 1 (Left) Titanium H-Beam Rod */}
            <group
              onClick={(e) => {`;
          
const replace1 = `const leftCylPrefix = \`v12.bank_a.cylinder\${leftCylNum < 10 ? '0' : ''}\${leftCylNum}\`;
        const rightCylPrefix = \`v12.bank_b.cylinder\${rightCylNum < 10 ? '0' : ''}\${rightCylNum}\`;
        return (
          <React.Fragment key={'rod_pair_' + i}>
            {/* Bank 1 (Left) Titanium H-Beam Rod */}
            <EntityRef id={\`\${leftCylPrefix}.connecting_rod\`} name={\`Cylinder \${leftCylNum} Connecting Rod\`} type="part">
            <group
              onClick={(e) => {`;

if (src.includes(target1)) {
  src = src.replace(target1, replace1);
  src = src.replace(`</group>
            {/* Bank 2 (Right) Titanium H-Beam Rod */}`, `</group>
            </EntityRef>
            {/* Bank 2 (Right) Titanium H-Beam Rod */}`);
            
  const target2 = `{/* Bank 2 (Right) Titanium H-Beam Rod */}
            <group
              onClick={(e) => {`;
  const replace2 = `{/* Bank 2 (Right) Titanium H-Beam Rod */}
            <EntityRef id={\`\${rightCylPrefix}.connecting_rod\`} name={\`Cylinder \${rightCylNum} Connecting Rod\`} type="part">
            <group
              onClick={(e) => {`;
  
  src = src.replace(target2, replace2);
  
  src = src.replace(`</group>
          </React.Fragment>`, `</group>
            </EntityRef>
          </React.Fragment>`);
    
  fs.writeFileSync(file, src);
  console.log("Patched rods with EntityRef");
} else {
  console.log("Rods target not found");
}
