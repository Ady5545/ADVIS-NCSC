import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Float, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';

export function HolographicGrid() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <gridHelper args={[20, 40, '#0ea5e9', '#082f49']} />
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function MeasurementArc({ radius = 1.5, angle = Math.PI/2, label = "90°", startRotation = 0 }: { radius?: number, angle?: number, label?: string, startRotation?: number }) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, angle, false, 0);
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return (
    <group rotation={[0, 0, startRotation]}>
      <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.6 }))} />
      {/* Tick marks */}
      <mesh position={[radius, 0, 0]}>
         <boxGeometry args={[0.1, 0.02, 0.02]} />
         <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[Math.cos(angle)*radius, Math.sin(angle)*radius, 0]} rotation={[0, 0, angle]}>
         <boxGeometry args={[0.1, 0.02, 0.02]} />
         <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <Html position={[Math.cos(angle/2)*(radius+0.3), Math.sin(angle/2)*(radius+0.3), 0]} center>
         <div className="text-[10px] text-cyan-300 font-mono tracking-widest border border-cyan-500/30 px-1 py-0.5 rounded bg-black/50">{label}</div>
      </Html>
    </group>
  );
}

export function SelectionReticle({ size = 1, label }: { size?: number, label?: string }) {
  return (
    <group>
      <Html center position={[size + 0.2, size + 0.2, 0]}>
        {label && (
           <div className="flex items-end">
              <div className="w-8 h-[1px] bg-cyan-400/50 transform -rotate-45 origin-bottom-left"></div>
              <div className="w-16 h-[1px] bg-cyan-400/50"></div>
              <div className="text-[9px] font-mono tracking-[0.2em] text-cyan-300 ml-2 uppercase whitespace-nowrap bg-black/40 px-1 border border-cyan-500/30">
                {label}
              </div>
           </div>
        )}
      </Html>
      {/* Reticle geometry */}
      <mesh>
        <torusGeometry args={[size * 1.2, 0.01, 16, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>
      {/* Crosshairs */}
      <mesh position={[size*1.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.02]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[-size*1.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.02]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0, size*1.2, 0]}>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0, -size*1.2, 0]}>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
    </group>
  );
}


// Standard atom colors and sizes
const ATOM_PROPERTIES: Record<string, { color: string; size: number; metalness: number; roughness: number }> = {
  H: { color: '#ccffff', size: 0.4, metalness: 0.1, roughness: 0.2 },
  B: { color: '#008b8b', size: 0.7, metalness: 0.5, roughness: 0.3 },
  C: { color: '#2f4f4f', size: 0.75, metalness: 0.2, roughness: 0.7 },
  N: { color: '#4169e1', size: 0.7, metalness: 0.2, roughness: 0.4 },
  O: { color: '#ff6347', size: 0.65, metalness: 0.1, roughness: 0.3 },
  F: { color: '#98fb98', size: 0.6, metalness: 0.1, roughness: 0.3 },
  Cl: { color: '#32cd32', size: 0.8, metalness: 0.1, roughness: 0.4 },
  Na: { color: '#c0c0c0', size: 0.9, metalness: 0.8, roughness: 0.2 },
  default: { color: '#888888', size: 0.7, metalness: 0.3, roughness: 0.3 }
};

export function getAtomProps(element: string) {
  return ATOM_PROPERTIES[element] || ATOM_PROPERTIES.default;
}


export function Atom({ position, element, label, showReticle, reticleLabel }: any) {
  const { color, size: radius } = getAtomProps(element);
  return (
    <group position={position}>
      {/* Dense Nucleus */}
      <mesh>
         <icosahedronGeometry args={[radius * 0.2, 2]} />
         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.1} metalness={0.8} />
      </mesh>
      
      {/* Inner Shell Wireframe */}
      <mesh>
         <icosahedronGeometry args={[radius * 0.6, 2]} />
         <meshBasicMaterial color={color} wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Outer Shell Glass */}
      <mesh>
         <sphereGeometry args={[radius, 32, 32]} />
         <meshPhysicalMaterial color={color} transparent opacity={0.1} roughness={0.1} transmission={0.9} thickness={0.5} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Edge Highlight Ring */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
         <torusGeometry args={[radius, 0.01, 16, 64]} />
         <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0, Math.PI/2, 0]}>
         <torusGeometry args={[radius, 0.01, 16, 64]} />
         <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {label && (
        <Html position={[0, radius + 0.5, 0]} center zIndexRange={[100, 0]}>
          <div className="text-xs font-mono font-bold tracking-widest px-2 py-1 bg-slate-950/80 border border-slate-700/50 rounded backdrop-blur-md text-white/90 shadow-lg">
            {label}
          </div>
        </Html>
      )}
      {showReticle && (
         <SelectionReticle size={radius + 0.8} label={reticleLabel || label} />
      )}
    </group>
  );
}


