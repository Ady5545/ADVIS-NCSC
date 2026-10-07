import React from 'react';
import { Box, Cylinder, RoundedBox, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// Original model was ONE cylinder labelled "Stator, Rotor & Housing Assembly" -- a single
// collapsed shape standing in for every subsystem the educational copy actually described.
// Rebuilt with the real radial-flux PMSM anatomy: separate stator core + windings, rotor core +
// surface-mounted magnets, shaft, bearings, housing, and terminal box.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.75, roughness = 0.35, emissive, emissiveIntensity = 0 }: {
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
      clearcoatRoughness={0.15}
      envMapIntensity={1.4}
      emissive={emissive ?? (state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000')}
      emissiveIntensity={emissive ? emissiveIntensity : (state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0)}
    />
  );
}

/** Laminated steel stator with visible slots around the inner bore where windings sit. */
export function PmsmStatorCore({ state }: { state: State }) {
  const slots = 24;
  return (
    <group>
      <Cylinder args={[0.42, 0.42, 0.7, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#374151" metalness={0.7} roughness={0.4} />
      </Cylinder>
      <Cylinder args={[0.3, 0.3, 0.72, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#1f2937" metalness={0.6} roughness={0.5} />
      </Cylinder>
      {Array.from({ length: slots }).map((_, i) => {
        const a = (i / slots) * Math.PI * 2;
        return (
          <Box key={i} args={[0.04, 0.73, 0.1]} position={[Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35]} rotation={[0, -a, 0]}>
            <Pbr state={state} color="#111827" metalness={0.65} roughness={0.5} />
          </Box>
        );
      })}
    </group>
  );
}

/** Copper windings threaded through the stator slots — the actual electromagnet coils. */
export function PmsmWindings({ state }: { state: State }) {
  const slots = 24;
  return (
    <group>
      {Array.from({ length: slots }).map((_, i) => {
        const a = (i / slots) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33]} rotation={[0, -a, 0]}>
            <Torus args={[0.09, 0.02, 8, 16, Math.PI]} rotation={[0, Math.PI / 2, 0]} position={[0, 0.3, 0]}>
              <Pbr state={state} color="#d97706" metalness={0.85} roughness={0.25} emissive="#f59e0b" emissiveIntensity={0.08} />
            </Torus>
            <Torus args={[0.09, 0.02, 8, 16, Math.PI]} rotation={[0, -Math.PI / 2, Math.PI]} position={[0, -0.3, 0]}>
              <Pbr state={state} color="#d97706" metalness={0.85} roughness={0.25} emissive="#f59e0b" emissiveIntensity={0.08} />
            </Torus>
          </group>
        );
      })}
    </group>
  );
}

export function PmsmRotorCore({ state }: { state: State }) {
  return (
    <Cylinder args={[0.24, 0.24, 0.68, 40]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#4b5563" metalness={0.72} roughness={0.38} />
    </Cylinder>
  );
}

/** Surface-mounted permanent magnets around the rotor, alternating N/S polarity (shown as
 * alternating colour) — what actually makes it synchronous with the rotating stator field. */
export function PmsmMagnets({ state }: { state: State }) {
  const count = 8;
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const north = i % 2 === 0;
        return (
          <Box key={i} args={[0.1, 0.6, 0.03]} position={[Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26]} rotation={[0, -a, 0]}>
            <Pbr state={state} color={north ? '#dc2626' : '#2563eb'} metalness={0.3} roughness={0.4} emissive={north ? '#dc2626' : '#2563eb'} emissiveIntensity={0.25} />
          </Box>
        );
      })}
    </group>
  );
}

export function PmsmShaft({ state }: { state: State }) {
  return (
    <Cylinder args={[0.06, 0.06, 1.3, 24]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#c7cdd6" metalness={0.95} roughness={0.12} />
    </Cylinder>
  );
}

export function PmsmBearings({ state }: { state: State }) {
  return (
    <group>
      {[0.42, -0.42].map((z, i) => (
        <group key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <Cylinder args={[0.1, 0.1, 0.06, 24]}>
            <Pbr state={state} color="#e2e6ea" metalness={0.9} roughness={0.15} />
          </Cylinder>
          <Cylinder args={[0.07, 0.07, 0.065, 24]}>
            <Pbr state={state} color="#9aa0a8" metalness={0.7} roughness={0.3} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

/** Finned aluminum housing shell, the outer casing with cooling ribs. */
export function PmsmHousing({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.5, 0.5, 0.75, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#6b7280" metalness={0.55} roughness={0.45} />
      </Cylinder>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <Box key={i} args={[0.015, 0.73, 0.06]} position={[Math.cos(a) * 0.51, 0, Math.sin(a) * 0.51]} rotation={[0, -a, 0]}>
            <Pbr state={state} color="#5a6069" metalness={0.5} roughness={0.5} />
          </Box>
        );
      })}
      {[0.4, -0.4].map((z, i) => (
        <Cylinder key={i} args={[0.5, 0.5, 0.05, 48]} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <Pbr state={state} color="#5a6069" metalness={0.55} roughness={0.45} />
        </Cylinder>
      ))}
    </group>
  );
}

export function PmsmTerminalBox({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.22, 0.18, 0.2]} radius={0.02} smoothness={2}>
        <Pbr state={state} color="#1c1c1e" metalness={0.2} roughness={0.5} />
      </RoundedBox>
      {[-0.04, 0, 0.04].map((x, i) => (
        <Cylinder key={i} args={[0.015, 0.015, 0.06, 10]} position={[x, 0.11, 0]}>
          <Pbr state={state} color="#9ca3ae" metalness={0.8} roughness={0.3} />
        </Cylinder>
      ))}
    </group>
  );
}

export function renderPmsmPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'pmsm_motor') return null;
  switch (componentId) {
    case 'pmsm_stator_core': return <PmsmStatorCore state={state} />;
    case 'pmsm_windings': return <PmsmWindings state={state} />;
    case 'pmsm_rotor_core': return <PmsmRotorCore state={state} />;
    case 'pmsm_magnets': return <PmsmMagnets state={state} />;
    case 'pmsm_shaft': return <PmsmShaft state={state} />;
    case 'pmsm_bearings': return <PmsmBearings state={state} />;
    case 'pmsm_housing': return <PmsmHousing state={state} />;
    case 'pmsm_terminal_box': return <PmsmTerminalBox state={state} />;
    default: return null;
  }
}
