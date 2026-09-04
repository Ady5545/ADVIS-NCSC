import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { MoleculeData, AtomData, BondData, FunctionalGroupData, MOLECULE_REGISTRY } from './MolecularEngine';
import { getAtomProps } from './ChemistryPrimitives';

interface MolecularVisualsProps {
  entityName?: string;
  moleculeData?: MoleculeData | null;
  mode?: 'NORMAL' | 'DYNAMIC' | 'ANALYTICAL';
  onAtomSelect?: (atomId: string | null) => void;
  onSecondaryAtomSelect?: (atomId: string | null) => void;
  onBondSelect?: (bondId: string | null) => void;
  onAtomPositionChange?: (atomId: string, newPos: THREE.Vector3) => void;
  externalSelectedAtomId?: string | null;
  externalSecondaryAtomId?: string | null;
  externalSelectedBondId?: string | null;
  showAnnotations?: boolean;
  measurementMode?: boolean;
}

export function MolecularVisuals({ 
  entityName,
  moleculeData,
  mode = 'NORMAL',
  onAtomSelect,
  onSecondaryAtomSelect,
  onBondSelect,
  onAtomPositionChange,
  externalSelectedAtomId,
  externalSecondaryAtomId,
  externalSelectedBondId,
  showAnnotations = true,
  measurementMode = false
}: MolecularVisualsProps) {
  const data = useMemo(() => {
    if (moleculeData) return moleculeData;
    if (entityName) {
      const generator = MOLECULE_REGISTRY[entityName.toUpperCase()] || MOLECULE_REGISTRY[entityName];
      if (generator) return generator();
    }
    return null;
  }, [moleculeData, entityName]);

  const groupRef = useRef<THREE.Group>(null);
  
  const [internalSelectedAtom, setInternalSelectedAtom] = useState<AtomData | null>(null);
  const [internalSecondaryAtom, setInternalSecondaryAtom] = useState<AtomData | null>(null);
  const [internalSelectedBond, setInternalSelectedBond] = useState<BondData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<FunctionalGroupData | null>(null);
  const [measurementSequence, setMeasurementSequence] = useState<AtomData[]>([]);

  React.useEffect(() => {
    if (!measurementMode) {
      setMeasurementSequence([]);
    }
  }, [measurementMode]);

  const selectedAtomId = externalSelectedAtomId !== undefined ? externalSelectedAtomId : (internalSelectedAtom ? internalSelectedAtom.id : null);
  const secondaryAtomId = externalSecondaryAtomId !== undefined ? externalSecondaryAtomId : (internalSecondaryAtom ? internalSecondaryAtom.id : null);
  const selectedBondId = externalSelectedBondId !== undefined ? externalSelectedBondId : (internalSelectedBond ? internalSelectedBond.id : null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    if (mode === 'DYNAMIC') {
      groupRef.current.rotation.y += delta * 0.2;
      groupRef.current.rotation.x += delta * 0.1;
    } else if (mode === 'NORMAL') {
      groupRef.current.rotation.y += delta * 0.04;
    }
  });

  if (!data) {
    return (
      <Html center>
        <div className="text-cyan-500 font-mono text-xs border border-cyan-500/30 p-2 bg-black/50">
          MOLECULAR DATA NOT FOUND: {entityName || 'Custom Graph'}
        </div>
      </Html>
    );
  }

  const isAnalytical = mode === 'ANALYTICAL';

  const handleAtomClick = (atom: AtomData, e?: any) => {
    if (measurementMode) {
      setMeasurementSequence(prev => {
        // Toggle selection
        if (prev.find(a => a.id === atom.id)) {
          return prev.filter(a => a.id !== atom.id);
        }
        // Limit to 3 atoms
        if (prev.length >= 3) {
          return [prev[1], prev[2], atom];
        }
        return [...prev, atom];
      });
      return;
    }

    const isShiftOrSecond = (e && e.shiftKey) || (selectedAtomId && selectedAtomId !== atom.id);
    const group = data.functionalGroups.find(g => g.atomIds.includes(atom.id));
    
    if (group && !isShiftOrSecond) {
      if (selectedGroup?.id !== group.id) {
        setSelectedGroup(group);
        setInternalSelectedAtom(null);
        setInternalSecondaryAtom(null);
        setInternalSelectedBond(null);
        if (onAtomSelect) onAtomSelect(null);
        if (onSecondaryAtomSelect) onSecondaryAtomSelect(null);
        if (onBondSelect) onBondSelect(null);
        return;
      }
    }

    if (selectedAtomId && selectedAtomId !== atom.id && (isShiftOrSecond || onSecondaryAtomSelect)) {
      // Set secondary atom
      if (secondaryAtomId === atom.id) {
        setInternalSecondaryAtom(null);
        if (onSecondaryAtomSelect) onSecondaryAtomSelect(null);
      } else {
        setInternalSecondaryAtom(atom);
        if (onSecondaryAtomSelect) onSecondaryAtomSelect(atom.id);
        // Check if there is an existing bond between selectedAtomId and this atom
        const existingBond = data.bonds.find(b => 
          (b.atomA === selectedAtomId && b.atomB === atom.id) || 
          (b.atomA === atom.id && b.atomB === selectedAtomId)
        );
        if (existingBond) {
          setInternalSelectedBond(existingBond);
          if (onBondSelect) onBondSelect(existingBond.id);
        }
      }
    } else if (selectedAtomId === atom.id) {
      // Deselect
      setInternalSelectedAtom(null);
      setInternalSecondaryAtom(null);
      setSelectedGroup(null);
      setInternalSelectedBond(null);
      if (onAtomSelect) onAtomSelect(null);
      if (onSecondaryAtomSelect) onSecondaryAtomSelect(null);
      if (onBondSelect) onBondSelect(null);
    } else {
      // Select primary atom
      setInternalSelectedAtom(atom);
      setInternalSecondaryAtom(null);
      setSelectedGroup(null);
      setInternalSelectedBond(null);
      if (onAtomSelect) onAtomSelect(atom.id);
      if (onSecondaryAtomSelect) onSecondaryAtomSelect(null);
      if (onBondSelect) onBondSelect(null);
    }
  };

  const handleBondClick = (bond: BondData) => {
    if (selectedBondId === bond.id) {
      setInternalSelectedBond(null);
      if (onBondSelect) onBondSelect(null);
    } else {
      setInternalSelectedBond(bond);
      setSelectedGroup(null);
      setInternalSelectedAtom(null);
      setInternalSecondaryAtom(null);
      if (onBondSelect) onBondSelect(bond.id);
      if (onAtomSelect) onAtomSelect(null);
      if (onSecondaryAtomSelect) onSecondaryAtomSelect(null);
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

  // Calculate VSEPR Angles for annotation when enabled or in Analytical mode
  const angleAnnotations = useMemo(() => {
    if (!showAnnotations && !isAnalytical) return [];
    const annotations: { vertexPos: THREE.Vector3; angleDeg: number; label: string; pA: THREE.Vector3; pB: THREE.Vector3 }[] = [];

    data.atoms.forEach(centerAtom => {
      const connectedBonds = data.bonds.filter(b => b.atomA === centerAtom.id || b.atomB === centerAtom.id);
      if (connectedBonds.length >= 2) {
        const neighborAtoms: AtomData[] = [];
        connectedBonds.forEach(b => {
          const nId = b.atomA === centerAtom.id ? b.atomB : b.atomA;
          const neighbor = data.atoms.find(a => a.id === nId);
          if (neighbor && !neighborAtoms.some(na => na.id === neighbor.id)) {
            neighborAtoms.push(neighbor);
          }
        });

        // Compute angle between first two neighbors
        if (neighborAtoms.length >= 2) {
          const pC = centerAtom.position;
          const pA = neighborAtoms[0].position;
          const pB = neighborAtoms[1].position;
          const vA = new THREE.Vector3().subVectors(pA, pC).normalize();
          const vB = new THREE.Vector3().subVectors(pB, pC).normalize();
          const dot = THREE.MathUtils.clamp(vA.dot(vB), -1, 1);
          const angleDeg = Math.round((Math.acos(dot) * 180) / Math.PI * 10) / 10;
          
          annotations.push({
            vertexPos: pC.clone(),
            angleDeg,
            label: `${angleDeg}°`,
            pA: pA.clone(),
            pB: pB.clone()
          });
        }
      }
    });

    return annotations;
  }, [data, showAnnotations, isAnalytical]);

  return (
    <Float floatIntensity={isAnalytical ? 0.1 : 1.2} rotationIntensity={isAnalytical ? 0.05 : 0.3} speed={isAnalytical ? 0.4 : 1.2}>
      <group ref={groupRef} scale={[1.2, 1.2, 1.2]}>
        {data.bonds.map((bond) => {
           const atomA = data.atoms.find(a => a.id === bond.atomA);
           const atomB = data.atoms.find(a => a.id === bond.atomB);
           if (!atomA || !atomB) return null;
           
           const isSelected = selectedBondId === bond.id || (
             (selectedAtomId === bond.atomA && secondaryAtomId === bond.atomB) ||
             (selectedAtomId === bond.atomB && secondaryAtomId === bond.atomA)
           );
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
          const isSelected = selectedAtomId === atom.id;
          const isSecondary = secondaryAtomId === atom.id;
          const inSelectedGroup = selectedGroup?.atomIds.includes(atom.id) || false;
          
          return (
            <HighFidelityAtom 
              key={atom.id} 
              atom={atom} 
              mode={mode}
              isSelected={isSelected}
              isSecondary={isSecondary}
              inSelectedGroup={inSelectedGroup}
              onClick={(e) => handleAtomClick(atom, e)}
              onPositionChange={(newPos) => onAtomPositionChange && onAtomPositionChange(atom.id, newPos)}
              showAnnotations={showAnnotations}
            />
          );
        })}

        {/* 3D VSEPR Angle Arc & Badges */}
        {angleAnnotations.map((ann, idx) => (
          <group key={`angle-${idx}`} position={ann.vertexPos}>
            <Html position={[0, 0.45, 0]} center zIndexRange={[80, 0]}>
              <div className="px-2 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/60 text-[10px] font-mono text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] whitespace-nowrap pointer-events-none backdrop-blur-sm">
                <span className="text-cyan-400 font-bold">∠ </span>{ann.label}
              </div>
            </Html>
          </group>
        ))}
        
        {selectedGroup && groupCentroid && (
           <group position={groupCentroid}>
              <Html position={[0, 0.6, 0]} center zIndexRange={[100, 0]}>
                <div className="text-[10px] font-mono tracking-widest px-3 py-2 bg-emerald-950/90 border border-emerald-500/60 rounded backdrop-blur-md text-emerald-100 whitespace-nowrap shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <div className="font-bold text-emerald-300 text-[12px] mb-1 pb-1 border-b border-emerald-500/30 flex items-center justify-between gap-2">
                    <span>FUNCTIONAL GROUP</span>
                    <span className="text-[9px] px-1 bg-emerald-500/20 rounded">IDENTIFIED</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-emerald-400 uppercase">
                    <div>Type: {selectedGroup.type}</div>
                    <div>Atoms: {selectedGroup.atomIds.length}</div>
                  </div>
                </div>
              </Html>
           </group>
        )}
        {/* Measurement Graphics */}
        {measurementMode && measurementSequence.length >= 2 && (
          <group>
            {/* Draw lines between points */}
            {measurementSequence.map((atom, idx) => {
              if (idx === 0) return null;
              const prev = measurementSequence[idx - 1];
              const pA = prev.position.clone();
              const pB = atom.position.clone();
              if (isAnalytical) {
                pA.multiplyScalar(1.5);
                pB.multiplyScalar(1.5);
              }
              const mid = pA.clone().lerp(pB, 0.5);
              const dist = pA.distanceTo(pB);
              return (
                <group key={`meas-${prev.id}-${atom.id}`}>
                  <Line points={[pA, pB]} color="#00ff00" lineWidth={3} dashed dashScale={10} dashSize={1} gapSize={0.5} />
                  <Html position={mid} center zIndexRange={[100, 0]}>
                    <div className="bg-black/80 border border-green-500 text-green-400 font-mono text-[10px] px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(0,255,0,0.5)]">
                      {dist.toFixed(2)} Å <span className="text-[8px] text-green-500/80 ml-0.5">DERIVED</span>
                    </div>
                  </Html>
                </group>
              );
            })}
            
            {/* Angle between 3 points */}
            {measurementSequence.length === 3 && (() => {
              const [a1, a2, a3] = measurementSequence;
              const p1 = a1.position.clone();
              const p2 = a2.position.clone();
              const p3 = a3.position.clone();
              if (isAnalytical) {
                p1.multiplyScalar(1.5);
                p2.multiplyScalar(1.5);
                p3.multiplyScalar(1.5);
              }
              const v1 = p1.clone().sub(p2).normalize();
              const v2 = p3.clone().sub(p2).normalize();
              const angle = v1.angleTo(v2) * (180 / Math.PI);
              
              return (
                <Html position={p2.clone().add(new THREE.Vector3(0, 0.5, 0))} center zIndexRange={[100, 0]}>
                  <div className="bg-black/80 border border-green-500 text-green-400 font-mono text-[10px] px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(0,255,0,0.5)] flex items-center gap-1">
                    <span className="font-bold">∠</span> {angle.toFixed(1)}° <span className="text-[8px] text-green-500/80 ml-0.5">DERIVED</span>
                  </div>
                </Html>
              );
            })()}
          </group>
        )}

      </group>
    </Float>
  );
}

function HighFidelityAtom({ 
  atom, 
  mode, 
  isSelected, 
  isSecondary, 
  inSelectedGroup, 
  onClick, 
  onPositionChange,
  showAnnotations 
}: { 
  atom: AtomData; 
  mode: string; 
  isSelected: boolean; 
  isSecondary: boolean; 
  inSelectedGroup: boolean; 
  onClick: (e?: any) => void;
  onPositionChange?: (newPos: THREE.Vector3) => void;
  showAnnotations?: boolean;
}) {
  const { color, size: baseRadius } = getAtomProps(atom.element);
  const radius = baseRadius * 0.8;
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pulse, setPulse] = useState(true);
  const meshRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, gl } = useThree();
  
  React.useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 1000);
    return () => clearTimeout(t);
  }, []);

  const targetPos = useMemo(() => {
    if (mode === 'ANALYTICAL') {
      return atom.position.clone().multiplyScalar(1.5);
    }
    return atom.position.clone();
  }, [atom.position, mode]);

  useFrame((state, delta) => {
    if (meshRef.current && !isDragging) {
      let currentY = targetPos.y;
      if (mode === 'DYNAMIC') {
        const time = state.clock.elapsedTime;
        const offset = Math.sin(time * 10 + atom.position.x * 5) * 0.05;
        currentY += offset;
      }
      easing.damp3(meshRef.current.position, [targetPos.x, currentY, targetPos.z], 0.3, delta);
    }
    if (pulseRef.current && pulse) {
       pulseRef.current.scale.lerp(new THREE.Vector3(2.5, 2.5, 2.5), 0.15);
       const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
       if (mat) {
         mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0, 0.15);
       }
    }
  });

  const displayColor = isSecondary ? "#f59e0b" : inSelectedGroup ? "#10b981" : color;
  const emissiveColor = isSecondary ? "#d97706" : inSelectedGroup ? "#059669" : (isSelected ? "#06b6d4" : color);
  const isHighlight = hovered || isSelected || isSecondary || inSelectedGroup;

  // Pointer drag handling for 3D atom position manipulation
  const plane = useMemo(() => new THREE.Plane(), []);
  const planeIntersect = useMemo(() => new THREE.Vector3(), []);

  const handlePointerDown = useCallback((e: any) => {
    if (e.button !== 0) return; // only left click
    e.stopPropagation();
    setIsDragging(true);
    // Orient plane facing camera at atom's current position
    const normal = new THREE.Vector3().subVectors(camera.position, atom.position).normalize();
    plane.setFromNormalAndCoplanarPoint(normal, atom.position);
  }, [camera, atom.position, plane]);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(plane, planeIntersect)) {
      if (meshRef.current) {
        meshRef.current.position.copy(planeIntersect);
      }
      if (onPositionChange) {
        onPositionChange(planeIntersect.clone());
      }
    }
  }, [isDragging, plane, planeIntersect, onPositionChange]);

  const handlePointerUp = useCallback((e: any) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
    }
  }, [isDragging]);

  return (
    <group 
      ref={meshRef} 
      position={targetPos}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
    >
      {/* Core Nucleus */}
      <mesh>
        <icosahedronGeometry args={[radius * 0.28, 2]} />
        <meshStandardMaterial 
          color={displayColor} 
          emissive={emissiveColor} 
          emissiveIntensity={isHighlight ? 3.5 : 1.5} 
          roughness={0.1} 
          metalness={0.85} 
        />
      </mesh>
      
      {/* Electron Cloud Volume */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial 
          color={displayColor} 
          transparent 
          opacity={isHighlight ? 0.45 : 0.18} 
          roughness={0.1} 
          transmission={0.88} 
          thickness={0.5} 
          clearcoat={1} 
          depthWrite={false} 
        />
      </mesh>

      {/* Holographic Wireframe Cage */}
      <mesh scale={[1.08, 1.08, 1.08]}>
        <icosahedronGeometry args={[radius, 1]} />
        <meshBasicMaterial 
          color={isSelected ? "#ffffff" : (isSecondary ? "#fef08a" : displayColor)} 
          wireframe 
          transparent 
          opacity={isSelected ? 0.6 : (isSecondary ? 0.5 : (inSelectedGroup ? 0.35 : 0.15))} 
          blending={THREE.AdditiveBlending} 
        />
      </mesh>

      {/* Primary Selection Reticle */}
      {isSelected && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.3, radius * 1.38, 32]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[radius * 1.3, radius * 1.38, 32]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Secondary Selection Ring */}
      {isSecondary && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.3, radius * 1.38, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Contextual Floating 3D Callout */}
      {(hovered || isSelected || isSecondary) && !inSelectedGroup && (
        <Html position={[0, radius + 0.35, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2.5 py-1.5 bg-slate-950/95 border border-cyan-500/60 rounded backdrop-blur-md text-cyan-50 whitespace-nowrap shadow-[0_0_18px_rgba(34,211,238,0.35)]">
            <div className="font-bold text-cyan-300 text-[11px] mb-1 pb-1 border-b border-cyan-500/30 flex items-center justify-between gap-2">
              <span>{atom.element} ({atom.id})</span>
              {isSelected && <span className="text-[8px] px-1 bg-cyan-500/20 text-cyan-200 rounded">ACTIVE</span>}
              {isSecondary && <span className="text-[8px] px-1 bg-amber-500/20 text-amber-300 rounded">TARGET 2</span>}
            </div>
            <div className="flex flex-col gap-0.5 text-cyan-400/90 text-[9px] uppercase">
              <div>HYBRIDIZATION: <span className="text-cyan-200 font-bold">{atom.hybridization || 'sp³'}</span></div>
              <div>RADIUS: <span className="text-cyan-200 font-bold">{(baseRadius * 100).toFixed(0)} pm</span></div>
              {atom.charge !== undefined && atom.charge !== 0 && (
                <div>FORMAL CHARGE: <span className="text-amber-300 font-bold">{atom.charge > 0 ? `+${atom.charge}` : atom.charge}</span></div>
              )}
            </div>
          </div>
        </Html>
      )}
      
      {(hovered && inSelectedGroup) && (
        <Html position={[0, radius + 0.35, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2 py-1 bg-slate-950/90 border border-emerald-500/50 rounded text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
             {atom.element} in Group
          </div>
        </Html>
      )}
    </group>
  );
}

function HighFidelityBond({ 
  bond, 
  posA, 
  posB, 
  elementA, 
  elementB, 
  mode, 
  isSelected, 
  inSelectedGroup, 
  onClick 
}: { 
  bond: BondData; 
  posA: THREE.Vector3; 
  posB: THREE.Vector3; 
  elementA: string; 
  elementB: string; 
  mode: string; 
  isSelected: boolean; 
  inSelectedGroup: boolean; 
  onClick: () => void; 
}) {
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
      
      // Dynamic vibration offset
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
  const spacing = 0.14;
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

  const bondRadius = 0.045;
  const gap = mode === 'ANALYTICAL' ? 0.7 : 0.5; 
  
  const getBondColor = (i: number) => {
     if (inSelectedGroup) return "#10b981";
     if (isSelected) return "#fcd34d";
     if (hovered) return "#38bdf8";
     if (bond.type === 'aromatic' && i === 1) return "#a855f7";
     return "#94a3b8";
  };
  
  const getEmissive = () => {
     if (inSelectedGroup) return "#059669";
     if (isSelected) return "#f59e0b";
     if (hovered) return "#0284c7";
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
      {/* Invisible pick hit-cylinder for easy clicking */}
      <mesh visible={false}>
        <cylinderGeometry args={[0.35, 0.35, 1, 8]} />
        <meshBasicMaterial />
      </mesh>
      
      {offsets.map((offset, i) => (
        <group key={i} position={new THREE.Vector3(...offset)}>
          <mesh scale={[1, Math.max(0.01, (length - gap) / length), 1]}>
             <cylinderGeometry args={[bondRadius, bondRadius, 1, 14]} />
             <meshStandardMaterial 
               color={getBondColor(i)} 
               emissive={getEmissive()}
               emissiveIntensity={isSelected || inSelectedGroup ? 2.0 : (hovered ? 1.0 : 0)}
               roughness={0.25} 
               metalness={0.65} 
               transparent={bond.type === 'aromatic' && i === 1}
               opacity={bond.type === 'aromatic' && i === 1 ? 0.6 : 1}
             />
          </mesh>
        </group>
      ))}

      {/* Bond Callout Badge */}
      {(hovered || isSelected) && !inSelectedGroup && (
        <Html position={[0, 0, 0]} center zIndexRange={[90, 0]}>
          <div className="text-[9px] font-mono tracking-widest px-2.5 py-1.5 bg-slate-950/95 border border-cyan-500/60 rounded backdrop-blur-md text-cyan-200 whitespace-nowrap shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <div className="font-bold text-amber-300 text-[11px] mb-1 pb-1 border-b border-amber-500/30 flex items-center justify-between gap-2">
              <span>{bond.order === 1 ? 'SINGLE (σ)' : (bond.order === 2 ? 'DOUBLE (σ + π)' : 'TRIPLE (σ + 2π)')}</span>
              {isSelected && <span className="text-[8px] px-1 bg-amber-500/20 text-amber-200 rounded">SELECTED</span>}
            </div>
            <div className="flex flex-col gap-0.5 text-cyan-400 text-[9px] uppercase">
              <div>BOND LENGTH: <span className="text-cyan-100 font-bold">{length.toFixed(2)} Å</span></div>
              <div>CONNECTS: <span className="text-cyan-100 font-bold">{elementA} ↔ {elementB}</span></div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

