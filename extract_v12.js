const fs = require('fs');
const src = fs.readFileSync('src/generators/MechanicalGenerator.tsx', 'utf8');

let newCode = `
import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { EntityRef } from '../scientific/architecture/ComponentRegistrationWrapper';
import { EngineMaterial, HexBolt, GroovedPulley, getPistonStroke, CRANK_RADIUS, CRANK_OFFSETS, CYLINDER_Z, BANK_ANGLE } from './MechanicalGenerator';
import { GlobalComponentRegistry } from '../scientific/architecture/ComponentRegistry';

export function ProceduralV12Engine(props: any) {
  // New hierarchical structure
  return (
    <EntityRef id="v12" name="V12 Engine" type="assembly">
      <EngineBlockShell {...props} />
      <Crankshaft {...props} />
      <EntityRef id="v12.bank_a" name="Left Cylinder Bank" type="assembly">
         {CYLINDER_Z.map((z, i) => <CylinderAssembly key={i} bank="left" index={i} zOffset={z} {...props} />)}
      </EntityRef>
      <EntityRef id="v12.bank_b" name="Right Cylinder Bank" type="assembly">
         {CYLINDER_Z.map((z, i) => <CylinderAssembly key={i} bank="right" index={i} zOffset={z} {...props} />)}
      </EntityRef>
      <Valvetrain {...props} />
      <Accessories {...props} />
    </EntityRef>
  );
}

// ... more component implementations ...
`;
fs.writeFileSync('src/generators/V12HierarchicalGenerator.tsx', newCode);
