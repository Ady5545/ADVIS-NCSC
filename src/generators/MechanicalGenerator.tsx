import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBox, Cylinder, Box, Tube } from '@react-three/drei';

interface HolographicMaterialProps {
  baseColor: string;
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  opacity?: number;
}

export function EngineMaterial({ baseColor, isHovered, isSelected, xrayEnabled, blueprintEnabled, opacity = 1 }: HolographicMaterialProps) {
  if (blueprintEnabled) {
    return <meshBasicMaterial color="#06b6d4" wireframe={true} transparent opacity={0.4} />;
  }
  
  if (xrayEnabled) {
    return (
      <meshPhysicalMaterial 
        color={baseColor} 
        transparent={true} 
        opacity={0.2}
        roughness={0.1}
        metalness={0.8}
        transmission={0.9}
        ior={1.5}
        emissive={isSelected ? "#0ea5e9" : (isHovered ? "#38bdf8" : "#000000")}
        emissiveIntensity={isSelected ? 0.8 : (isHovered ? 0.4 : 0)}
      />
    );
  }

  return (
    <meshStandardMaterial 
      color={baseColor} 
      roughness={0.5} 
      metalness={0.7}
      transparent={opacity < 1}
      opacity={opacity}
      emissive={isSelected ? "#0ea5e9" : (isHovered ? "#0284c7" : "#000000")}
      emissiveIntensity={isSelected ? 0.5 : (isHovered ? 0.3 : 0)}
      wireframe={isSelected}
    />
  );
}

// ----------------------------------------------------
// INDIVIDUAL COMPONENTS (RELATIVE TO CRANK AXIS: [0, -0.3, 0])
// ----------------------------------------------------

export function EngineBlockAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  
  return (
    <group position={[0, -0.3, 0]}>
      <RoundedBox args={[0.9, 0.6, 2.8]} position={[0, 0.2, 0]} radius={0.05} smoothness={4}>
        <EngineMaterial baseColor="#334155" {...state} />
      </RoundedBox>
      
      {[...Array(5)].map((_, i) => (
        <group key={`rib-${i}`}>
          <Box args={[0.95, 0.4, 0.05]} position={[0, 0.2, -1.0 + i * 0.5]}>
            <EngineMaterial baseColor="#1e293b" {...state} />
          </Box>
        </group>
      ))}

      <Cylinder args={[0.6, 0.6, 0.2, 32]} position={[0, 0.2, -1.5]} rotation={[Math.PI/2, 0, 0]}>
         <EngineMaterial baseColor="#475569" {...state} />
      </Cylinder>
      {[...Array(8)].map((_, i) => (
        <Box key={`bell-rib-${i}`} args={[1.25, 0.05, 0.15]} position={[0, 0.2, -1.45]} rotation={[0, 0, i * Math.PI/8]}>
           <EngineMaterial baseColor="#334155" {...state} />
        </Box>
      ))}

      <Box args={[0.8, 0.7, 0.15]} position={[0, 0.4, 1.45]}>
         <EngineMaterial baseColor="#475569" {...state} />
      </Box>

      {[...Array(7)].map((_, i) => (
        <Box key={i} args={[0.8, 0.2, 0.1]} position={[0, 0, -1.3 + i * (2.6 / 6)]}>
          <EngineMaterial baseColor="#1e293b" {...state} />
        </Box>
      ))}

      <CylinderBank sign={-1} state={state} />
      <CylinderBank sign={1} state={state} />
    </group>
  );
}

function CylinderBank({ sign, state }: any) {
  const angle = (Math.PI / 6) * -sign; 
  return (
    <group rotation={[0, 0, angle]}>
      <Box args={[0.4, 0.4, 2.7]} position={[0, 0.5, 0]}>
        <EngineMaterial baseColor="#475569" {...state} opacity={state.xrayEnabled ? 0.1 : 0.95} />
      </Box>
      <Box args={[0.45, 0.4, 2.75]} position={[0, 0.9, 0]}>
        <EngineMaterial baseColor="#475569" {...state} opacity={state.xrayEnabled ? 0.1 : 0.95} />
      </Box>
      <Box args={[0.48, 0.02, 2.78]} position={[0, 0.69, 0]}>
        <EngineMaterial baseColor="#94a3b8" {...state} />
      </Box>
      {[...Array(6)].map((_, i) => (
        <Cylinder key={i} args={[0.15, 0.15, 0.55, 32]} position={[0, 0.5, -1.1 + i * 0.44]}>
          <EngineMaterial baseColor="#0f172a" {...state} opacity={0.8} />
        </Cylinder>
      ))}
      {[...Array(6)].map((_, i) => (
        <Cylinder key={`boss-${i}`} args={[0.04, 0.04, 0.2, 12]} position={[sign * -0.15, 0.9, -1.1 + i * 0.44]} rotation={[0, 0, sign * Math.PI/8]}>
          <EngineMaterial baseColor="#cbd5e1" {...state} />
        </Cylinder>
      ))}
    </group>
  );
}

