const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target1 = `return (
            <group 
              key={'piston_' + i} 
              position={[0, 0, z]}`;
          
const replace1 = `const cylPrefix = \`v12.\${bank === 'left' ? 'bank_a' : 'bank_b'}.cylinder\${cylNum < 10 ? '0' : ''}\${cylNum}\`;
          return (
            <EntityRef id={\`\${cylPrefix}.piston\`} name={\`Cylinder \${cylNum} Piston\`} type="part">
            <group 
              key={'piston_' + i} 
              position={[0, 0, z]}`;

if (src.includes(target1)) {
  src = src.replace(target1, replace1);
  src = src.replace(`</group>
          );
        })}
      </group>`, `</group>
            </EntityRef>
          );
        })}
      </group>`);
    
  fs.writeFileSync(file, src);
  console.log("Patched pistons with EntityRef");
} else {
  console.log("Piston target not found");
}
