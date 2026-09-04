const fs = require('fs');

const code = `import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox, Cylinder, Box, Tube, Sphere, Extrude, Torus, Instance, Instances } from '@react-three/drei';

interface HolographicMaterialProps {
  baseColor?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  opacity?: number;
  materialType?: 'CAST_ALUMINUM' | 'FORGED_STEEL' | 'CAST_IRON' | 'RUBBER' | 'PLASTIC' | 'COPPER' | 'BRASS' | 'TITANIUM' | 'CARBON_FIBER';
}

export function EngineMaterial({ baseColor, isHovered, isSelected, xrayEnabled, blueprintEnabled, opacity = 1, materialType = 'CAST_ALUMINUM' }: HolographicMaterialProps) {
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
    case 'CAST_ALUMINUM': r = 0.6; m = 0.8; c = baseColor || '#d1d5db'; break;
    case 'FORGED_STEEL': r = 0.3; m = 0.9; c = baseColor || '#94a3b8'; cc = 0.2; cr = 0.2; break;
    case 'CAST_IRON': r = 0.8; m = 0.6; c = baseColor || '#475569'; break;
    case 'TITANIUM': r = 0.4; m = 0.85; c = baseColor || '#a1a1aa'; break;
    case 'RUBBER': r = 0.9; m = 0.1; c = baseColor || '#1c1917'; break;
    case 'PLASTIC': r = 0.4; m = 0.1; c = baseColor || '#292524'; break;
    case 'CARBON_FIBER': r = 0.5; m = 0.4; c = baseColor || '#171717'; cc = 0.8; cr = 0.1; break;
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

// ----------------------------------------------------
// V12 ENGINE ASSEMBLIES
// ----------------------------------------------------

export function EngineBlockAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  
  // V-Block shape
  const blockShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.4, 0); // Bottom left
    shape.lineTo(0.4, 0);  // Bottom right
    shape.lineTo(0.6, 0.4); // Right crankcase out
    shape.lineTo(0.6, 0.8); // Right up to deck
    shape.lineTo(0.2, 1.2); // Right deck slope inward
    shape.lineTo(0, 0.9);   // Valley center
    shape.lineTo(-0.2, 1.2); // Left deck slope outward
    shape.lineTo(-0.6, 0.8); // Left down
    shape.lineTo(-0.6, 0.4); // Left crankcase
    shape.lineTo(-0.4, 0); // Back to start
    return shape;
  }, []);

  const extrudeSettings = { depth: 3.2, bevelEnabled: true, bevelSegments: 3, steps: 2, bevelSize: 0.04, bevelThickness: 0.04 };

  return (
    <group position={[0, -0.4, -1.6]}>
      <mesh>
        <extrudeGeometry args={[blockShape, extrudeSettings]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      
      {/* Cylinder holes for aesthetic detail when transparent or viewed from above */}
      {[...Array(6)].map((_, i) => (
        <group key={'cyl'+i} position={[0, 0, 0.3 + i * 0.5]}>
           {/* Left bank cylinders */}
           <mesh position={[-0.35, 0.95, 0]} rotation={[0, 0, Math.PI/6]}>
             <cylinderGeometry args={[0.2, 0.2, 0.8, 32]} />
             <EngineMaterial materialType="CAST_IRON" baseColor="#334155" opacity={xrayEnabled ? 0.1 : 1} {...state} />
           </mesh>
           {/* Right bank cylinders */}
           <mesh position={[0.35, 0.95, 0]} rotation={[0, 0, -Math.PI/6]}>
             <cylinderGeometry args={[0.2, 0.2, 0.8, 32]} />
             <EngineMaterial materialType="CAST_IRON" baseColor="#334155" opacity={xrayEnabled ? 0.1 : 1} {...state} />
           </mesh>
        </group>
      ))}

      {/* Main bearing caps */}
      {[...Array(7)].map((_, i) => (
        <mesh key={'cap'+i} position={[0, 0, 0.1 + i * 0.5]}>
           <boxGeometry args={[0.5, 0.3, 0.15]} />
           <EngineMaterial materialType="FORGED_STEEL" {...state} />
        </mesh>
      ))}
    </group>
  );
}

export function PistonAssemblyBank({ bank, sign, isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const pistonsRef = useRef<THREE.Group>(null);
  
  // High detail piston
  const pistonShape = useMemo(() => {
    const pts = [];
    pts.push(new THREE.Vector2(0.01, -0.1));
    pts.push(new THREE.Vector2(0.18, -0.1));
    pts.push(new THREE.Vector2(0.19, -0.05));
    // Piston rings grooves
    pts.push(new THREE.Vector2(0.19, -0.01));
    pts.push(new THREE.Vector2(0.17, -0.01));
    pts.push(new THREE.Vector2(0.17, 0.01));
    pts.push(new THREE.Vector2(0.19, 0.01));
    pts.push(new THREE.Vector2(0.19, 0.03));
    pts.push(new THREE.Vector2(0.17, 0.03));
    pts.push(new THREE.Vector2(0.17, 0.05));
    pts.push(new THREE.Vector2(0.19, 0.05));
    pts.push(new THREE.Vector2(0.19, 0.1));
    pts.push(new THREE.Vector2(0.01, 0.1));
    return pts;
  }, []);

  useFrame((sysState) => {
    if (!pistonsRef.current) return;
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;
    
    // Firing order offsets
    const offsets = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));
    
    pistonsRef.current.children.forEach((pistonGrp, i) => {
      const phase = t + offsets[i] + (bank === 'right' ? Math.PI : 0);
      pistonGrp.position.y = Math.sin(phase) * 0.25;
    });
  });

  return (
    <group position={[sign * 0.35, 0.55, -1.3]} rotation={[0, 0, sign * Math.PI/6]}>
      <group ref={pistonsRef}>
        {[...Array(6)].map((_, i) => (
          <group key={'p'+i} position={[0, 0, i * 0.5]}>
             <mesh rotation={[Math.PI/2, 0, 0]}>
               <latheGeometry args={[pistonShape, 32]} />
               <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
             </mesh>
             {/* Wrist pin */}
             <mesh rotation={[0, 0, Math.PI/2]} position={[0, -0.05, 0]}>
               <cylinderGeometry args={[0.04, 0.04, 0.38, 16]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function ConnectingRodsAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const rodsRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (!rodsRef.current) return;
    const t = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;
    const offsets = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));

    // For each pair of rods (left and right bank)
    for (let i = 0; i < 6; i++) {
      const phase = t + offsets[i];
      const crankY = Math.sin(phase) * 0.25;
      const crankX = Math.cos(phase) * 0.25;
      
      const leftRod = rodsRef.current.children[i * 2] as THREE.Group;
      const rightRod = rodsRef.current.children[i * 2 + 1] as THREE.Group;
      
      const leftPistonY = Math.sin(phase) * 0.25;
      const rightPistonY = Math.sin(phase + Math.PI) * 0.25;
      
      // We animate the bottom end of the rod to follow the crankpin
      leftRod.position.set(crankX, crankY, i * 0.5 - 0.05);
      rightRod.position.set(Math.cos(phase + Math.PI)*0.25, Math.sin(phase + Math.PI)*0.25, i * 0.5 + 0.05);
      
      // Calculate angle to wrist pin
      // Left bank wrist pin center:
      const lwpX = -0.35 + leftPistonY * Math.sin(-Math.PI/6);
      const lwpY = 0.55 + leftPistonY * Math.cos(-Math.PI/6);
      leftRod.rotation.z = Math.atan2(lwpY - crankY, lwpX - crankX) - Math.PI/2;

      const rwpX = 0.35 + rightPistonY * Math.sin(Math.PI/6);
      const rwpY = 0.55 + rightPistonY * Math.cos(Math.PI/6);
      rightRod.rotation.z = Math.atan2(rwpY - Math.sin(phase + Math.PI)*0.25, rwpX - Math.cos(phase + Math.PI)*0.25) - Math.PI/2;
    }
  });

  return (
    <group position={[0, -0.4, -1.3]} ref={rodsRef}>
      {[...Array(6)].map((_, i) => (
        <React.Fragment key={'rodpair'+i}>
          {/* Left rod */}
          <group>
             <mesh position={[0, 0.25, 0]}>
               <boxGeometry args={[0.08, 0.5, 0.05]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
             <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
               <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
          </group>
          {/* Right rod */}
          <group>
             <mesh position={[0, 0.25, 0]}>
               <boxGeometry args={[0.08, 0.5, 0.05]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
             <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
               <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
          </group>
        </React.Fragment>
      ))}
    </group>
  );
}

export function CrankshaftAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const crankRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (crankRef.current) crankRef.current.rotation.z = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * (v12Rpm / 60) * Math.PI * 2 * v12Direction;
  });

  const offsets = [0, 4, 1, 5, 2, 3].map(v => v * (Math.PI / 3));

  return (
    <group position={[0, -0.4, -1.5]} ref={crankRef}>
      {/* Main journals */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 1.45]}>
        <cylinderGeometry args={[0.1, 0.1, 3.2, 32]} />
        <EngineMaterial materialType="FORGED_STEEL" {...state} />
      </mesh>
      
      {/* Crank webs and pins */}
      {[...Array(6)].map((_, i) => {
         const phase = offsets[i];
         const r = 0.25;
         const cx = Math.cos(phase) * r;
         const cy = Math.sin(phase) * r;
         return (
           <group key={'crank'+i} position={[0, 0, 0.2 + i * 0.5]}>
             <mesh position={[cx/2, cy/2, -0.1]} rotation={[0, 0, phase]}>
               <boxGeometry args={[r + 0.15, 0.2, 0.08]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
             {/* Crankpin */}
             <mesh position={[cx, cy, 0]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.2, 24]} />
                <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
             <mesh position={[cx/2, cy/2, 0.1]} rotation={[0, 0, phase]}>
               <boxGeometry args={[r + 0.15, 0.2, 0.08]} />
               <EngineMaterial materialType="FORGED_STEEL" {...state} />
             </mesh>
           </group>
         );
      })}
    </group>
  );
}

export function ValvetrainAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef, v12Rpm = 600, v12Direction = 1 }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  
  return (
    <group position={[0, -0.4, -1.5]}>
      {/* Left Bank Cams & Valves */}
      <group position={[-0.5, 1.4, 0]} rotation={[0, 0, Math.PI/6]}>
        <mesh position={[-0.1, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.05, 0.05, 3.0, 16]} />
           <EngineMaterial materialType="TITANIUM" {...state} />
        </mesh>
        <mesh position={[0.1, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.05, 0.05, 3.0, 16]} />
           <EngineMaterial materialType="TITANIUM" {...state} />
        </mesh>
        {/* Valve cover */}
        <mesh position={[0, 0.15, 1.45]}>
           <boxGeometry args={[0.4, 0.1, 3.1]} />
           <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#ef4444" {...state} />
        </mesh>
      </group>

      {/* Right Bank Cams & Valves */}
      <group position={[0.5, 1.4, 0]} rotation={[0, 0, -Math.PI/6]}>
        <mesh position={[-0.1, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.05, 0.05, 3.0, 16]} />
           <EngineMaterial materialType="TITANIUM" {...state} />
        </mesh>
        <mesh position={[0.1, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
           <cylinderGeometry args={[0.05, 0.05, 3.0, 16]} />
           <EngineMaterial materialType="TITANIUM" {...state} />
        </mesh>
        {/* Valve cover */}
        <mesh position={[0, 0.15, 1.45]}>
           <boxGeometry args={[0.4, 0.1, 3.1]} />
           <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#ef4444" {...state} />
        </mesh>
      </group>
    </group>
  );
}

export function IntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, -0.4, -1.5]}>
      {/* Main Plenum Bodies */}
      <mesh position={[-0.2, 1.4, 1.45]}>
        <boxGeometry args={[0.2, 0.2, 2.8]} />
        <EngineMaterial materialType="CARBON_FIBER" {...state} />
      </mesh>
      <mesh position={[0.2, 1.4, 1.45]}>
        <boxGeometry args={[0.2, 0.2, 2.8]} />
        <EngineMaterial materialType="CARBON_FIBER" {...state} />
      </mesh>
      
      {/* Throttle bodies */}
      <mesh position={[-0.2, 1.4, -0.1]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      <mesh position={[0.2, 1.4, -0.1]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 32]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>

      {/* Intake runners (simplified for speed but material makes it pop) */}
      {[...Array(6)].map((_, i) => (
        <group key={'runner'+i} position={[0, 0, 0.2 + i * 0.5]}>
          <mesh position={[-0.35, 1.25, 0]} rotation={[0, 0, Math.PI/4]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 16]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#333333" {...state} />
          </mesh>
          <mesh position={[0.35, 1.25, 0]} rotation={[0, 0, -Math.PI/4]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 16]} />
            <EngineMaterial materialType="PLASTIC" baseColor="#333333" {...state} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ExhaustManifold({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, -0.4, -1.5]}>
      <group position={[-0.8, 0.5, 0]}>
        <mesh position={[0, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 24]} />
          <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
        </mesh>
        {[...Array(6)].map((_, i) => (
          <mesh key={'exl'+i} position={[0.2, 0.4, 0.2 + i * 0.5]} rotation={[0, 0, -Math.PI/4]}>
             <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
             <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
          </mesh>
        ))}
      </group>
      
      <group position={[0.8, 0.5, 0]}>
        <mesh position={[0, 0, 1.45]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 24]} />
          <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
        </mesh>
        {[...Array(6)].map((_, i) => (
          <mesh key={'exr'+i} position={[-0.2, 0.4, 0.2 + i * 0.5]} rotation={[0, 0, Math.PI/4]}>
             <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
             <EngineMaterial materialType="TITANIUM" baseColor="#8b5cf6" {...state} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CoolingSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  const fanRef = useRef<THREE.Group>(null);
  
  useFrame((sysState) => {
    if (fanRef.current) fanRef.current.rotation.z = (state.sysTimeRef?.current ?? sysState.clock.elapsedTime) * 15;
  });

  return (
    <group position={[0, -0.4, 1.4]}>
      {/* Water pump */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 32]} rotation={[Math.PI/2, 0, 0]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      <mesh position={[0, 0.3, 0.2]} ref={fanRef}>
        <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} rotation={[Math.PI/2, 0, 0]} />
        <EngineMaterial materialType="PLASTIC" {...state} />
        {[...Array(7)].map((_, i) => (
          <mesh key={'blade'+i} rotation={[0, 0, i * (Math.PI * 2 / 7)]} position={[0, 0.2, 0]}>
             <boxGeometry args={[0.08, 0.35, 0.02]} />
             <EngineMaterial materialType="PLASTIC" {...state} />
          </mesh>
        ))}
      </mesh>
      {/* Hoses */}
      <mesh position={[-0.3, 0.8, -0.2]} rotation={[Math.PI/4, Math.PI/6, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.8, 16]} />
        <EngineMaterial materialType="RUBBER" {...state} />
      </mesh>
    </group>
  );
}

export function LubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, -0.4, -1.5]}>
      {/* Oil Pan */}
      <mesh position={[0, -0.3, 1.45]}>
        <boxGeometry args={[0.8, 0.25, 3.0]} />
        <EngineMaterial materialType="CAST_ALUMINUM" baseColor="#334155" {...state} />
      </mesh>
      {/* Oil Filter */}
      <mesh position={[-0.45, -0.2, 0.5]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 24]} />
        <EngineMaterial materialType="CAST_IRON" baseColor="#0f172a" {...state} />
      </mesh>
    </group>
  );
}

export function ElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled, sysTimeRef };
  return (
    <group position={[0, -0.4, -1.5]}>
      {/* ECU */}
      <mesh position={[0, 1.6, -0.2]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <EngineMaterial materialType="CAST_ALUMINUM" {...state} />
      </mesh>
      {/* Ignition Coils */}
      {[...Array(6)].map((_, i) => (
        <group key={'coil'+i} position={[0, 0, 0.2 + i * 0.5]}>
           <mesh position={[-0.4, 1.35, 0]} rotation={[0, 0, Math.PI/6]}>
             <cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />
             <EngineMaterial materialType="PLASTIC" baseColor="#dc2626" {...state} />
           </mesh>
           <mesh position={[0.4, 1.35, 0]} rotation={[0, 0, -Math.PI/6]}>
             <cylinderGeometry args={[0.03, 0.03, 0.1, 12]} />
             <EngineMaterial materialType="PLASTIC" baseColor="#dc2626" {...state} />
           </mesh>
        </group>
      ))}
    </group>
  );
}
`
fs.writeFileSync('src/generators/MechanicalGenerator.tsx', code);
