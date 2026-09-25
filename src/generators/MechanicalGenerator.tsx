// src/generators/MechanicalGenerator.tsx
// A.D.V.I.S. High-Precision Procedural V12 Internal Combustion Engine Engineering Assembly & Real-Time Kinematics

import React, { useRef, useMemo } from 'react';
import { EntityRef } from '../scientific/architecture/ComponentRegistrationWrapper';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------------------------------------
// PBR ENGINEERING MATERIAL SYSTEM
// ----------------------------------------------------
export interface HolographicMaterialProps {
  baseColor?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  isCylinderFocused?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  opacity?: number;
  materialType?: 
    | 'CAST_ALUMINUM' 
    | 'MACHINED_BILLET'
    | 'FORGED_STEEL' 
    | 'HONED_LINER'
    | 'CAST_IRON' 
    | 'RUBBER' 
    | 'PLASTIC' 
    | 'COPPER' 
    | 'BRASS' 
    | 'TITANIUM' 
    | 'EXHAUST_STEEL' 
    | 'WRINKLE_RED' 
    | 'CARBON_FIBER' 
    | 'CHROME'
    | 'BEARING_BRONZE'
    | 'CERAMIC';
}

export function EngineMaterial({
  baseColor,
  isHovered,
  isSelected,
  isCylinderFocused,
  xrayEnabled,
  blueprintEnabled,
  opacity = 1,
  materialType = 'CAST_ALUMINUM'
}: HolographicMaterialProps) {
  if (blueprintEnabled) {
    return <meshBasicMaterial color="#0284c7" wireframe={true} transparent opacity={0.35} />;
  }

  if (xrayEnabled) {
    return (
      <meshPhysicalMaterial
        color={baseColor || '#94a3b8'}
        transparent={true}
        opacity={0.18}
        roughness={0.15}
        metalness={0.88}
        transmission={0.90}
        ior={1.45}
        emissive={isCylinderFocused ? "#06b6d4" : (isSelected ? "#0284c7" : (isHovered ? "#38bdf8" : "#000000"))}
        emissiveIntensity={isCylinderFocused ? 0.85 : (isSelected ? 0.7 : (isHovered ? 0.35 : 0))}
      />
    );
  }

  let r = 0.48, m = 0.74, c = baseColor || '#94a3b8';
  let cc = 0.0, cr = 0.0;
  let anisotropy = 0.0;
  let transmission = 0.0;
  let thickness = 0.0;
  let sheen = 0.0;

  switch (materialType) {
    case 'CAST_ALUMINUM': 
      // Cast aluminum: roughness ~0.48, metalness ~0.74, no clearcoat
      r = 0.48; m = 0.74; c = baseColor || '#94a3b8'; cc = 0.0; cr = 0.0;
      break;
    case 'HONED_LINER':
      // Micro-polished ductile iron with cross-hatch hone appearance
      r = 0.22; m = 0.92; c = baseColor || '#64748b'; cc = 0.42; cr = 0.08; anisotropy = 0.28;
      break;
    case 'MACHINED_BILLET':
      // CNC machined high-sheen billet aluminum
      r = 0.20; m = 0.88; c = baseColor || '#e2e8f0'; cc = 0.56; cr = 0.07; anisotropy = 0.24;
      break;
    case 'FORGED_STEEL': 
      // Steel/iron parts (crankshaft, rods, liners, bolts): metalness ~0.92, roughness ~0.26, clearcoat 0.35
      r = 0.25; m = 0.92; c = baseColor || '#94a3b8'; cc = 0.40; cr = 0.09; anisotropy = 0.20; 
      break;
    case 'CAST_IRON': 
      // Ductile nodular cast iron
      r = 0.65; m = 0.75; c = baseColor || '#334155'; cc = 0.10; cr = 0.20;
      break;
    case 'TITANIUM': 
      // Ti-6Al-4V aerospace titanium
      r = 0.27; m = 0.92; c = baseColor || '#a1a1aa'; cc = 0.34; cr = 0.11; anisotropy = 0.16;
      break;
    case 'EXHAUST_STEEL': 
      // Distinct heat-cycled straw-bronze metallic finish
      r = 0.27; m = 0.90; c = baseColor || '#94a3b8'; cc = 0.44; cr = 0.10; anisotropy = 0.18; 
      break;
    case 'WRINKLE_RED': 
      // Valve covers: proper clearcoat (~0.45) so painted red reads as coated metal, not flat matte
      r = 0.42; m = 0.35; c = baseColor || '#b91c1c'; cc = 0.45; cr = 0.15; 
      break;
    case 'CARBON_FIBER': 
      // High-gloss twill weave carbon composite
      r = 0.36; m = 0.32; c = baseColor || '#18181b'; cc = 0.92; cr = 0.05; 
      break;
    case 'CHROME': 
      // Mirror-polished mirror chrome / electroplated hardware
      r = 0.05; m = 0.98; c = baseColor || '#f8fafc'; cc = 0.98; cr = 0.02; 
      break;
    case 'RUBBER': 
      // Rubber/elastomer parts: roughness ~0.86, zero metalness
      r = 0.84; m = 0.0; c = baseColor || '#18181b'; cc = 0.0; cr = 0.0; sheen = 0.20;
      break;
    case 'PLASTIC': 
      // Heat-resistant nylon PA66 composite
      r = 0.40; m = 0.12; c = baseColor || '#27272a'; cc = 0.12; cr = 0.18; sheen = 0.08;
      break;
    case 'COPPER': 
      // Thermal copper gaskets & locknuts
      r = 0.30; m = 0.88; c = baseColor || '#b45309'; cc = 0.20; cr = 0.15;
      break;
    case 'BRASS': 
      // Machined naval brass fittings & throttle plates
      r = 0.25; m = 0.92; c = baseColor || '#ca8a04'; cc = 0.30; cr = 0.10;
      break;
    case 'BEARING_BRONZE':
      // SAE 660 leaded bronze bearing inserts
      r = 0.32; m = 0.84; c = baseColor || '#d97706'; cc = 0.25; cr = 0.12;
      break;
    case 'CERAMIC':
      // Alumina oxide white insulator ceramic
      r = 0.15; m = 0.05; c = baseColor || '#ffffff'; cc = 0.85; cr = 0.05;
      break;
  }

  return (
    <meshPhysicalMaterial
      color={c}
      roughness={r}
      metalness={m}
      clearcoat={cc}
      clearcoatRoughness={cr}
      transparent={opacity < 1}
      opacity={opacity}
      emissive={isCylinderFocused ? "#06b6d4" : (isSelected ? "#0284c7" : (isHovered ? "#0ea5e9" : "#000000"))}
      emissiveIntensity={isCylinderFocused ? 0.5 : (isSelected ? 0.28 : (isHovered ? 0.1 : 0))}
      wireframe={isSelected}
      envMapIntensity={1.5}
      anisotropy={anisotropy}
      transmission={transmission}
      thickness={thickness}
      sheen={isCylinderFocused ? Math.max(0.5, sheen) : sheen}
      sheenColor={isCylinderFocused ? new THREE.Color("#38bdf8") : undefined}
      sheenRoughness={isCylinderFocused ? 0.12 : 0.42}
    />
  );
}

// Reusable Fastener: Grade 12.9 Low-Poly Hex Flange Bolt
export function HexBolt({
  position,
  rotation,
  radius = 0.016,
  height = 0.014,
  state
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  height?: number;
  state: any;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* 6-Sided Hex Head */}
      <mesh position={[0, height * 0.5, 0]}>
        <cylinderGeometry args={[radius, radius, height, 6]} />
        <EngineMaterial materialType="FORGED_STEEL" baseColor="#cbd5e1" {...state} />
      </mesh>
      {/* Integrated Flange Washer */}
      <mesh position={[0, height * 0.1, 0]}>
        <cylinderGeometry args={[radius * 1.35, radius * 1.35, height * 0.2, 16]} />
        <EngineMaterial materialType="FORGED_STEEL" baseColor="#94a3b8" {...state} />
      </mesh>
    </group>
  );
}

