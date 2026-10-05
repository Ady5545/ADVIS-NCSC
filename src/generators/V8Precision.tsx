import React from 'react';
import { Box, Cylinder, RoundedBox, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// A real 90-degree V8: two banks of 4 cylinders each, OHV pushrod layout (single center
// camshaft in the block, like the classic American small-block this spec data describes).
// Bank geometry: each bank is tilted +/-45 deg off vertical (90 deg between banks total).
// Cylinder spacing along the crank axis (Z) is shared by both banks; cylinders 1/2/3/4 run
// front-to-back on each side, offset slightly bank-to-bank as on a real V8 crank journal share.

type State = AdvancedEngineeringModelProps;
const BANK_ANGLE = Math.PI / 4; // 45 deg each side of vertical = 90 deg V
const CYL_Z = [-0.66, -0.22, 0.22, 0.66]; // 4 cylinder positions along the engine's length

function Pbr({ state, color, metalness = 0.8, roughness = 0.3, emissive, emissiveIntensity = 0 }: {
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
      clearcoat={0.18}
      clearcoatRoughness={0.15}
      envMapIntensity={1.4}
      emissive={emissive ?? (state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000')}
      emissiveIntensity={emissive ? emissiveIntensity : (state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0)}
    />
  );
}

function BoltRing({ state, count, radius, y = 0, size = 0.012 }: { state: State; count: number; radius: number; y?: number; size?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[size, size, size * 1.8, 8]} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <Pbr state={state} color="#cbd5e1" metalness={0.95} roughness={0.14} />
          </Cylinder>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// 1. Short block: the main casting both banks and the crankcase sit inside.
// ---------------------------------------------------------------------------------------------
export function V8Block({ state }: { state: State }) {
  return (
    <group>
      {/* Crankcase */}
      <RoundedBox args={[0.62, 0.46, 1.8]} radius={0.05} smoothness={4}>
        <Pbr state={state} color="#3a4049" metalness={0.72} roughness={0.38} />
      </RoundedBox>
      {/* Two angled bank decks */}
      {[-1, 1].map((side) => (
        <group key={side} rotation={[0, 0, side * BANK_ANGLE]} position={[side * 0.22, 0.28, 0]}>
          <RoundedBox args={[0.5, 0.42, 1.74]} radius={0.04} smoothness={3} position={[side * 0.22, 0.18, 0]}>
            <Pbr state={state} color="#434a54" metalness={0.75} roughness={0.35} />
          </RoundedBox>
        </group>
      ))}
      {/* Front/rear bosses */}
      <Cylinder args={[0.22, 0.22, 0.1, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.04, -0.95]}>
        <Pbr state={state} color="#3a4049" metalness={0.72} roughness={0.38} />
      </Cylinder>
      <BoltRing state={state} count={18} radius={0.5} y={-0.22} size={0.011} />
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 2. Crankshaft: a real shaft with 4 throws and counterweights, not a plain rod.
// ---------------------------------------------------------------------------------------------
export function V8Crankshaft({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.065, 0.065, 1.95, 24]}>
        <Pbr state={state} color="#9aa4b0" metalness={0.95} roughness={0.15} />
      </Cylinder>
      {CYL_Z.map((z, i) => (
        <group key={i} position={[0, z, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
          {/* Counterweight */}
          <Box args={[0.22, 0.13, 0.05]} position={[0, -0.1, 0]}>
            <Pbr state={state} color="#878f9c" metalness={0.92} roughness={0.18} />
          </Box>
          {/* Crank pin (offset journal) */}
          <Cylinder args={[0.045, 0.045, 0.1, 16]} position={[0.1, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <Pbr state={state} color="#b7bfca" metalness={0.96} roughness={0.12} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 3. Pistons + connecting rods for one bank (4 cylinders).
// ---------------------------------------------------------------------------------------------
function PistonRod({ state, z }: { state: State; z: number }) {
  return (
    <group position={[0, 0, z]}>
      <Cylinder args={[0.095, 0.095, 0.1, 24]} position={[0, 0.38, 0]}>
        <Pbr state={state} color="#c7cdd6" metalness={0.5} roughness={0.3} />
      </Cylinder>
      {[0, 1, 2].map((r) => (
        <Torus key={r} args={[0.095, 0.004, 6, 20]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.41 - r * 0.02, 0]}>
          <Pbr state={state} color="#e2e6ea" metalness={0.8} roughness={0.2} />
        </Torus>
      ))}
      {/* H-beam connecting rod */}
      <Box args={[0.03, 0.34, 0.05]} position={[0, 0.17, 0]}>
        <Pbr state={state} color="#a3abb6" metalness={0.85} roughness={0.22} />
      </Box>
      <Cylinder args={[0.05, 0.05, 0.06, 16]} position={[0, 0, 0]}>
        <Pbr state={state} color="#a3abb6" metalness={0.85} roughness={0.22} />
      </Cylinder>
    </group>
  );
}

export function V8PistonBank({ state }: { state: State }) {
  return (
    <group>
      {CYL_Z.map((z, i) => <PistonRod key={i} state={state} z={z} />)}
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 4. Cylinder head: 4 combustion chambers, intake+exhaust valve pairs, spark plug bosses.
// ---------------------------------------------------------------------------------------------
export function V8Head({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.46, 0.2, 1.74]} radius={0.03} smoothness={3}>
        <Pbr state={state} color="#525a66" metalness={0.78} roughness={0.32} />
      </RoundedBox>
      {CYL_Z.map((z, i) => (
        <group key={i} position={[0, 0.1, z]}>
          {/* Intake + exhaust valve stems poking up through the head deck */}
          <Cylinder args={[0.012, 0.012, 0.14, 10]} position={[-0.09, 0.07, -0.08]}>
            <Pbr state={state} color="#38bdf8" metalness={0.9} roughness={0.18} />
          </Cylinder>
          <Cylinder args={[0.012, 0.012, 0.14, 10]} position={[0.09, 0.07, 0.08]}>
            <Pbr state={state} color="#f59e0b" metalness={0.9} roughness={0.18} />
          </Cylinder>
          {/* Spark plug boss */}
          <Cylinder args={[0.018, 0.018, 0.1, 10]} position={[0, 0.08, 0]}>
            <Pbr state={state} color="#e2e6ea" metalness={0.5} roughness={0.3} />
          </Cylinder>
        </group>
      ))}
      <BoltRing state={state} count={12} radius={0.2} y={-0.09} size={0.009} />
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 5. Valve cover: the visible finned/ribbed cap over each head.
// ---------------------------------------------------------------------------------------------
export function V8ValveCover({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.42, 0.14, 1.7]} radius={0.04} smoothness={4}>
        <Pbr state={state} color="#9ca3ae" metalness={0.88} roughness={0.22} />
      </RoundedBox>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box key={i} args={[0.44, 0.012, 0.03]} position={[0, 0.06, -0.75 + i * 0.3]}>
          <Pbr state={state} color="#7d848f" metalness={0.8} roughness={0.3} />
        </Box>
      ))}
      <BoltRing state={state} count={10} radius={0.18} y={0.06} size={0.008} />
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 6. Camshaft: single center cam (OHV layout) with visible lobes.
// ---------------------------------------------------------------------------------------------
export function V8Camshaft({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.035, 0.035, 1.9, 20]}>
        <Pbr state={state} color="#cbd1d9" metalness={0.9} roughness={0.2} />
      </Cylinder>
      {CYL_Z.flatMap((z) => [z - 0.06, z + 0.06]).map((z, i) => (
        <Box key={i} args={[0.07, 0.09, 0.025]} position={[0, z, 0.03]} rotation={[0, 0, (i * 47) % 360 * Math.PI / 180]}>
          <Pbr state={state} color="#b9c0c9" metalness={0.88} roughness={0.22} />
        </Box>
      ))}
      <Torus args={[0.06, 0.012, 8, 20]} position={[0, -0.97, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#d99a3a" metalness={0.5} roughness={0.35} />
      </Torus>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 7. Intake manifold: plenum spanning the V with 8 runners dropping into each bank.
// ---------------------------------------------------------------------------------------------
export function V8IntakeManifold({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.46, 0.18, 1.5]} radius={0.05} smoothness={4} position={[0, 0.1, 0]}>
        <Pbr state={state} color="#6b7280" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {[-1, 1].map((side) => CYL_Z.map((z, i) => (
        <Cylinder key={`${side}-${i}`} args={[0.045, 0.05, 0.22, 16]} position={[side * 0.22, -0.02, z]} rotation={[0, 0, side * 0.5]}>
          <Pbr state={state} color="#5a6069" metalness={0.5} roughness={0.4} />
        </Cylinder>
      )))}
      <Cylinder args={[0.09, 0.14, 0.12, 24]} position={[0, 0.24, -0.5]}>
        <Pbr state={state} color="#8a909b" metalness={0.65} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 8. Exhaust manifold / header: curved tubes collecting from 4 ports into one pipe.
// ---------------------------------------------------------------------------------------------
export function V8ExhaustManifold({ state }: { state: State }) {
  return (
    <group>
      {CYL_Z.map((z, i) => (
        <Cylinder key={i} args={[0.035, 0.035, 0.3, 14]} position={[0.12, -0.1 + i * 0.015, z]} rotation={[0, 0, 0.3]}>
          <Pbr state={state} color="#4b4f56" metalness={0.6} roughness={0.5} />
        </Cylinder>
      ))}
      <Cylinder args={[0.07, 0.06, 1.4, 20]} position={[0.26, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#3e4247" metalness={0.65} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 9. Timing cover + crank pulley at the front of the block.
// ---------------------------------------------------------------------------------------------
export function V8TimingCover({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.58, 0.44, 0.14]} radius={0.06} smoothness={4}>
        <Pbr state={state} color="#4a515c" metalness={0.75} roughness={0.35} />
      </RoundedBox>
      <Cylinder args={[0.18, 0.18, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.3} roughness={0.55} />
      </Cylinder>
      <BoltRing state={state} count={12} radius={0.24} y={0} size={0.009} />
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 10. Oil pan: the sump at the bottom of the block.
// ---------------------------------------------------------------------------------------------
export function V8OilPan({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.54, 0.06, 1.6]} radius={0.02} smoothness={2} position={[0, 0.1, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.44, 0.22, 1.3]} radius={0.04} smoothness={3} position={[0, -0.08, 0]}>
        <Pbr state={state} color="#23262b" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <Cylinder args={[0.025, 0.025, 0.03, 10]} position={[0, -0.19, 0.6]}>
        <Pbr state={state} color="#8a909b" metalness={0.8} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// 11. Front accessory drive: crank pulley, serpentine belt loop, alternator stub.
// ---------------------------------------------------------------------------------------------
export function V8Accessories({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.16, 0.16, 0.08, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.2} roughness={0.6} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.14, 24]} position={[0.26, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.06, 0.06, 0.08, 20]} position={[-0.22, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </Cylinder>
      <Sphere args={[0.12, 16, 12]} position={[0, -0.24, 0.1]}>
        <Pbr state={state} color="#9ca3ae" metalness={0.75} roughness={0.35} />
      </Sphere>
      {/* Belt as a thin flattened torus looping the pulleys (schematic, not path-following) */}
      <Torus args={[0.2, 0.012, 6, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0.02, 0.0, 0]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.1} roughness={0.75} />
      </Torus>
    </group>
  );
}

export function renderV8PrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'v8_engine') return null;
  switch (componentId) {
    case 'v8_block': return <V8Block state={state} />;
    case 'v8_crankshaft': return <V8Crankshaft state={state} />;
    case 'v8_pistons_a': return <V8PistonBank state={state} />;
    case 'v8_pistons_b': return <V8PistonBank state={state} />;
    case 'v8_head_a': return <V8Head state={state} />;
    case 'v8_head_b': return <V8Head state={state} />;
    case 'v8_valve_cover_a': return <V8ValveCover state={state} />;
    case 'v8_valve_cover_b': return <V8ValveCover state={state} />;
    case 'v8_camshaft': return <V8Camshaft state={state} />;
    case 'v8_intake': return <V8IntakeManifold state={state} />;
    case 'v8_exhaust_a': return <V8ExhaustManifold state={state} />;
    case 'v8_exhaust_b': return <V8ExhaustManifold state={state} />;
    case 'v8_timing_cover': return <V8TimingCover state={state} />;
    case 'v8_oil_pan': return <V8OilPan state={state} />;
    case 'v8_accessories': return <V8Accessories state={state} />;
    default: return null;
  }
}
