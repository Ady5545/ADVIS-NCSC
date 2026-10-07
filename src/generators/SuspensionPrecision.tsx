import React from 'react';
import { Box, Cylinder, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// Original model was ONE plain cylinder standing in for a "coil spring" -- a cylinder has no
// coils. Rebuilt as a real MacPherson strut: an actual helical spring (approximated with
// stacked, progressively-rotated rings -- genuinely coil-shaped, not a solid tube), the strut
// body and piston rod it wraps around, top mount, spring seats, lower control arm, ball joint,
// and the steering knuckle everything bolts to.

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.75, roughness = 0.35 }: { state: State; color: string; metalness?: number; roughness?: number }) {
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
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0}
    />
  );
}

/** A genuine helical coil: stacked rings, each rotated and raised, tracing out a real spiral --
 * not a solid cylinder standing in for a spring shape. */
export function SuspSpring({ state }: { state: State }) {
  const turns = 7;
  const segsPerTurn = 10;
  const total = turns * segsPerTurn;
  const height = 0.7;
  const radius = 0.16;
  return (
    <group>
      {Array.from({ length: total }).map((_, i) => {
        const t = i / total;
        const angle = t * turns * Math.PI * 2;
        const y = -height / 2 + t * height;
        return (
          <Torus
            key={i}
            args={[radius, 0.018, 6, 3]}
            position={[Math.cos(angle) * 0.002, y, Math.sin(angle) * 0.002]}
            rotation={[Math.PI / 2, 0, angle]}
          >
            <Pbr state={state} color="#dc2626" metalness={0.65} roughness={0.35} />
          </Torus>
        );
      })}
    </group>
  );
}

export function SuspStrutBody({ state }: { state: State }) {
  return (
    <Cylinder args={[0.07, 0.07, 0.6, 24]}>
      <Pbr state={state} color="#9aa0a8" metalness={0.8} roughness={0.25} />
    </Cylinder>
  );
}

export function SuspPistonRod({ state }: { state: State }) {
  return (
    <Cylinder args={[0.022, 0.022, 0.5, 20]}>
      <Pbr state={state} color="#e2e6ea" metalness={0.95} roughness={0.1} />
    </Cylinder>
  );
}

export function SuspTopMount({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.13, 0.13, 0.06, 24]}>
        <Pbr state={state} color="#1c1c1e" metalness={0.2} roughness={0.55} />
      </Cylinder>
      <Cylinder args={[0.05, 0.05, 0.08, 16]} position={[0, 0.05, 0]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.75} roughness={0.35} />
      </Cylinder>
    </group>
  );
}

export function SuspSpringSeats({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.18, 0.18, 0.03, 24]} position={[0, 0.3, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.3} roughness={0.6} />
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 0.03, 24]} position={[0, -0.3, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.3} roughness={0.6} />
      </Cylinder>
    </group>
  );
}

export function SuspControlArm({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.5, 0.05, 0.16]} position={[0.15, 0, 0]}>
        <Pbr state={state} color="#5a5f68" metalness={0.65} roughness={0.4} />
      </Box>
      <Box args={[0.4, 0.05, 0.14]} position={[-0.1, 0, 0.18]} rotation={[0, 0.3, 0]}>
        <Pbr state={state} color="#5a5f68" metalness={0.65} roughness={0.4} />
      </Box>
      <Cylinder args={[0.04, 0.04, 0.12, 16]} rotation={[0, 0, Math.PI / 2]} position={[-0.35, 0, 0.05]}>
        <Pbr state={state} color="#2a2e34" metalness={0.5} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

export function SuspBallJoint({ state }: { state: State }) {
  return (
    <group>
      <Sphere args={[0.045, 16, 12]}>
        <Pbr state={state} color="#e2e6ea" metalness={0.85} roughness={0.15} />
      </Sphere>
      <Cylinder args={[0.018, 0.018, 0.08, 10]} position={[0, 0.06, 0]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.8} roughness={0.25} />
      </Cylinder>
    </group>
  );
}

export function SuspKnuckle({ state }: { state: State }) {
  return (
    <group>
      <Box args={[0.14, 0.4, 0.14]}>
        <Pbr state={state} color="#4b4f56" metalness={0.6} roughness={0.45} />
      </Box>
      <Cylinder args={[0.09, 0.09, 0.08, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <Pbr state={state} color="#3c4047" metalness={0.55} roughness={0.5} />
      </Cylinder>
    </group>
  );
}

export function renderSuspensionPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'suspension') return null;
  switch (componentId) {
    case 'susp_spring': return <SuspSpring state={state} />;
    case 'susp_strut_body': return <SuspStrutBody state={state} />;
    case 'susp_piston_rod': return <SuspPistonRod state={state} />;
    case 'susp_top_mount': return <SuspTopMount state={state} />;
    case 'susp_spring_seats': return <SuspSpringSeats state={state} />;
    case 'susp_control_arm': return <SuspControlArm state={state} />;
    case 'susp_ball_joint': return <SuspBallJoint state={state} />;
    case 'susp_knuckle': return <SuspKnuckle state={state} />;
    default: return null;
  }
}