// Reusable Accessory: Multi-V Serpentine Grooved Pulley
export function GroovedPulley({
  position,
  rotation,
  radius,
  width,
  grooves = 5,
  state
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  radius: number;
  width: number;
  grooves?: number;
  state: any;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Main Pulley Hub / Body */}
      <mesh>
        <cylinderGeometry args={[radius, radius, width, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...state} />
      </mesh>
      {/* Front & Rear Retaining Flange Lips */}
      <mesh position={[0, width * 0.48, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, width * 0.08, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" baseColor="#64748b" {...state} />
      </mesh>
      <mesh position={[0, -width * 0.48, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, width * 0.08, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" baseColor="#64748b" {...state} />
      </mesh>
      {/* Multi-V Grooves Along Belt Track */}
      {[...Array(grooves)].map((_, gi) => {
        const yOffset = ((gi - (grooves - 1) / 2) * (width * 0.72)) / grooves;
        return (
          <mesh key={'p_groove_' + gi} position={[0, yOffset, 0]}>
            <torusGeometry args={[radius * 0.99, 0.0035, 6, 32]} />
            <EngineMaterial materialType="RUBBER" baseColor="#0f172a" {...state} />
          </mesh>
        );
      })}
      {/* Center Grade 12.9 Retaining Hex Nut */}
      <mesh position={[0, width * 0.52, 0]}>
        <cylinderGeometry args={[radius * 0.32, radius * 0.32, width * 0.22, 6]} />
        <EngineMaterial materialType="CHROME" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// V12 MECHANICAL ARCHITECTURE CONSTANTS
// ----------------------------------------------------
// 6 Cylinder stations along Z axis with 0.50m bore pitch:
export const CYLINDER_Z = [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25];
export const CRANK_RADIUS = 0.22; // Crank throw radius R
export const ROD_LENGTH = 0.70;   // Connecting rod center-to-center length L
export const BANK_ANGLE = Math.PI / 6; // 30 degrees from vertical (60° included V angle)

// Standard 60° V12 120-degree throw distribution for perfect primary/secondary balance:
// Mirrored cylinder pairs (1-6, 2-5, 3-4)
export const CRANK_OFFSETS = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));

// Exact closed-form slider-crank displacement along bore axis
export function getPistonStroke(crankAngle: number, bank: 'left' | 'right'): number {
  const sign = bank === 'left' ? -1 : 1;
  const uX = sign * Math.sin(BANK_ANGLE);
  const uY = Math.cos(BANK_ANGLE);

  // Perpendicular unit vector in XY
  const vX = -uY;
  const vY = uX;

  // Crankpin position in global XY
  const cpX = Math.sin(crankAngle) * CRANK_RADIUS;
  const cpY = Math.cos(crankAngle) * CRANK_RADIUS;

  const p_parallel = cpX * uX + cpY * uY;
  const p_perp = cpX * vX + cpY * vY;

  return p_parallel + Math.sqrt(Math.max(0.01, ROD_LENGTH * ROD_LENGTH - p_perp * p_perp));
}

// ----------------------------------------------------
// 1. ENGINE BLOCK & CRANKCASE ASSEMBLY
// Deep-skirt 60° V12 cast aluminum monobloc with 12 centrifugally cast
// iron sleeves, 7 cross-bolted main bearing caps, and cooling jacket galleries.
// ----------------------------------------------------
export function EngineBlockAssembly({ isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <EntityRef id="v12.engine_block" name="Engine Block Assembly" type="assembly">
      <InternalEngineBlockAssembly isHovered={isHovered} isSelected={isSelected} focusedCylinder={focusedCylinder} xrayEnabled={xrayEnabled} blueprintEnabled={blueprintEnabled} sysTimeRef={sysTimeRef} />
    </EntityRef>
  );
}

function InternalEngineBlockAssembly({ isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef };

  // 3-Part V12 Engine Block (Crankcase + 2 Cylinder Banks with Bores)
  const crankcaseShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.48, -0.40); // Bottom left pan rail
    shape.lineTo(0.48, -0.40);  // Bottom right pan rail
    shape.lineTo(0.53, -0.22);
    shape.lineTo(0.58, -0.04);
    shape.lineTo(0.35, 0.44);   // Right bank base
    shape.lineTo(-0.35, 0.44);  // Left bank base
    shape.lineTo(-0.58, -0.04);
    shape.lineTo(-0.53, -0.22);
    shape.lineTo(-0.48, -0.40);
    return shape;
  }, []);

  const bankShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Shape X = Local X (-0.26 to 0.26)
    // Shape Y = Local -Z (-(-1.51) to -(1.51)) -> 1.51 to -1.51
    shape.moveTo(-0.26, 1.51);
    shape.lineTo(0.26, 1.51);
    shape.lineTo(0.26, -1.51);
    shape.lineTo(-0.26, -1.51);
    shape.lineTo(-0.26, 1.51);
    
    // Add 6 cylinder holes
    CYLINDER_Z.forEach(z => {
       const hole = new THREE.Path();
       hole.absarc(0, -z, 0.21, 0, Math.PI * 2, true);
       shape.holes.push(hole);
    });
    return shape;
  }, []);

  const crankcaseSettings = useMemo(() => ({ depth: 3.02, bevelEnabled: true, bevelSegments: 4, steps: 2, bevelSize: 0.035, bevelThickness: 0.035 }), []);
  const bankSettings = useMemo(() => ({ depth: 0.65, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 24 }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Lower Crankcase */}
      <mesh position={[0, 0, -1.51]}>
        <extrudeGeometry args={[crankcaseShape, crankcaseSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      
      {/* Left Cylinder Bank */}
      <mesh position={[0, 0.40, 0]} rotation={[0, 0, BANK_ANGLE]}>
         {/* Rotate so that depth is along local Y (bore axis), and shape is in local XZ plane */}
         <group rotation={[-Math.PI / 2, 0, 0]}>
           <mesh position={[0, 0, 0]}>
             <extrudeGeometry args={[bankShape, bankSettings]} />
             <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
           </mesh>
         </group>
      </mesh>

      {/* Right Cylinder Bank */}
      <mesh position={[0, 0.40, 0]} rotation={[0, 0, -BANK_ANGLE]}>
         <group rotation={[-Math.PI / 2, 0, 0]}>
           <mesh position={[0, 0, 0]}>
             <extrudeGeometry args={[bankShape, bankSettings]} />
             <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
           </mesh>
         </group>
      </mesh>

      {/* 12 Centrifugally-Cast Ductile Iron Cylinder Liners (6 Left Bank, 6 Right Bank) */}
      {CYLINDER_Z.map((z, i) => {
        const leftCylNum = i + 1;
        const rightCylNum = i + 7;
        const isLeftFocused = state.focusedCylinder === leftCylNum;
        const isRightFocused = state.focusedCylinder === rightCylNum;

        const leftCylId = `v12.bank_a.cylinder${leftCylNum < 10 ? '0' : ''}${leftCylNum}`;
        const rightCylId = `v12.bank_b.cylinder${rightCylNum < 10 ? '0' : ''}${rightCylNum}`;
        return (
          <React.Fragment key={'sleeves_' + i}>
            <EntityRef id={leftCylId + ".liner"} name={`Cylinder ${leftCylNum} Liner`} type="part">
            {/* Left Bank Cylinder Liner (tilted +30° -> bore axis pointing up-left) */}
            <group 
              rotation={[0, 0, BANK_ANGLE]}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum: leftCylNum } }));
              }}
            >
              {/* Ductile Iron Cylinder Wall with Precision Honed Inner Bore */}
              <mesh position={[0, 0.68, z]}>
                <cylinderGeometry args={[0.205, 0.205, 0.65, 32, 1, true]} />
                <EngineMaterial 
                  materialType="HONED_LINER" 
                  opacity={xrayEnabled ? 0.4 : 0.95} 
                  isCylinderFocused={isLeftFocused}
                  {...state} 
                />
              </mesh>
              {/* Stepped Upper Fire-Ring Counterbore Flange (Seats flush into Block Deck) */}
              <mesh position={[0, 1.00, z]}>
                <cylinderGeometry args={[0.222, 0.222, 0.022, 32]} />
                <EngineMaterial materialType="MACHINED_BILLET" isCylinderFocused={isLeftFocused} {...state} />
              </mesh>
              {/* Top Chamfer Lip for Piston Ring Guide */}
              <mesh position={[0, 1.015, z]}>
                <cylinderGeometry args={[0.208, 0.204, 0.008, 32]} />
                <EngineMaterial materialType="CHROME" {...state} />
              </mesh>
            </group>
            </EntityRef>
            {/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}
            <EntityRef id={rightCylId + ".liner"} name={`Cylinder ${rightCylNum} Liner`} type="part">
            <group 
              rotation={[0, 0, -BANK_ANGLE]}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum: rightCylNum } }));
              }}
            >
              <mesh position={[0, 0.68, z]}>
                <cylinderGeometry args={[0.205, 0.205, 0.65, 32, 1, true]} />
                <EngineMaterial 
                  materialType="HONED_LINER" 
                  opacity={xrayEnabled ? 0.4 : 0.95} 
                  isCylinderFocused={isRightFocused}
                  {...state} 
                />
              </mesh>
              <mesh position={[0, 1.00, z]}>
                <cylinderGeometry args={[0.222, 0.222, 0.022, 32]} />
                <EngineMaterial materialType="MACHINED_BILLET" isCylinderFocused={isRightFocused} {...state} />
              </mesh>
              <mesh position={[0, 1.015, z]}>
                <cylinderGeometry args={[0.208, 0.204, 0.008, 32]} />
                <EngineMaterial materialType="CHROME" {...state} />
              </mesh>
            </group>
            </EntityRef>
          </React.Fragment>
        );
      })}

      {/* 7 Heavy-Duty Cross-Bolted Main Bearing Caps (Deep Skirt 6-Bolt Architecture) */}
      {[-1.45, -0.95, -0.45, 0.05, 0.55, 1.05, 1.45].map((z, i) => (
        <group key={'mbcap_' + i} position={[0, -0.16, z]}>
          {/* Main Bearing Cap Forging with Machined Arched Saddle */}
          <mesh>
            <boxGeometry args={[0.58, 0.38, 0.13]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Semicircular Bearing Journal Saddle */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.132, 0.132, 0.132, 28]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Tri-Metal Bronze/Aluminum Bearing Insert Shell */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.126, 0.126, 0.128, 28, 1, true]} />
            <EngineMaterial materialType="BEARING_BRONZE" {...state} />
          </mesh>
          {/* 4 Vertical ARP Main Studs with Hex Nuts */}
          <HexBolt position={[-0.21, -0.19, -0.035]} rotation={[Math.PI, 0, 0]} radius={0.018} height={0.016} state={state} />
          <HexBolt position={[-0.21, -0.19, 0.035]} rotation={[Math.PI, 0, 0]} radius={0.018} height={0.016} state={state} />
          <HexBolt position={[0.21, -0.19, -0.035]} rotation={[Math.PI, 0, 0]} radius={0.018} height={0.016} state={state} />
          <HexBolt position={[0.21, -0.19, 0.035]} rotation={[Math.PI, 0, 0]} radius={0.018} height={0.016} state={state} />
          {/* 2 Horizontal Cross-Bolts Clamping Deep Skirt Through Cap with Hex Heads */}
          <HexBolt position={[-0.30, -0.06, 0]} rotation={[0, 0, -Math.PI / 2]} radius={0.016} height={0.014} state={state} />
          <HexBolt position={[0.30, -0.06, 0]} rotation={[0, 0, Math.PI / 2]} radius={0.016} height={0.014} state={state} />
        </group>
      ))}

      {/* Casting Texture & Structural Ribbing: Longitudinal Oil Gallery Runner & Skirt Grid */}
      <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 2.96, 16]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      {/* Lower Left & Right Longitudinal Crankcase Stiffening Rib Rails */}
      <mesh position={[-0.55, -0.16, 0]}>
        <boxGeometry args={[0.04, 0.035, 2.96]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      <mesh position={[0.55, -0.16, 0]}>
        <boxGeometry args={[0.04, 0.035, 2.96]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      {/* Brass Core / Freeze Plugs along Block Flanks */}
      {[-1.1, -0.6, -0.1, 0.4, 0.9].map((z, i) => (
        <React.Fragment key={'fplug_' + i}>
          <mesh position={[-0.56, 0.12, z]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.012, 16]} />
            <EngineMaterial materialType="BRASS" {...state} />
          </mesh>
          <mesh position={[0.56, 0.12, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.032, 0.032, 0.012, 16]} />
            <EngineMaterial materialType="BRASS" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* External Triangular Stiffening Webs along outer crankcase skirts */}
      {[-1.0, -0.5, 0.0, 0.5, 1.0].map((z, i) => (
        <React.Fragment key={'rib_' + i}>
          {/* Left Skirt Web */}
          <mesh position={[-0.62, 0.32, z]} rotation={[0, 0, -BANK_ANGLE]}>
            <boxGeometry args={[0.06, 0.46, 0.06]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
          {/* Right Skirt Web */}
          <mesh position={[0.62, 0.32, z]} rotation={[0, 0, BANK_ANGLE]}>
            <boxGeometry args={[0.06, 0.46, 0.06]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
          {/* Valley Floor Structural Tie Bridge */}
          <mesh position={[0, 0.46, z]}>
            <boxGeometry args={[0.24, 0.05, 0.06]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Machined Engine Mounting Boss Brackets on Lower Skirts */}
      <group position={[-0.57, 0.04, 0.2]}>
        <mesh>
          <boxGeometry args={[0.11, 0.18, 0.36]} />
          <EngineMaterial materialType="MACHINED_BILLET" {...state} />
        </mesh>
        {/* 4-Bolt Mounting Pad Holes */}
        {[-0.10, 0.10].map((zOff, zi) => (
          <React.Fragment key={'mbp_l_' + zi}>
            <mesh position={[-0.05, 0.05, zOff]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[-0.05, -0.05, zOff]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      <group position={[0.57, 0.04, 0.2]}>
        <mesh>
          <boxGeometry args={[0.11, 0.18, 0.36]} />
          <EngineMaterial materialType="MACHINED_BILLET" {...state} />
        </mesh>
        {[-0.10, 0.10].map((zOff, zi) => (
          <React.Fragment key={'mbp_r_' + zi}>
            <mesh position={[0.05, 0.05, zOff]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0.05, -0.05, zOff]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* Rear Transmission Bellhousing Flange & Dowels (z = -1.50) */}
      <group position={[0, 0.22, -1.50]}>
        <mesh>
          <ringGeometry args={[0.44, 0.66, 32]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
        {/* Bellhousing Mounting Stud Circle */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
          const a = (idx * Math.PI) / 4;
          return (
            <mesh key={'bhb_' + idx} position={[Math.cos(a) * 0.57, Math.sin(a) * 0.57, -0.015]}>
              <cylinderGeometry args={[0.016, 0.016, 0.04, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          );
        })}
        {/* Starter Motor Recess Boss on Lower Flank */}
        <mesh position={[0.48, -0.28, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.24, 24]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
      </group>

      {/* Front Timing Chain Enclosure Flange Plate (z = +1.50) */}
      <mesh position={[0, 0.26, 1.50]}>
        <boxGeometry args={[1.08, 1.08, 0.045]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 2. CRANKSHAFT ASSEMBLY
// High-RPM 7-bearing forged 4340 steel crankshaft with 6 shared crankpins,
// pendulum-wedge dynamic counterweights with balance drillings,
// rear flywheel with starter ring gear, and front harmonic balancer.
// ----------------------------------------------------
export function CrankshaftAssembly(props: any) {
  return (
    <EntityRef id="v12.crankshaft" name="Forged Steel Crankshaft" type="assembly">
      <InternalCrankshaftAssembly {...props} />
    </EntityRef>
  );
}

function InternalCrankshaftAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1, crankAngleRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, crankAngleRef };
  const crankRef = useRef<THREE.Group>(null);
  const rpm = typeof v12Rpm === 'number' ? v12Rpm : 600;

  useFrame((sysState) => {
    if (crankRef.current) {
      const t = state.crankAngleRef
        ? state.crankAngleRef.current
        : (state.sysTimeRef?.current ?? (rpm > 0 ? sysState.clock.elapsedTime : 0)) * (rpm / 60) * Math.PI * 2 * v12Direction;
      crankRef.current.rotation.z = t;
    }
  });

  return (
    <group position={[0, 0, 0]} ref={crankRef}>
      {/* 7 Micro-Polished Main Bearing Journals with Chamfered Fillets */}
      {[-1.45, -0.95, -0.45, 0.05, 0.55, 1.05, 1.45].map((z, i) => (
        <group key={'mjournal_' + i} position={[0, 0, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.15, 32]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* 45° Drilled Oil Feed Hole on Journal Surface */}
          <mesh position={[0.118, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.02, 12]} />
            <EngineMaterial materialType="CAST_IRON" baseColor="#18181b" {...state} />
          </mesh>
        </group>
      ))}

      {/* 6 Crank Throws: Offset Shared Crankpins & Aerodynamic Dynamic Counterweights */}
      {CYLINDER_Z.map((z, i) => {
        const theta = CRANK_OFFSETS[i];
        const cpX = Math.sin(theta) * CRANK_RADIUS;
        const cpY = Math.cos(theta) * CRANK_RADIUS;

        return (
          <group key={'throw_' + i} position={[0, 0, z]}>
            {/* Front Aerodynamic Wedge Counterweight Web (opposite crankpin) */}
            <group position={[-cpX * 0.48, -cpY * 0.48, -0.09]} rotation={[0, 0, theta + Math.PI]}>
              <mesh>
                <boxGeometry args={[0.42, 0.28, 0.065]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {/* Knife-Edged Leading Bevel Chamfer */}
              <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.065, 16]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {/* Dynamic Balance Heavy-Metal Mallory Alloy Drilling Pockets */}
              {[-0.12, 0, 0.12].map((xOff, xi) => (
                <mesh key={'bal_f_' + xi} position={[xOff, -0.08, 0.033]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.015, 16]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
                </mesh>
              ))}
            </group>

            {/* Rear Aerodynamic Wedge Counterweight Web (opposite crankpin) */}
            <group position={[-cpX * 0.48, -cpY * 0.48, 0.09]} rotation={[0, 0, theta + Math.PI]}>
              <mesh>
                <boxGeometry args={[0.42, 0.28, 0.065]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.065, 16]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
              </mesh>
              {[-0.12, 0, 0.12].map((xOff, xi) => (
                <mesh key={'bal_r_' + xi} position={[xOff, -0.08, -0.033]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.024, 0.015, 16]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
                </mesh>
              ))}
            </group>

            {/* Micro-Polished Shared Crankpin (Houses Bank 1 and Bank 2 Rods side-by-side) */}
            <mesh position={[cpX, cpY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.17, 32]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Center Crankpin Oil Lubrication Feed Hole */}
            <mesh position={[cpX, cpY, 0]} rotation={[0, 0, theta]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
              <EngineMaterial materialType="CAST_IRON" baseColor="#18181b" {...state} />
            </mesh>

            {/* Contoured Forged Crank Cheeks Bridging Main Journal to Crankpin */}
            <mesh position={[cpX * 0.5, cpY * 0.5, -0.075]} rotation={[0, 0, theta]}>
              <boxGeometry args={[0.20, 0.20, 0.045]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[cpX * 0.5, cpY * 0.5, 0.075]} rotation={[0, 0, theta]}>
              <boxGeometry args={[0.20, 0.20, 0.045]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        );
      })}

      {/* Lightweight Billet Steel Flywheel & Clutch Assembly (Rear, z = -1.54) */}
      <group position={[0, 0, -1.54]}>
        {/* Flywheel Body with Recessed Center Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.075, 48]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Precision Starter Ring Gear with 64 Chamfered Teeth */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.438, 0.438, 0.028, 64]} />
          <EngineMaterial materialType="CAST_IRON" {...state} />
        </mesh>
        {/* Machined Clutch Friction Face Plate */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.038]}>
          <ringGeometry args={[0.18, 0.40, 36]} />
          <EngineMaterial materialType="MACHINED_BILLET" {...state} />
        </mesh>
        {/* 8 Grade 12.9 Flywheel-to-Crank Retaining Bolts */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((bIdx) => {
          const ba = (bIdx * Math.PI) / 4;
          return (
            <mesh key={'fwb_' + bIdx} position={[Math.cos(ba) * 0.12, Math.sin(ba) * 0.12, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.02, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          );
        })}
      </group>

      {/* Front Crankshaft Snout with Keyway (z = +1.50 to +1.68) */}
      <mesh position={[0, 0, 1.59]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.076, 0.076, 0.18, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

      {/* Dual-Mass Crankshaft Harmonic Balancer & Multi-Rib Serpentine Drive Pulley */}
      <group position={[0, 0, 1.66]}>
        {/* Inner Keyed Forged Steel Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.075, 32]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Tuned Elastomeric Damping Ring (Bonded Nitrile Vibration Isolator) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.086, 0.086, 0.068, 32]} />
          <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
        </mesh>
        {/* Outer Ductile Steel Inertia Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.116, 0.116, 0.062, 48]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Dual-Mass Crankshaft Harmonic Balancer & Multi-Rib Serpentine Drive Pulley */}
        <GroovedPulley 
          position={[0, 0, 0]} 
          rotation={[Math.PI / 2, 0, 0]} 
          radius={0.122} 
          width={0.052} 
          grooves={6} 
          state={state} 
        />
        {/* 360° Laser-Etched Timing Degree Marks with TDC White Indicator */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.022]}>
          <cylinderGeometry args={[0.124, 0.124, 0.014, 48]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 3. PISTON ASSEMBLY BANK (LEFT / BANK 1 & RIGHT / BANK 2)
// High-compression forged 4032 aluminum racing pistons with 4 CNC valve relief
// pockets, 3 precision ring lands, slipper skirts with MoS2 anti-friction coating,
// and DLC full-floating wrist pins reciprocating along the 60° bank bore axes.
// ----------------------------------------------------
export function PistonAssemblyBank(props: any) {
  const { bank } = props;
  const bankId = bank === 'left' ? 'bank_a' : 'bank_b';
  const bankName = bank === 'left' ? 'Bank A (Left) Pistons' : 'Bank B (Right) Pistons';
  return (
    <EntityRef id={`v12.${bankId}.pistons`} name={bankName} type="assembly">
       <InternalPistonAssemblyBank {...props} />
    </EntityRef>
  );
}

function InternalPistonAssemblyBank({
  bank,
  isHovered,
  isSelected,
  focusedCylinder,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1,
  crankAngleRef
}: any) {
  const state = { isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef, crankAngleRef };
  const isLeft = bank === 'left';
  const boreAngle = isLeft ? BANK_ANGLE : -BANK_ANGLE;
  const bankRef = useRef<THREE.Group>(null);
  const rpm = typeof v12Rpm === 'number' ? v12Rpm : 600;

  // Lathed high-compression slipper-skirt profile: crown, ring pack, thrust face
  const pistonPts = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0.02, -0.15)); // Inner skirt base
    pts.push(new THREE.Vector2(0.182, -0.15)); // Outer skirt base
    pts.push(new THREE.Vector2(0.188, -0.05)); // Slipper thrust face
    // 3 Distinct Ring Grooves (Top Compression, Scraper, 3-Piece Oil Control)
    pts.push(new THREE.Vector2(0.188, -0.015));
    pts.push(new THREE.Vector2(0.156, -0.015));
    pts.push(new THREE.Vector2(0.156, 0.005));
    pts.push(new THREE.Vector2(0.188, 0.005));
    pts.push(new THREE.Vector2(0.188, 0.022));
    pts.push(new THREE.Vector2(0.156, 0.022));
    pts.push(new THREE.Vector2(0.156, 0.042));
    pts.push(new THREE.Vector2(0.188, 0.042));
    pts.push(new THREE.Vector2(0.188, 0.058));
    pts.push(new THREE.Vector2(0.156, 0.058));
    pts.push(new THREE.Vector2(0.156, 0.078));
    pts.push(new THREE.Vector2(0.188, 0.078));
    pts.push(new THREE.Vector2(0.188, 0.095)); // Crown ring-land edge
    pts.push(new THREE.Vector2(0.02, 0.095));  // Crown combustion dome dish
    return pts;
  }, []);

  useFrame((sysState) => {
    if (!bankRef.current) return;
    const t = state.crankAngleRef
      ? state.crankAngleRef.current
      : (state.sysTimeRef?.current ?? (rpm > 0 ? sysState.clock.elapsedTime : 0)) * (rpm / 60) * Math.PI * 2 * v12Direction;

    bankRef.current.children.forEach((pistonGrp, i) => {
      const crankAngle = t + CRANK_OFFSETS[i];
      const stroke = getPistonStroke(crankAngle, bank);
      // Reciprocate strictly along the cylinder bore axis (local Y)
      pistonGrp.position.y = stroke;
    });
  });

  return (
    // Rotated to bank bore angle: Left Bank +30° (X < 0), Right Bank -30° (X > 0)
    <group position={[0, 0, 0]} rotation={[0, 0, boreAngle]}>
      <group ref={bankRef}>
        {CYLINDER_Z.map((z, i) => {
          const cylNum = isLeft ? (i + 1) : (i + 7);
          const isCylFocused = (focusedCylinder === cylNum);
          const cylState = { ...state, isCylinderFocused: isCylFocused };

          const cylPrefix = `v12.${bank === 'left' ? 'bank_a' : 'bank_b'}.cylinder${cylNum < 10 ? '0' : ''}${cylNum}`;
          return (
            <EntityRef id={`${cylPrefix}.piston`} name={`Cylinder ${cylNum} Piston`} type="part">
            <group 
              key={'piston_' + i} 
              position={[0, 0, z]}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum } }));
              }}
            >
              {/* Forged 4032 High-Silicon Aluminum Alloy Piston Body */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <latheGeometry args={[pistonPts, 32]} />
                <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...cylState} />
              </mesh>

              {/* Molybdenum Disulfide (MoS2) Dark Anti-Friction Skirt Thrust Face Coating */}
              <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.189, 0.189, 0.09, 24, 1, true]} />
                <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...cylState} />
              </mesh>

              {/* 3 Distinct Piston Rings with Material & Geometric Differentiation */}
              {/* Ring 1: Nitrided Chrome Top Compression Ring */}
              <mesh position={[0, 0.068, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.184, 0.007, 8, 32]} />
                <EngineMaterial materialType="CHROME" {...cylState} />
              </mesh>
              {/* Ring 2: Phosphate-Coated Taper Face Napier Scraper Ring */}
              <mesh position={[0, 0.032, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.183, 0.0075, 8, 32]} />
                <EngineMaterial materialType="CAST_IRON" baseColor="#1e293b" {...cylState} />
              </mesh>
              {/* Ring 3: 3-Piece Oil Control Ring with Steel Expander Rail */}
              <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.183, 0.008, 8, 32]} />
                <EngineMaterial materialType="FORGED_STEEL" baseColor="#64748b" {...cylState} />
              </mesh>

              {/* Cast Wrist Pin Bosses inside Piston Skirt with Bronze Bushing Sleeves */}
              <group position={[-0.105, -0.035, 0]}>
                <mesh>
                  <boxGeometry args={[0.075, 0.12, 0.09]} />
                  <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...cylState} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.044, 0.044, 0.078, 20]} />
                  <EngineMaterial materialType="BEARING_BRONZE" {...cylState} />
                </mesh>
              </group>
              <group position={[0.105, -0.035, 0]}>
                <mesh>
                  <boxGeometry args={[0.075, 0.12, 0.09]} />
                  <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...cylState} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.044, 0.044, 0.078, 20]} />
                  <EngineMaterial materialType="BEARING_BRONZE" {...cylState} />
                </mesh>
              </group>

              {/* Piston Crown: 4 Precision CNC Valve Relief Pockets with Machined Bevels */}
              {/* 2 Intake Valve Reliefs (+X side) with defined depth and bevels */}
              <group position={[0.072, 0.092, -0.06]} rotation={[0, 0, -0.18]}>
                <mesh>
                  <cylinderGeometry args={[0.046, 0.046, 0.016, 20]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...cylState} />
                </mesh>
                <mesh position={[0, 0.008, 0]}>
                  <torusGeometry args={[0.046, 0.0035, 6, 20]} />
                  <EngineMaterial materialType="CHROME" {...cylState} />
                </mesh>
              </group>
              <group position={[0.072, 0.092, 0.06]} rotation={[0, 0, -0.18]}>
                <mesh>
                  <cylinderGeometry args={[0.046, 0.046, 0.016, 20]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...cylState} />
                </mesh>
                <mesh position={[0, 0.008, 0]}>
                  <torusGeometry args={[0.046, 0.0035, 6, 20]} />
                  <EngineMaterial materialType="CHROME" {...cylState} />
                </mesh>
              </group>

              {/* 2 Exhaust Valve Reliefs (-X side) with defined depth and bevels */}
              <group position={[-0.072, 0.092, -0.06]} rotation={[0, 0, 0.18]}>
                <mesh>
                  <cylinderGeometry args={[0.042, 0.042, 0.016, 20]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...cylState} />
                </mesh>
                <mesh position={[0, 0.008, 0]}>
                  <torusGeometry args={[0.042, 0.0035, 6, 20]} />
                  <EngineMaterial materialType="CHROME" {...cylState} />
                </mesh>
              </group>
              <group position={[-0.072, 0.092, 0.06]} rotation={[0, 0, 0.18]}>
                <mesh>
                  <cylinderGeometry args={[0.042, 0.042, 0.016, 20]} />
                  <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...cylState} />
                </mesh>
                <mesh position={[0, 0.008, 0]}>
                  <torusGeometry args={[0.042, 0.0035, 6, 20]} />
                  <EngineMaterial materialType="CHROME" {...cylState} />
                </mesh>
              </group>

              {/* DLC-Coated Case-Hardened Full-Floating Steel Wrist Pin */}
              <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.035, 0]}>
                <cylinderGeometry args={[0.038, 0.038, 0.355, 24]} />
                <EngineMaterial materialType="FORGED_STEEL" baseColor="#cbd5e1" {...cylState} />
              </mesh>

              {/* Wrist Pin Spirolox Retaining Circlips at Pin Boss Ends */}
              <mesh position={[-0.178, -0.035, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.038, 0.004, 8, 20]} />
                <EngineMaterial materialType="CHROME" {...state} />
              </mesh>
              <mesh position={[0.178, -0.035, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.038, 0.004, 8, 20]} />
                <EngineMaterial materialType="CHROME" {...state} />
              </mesh>

              {/* Secondary Visual Highlight Cue when Cylinder is Focused */}
              {isCylFocused && (
                <group>
                  {/* Glowing Cyan Deck Locator Ring */}
                  <mesh position={[0, 0.102, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.198, 0.006, 8, 36]} />
                    <meshBasicMaterial color="#38bdf8" />
                  </mesh>
                  {/* Outer Rim Outline Aura */}
                  <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.202, 0.202, 0.25, 24, 1, true]} />
                    <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.45} />
                  </mesh>
                </group>
              )}
            </group>
            </EntityRef>
          );
        })}
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 4. CONNECTING RODS ASSEMBLY
// 12 Forged Ti-6Al-4V titanium H-beam connecting rods with bronze-bushed
// small ends, profiled flanged shanks, fractured big-end caps,
// and Grade 12.9 ARP 2000 rod bolts articulating dynamically with the crankshaft.
// ----------------------------------------------------
export function ConnectingRodsAssembly(props: any) {
  return (
    <EntityRef id="v12.connecting_rods" name="Connecting Rods Assembly" type="assembly">
      <InternalConnectingRodsAssembly {...props} />
    </EntityRef>
  );
}

