import React from 'react';
import { Box, Cylinder, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// The existing single-component geometry (3 compressor stages, combustor, 3 turbine stages,
// shaft) was actually solid as a visual -- but it was one collapsed 'jetengine.core' component,
// so none of those stages could be individually selected or exploded, which is exactly what the
// axial-flow layout (intake -> compression -> combustion -> turbine -> exhaust) is supposed to
// teach. Split into real stages here, plus a fan stage and exhaust nozzle that were missing.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.9, roughness = 0.2, emissive, emissiveIntensity = 0 }: {
  state: State; color: string; metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number;
}) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.42} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.18 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.26 : 1}
      transmission={state.xrayEnabled ? 0.42 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.2}
      clearcoatRoughness={0.1}
      envMapIntensity={1.5}
      emissive={emissive ?? (state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000')}
      emissiveIntensity={emissive ? emissiveIntensity : (state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0)}
    />
  );
}

/** One rotor+stator blade row pair, the repeating unit of every axial compressor/turbine stage. */
function BladeStage({ state, rotorColor, statorColor, rotorRot = 0.16, statorRot = 0.12 }: {
  state: State; rotorColor: string; statorColor: string; rotorRot?: number; statorRot?: number;
}) {
  return (
    <group>
      {Array.from({ length: 34 }).map((_, i) => {
        const a = (i / 34) * Math.PI * 2;
        return (
          <Box key={i} args={[0.022, 0.12, 0.27]} position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]} rotation={[rotorRot, -a, 0.3]}>
            <Pbr state={state} color={rotorColor} metalness={0.96} roughness={0.17} />
          </Box>
        );
      })}
      {Array.from({ length: 18 }).map((_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return (
          <Box key={`s${i}`} args={[0.018, 0.14, 0.22]} position={[Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3]} rotation={[statorRot, -a, 0]}>
            <Pbr state={state} color={statorColor} metalness={0.92} roughness={0.2} />
          </Box>
        );
      })}
    </group>
  );
}

/** The fan: the large first-stage blades you see looking into any turbofan from the front. */
export function JetFan({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.6, 0.065, 20, 80]}>
        <Pbr state={state} color="#65717b" metalness={0.94} roughness={0.22} />
      </Torus>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <Box key={i} args={[0.03, 0.4, 0.09]} position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]} rotation={[0.1, -a, 0.5]}>
            <Pbr state={state} color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </Box>
        );
      })}
    </group>
  );
}

/** Axial compressor: multiple stages, each stage's blades a little smaller/tighter than the
 * last as air gets compressed further down the core. */
export function JetCompressor({ state }: { state: State }) {
  const stages = [0.3, 0.0, -0.3];
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {stages.map((y, s) => (
        <group key={s} position={[0, y, 0]}>
          <BladeStage state={state} rotorColor="#cbd5e1" statorColor="#7d8791" />
        </group>
      ))}
    </group>
  );
}

/** Combustor: fuel is injected and burned here, the hottest part of the engine. */
export function JetCombustor({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.47, 0.11, 20, 80]}>
        <Pbr state={state} color="#8b3e23" metalness={0.72} roughness={0.38} emissive="#c2410c" emissiveIntensity={0.15} />
      </Torus>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[0.055, 0.055, 0.38, 18]} position={[Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32]}>
            <Pbr state={state} color="#aa4f28" metalness={0.72} roughness={0.36} />
          </Cylinder>
        );
      })}
    </group>
  );
}

/** Turbine: hot combustion gas spins these stages, which drive the shaft back to the compressor
 * and fan — the whole reason a jet engine is self-sustaining once started. */
export function JetTurbine({ state }: { state: State }) {
  const stages = [0.28, 0.0, -0.28];
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {stages.map((y, s) => (
        <group key={s} position={[0, y, 0]}>
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <Box key={i} args={[0.02, 0.09, 0.25]} position={[Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34]} rotation={[-0.16, -a, -0.25]}>
                <Pbr state={state} color="#8f8a84" metalness={0.96} roughness={0.22} />
              </Box>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/** Exhaust nozzle: accelerates spent gas out the back, producing most of the engine's thrust. */
export function JetExhaustNozzle({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.42, 0.26, 0.5, 40, 1, true]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.8} roughness={0.3} />
      </Cylinder>
      <Torus args={[0.26, 0.02, 10, 40]} position={[0, -0.25, 0]}>
        <Pbr state={state} color="#e2e6ea" metalness={0.9} roughness={0.15} />
      </Torus>
    </group>
  );
}

export function JetShaft({ state }: { state: State }) {
  return (
    <Cylinder args={[0.075, 0.075, 2.7, 28]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#e2e7eb" metalness={0.99} roughness={0.1} />
    </Cylinder>
  );
}

export function JetCasing({ state }: { state: State }) {
  return (
    <Cylinder args={[0.68, 0.68, 2.6, 48, 1, true]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#475569" metalness={0.55} roughness={0.45} />
    </Cylinder>
  );
}

export function renderJetEnginePrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'jet_engine_core') return null;
  switch (componentId) {
    case 'jet_fan': return <JetFan state={state} />;
    case 'jet_compressor': return <JetCompressor state={state} />;
    case 'jet_combustor': return <JetCombustor state={state} />;
    case 'jet_turbine': return <JetTurbine state={state} />;
    case 'jet_exhaust_nozzle': return <JetExhaustNozzle state={state} />;
    case 'jet_shaft': return <JetShaft state={state} />;
    case 'jet_casing': return <JetCasing state={state} />;
    default: return null;
  }
}
