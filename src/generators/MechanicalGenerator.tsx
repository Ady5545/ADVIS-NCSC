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
    | 'CHROME';
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
        opacity={0.16}
        roughness={0.15}
        metalness={0.88}
        transmission={0.92}
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
      r = 0.52; m = 0.72; c = baseColor || '#cbd5e1'; 
      break;
    case 'FORGED_STEEL': 
      r = 0.22; m = 0.94; c = baseColor || '#94a3b8'; cc = 0.4; cr = 0.1; 
      break;
    case 'CAST_IRON': 
      r = 0.82; m = 0.58; c = baseColor || '#334155'; 
      break;
    case 'TITANIUM': 
      r = 0.32; m = 0.90; c = baseColor || '#a1a1aa'; 
      break;
    case 'EXHAUST_STEEL': 
      // Authentic heat-treated 321 stainless steel / Inconel (realistic metallic, NO GOLD/TAN)
      r = 0.25; m = 0.94; c = baseColor || '#94a3b8'; cc = 0.35; cr = 0.12; 
      break;
    case 'WRINKLE_RED': 
      // Authentic Italian racing wrinkle red powder-coated valve covers
      r = 0.55; m = 0.22; c = baseColor || '#b91c1c'; cc = 0.15; cr = 0.35; 
      break;
    case 'CARBON_FIBER': 
      r = 0.42; m = 0.35; c = baseColor || '#18181b'; cc = 0.85; cr = 0.08; 
      break;
    case 'CHROME': 
      r = 0.06; m = 0.98; c = baseColor || '#f8fafc'; cc = 0.95; cr = 0.04; 
      break;
    case 'RUBBER': 
      r = 0.92; m = 0.05; c = baseColor || '#18181b'; 
      break;
    case 'PLASTIC': 
      r = 0.45; m = 0.10; c = baseColor || '#27272a'; 
      break;
    case 'COPPER': 
      r = 0.30; m = 0.90; c = baseColor || '#b45309'; 
      break;
    case 'BRASS': 
      r = 0.28; m = 0.92; c = baseColor || '#ca8a04'; 
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
      envMapIntensity={1.4}
    />
  );
}

// ----------------------------------------------------
// V12 MECHANICAL ARCHITECTURE CONSTANTS
// ----------------------------------------------------
// Longitudinal coordinates along Z axis: 6 cylinder stations spaced at 0.5m pitch
export const CYLINDER_Z = [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25];
export const CRANK_RADIUS = 0.22; // Crank throw radius R
export const ROD_LENGTH = 0.70;   // Connecting rod center-to-center length L
export const BANK_ANGLE = Math.PI / 6; // 30 degrees from vertical (60° included V angle)

// Standard 60° V12 120-degree throw distribution for perfect primary/secondary balance:
// Mirrored cylinder pairs (1-6, 2-5, 3-4)
export const CRANK_OFFSETS = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));