function InternalConnectingRodsAssembly({
  isHovered,
  isSelected,
  focusedCylinder,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1,
  crankAngleRef
}: any) {
  const state = { isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef, crankAngleRef };
  const rodsRef = useRef<THREE.Group>(null);
  const rpm = typeof v12Rpm === 'number' ? v12Rpm : 600;

  useFrame((sysState) => {
    if (!rodsRef.current) return;
    const t = state.crankAngleRef
      ? state.crankAngleRef.current
      : (state.sysTimeRef?.current ?? (rpm > 0 ? sysState.clock.elapsedTime : 0)) * (rpm / 60) * Math.PI * 2 * v12Direction;

    CYLINDER_Z.forEach((z, i) => {
      const crankAngle = t + CRANK_OFFSETS[i];
      const cpX = Math.sin(crankAngle) * CRANK_RADIUS;
      const cpY = Math.cos(crankAngle) * CRANK_RADIUS;

      // Exact wrist pin coordinates in world XY for Left (-30°) and Right (+30°) banks
      const sLeft = getPistonStroke(crankAngle, 'left');
      const wpLeftX = -Math.sin(BANK_ANGLE) * sLeft;
      const wpLeftY = Math.cos(BANK_ANGLE) * sLeft;

      const sRight = getPistonStroke(crankAngle, 'right');
      const wpRightX = Math.sin(BANK_ANGLE) * sRight;
      const wpRightY = Math.cos(BANK_ANGLE) * sRight;

      const leftRod = rodsRef.current!.children[i * 2] as THREE.Group;
      const rightRod = rodsRef.current!.children[i * 2 + 1] as THREE.Group;

      if (leftRod) {
        // Shared crankpin with axial offset (front)
        leftRod.position.set(cpX, cpY, z - 0.038);
        leftRod.rotation.z = Math.atan2(wpLeftY - cpY, wpLeftX - cpX) - Math.PI / 2;
      }

      if (rightRod) {
        // Shared crankpin with axial offset (rear)
        rightRod.position.set(cpX, cpY, z + 0.038);
        rightRod.rotation.z = Math.atan2(wpRightY - cpY, wpRightX - cpX) - Math.PI / 2;
      }
    });
  });

  return (
    <group position={[0, 0, 0]} ref={rodsRef}>
      {CYLINDER_Z.map((z, i) => {
        const leftCylNum = i + 1;
        const rightCylNum = i + 7;
        const isLeftFocused = (focusedCylinder === leftCylNum);
        const isRightFocused = (focusedCylinder === rightCylNum);
        const leftState = { ...state, isCylinderFocused: isLeftFocused };
        const rightState = { ...state, isCylinderFocused: isRightFocused };

        const leftCylPrefix = `v12.bank_a.cylinder${leftCylNum < 10 ? '0' : ''}${leftCylNum}`;
        const rightCylPrefix = `v12.bank_b.cylinder${rightCylNum < 10 ? '0' : ''}${rightCylNum}`;
        return (
          <React.Fragment key={'rod_pair_' + i}>
            {/* Bank 1 (Left) Titanium H-Beam Rod */}
            <EntityRef id={`${leftCylPrefix}.connecting_rod`} name={`Cylinder ${leftCylNum} Connecting Rod`} type="part">
            <group
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum: leftCylNum } }));
              }}
            >
              {/* Unified H-Beam Rod Extrusion */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  const smallR = 0.060;
                  const L = ROD_LENGTH;
                  
                  // Big end outer (top half)
                  shape.absarc(0, 0, bigR, 0, Math.PI, false);
                  // Transition to shank left
                  shape.lineTo(-0.042, 0.15);
                  shape.lineTo(-0.028, L - 0.1);
                  // Small end outer
                  shape.absarc(0, L, smallR, Math.PI, 0, true);
                  // Transition to shank right
                  shape.lineTo(0.028, L - 0.1);
                  shape.lineTo(0.042, 0.15);
                  shape.lineTo(bigR, 0);

                  // Big end inner hole
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);

                  // Small end inner hole
                  const smallHole = new THREE.Path();
                  smallHole.absarc(0, L, 0.042, 0, Math.PI * 2, true);
                  shape.holes.push(smallHole);
                  
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...leftState} />
              </mesh>
              {/* Rod Cap (Bottom half of big end) */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  shape.absarc(0, 0, bigR, Math.PI, 0, false);
                  shape.lineTo(bigR, -0.02);
                  shape.lineTo(-bigR, -0.02);
                  shape.lineTo(-bigR, 0);
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...leftState} />
              </mesh>
              {/* H-Beam Recess (Front) */}
              <mesh position={[0, ROD_LENGTH * 0.5, 0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...leftState} />
              </mesh>
              {/* H-Beam Recess (Back) */}
              <mesh position={[0, ROD_LENGTH * 0.5, -0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...leftState} />
              </mesh>
              {/* Tri-Metal Rod Bearing Shell Visible Inside Bore */}
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...leftState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...leftState} />
              </mesh>
              {/* Two High-Strength ARP 2000 Hex Rod Cap Bolts */}
              <HexBolt position={[-0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={leftState} />
              <HexBolt position={[0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={leftState} />

              {/* Focused Rim-Light Outline for Left Rod */}
              {isLeftFocused && (
                <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
                  <boxGeometry args={[0.088, ROD_LENGTH * 0.88, 0.058]} />
                  <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.55} />
                </mesh>
              )}
            </group>
            </EntityRef>
            {/* Bank 2 (Right) Titanium H-Beam Rod */}
            <EntityRef id={`${rightCylPrefix}.connecting_rod`} name={`Cylinder ${rightCylNum} Connecting Rod`} type="part">
            <group
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum: rightCylNum } }));
              }}
            >
              {/* Unified H-Beam Rod Extrusion */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  const smallR = 0.060;
                  const L = ROD_LENGTH;
                  shape.absarc(0, 0, bigR, 0, Math.PI, false);
                  shape.lineTo(-0.042, 0.15);
                  shape.lineTo(-0.028, L - 0.1);
                  shape.absarc(0, L, smallR, Math.PI, 0, true);
                  shape.lineTo(0.028, L - 0.1);
                  shape.lineTo(0.042, 0.15);
                  shape.lineTo(bigR, 0);
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);
                  const smallHole = new THREE.Path();
                  smallHole.absarc(0, L, 0.042, 0, Math.PI * 2, true);
                  shape.holes.push(smallHole);
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...rightState} />
              </mesh>
              {/* Rod Cap (Bottom half of big end) */}
              <mesh position={[0, 0, -0.023]}>
                <extrudeGeometry args={[(() => {
                  const shape = new THREE.Shape();
                  const bigR = 0.118;
                  shape.absarc(0, 0, bigR, Math.PI, 0, false);
                  shape.lineTo(bigR, -0.02);
                  shape.lineTo(-bigR, -0.02);
                  shape.lineTo(-bigR, 0);
                  const bigHole = new THREE.Path();
                  bigHole.absarc(0, 0, 0.096, 0, Math.PI * 2, true);
                  shape.holes.push(bigHole);
                  return shape;
                })(), { depth: 0.046, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.004, bevelThickness: 0.004 }]} />
                <EngineMaterial materialType="TITANIUM" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH * 0.5, 0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH * 0.5, -0.023]}>
                <boxGeometry args={[0.035, ROD_LENGTH * 0.70, 0.012]} />
                <EngineMaterial materialType="TITANIUM" baseColor="#52525b" {...rightState} />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...rightState} />
              </mesh>
              <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
                <EngineMaterial materialType="BEARING_BRONZE" {...rightState} />
              </mesh>
              <HexBolt position={[-0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={rightState} />
              <HexBolt position={[0.082, -0.045, 0]} rotation={[Math.PI, 0, 0]} radius={0.014} height={0.016} state={rightState} />

              {/* Focused Rim-Light Outline for Right Rod */}
              {isRightFocused && (
                <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
                  <boxGeometry args={[0.088, ROD_LENGTH * 0.88, 0.058]} />
                  <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.55} />
                </mesh>
              )}
            </group>
            </EntityRef>
          </React.Fragment>
        );
      })}
    </group>
  );
}

