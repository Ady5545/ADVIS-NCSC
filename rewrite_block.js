const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const target = "export function EngineBlockAssembly({ isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {";

if (src.includes(target) && !src.includes('<EntityRef id="v12" name="V12 Engine Assembly" type="assembly">')) {
  src = src.replace(target, 
`${target}
  return (
    <EntityRef id="v12" name="V12 Engine Assembly" type="assembly">
      <EntityRef id="v12.block" name="Engine Block" type="assembly">
        <group>
`);
  // This is a naive replacement, need to close the tags at the end of the return statement
  console.log("Found target, but manual AST rewrite is safer for deep trees.");
}