export function PistonAssemblyBank({ sign, isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      {[...Array(6)].map((_, i) => (
        <PistonKinematics key={i} index={i} sign={sign} z={-1.1 + i * 0.44} state={state} renderRods={false} />
      ))}
    </group>
  );
}

export function ConnectingRodsAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      {[...Array(6)].map((_, i) => (
        <group key={`rods-${i}`}>
          <PistonKinematics index={i} sign={-1} z={-1.1 + i * 0.44} state={state} renderPistons={false} />
          <PistonKinematics index={i} sign={1} z={-1.1 + i * 0.44} state={state} renderPistons={false} />
        </group>
      ))}
    </group>
  );
}

function PistonKinematics({ index, sign, z, state, renderPistons = true, renderRods = true }: any) {
  const pistonRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Group>(null);
  const angle = (Math.PI / 6) * -sign;

  useFrame((sysState) => {
    if (!pistonRef.current && !rodRef.current) return;
    const t = sysState.clock.elapsedTime;
    const rps = 600 / 60;
    const phaseOffset = index * (Math.PI / 3); 
    const crankRadius = 0.15;
    const rodLength = 0.55;
    
    const theta = (t * rps * Math.PI * 2) + phaseOffset;
    const pinX = crankRadius * Math.sin(theta);
    const pinY = crankRadius * Math.cos(theta);

    const localX = pinX * Math.cos(-angle) - pinY * Math.sin(-angle);
    const localY = pinX * Math.sin(-angle) + pinY * Math.cos(-angle);
    
    const pistonLocalY = Math.sqrt(rodLength * rodLength - localX * localX) + localY;
    const rodAngle = Math.asin(localX / rodLength);
    
    if (pistonRef.current) pistonRef.current.position.y = pistonLocalY;
    if (rodRef.current) {
      rodRef.current.position.set(localX, localY, 0);
      rodRef.current.rotation.z = -rodAngle;
    }
  });

  return (
    <group position={[0, 0, z]} rotation={[0, 0, angle]}>
      {renderPistons && (
        <group ref={pistonRef}>
          <Cylinder args={[0.145, 0.145, 0.12, 32]} position={[0, 0, 0]}>
            <EngineMaterial baseColor="#94a3b8" {...state} />
          </Cylinder>
          <Box args={[0.2, 0.08, 0.1]} position={[0, -0.05, 0]}>
            <EngineMaterial baseColor="#94a3b8" {...state} />
          </Box>
          <Cylinder args={[0.146, 0.146, 0.01, 32]} position={[0, 0.04, 0]}>
            <EngineMaterial baseColor="#334155" {...state} />
          </Cylinder>
        </group>
      )}

      {renderRods && (
        <group ref={rodRef}>
          <Box args={[0.06, 0.45, 0.08]} position={[0, 0.225, 0]}>
            <EngineMaterial baseColor="#64748b" {...state} />
          </Box>
          <Cylinder args={[0.08, 0.08, 0.09, 24]} position={[0, 0.45, 0]} rotation={[Math.PI/2, 0, 0]}>
            <EngineMaterial baseColor="#64748b" {...state} />
          </Cylinder>
          <Cylinder args={[0.12, 0.12, 0.1, 32]} position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <EngineMaterial baseColor="#64748b" {...state} />
          </Cylinder>
          <Cylinder args={[0.02, 0.02, 0.14, 12]} position={[-0.08, -0.05, 0]}>
             <EngineMaterial baseColor="#cbd5e1" {...state} />
          </Cylinder>
          <Cylinder args={[0.02, 0.02, 0.14, 12]} position={[0.08, -0.05, 0]}>
             <EngineMaterial baseColor="#cbd5e1" {...state} />
          </Cylinder>
        </group>
      )}
    </group>
  );
}