export function Electron({ position, color = "#fef08a", label }: { position: [number, number, number]; color?: string; label?: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {label && (
        <Html position={[0, 0.2, 0]} center zIndexRange={[100, 0]}>
           <div className="text-[9px] font-mono font-bold text-yellow-100/90 whitespace-nowrap">{label}</div>
        </Html>
      )}
    </group>
  );
}

export function LonePair({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.3, 0.8, 16, 16]} />
        <meshPhysicalMaterial color="#34d399" transparent opacity={0.2} transmission={0.9} roughness={0.2} depthWrite={false} />
      </mesh>
      {/* Electrons inside the lobe */}
      <Electron position={[-0.1, 0.5, 0]} />
      <Electron position={[0.1, 0.5, 0]} />
    </group>
  );
}

export function POrbital({ position, rotation, color = "#a855f7" }: { position: [number, number, number]; rotation: [number, number, number]; color?: string }) {
  return (
    <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
      {/* Top lobe */}
      <Sphere args={[0.4, 32, 32]} position={[0, 0.6, 0]} scale={[1, 1.5, 1]}>
        <meshStandardMaterial color={color} transparent opacity={0.4} depthWrite={false} roughness={0.2} />
      </Sphere>
      {/* Bottom lobe */}
      <Sphere args={[0.4, 32, 32]} position={[0, -0.6, 0]} scale={[1, 1.5, 1]}>
        <meshStandardMaterial color={color} transparent opacity={0.4} depthWrite={false} roughness={0.2} />
      </Sphere>
    </group>
  );
}

// Visualizes an s-orbital (sphere)
export function SOrbital({ position, color = "#3b82f6", size = 0.8 }: { position: [number, number, number]; color?: string; size?: number }) {
  return (
    <group position={new THREE.Vector3(...position)}>
      <Sphere args={[size, 32, 32]}>
        <meshStandardMaterial color={color} transparent opacity={0.3} depthWrite={false} roughness={0.2} />
      </Sphere>
    </group>
  );
}

// Visualizes a hybrid orbital (sp, sp2, sp3)
export function HybridOrbital({ position, rotation, color = "#ec4899" }: { position: [number, number, number]; rotation: [number, number, number]; color?: string }) {
  return (
    <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
      {/* Large front lobe */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0.6, 0]} scale={[1, 1.6, 1]}>
        <meshStandardMaterial color={color} transparent opacity={0.4} depthWrite={false} roughness={0.2} />
      </Sphere>
      {/* Small back lobe */}
      <Sphere args={[0.2, 16, 16]} position={[0, -0.2, 0]} scale={[1, 1.2, 1]}>
        <meshStandardMaterial color={color} transparent opacity={0.3} depthWrite={false} roughness={0.2} />
      </Sphere>
    </group>
  );
}

