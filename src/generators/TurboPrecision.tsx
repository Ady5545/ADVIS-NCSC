import React from 'react';
import { Box, Cylinder, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

// The original turbocharger model was just two snail-shell volute housings -- the actual
// spinning hardware (compressor wheel, turbine wheel, the shaft connecting them at up to
// 180,000 RPM) was entirely missing. That's the whole point of a turbo, so it's the first
// thing added here.

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
      clearcoat={0.2}
      clearcoatRoughness={0.15}
      envMapIntensity={1.4}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0}
    />
  );
}

/** A curved compressor/turbine wheel: a hub with swept vanes, the recognizable "pinwheel" shape. */
function Wheel({ state, count, color, bladeLen = 0.16, bladeCurve = 0.6 }: {
  state: State; count: number; color: string; bladeLen?: number; bladeCurve?: number;
}) {
  return (
    <group>
      <Cylinder args={[0.03, 0.09, 0.12, 20]}>
        <Pbr state={state} color={color} metalness={0.9} roughness={0.2} />
      </Cylinder>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box args={[0.012, 0.09, bladeLen]} position={[0, 0, 0.07 + bladeLen / 2]} rotation={[0, bladeCurve, 0]}>
              <Pbr state={state} color={color} metalness={0.88} roughness={0.22} />
            </Box>
          </group>
        );
      })}
    </group>
  );
}

export function TurboCompressorHousing({ state }: { state: State }) {
  return (
    <group>
      <Sphere args={[0.3, 32, 24]} scale={[1, 0.85, 1]}>
        <Pbr state={state} color="#e2e8f0" metalness={0.55} roughness={0.35} />
      </Sphere>
      {/* volute scroll suggestion: an off-center bulge */}
      <Sphere args={[0.14, 20, 16]} position={[0.22, 0, 0]} scale={[1, 0.7, 1]}>
        <Pbr state={state} color="#cbd5e1" metalness={0.55} roughness={0.35} />
      </Sphere>
      <Cylinder args={[0.13, 0.13, 0.16, 24]} position={[0, 0, -0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.5} roughness={0.4} />
      </Cylinder>
    </group>
  );
}

export function TurboCompressorWheel({ state }: { state: State }) {
  return <Wheel state={state} count={11} color="#c7cdd6" bladeLen={0.14} bladeCurve={0.7} />;
}

export function TurboTurbineHousing({ state }: { state: State }) {
  return (
    <group>
      <Sphere args={[0.3, 32, 24]} scale={[1, 0.85, 1]}>
        <Pbr state={state} color="#78350f" metalness={0.5} roughness={0.5} />
      </Sphere>
      <Sphere args={[0.14, 20, 16]} position={[-0.22, 0, 0]} scale={[1, 0.7, 1]}>
        <Pbr state={state} color="#92400e" metalness={0.5} roughness={0.5} />
      </Sphere>
      <Cylinder args={[0.12, 0.12, 0.16, 24]} position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#5c3a1e" metalness={0.45} roughness={0.55} />
      </Cylinder>
    </group>
  );
}

export function TurboTurbineWheel({ state }: { state: State }) {
  return <Wheel state={state} count={11} color="#8a8f99" bladeLen={0.14} bladeCurve={-0.7} />;
}

export function TurboCenterHousing({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.13, 0.13, 0.34, 28]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#4a4f58" metalness={0.72} roughness={0.35} />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 0.1, 20]} position={[0, -0.14, 0]}>
        <Pbr state={state} color="#3c4047" metalness={0.65} roughness={0.4} />
      </Cylinder>
    </group>
  );
}

export function TurboShaft({ state }: { state: State }) {
  return (
    <Cylinder args={[0.018, 0.018, 0.55, 16]} rotation={[Math.PI / 2, 0, 0]}>
      <Pbr state={state} color="#d4d8de" metalness={0.95} roughness={0.12} />
    </Cylinder>
  );
}

export function TurboWastegate({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.035, 0.035, 0.14, 16]}>
        <Pbr state={state} color="#9aa0a8" metalness={0.7} roughness={0.35} />
      </Cylinder>
      <Box args={[0.06, 0.1, 0.03]} position={[0, -0.1, 0]}>
        <Pbr state={state} color="#3c4047" metalness={0.5} roughness={0.5} />
      </Box>
      <Torus args={[0.025, 0.006, 6, 16]} position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#2a2e34" metalness={0.4} roughness={0.5} />
      </Torus>
    </group>
  );
}

export function renderTurboPrecisionComponent(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId !== 'turbocharger') return null;
  switch (componentId) {
    case 'turbo_comp': return <TurboCompressorHousing state={state} />;
    case 'turbo_comp_wheel': return <TurboCompressorWheel state={state} />;
    case 'turbo_turb': return <TurboTurbineHousing state={state} />;
    case 'turbo_turb_wheel': return <TurboTurbineWheel state={state} />;
    case 'turbo_center': return <TurboCenterHousing state={state} />;
    case 'turbo_shaft': return <TurboShaft state={state} />;
    case 'turbo_wastegate': return <TurboWastegate state={state} />;
    default: return null;
  }
}
