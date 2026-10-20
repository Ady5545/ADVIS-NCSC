const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target1 = `return (
          <group key={'piston_group_' + i} position={[0, pistonY, zOffset]}>`;
          
const replace1 = `const cylNum = bank === 'left' ? i + 1 : i + 7;
        const bankPrefix = bank === 'left' ? 'bank_a' : 'bank_b';
        const cylPrefix = \`v12.\${bankPrefix}.cylinder\${cylNum < 10 ? '0' : ''}\${cylNum}\`;
        
        return (
          <EntityRef id={\`\${cylPrefix}.piston_assembly\`} name={\`Cylinder \${cylNum} Piston\`} type="assembly">
          <group key={'piston_group_' + i} position={[0, pistonY, zOffset]}>`;

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