export function CrankshaftAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  const crankRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (crankRef.current) crankRef.current.rotation.z = sysState.clock.elapsedTime * (600 / 60) * Math.PI * 2;
  });

  return (
    <group ref={crankRef} position={[0, -0.3, 0]}>
      <Cylinder args={[0.08, 0.08, 3.1, 32]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#cbd5e1" {...state} />
      </Cylinder>
      
      <Cylinder args={[0.5, 0.5, 0.1, 32]} position={[0, 0, -1.6]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#94a3b8" {...state} />
      </Cylinder>
      <Cylinder args={[0.52, 0.52, 0.08, 64]} position={[0, 0, -1.6]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#475569" {...state} />
      </Cylinder>
      
      <Cylinder args={[0.15, 0.15, 0.15, 32]} position={[0, 0, 1.55]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#1e293b" {...state} />
      </Cylinder>
      
      {[...Array(6)].map((_, i) => {
        const z = -1.1 + i * 0.44;
        const phaseOffset = i * (Math.PI / 3);
        return (
          <group key={i} position={[0, 0, z]} rotation={[0, 0, phaseOffset]}>
            <Cylinder args={[0.07, 0.07, 0.18, 24]} position={[0, 0.15, 0]} rotation={[Math.PI/2, 0, 0]}>
              <EngineMaterial baseColor="#cbd5e1" {...state} />
            </Cylinder>
            <Cylinder args={[0.18, 0.18, 0.12, 24, 1, false, 0, Math.PI]} rotation={[Math.PI/2, 0, -Math.PI/2]}>
               <EngineMaterial baseColor="#94a3b8" {...state} />
            </Cylinder>
            <Box args={[0.12, 0.35, 0.06]} position={[0, 0.02, 0.12]}>
              <EngineMaterial baseColor="#94a3b8" {...state} />
            </Box>
            <Box args={[0.12, 0.35, 0.06]} position={[0, 0.02, -0.12]}>
              <EngineMaterial baseColor="#94a3b8" {...state} />
            </Box>
          </group>
        );
      })}
    </group>
  );
}

export function ValvetrainAssembly({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      <ValveBank sign={-1} state={state} />
      <ValveBank sign={1} state={state} />
    </group>
  );
}

function ValveBank({ sign, state }: any) {
  const camRef = useRef<THREE.Group>(null);
  useFrame((sysState) => {
    if (camRef.current) camRef.current.rotation.z = sysState.clock.elapsedTime * (600 / 60 / 2) * Math.PI * 2;
  });
  const angle = (Math.PI / 6) * -sign;
  return (
    <group rotation={[0, 0, angle]}>
      <group position={[0, 1.15, 0]}>
        <RoundedBox args={[0.35, 0.12, 2.8]} radius={0.02} position={[0, 0.06, 0]}>
           <EngineMaterial baseColor="#475569" {...state} opacity={state.xrayEnabled ? 0.2 : 0.95} />
        </RoundedBox>
        <Box args={[0.37, 0.02, 2.82]} position={[0, -0.01, 0]}>
           <EngineMaterial baseColor="#94a3b8" {...state} /> 
        </Box>
        {[...Array(6)].map((_, i) => (
          <Box key={i} args={[0.36, 0.03, 0.03]} position={[0, 0.12, -1.1 + i * 0.44]}>
            <EngineMaterial baseColor="#334155" {...state} />
          </Box>
        ))}
        <group ref={camRef} position={[0, -0.1, 0]}>
          <Cylinder args={[0.04, 0.04, 2.75, 12]} position={[-0.08, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <EngineMaterial baseColor="#cbd5e1" {...state} />
          </Cylinder>
          <Cylinder args={[0.04, 0.04, 2.75, 12]} position={[0.08, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <EngineMaterial baseColor="#cbd5e1" {...state} />
          </Cylinder>
        </group>
      </group>
    </group>
  );
}

function CurvedIntakeRunner({ start, end, control, state }: any) {
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(...control),
    new THREE.Vector3(...end)
  ), [start, end, control]);
  return (
    <Tube args={[curve, 16, 0.05, 12, false]}>
      <EngineMaterial baseColor="#991b1b" {...state} />
    </Tube>
  );
}

export function IntakePlenum({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      <RoundedBox args={[0.25, 0.25, 2.8]} position={[-0.2, 1.4, 0]} radius={0.05} smoothness={4}>
        <EngineMaterial baseColor="#dc2626" {...state} />
      </RoundedBox>
      <RoundedBox args={[0.25, 0.25, 2.8]} position={[0.2, 1.4, 0]} radius={0.05} smoothness={4}>
        <EngineMaterial baseColor="#dc2626" {...state} />
      </RoundedBox>
      
      <Cylinder args={[0.1, 0.1, 0.2, 32]} position={[-0.2, 1.4, 1.45]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#94a3b8" {...state} />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 0.2, 32]} position={[0.2, 1.4, 1.45]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#94a3b8" {...state} />
      </Cylinder>

      <Cylinder args={[0.06, 0.06, 0.4, 16]} position={[0, 1.4, -1.0]} rotation={[0, 0, Math.PI/2]}>
        <EngineMaterial baseColor="#b91c1c" {...state} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.4, 16]} position={[0, 1.4, 1.0]} rotation={[0, 0, Math.PI/2]}>
        <EngineMaterial baseColor="#b91c1c" {...state} />
      </Cylinder>

      {[...Array(6)].map((_, i) => (
        <group key={`in-${i}`}>
          <CurvedIntakeRunner 
             start={[-0.28, 0.9, -1.1 + i * 0.44]} 
             control={[0, 1.1, -1.1 + i * 0.44]}
             end={[0.1, 1.3, -1.1 + i * 0.44]}
             state={state} 
          />
          <CurvedIntakeRunner 
             start={[0.28, 0.9, -1.1 + i * 0.44]} 
             control={[0, 1.1, -1.1 + i * 0.44]}
             end={[-0.1, 1.3, -1.1 + i * 0.44]}
             state={state} 
          />
        </group>
      ))}
    </group>
  );
}

function CurvedExhaustRunner({ start, end, control, state }: any) {
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    new THREE.Vector3(...control),
    new THREE.Vector3(...end)
  ), [start, end, control]);
  return (
    <Tube args={[curve, 16, 0.06, 12, false]}>
      <EngineMaterial baseColor="#92400e" {...state} />
    </Tube>
  );
}

export function ExhaustManifold({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      <group position={[-1.0, 0.1, 0]}>
        <Cylinder args={[0.1, 0.1, 2.6, 24]} rotation={[Math.PI/2, 0, 0]}>
          <EngineMaterial baseColor="#78350f" {...state} />
        </Cylinder>
        {[...Array(6)].map((_, i) => (
          <group key={`exl-${i}`}>
            <Box args={[0.05, 0.2, 0.2]} position={[0.38, 0.58, -1.1 + i * 0.44]} rotation={[0, 0, Math.PI/6]}>
               <EngineMaterial baseColor="#57534e" {...state} />
            </Box>
            <CurvedExhaustRunner 
              start={[0.38, 0.58, -1.1 + i * 0.44]} 
              control={[0.2, 0.5, -1.1 + i * 0.44]} 
              end={[0, 0.1, -1.1 + i * 0.44]} 
              state={state} 
            />
          </group>
        ))}
      </group>
      <group position={[1.0, 0.1, 0]}>
        <Cylinder args={[0.1, 0.1, 2.6, 24]} rotation={[Math.PI/2, 0, 0]}>
          <EngineMaterial baseColor="#78350f" {...state} />
        </Cylinder>
        {[...Array(6)].map((_, i) => (
          <group key={`exr-${i}`}>
            <Box args={[0.05, 0.2, 0.2]} position={[-0.38, 0.58, -1.1 + i * 0.44]} rotation={[0, 0, -Math.PI/6]}>
               <EngineMaterial baseColor="#57534e" {...state} />
            </Box>
            <CurvedExhaustRunner 
              start={[-0.38, 0.58, -1.1 + i * 0.44]} 
              control={[-0.2, 0.5, -1.1 + i * 0.44]} 
              end={[0, 0.1, -1.1 + i * 0.44]} 
              state={state} 
            />
          </group>
        ))}
      </group>
    </group>
  );
}

export function CoolingSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  const fanRef = useRef<THREE.Group>(null);

  useFrame((sysState) => {
    if (fanRef.current) fanRef.current.rotation.z = sysState.clock.elapsedTime * 15;
  });

  return (
    <group position={[0, 0.1, 1.5]}>
      <Cylinder args={[0.18, 0.18, 0.2, 32]} rotation={[Math.PI/2, 0, 0]}>
        <EngineMaterial baseColor="#0284c7" {...state} />
      </Cylinder>
      <Box args={[0.2, 0.25, 0.2]} position={[0, 0.3, -0.1]}>
        <EngineMaterial baseColor="#0369a1" {...state} />
      </Box>
      <Cylinder args={[0.06, 0.06, 1.2, 16]} position={[-0.35, 0.1, -0.5]} rotation={[Math.PI/2, Math.PI/6, 0]}>
        <EngineMaterial baseColor="#38bdf8" {...state} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 1.2, 16]} position={[0.35, 0.1, -0.5]} rotation={[Math.PI/2, -Math.PI/6, 0]}>
        <EngineMaterial baseColor="#38bdf8" {...state} />
      </Cylinder>

      <group position={[0, 0, 0.15]} ref={fanRef}>
        <Cylinder args={[0.05, 0.05, 0.05, 16]} rotation={[Math.PI/2, 0, 0]}>
          <EngineMaterial baseColor="#1e293b" {...state} />
        </Cylinder>
        {[...Array(7)].map((_, i) => (
          <group key={`blade-${i}`} rotation={[0, 0, i * (Math.PI * 2 / 7)]}>
            <Box args={[0.08, 0.35, 0.02]} position={[0, 0.2, 0]} rotation={[Math.PI/6, 0, 0]} >
              <EngineMaterial baseColor="#0f172a" {...state} />
            </Box>
          </group>
        ))}
      </group>
    </group>
  );
}

