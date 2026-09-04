// src/generators/MechanicalGenerator.tsx
// High-Precision Procedural V12 Internal Combustion Engine Engineering Assembly & Real-Time Kinematics

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HolographicMaterialProps {
  baseColor?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  opacity?: number;
  materialType?: 'CAST_ALUMINUM' | 'FORGED_STEEL' | 'CAST_IRON' | 'RUBBER' | 'PLASTIC' | 'COPPER' | 'BRASS' | 'TITANIUM' | 'CARBON_FIBER' | 'CHROME';
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
    return <meshBasicMaterial color="#0ea5e9" wireframe={true} transparent opacity={0.3} />;
  }

  if (xrayEnabled) {
    return (
      <meshPhysicalMaterial
        color={baseColor || '#94a3b8'}
        transparent={true}
        opacity={0.15}
        roughness={0.1}
        metalness={0.9}
        transmission={0.95}
        ior={1.5}
        emissive={isSelected ? "#0ea5e9" : (isHovered ? "#38bdf8" : "#000000")}
        emissiveIntensity={isSelected ? 0.8 : (isHovered ? 0.4 : 0)}
      />
    );
  }

  let r = 0.5, m = 0.5, c = baseColor || '#94a3b8';
  let cc = 0.0, cr = 0.0;

  switch (materialType) {
    case 'CAST_ALUMINUM': r = 0.55; m = 0.75; c = baseColor || '#cbd5e1'; break;
    case 'FORGED_STEEL': r = 0.28; m = 0.92; c = baseColor || '#94a3b8'; cc = 0.3; cr = 0.15; break;
    case 'CAST_IRON': r = 0.82; m = 0.65; c = baseColor || '#334155'; break;
    case 'TITANIUM': r = 0.35; m = 0.88; c = baseColor || '#94a3b8'; break;
    case 'CHROME': r = 0.08; m = 0.98; c = baseColor || '#f8fafc'; cc = 0.9; cr = 0.05; break;
    case 'RUBBER': r = 0.92; m = 0.05; c = baseColor || '#18181b'; break;
    case 'PLASTIC': r = 0.4; m = 0.1; c = baseColor || '#27272a'; break;
    case 'CARBON_FIBER': r = 0.45; m = 0.45; c = baseColor || '#18181b'; cc = 0.8; cr = 0.1; break;
    case 'COPPER': r = 0.3; m = 0.9; c = baseColor || '#b45309'; break;
    case 'BRASS': r = 0.3; m = 0.9; c = baseColor || '#ca8a04'; break;
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
      emissive={isSelected ? "#0ea5e9" : (isHovered ? "#0284c7" : "#000000")}
      emissiveIntensity={isSelected ? 0.5 : (isHovered ? 0.2 : 0)}
      wireframe={isSelected}
      envMapIntensity={1.5}
    />
  );
}

// Global engine bay coordinates along longitudinal Z axis:
// 6 cylinder pairs spaced along Z from front to back
const CYLINDER_Z = [-1.25, -0.75, -0.25, 0.25, 0.75, 1.25];
const CRANK_RADIUS = 0.24; // Crank throw radius R
const ROD_LENGTH = 0.72;   // Connecting rod center-to-center length L
const BANK_ANGLE = Math.PI / 6; // 30 degrees from vertical (60° V-angle total)
const CRANK_OFFSETS = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));

// Exact closed-form slider-crank displacement along bore axis
function getPistonStroke(crankAngle: number, bank: 'left' | 'right'): number {
  const alpha = bank === 'left' ? -BANK_ANGLE : BANK_ANGLE;
  // Crankpin position in global XY
  const cpX = Math.sin(crankAngle) * CRANK_RADIUS;
  const cpY = Math.cos(crankAngle) * CRANK_RADIUS;

  // Unit vector along the cylinder bore axis
  const uX = Math.sin(alpha);
  const uY = Math.cos(alpha);

  // Perpendicular vector
  const vX = -Math.cos(alpha);
  const vY = Math.sin(alpha);

  const p_parallel = cpX * uX + cpY * uY;
  const p_perp = cpX * vX + cpY * vY;

  return p_parallel + Math.sqrt(Math.max(0.01, ROD_LENGTH * ROD_LENGTH - p_perp * p_perp));
}

