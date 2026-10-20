const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const patches = [
  {
    target: "export function ConnectingRodsAssembly({",
    replacement: `export function ConnectingRodsAssembly(props: any) {
  return (
    <EntityRef id="v12.connecting_rods" name="Connecting Rods Assembly" type="assembly">
      <InternalConnectingRodsAssembly {...props} />
    </EntityRef>
  );
}

function InternalConnectingRodsAssembly({`
  },
  {
    target: "export function CrankshaftAssembly({",
    replacement: `export function CrankshaftAssembly(props: any) {
  return (
    <EntityRef id="v12.crankshaft" name="Forged Steel Crankshaft" type="assembly">
      <InternalCrankshaftAssembly {...props} />
    </EntityRef>
  );
}

function InternalCrankshaftAssembly({`
  },
  {
    target: "export function ValvetrainAssembly(props: any) {",
    replacement: `export function ValvetrainAssembly(props: any) {
  return (
    <EntityRef id="v12.valvetrain" name="DOHC Valvetrain Assembly" type="assembly">
      <InternalValvetrainAssembly {...props} />
    </EntityRef>
  );
}

function InternalValvetrainAssembly(props: any) {`
  }
];

let changed = false;
for (const patch of patches) {
  if (src.includes(patch.target) && !src.includes(patch.replacement.split('(')[0].replace('export function ', 'function Internal'))) {
    src = src.replace(patch.target, patch.replacement);
    changed = true;
    console.log("Patched: " + patch.target.split('(')[0]);
  }
}

if (changed) {
  fs.writeFileSync(file, src);
}
