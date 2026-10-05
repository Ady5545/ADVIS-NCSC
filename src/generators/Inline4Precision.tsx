import React from 'react';
import { Box, Cylinder, RoundedBox, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// A straight-4, DOHC (dual overhead cam, 16-valve): unlike the V8, all 4 cylinders sit upright
// in one bank, so there's no bank-angle tilt to apply -- but there ARE two camshafts (intake +
// exhaust) instead of one, which is the real DOHC-vs-OHV distinction worth showing.

type State = AdvancedEngineeringModelProps;
const CYL_Z = [-0.75, -0.25, 0.25, 0.75];

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

function BoltRing({ state, count, radius, y = 0, size = 0.011 }: { state: State; count: number; radius: number; y?: number; size?: number }) {
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

export function I4Block({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.6, 0.5, 1.8]} radius={0.05} smoothness={4}>
        <Pbr state={state} color="#475569" metalness={0.65} roughness={0.4} />
      </RoundedBox>
      {CYL_Z.map((z, i) => (
        <Cylinder key={i} args={[0.17, 0.17, 0.04, 20]} position={[0, 0.26, z]}>
          <Pbr state={state} color="#3d4a5c" metalness={0.5} roughness={0.5} />
        </Cylinder>
      ))}
      <BoltRing state={state} count={16} radius={0.42} y={-0.26} />
    </group>
  );
}

