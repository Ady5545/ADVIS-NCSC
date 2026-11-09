const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target1 = `return (
          <React.Fragment key={'sleeves_' + i}>
            {/* Left Bank Cylinder Liner (tilted +30° -> bore axis pointing up-left) */}
            <group 
              rotation={[0, 0, BANK_ANGLE]}`;

const replace1 = `const leftCylId = \`v12.bank_a.cylinder\${leftCylNum < 10 ? '0' : ''}\${leftCylNum}\`;
        const rightCylId = \`v12.bank_b.cylinder\${rightCylNum < 10 ? '0' : ''}\${rightCylNum}\`;
        return (
          <React.Fragment key={'sleeves_' + i}>
            <EntityRef id={leftCylId + ".liner"} name={\`Cylinder \${leftCylNum} Liner\`} type="part">
            {/* Left Bank Cylinder Liner (tilted +30° -> bore axis pointing up-left) */}
            <group 
              rotation={[0, 0, BANK_ANGLE]}`;

if (src.includes(target1)) {
  src = src.replace(target1, replace1);
  src = src.replace(`</group>
            {/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}`, `</group>
            </EntityRef>
            {/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}`);
  
  const target2 = `{/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}
            <group 
              rotation={[0, 0, -BANK_ANGLE]}`;
  const replace2 = `{/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}
            <EntityRef id={rightCylId + ".liner"} name={\`Cylinder \${rightCylNum} Liner\`} type="part">
            <group 
              rotation={[0, 0, -BANK_ANGLE]}`;
  src = src.replace(target2, replace2);
  
  src = src.replace(`</group>
          </React.Fragment>`, `</group>
            </EntityRef>
          </React.Fragment>`);
  
  fs.writeFileSync(file, src);
  console.log("Patched liners with EntityRef");
} else {
  console.log("Liners target not found");
}