export function Bond({ start, end, multiple = 1, type = 'covalent', visible = true }: { start: [number, number, number]; end: [number, number, number]; multiple?: number; type?: 'covalent' | 'ionic' | 'pi'; visible?: boolean }) {
  const vStart = new THREE.Vector3(...start);
  const vEnd = new THREE.Vector3(...end);
  const distance = vStart.distanceTo(vEnd);
  const position = vStart.clone().lerp(vEnd, 0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vEnd.clone().sub(vStart).normalize());
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  const groupRef = React.useRef<THREE.Group>(null);
  const overlapRef = React.useRef<THREE.Mesh>(null);
  const targetLengthScale = visible ? 1 : 0;
  const targetThicknessScale = visible ? 1 : 0;

  useFrame((state, delta) => {
    if (groupRef.current) {
        easing.damp3(groupRef.current.scale, [targetThicknessScale, targetLengthScale, targetThicknessScale], 0.3, delta);
    }
    if (overlapRef.current) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        overlapRef.current.scale.set(pulse, pulse, pulse);
        
        const mat = overlapRef.current.material as THREE.Material;
        easing.damp(mat, 'opacity', visible ? 0.6 : 0, 0.3, delta);
    }
  });

  if (type === 'ionic') {
    // Just show a subtle field effect between them
    return (
      <group position={position} rotation={euler}>
         <Cylinder args={[0.2, 0.2, distance - 1.5, 16]}>
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
         </Cylinder>
      </group>
    );
  }

  const offsets = multiple === 2 ? [-0.15, 0.15] : multiple === 3 ? [-0.2, 0, 0.2] : [0];
  
  return (
    <group position={position} rotation={euler}>
      {/* Dynamic orbital overlap region */}
      <mesh ref={overlapRef}>
         <sphereGeometry args={[0.3 * Math.max(1, multiple * 0.8), 32, 32]} />
         <meshBasicMaterial color="#a855f7" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      
      {/* Procedurally growing cylinders */}
      <group ref={groupRef} scale={[0, 0, 0]}>
          {offsets.map((offset, i) => (
            <group key={i} position={[offset, 0, 0]}>
              <Cylinder args={[0.08, 0.08, distance - 0.6, 24]}>
                <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.3} />
              </Cylinder>
              {type === 'pi' && i !== 0 && (
                <Cylinder args={[0.12, 0.12, distance - 0.6, 16]} position={[0,0,0]}>
                    <meshStandardMaterial color="#a855f7" transparent opacity={0.4} depthWrite={false} />
                </Cylinder>
              )}
            </group>
          ))}
      </group>
    </group>
  );
}

export function LewisStructure({ formula, steps, currentStepPhase, isOverlay }: { formula: string, steps?: any[], currentStepPhase?: string, isOverlay?: boolean }) {
  return (
    <Html center={!isOverlay} zIndexRange={[100, 0]}>
      <div className="bg-slate-950/90 border border-cyan-500/50 p-6 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-xl flex flex-col items-center justify-center font-mono text-cyan-50">
        <div className="text-xs tracking-widest text-cyan-400 mb-4 font-bold border-b border-cyan-500/30 pb-2 w-full text-center uppercase">Lewis Structure: {formula}</div>
        <div className="text-4xl font-bold tracking-[0.2em] relative flex items-center justify-center min-w-[200px] min-h-[100px]">
          {/* Custom rendering based on formula */}
          {formula === 'CO2' && <CO2Lewis phase={currentStepPhase} />}
          {formula === 'H2O' && <H2OLewis phase={currentStepPhase} />}
          {formula === 'NH3' && <NH3Lewis phase={currentStepPhase} />}
          {formula === 'CH4' && <CH4Lewis phase={currentStepPhase} />}
          {formula === 'BF3' && <BF3Lewis phase={currentStepPhase} />}
          {formula === 'NaCl' && <NaClLewis phase={currentStepPhase} />}
        </div>
      </div>
    </Html>
  );
}

function Dot({ show }: { show: boolean }) {
  return <div className={`w-2 h-2 rounded-full bg-cyan-400 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`} />;
}
function Line({ show }: { show: boolean }) {
  return <div className={`w-8 h-1 rounded-full bg-cyan-400 transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`} />;
}