export function I4Crankshaft({ state }: { state: State }) {
  // Flat-plane crank: throws alternate at 180 degrees, unlike a V8's cross-plane layout.
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.06, 0.06, 1.85, 24]}>
        <Pbr state={state} color="#9aa4b0" metalness={0.95} roughness={0.15} />
      </Cylinder>
      {CYL_Z.map((z, i) => (
        <group key={i} position={[0, z, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
          <Box args={[0.2, 0.12, 0.045]} position={[0, -0.09, 0]}>
            <Pbr state={state} color="#878f9c" metalness={0.92} roughness={0.18} />
          </Box>
          <Cylinder args={[0.04, 0.04, 0.09, 16]} position={[0.09, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <Pbr state={state} color="#b7bfca" metalness={0.96} roughness={0.12} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

export function I4Pistons({ state }: { state: State }) {
  return (
    <group>
      {CYL_Z.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <Cylinder args={[0.085, 0.085, 0.09, 24]} position={[0, 0.36, 0]}>
            <Pbr state={state} color="#c7cdd6" metalness={0.5} roughness={0.3} />
          </Cylinder>
          {[0, 1, 2].map((r) => (
            <Torus key={r} args={[0.085, 0.004, 6, 20]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.39 - r * 0.018, 0]}>
              <Pbr state={state} color="#e2e6ea" metalness={0.8} roughness={0.2} />
            </Torus>
          ))}
          <Box args={[0.028, 0.32, 0.045]} position={[0, 0.16, 0]}>
            <Pbr state={state} color="#a3abb6" metalness={0.85} roughness={0.22} />
          </Box>
          <Cylinder args={[0.045, 0.045, 0.055, 16]} position={[0, 0, 0]}>
            <Pbr state={state} color="#a3abb6" metalness={0.85} roughness={0.22} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

export function I4Head({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.56, 0.24, 1.78]} radius={0.04} smoothness={3}>
        <Pbr state={state} color="#525a66" metalness={0.78} roughness={0.32} />
      </RoundedBox>
      {CYL_Z.map((z, i) => (
        <group key={i} position={[0, 0.12, z]}>
          {/* DOHC: 2 intake + 2 exhaust valve stems per cylinder */}
          {[-0.12, -0.04].map((x, vi) => (
            <Cylinder key={`in-${vi}`} args={[0.01, 0.01, 0.16, 10]} position={[x, 0.08, -0.07]}>
              <Pbr state={state} color="#38bdf8" metalness={0.9} roughness={0.18} />
            </Cylinder>
          ))}
          {[0.04, 0.12].map((x, vi) => (
            <Cylinder key={`ex-${vi}`} args={[0.01, 0.01, 0.16, 10]} position={[x, 0.08, 0.07]}>
              <Pbr state={state} color="#f59e0b" metalness={0.9} roughness={0.18} />
            </Cylinder>
          ))}
          <Cylinder args={[0.016, 0.016, 0.1, 10]} position={[0, 0.1, 0]}>
            <Pbr state={state} color="#e2e6ea" metalness={0.5} roughness={0.3} />
          </Cylinder>
        </group>
      ))}
      <BoltRing state={state} count={14} radius={0.24} y={-0.1} size={0.009} />
    </group>
  );
}

export function I4ValveCover({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.16, 1.74]} radius={0.04} smoothness={4}>
        <Pbr state={state} color="#9ca3ae" metalness={0.88} roughness={0.22} />
      </RoundedBox>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} args={[0.52, 0.012, 0.03]} position={[0, 0.07, -0.75 + i * 0.38]}>
          <Pbr state={state} color="#7d848f" metalness={0.8} roughness={0.3} />
        </Box>
      ))}
      <BoltRing state={state} count={10} radius={0.21} y={0.07} size={0.008} />
    </group>
  );
}

function Camshaft({ state, color, offsetX }: { state: State; color: string; offsetX: number }) {
  return (
    <group position={[offsetX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.028, 0.028, 1.8, 20]}>
        <Pbr state={state} color={color} metalness={0.9} roughness={0.2} />
      </Cylinder>
      {CYL_Z.map((z, i) => (
        <Box key={i} args={[0.06, 0.08, 0.02]} position={[0, z, 0.025]} rotation={[0, 0, (i * 53) % 360 * Math.PI / 180]}>
          <Pbr state={state} color={color} metalness={0.88} roughness={0.22} />
        </Box>
      ))}
    </group>
  );
}

/** DOHC = two camshafts (intake + exhaust), the defining feature versus the V8's single OHV cam. */
export function I4Camshafts({ state }: { state: State }) {
  return (
    <group>
      <Camshaft state={state} color="#38bdf8" offsetX={-0.08} />
      <Camshaft state={state} color="#f59e0b" offsetX={0.08} />
      <Torus args={[0.05, 0.01, 8, 20]} position={[-0.08, -0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#d99a3a" metalness={0.5} roughness={0.35} />
      </Torus>
      <Torus args={[0.05, 0.01, 8, 20]} position={[0.08, -0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#d99a3a" metalness={0.5} roughness={0.35} />
      </Torus>
    </group>
  );
}

export function I4Intake({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.3, 0.2, 1.4]} radius={0.04} smoothness={3} position={[-0.35, 0, 0]}>
        <Pbr state={state} color="#6b7280" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {CYL_Z.map((z, i) => (
        <Cylinder key={i} args={[0.05, 0.055, 0.3, 16]} position={[-0.1, -0.02, z]} rotation={[0, 0, 1.2]}>
          <Pbr state={state} color="#5a6069" metalness={0.5} roughness={0.4} />
        </Cylinder>
      ))}
      <Cylinder args={[0.1, 0.14, 0.14, 24]} position={[-0.42, 0.18, -0.6]} rotation={[0, 0, 0.3]}>
        <Pbr state={state} color="#8a909b" metalness={0.65} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

export function I4Exhaust({ state }: { state: State }) {
  return (
    <group>
      {CYL_Z.map((z, i) => (
        <Cylinder key={i} args={[0.035, 0.035, 0.32, 14]} position={[0.14, -0.08 + i * 0.012, z]} rotation={[0, 0, 0.35]}>
          <Pbr state={state} color="#4b4f56" metalness={0.6} roughness={0.5} />
        </Cylinder>
      ))}
      <Cylinder args={[0.065, 0.055, 1.5, 20]} position={[0.3, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#3e4247" metalness={0.65} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

export function I4TimingCover({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.56, 0.12]} radius={0.05} smoothness={4}>
        <Pbr state={state} color="#4a515c" metalness={0.75} roughness={0.35} />
      </RoundedBox>
      <Cylinder args={[0.16, 0.16, 0.08, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.12, -0.1]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.3} roughness={0.55} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.06, 24]} position={[-0.08, 0.2, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.06, 24]} position={[0.08, 0.2, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </Cylinder>
      <BoltRing state={state} count={10} radius={0.22} y={0} size={0.008} />
    </group>
  );
}

export function I4OilPan({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.05, 1.6]} radius={0.02} smoothness={2} position={[0, 0.08, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.18, 1.3]} radius={0.03} smoothness={3} position={[0, -0.06, 0]}>
        <Pbr state={state} color="#23262b" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <Cylinder args={[0.022, 0.022, 0.03, 10]} position={[0, -0.16, 0.55]}>
        <Pbr state={state} color="#8a909b" metalness={0.8} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

export function renderI4PrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'inline4_engine') return null;
  switch (componentId) {
    case 'i4_block': return <I4Block state={state} />;
    case 'i4_crankshaft': return <I4Crankshaft state={state} />;
    case 'i4_pistons': return <I4Pistons state={state} />;
    case 'i4_head': return <I4Head state={state} />;
    case 'i4_valve_cover': return <I4ValveCover state={state} />;
    case 'i4_camshafts': return <I4Camshafts state={state} />;
    case 'i4_intake': return <I4Intake state={state} />;
    case 'i4_exhaust': return <I4Exhaust state={state} />;
    case 'i4_timing_cover': return <I4TimingCover state={state} />;
    case 'i4_oil_pan': return <I4OilPan state={state} />;
    default: return null;
  }
}
