import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { MoleculeData, AtomData, BondData, FunctionalGroupData, MOLECULE_REGISTRY } from './MolecularEngine';
import { getAtomProps } from './ChemistryPrimitives';

export function MolecularVisuals({ 
  entityName, 
  mode = 'NORMAL' 
}: { 
  entityName: string; 
  mode?: 'NORMAL' | 'DYNAMIC' | 'ANALYTICAL';
}) {
  const data = useMemo(() => {
    const generator = MOLECULE_REGISTRY[entityName.toUpperCase()] || MOLECULE_REGISTRY[entityName];
    if (generator) return generator();
    return null;
  }, [entityName]);

  const groupRef = useRef<THREE.Group>(null);
  
  const [selectedAtom, setSelectedAtom] = useState<AtomData | null>(null);
  const [selectedBond, setSelectedBond] = useState<BondData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FunctionalGroupData | null>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (mode === 'DYNAMIC') {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.x += delta * 0.1;
    } else if (mode === 'NORMAL') {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  if (!data) {
    return (
      <Html center>
        <div className="text-cyan-500 font-mono text-xs border border-cyan-500/30 p-2 bg-black/50">
          MOLECULAR DATA NOT FOUND: {entityName}
        </div>
      </Html>
    );
  }

  const isAnalytical = mode === 'ANALYTICAL';

  const handleAtomClick = (atom: AtomData) => {
    const group = data.functionalGroups.find(g => g.atomIds.includes(atom.id));
    
    if (group) {
      if (selectedGroup?.id !== group.id) {
        setSelectedGroup(group);
        setSelectedAtom(null);
        setSelectedBond(null);
      } else if (selectedAtom?.id !== atom.id) {
        setSelectedAtom(atom);
        setSelectedGroup(null);
        setSelectedBond(null);
      } else {
        setSelectedAtom(null);
        setSelectedGroup(null);
        setSelectedBond(null);
      }
    } else {
      if (selectedAtom?.id !== atom.id) {
        setSelectedAtom(atom);
        setSelectedGroup(null);
        setSelectedBond(null);
      } else {
        setSelectedAtom(null);
        setSelectedGroup(null);
        setSelectedBond(null);
      }
    }
  };

  const handleBondClick = (bond: BondData) => {
    const group = data.functionalGroups.find(g => g.atomIds.includes(bond.atomA) && g.atomIds.includes(bond.atomB));
    
    if (group) {
      if (selectedGroup?.id !== group.id) {
        setSelectedGroup(group);
        setSelectedAtom(null);
        setSelectedBond(null);
      } else if (selectedBond?.id !== bond.id) {
        setSelectedBond(bond);
        setSelectedGroup(null);
        setSelectedAtom(null);
      } else {
        setSelectedBond(null);
        setSelectedGroup(null);
        setSelectedAtom(null);
      }
    } else {
      if (selectedBond?.id !== bond.id) {
        setSelectedBond(bond);
        setSelectedGroup(null);
        setSelectedAtom(null);
      } else {
        setSelectedBond(null);
        setSelectedGroup(null);
        setSelectedAtom(null);
      }
    }
  };
  
  let groupCentroid = null;
  if (selectedGroup) {
    const groupAtoms = data.atoms.filter(a => selectedGroup.atomIds.includes(a.id));
    if (groupAtoms.length > 0) {
      const sum = new THREE.Vector3();
      groupAtoms.forEach(a => {
         const p = isAnalytical ? a.position.clone().multiplyScalar(1.5) : a.position;
         sum.add(p);
      });
      groupCentroid = sum.divideScalar(groupAtoms.length);
    }
  }

  return (
    <Float floatIntensity={isAnalytical ? 0.2 : 1.5} rotationIntensity={isAnalytical ? 0.1 : 0.4} speed={isAnalytical ? 0.5 : 1.5}>
      <group ref={groupRef} scale={[1.2, 1.2, 1.2]}>
        {data.bonds.map((bond) => {
           const atomA = data.atoms.find(a => a.id === bond.atomA);
           const atomB = data.atoms.find(a => a.id === bond.atomB);
           if (!atomA || !atomB) return null;
           
           const isSelected = selectedBond?.id === bond.id;
           const inSelectedGroup = selectedGroup ? (selectedGroup.atomIds.includes(bond.atomA) && selectedGroup.atomIds.includes(bond.atomB)) : false;
           
           return (
             <HighFidelityBond 
               key={bond.id} 
               bond={bond} 
               posA={atomA.position} 
               posB={atomB.position} 
               elementA={atomA.element}
               elementB={atomB.element}
               mode={mode}
               isSelected={isSelected}
               inSelectedGroup={inSelectedGroup}
               onClick={() => handleBondClick(bond)}
             />
           );
        })}
        {data.atoms.map((atom) => {
          const isSelected = selectedAtom?.id === atom.id;
          const inSelectedGroup = selectedGroup?.atomIds.includes(atom.id) || false;
          
          return (
            <HighFidelityAtom 
              key={atom.id} 
              atom={atom} 
              mode={mode}
              isSelected={isSelected}
              inSelectedGroup={inSelectedGroup}
              onClick={() => handleAtomClick(atom)}
            />
          );
        })}
        
        {selectedGroup && groupCentroid && (
           <group position={groupCentroid}>
              <Html position={[0, 0.5, 0]} center zIndexRange={[100, 0]}>
                <div className="text-[10px] font-mono tracking-widest px-3 py-2 bg-emerald-950/90 border border-emerald-500/60 rounded backdrop-blur-md text-emerald-100 whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="font-bold text-emerald-300 text-[12px] mb-1 pb-1 border-b border-emerald-500/30">
                    FUNCTIONAL GROUP
                  </div>
                  <div className="flex flex-col gap-0.5 text-emerald-400 uppercase">
                    <div>Type: {selectedGroup.type}</div>
                    <div>Atoms: {selectedGroup.atomIds.length}</div>
                  </div>
                </div>
              </Html>
           </group>
        )}
      </group>
    </Float>
  );
}

function HighFidelityAtom({ atom, mode, isSelected, inSelectedGroup, onClick }: { atom: AtomData, mode: string, isSelected: boolean, inSelectedGroup: boolean, onClick: () => void }) {
  const { color, size: baseRadius } = getAtomProps(atom.element);
  const radius = baseRadius * 0.8;
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  
  const targetPos = useMemo(() => {
    if (mode === 'ANALYTICAL') {
      return atom.position.clone().multiplyScalar(1.5);
    }
    return atom.position.clone();
  }, [atom.position, mode]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      let currentY = targetPos.y;
      if (mode === 'DYNAMIC') {
        const time = state.clock.elapsedTime;
        const offset = Math.sin(time * 10 + atom.position.x * 5) * 0.05;
        currentY += offset;
      }
      easing.damp3(meshRef.current.position, [targetPos.x, currentY, targetPos.z], 0.3, delta);
    }
  });

  const displayColor = inSelectedGroup ? "#10b981" : color;
  const emissiveColor = inSelectedGroup ? "#059669" : color;
  const isHighlight = hovered || isSelected || inSelectedGroup;

  return (
    <group 
      ref={meshRef} 
      position={targetPos}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <mesh>
        <icosahedronGeometry args={[radius * 0.25, 2]} />
        <meshStandardMaterial color={displayColor} emissive={emissiveColor} emissiveIntensity={isHighlight ? 3 : 1.5} roughness={0.1} metalness={0.8} />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial 
          color={displayColor} 
          transparent 
          opacity={isHighlight ? 0.35 : 0.15} 
          roughness={0.1} 
          transmission={0.9} 
          thickness={0.5} 
          clearcoat={1} 
          depthWrite={false} 
        />
      </mesh>

      <mesh scale={[1.05, 1.05, 1.05]}>
        <icosahedronGeometry args={[radius, 1]} />
        <meshBasicMaterial color={isSelected ? "#ffffff" : displayColor} wireframe transparent opacity={isSelected ? 0.4 : inSelectedGroup ? 0.3 : 0.15} blending={THREE.AdditiveBlending} />
      </mesh>

      {(hovered || isSelected) && !inSelectedGroup && (
        <Html position={[0, radius + 0.3, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2 py-1.5 bg-black/80 border border-cyan-500/50 rounded backdrop-blur-md text-cyan-50 whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <div className="font-bold text-cyan-300 text-[11px] mb-1 pb-1 border-b border-cyan-500/30">
              ELEMENT: {atom.element}
            </div>
            {isSelected && (
              <div className="flex flex-col gap-0.5 text-cyan-500/90 uppercase">
                <div>Hyb: {atom.hybridization || 'Unknown'}</div>
                <div>Rad: {(baseRadius * 100).toFixed(0)} pm</div>
                {atom.charge && <div>Charge: {atom.charge > 0 ? `+${atom.charge}` : atom.charge}</div>}
              </div>
            )}
          </div>
        </Html>
      )}
      
      {(hovered && inSelectedGroup) && (
        <Html position={[0, radius + 0.3, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2 py-1 bg-black/80 border border-emerald-500/50 rounded text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
             {atom.element}
          </div>
        </Html>
      )}
    </group>
  );
}

function HighFidelityBond({ bond, posA, posB, elementA, elementB, mode, isSelected, inSelectedGroup, onClick }: { bond: BondData, posA: THREE.Vector3, posB: THREE.Vector3, elementA: string, elementB: string, mode: string, isSelected: boolean, inSelectedGroup: boolean, onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  const targetPosA = useMemo(() => mode === 'ANALYTICAL' ? posA.clone().multiplyScalar(1.5) : posA.clone(), [posA, mode]);
  const targetPosB = useMemo(() => mode === 'ANALYTICAL' ? posB.clone().multiplyScalar(1.5) : posB.clone(), [posB, mode]);
  
  const center = useMemo(() => targetPosA.clone().lerp(targetPosB, 0.5), [targetPosA, targetPosB]);
  const length = useMemo(() => targetPosA.distanceTo(targetPosB), [targetPosA, targetPosB]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPosB.clone().sub(targetPosA).normalize()), [targetPosA, targetPosB]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const currentPosA = mode === 'ANALYTICAL' ? posA.clone().multiplyScalar(1.5) : posA.clone();
      const currentPosB = mode === 'ANALYTICAL' ? posB.clone().multiplyScalar(1.5) : posB.clone();
      
      // Inherit the dynamic offset from the atoms to keep bonds connected during DYNAMIC vibration
      if (mode === 'DYNAMIC') {
        const time = state.clock.elapsedTime;
        currentPosA.y += Math.sin(time * 10 + posA.x * 5) * 0.05;
        currentPosB.y += Math.sin(time * 10 + posB.x * 5) * 0.05;
      }
      
      const c = currentPosA.clone().lerp(currentPosB, 0.5);
      const l = currentPosA.distanceTo(currentPosB);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentPosB.clone().sub(currentPosA).normalize());
      
      easing.damp3(groupRef.current.position, [c.x, c.y, c.z], 0.3, delta);
      easing.dampQ(groupRef.current.quaternion, q, 0.3, delta);
      easing.damp3(groupRef.current.scale, [1, l, 1], 0.3, delta);
    }
  });

  const offsets = [];
  const spacing = 0.15;
  if (bond.type === 'aromatic') {
    offsets.push([0, 0, 0]);
    offsets.push([spacing, 0, 0]); 
  } else if (bond.order === 1) {
    offsets.push([0, 0, 0]);
  } else if (bond.order === 2) {
    offsets.push([-spacing, 0, 0]);
    offsets.push([spacing, 0, 0]);
  } else if (bond.order === 3) {
    offsets.push([-spacing * 1.2, 0, 0]);
    offsets.push([0, 0, 0]);
    offsets.push([spacing * 1.2, 0, 0]);
  } else {
    offsets.push([0, 0, 0]);
  }

  const bondRadius = 0.04;
  const gap = mode === 'ANALYTICAL' ? 0.8 : 0.6; 
  
  const getBondColor = (i: number) => {
     if (inSelectedGroup) return "#10b981";
     if (isSelected) return "#fcd34d";
     if (hovered) return "#38bdf8";
     if (bond.type === 'aromatic' && i === 1) return "#a855f7";
     return "#cbd5e1";
  };
  
  const getEmissive = () => {
     if (inSelectedGroup) return "#059669";
     if (isSelected) return "#f59e0b";
     return "#000000";
  };
  
  return (
    <group 
      ref={groupRef}
      position={center} 
      quaternion={quaternion}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <mesh visible={false}>
        <cylinderGeometry args={[0.4, 0.4, 1, 8]} />
        <meshBasicMaterial />
      </mesh>
      
      {offsets.map((offset, i) => (
        <group key={i} position={new THREE.Vector3(...offset)}>
          <mesh scale={[1, Math.max(0.01, (length - gap) / length), 1]}>
             <cylinderGeometry args={[bondRadius, bondRadius, 1, 12]} />
             <meshStandardMaterial 
               color={getBondColor(i)} 
               emissive={getEmissive()}
               emissiveIntensity={isSelected || inSelectedGroup ? 1.5 : 0}
               roughness={0.2} 
               metalness={0.5} 
               transparent={bond.type === 'aromatic' && i === 1}
               opacity={bond.type === 'aromatic' && i === 1 ? 0.5 : 1}
             />
          </mesh>
        </group>
      ))}

      {(hovered || isSelected) && !inSelectedGroup && (
        <Html position={[0, 0, 0]} center zIndexRange={[90, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2 py-1.5 bg-cyan-950/90 border border-cyan-500/50 rounded backdrop-blur-md text-cyan-200 whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <div className="font-bold text-amber-300 text-[11px] mb-1 pb-1 border-b border-amber-500/30">
              BOND: {bond.type.toUpperCase()}
            </div>
            {isSelected && (
              <div className="flex flex-col gap-0.5 text-cyan-400 uppercase">
                <div>Order: {bond.order}</div>
                <div>Len: {(length).toFixed(2)} Å</div>
                <div>{elementA} ↔ {elementB}</div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