function CO2Lewis({ phase }: { phase?: string }) {
  const showBonds = phase === 'bonding' || phase === 'summary' || phase === 'geometry';
  const showLonePairs = phase === 'lone_pairs' || phase === 'summary' || phase === 'geometry';
  const showElectrons = phase === 'valence';
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        O
        {showLonePairs && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showLonePairs && <div className="absolute top-4 -left-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
        {showLonePairs && <div className="absolute top-4 -right-3 flex flex-col gap-1 opacity-0"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute -bottom-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showElectrons && !showBonds && <div className="absolute top-4 -right-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
      </div>
      
      <div className="flex flex-col gap-1 items-center justify-center w-8">
        {showBonds ? <><Line show/><Line show/></> : showElectrons ? <div className="flex gap-2"><div className="flex flex-col gap-1"><Dot show/><Dot show/></div><div className="flex flex-col gap-1"><Dot show/><Dot show/></div></div> : null}
      </div>

      <div className="relative">
        C
        {showElectrons && !showBonds && <div className="absolute -top-3 left-1"><Dot show/></div>}
        {showElectrons && !showBonds && <div className="absolute -bottom-3 left-1"><Dot show/></div>}
      </div>

      <div className="flex flex-col gap-1 items-center justify-center w-8">
        {showBonds ? <><Line show/><Line show/></> : showElectrons ? <div className="flex gap-2"><div className="flex flex-col gap-1"><Dot show/><Dot show/></div><div className="flex flex-col gap-1"><Dot show/><Dot show/></div></div> : null}
      </div>

      <div className="relative">
        O
        {showLonePairs && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showLonePairs && <div className="absolute top-4 -right-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute -bottom-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
        {showElectrons && !showBonds && <div className="absolute top-4 -left-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
      </div>
    </div>
  );
}

function H2OLewis({ phase }: { phase?: string }) {
  const showBonds = phase === 'bonds_only' || phase === 'lone_pairs' || phase === 'summary';
  const showLonePairs = phase === 'lone_pairs' || phase === 'summary';
  const showElectrons = phase === 'valence' || phase === 'atoms';
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative text-5xl">
        O
        {showLonePairs && <div className="absolute -top-4 left-3 flex gap-1.5"><Dot show/><Dot show/></div>}
        {showLonePairs && <div className="absolute top-4 -left-4 flex flex-col gap-1.5"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute -top-4 left-3 flex gap-1.5"><Dot show/><Dot show/></div>}
        {showElectrons && !showLonePairs && <div className="absolute top-4 -left-4 flex flex-col gap-1.5"><Dot show/><Dot show/></div>}
      </div>
      <div className="flex justify-between w-32 items-start -mt-2">
         <div className="flex flex-col items-center gap-2 transform rotate-45">
            {showBonds ? <Line show /> : showElectrons ? <div className="flex gap-1.5"><Dot show/><Dot show/></div> : null}
            <div className="-rotate-45 text-4xl">H</div>
         </div>
         <div className="flex flex-col items-center gap-2 transform -rotate-45">
            {showBonds ? <Line show /> : showElectrons ? <div className="flex gap-1.5"><Dot show/><Dot show/></div> : null}
            <div className="rotate-45 text-4xl">H</div>
         </div>
      </div>
    </div>
  );
}

function CH4Lewis({ phase }: { phase?: string }) {
    const showBonds = phase !== 'atoms' && phase !== 'valence' && phase !== 'ground_state' && phase !== 'hybridization';
    const showElectrons = phase === 'valence';
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-2xl">H</div>
        {showBonds ? <div className="rotate-90"><Line show/></div> : showElectrons ? <div className="flex flex-col gap-1"><Dot show/><Dot show/></div> : null}
        <div className="flex items-center gap-2">
            <div className="text-2xl">H</div>
            {showBonds ? <Line show/> : showElectrons ? <div className="flex gap-1"><Dot show/><Dot show/></div> : null}
            <div className="text-5xl">C</div>
            {showBonds ? <Line show/> : showElectrons ? <div className="flex gap-1"><Dot show/><Dot show/></div> : null}
            <div className="text-2xl">H</div>
        </div>
        {showBonds ? <div className="rotate-90"><Line show/></div> : showElectrons ? <div className="flex flex-col gap-1"><Dot show/><Dot show/></div> : null}
        <div className="text-2xl">H</div>
      </div>
    )
}

function NH3Lewis({ phase }: { phase?: string }) {
    const showBonds = phase !== 'atoms' && phase !== 'valence' && phase !== 'ground_state' && phase !== 'hybridization';
    const showLonePairs = phase === 'lone_pairs' || phase === 'summary' || phase === 'geometry';
    const showElectrons = phase === 'valence';
    
    return (
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="relative text-5xl">
            N
            {showLonePairs && <div className="absolute -top-4 left-3 flex gap-1.5"><Dot show/><Dot show/></div>}
            {showElectrons && !showLonePairs && <div className="absolute -top-4 left-3 flex gap-1.5"><Dot show/><Dot show/></div>}
        </div>
        <div className="flex justify-between w-40 items-start">
            <div className="flex flex-col items-center gap-2 transform rotate-45">
                {showBonds ? <Line show /> : showElectrons ? <div className="flex gap-1.5"><Dot show/><Dot show/></div> : null}
                <div className="-rotate-45 text-3xl">H</div>
            </div>
            <div className="flex flex-col items-center gap-2">
                {showBonds ? <div className="rotate-90 mt-2 mb-2"><Line show /></div> : showElectrons ? <div className="flex flex-col gap-1.5"><Dot show/><Dot show/></div> : null}
                <div className="text-3xl">H</div>
            </div>
            <div className="flex flex-col items-center gap-2 transform -rotate-45">
                {showBonds ? <Line show /> : showElectrons ? <div className="flex gap-1.5"><Dot show/><Dot show/></div> : null}
                <div className="rotate-45 text-3xl">H</div>
            </div>
        </div>
      </div>
    );
}

function BF3Lewis({ phase }: { phase?: string }) {
    const showBonds = phase !== 'atoms' && phase !== 'valence' && phase !== 'ground_state' && phase !== 'hybridization';
    const showElectrons = phase === 'valence';
    
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative text-3xl">
            F
            {showElectrons && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
            {showElectrons && <div className="absolute top-3 -left-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
            {showElectrons && <div className="absolute top-3 -right-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
        </div>
        {showBonds ? <div className="rotate-90"><Line show/></div> : showElectrons ? <div className="flex flex-col gap-1"><Dot show/><Dot show/></div> : null}
        <div className="flex items-center gap-4">
            <div className="relative text-3xl">
                F
                {showElectrons && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
                {showElectrons && <div className="absolute -bottom-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
                {showElectrons && <div className="absolute top-3 -left-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
            </div>
            {showBonds ? <Line show/> : showElectrons ? <div className="flex gap-1"><Dot show/><Dot show/></div> : null}
            <div className="text-5xl">B</div>
            {showBonds ? <Line show/> : showElectrons ? <div className="flex gap-1"><Dot show/><Dot show/></div> : null}
            <div className="relative text-3xl">
                F
                {showElectrons && <div className="absolute -top-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
                {showElectrons && <div className="absolute -bottom-3 left-1 flex gap-1"><Dot show/><Dot show/></div>}
                {showElectrons && <div className="absolute top-3 -right-3 flex flex-col gap-1"><Dot show/><Dot show/></div>}
            </div>
        </div>
      </div>
    );
}

function NaClLewis({ phase }: { phase?: string }) {
    const isIons = phase === 'ions' || phase === 'attraction' || phase === 'summary';
    const isTransfer = phase === 'transfer';
    const isAtoms = phase === 'atoms' || phase === 'valence';
    
    return (
        <div className="flex items-center gap-8">
            <div className="relative text-5xl">
                {isIons ? '[Na]' : 'Na'}
                {isIons && <div className="absolute -top-2 -right-4 text-2xl font-bold text-cyan-300">+</div>}
                {(isAtoms || isTransfer) && <div className={`absolute top-4 -right-3 transition-transform duration-1000 ${isTransfer ? 'translate-x-[4rem]' : ''}`}><Dot show/></div>}
            </div>
            <div className="relative text-5xl">
                {isIons ? '[Cl]' : 'Cl'}
                {isIons && <div className="absolute -top-2 -right-4 text-2xl font-bold text-cyan-300">-</div>}
                
                {/* Cl valence electrons */}
                <div className="absolute -top-4 left-3 flex gap-1.5"><Dot show/><Dot show/></div>
                <div className="absolute top-5 -left-4 flex flex-col gap-1.5"><Dot show/><Dot show/></div>
                <div className="absolute top-5 -right-4 flex flex-col gap-1.5"><Dot show/><Dot show/></div>
                <div className="absolute -bottom-4 left-3 flex gap-1.5"><Dot show/>{(isIons || isTransfer) && <Dot show/>}</div>
            </div>
        </div>
    );
}