export function LubricationSystem({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      <Box args={[0.9, 0.2, 2.8]} position={[0, -0.2, 0]}>
        <EngineMaterial baseColor="#b45309" {...state} />
      </Box>
      <Box args={[0.7, 0.3, 1.2]} position={[0, -0.45, 0.8]}>
        <EngineMaterial baseColor="#92400e" {...state} />
      </Box>
      {[...Array(8)].map((_, i) => (
        <Box key={`fin-${i}`} args={[0.75, 0.02, 0.1]} position={[0, -0.58, 0.3 + i * 0.14]}>
          <EngineMaterial baseColor="#78350f" {...state} />
        </Box>
      ))}
      <Cylinder args={[0.12, 0.12, 0.25, 24]} position={[-0.5, -0.1, -1.0]} rotation={[0, 0, Math.PI/4]}>
        <EngineMaterial baseColor="#1e293b" {...state} />
      </Cylinder>
    </group>
  );
}

export function ElectronicsSensors({ isHovered, isSelected, xrayEnabled, blueprintEnabled }: any) {
  const state = { isHovered, isSelected, xrayEnabled, blueprintEnabled };
  return (
    <group position={[0, -0.3, 0]}>
      <Box args={[0.4, 0.25, 0.1]} position={[0, 1.4, -1.5]}>
        <EngineMaterial baseColor="#16a34a" {...state} />
      </Box>
      <Box args={[0.3, 0.1, 0.05]} position={[0, 1.25, -1.55]}>
        <EngineMaterial baseColor="#22c55e" {...state} />
      </Box>

      <group rotation={[0, 0, Math.PI / 6]}>
        <group position={[0, 1.15, 0]}>
          {[...Array(6)].map((_, i) => (
            <Cylinder key={`coil-l-${i}`} args={[0.03, 0.03, 0.12, 12]} position={[0, 0.08, -1.1 + i * 0.44]}>
              <EngineMaterial baseColor="#dc2626" {...state} />
            </Cylinder>
          ))}
        </group>
      </group>
      <group rotation={[0, 0, -Math.PI / 6]}>
        <group position={[0, 1.15, 0]}>
          {[...Array(6)].map((_, i) => (
            <Cylinder key={`coil-r-${i}`} args={[0.03, 0.03, 0.12, 12]} position={[0, 0.08, -1.1 + i * 0.44]}>
              <EngineMaterial baseColor="#dc2626" {...state} />
            </Cylinder>
          ))}
        </group>
      </group>
    </group>
  );
}