// ----------------------------------------------------
// CANONICAL 6-CYLINDER BANK COMPONENT
// Encapsulates sculpted cylinder head casting, intake/exhaust ports,
// rotating DOHC camshafts with 24 lobes, 24 actively reciprocating titanium valves
// with dual coiled springs, front timing sprockets, and distinct racing wrinkle-red cover.
// ----------------------------------------------------
export function CanonicalCylinderBank({
  bank,
  isLeftBank,
  isHovered,
  isSelected,
  focusedCylinder,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1,
  crankAngleRef
}: any) {
  const state = { isHovered, isSelected, focusedCylinder, xrayEnabled, blueprintEnabled, sysTimeRef, crankAngleRef };
  const bankRotation = isLeftBank ? BANK_ANGLE : -BANK_ANGLE;
  const bankScale: [number, number, number] = isLeftBank ? [1, 1, 1] : [-1, 1, 1];
  const camsRef = useRef<THREE.Group>(null);
  const valvesRef = useRef<THREE.Group>(null);
  const rpm = typeof v12Rpm === 'number' ? v12Rpm : 600;

  useFrame((sysState) => {
    const t = state.crankAngleRef
      ? state.crankAngleRef.current * 0.5
      : (state.sysTimeRef?.current ?? (rpm > 0 ? sysState.clock.elapsedTime : 0)) * (rpm / 60) * Math.PI * v12Direction;

    // Camshafts rotate at half engine speed (4-stroke DOHC)
    if (camsRef.current) {
      camsRef.current.children.forEach((cam) => {
        cam.rotation.z = t;
      });
    }

    // Active rhythmic valve reciprocation synchronized with camshafts
    if (valvesRef.current) {
      valvesRef.current.children.forEach((cylGroup, i) => {
        const camPhase = t + (CRANK_OFFSETS[i] * 0.5);
        // Intake valves lift during intake stroke
        const inLift = Math.max(0, Math.sin(camPhase)) * 0.025;
        // Exhaust valves lift during exhaust stroke (offset by pi/2)
        const exLift = Math.max(0, Math.sin(camPhase + Math.PI * 0.75)) * 0.025;

        const inValves = cylGroup.children[0] as THREE.Group;
        const exValves = cylGroup.children[1] as THREE.Group;

        if (inValves) inValves.position.y = -inLift;
        if (exValves) exValves.position.y = -exLift;
      });
    }
  });

  return (
    // Bank orientation: Left bank at +30° (X < 0), Right bank at -30° (X > 0)
    // Local +X faces central intake valley, Local -X faces outward to exhaust
    <group rotation={[0, 0, bankRotation]} scale={bankScale}>
      {/* 1. Cylinder Head Casting (Machined A356-T6 Aluminum Monobloc) */}
      <group position={[0, 1.14, 0]}>
        {/* Main Sculpted Head Block Body */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -1.56]}>
          <extrudeGeometry args={[(() => {
            const shape = new THREE.Shape();
            shape.moveTo(-0.25, -0.17); // bottom inner (valley side)
            shape.lineTo(-0.20, -0.17);
            shape.lineTo(0.20, -0.17);
            shape.lineTo(0.25, -0.17);  // bottom outer (exhaust side)
            shape.lineTo(0.28, 0.0);    // up to exhaust port bulge
            shape.lineTo(0.22, 0.15);   // tapering up
            shape.lineTo(0.12, 0.28);   // outer cam housing
            shape.lineTo(0.0, 0.25);    // spark plug valley
            shape.lineTo(-0.12, 0.28);  // inner cam housing
            shape.lineTo(-0.28, 0.1);   // intake port flange
            shape.lineTo(-0.25, -0.17); // close
            return shape;
          })(), { depth: 3.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 }]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>

        {/* Lower Mating Deck Flange against Engine Block Deck */}
        <mesh position={[0, -0.17, 0]}>
          <boxGeometry args={[0.59, 0.038, 3.16]} />
          <EngineMaterial materialType="MACHINED_BILLET" {...state} />
        </mesh>

        {/* 6 Intake Ports on the Inner Face (Facing Central Valley, +X) */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'in_port_' + i} position={[0.275, 0.02, z]}>
            {/* Machined Circular Port Bellmouth */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.078, 0.078, 0.035, 20]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
            </mesh>
            {/* Port Bolting Collar with Dual Studs */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.012, 0, 0]}>
              <cylinderGeometry args={[0.098, 0.098, 0.022, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
            </mesh>
          </group>
        ))}

        {/* 6 Exhaust Ports on the Outer Face (Facing Outward, -X) */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'ex_port_' + i} position={[-0.275, -0.04, z]}>
            {/* Machined D-Shaped Exhaust Port Flange */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.082, 0.082, 0.035, 20]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#64748b" {...state} />
            </mesh>
            {/* High-Temp Inconel Exhaust Studs */}
            <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.075, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0, -0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.075, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
        ))}

        {/* 14 High-Strength ARP Head Studs with Chrome 12-Pt Nuts */}
        {[-1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.4].map((z, i) => (
          <React.Fragment key={'hstud_' + i}>
            <mesh position={[0.22, 0.17, z]}>
              <cylinderGeometry args={[0.018, 0.018, 0.065, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[-0.22, 0.17, z]}>
              <cylinderGeometry args={[0.018, 0.018, 0.065, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 2. DOHC Valvetrain: 2 Billet Camshafts, 14 Bearing Caps, 24 Active Titanium Valves */}
      <group position={[0, 1.34, 0]}>
        {/* Rotating Camshafts */}
        <group ref={camsRef}>
          {/* Intake Camshaft (+X side, running along valley flank) */}
          <group position={[0.14, 0.06, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 3.10, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* 12 Asymmetric Egg-Profile Intake Cam Lobes (2 per cylinder) */}
            {CYLINDER_Z.map((z, i) => (
              <React.Fragment key={'in_lobes_' + i}>
                <mesh position={[0, 0.022, z - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.042, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
                <mesh position={[0, 0.022, z + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.042, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
              </React.Fragment>
            ))}
          </group>

          {/* Exhaust Camshaft (-X side, running along outer flank) */}
          <group position={[-0.14, 0.06, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 3.10, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* 12 Asymmetric Egg-Profile Exhaust Cam Lobes (2 per cylinder) */}
            {CYLINDER_Z.map((z, i) => (
              <React.Fragment key={'ex_lobes_' + i}>
                <mesh position={[0, 0.022, z - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.042, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
                <mesh position={[0, 0.022, z + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.042, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
              </React.Fragment>
            ))}
          </group>
        </group>

        {/* 14 Billet Camshaft Bearing Caps with Chrome Fasteners */}
        {[-1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.4].map((z, i) => (
          <React.Fragment key={'cambear_' + i}>
            <mesh position={[0.14, 0.075, z]}>
              <boxGeometry args={[0.084, 0.065, 0.052]} />
              <EngineMaterial materialType="MACHINED_BILLET" {...state} />
            </mesh>
            <mesh position={[-0.14, 0.075, z]}>
              <boxGeometry args={[0.084, 0.065, 0.052]} />
              <EngineMaterial materialType="MACHINED_BILLET" {...state} />
            </mesh>
          </React.Fragment>
        ))}

        {/* 24 Titanium Valves & Dual Concentric Coiled Springs (Actively Reciprocating) */}
        <group ref={valvesRef}>
          {CYLINDER_Z.map((z, i) => {
            const cylNum = isLeftBank ? (i + 1) : (i + 7);
            const isCylFocused = (focusedCylinder === cylNum);
            const cylState = { ...state, isCylinderFocused: isCylFocused };

            return (
              <group 
                key={'valves_' + i} 
                position={[0, -0.10, z]}
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum } }));
                }}
              >
                {/* 2 Intake Valves (Angled toward +X at 18°) */}
                <group>
                  {[-0.06, 0.06].map((zOff, vi) => (
                    <group key={'inv_'+vi} position={[0.12, 0, zOff]} rotation={[0, 0, -0.18]}>
                      {/* Valve Stem */}
                      <mesh position={[0, 0.08, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.18, 12]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Head Flare */}
                      <mesh position={[0, -0.04, 0]}>
                        <cylinderGeometry args={[0.008, 0.042, 0.06, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Face/Margin */}
                      <mesh position={[0, -0.07, 0]}>
                        <cylinderGeometry args={[0.042, 0.042, 0.005, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                    </group>
                  ))}
                  {/* Valve Springs & Titanium Retainers */}
                  <mesh position={[0.12, 0.05, -0.06]} rotation={[0, 0, -0.18]}>
                    <cylinderGeometry args={[0.026, 0.026, 0.09, 12]} />
                    <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...cylState} />
                  </mesh>
                  <mesh position={[0.12, 0.05, 0.06]} rotation={[0, 0, -0.18]}>
                    <cylinderGeometry args={[0.026, 0.026, 0.09, 12]} />
                    <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...cylState} />
                  </mesh>
                </group>

                {/* 2 Exhaust Valves (Angled toward -X at 18°) */}
                <group>
                  {[-0.06, 0.06].map((zOff, vi) => (
                    <group key={'exv_'+vi} position={[-0.12, 0, zOff]} rotation={[0, 0, 0.18]}>
                      {/* Valve Stem */}
                      <mesh position={[0, 0.08, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.18, 12]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Head Flare */}
                      <mesh position={[0, -0.04, 0]}>
                        <cylinderGeometry args={[0.008, 0.036, 0.06, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                      {/* Valve Face/Margin */}
                      <mesh position={[0, -0.07, 0]}>
                        <cylinderGeometry args={[0.036, 0.036, 0.005, 16]} />
                        <EngineMaterial materialType="TITANIUM" {...cylState} />
                      </mesh>
                    </group>
                  ))}
                  <mesh position={[-0.12, 0.05, -0.06]} rotation={[0, 0, 0.18]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.09, 12]} />
                    <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...cylState} />
                  </mesh>
                  <mesh position={[-0.12, 0.05, 0.06]} rotation={[0, 0, 0.18]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.09, 12]} />
                    <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...cylState} />
                  </mesh>
                </group>

                {/* Visual Highlight Ring if Cylinder is Focused */}
                {isCylFocused && (
                  <mesh position={[0, 0.14, 0]}>
                    <ringGeometry args={[0.11, 0.13, 24]} />
                    <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
                  </mesh>
                )}
              </group>
            );
          })}
        </group>

        {/* Front Camshaft Timing Sprockets with Dual Roller Chain */}
        <group position={[0, 0.06, 1.55]}>
          <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.092, 0.092, 0.032, 24]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          <mesh position={[-0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.092, 0.092, 0.032, 24]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Dual-Row Timing Chain Span */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.018, 0.028]} />
            <EngineMaterial materialType="FORGED_STEEL" baseColor="#334155" {...state} />
          </mesh>
        </group>
      </group>

      {/* 3. Distinct Racing Wrinkle Red Valve Cover */}
      <group position={[0, 1.46, 0]}>
        {/* Main Valve Cover Shell */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.51, 0.14, 3.12]} />
          <EngineMaterial materialType="WRINKLE_RED" {...state} />
        </mesh>

        {/* Perimeter Sealing Flange with Grade 10.9 Chrome Fasteners */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.55, 0.025, 3.16]} />
          <EngineMaterial materialType="WRINKLE_RED" {...state} />
        </mesh>

        {/* Perimeter Flange Hex Bolts along Inboard and Outboard edges */}
        {[-0.24, 0.24].map((xPos, xIdx) => (
          <React.Fragment key={'vc_flange_side_' + xIdx}>
            {[-1.48, -1.0, -0.5, 0.0, 0.5, 1.0, 1.48].map((zPos, zIdx) => (
              <HexBolt 
                key={'vcbolt_' + xIdx + '_' + zIdx} 
                position={[xPos, 0.005, zPos]} 
                radius={0.012} 
                height={0.014} 
                state={state} 
              />
            ))}
          </React.Fragment>
        ))}

        {/* Longitudinal Cooling & Stiffening Ribs */}
        {[-0.20, -0.12, 0.12, 0.20].map((x, i) => (
          <mesh key={'vcrib_' + i} position={[x, 0.125, 0]}>
            <boxGeometry args={[0.022, 0.02, 3.02]} />
            <EngineMaterial materialType="WRINKLE_RED" {...state} />
          </mesh>
        ))}

        {/* Recessed Central Spark Plug / Ignition Coil Well Channel */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.115, 0.04, 3.02]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>

        {/* Longitudinal Ignition Wiring Harness Cable along Center Channel */}
        <mesh position={[0, 0.112, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 2.96, 12]} />
          <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
        </mesh>

        {/* 6 High-Fidelity Coil-on-Plug Ignition Modules & Spark Plugs */}
        {CYLINDER_Z.map((z, i) => {
          const cylNum = isLeftBank ? (i + 1) : (i + 7);
          const isCylFocused = (focusedCylinder === cylNum);
          const cylState = { ...state, isCylinderFocused: isCylFocused };

          return (
            <group 
              key={'spwell_' + i} 
              position={[0, 0.09, z]}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('advis-select-cylinder', { detail: { cylNum } }));
              }}
            >
              {/* Spark Plug Base: Steel Shell with 6-sided Hex Socket Nut */}
              <mesh position={[0, -0.06, 0]}>
                <cylinderGeometry args={[0.024, 0.024, 0.04, 6]} />
                <EngineMaterial materialType="FORGED_STEEL" baseColor="#94a3b8" {...cylState} />
              </mesh>
              {/* Ribbed White Alumina Ceramic Insulator */}
              <mesh position={[0, -0.02, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.045, 16]} />
                <EngineMaterial materialType="CERAMIC" baseColor="#ffffff" {...cylState} />
              </mesh>
              {/* Ceramic Concentric Flashover Ribs */}
              {[-0.03, -0.02, -0.01].map((ribY, rIdx) => (
                <mesh key={'cer_rib_' + rIdx} position={[0, ribY, 0]}>
                  <torusGeometry args={[0.0165, 0.002, 6, 16]} />
                  <EngineMaterial materialType="CERAMIC" baseColor="#ffffff" {...cylState} />
                </mesh>
              ))}

              {/* CNC Machined Flush Well Socket Ring in Valve Cover */}
              <mesh>
                <cylinderGeometry args={[0.038, 0.038, 0.026, 20]} />
                <EngineMaterial materialType="CHROME" {...cylState} />
              </mesh>

              {/* Flush-Seated Direct Pencil Ignition Coil Module with Rubber Sealing Boot */}
              <mesh position={[0, 0.016, 0]}>
                <cylinderGeometry args={[0.030, 0.030, 0.016, 20]} />
                <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...cylState} />
              </mesh>
              {/* Coil Mounting Tab with Grade 12.9 Fastener */}
              <mesh position={[0.032, 0.016, 0]}>
                <boxGeometry args={[0.024, 0.012, 0.024]} />
                <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...cylState} />
              </mesh>
              <HexBolt position={[0.036, 0.024, 0]} radius={0.007} height={0.010} state={cylState} />

              {/* Branch Wiring Connector to Central Harness */}
              <mesh position={[0, 0.025, 0]}>
                <boxGeometry args={[0.014, 0.012, 0.022]} />
                <EngineMaterial materialType="PLASTIC" baseColor="#27272a" {...cylState} />
              </mesh>

              {/* Glowing Aura Highlight when Cylinder is Focused */}
              {isCylFocused && (
                <mesh position={[0, 0.038, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.048, 0.004, 8, 28]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
              )}
            </group>
          );
        })}

        {/* Flush Machined Billet Aluminum Oil Filler Cap (Left Bank only) */}
        {isLeftBank && (
          <group position={[0.14, 0.125, 1.15]}>
            <mesh>
              <cylinderGeometry args={[0.048, 0.048, 0.02, 24]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
            </mesh>
            <mesh position={[0, 0.012, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.008, 24]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 5. DOHC VALVETRAIN & TWO DISTINCT VALVE COVERS ASSEMBLY
// Encapsulates Bank A and Bank B assemblies separated by central intake valley.
// ----------------------------------------------------
export function ValvetrainAssembly(props: any) {
  return (
    <EntityRef id="v12.valvetrain" name="DOHC Valvetrain Assembly" type="assembly">
      <InternalValvetrainAssembly {...props} />
    </EntityRef>
  );
}

function InternalValvetrainAssembly(props: any) {
  return (
    <group position={[0, 0, 0]}>
      {/* Bank A (Left Bank): tilted at -30°, distinct cylinder head and wrinkle red cover */}
      <CanonicalCylinderBank bank="left" isLeftBank={true} {...props} />

      {/* Bank B (Right Bank): tilted at +30°, distinct cylinder head and wrinkle red cover */}
      <CanonicalCylinderBank bank="right" isLeftBank={false} {...props} />
    </group>
  );
}

// ----------------------------------------------------
// 6. INTAKE PLENUM & DUAL THROTTLE BODIES
// Located in the central valley between the two cylinder banks.
// Elevated volumetric dual plenum chambers, forward induction with dual 85mm throttle bodies,
// 12 continuous 3D curved CatmullRom ram-horn runners, and high-pressure fuel injection rails.
// ----------------------------------------------------
export function IntakePlenum(props: any) {
  return (
    <EntityRef id="v12.intake_plenum" name="Carbon Fiber Intake Plenum" type="assembly">
      <InternalIntakePlenum {...props} />
    </EntityRef>
  );
}

function InternalIntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  // 12 Continuous, Seamless 3D Curved Ram-Horn Intake Runners (6 to Bank A on Left, 6 to Bank B on Right)
  const { leftRunners, rightRunners } = useMemo(() => {
    const left = CYLINDER_Z.map((z) => {
      // Originates proudly at Left Plenum Barrel, arches up and sweeps down into Left Head Intake Port
      const p0 = new THREE.Vector3(-0.11, 1.34, z);
      const p1 = new THREE.Vector3(-0.21, 1.45, z);
      const p2 = new THREE.Vector3(-0.31, 1.31, z);
      const p3 = new THREE.Vector3(-0.36, 1.14, z);
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      return new THREE.TubeGeometry(curve, 24, 0.046, 16, false);
    });

    const right = CYLINDER_Z.map((z) => {
      // Originates proudly at Right Plenum Barrel, arches up and sweeps down into Right Head Intake Port
      const p0 = new THREE.Vector3(0.11, 1.34, z);
      const p1 = new THREE.Vector3(0.21, 1.45, z);
      const p2 = new THREE.Vector3(0.31, 1.31, z);
      const p3 = new THREE.Vector3(0.36, 1.14, z);
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      return new THREE.TubeGeometry(curve, 24, 0.046, 16, false);
    });

    return { leftRunners: left, rightRunners: right };
  }, []);

  return (
    // Centered strictly within the central valley between the two cylinder heads
    <group position={[0, 0, 0]}>
      {/* 1. Structural Lower Manifold Riser Base Seated in Valley Floor */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.34, 0.22, 2.82]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
      </mesh>

      {/* 2. Elevated Volumetric Dual Plenum Chambers (Y = 1.34 for prominent high-rise visibility) */}
      {/* Left Plenum Barrel (Bank A feed) */}
      <mesh position={[-0.13, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.108, 0.108, 2.78, 28]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
      </mesh>

      {/* Right Plenum Barrel (Bank B feed) */}
      <mesh position={[0.13, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.108, 0.108, 2.78, 28]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
      </mesh>

      {/* Central Equalization Bridge & Plenum Cross-Volume Body */}
      <mesh position={[0, 1.34, 0]}>
        <boxGeometry args={[0.26, 0.16, 2.76]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
      </mesh>

      {/* Laser-Engraved Billet Aluminum Top Spine Badge: "A.D.V.I.S. • 6.5L V12" */}
      <mesh position={[0, 1.43, 0]}>
        <boxGeometry args={[0.18, 0.02, 2.42]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#f8fafc" {...state} />
      </mesh>

      {/* Rear Plenum Billet End Plate & Vacuum Manifold Block */}
      <group position={[0, 1.34, -1.41]}>
        <mesh>
          <boxGeometry args={[0.42, 0.22, 0.045]} />
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
        </mesh>
        {/* MAP & Air Temp Sensor Boss */}
        <mesh position={[0, 0.06, -0.026]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>
      </group>

      {/* 3. Dual Electronic Drive-By-Wire Throttle Bodies at Front Induction Neck (z = 1.42) */}
      {/* Left Throttle Body (Bank A feed) */}
      <group position={[-0.13, 1.34, 1.42]}>
        {/* CNC Machined Throttle Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.14, 32]} />
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
        </mesh>
        {/* Forward Flared Bellmouth Velocity Stack Air Horn */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.110, 0.092, 0.05, 32]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        {/* Internal Brass Butterfly Throttle Plate */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.17, 12]} />
          <EngineMaterial materialType="BRASS" {...state} />
        </mesh>
        {/* Outer Drive-by-Wire Servo Actuator Housing */}
        <mesh position={[-0.10, 0, 0]}>
          <boxGeometry args={[0.046, 0.082, 0.082]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>
      </group>

      {/* Right Throttle Body (Bank B feed) */}
      <group position={[0.13, 1.34, 1.42]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 0.14, 32]} />
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
        </mesh>
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.110, 0.092, 0.05, 32]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.17, 12]} />
          <EngineMaterial materialType="BRASS" {...state} />
        </mesh>
        <mesh position={[0.10, 0, 0]}>
          <boxGeometry args={[0.046, 0.082, 0.082]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>
      </group>

      {/* Synchronized Throttle Actuator Linkage Tie-Rod */}
      <mesh position={[0, 1.40, 1.40]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.22, 12]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

      {/* 4. 12 Continuous 3D Curved Ram Intake Runners (6 to Bank A on Left, 6 to Bank B on Right) */}
      {/* Left Bank 1 Runners */}
            {/* Fuel Rails & Injectors */}
      <mesh position={[-0.25, 1.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.7, 16]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#ef4444" {...state} />
      </mesh>
      {CYLINDER_Z.map((z, i) => (
         <group key={'inj_l_'+i} position={[-0.29, 1.20, z]} rotation={[0, 0, Math.PI/6]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.008, 0.08, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#fbbf24" {...state} />
            </mesh>
         </group>
      ))}
      {leftRunners.map((geo, i) => (
        <mesh key={'in_runner_l_' + i} geometry={geo}>
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
        </mesh>
      ))}

      {/* Right Bank 2 Runners */}
            {/* Right Fuel Rail */}
      <mesh position={[0.25, 1.25, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.7, 16]} />
        <EngineMaterial materialType="MACHINED_BILLET" baseColor="#ef4444" {...state} />
      </mesh>
      {CYLINDER_Z.map((z, i) => (
         <group key={'inj_r_'+i} position={[0.29, 1.20, z]} rotation={[0, 0, -Math.PI/6]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.008, 0.08, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.04, 8]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#fbbf24" {...state} />
            </mesh>
         </group>
      ))}
      {rightRunners.map((geo, i) => (
        <mesh key={'in_runner_r_' + i} geometry={geo}>
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
        </mesh>
      ))}

      {/* Flanges, Couplers, and Hardware for All 12 Runners */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'in_hardware_' + i}>
          {/* Bank A (Left) Hardware */}
          <group position={[-0.36, 1.14, z]}>
            {/* CNC Aluminum Port Flange bolted flush against the cylinder head deck */}
            <mesh rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.064, 0.064, 0.026, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
            </mesh>
            {/* Flange Mounting Studs */}
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.032, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, 0, -0.04]} rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.032, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
          {/* Left Runner Silicone Coupler Sleeve & Clamp midway along arch */}
          <mesh position={[-0.22, 1.41, z]} rotation={[0, 0, -0.55]}>
            <cylinderGeometry args={[0.052, 0.052, 0.044, 16]} />
            <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
          </mesh>
          <mesh position={[-0.22, 1.41, z]} rotation={[0, 0, -0.55]}>
            <torusGeometry args={[0.054, 0.0035, 8, 20]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>

          {/* Bank B (Right) Hardware */}
          <group position={[0.36, 1.14, z]}>
            <mesh rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.064, 0.064, 0.026, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.032, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, 0, -0.04]} rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.032, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
          {/* Right Runner Silicone Coupler Sleeve & Clamp midway along arch */}
          <mesh position={[0.22, 1.41, z]} rotation={[0, 0, 0.55]}>
            <cylinderGeometry args={[0.052, 0.052, 0.044, 16]} />
            <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
          </mesh>
          <mesh position={[0.22, 1.41, z]} rotation={[0, 0, 0.55]}>
            <torusGeometry args={[0.054, 0.0035, 8, 20]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 5. Dual Extruded Billet Aluminum Fuel Injection Rails & 12 Sequential Injectors */}
      {/* Left Bank Fuel Rail (Bank A) */}
      <group position={[-0.30, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.017, 0.017, 2.92, 16]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>
      {/* Right Bank Fuel Rail (Bank B) */}
      <group position={[0.30, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.017, 0.017, 2.92, 16]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>

      {/* Rear AN-8 Braided Stainless Fuel Crossover Line with Anodized Fittings */}
      <mesh position={[0, 1.24, -1.41]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.60, 12]} />
        <EngineMaterial materialType="CHROME" {...state} />
      </mesh>

      {/* 12 High-Pressure Sequential Fuel Injectors Seated in Rail Cups */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'injectors_' + i}>
          {/* Left Bank Injector */}
          <group position={[-0.31, 1.20, z]} rotation={[0, 0, -0.52]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.075, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#27272a" {...state} />
            </mesh>
            <mesh position={[0, 0.032, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
          {/* Right Bank Injector */}
          <group position={[0.31, 1.20, z]} rotation={[0, 0, 0.52]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.075, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#27272a" {...state} />
            </mesh>
            <mesh position={[0, 0.032, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 7. CANONICAL EXHAUST HEADER (BANK A & BANK B)
// Equal-length mandrel-bent 6-into-1 tuned headers.
// Rendered symmetrically on both outer flanks using analytical coordinate transformation.
// Authentic brushed stainless steel / Inconel (realistic metallic depth, NO GOLD/TAN).
// ----------------------------------------------------
export function CanonicalExhaustHeader({
  isLeftBank,
  state
}: {
  isLeftBank: boolean;
  state: any;
}) {
  // sideSign: -1 for Left Bank (outer left flank at X < 0), +1 for Right Bank (outer right flank at X > 0)
  const sideSign = isLeftBank ? -1 : 1;

  // Head exhaust port surface position
  const portX = sideSign * 0.785;
  const portY = 0.818;

  // Collector convergence position on lower outer flank
  const collectorX = sideSign * 0.96;
  const collectorY = 0.16;
  const collectorZ = -0.60;

  // 6 Continuous, Seamless Equal-Length Mandrel-Bent Tuned Primary Exhaust Tubes
  const headerTubes = useMemo(() => {
    return CYLINDER_Z.map((z, i) => {
      const zDelta = collectorZ - z;
      const angle = (i * Math.PI) / 3;
      const entryX = collectorX - sideSign * (0.015 + Math.cos(angle) * 0.025);
      const entryY = collectorY + 0.14 + Math.sin(angle) * 0.035;
      const entryZ = collectorZ + 0.22 + (i - 2.5) * 0.015;

      const p0 = new THREE.Vector3(portX, portY, z);
      const p1 = new THREE.Vector3(portX + sideSign * 0.08, portY - 0.05, z);
      const p2 = new THREE.Vector3(sideSign * 0.94, 0.52, z + zDelta * 0.38);
      const p3 = new THREE.Vector3(sideSign * 0.96, 0.30, z + zDelta * 0.78);
      const p4 = new THREE.Vector3(entryX, entryY, entryZ);

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
      return new THREE.TubeGeometry(curve, 28, 0.042, 16, false);
    });
  }, [sideSign, portX, portY, collectorX, collectorY, collectorZ]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Continuous CNC Laser-Cut 1/2-inch Stainless Steel Exhaust Port Flange Plate */}
      <mesh position={[portX, portY, 0]} rotation={[0, 0, sideSign * -BANK_ANGLE]}>
        <boxGeometry args={[0.024, 0.22, 2.94]} />
        <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#64748b" {...state} />
      </mesh>

      {/* Exhaust Port Studs & Copper Locknuts along Flange */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'studs_' + i}>
          <mesh position={[portX + sideSign * 0.016, portY + 0.08, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.026, 8]} />
            <EngineMaterial materialType="COPPER" {...state} />
          </mesh>
          <mesh position={[portX + sideSign * 0.016, portY - 0.08, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.026, 8]} />
            <EngineMaterial materialType="COPPER" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 2. 6 Continuous Seamless Mandrel-Bent Tuned Primary Exhaust Tubes */}
      {headerTubes.map((geo, i) => (
        <mesh key={'exh_tube_' + i} geometry={geo}>
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#cbd5e1" {...state} />
        </mesh>
      ))}

      {/* 3. Hydroformed 6-into-1 Merge Collector Cone & 3.5-inch Exhaust Downpipe */}
      <group position={[collectorX, collectorY, collectorZ]}>
        {/* Merge Collector Convergence Cone */}
        <mesh position={[0, 0, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.132, 0.092, 0.38, 24]} />
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#94a3b8" {...state} />
        </mesh>

        {/* TIG Weld Ring at collector junction with straw-amber heat-affected tint */}
        <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.122, 0.005, 8, 24]} />
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#b45309" {...state} />
        </mesh>

        {/* Main 3.5-inch Tuned Exhaust Collector Downpipe running rearward to z = -1.55 */}
        <mesh position={[0, 0, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.092, 1.05, 24]} />
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#cbd5e1" {...state} />
        </mesh>

        {/* Heated O2 (Lambda) Oxygen Sensor Boss & Probe */}
        <group position={[sideSign * 0.06, 0.06, -0.32]} rotation={[0, 0, sideSign * (Math.PI / 3)]}>
          <mesh>
            <cylinderGeometry args={[0.016, 0.016, 0.02, 12]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.011, 0.011, 0.04, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </group>

        {/* CNC Machined Stainless V-Band Flange & Heavy-Duty Quick-Release Clamp at Rear Outlet */}
        <mesh position={[0, 0, -0.96]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.108, 0.108, 0.04, 24]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        <mesh position={[0, 0, -0.96]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.112, 0.008, 8, 24]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      </group>
    </group>
  );
}

export function ExhaustManifold(props: any) {
  return (
    <EntityRef id="v12.exhaust_manifold" name="Inconel Exhaust Manifolds" type="assembly">
      <InternalExhaustManifold {...props} />
    </EntityRef>
  );
}

function InternalExhaustManifold({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, 0, 0]}>
      {/* Left Bank 1 Exhaust Header System (Bank A on Left Flank) */}
      <CanonicalExhaustHeader isLeftBank={true} state={state} />
      {/* Right Bank 2 Exhaust Header System (Bank B on Right Flank, Bilaterally Symmetrical) */}
      <CanonicalExhaustHeader isLeftBank={false} state={state} />
    </group>
  );
}

// ----------------------------------------------------
// 8. COOLING SYSTEM & ACCESSORY SERPENTINE DRIVE
// Centrifugal water pump housing integrated into front cover,
// 9-blade viscous fan, high-output compact alternator, automatic belt tensioner,
// and continuous multi-rib serpentine drive belt loop.
// ----------------------------------------------------
export function CoolingSystem(props: any) {
  return (
    <EntityRef id="v12.cooling_system" name="Cooling & Water Pump System" type="assembly">
      <InternalCoolingSystem {...props} />
    </EntityRef>
  );
}

function InternalCoolingSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, crankAngleRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, crankAngleRef };
  const fanRef = useRef<THREE.Group>(null);
  const rpm = typeof v12Rpm === 'number' ? v12Rpm : 600;

  useFrame((sysState) => {
    if (fanRef.current) {
      fanRef.current.rotation.z = state.crankAngleRef
        ? state.crankAngleRef.current * 1.2
        : (state.sysTimeRef?.current ?? (rpm > 0 ? sysState.clock.elapsedTime : 0)) * (rpm / 60) * Math.PI * 2 * 1.2;
    }
  });

  // Continuous Multi-Rib Serpentine Accessory Drive Belt loop spanning all 4 pulleys
  const beltGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.115, 0.04),   // under crank damper pulley
      new THREE.Vector3(-0.48, 0.08, 0.04), // around alternator lower rim
      new THREE.Vector3(-0.45, 0.17, 0.04), // around alternator upper rim
      new THREE.Vector3(0, 0.48, 0.04),     // over water pump pulley
      new THREE.Vector3(0.48, 0.22, 0.04),  // over tensioner pulley
      new THREE.Vector3(0.40, 0.12, 0.04),  // returning towards crank
    ], true);
    return new THREE.TubeGeometry(curve, 36, 0.016, 12, true);
  }, []);

  return (
    // Mounted directly to the front face of the engine block
    <group position={[0, 0, 1.54]}>
      {/* 1. High-Flow Centrifugal Water Pump Housing above Crank Pulley */}
      <mesh position={[0, 0.36, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.12, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* Water Pump Drive Pulley with Multi-Rib Grooves */}
      <GroovedPulley 
        position={[0, 0.36, 0.04]} 
        rotation={[Math.PI / 2, 0, 0]} 
        radius={0.122} 
        width={0.052} 
        grooves={6} 
        state={state} 
      />

      {/* Aerodynamic 9-Blade Viscous Engine Cooling Fan */}
      <group position={[0, 0.36, 0.14]} ref={fanRef}>
        {/* Center Viscous Silicone Clutch Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.076, 0.076, 0.052, 24]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
        </mesh>
        {/* 9 Curved Aerodynamic Fan Blades */}
        {[...Array(9)].map((_, i) => (
          <mesh key={'blade_' + i} rotation={[0, 0, (i * Math.PI * 2) / 9]} position={[0, 0.22, 0]}>
            <boxGeometry args={[0.072, 0.32, 0.015]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
          </mesh>
        ))}
      </group>

      {/* 2. Compact High-Output Alternator on Left Accessory Bracket */}
      <group position={[-0.45, 0.12, 0]}>
        {/* Cylindrical Vented Stator Housing with Cooling Slots */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.132, 0.132, 0.18, 24]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
        </mesh>
        {/* Copper Windings Visible Inside Slots */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.122, 0.122, 0.16, 24]} />
          <EngineMaterial materialType="COPPER" {...state} />
        </mesh>
        {/* Alternator Multi-Groove Drive Pulley */}
        <GroovedPulley 
          position={[0, 0, 0.04]} 
          rotation={[Math.PI / 2, 0, 0]} 
          radius={0.068} 
          width={0.052} 
          grooves={5} 
          state={state} 
        />
      </group>

      {/* 3. Automatic Belt Tensioner & Idler Pulley on Right */}
      <group position={[0.42, 0.18, 0.04]}>
        <GroovedPulley 
          position={[0, 0, 0]} 
          rotation={[Math.PI / 2, 0, 0]} 
          radius={0.068} 
          width={0.052} 
          grooves={5} 
          state={state} 
        />
        {/* Tensioner Sprung Arm */}
        <mesh position={[-0.04, -0.06, -0.03]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.04, 0.12, 0.03]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
      </group>

      {/* 4. Continuous Multi-Rib Serpentine Accessory Drive Belt */}
      <mesh geometry={beltGeometry}>
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* 5. Cast Aluminum Water Neck & Thermostat Housing */}
      <group position={[-0.14, 0.44, 0.02]}>
        <mesh rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.056, 0.062, 0.14, 20]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
        <mesh position={[-0.04, 0.05, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.068, 0.068, 0.022, 20]} />
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#cbd5e1" {...state} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 9. LUBRICATION SYSTEM & DRY-SUMP FINNED OIL PAN
// Bolted directly to bottom crankcase pan rail from y = -0.40 to -0.68.
// Includes longitudinal and transverse cooling fins, spin-on high-pressure filter,
// magnetic brass drain plug, and multi-stage scavenge return bungs.
// ----------------------------------------------------
export function LubricationSystem(props: any) {
  return (
    <EntityRef id="v12.lubrication_system" name="Dry Sump Lubrication" type="assembly">
      <InternalLubricationSystem {...props} />
    </EntityRef>
  );
}

function InternalLubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, -0.40, 0]}>
      {/* Heavy-Duty Cast Aluminum Dry-Sump Oil Pan */}
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.94, 0.28, 2.96]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
      </mesh>

      {/* Pan Perimeter Mounting Flange with Grade 8.8 Hex Fasteners */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[0.98, 0.032, 3.04]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
      </mesh>

      {/* Perimeter Flange Hex Bolts along Pan Rails */}
      {[-0.46, 0.46].map((xPos, xIdx) => (
        <React.Fragment key={'pan_bolt_side_' + xIdx}>
          {[-1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.4].map((zPos, zIdx) => (
            <HexBolt 
              key={'panbolt_' + xIdx + '_' + zIdx} 
              position={[xPos, 0.005, zPos]} 
              radius={0.012} 
              height={0.012} 
              state={state} 
            />
          ))}
        </React.Fragment>
      ))}

      {/* Longitudinal External Heatsink Cooling Fins along Floor */}
      {[-0.36, -0.22, -0.08, 0.08, 0.22, 0.36].map((x, i) => (
        <mesh key={'panfin_' + i} position={[x, -0.30, 0]}>
          <boxGeometry args={[0.022, 0.055, 2.86]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
        </mesh>
      ))}

      {/* Spin-On High-Pressure Oil Filter with Hexagonal Removal Nut */}
      <group position={[-0.48, -0.10, 0.75]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.112, 0.112, 0.22, 24]} />
          <EngineMaterial materialType="CAST_IRON" baseColor="#0f172a" {...state} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.03, 6]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>

      {/* Magnetic Brass Oil Drain Plug with Safety Wire Hole */}
      <mesh position={[0.26, -0.28, -1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.05, 12]} />
        <EngineMaterial materialType="BRASS" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 10. ENGINE ELECTRONICS & HARNESS