// ----------------------------------------------------
// 1. ENGINE BLOCK ASSEMBLY
// ----------------------------------------------------
export function EngineBlockAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };

  // 60-degree V-Block cross-section profile
  const blockShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -0.45); // Deep crankcase pan flange (left)
    shape.lineTo(0.55, -0.45);  // Deep crankcase pan flange (right)
    shape.lineTo(0.72, 0.1);    // Right crankcase skirt bulges around crank counterweights
    shape.lineTo(0.68, 0.75);   // Right bank deck outer edge (30° angle)
    shape.lineTo(0.22, 1.05);   // Right deck inner edge
    shape.lineTo(0, 0.65);      // V-Valley center floor
    shape.lineTo(-0.22, 1.05);  // Left deck inner edge
    shape.lineTo(-0.68, 0.75);  // Left bank deck outer edge
    shape.lineTo(-0.72, 0.1);   // Left crankcase skirt
    shape.lineTo(-0.55, -0.45); // Return
    return shape;
  }, []);

  const extrudeSettings = useMemo(() => ({
    depth: 3.2,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize: 0.05,
    bevelThickness: 0.05
  }), []);

  return (
    <group position={[0, 0, -1.6]}>
      {/* Main Cast Aluminum Block */}
      <mesh>
        <extrudeGeometry args={[blockShape, extrudeSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* 12 Cast-Iron Cylinder Bore Liners */}
      {CYLINDER_Z.map((z, i) => (
        <group key={'bore' + i} position={[0, 0, z + 1.6]}>
          {/* Left Bank Cylinder Bore (30° tilt) */}
          <mesh position={[-0.45, 0.82, 0]} rotation={[0, 0, BANK_ANGLE]}>
            <cylinderGeometry args={[0.21, 0.21, 0.95, 32, 1, true]} />
            <EngineMaterial materialType="CAST_IRON" baseColor="#1e293b" opacity={xrayEnabled ? 0.2 : 0.95} {...state} />
          </mesh>
          {/* Right Bank Cylinder Bore (-30° tilt) */}
          <mesh position={[0.45, 0.82, 0]} rotation={[0, 0, -BANK_ANGLE]}>
            <cylinderGeometry args={[0.21, 0.21, 0.95, 32, 1, true]} />
            <EngineMaterial materialType="CAST_IRON" baseColor="#1e293b" opacity={xrayEnabled ? 0.2 : 0.95} {...state} />
          </mesh>
        </group>
      ))}

      {/* 7 Forged Steel Cross-Bolted Main Bearing Bulkhead Caps */}
      {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((z, i) => (
        <group key={'mbc' + i} position={[0, -0.15, z + 1.6]}>
          <mesh>
            <boxGeometry args={[0.62, 0.38, 0.16]} />
            <EngineMaterial materialType="FORGED_STEEL" {...state} />
          </mesh>
          {/* Cross bolts */}
          <mesh position={[-0.24, -0.12, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.42, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
          <mesh position={[0.24, -0.12, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.42, 12]} />
            <EngineMaterial materialType="CHROME" {...state} />
          </mesh>
        </group>
      ))}

      {/* External Structural Stiffening Ribs */}
      {[-1.1, -0.6, -0.1, 0.4, 0.9, 1.4].map((z, i) => (
        <mesh key={'rib' + i} position={[0, 0.2, z + 1.6]}>
          <boxGeometry args={[1.44, 0.05, 0.06]} />
          <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
        </mesh>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 2. CRANKSHAFT ASSEMBLY
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
      {/* 7 Main Journals along center rotation axis Z */}
      {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((z, i) => (
        <mesh key={'mj' + i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.16, 32]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      ))}

      {/* 6 Crank Throws: Counterweights and Offset Crankpins */}
      {CYLINDER_Z.map((z, i) => {
        const theta = CRANK_OFFSETS[i];
        const cpX = Math.sin(theta) * CRANK_RADIUS;
        const cpY = Math.cos(theta) * CRANK_RADIUS;

        return (
          <group key={'throw' + i} position={[0, 0, z]}>
            {/* Front Crank Web & Counterweight */}
            <mesh position={[-cpX * 0.4, -cpY * 0.4, -0.1]} rotation={[0, 0, theta + Math.PI]}>
              <boxGeometry args={[0.42, 0.28, 0.08]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Rear Crank Web & Counterweight */}
            <mesh position={[-cpX * 0.4, -cpY * 0.4, 0.1]} rotation={[0, 0, theta + Math.PI]}>
              <boxGeometry args={[0.42, 0.28, 0.08]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Precision Ground Crankpin (shared by Left and Right bank rods) */}
            <mesh position={[cpX, cpY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.2, 32]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        );
      })}

      {/* Flywheel / Output Flange at Rear */}
      <mesh position={[0, 0, 1.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.08, 48]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>
      {/* Front Snout & Harmonic Balancer Pulley */}
      <mesh position={[0, 0, -1.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 3. PISTON ASSEMBLY BANK (LEFT & RIGHT)
// ----------------------------------------------------
export function PistonAssemblyBank({
  bank,
  sign,
  isHovered,
  isSelected,
  xrayEnabled,
  blueprintEnabled,
  sysTimeRef,
  v12Rpm = 600,
  v12Direction = 1
}: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const bankRef = useRef<THREE.Group>(null);

  // Lathed piston crown and skirt profile
  const pistonPts = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0.01, -0.16)); // Bottom skirt inner
    pts.push(new THREE.Vector2(0.19, -0.16)); // Bottom skirt outer
    pts.push(new THREE.Vector2(0.2, -0.06));  // Skirt outer face
    // Ring grooves (Top compression, second compression, oil control)
    pts.push(new THREE.Vector2(0.2, -0.01));
    pts.push(new THREE.Vector2(0.175, -0.01));
    pts.push(new THREE.Vector2(0.175, 0.01));
    pts.push(new THREE.Vector2(0.2, 0.01));
    pts.push(new THREE.Vector2(0.2, 0.03));
    pts.push(new THREE.Vector2(0.175, 0.03));
    pts.push(new THREE.Vector2(0.175, 0.05));
    pts.push(new THREE.Vector2(0.2, 0.05));
    pts.push(new THREE.Vector2(0.2, 0.1));   // Crown top edge
    pts.push(new THREE.Vector2(0.01, 0.1));  // Crown center (valve relief)
    return pts;
  }, []);

  useFrame((sysState) => {
    if (!bankRef.current) return;
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;

    bankRef.current.children.forEach((pistonGrp, i) => {
      const crankAngle = t + CRANK_OFFSETS[i];
      const stroke = getPistonStroke(crankAngle, bank);
      // Move piston along the bore axis (local Y)
      pistonGrp.position.y = stroke;
    });
  });

  return (
    // Rotated to bank bore angle: Left bank -30°, Right bank +30°
    <group position={[0, 0, 0]} rotation={[0, 0, sign * BANK_ANGLE]}>
      <group ref={bankRef}>
        {CYLINDER_Z.map((z, i) => (
          <group key={'piston' + i} position={[0, 0, z]}>
            {/* Piston Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <latheGeometry args={[pistonPts, 32]} />
              <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
            </mesh>
            {/* Steel Wrist Pin */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.38, 20]} />
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

      // Exact wrist pin positions for Left and Right banks
      const sLeft = getPistonStroke(crankAngle, 'left');
      const wpLeftX = -Math.sin(BANK_ANGLE) * sLeft;
      const wpLeftY = Math.cos(BANK_ANGLE) * sLeft;

      const sRight = getPistonStroke(crankAngle, 'right');
      const wpRightX = Math.sin(BANK_ANGLE) * sRight;
      const wpRightY = Math.cos(BANK_ANGLE) * sRight;

      const leftRod = rodsRef.current!.children[i * 2] as THREE.Group;
      const rightRod = rodsRef.current!.children[i * 2 + 1] as THREE.Group;

      if (leftRod) {
        leftRod.position.set(cpX, cpY, z - 0.045);
        leftRod.rotation.z = Math.atan2(wpLeftY - cpY, wpLeftX - cpX) - Math.PI / 2;
      }

      if (rightRod) {
        rightRod.position.set(cpX, cpY, z + 0.045);
        rightRod.rotation.z = Math.atan2(wpRightY - cpY, wpRightX - cpX) - Math.PI / 2;
      }
    });
  });

  return (
    <group position={[0, 0, 0]} ref={rodsRef}>
      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={'rod_pair_' + i}>
          {/* Left Rod */}
          <group>
            {/* Big End Journal Cap & ARP Bolts */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.075, 24]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* H-Beam Rod Shank */}
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.075, ROD_LENGTH * 0.85, 0.04]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            {/* Small End Wrist Pin Eyelet */}
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.075, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>

          {/* Right Rod */}
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.13, 0.13, 0.075, 24]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH * 0.5, 0]}>
              <boxGeometry args={[0.075, ROD_LENGTH * 0.85, 0.04]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
            <mesh position={[0, ROD_LENGTH, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.075, 20]} />
              <EngineMaterial materialType="FORGED_STEEL" {...state} />
            </mesh>
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}

// ----------------------------------------------------
// 5. DOHC VALVETRAIN ASSEMBLY & POWDER-COATED COVERS
// ----------------------------------------------------
export function ValvetrainAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
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
    <group position={[0, 0, 0]}>
      {/* Camshafts Group */}
      <group ref={camsRef}>
        {/* Left Bank Intake & Exhaust Camshafts */}
        <mesh position={[-0.62, 1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 3.1, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        <mesh position={[-0.42, 1.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 3.1, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {/* Right Bank Intake & Exhaust Camshafts */}
        <mesh position={[0.42, 1.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 3.1, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        <mesh position={[0.62, 1.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 3.1, 20]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      </group>

      {/* 48 Valves & Dual Valve Springs */}
      {CYLINDER_Z.map((z, i) => (
        <group key={'valves' + i} position={[0, 0, z]}>
          {/* Left Cylinder: 2 Intake + 2 Exhaust */}
          <mesh position={[-0.56, 1.28, -0.06]} rotation={[0, 0, BANK_ANGLE]}>
            <cylinderGeometry args={[0.016, 0.042, 0.28, 16]} />
            <EngineMaterial materialType="TITANIUM" {...state} />
          </mesh>
          <mesh position={[-0.56, 1.28, 0.06]} rotation={[0, 0, BANK_ANGLE]}>
            <cylinderGeometry args={[0.016, 0.042, 0.28, 16]} />
            <EngineMaterial materialType="TITANIUM" {...state} />
          </mesh>
          {/* Right Cylinder: 2 Intake + 2 Exhaust */}
          <mesh position={[0.56, 1.28, -0.06]} rotation={[0, 0, -BANK_ANGLE]}>
            <cylinderGeometry args={[0.016, 0.042, 0.28, 16]} />
            <EngineMaterial materialType="TITANIUM" {...state} />
          </mesh>
          <mesh position={[0.56, 1.28, 0.06]} rotation={[0, 0, -BANK_ANGLE]}>
            <cylinderGeometry args={[0.016, 0.042, 0.28, 16]} />
            <EngineMaterial materialType="TITANIUM" {...state} />
          </mesh>
        </group>
      ))}

      {/* Wrinkle Red Powder-Coated Valve Covers with Embossed Longitudinal Fins */}
      {/* Left Valve Cover */}
      <group position={[-0.52, 1.5, 0]} rotation={[0, 0, BANK_ANGLE]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.42, 0.16, 3.15]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#dc2626" {...state} />
        </mesh>
        {/* Billet Oil Filler Cap */}
        <mesh position={[0, 0.2, -1.2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.06, 24]} />
          <EngineMaterial materialType="CHROME" {...state} />
        </mesh>
      </group>

      {/* Right Valve Cover */}
      <group position={[0.52, 1.5, 0]} rotation={[0, 0, -BANK_ANGLE]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.42, 0.16, 3.15]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#dc2626" {...state} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 6. INTAKE PLENUM & DUAL THROTTLE BODIES
// ----------------------------------------------------
export function IntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, 0, 0]}>
      {/* Twin Carbon Fiber Plenum Chambers nestled in the V-Valley */}
      <mesh position={[-0.24, 1.6, 0]}>
        <boxGeometry args={[0.26, 0.24, 2.9]} />
        <EngineMaterial materialType="CARBON_FIBER" {...state} />
      </mesh>
      <mesh position={[0.24, 1.6, 0]}>
        <boxGeometry args={[0.26, 0.24, 2.9]} />
        <EngineMaterial materialType="CARBON_FIBER" {...state} />
      </mesh>

      {/* Dual Electronic Drive-By-Wire Throttle Bodies at Front */}
      <mesh position={[-0.24, 1.6, -1.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      <mesh position={[0.24, 1.6, -1.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.22, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* 12 Curved Intake Runners Diving into Cylinder Heads */}
      {CYLINDER_Z.map((z, i) => (
        <group key={'runner' + i} position={[0, 0, z]}>
          {/* Left Intake Runner */}
          <mesh position={[-0.38, 1.45, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.065, 0.065, 0.42, 20]} />
            <EngineMaterial materialType="CARBON_FIBER" {...state} />
          </mesh>
          {/* Right Intake Runner */}
          <mesh position={[0.38, 1.45, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.065, 0.065, 0.42, 20]} />
            <EngineMaterial materialType="CARBON_FIBER" {...state} />
          </mesh>
        </group>
      ))}

      {/* Billet Aluminum Fuel Rails with 12 Injectors */}
      <mesh position={[-0.48, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 3.0, 16]} />
        <EngineMaterial materialType="CHROME" baseColor="#38bdf8" {...state} />
      </mesh>
      <mesh position={[0.48, 1.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 3.0, 16]} />
        <EngineMaterial materialType="CHROME" baseColor="#38bdf8" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 7. EXHAUST MANIFOLD & EQUAL-LENGTH HEADERS
// ----------------------------------------------------
export function ExhaustManifold({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, 0, 0]}>
      {/* Left Bank 6-into-1 Tuned Header System */}
      <group position={[-0.85, 0.4, 0]}>
        {/* Main Collector Pipe with Heat Discoloration Violet/Titanium */}
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 2.9, 24]} />
          <EngineMaterial materialType="TITANIUM" baseColor="#7c3aed" {...state} />
        </mesh>
        {CYLINDER_Z.map((z, i) => (
          <mesh key={'exhl' + i} position={[0.22, 0.25, z]} rotation={[0, 0, -Math.PI / 3.5]}>
            <cylinderGeometry args={[0.058, 0.058, 0.55, 16]} />
            <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
          </mesh>
        ))}
      </group>

      {/* Right Bank 6-into-1 Tuned Header System */}
      <group position={[0.85, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 2.9, 24]} />
          <EngineMaterial materialType="TITANIUM" baseColor="#7c3aed" {...state} />
        </mesh>
        {CYLINDER_Z.map((z, i) => (
          <mesh key={'exhr' + i} position={[-0.22, 0.25, z]} rotation={[0, 0, Math.PI / 3.5]}>
            <cylinderGeometry args={[0.058, 0.058, 0.55, 16]} />
            <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ----------------------------------------------------
// 8. COOLING SYSTEM & SERPENTINE ACCESSORY BELT
// ----------------------------------------------------
export function CoolingSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const fanRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (fanRef.current) {
      fanRef.current.rotation.z = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * 16;
    }
  });

  return (
    <group position={[0, 0, -1.65]}>
      {/* Dual-Stage High-Flow Water Pump Housing */}
      <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.22, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* Aerodynamic 9-Blade High-Flow Viscous Fan */}
      <group position={[0, 0.35, -0.16]} ref={fanRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 24]} />
          <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
        {[...Array(9)].map((_, i) => (
          <mesh key={'blade' + i} rotation={[0, 0, (i * Math.PI * 2) / 9]} position={[0, 0.24, 0]}>
            <boxGeometry args={[0.085, 0.36, 0.02]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#18181b" {...state} />
          </mesh>
        ))}
      </group>

      {/* Alternator Housing with Radial Cooling Vents */}
      <mesh position={[-0.52, 0.1, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.25, 24]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#64748b" {...state} />
      </mesh>

      {/* Grooved Multi-Rib Serpentine Belt */}
      <mesh position={[0, 0.15, -0.08]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.48, 0.018, 8, 36]} />
        <EngineMaterial materialType="RUBBER" {...state} />
      </mesh>

      {/* Reinforced Silicone Radiator Hoses with Stainless T-Bolt Clamps */}
      <mesh position={[-0.35, 0.75, -0.1]} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.85, 20]} />
        <EngineMaterial materialType="RUBBER" baseColor="#0284c7" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 9. LUBRICATION SYSTEM & DRY-SUMP FINNED OIL PAN
// ----------------------------------------------------
export function LubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, -0.45, 0]}>
      {/* Deep-Ribbed Cast Aluminum Oil Pan */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[0.95, 0.32, 3.15]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
      </mesh>

      {/* Longitudinal Cooling Heatsink Fins on Pan Base */}
      {[-0.32, -0.16, 0, 0.16, 0.32].map((x, i) => (
        <mesh key={'fin' + i} position={[x, -0.34, 0]}>
          <boxGeometry args={[0.025, 0.06, 3.0]} />
          <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
        </mesh>
      ))}

      {/* Spin-On High-Pressure Oil Filter with Hex Removal Nut */}
      <mesh position={[-0.56, -0.05, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.26, 24]} />
        <EngineMaterial materialType="CAST_IRON" baseColor="#0f172a" {...state} />
      </mesh>

      {/* Magnetic Oil Drain Plug */}
      <mesh position={[0.35, -0.32, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.06, 12]} />
        <EngineMaterial materialType="BRASS" {...state} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------
// 10. ENGINE ELECTRONICS & INDIVIDUAL IGNITION COILS
// ----------------------------------------------------
export function ElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, 0, 0]}>
      {/* Bosch Motorsport ECU Controller Module */}
      <mesh position={[0, 1.85, -1.3]}>
        <boxGeometry args={[0.42, 0.18, 0.12]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#1e293b" {...state} />
      </mesh>

      {/* 12 Coil-On-Plug Ignition Packs (Direct Spark Plug Mount) */}
      {CYLINDER_Z.map((z, i) => (
        <group key={'ign_coil_' + i} position={[0, 0, z]}>
          {/* Left Bank Coil */}
          <mesh position={[-0.48, 1.62, 0]} rotation={[0, 0, BANK_ANGLE]}>
            <cylinderGeometry args={[0.038, 0.038, 0.14, 16]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#dc2626" {...state} />
          </mesh>
          {/* Right Bank Coil */}
          <mesh position={[0.48, 1.62, 0]} rotation={[0, 0, -BANK_ANGLE]}>
            <cylinderGeometry args={[0.038, 0.038, 0.14, 16]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#dc2626" {...state} />
          </mesh>
        </group>
      ))}

      {/* Braided Engine Wiring Harness Looms */}
      <mesh position={[-0.55, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.0, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>
      <mesh position={[0.55, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.0, 12]} />
        <EngineMaterial materialType="RUBBER" baseColor="#18181b" {...state} />
      </mesh>
    </group>
  );
}
