import React from 'react';
import { Box, Cylinder, RoundedBox } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// The original model was ONE component: a ring gear with no teeth, no pinion to drive it, no
// carrier to hold it, and none of the actual mechanism (spider/side gears, clutch pack) that
// makes a differential differential. Every one of those is the real working principle this
// model is supposed to teach, so they're added here.

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

function GearTeeth({ state, count, radius, color, depth = 0.05, width = 0.035 }: {
  state: State; count: number; radius: number; color: string; depth?: number; width?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Box key={i} args={[width, depth, width]} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
            <Pbr state={state} color={color} metalness={0.92} roughness={0.2} />
          </Box>
        );
      })}
    </>
  );
}

export function DiffRing({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.4, 0.4, 0.06, 40]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#cbd5e1" metalness={0.85} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 0.062, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.85} roughness={0.2} />
      </Cylinder>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <GearTeeth state={state} count={40} radius={0.4} color="#cbd5e1" />
      </group>
    </group>
  );
}

export function DiffPinion({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.09, 0.09, 0.34, 24]}>
        <Pbr state={state} color="#9ca3ae" metalness={0.9} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.035, 0.035, 0.9, 16]}>
        <Pbr state={state} color="#8a909b" metalness={0.92} roughness={0.18} />
      </Cylinder>
      <GearTeeth state={state} count={14} radius={0.1} color="#9ca3ae" width={0.025} />
    </group>
  );
}

export function DiffCarrier({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.5, 0.42]} radius={0.06} smoothness={4}>
        <Pbr state={state} color="#3c4047" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <Cylinder args={[0.17, 0.17, 0.5, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2e3136" metalness={0.45} roughness={0.55} />
      </Cylinder>
    </group>
  );
}

/** Spider bevel gears: small gears that rotate freely on a cross-pin, the mechanism that lets
 * wheels spin at different speeds in a turn. */
export function DiffSpiderGears({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.012, 0.012, 0.3, 10]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#d4d8de" metalness={0.9} roughness={0.15} />
      </Cylinder>
      {[0.12, -0.12].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Cylinder args={[0.08, 0.08, 0.08, 20]}>
            <Pbr state={state} color="#aeb4bd" metalness={0.9} roughness={0.2} />
          </Cylinder>
          <GearTeeth state={state} count={10} radius={0.08} color="#aeb4bd" width={0.018} depth={0.03} />
        </group>
      ))}
    </group>
  );
}

/** Side gears: mesh with the spider gears and connect out to each axle shaft. */
export function DiffSideGears({ state }: { state: State }) {
  return (
    <group>
      {[0.18, -0.18].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <Cylinder args={[0.1, 0.1, 0.06, 24]}>
            <Pbr state={state} color="#9ca3ae" metalness={0.9} roughness={0.2} />
          </Cylinder>
          <GearTeeth state={state} count={12} radius={0.1} color="#9ca3ae" width={0.02} depth={0.025} />
        </group>
      ))}
    </group>
  );
}

export function DiffAxleShafts({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {[0.5, -0.5].map((x, i) => (
        <Cylinder key={i} args={[0.035, 0.035, 0.7, 16]} position={[x, 0, 0]}>
          <Pbr state={state} color="#c7cdd6" metalness={0.92} roughness={0.18} />
        </Cylinder>
      ))}
    </group>
  );
}

/** The clutch pack is what makes this a LIMITED-SLIP differential: friction plates that
 * resist the spider gears spinning freely, so torque still partly reaches a slipping wheel. */
export function DiffClutchPack({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Cylinder key={i} args={[0.11, 0.11, 0.012, 32]} position={[0.1 + i * 0.016, 0, 0]}>
          <Pbr state={state} color={i % 2 === 0 ? '#2a2e34' : '#9ca3ae'} metalness={i % 2 === 0 ? 0.3 : 0.85} roughness={i % 2 === 0 ? 0.6 : 0.2} />
        </Cylinder>
      ))}
    </group>
  );
}

export function renderDifferentialPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'differential') return null;
  switch (componentId) {
    case 'diff_ring': return <DiffRing state={state} />;
    case 'diff_pinion': return <DiffPinion state={state} />;
    case 'diff_carrier': return <DiffCarrier state={state} />;
    case 'diff_spider_gears': return <DiffSpiderGears state={state} />;
    case 'diff_side_gears': return <DiffSideGears state={state} />;
    case 'diff_axle_shafts': return <DiffAxleShafts state={state} />;
    case 'diff_clutch_pack': return <DiffClutchPack state={state} />;
    default: return null;
  }
}
