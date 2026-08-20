import { GenericChemistryVisuals } from './GenericChemistryVisuals';
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, Text, Torus, Box } from '@react-three/drei';
import * as THREE from 'three';

interface ChemistryVisualsProps {
  visualStateId: string;
}

export function ChemistryVisuals({ visualStateId }: ChemistryVisualsProps) {
  // Use generic visualizer if it's not a legacy BF3 state
  if (!visualStateId.startsWith('bf3_')) {
     const entityName = visualStateId.split('_')[0];
     return <GenericChemistryVisuals entityName={entityName} stateId={visualStateId} />;
  }

  const groupRef = useRef<THREE.Group>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const handleReplay = () => setReplayKey(k => k + 1);
    window.addEventListener('ADVIS_LEARN_REPLAY_STEP', handleReplay);
    return () => window.removeEventListener('ADVIS_LEARN_REPLAY_STEP', handleReplay);
  }, []);

  // Use replayKey to force remount/re-animation of specific states
  return (
    <group ref={groupRef} key={`${visualStateId}-${replayKey}`}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      
      {visualStateId === 'bf3_central_atom' && <BF3Step1 />}
      {visualStateId === 'bf3_ground_state' && <BF3Step2 />}
      {visualStateId === 'bf3_valence_electrons' && <BF3Step3 />}
      {visualStateId === 'bf3_excitation' && <BF3Step4 />}
      {visualStateId === 'bf3_hybridisation' && <BF3Step5 />}
      {visualStateId === 'bf3_empty_p' && <BF3Step6 />}
      {visualStateId === 'bf3_fluorine_atoms' && <BF3Step7 />}
      {visualStateId === 'bf3_sigma_bonds' && <BF3Step8 />}
      {(visualStateId === 'bf3_geometry' || visualStateId === 'bf3_summary') && <BF3Step9 />}
    </group>
  );
}

// Reusable Atom component
function Atom({ position, color, size, label, pulse = false }: any) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulse && ref.current) {
      const s = size + Math.sin(clock.elapsedTime * 4) * 0.05;
      ref.current.scale.set(s, s, s);
    }
  });
  return (
    <group position={position}>
      <Sphere ref={ref} args={[1, 32, 32]} scale={size}>
        <meshPhysicalMaterial 
          color={color} 
          transmission={0.5} 
          opacity={0.9} 
          transparent 
          roughness={0.1} 
          metalness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </Sphere>
      <Text position={[0, size + 0.3, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

// Reusable Orbital component (Lobes)
function Orbital({ position, rotation, color, scale, isHybrid = false }: any) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Sphere args={[1, 32, 32]} scale={[0.4, 1.2, 0.4]} position={[0, 1.2, 0]}>
         <meshPhysicalMaterial color={color} transparent opacity={0.6} roughness={0.3} transmission={0.6} clearcoat={1} />
      </Sphere>
      {/* If it's a p-orbital, it has a bottom lobe too. If it's hybrid sp2, bottom lobe is very small */}
      <Sphere args={[1, 32, 32]} scale={[0.4, isHybrid ? 0.3 : 1.2, 0.4]} position={[0, isHybrid ? -0.3 : -1.2, 0]}>
         <meshPhysicalMaterial color={color} transparent opacity={0.4} roughness={0.3} />
      </Sphere>
    </group>
  );
}

// Reusable Electron
function Electron({ position, label }: any) {
  return (
    <group position={position}>
      <Sphere args={[0.08, 16, 16]}>
        <meshBasicMaterial color="#fbbf24" />
      </Sphere>
      {label && <Text position={[0.2, 0, 0]} fontSize={0.15} color="#fbbf24">{label}</Text>}
    </group>
  );
}

// Step 1: Boron Central
function BF3Step1() {
  return (
    <Float speed={2} rotationIntensity={0.2}>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.8} label="Boron (B)" pulse />
      <Atom position={[3, 1, 0]} color="#34d399" size={0.6} label="F" />
      <Atom position={[-2, 2, 0]} color="#34d399" size={0.6} label="F" />
      <Atom position={[-1, -2, 0]} color="#34d399" size={0.6} label="F" />
    </Float>
  );
}

