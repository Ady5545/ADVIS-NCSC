const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target = `export function PistonAssemblyBank({`;
const replace = `export function PistonAssemblyBank(props: any) {
  const { bank } = props;
  const bankId = bank === 'left' ? 'bank_a' : 'bank_b';
  const bankName = bank === 'left' ? 'Bank A (Left) Pistons' : 'Bank B (Right) Pistons';
  return (
    <EntityRef id={\`v12.\${bankId}.pistons\`} name={bankName} type="assembly">
       <InternalPistonAssemblyBank {...props} />
    </EntityRef>
  );
}

function InternalPistonAssemblyBank({`;

if (src.includes(target) && !src.includes('InternalPistonAssemblyBank')) {
  src = src.replace(target, replace);
  fs.writeFileSync(file, src);
  console.log("Patched PistonAssemblyBank.");
} else {
  console.log("Already patched or not found.");
}