// Exact closed-form slider-crank displacement along bore axis
export function getPistonStroke(crankAngle: number, bank: 'left' | 'right'): number {
  // Left bank bore axis tilts toward negative X in world coordinates
  // Right bank bore axis tilts toward positive X in world coordinates
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
// CANONICAL 6-CYLINDER BANK COMPONENT
// Encapsulates cylinder sleeves, cylinder head casting,
// DOHC camshafts, valves, springs, and distinct valve cover.
// Transformed & mirrored to guarantee exact bilateral symmetry.
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
  // Bank orientation: Left bank tilts toward negative X (+30° in Three.js Z-rotation)
  // Right bank tilts toward positive X (-30° in Three.js Z-rotation)
  const bankRotation = isLeftBank ? BANK_ANGLE : -BANK_ANGLE;
  // Bilateral symmetry: Left bank is standard [1, 1, 1], Right bank is mirrored across local X [-1, 1, 1]
  const bankScale: [number, number, number] = isLeftBank ? [1, 1, 1] : [-1, 1, 1];
  const camsRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (camsRef.current) {
      // Camshafts rotate at exactly half crank speed (4-stroke cycle)
      const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * v12Direction;
      camsRef.current.children.forEach((cam) => {
        cam.rotation.z = t;
      });
    }
  });

  return (
    // Bank orientation: Left bank at +30° (X < 0), Right bank at -30° (X > 0)
    // Local X: +X faces the central valley, -X faces outward to exhaust
    <group rotation={[0, 0, bankRotation]} scale={bankScale}>
      {/* 1. Cylinder Head Casting (Machined Aluminum) */}
      <group position={[0, 1.14, 0]}>
        {/* Main Head Casting Block */}
        <mesh>
          <boxGeometry args={[0.54, 0.34, 3.12]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>

        {/* Lower Deck Flange mating to engine block */}
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[0.58, 0.04, 3.16]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>

        {/* 6 Intake Ports on the Inner Face (facing central valley, +X) */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'in_port_' + i} position={[0.27, 0.02, z]}>
            {/* Machined circular intake port entry */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.075, 0.075, 0.03, 20]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#94a3b8" {...state} />
            </mesh>
            {/* Port bolting collar */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.01, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.02, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
            </mesh>
          </group>
        ))}

        {/* 6 Exhaust Ports on the Outer Face (facing outward, -X) */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'ex_port_' + i} position={[-0.27, -0.04, z]}>
            {/* Machined oval exhaust port flange */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.03, 20]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
            </mesh>
            {/* Two high-temp stainless studs */}
            <mesh position={[0, 0.065, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0, -0.065, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
        ))}

        {/* Head Bolt Bosses with Chrome Studs along length */}
        {[-1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.4].map((z, i) => (
          <React.Fragment key={'hstud_' + i}>
            <mesh position={[0.22, 0.16, z]}>
              <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[-0.22, 0.16, z]}>
              <cylinderGeometry args={[0.018, 0.018, 0.06, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 2. DOHC Valvetrain: 2 Camshafts, 7 Bearing Caps, 24 Valves & Dual Springs */}
      <group position={[0, 1.34, 0]}>
        {/* Rotating Camshafts */}
        <group ref={camsRef}>
          {/* Intake Camshaft (+X side, running along valley) */}
          <group position={[0.14, 0.06, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 3.08, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* 12 Intake Cam Lobes (2 per cylinder) */}
            {CYLINDER_Z.map((z, i) => (
              <React.Fragment key={'in_lobes_' + i}>
                <mesh position={[0, 0.018, z - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
                <mesh position={[0, 0.018, z + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
              </React.Fragment>
            ))}
          </group>

          {/* Exhaust Camshaft (-X side, running along outer flank) */}
          <group position={[-0.14, 0.06, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 3.08, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* 12 Exhaust Cam Lobes (2 per cylinder) */}
            {CYLINDER_Z.map((z, i) => (
              <React.Fragment key={'ex_lobes_' + i}>
                <mesh position={[0, 0.018, z - 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
                <mesh position={[0, 0.018, z + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
                  <EngineMaterial materialType="FORGED_STEEL" {...state} />
                </mesh>
              </React.Fragment>
            ))}
          </group>
        </group>

        {/* 7 Cam Bearing Caps per camshaft */}
        {[-1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.4].map((z, i) => (
          <React.Fragment key={'cambear_' + i}>
            <mesh position={[0.14, 0.07, z]}>
              <boxGeometry args={[0.08, 0.06, 0.05]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[-0.14, 0.07, z]}>
              <boxGeometry args={[0.08, 0.06, 0.05]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </React.Fragment>
        ))}

        {/* 24 Titanium Valves & Dual Valve Springs (4 per cylinder) */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'valves_' + i} position={[0, -0.10, z]}>
            {/* 2 Intake Valves (angled toward +X) */}
            <mesh position={[0.12, 0, -0.06]} rotation={[0, 0, -0.18]}>
              <cylinderGeometry args={[0.015, 0.038, 0.22, 16]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[0.12, 0, 0.06]} rotation={[0, 0, -0.18]}>
              <cylinderGeometry args={[0.015, 0.038, 0.22, 16]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            {/* 2 Exhaust Valves (angled toward -X) */}
            <mesh position={[-0.12, 0, -0.06]} rotation={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.015, 0.034, 0.22, 16]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
            <mesh position={[-0.12, 0, 0.06]} rotation={[0, 0, 0.18]}>
              <cylinderGeometry args={[0.015, 0.034, 0.22, 16]} />
              <EngineMaterial materialType="TITANIUM" {...state} />
            </mesh>
          </group>
        ))}

        {/* Front Camshaft Timing Sprockets */}
        <group position={[0, 0.06, 1.54]}>
          <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.03, 24]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          <mesh position={[-0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.03, 24]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
        </group>
      </group>

      {/* 3. Distinct Racing Wrinkle Red Valve Cover */}
      {/* Sits directly on top of this bank's cylinder head, angled along this bank's axis */}
      <group position={[0, 1.46, 0]}>
        {/* Main Valve Cover Shell */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.50, 0.14, 3.12]} />
          <EngineMaterial materialType="WRINKLE_RED" {...state} />
        </mesh>

        {/* Perimeter Sealing Flange */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.54, 0.025, 3.16]} />
          <EngineMaterial materialType="WRINKLE_RED" {...state} />
        </mesh>

        {/* Longitudinal Cooling & Stiffening Ribs */}
        {[-0.20, -0.12, 0.12, 0.20].map((x, i) => (
          <mesh key={'vcrib_' + i} position={[x, 0.125, 0]}>
            <boxGeometry args={[0.022, 0.02, 3.0]} />
            <EngineMaterial materialType="WRINKLE_RED" {...state} />
          </mesh>
        ))}

        {/* Recessed Central Spark Plug / Ignition Coil Well Channel */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.11, 0.04, 3.02]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>

        {/* 6 Flush Symmetrical Spark Plug / Coil-on-Plug Ports */}
        {CYLINDER_Z.map((z, i) => (
          <group key={'spwell_' + i} position={[0, 0.09, z]}>
            {/* CNC Machined flush well socket ring */}
            <mesh>
              <cylinderGeometry args={[0.036, 0.036, 0.025, 20]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            {/* Flush-seated ignition coil pack module */}
            <mesh position={[0, 0.012, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.01, 20]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
            </mesh>
            {/* Centered concentric fastener collar (no off-center dark dot) */}
            <mesh position={[0, 0.018, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.006, 12]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        ))}

        {/* Flush Machined Billet Aluminum Oil Filler Cap (Left Bank only, fully integrated with zero floating artifacts) */}
        {isLeftBank && (
          <group position={[0.14, 0.125, 1.15]}>
            <mesh>
              <cylinderGeometry args={[0.048, 0.048, 0.02, 24]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
            </mesh>
            {/* Concentric knurled grip ring (no floating rectangular bar) */}
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
// 1. ENGINE BLOCK & CRANKCASE ASSEMBLY
// The shared lower engine foundation uniting both banks
// ----------------------------------------------------
export function EngineBlockAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  // True 60-degree V12 block profile with open central valley & deep skirt
  const blockShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Start at bottom left pan rail
    shape.moveTo(-0.46, -0.40);
    // Pan rail bottom flange
    shape.lineTo(0.46, -0.40);
    // Lower right crankcase skirt
    shape.lineTo(0.50, -0.22);
    // Right crankcase bulge around counterweights
    shape.lineTo(0.56, -0.05);
    // Outer wall of Right Bank sloping upward along +30°
    shape.lineTo(0.72, 0.85);
    // Right Bank cylinder head deck surface (perpendicular to +30° bore axis)
    shape.lineTo(0.26, 1.06);
    // Inner wall of Right Bank descending into the central valley
    shape.lineTo(0.08, 0.45);
    // Floor of the Central Intake Valley
    shape.lineTo(-0.08, 0.45);
    // Inner wall of Left Bank rising out of the central valley
    shape.lineTo(-0.26, 1.06);
    // Left Bank cylinder head deck surface (perpendicular to -30° bore axis)
    shape.lineTo(-0.72, 0.85);
    // Outer wall of Left Bank sloping downward along -30°
    shape.lineTo(-0.56, -0.05);
    // Lower left crankcase skirt
    shape.lineTo(-0.50, -0.22);
    // Return to start
    shape.lineTo(-0.46, -0.40);
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 3.0,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.04,
    bevelThickness: 0.04
  }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Continuous Cast Aluminum Block Structure (from z = -1.50 to z = +1.50) */}
      <mesh position={[0, 0, -1.50]}>
        <extrudeGeometry args={[blockShape, extrudeSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* 12 Cast-Iron Cylinder Sleeves (6 Left, 6 Right) visible inside block */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'sleeves_' + i}>
          {/* Left Bank Cylinder Liner (tilted +30° -> bore axis to negative X) */}
          <group rotation={[0, 0, BANK_ANGLE]}>
            <mesh position={[0, 0.67, z]}>
              <cylinderGeometry args={[0.20, 0.20, 0.62, 32, 1, true]} />
              <EngineMaterial materialType="CAST_IRON" opacity={xrayEnabled ? 0.35 : 0.95} {...state} />
            </mesh>
          </group>
          {/* Right Bank Cylinder Liner (tilted -30° -> bore axis to positive X) */}
          <group rotation={[0, 0, -BANK_ANGLE]}>
            <mesh position={[0, 0.67, z]}>
              <cylinderGeometry args={[0.20, 0.20, 0.62, 32, 1, true]} />
              <EngineMaterial materialType="CAST_IRON" opacity={xrayEnabled ? 0.35 : 0.95} {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}

      {/* 7 Forged Steel Cross-Bolted Main Bearing Bulkhead Caps */}
      {[-1.45, -0.95, -0.45, 0.05, 0.55, 1.05, 1.45].map((z, i) => (
        <group key={'mbcap_' + i} position={[0, -0.16, z]}>
          {/* Main Bearing Cap Casting */}
          <mesh>
            <boxGeometry args={[0.56, 0.36, 0.12]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Semicircular Bearing Journal Saddle */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.12, 24]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Main Cap Vertical Studs */}
          <mesh position={[-0.20, -0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          <mesh position={[0.20, -0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          {/* Horizontal Cross-Bolts clamping skirt to cap */}
          <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.62, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </group>
      ))}

      {/* External Triangular Stiffening Casting Webs between cylinder stations */}
      {[-1.0, -0.5, 0.0, 0.5, 1.0].map((z, i) => (
        <React.Fragment key={'rib_' + i}>
          {/* Left Skirt Web */}
          <mesh position={[-0.60, 0.32, z]} rotation={[0, 0, -BANK_ANGLE]}>
            <boxGeometry args={[0.06, 0.45, 0.05]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
          {/* Right Skirt Web */}
          <mesh position={[0.60, 0.32, z]} rotation={[0, 0, BANK_ANGLE]}>
            <boxGeometry args={[0.06, 0.45, 0.05]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
          {/* Valley Floor Stiffening Bridge */}
          <mesh position={[0, 0.48, z]}>
            <boxGeometry args={[0.22, 0.04, 0.05]} />
            <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Machined Engine Mounting Boss Brackets on side skirts */}
      <mesh position={[-0.56, 0.05, 0.2]}>
        <boxGeometry args={[0.10, 0.16, 0.35]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      <mesh position={[0.56, 0.05, 0.2]}>
        <boxGeometry args={[0.10, 0.16, 0.35]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* Rear Transmission Bellhousing Flange (z = -1.48) */}
      <group position={[0, 0.22, -1.49]}>
        <mesh>
          <ringGeometry args={[0.45, 0.64, 32]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
        {/* Bellhousing mounting bolt circle */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
          const a = (idx * Math.PI) / 4;
          return (
            <mesh key={'bhb_' + idx} position={[Math.cos(a) * 0.56, Math.sin(a) * 0.56, -0.01]}>
              <cylinderGeometry args={[0.016, 0.016, 0.04, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          );
        })}
      </group>

      {/* Front Timing Chain Enclosure Flange (z = +1.48) */}
      <mesh position={[0, 0.26, 1.49]}>
        <boxGeometry args={[1.05, 1.05, 0.04]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 2. CRANKSHAFT ASSEMBLY
// Continuous 7-bearing forged crankshaft along longitudinal Z
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
      {/* 7 Precision Main Bearing Journals along Z axis */}
      {[-1.45, -0.95, -0.45, 0.05, 0.55, 1.05, 1.45].map((z, i) => (
        <mesh key={'mjournal_' + i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.14, 32]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      ))}

      {/* 6 Crank Throws: Offset Crankpins & Aerodynamic Dynamic Counterweights */}
      {CYLINDER_Z.map((z, i) => {
        const theta = CRANK_OFFSETS[i];
        const cpX = Math.sin(theta) * CRANK_RADIUS;
        const cpY = Math.cos(theta) * CRANK_RADIUS;

        return (
          <group key={'throw_' + i} position={[0, 0, z]}>
            {/* Front Counterweight Web (opposite crankpin) */}
            <mesh position={[-cpX * 0.45, -cpY * 0.45, -0.09]} rotation={[0, 0, theta + Math.PI]}>
              <boxGeometry args={[0.38, 0.25, 0.06]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Rear Counterweight Web (opposite crankpin) */}
            <mesh position={[-cpX * 0.45, -cpY * 0.45, 0.09]} rotation={[0, 0, theta + Math.PI]}>
              <boxGeometry args={[0.38, 0.25, 0.06]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>

            {/* Precision Micro-Polished Crankpin (shared by Bank 1 and Bank 2 connecting rods) */}
            <mesh position={[cpX, cpY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.088, 0.088, 0.16, 32]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>

            {/* Chamfered connecting crank cheeks */}
            <mesh position={[cpX * 0.5, cpY * 0.5, -0.07]} rotation={[0, 0, theta]}>
              <boxGeometry args={[0.18, 0.18, 0.04]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[cpX * 0.5, cpY * 0.5, 0.07]} rotation={[0, 0, theta]}>
              <boxGeometry args={[0.18, 0.18, 0.04]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        );
      })}

      {/* Heavy Steel Flywheel / Clutch Pressure Plate Flange at Rear (z = -1.54) */}
      <group position={[0, 0, -1.54]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.07, 48]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Starter Ring Gear Teeth Edge */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.435, 0.435, 0.025, 64]} />
          <EngineMaterial materialType="CAST_IRON" {...state} />
        </mesh>
      </group>

      {/* Front Crankshaft Snout extending into timing drive (z = +1.50 to +1.68) */}
      <mesh position={[0, 0, 1.59]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.18, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

      {/* Crankshaft Harmonic Balancer & Main Multi-Rib Serpentine Drive Pulley */}
      {/* Mounted directly onto the front crankshaft snout, sharing the crankshaft longitudinal axis and rotating with the crankshaft */}
      {/* Scaled to authentic ~236mm damper diameter (distinct from the rear 840mm flywheel) */}
      <group position={[0, 0, 1.66]}>
        {/* Inner Keyed Steel Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.07, 32]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Tuned Elastomeric Damping Ring (bonded rubber vibration isolator) */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.065, 32]} />
          <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
        </mesh>
        {/* Outer Ductile Steel Inertia Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.112, 0.112, 0.06, 48]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Multi-Rib Serpentine Belt Grooves Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}>
          <cylinderGeometry args={[0.118, 0.118, 0.045, 48]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#475569" {...state} />
        </mesh>
        {/* Laser-Etched Timing Degree Mark Collar & TDC Notch */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]}>
          <cylinderGeometry args={[0.12, 0.12, 0.012, 48]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        {/* Grade 12.9 Center Crankshaft Retaining Bolt & Hardened Belleville Washer */}
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.025, 16]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 3. PISTON ASSEMBLY BANK (LEFT / BANK 1 & RIGHT / BANK 2)
// High-compression forged pistons reciprocating along bore axis
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

  // Lathed piston profile: crown with ring grooves and slipper skirt
  const pistonPts = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0.01, -0.15)); // Skirt bottom inner
    pts.push(new THREE.Vector2(0.18, -0.15)); // Skirt bottom outer
    pts.push(new THREE.Vector2(0.185, -0.05)); // Skirt thrust face
    // 3 Ring Grooves (Top compression, second compression, oil scraper ring)
    pts.push(new THREE.Vector2(0.185, -0.01));
    pts.push(new THREE.Vector2(0.16, -0.01));
    pts.push(new THREE.Vector2(0.16, 0.01));
    pts.push(new THREE.Vector2(0.185, 0.01));
    pts.push(new THREE.Vector2(0.185, 0.03));
    pts.push(new THREE.Vector2(0.16, 0.03));
    pts.push(new THREE.Vector2(0.16, 0.05));
    pts.push(new THREE.Vector2(0.185, 0.05));
    pts.push(new THREE.Vector2(0.185, 0.09)); // Crown land edge
    pts.push(new THREE.Vector2(0.01, 0.09));  // Crown valve relief dish
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
            {/* Forged Aluminum Piston Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <latheGeometry args={[pistonPts, 32]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
            </mesh>

            {/* Piston Crown Valve Relief Pockets */}
            <mesh position={[0.06, 0.088, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#94a3b8" {...state} />
            </mesh>
            <mesh position={[-0.06, 0.088, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#94a3b8" {...state} />
            </mesh>

            {/* Full-Floating High-Strength Steel Wrist Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.035, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.35, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 4. CONNECTING RODS ASSEMBLY
// 12 H-beam titanium connecting rods linking crankpins to wrist pins
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
          {/* Left Bank Connecting Rod */}
          <group>
            {/* Split Big-End Journal Cap */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.115, 0.115, 0.065, 24]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* ARP Rod Bolts */}
            <mesh position={[-0.08, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            {/* H-Beam Rod Shank */}
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.065, ROD_LENGTH * 0.82, 0.035]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Small-End Wrist Pin Eyelet */}
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.065, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>

          {/* Right Bank Connecting Rod */}
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.115, 0.115, 0.065, 24]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[-0.08, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0.08, 0, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.08, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.065, ROD_LENGTH * 0.82, 0.035]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.065, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 5. DOHC VALVETRAIN & TWO DISTINCT VALVE COVERS ASSEMBLY
// Bank A and Bank B assemblies separated by central valley
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
// Located strictly in the central valley between the two cylinder banks.
// Visibly substantial dual-plenum chamber, forward induction, and 12 continuous curved 3D ram runners.
// ----------------------------------------------------
export function IntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  // 12 Continuous, Seamless 3D Curved Ram-Horn Intake Runners (6 to Bank A on Left, 6 to Bank B on Right)
  const { leftRunners, rightRunners } = useMemo(() => {
    const left = CYLINDER_Z.map((z) => {
      // Originates proudly at Left Plenum Barrel, arches up and sweeps down into Left Head Intake Port
      const p0 = new THREE.Vector3(-0.11, 1.34, z);
      const p1 = new THREE.Vector3(-0.21, 1.44, z);
      const p2 = new THREE.Vector3(-0.31, 1.30, z);
      const p3 = new THREE.Vector3(-0.36, 1.14, z);
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      return new THREE.TubeGeometry(curve, 24, 0.046, 16, false);
    });

    const right = CYLINDER_Z.map((z) => {
      // Originates proudly at Right Plenum Barrel, arches up and sweeps down into Right Head Intake Port
      const p0 = new THREE.Vector3(0.11, 1.34, z);
      const p1 = new THREE.Vector3(0.21, 1.44, z);
      const p2 = new THREE.Vector3(0.31, 1.30, z);
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
        <boxGeometry args={[0.34, 0.22, 2.80]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
      </mesh>

      {/* 2. Elevated Volumetric Dual Plenum Chambers (Y = 1.34 for prominent high-rise visibility) */}
      {/* Left Plenum Barrel (Bank A feed) */}
      <mesh position={[-0.13, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 2.76, 28]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
      </mesh>

      {/* Right Plenum Barrel (Bank B feed) */}
      <mesh position={[0.13, 1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 2.76, 28]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
      </mesh>

      {/* Central Equalization Bridge & Plenum Cross-Volume Body */}
      <mesh position={[0, 1.34, 0]}>
        <boxGeometry args={[0.26, 0.16, 2.74]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
      </mesh>

      {/* Laser-Engraved Billet Aluminum Top Spine Badge: "A.D.V.I.S. • 6.5L V12" */}
      <mesh position={[0, 1.43, 0]}>
        <boxGeometry args={[0.18, 0.02, 2.40]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#f8fafc" {...state} />
      </mesh>

      {/* Rear Plenum Billet End Plate & Vacuum Manifold Block */}
      <group position={[0, 1.34, -1.40]}>
        <mesh>
          <boxGeometry args={[0.40, 0.22, 0.04]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
        </mesh>
        {/* MAP & Air Temp Sensor Boss */}
        <mesh position={[0, 0.06, -0.025]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>
      </group>

      {/* 3. Dual Electronic Drive-By-Wire Throttle Bodies at Front Induction Neck (z = 1.42) */}
      {/* Left Throttle Body (Bank A feed) */}
      <group position={[-0.13, 1.34, 1.42]}>
        {/* CNC Machined Throttle Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 32]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
        </mesh>
        {/* Forward Flared Bellmouth Velocity Stack Air Horn */}
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.108, 0.09, 0.05, 32]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        {/* Internal Brass Butterfly Throttle Plate */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.17, 12]} />
          <EngineMaterial materialType="BRASS" {...state} />
        </mesh>
        {/* Outer Drive-by-Wire Servo Actuator Housing */}
        <mesh position={[-0.10, 0, 0]}>
          <boxGeometry args={[0.045, 0.08, 0.08]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
        </mesh>
      </group>

      {/* Right Throttle Body (Bank B feed) */}
      <group position={[0.13, 1.34, 1.42]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 32]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
        </mesh>
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.108, 0.09, 0.05, 32]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.17, 12]} />
          <EngineMaterial materialType="BRASS" {...state} />
        </mesh>
        <mesh position={[0.10, 0, 0]}>
          <boxGeometry args={[0.045, 0.08, 0.08]} />
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
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
        </mesh>
      ))}

      {/* Right Bank 2 Runners */}
      {rightRunners.map((geo, i) => (
        <mesh key={'in_runner_r_' + i} geometry={geo}>
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#e2e8f0" {...state} />
        </mesh>
      ))}

      {/* Flanges, Couplers, and Hardware for All 12 Runners */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'in_hardware_' + i}>
          {/* Bank A (Left) Hardware */}
          <group position={[-0.36, 1.14, z]}>
            {/* CNC Aluminum Port Flange bolted flush against the cylinder head deck */}
            <mesh rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.062, 0.062, 0.024, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
            </mesh>
            {/* Flange Mounting Studs */}
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, 0, -0.04]} rotation={[0, 0, -0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
          {/* Left Runner Silicone Coupler Sleeve & Clamp midway along arch */}
          <mesh position={[-0.22, 1.40, z]} rotation={[0, 0, -0.55]}>
            <cylinderGeometry args={[0.052, 0.052, 0.042, 16]} />
            <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
          </mesh>
          <mesh position={[-0.22, 1.40, z]} rotation={[0, 0, -0.55]}>
            <torusGeometry args={[0.054, 0.0035, 8, 20]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>

          {/* Bank B (Right) Hardware */}
          <group position={[0.36, 1.14, z]}>
            <mesh rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.062, 0.062, 0.024, 16]} />
              <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
            </mesh>
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, 0, -0.04]} rotation={[0, 0, 0.82]}>
              <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
          {/* Right Runner Silicone Coupler Sleeve & Clamp midway along arch */}
          <mesh position={[0.22, 1.40, z]} rotation={[0, 0, 0.55]}>
            <cylinderGeometry args={[0.052, 0.052, 0.042, 16]} />
            <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
          </mesh>
          <mesh position={[0.22, 1.40, z]} rotation={[0, 0, 0.55]}>
            <torusGeometry args={[0.054, 0.0035, 8, 20]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 5. Dual Extruded Billet Aluminum Fuel Injection Rails & 12 Sequential Injectors */}
      {/* Left Bank Fuel Rail (Bank A) */}
      <group position={[-0.30, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.016, 0.016, 2.90, 16]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>
      {/* Right Bank Fuel Rail (Bank B) */}
      <group position={[0.30, 1.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.016, 0.016, 2.90, 16]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>

      {/* Rear Fuel Crossover Pipe */}
      <mesh position={[0, 1.24, -1.40]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.60, 12]} />
        <EngineMaterial materialType="CHROME" {...state} />
      </mesh>

      {/* 12 High-Pressure Sequential Fuel Injectors */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'injectors_' + i}>
          {/* Left Bank Injector */}
          <group position={[-0.31, 1.20, z]} rotation={[0, 0, -0.52]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#27272a" {...state} />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
              <EngineMaterial materialType="CHROME" {...state} />
            </mesh>
          </group>
          {/* Right Bank Injector */}
          <group position={[0.31, 1.20, z]} rotation={[0, 0, 0.52]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.07, 12]} />
              <EngineMaterial materialType="PLASTIC" baseColor="#27272a" {...state} />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
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
// Authentic brushed stainless steel / Inconel (NO GOLD/TAN TEETH).
// ----------------------------------------------------
export function CanonicalExhaustHeader({
  isLeftBank,
  state
}: {
  isLeftBank: boolean;
  state: any;
}) {
  // sideSign: -1 for Left Bank (Bank A, outer left flank at X < 0), +1 for Right Bank (Bank B, outer right flank at X > 0)
  const sideSign = isLeftBank ? -1 : 1;

  // Head exhaust port surface position
  const portX = sideSign * 0.784;
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
      return new THREE.TubeGeometry(curve, 28, 0.040, 16, false);
    });
  }, [sideSign, portX, portY, collectorX, collectorY, collectorZ]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Continuous CNC Laser-Cut 1/2-inch Stainless Steel Exhaust Port Flange Plate */}
      <mesh position={[portX, portY, 0]} rotation={[0, 0, sideSign * -BANK_ANGLE]}>
        <boxGeometry args={[0.022, 0.22, 2.92]} />
        <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#64748b" {...state} />
      </mesh>

      {/* Exhaust Port Studs & Copper Locknuts along Flange */}
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'studs_' + i}>
          <mesh position={[portX + sideSign * 0.015, portY + 0.08, z]}>
            <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
            <EngineMaterial materialType="COPPER" {...state} />
          </mesh>
          <mesh position={[portX + sideSign * 0.015, portY - 0.08, z]}>
            <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
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
          <cylinderGeometry args={[0.13, 0.09, 0.38, 24]} />
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#94a3b8" {...state} />
        </mesh>

        {/* TIG Weld Ring at collector junction with straw-amber heat-affected tint */}
        <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.005, 8, 24]} />
          <EngineMaterial materialType="EXHAUST_STEEL" baseColor="#b45309" {...state} />
        </mesh>

        {/* Main 3.5-inch Tuned Exhaust Collector Downpipe running rearward to z = -1.55 */}
        <mesh position={[0, 0, -0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 1.05, 24]} />
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
// Directly mounted on the front of the engine block
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
      new THREE.Vector3(0, -0.115, 0.04),  // under crank pulley
      new THREE.Vector3(-0.48, 0.08, 0.04), // around alternator lower rim
      new THREE.Vector3(-0.45, 0.17, 0.04), // around alternator upper rim
      new THREE.Vector3(0, 0.48, 0.04),    // over water pump pulley
      new THREE.Vector3(0.48, 0.22, 0.04),  // over tensioner pulley
      new THREE.Vector3(0.40, 0.12, 0.04),  // returning towards crank
    ], true);
    return new THREE.TubeGeometry(curve, 36, 0.015, 12, true);
  }, []);

  return (
    // Mounted directly to the front face of the engine block
    <group position={[0, 0, 1.54]}>
      {/* 1. High-Flow Centrifugal Water Pump Housing above Crank Pulley */}
      <mesh position={[0, 0.36, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* Water Pump Pulley */}
      <mesh position={[0, 0.36, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 24]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

      {/* Aerodynamic 9-Blade Viscous Engine Cooling Fan */}
      <group position={[0, 0.36, 0.14]} ref={fanRef}>
        {/* Center Viscous Clutch Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.05, 24]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
        </mesh>
        {/* 9 Curved Aerodynamic Fan Blades */}
        {[...Array(9)].map((_, i) => (
          <mesh key={'blade_' + i} rotation={[0, 0, (i * Math.PI * 2) / 9]} position={[0, 0.22, 0]}>
            <boxGeometry args={[0.07, 0.32, 0.015]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
          </mesh>
        ))}
      </group>

      {/* 2. Compact High-Output Alternator on Left Accessory Bracket */}
      <group position={[-0.45, 0.12, 0]}>
        {/* Cylindrical Stator Housing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.18, 24]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
        </mesh>
        {/* Alternator Drive Pulley */}
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      </group>

      {/* 3. Belt Tensioner Idler Pulley on Right */}
      <mesh position={[0.42, 0.18, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>

      {/* 4. Continuous Multi-Rib Serpentine Accessory Drive Belt */}
      <mesh geometry={beltGeometry}>
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* 5. Cast Aluminum Water Neck & Thermostat Housing firmly seated into pump casing */}
      <group position={[-0.14, 0.44, 0.02]}>
        <mesh rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.055, 0.06, 0.14, 20]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
        <mesh position={[-0.04, 0.05, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.065, 0.065, 0.02, 20]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#cbd5e1" {...state} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 9. LUBRICATION SYSTEM & DRY-SUMP FINNED OIL PAN
// Bolted directly to bottom crankcase rail from y = -0.40 to -0.68
// ----------------------------------------------------
export function LubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, -0.40, 0]}>
      {/* Heavy-Duty Cast Aluminum Oil Pan Bolted to Crankcase Flange */}
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.92, 0.28, 2.95]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
      </mesh>

      {/* Pan Perimeter Mounting Flange with Bolts */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[0.96, 0.03, 3.02]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
      </mesh>

      {/* Longitudinal Cooling Heatsink Fins along the entire pan floor */}
      {[-0.35, -0.21, -0.07, 0.07, 0.21, 0.35].map((x, i) => (
        <mesh key={'panfin_' + i} position={[x, -0.30, 0]}>
          <boxGeometry args={[0.022, 0.05, 2.85]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
        </mesh>
      ))}

      {/* Spin-On High-Pressure Oil Filter with Hex Nut */}
      <group position={[-0.48, -0.10, 0.75]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 0.22, 24]} />
          <EngineMaterial materialType="CAST_IRON" baseColor="#0f172a" {...state} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 6]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>

      {/* Magnetic Brass Oil Drain Plug */}
      <mesh position={[0.26, -0.28, -1.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.05, 12]} />
        <EngineMaterial materialType="BRASS" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 10. ENGINE ELECTRONICS & HARNESS
// Braided wiring harness and rear ECU module (zero floating artifacts)
// ----------------------------------------------------
export function ElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  return (
    <group position={[0, 0, 0]}>
      {/* Braided Engine Wiring Harness Looms running securely along the inner valley floor */}
      <mesh position={[-0.26, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 2.9, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>
      <mesh position={[0.26, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 2.9, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* Cross-Engine Wiring Junction Harness at Rear */}
      <mesh position={[0, 1.05, -1.40]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.54, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>

      {/* Bosch Motorsport Dual Automotive ECU Module bolted firmly to Rear Bellhousing Bulkhead */}
      <group position={[0, 0.58, -1.50]}>
        <mesh>
          <boxGeometry args={[0.42, 0.22, 0.08]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
        </mesh>
        {/* Heatsink Fins on ECU case */}
        {[-0.14, -0.07, 0, 0.07, 0.14].map((x, i) => (
          <mesh key={'ecufin_' + i} position={[x, 0, -0.045]}>
            <boxGeometry args={[0.015, 0.18, 0.02]} />
            <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
          </mesh>
        ))}
        {/* Dual 80-Pin Automotive Connectors */}
        <mesh position={[-0.10, -0.08, 0.04]}>
          <boxGeometry args={[0.12, 0.05, 0.03]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#0f172a" {...state} />
        </mesh>
        <mesh position={[0.10, -0.08, 0.04]}>
          <boxGeometry args={[0.12, 0.05, 0.03]} />
          <EngineMaterial materialType="PLASTIC" baseColor="#0f172a" {...state} />
        </mesh>
      </group>
    </group>
  );
}
