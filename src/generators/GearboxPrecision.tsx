import React from 'react';
import { Box, Cylinder, RoundedBox, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// Was ONE cylinder labelled "Main Gear Assembly". A real manual gearbox needs at minimum three
// shafts (input, counter, main/output) and multiple actual meshing gear pairs -- none of which
// existed. Rebuilt as the real 3-shaft layout a 6-speed manual actually uses.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.82, roughness = 0.3 }: { state: State; color: string; metalness?: number; roughness?: number }) {
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
      clearcoat={0.18}
      clearcoatRoughness={0.15}
      envMapIntensity={1.4}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0}
    />
  );
}

function GearTeeth({ state, count, radius, color, width = 0.03 }: { state: State; count: number; radius: number; color: string; width?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Box key={i} args={[width, 0.04, width]} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
            <Pbr state={state} color={color} metalness={0.92} roughness={0.2} />
          </Box>
        );
      })}
    </>
  );
}

function Gear({ state, r, count, color }: { state: State; r: number; count: number; color: string }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[r, r, 0.08, 32]}>
        <Pbr state={state} color={color} metalness={0.88} roughness={0.22} />
      </Cylinder>
      <GearTeeth state={state} count={count} radius={r} color={color} />
    </group>
  );
}

export function GbCase({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.9, 0.9, 1.6]} radius={0.08} smoothness={4}>
        <Pbr state={state} color="#3c4047" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <Cylinder args={[0.15, 0.15, 0.1, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.85]}>
        <Pbr state={state} color="#2e3136" metalness={0.45} roughness={0.55} />
      </Cylinder>
    </group>
  );
}

export function GbInputShaft({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
      <Cylinder args={[0.045, 0.045, 1.3, 20]}>
        <Pbr state={state} color="#c7cdd6" metalness={0.92} roughness={0.18} />
      </Cylinder>
    </group>
  );
}

export function GbCounterShaft({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
      <Cylinder args={[0.05, 0.05, 1.3, 20]}>
        <Pbr state={state} color="#b7bfca" metalness={0.92} roughness={0.18} />
      </Cylinder>
    </group>
  );
}

export function GbMainShaft({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0.3, 0.2, 0]}>
      <Cylinder args={[0.04, 0.04, 1.3, 20]}>
        <Pbr state={state} color="#c7cdd6" metalness={0.92} roughness={0.18} />
      </Cylinder>
    </group>
  );
}

function ClusterPair({ state, z, rA, rB }: { state: State; z: number; rA: number; rB: number }) {
  return (
    <group position={[0, 0, z]}>
      <group position={[0, 0.2, 0]}><Gear state={state} r={rA} count={Math.round(rA * 60)} color="#9ca3ae" /></group>
      <group position={[0, -0.22, 0]}><Gear state={state} r={rB} count={Math.round(rB * 60)} color="#aeb4bd" /></group>
    </group>
  );
}

export function GbGearClusterLow({ state }: { state: State }) {
  return <ClusterPair state={state} z={-0.5} rA={0.14} rB={0.2} />;
}
export function GbGearClusterMid({ state }: { state: State }) {
  return <ClusterPair state={state} z={0} rA={0.17} rB={0.17} />;
}
export function GbGearClusterHigh({ state }: { state: State }) {
  return <ClusterPair state={state} z={0.5} rA={0.2} rB={0.14} />;
}

/** Synchromesh collars: brass cone rings that spin-match a gear to the main shaft before the
 * dog teeth lock it, which is what lets you shift without grinding gears. */
export function GbSynchros({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0.3, 0.2, 0]}>
      {[-0.25, 0.25].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <Cylinder args={[0.1, 0.1, 0.1, 24]}>
            <Pbr state={state} color="#d99a3a" metalness={0.6} roughness={0.35} />
          </Cylinder>
          <Torus args={[0.1, 0.012, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <Pbr state={state} color="#f0b84a" metalness={0.5} roughness={0.3} />
          </Torus>
        </group>
      ))}
    </group>
  );
}

export function GbShiftFork({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.015, 0.015, 0.5, 10]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.5, 0]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.75} roughness={0.35} />
      </Cylinder>
      <Box args={[0.02, 0.45, 0.06]} position={[0, 0.27, 0]}>
        <Pbr state={state} color="#8a909b" metalness={0.72} roughness={0.38} />
      </Box>
      <Torus args={[0.08, 0.012, 8, 20]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <Pbr state={state} color="#7d848f" metalness={0.72} roughness={0.38} />
      </Torus>
    </group>
  );
}

export function GbReverseIdler({ state }: { state: State }) {
  return (
    <group position={[-0.3, -0.05, -0.75]}>
      <Gear state={state} r={0.12} count={10} color="#4b4f56" />
    </group>
  );
}

export function renderGearboxPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'gearbox') return null;
  switch (componentId) {
    case 'gb_case': return <GbCase state={state} />;
    case 'gb_input_shaft': return <GbInputShaft state={state} />;
    case 'gb_counter_shaft': return <GbCounterShaft state={state} />;
    case 'gb_main_shaft': return <GbMainShaft state={state} />;
    case 'gb_cluster_low': return <GbGearClusterLow state={state} />;
    case 'gb_cluster_mid': return <GbGearClusterMid state={state} />;
    case 'gb_cluster_high': return <GbGearClusterHigh state={state} />;
    case 'gb_synchros': return <GbSynchros state={state} />;
    case 'gb_shift_fork': return <GbShiftFork state={state} />;
    case 'gb_reverse_idler': return <GbReverseIdler state={state} />;
    default: return null;
  }
}