// Braided wiring harness looms, dual Bosch Motorsport ECU module bolted
// to rear bellhousing bulkhead, and crankshaft/camshaft sensor pickups.
// ----------------------------------------------------
export function ElectronicsSensors(props: any) {
  return (
    <EntityRef id="v12.electronics" name="Engine Management & Sensors" type="assembly">
      <InternalElectronicsSensors {...props} />
    </EntityRef>
  );
}

function InternalElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, 0, 0]}>
      {/* High-Temp Raychem Braided Wiring Harness Looms along Valley Floor */}
      <mesh position={[-0.26, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.92, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>
      <mesh position={[0.26, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 2.92, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* Cross-Engine Wiring Junction Harness at Rear */}
      <mesh position={[0, 1.05, -1.41]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.54, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* Bosch Motorsport Dual Automotive ECU Module bolted firmly to Rear Bellhousing Bulkhead */}
      <group position={[0, 0.58, -1.51]}>
        <mesh>
          <boxGeometry args={[0.44, 0.23, 0.082]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
        </mesh>
        {/* Heat-Dissipating Heatsink Fins on ECU Casing */}
        {[-0.14, -0.07, 0, 0.07, 0.14].map((x, i) => (
          <mesh key={'ecufin_' + i} position={[x, 0, -0.046]}>
            <boxGeometry args={[0.015, 0.19, 0.02]} />
            <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
          </mesh>
        ))}
        {/* Dual High-Density 80-Pin Automotive Connectors */}
        <mesh position={[-0.10, -0.08, 0.042]}>
          <boxGeometry args={[0.12, 0.05, 0.03]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#0f172a" {...state} />
        </mesh>
        <mesh position={[0.10, -0.08, 0.042]}>
          <boxGeometry args={[0.12, 0.05, 0.03]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#0f172a" {...state} />
        </mesh>
      </group>
    </group>
  );
}
