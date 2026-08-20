
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LewisStructure, HolographicGrid } from './ChemistryPrimitives';
import { CHEMISTRY_DATABASE, resolveChemicalEntity } from './ChemistryDatabase';
import { ContinuousCovalentVisuals, ContinuousIonicVisuals } from './ContinuousVisuals';
import { MolecularVisuals } from './MolecularVisuals';

function InvalidAnalysisVisuals({ phase, entityName }: { phase: string, entityName: string }) {
  return (
    <group>
      <HolographicGrid />
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 1, 0]}>
           {/* Glitching Core */}
           <mesh>
             <icosahedronGeometry args={[1, 1]} />
             <meshBasicMaterial color={phase === 'invalid_analysis_rejected' ? '#ef4444' : '#fbbf24'} wireframe />
           </mesh>
           <mesh scale={[1.2, 1.2, 1.2]}>
             <icosahedronGeometry args={[1, 2]} />
             <meshBasicMaterial color={phase === 'invalid_analysis_rejected' ? '#991b1b' : '#b45309'} wireframe transparent opacity={0.3} />
           </mesh>
           <Html center position={[0, 2, 0]}>
             <div className="flex flex-col items-center">
                <div className={`text-[10px] font-mono tracking-[0.3em] font-bold px-2 py-1 border rounded uppercase ${phase === 'invalid_analysis_rejected' ? 'text-red-400 border-red-500/50 bg-red-950/50' : 'text-amber-400 border-amber-500/50 bg-amber-950/50'}`}>
                  {phase === 'invalid_analysis_start' && "VALENCE SCAN INITIATED"}
                  {phase === 'invalid_analysis_reason' && "OCTET VIOLATION DETECTED"}
                  {phase === 'invalid_analysis_rejected' && "STRUCTURE REJECTED"}
                </div>
                <div className="w-[1px] h-4 bg-gradient-to-b from-current to-transparent my-1"></div>
                <div className="text-sm font-mono tracking-widest text-white/80">{entityName}</div>
             </div>
           </Html>
        </group>
      </Float>
    </group>
  );
}

function UnsupportedVisuals({ entityName }: { entityName: string }) {
  return (
    <group>
      <HolographicGrid />
      <Float speed={1} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshBasicMaterial color="#64748b" wireframe />
        </mesh>
        <Html center position={[0, 3, 0]}>
          <div className="text-[10px] text-slate-400 font-mono tracking-[0.3em] font-bold px-2 py-1 border border-slate-700 rounded uppercase bg-slate-900/50">
            UNKNOWN ENTITY: {entityName}
          </div>
        </Html>
      </Float>
    </group>
  );
}

export function GenericChemistryVisuals({ entityName, stateId }: { entityName: string, stateId: string }) {
  const resolvedEntity = resolveChemicalEntity(entityName);
  const data = resolvedEntity || CHEMISTRY_DATABASE[entityName];
  const canonicalFormula = data ? data.formula : entityName;

  const s = stateId.split('_');
  const phase = s.slice(1).join('_'); // e.g. h2o_atoms -> atoms
  
  if (stateId.startsWith('invalid')) return <InvalidAnalysisVisuals phase={stateId} entityName={entityName} />;
  if (stateId.startsWith('unsupported')) return <UnsupportedVisuals entityName={entityName} />;
  
  if (!data) return <Text position={[0, 0, 0]} color="red">Unsupported Entity</Text>;

  // Use Lewis Structure 2D representation for specific steps
  const useLewis = data.bondType !== 'IONIC' && (phase.includes('lewis') || phase === 'valence' || (phase === 'bonds_only' && !data.hybridization));

  return (
    <>
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      <group>
        {data.bondType === 'IONIC' ? (
          <ContinuousIonicVisuals data={data} phase={phase} />
        ) : (
          <MolecularVisuals entityName={canonicalFormula} mode={phase === 'geometry' || phase === 'summary' ? 'ANALYTICAL' : 'NORMAL'} />
        )}
      </group>
      
      {/* Lewis Structure as an overlay in the corner */}
      {useLewis && (
        <group position={[3.5, 2.5, 0]}>
           <LewisStructure formula={data.formula} currentStepPhase={phase} isOverlay={true} />
        </group>
      )}
    </>
  );
}
