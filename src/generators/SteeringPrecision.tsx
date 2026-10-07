import React from 'react';
import { Box, Cylinder, RoundedBox, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// Original model was ONE plain box for the "rack" -- no teeth, no pinion driving it, no housing,
// no tie rods connecting it to the wheels, no column or wheel feeding it, no power assist.
// Rebuilt as the actual mechanical chain from steering wheel to tie rod.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.8, roughness = 0.3 }: { state: State; color: string; metalness?: number; roughness?: number }) {
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

export function SteerWheel({ state }: { state: State }) {
  return (
    <group>
      <Torus args={[0.22, 0.025, 12, 32]}>
        <Pbr state={state} color="#2a2e34" metalness={0.3} roughness={0.5} />
      </Torus>
      {[0, 1, 2].map((i) => (
        <Box key={i} args={[0.19, 0.02, 0.025]} rotation={[0, 0, (i / 3) * Math.PI * 2]} position={[0, 0, 0]}>
          <Pbr state={state} color="#3c4047" metalness={0.4} roughness={0.5} />
        </Box>
      ))}
      <Cylinder args={[0.05, 0.05, 0.03, 16]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.3} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

export function SteerColumn({ state }: { state: State }) {
  return (
    <Cylinder args={[0.025, 0.025, 0.7, 16]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#9aa0a8" metalness={0.75} roughness={0.35} />
    </Cylinder>
  );
}

function GearTeeth({ state, count, radius, color }: { state: State; count: number; radius: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Box key={i} args={[0.025, 0.03, 0.025]} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]} rotation={[0, 0, a]}>
            <Pbr state={state} color={color} metalness={0.92} roughness={0.2} />
          </Box>
        );
      })}
    </>
  );
}

export function SteerPinion({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.06, 0.06, 0.24, 20]}>
        <Pbr state={state} color="#c7cdd6" metalness={0.9} roughness={0.2} />
      </Cylinder>
      <GearTeeth state={state} count={12} radius={0.06} color="#c7cdd6" />
    </group>
  );
}

export function SteerRackBar({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.035, 0.035, 2.0, 20]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#94a3b8" metalness={0.88} roughness={0.22} />
      </Cylinder>
      {/* cut rack teeth along a short meshing section */}
      {Array.from({ length: 16 }).map((_, i) => (
        <Box key={i} args={[0.08, 0.025, 0.025]} position={[-0.3 + i * 0.04, 0.045, 0]}>
          <Pbr state={state} color="#c7cdd6" metalness={0.9} roughness={0.2} />
        </Box>
      ))}
    </group>
  );
}

export function SteerRackHousing({ state }: { state: State }) {
  return (
    <RoundedBox args={[2.1, 0.22, 0.2]} radius={0.06} smoothness={4}>
      <Pbr state={state} color="#3c4047" metalness={0.5} roughness={0.5} />
    </RoundedBox>
  );
}

export function SteerTieRods({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {[0.95, -0.95].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Cylinder args={[0.018, 0.018, 0.5, 14]}>
            <Pbr state={state} color="#9aa0a8" metalness={0.78} roughness={0.3} />
          </Cylinder>
          <Cylinder args={[0.03, 0.03, 0.08, 14]} position={[0, 0.27, 0]}>
            <Pbr state={state} color="#5a5f68" metalness={0.6} roughness={0.4} />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

export function SteerPowerAssist({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.14, 0.14, 0.3, 24]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.45} />
      </Cylinder>
      <Box args={[0.1, 0.1, 0.1]} position={[0.18, 0.1, 0]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.3} roughness={0.5} />
      </Box>
    </group>
  );
}

export function renderSteeringPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'steering_assembly') return null;
  switch (componentId) {
    case 'steering_wheel': return <SteerWheel state={state} />;
    case 'steering_column': return <SteerColumn state={state} />;
    case 'steering_pinion': return <SteerPinion state={state} />;
    case 'steering_rack': return <SteerRackBar state={state} />;
    case 'steering_housing': return <SteerRackHousing state={state} />;
    case 'steering_tie_rods': return <SteerTieRods state={state} />;
    case 'steering_power_assist': return <SteerPowerAssist state={state} />;
    default: return null;
  }
}
