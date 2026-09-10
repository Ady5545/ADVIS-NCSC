const fs = require('fs');
const file = 'src/generators/MechanicalGenerator.tsx';
let src = fs.readFileSync(file, 'utf8');

const patches = [
  {
    target: "export function IntakePlenum({",
    replacement: `export function IntakePlenum(props: any) {
  return (
    <EntityRef id="v12.intake_plenum" name="Carbon Fiber Intake Plenum" type="assembly">
      <InternalIntakePlenum {...props} />
    </EntityRef>
  );
}

function InternalIntakePlenum({`
  },
  {
    target: "export function ExhaustManifold({",
    replacement: `export function ExhaustManifold(props: any) {
  return (
    <EntityRef id="v12.exhaust_manifold" name="Inconel Exhaust Manifolds" type="assembly">
      <InternalExhaustManifold {...props} />
    </EntityRef>
  );
}

function InternalExhaustManifold({`
  },
  {
    target: "export function CoolingSystem({",
    replacement: `export function CoolingSystem(props: any) {
  return (
    <EntityRef id="v12.cooling_system" name="Cooling & Water Pump System" type="assembly">
      <InternalCoolingSystem {...props} />
    </EntityRef>
  );
}

function InternalCoolingSystem({`
  },
  {
    target: "export function LubricationSystem({",
    replacement: `export function LubricationSystem(props: any) {
  return (
    <EntityRef id="v12.lubrication_system" name="Dry Sump Lubrication" type="assembly">
      <InternalLubricationSystem {...props} />
    </EntityRef>
  );
}

function InternalLubricationSystem({`
  },
  {
    target: "export function ElectronicsSensors({",
    replacement: `export function ElectronicsSensors(props: any) {
  return (
    <EntityRef id="v12.electronics" name="Engine Management & Sensors" type="assembly">
      <InternalElectronicsSensors {...props} />
    </EntityRef>
  );
}

function InternalElectronicsSensors({`
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
