// src/generators/MechanicalGenerator.tsx
// A.D.V.I.S. High-Precision Procedural V12 Internal Combustion Engine Engineering Assembly & Real-Time Kinematics

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ----------------------------------------------------
// PBR ENGINEERING MATERIAL SYSTEM
// ----------------------------------------------------
export interface HolographicMaterialProps {
  baseColor?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  opacity?: number;
  materialType?: 
    | 'CAST_ALUMINUM' 
    | 'MACHINED_BILLET'
    | 'FORGED_STEEL' 
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
        emissive={isSelected ? "#0284c7" : (isHovered ? "#38bdf8" : "#000000")}
        emissiveIntensity={isSelected ? 0.7 : (isHovered ? 0.35 : 0)}
      />
    );
  }

  let r = 0.5, m = 0.5, c = baseColor || '#94a3b8';
  let cc = 0.0, cr = 0.0;

  switch (materialType) {
    case 'CAST_ALUMINUM': 
      // Semi-rough cast alloy grain with subtle directional specular
      r = 0.56; m = 0.68; c = baseColor || '#94a3b8'; 
      break;
    case 'MACHINED_BILLET':
      // CNC machined high-sheen billet aluminum
      r = 0.22; m = 0.88; c = baseColor || '#e2e8f0'; cc = 0.5; cr = 0.08;
      break;
    case 'FORGED_STEEL': 
      // High-strength 4340 chromoly forged and quenched steel
      r = 0.24; m = 0.94; c = baseColor || '#94a3b8'; cc = 0.45; cr = 0.10; 
      break;
    case 'CAST_IRON': 
      // Ductile nodular cast iron with graphite matrix
      r = 0.78; m = 0.62; c = baseColor || '#334155'; 
      break;
    case 'TITANIUM': 
      // Ti-6Al-4V brushed aerospace titanium
      r = 0.30; m = 0.92; c = baseColor || '#a1a1aa'; cc = 0.25; cr = 0.12;
      break;
    case 'EXHAUST_STEEL': 
      // Authentic heat-cycled 321 stainless steel / Inconel with subtle straw-bronze metallic depth
      r = 0.28; m = 0.92; c = baseColor || '#94a3b8'; cc = 0.35; cr = 0.14; 
      break;
    case 'WRINKLE_RED': 
      // Iconic Italian racing wrinkle red powder-coat with matte micro-texture
      r = 0.58; m = 0.20; c = baseColor || '#b91c1c'; cc = 0.20; cr = 0.30; 
      break;
    case 'CARBON_FIBER': 
      // High-gloss twill weave pre-preg autoclaved carbon composite
      r = 0.36; m = 0.32; c = baseColor || '#18181b'; cc = 0.92; cr = 0.05; 
      break;
    case 'CHROME': 
      // Mirror-polished mirror chrome / electroplated Grade 12.9 hardware
      r = 0.05; m = 0.98; c = baseColor || '#f8fafc'; cc = 0.98; cr = 0.02; 
      break;
    case 'RUBBER': 
      // EPDM synthetic vulcanized rubber
      r = 0.90; m = 0.04; c = baseColor || '#18181b'; 
      break;
    case 'PLASTIC': 
      // Glass-reinforced nylon PA66 heat-resistant composite
      r = 0.42; m = 0.12; c = baseColor || '#27272a'; 
      break;
    case 'COPPER': 
      // Thermal copper gaskets & locknuts
      r = 0.32; m = 0.88; c = baseColor || '#b45309'; 
      break;
    case 'BRASS': 
      // Machined naval brass fittings & throttle plates
      r = 0.26; m = 0.92; c = baseColor || '#ca8a04'; 
      break;
    case 'BEARING_BRONZE':
      // SAE 660 leaded bronze wrist-pin & crankshaft bearing inserts
      r = 0.35; m = 0.82; c = baseColor || '#d97706';
      break;
    case 'CERAMIC':
      // Alumina oxide white insulator ceramic
      r = 0.18; m = 0.05; c = baseColor || '#ffffff'; cc = 0.85; cr = 0.05;
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
      emissive={isSelected ? "#0284c7" : (isHovered ? "#0ea5e9" : "#000000")}
      emissiveIntensity={isSelected ? 0.6 : (isHovered ? 0.25 : 0)}
      wireframe={isSelected}
      envMapIntensity={1.1}
    />
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
export function EngineBlockAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  // True 60-degree V12 block profile with open central valley & deep skirt
  const blockShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Start at bottom left pan rail
    shape.moveTo(-0.48, -0.40);
    // Pan rail bottom flange
    shape.lineTo(0.48, -0.40);
    // Lower right crankcase skirt with cross-bolt bulge
    shape.lineTo(0.53, -0.22);
    // Right crankcase bulge around counterweight swings
    shape.lineTo(0.58, -0.04);
    // Outer wall of Right Bank sloping upward along +30°
    shape.lineTo(0.74, 0.86);
    // Right Bank cylinder head deck surface (perpendicular to +30° bore axis)
    shape.lineTo(0.28, 1.08);
    // Inner wall of Right Bank descending into the central valley
    shape.lineTo(0.09, 0.44);
    // Floor of the Central Lifter/Intake Valley
    shape.lineTo(-0.09, 0.44);
    // Inner wall of Left Bank rising out of the central valley
    shape.lineTo(-0.28, 1.08);
    // Left Bank cylinder head deck surface (perpendicular to -30° bore axis)
    shape.lineTo(-0.74, 0.86);
    // Outer wall of Left Bank sloping downward along -30°
    shape.lineTo(-0.58, -0.04);
    // Lower left crankcase skirt
    shape.lineTo(-0.53, -0.22);
    // Return to start
    shape.lineTo(-0.48, -0.40);
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 3.02,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.035,
    bevelThickness: 0.035
  }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Main Structural Cast Aluminum Monobloc (from z = -1.51 to z = +1.51) */}
      <mesh position={[0, 0, -1.51]}>
        <extrudeGeometry args={[blockShape, extrudeSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* 12 Centrifugally-Cast Ductile Iron Cylinder Liners (6 Left Bank, 6 Right Bank) */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'sleeves_' + i}>
          {/* Left Bank Cylinder Liner (tilted +30° -> bore axis pointing up-left) */}
          <group rotation={[0, 0, BANK_ANGLE]}>
            {/* Ductile Iron Cylinder Wall with Precision Honed Inner Bore */}
            <mesh position={[0, 0.68, z]}>
              <cylinderGeometry args={[0.205, 0.205, 0.65, 32, 1, true]} />
              <EngineMaterial materialType="CAST_IRON" opacity={xrayEnabled ? 0.4 : 0.95} {...state} />
            </mesh>
            {/* Stepped Upper Fire-Ring Counterbore Flange (Seats flush into Block Deck) */}
            <mesh position={[0, 1.00, z]}>
              <cylinderGeometry args={[0.222, 0.222, 0.022, 32]} />
              <EngineMaterial materialType="MACHINED_BILLET" {...state} />
            </mesh>
            {/* Top Chamfer Lip for Piston Ring Guide */}
            <mesh position={[0, 1.015, z]}>
              <cylinderGeometry args={[0.208, 0.204, 0.008, 32]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>

          {/* Right Bank Cylinder Liner (tilted -30° -> bore axis pointing up-right) */}
          <group rotation={[0, 0, -BANK_ANGLE]}>
            <mesh position={[0, 0.68, z]}>
              <cylinderGeometry args={[0.205, 0.205, 0.65, 32, 1, true]} />
              <EngineMaterial materialType="CAST_IRON" opacity={xrayEnabled ? 0.4 : 0.95} {...state} />
            </mesh>
            <mesh position={[0, 1.00, z]}>
              <cylinderGeometry args={[0.222, 0.222, 0.022, 32]} />
              <EngineMaterial materialType="MACHINED_BILLET" {...state} />
            </mesh>
            <mesh position={[0, 1.015, z]}>
              <cylinderGeometry args={[0.208, 0.204, 0.008, 32]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}

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
          {/* 4 Vertical ARP Main Studs (2 Left, 2 Right) with Chrome 12-Pt Flange Nuts */}
          <mesh position={[-0.21, -0.10, -0.035]}>
            <cylinderGeometry args={[0.016, 0.016, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          <mesh position={[-0.21, -0.10, 0.035]}>
            <cylinderGeometry args={[0.016, 0.016, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          <mesh position={[0.21, -0.10, -0.035]}>
            <cylinderGeometry args={[0.016, 0.016, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          <mesh position={[0.21, -0.10, 0.035]}>
            <cylinderGeometry args={[0.016, 0.016, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          {/* 2 Horizontal Cross-Bolts Clamping Deep Skirt Through Cap */}
          <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.64, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </group>
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
export function CrankshaftAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const crankRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (crankRef.current) {
      const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;
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
        {/* 6-Rib Micro-V Serpentine Belt Grooves Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.006]}>
          <cylinderGeometry args={[0.122, 0.122, 0.048, 48]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#475569" {...state} />
        </mesh>
        {/* 360° Laser-Etched Timing Degree Marks with TDC White Indicator */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.022]}>
          <cylinderGeometry args={[0.124, 0.124, 0.014, 48]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        {/* Center Grade 12.9 Crank Retaining Bolt & Hardened Belleville Washer */}
        <mesh position={[0, 0, 0.042]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.030, 0.030, 0.026, 16]} />
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
export function PistonAssemblyBank({
  bank,
  isHovered,
  isSelected,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1
}: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const isLeft = bank === 'left';
  const boreAngle = isLeft ? BANK_ANGLE : -BANK_ANGLE;
  const bankRef = useRef<THREE.Group>(null);

  // Lathed high-compression slipper-skirt profile: crown, ring pack, thrust face
  const pistonPts = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0.02, -0.15)); // Inner skirt base
    pts.push(new THREE.Vector2(0.182, -0.15)); // Outer skirt base
    pts.push(new THREE.Vector2(0.188, -0.05)); // Slipper thrust face
    // 3 Ring Grooves (Top Nitrided Compression, Napier Scraper, 3-Piece Oil Control)
    pts.push(new THREE.Vector2(0.188, -0.015));
    pts.push(new THREE.Vector2(0.160, -0.015));
    pts.push(new THREE.Vector2(0.160, 0.005));
    pts.push(new THREE.Vector2(0.188, 0.005));
    pts.push(new THREE.Vector2(0.188, 0.025));
    pts.push(new THREE.Vector2(0.160, 0.025));
    pts.push(new THREE.Vector2(0.160, 0.045));
    pts.push(new THREE.Vector2(0.188, 0.045));
    pts.push(new THREE.Vector2(0.188, 0.095)); // Crown ring-land edge
    pts.push(new THREE.Vector2(0.02, 0.095));  // Crown combustion dome dish
    return pts;
  }, []);

  useFrame((sysState) => {
    if (!bankRef.current) return;
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;

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
        {CYLINDER_Z.map((z, i) => (
          <group key={'piston_' + i} position={[0, 0, z]}>
            {/* Forged 4032 High-Silicon Aluminum Alloy Piston Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <latheGeometry args={[pistonPts, 32]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
            </mesh>

            {/* Molybdenum Disulfide (MoS2) Dark Anti-Friction Skirt Thrust Face Coating */}
            <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.189, 0.189, 0.09, 24, 1, true]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>

            {/* 3 Dark PVD Surface-Treated Piston Rings in Grooves */}
            {[-0.005, 0.015, 0.035].map((yRing, rIdx) => (
              <mesh key={'ring_' + rIdx} position={[0, yRing, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.182, 0.008, 8, 32]} />
                <EngineMaterial materialType="CAST_IRON" baseColor="#0f172a" {...state} />
              </mesh>
            ))}

            {/* Piston Crown: 4 Precision CNC Valve Relief Pockets (2 Intake, 2 Exhaust) */}
            {/* 2 Intake Valve Reliefs (+X side) */}
            <mesh position={[0.072, 0.092, -0.06]} rotation={[0, 0, -0.18]}>
              <cylinderGeometry args={[0.046, 0.046, 0.015, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...state} />
            </mesh>
            <mesh position={[0.072, 0.092, 0.06]} rotation={[0, 0, -0.18]}>
              <cylinderGeometry args={[0.046, 0.046, 0.015, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...state} />
            </mesh>
            {/* 2 Exhaust Valve Reliefs (-X side) */}
            <mesh position={[-0.072, 0.092, -0.06]} rotation={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.042, 0.042, 0.015, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...state} />
            </mesh>
            <mesh position={[-0.072, 0.092, 0.06]} rotation={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.042, 0.042, 0.015, 16]} />
              <EngineMaterial materialType="MACHINED_BILLET" baseColor="#94a3b8" {...state} />
            </mesh>

            {/* DLC-Coated Case-Hardened Full-Floating Steel Wrist Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.035, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.355, 24]} />
              <EngineMaterial materialType="FORGED_STEEL" baseColor="#cbd5e1" {...state} />
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
          </group>
        ))}
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
export function ConnectingRodsAssembly({
  isHovered,
  isSelected,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1
}: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const rodsRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (!rodsRef.current) return;
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;

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
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'rod_pair_' + i}>
          {/* Bank 1 (Left) Titanium H-Beam Rod */}
          <group>
            {/* Split Big-End Journal Cap Housing */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.118, 0.118, 0.068, 28]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            {/* Tri-Metal Rod Bearing Shell Visible Inside Bore */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
              <EngineMaterial materialType="BEARING_BRONZE" {...state} />
            </mesh>
            {/* Two High-Strength ARP 2000 12-Pt Rod Cap Bolts */}
            <mesh position={[-0.082, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.082, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0.082, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.082, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>

            {/* Profiled H-Beam Shank (I-beam outer flange ribs & recessed central web) */}
            {/* Outer Flange Rib Left */}
            <mesh position={[-0.034, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.016, ROD_LENGTH * 0.82, 0.046]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            {/* Outer Flange Rib Right */}
            <mesh position={[0.034, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.016, ROD_LENGTH * 0.82, 0.046]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            {/* Recessed Center Web */}
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.052, ROD_LENGTH * 0.80, 0.016]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>

            {/* Small-End Wrist Pin Eyelet with Bronze Bushing */}
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.060, 0.068, 24]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
              <EngineMaterial materialType="BEARING_BRONZE" {...state} />
            </mesh>
            {/* Forced Pin Oiling Squirt Hole at Top of Eyelet */}
            <mesh position={[0, ROD_LENGTH + 0.055, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
              <EngineMaterial materialType="CAST_IRON" baseColor="#18181b" {...state} />
            </mesh>
          </group>

          {/* Bank 2 (Right) Titanium H-Beam Rod */}
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.118, 0.118, 0.068, 28]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.096, 0.096, 0.066, 24, 1, true]} />
              <EngineMaterial materialType="BEARING_BRONZE" {...state} />
            </mesh>
            <mesh position={[-0.082, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.082, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0.082, 0, 0]}>
              <cylinderGeometry args={[0.013, 0.013, 0.082, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>

            <mesh position={[-0.034, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.016, ROD_LENGTH * 0.82, 0.046]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0.034, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.016, ROD_LENGTH * 0.82, 0.046]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.052, ROD_LENGTH * 0.80, 0.016]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>

            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.060, 0.068, 24]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.070, 20, 1, true]} />
              <EngineMaterial materialType="BEARING_BRONZE" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH + 0.055, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
              <EngineMaterial materialType="CAST_IRON" baseColor="#18181b" {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}
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
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1
}: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const bankRotation = isLeftBank ? BANK_ANGLE : -BANK_ANGLE;
  const bankScale: [number, number, number] = isLeftBank ? [1, 1, 1] : [-1, 1, 1];
  const camsRef = useRef<THREE.Group>(null);
  const valvesRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * v12Direction;

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
        <mesh>
          <boxGeometry args={[0.55, 0.35, 3.12]} />
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
          {CYLINDER_Z.map((z, i) => (
            <group key={'valves_' + i} position={[0, -0.10, z]}>
              {/* 2 Intake Valves (Angled toward +X at 18°) */}
              <group>
                <mesh position={[0.12, 0, -0.06]} rotation={[0, 0, -0.18]}>
                  <cylinderGeometry args={[0.016, 0.040, 0.23, 16]} />
                  <EngineMaterial materialType="TITANIUM" {...state} />
                </mesh>
                <mesh position={[0.12, 0, 0.06]} rotation={[0, 0, -0.18]}>
                  <cylinderGeometry args={[0.016, 0.040, 0.23, 16]} />
                  <EngineMaterial materialType="TITANIUM" {...state} />
                </mesh>
                {/* Valve Springs & Titanium Retainers */}
                <mesh position={[0.12, 0.05, -0.06]} rotation={[0, 0, -0.18]}>
                  <cylinderGeometry args={[0.026, 0.026, 0.09, 12]} />
                  <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...state} />
                </mesh>
                <mesh position={[0.12, 0.05, 0.06]} rotation={[0, 0, -0.18]}>
                  <cylinderGeometry args={[0.026, 0.026, 0.09, 12]} />
                  <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...state} />
                </mesh>
              </group>

              {/* 2 Exhaust Valves (Angled toward -X at 18°) */}
              <group>
                <mesh position={[-0.12, 0, -0.06]} rotation={[0, 0, 0.18]}>
                  <cylinderGeometry args={[0.016, 0.036, 0.23, 16]} />
                  <EngineMaterial materialType="TITANIUM" {...state} />
                </mesh>
                <mesh position={[-0.12, 0, 0.06]} rotation={[0, 0, 0.18]}>
                  <cylinderGeometry args={[0.016, 0.036, 0.23, 16]} />
                  <EngineMaterial materialType="TITANIUM" {...state} />
                </mesh>
                <mesh position={[-0.12, 0.05, -0.06]} rotation={[0, 0, 0.18]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.09, 12]} />
                  <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...state} />
                </mesh>
                <mesh position={[-0.12, 0.05, 0.06]} rotation={[0, 0, 0.18]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.09, 12]} />
                  <EngineMaterial materialType="FORGED_STEEL" baseColor="#475569" {...state} />
                </mesh>
              </group>
            </group>
          ))}
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

        {/* Perimeter Sealing Flange with Chrome Fasteners */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.55, 0.025, 3.16]} />
          <EngineMaterial materialType="WRINKLE_RED" {...state} />
        </mesh>

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

        {/* 6 Flush Coil-on-Plug Ignition Modules */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'spwell_' + i} position={[0, 0.09, z]}>
            {/* CNC Machined Flush Well Socket Ring */}
            <mesh>
              <cylinderGeometry args={[0.038, 0.038, 0.026, 20]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            {/* Flush-Seated Direct Ignition Coil Module */}
            <mesh position={[0, 0.014, 0]}>
              <cylinderGeometry args={[0.030, 0.030, 0.012, 20]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            {/* Concentric Fastener Collar */}
            <mesh position={[0, 0.020, 0]}>
              <cylinderGeometry args={[0.009, 0.009, 0.006, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        ))}

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
export function IntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
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
      {leftRunners.map((geo, i) => (
        <mesh key={'in_runner_l_' + i} geometry={geo}>
          <EngineMaterial materialType="MACHINED_BILLET" baseColor="#e2e8f0" {...state} />
        </mesh>
      ))}

      {/* Right Bank 2 Runners */}
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

export function ExhaustManifold({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
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
export function CoolingSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const fanRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (fanRef.current) {
      fanRef.current.rotation.z = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * 18;
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

      {/* Water Pump Drive Pulley */}
      <mesh position={[0, 0.36, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.122, 0.122, 0.052, 24]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

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
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.052, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      </group>

      {/* 3. Automatic Belt Tensioner & Idler Pulley on Right */}
      <group position={[0.42, 0.18, 0.04]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.068, 0.068, 0.052, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
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
export function LubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, -0.40, 0]}>
      {/* Heavy-Duty Cast Aluminum Dry-Sump Oil Pan */}
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.94, 0.28, 2.96]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
      </mesh>

      {/* Pan Perimeter Mounting Flange with Fasteners */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[0.98, 0.032, 3.04]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
      </mesh>

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
export function ElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
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