// Step 2 & 3: Ground state & Valence
function BF3Step2() {
  return (
    <group>
      <Text position={[0, 3, 0]} fontSize={0.3} color="white">Valence Shell (n=2)</Text>
      
      <group position={[-2, 0, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="cyan">2s</Text>
        <Box args={[1.2, 1.2, 0.1]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Electron position={[-0.2, 0, 0]} label="↑" />
        <Electron position={[0.2, 0, 0]} label="↓" />
      </group>
      
      <group position={[2, 0, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="cyan">2p</Text>
        <Box args={[1.2, 1.2, 0.1]} position={[-1.3, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Box args={[1.2, 1.2, 0.1]} position={[0, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Box args={[1.2, 1.2, 0.1]} position={[1.3, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Electron position={[-1.3, 0, 0]} label="↑" />
      </group>
    </group>
  );
}

function BF3Step3() {
  return <BF3Step2 />;
}

// Step 4: Excitation
function BF3Step4() {
  const elecRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // simple animation of electron moving from 2s to 2p
    if (elecRef.current) {
      const t = Math.min(clock.elapsedTime, 1.5) / 1.5; 
      // start: [-1.8, 0, 0], end: [2, 0, 0] (middle 2p box)
      elecRef.current.position.x = -1.8 + t * 3.8;
      // parabolic arc
      elecRef.current.position.y = Math.sin(t * Math.PI) * 1.5;
    }
  });

  return (
    <group>
      <Text position={[0, 3, 0]} fontSize={0.3} color="#f43f5e">Excited State</Text>
      
      <group position={[-2, 0, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="cyan">2s</Text>
        <Box args={[1.2, 1.2, 0.1]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Electron position={[-0.2, 0, 0]} label="↑" />
      </group>
      
      <group position={[2, 0, 0]}>
        <Text position={[0, 1.5, 0]} fontSize={0.2} color="cyan">2p</Text>
        <Box args={[1.2, 1.2, 0.1]} position={[-1.3, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Box args={[1.2, 1.2, 0.1]} position={[0, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Box args={[1.2, 1.2, 0.1]} position={[1.3, 0, 0]}><meshBasicMaterial color="#0891b2" wireframe /></Box>
        <Electron position={[-1.3, 0, 0]} label="↑" />
      </group>

      <group ref={elecRef}>
        <Electron position={[0, 0, 0]} label="↑" />
      </group>
    </group>
  );
}

// Step 5: Hybridisation (sp2 orbitals forming)
function BF3Step5() {
  return (
    <Float rotationIntensity={0.5}>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.5} label="B (sp²)" />
      
      {/* 3 sp2 orbitals at 120 degrees in XY plane */}
      <Orbital position={[0, 0, 0]} rotation={[0, 0, 0]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (2 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (4 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />

      <Electron position={[0, 1.8, 0]} />
      <Electron position={[1.55, -0.9, 0]} />
      <Electron position={[-1.55, -0.9, 0]} />
    </Float>
  );
}

// Step 6: Empty p orbital
function BF3Step6() {
  return (
    <Float rotationIntensity={0.5}>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.5} label="B" />
      
      {/* 3 sp2 orbitals in XY plane, slightly faded */}
      <Orbital position={[0, 0, 0]} rotation={[0, 0, 0]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (2 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (4 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />

      {/* Empty p orbital in Z axis */}
      <Orbital position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color="#3b82f6" scale={1.5} isHybrid={false} />
      <Text position={[0, 0, 2.5]} fontSize={0.2} color="#60a5fa">Empty 2p orbital</Text>
    </Float>
  );
}

// Step 7: Fluorine Atoms Approach
function BF3Step7() {
  const fRef1 = useRef<THREE.Group>(null);
  const fRef2 = useRef<THREE.Group>(null);
  const fRef3 = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = Math.min(clock.elapsedTime, 2) / 2; 
    // Animate from distance 4 to distance 2
    const d = 4 - 2 * t;
    if (fRef1.current) fRef1.current.position.set(0, d, 0);
    if (fRef2.current) fRef2.current.position.set(Math.sin((2 * Math.PI) / 3) * d, Math.cos((2 * Math.PI) / 3) * d, 0);
    if (fRef3.current) fRef3.current.position.set(Math.sin((4 * Math.PI) / 3) * d, Math.cos((4 * Math.PI) / 3) * d, 0);
  });

  return (
    <group>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.5} label="B" />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, 0]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (2 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />
      <Orbital position={[0, 0, 0]} rotation={[0, 0, (4 * Math.PI) / 3]} color="#a855f7" scale={1.2} isHybrid={true} />

      <group ref={fRef1}>
         <Atom position={[0, 0, 0]} color="#34d399" size={0.6} label="F" />
         <Orbital position={[0, -0.6, 0]} rotation={[0, 0, 0]} color="#10b981" scale={0.8} isHybrid={false} />
         <Electron position={[0, -1.2, 0]} label="↓" />
      </group>
      
      <group ref={fRef2} rotation={[0, 0, -(2 * Math.PI) / 3]}>
         <Atom position={[0, 0, 0]} color="#34d399" size={0.6} label="F" />
         <Orbital position={[0, -0.6, 0]} rotation={[0, 0, 0]} color="#10b981" scale={0.8} isHybrid={false} />
         <Electron position={[0, -1.2, 0]} label="↓" />
      </group>

      <group ref={fRef3} rotation={[0, 0, -(4 * Math.PI) / 3]}>
         <Atom position={[0, 0, 0]} color="#34d399" size={0.6} label="F" />
         <Orbital position={[0, -0.6, 0]} rotation={[0, 0, 0]} color="#10b981" scale={0.8} isHybrid={false} />
         <Electron position={[0, -1.2, 0]} label="↓" />
      </group>
    </group>
  );
}

// Step 8: Sigma Bonds
function BF3Step8() {
  return (
    <Float rotationIntensity={0.2}>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.5} label="B" />
      
      {/* Bond 1 */}
      <Cylinder args={[0.1, 0.1, 2, 16]} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.5} opacity={0.8} transparent />
      </Cylinder>
      <Atom position={[0, 2, 0]} color="#34d399" size={0.6} label="F" />
      
      {/* Bond 2 */}
      <Cylinder args={[0.1, 0.1, 2, 16]} position={[Math.sin((2 * Math.PI) / 3), Math.cos((2 * Math.PI) / 3), 0]} rotation={[0, 0, -(2 * Math.PI) / 3]}>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.5} opacity={0.8} transparent />
      </Cylinder>
      <Atom position={[Math.sin((2 * Math.PI) / 3)*2, Math.cos((2 * Math.PI) / 3)*2, 0]} color="#34d399" size={0.6} label="F" />

      {/* Bond 3 */}
      <Cylinder args={[0.1, 0.1, 2, 16]} position={[Math.sin((4 * Math.PI) / 3), Math.cos((4 * Math.PI) / 3), 0]} rotation={[0, 0, -(4 * Math.PI) / 3]}>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.5} opacity={0.8} transparent />
      </Cylinder>
      <Atom position={[Math.sin((4 * Math.PI) / 3)*2, Math.cos((4 * Math.PI) / 3)*2, 0]} color="#34d399" size={0.6} label="F" />

      {/* Electrons in bonds */}
      <Electron position={[0, 1, 0]} />
      <Electron position={[Math.sin((2 * Math.PI) / 3), Math.cos((2 * Math.PI) / 3), 0]} />
      <Electron position={[Math.sin((4 * Math.PI) / 3), Math.cos((4 * Math.PI) / 3), 0]} />
      
      <Text position={[1.5, 1, 0]} fontSize={0.2} color="#60a5fa">σ Bonds</Text>
    </Float>
  );
}

// Step 9: Molecular Geometry (Trigonal Planar, 120deg)
function BF3Step9() {
  return (
    <Float rotationIntensity={0.8} speed={1.5}>
      <Atom position={[0, 0, 0]} color="#ec4899" size={0.5} label="B" />
      
      {/* Bond 1 */}
      <Cylinder args={[0.05, 0.05, 2, 16]} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="#ffffff" />
      </Cylinder>
      <Atom position={[0, 2, 0]} color="#34d399" size={0.6} label="F" />
      
      {/* Bond 2 */}
      <Cylinder args={[0.05, 0.05, 2, 16]} position={[Math.sin((2 * Math.PI) / 3), Math.cos((2 * Math.PI) / 3), 0]} rotation={[0, 0, -(2 * Math.PI) / 3]}>
        <meshPhysicalMaterial color="#ffffff" />
      </Cylinder>
      <Atom position={[Math.sin((2 * Math.PI) / 3)*2, Math.cos((2 * Math.PI) / 3)*2, 0]} color="#34d399" size={0.6} label="F" />

      {/* Bond 3 */}
      <Cylinder args={[0.05, 0.05, 2, 16]} position={[Math.sin((4 * Math.PI) / 3), Math.cos((4 * Math.PI) / 3), 0]} rotation={[0, 0, -(4 * Math.PI) / 3]}>
        <meshPhysicalMaterial color="#ffffff" />
      </Cylinder>
      <Atom position={[Math.sin((4 * Math.PI) / 3)*2, Math.cos((4 * Math.PI) / 3)*2, 0]} color="#34d399" size={0.6} label="F" />

      {/* Angle indicator */}
      <group>
        <Torus args={[0.8, 0.01, 16, 64, (2 * Math.PI) / 3]} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} >
          <meshBasicMaterial color="#fcd34d" />
        </Torus>
        <Text position={[1, 0.8, 0]} fontSize={0.2} color="#fcd34d">120°</Text>
      </group>
    </Float>
  );
}


