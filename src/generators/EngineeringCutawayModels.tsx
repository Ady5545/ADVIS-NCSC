import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

function Metal({
  state,
  color = '#94a3b8',
  metalness = 0.85,
  roughness = 0.28,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  state: AdvancedEngineeringModelProps;
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const { isHovered, isSelected, xrayEnabled, blueprintEnabled } = state;
  if (blueprintEnabled) {
    return <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.38} />;
  }
  const accent = isSelected ? '#22d3ee' : isHovered ? '#67e8f9' : emissive;
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={xrayEnabled ? 0.18 : roughness}
      transparent={xrayEnabled}
      opacity={xrayEnabled ? 0.26 : 1}
      transmission={xrayEnabled ? 0.55 : 0}
      depthWrite={!xrayEnabled}
      clearcoat={0.18}
      clearcoatRoughness={0.12}
      envMapIntensity={1.65}
      emissive={accent}
      emissiveIntensity={isSelected ? 0.18 : isHovered ? 0.08 : emissiveIntensity}
    />
  );
}

function CutawayFrame({ state, scale = 1, open = 'front' }: { state: AdvancedEngineeringModelProps; scale?: number; open?: 'front' | 'side' | 'top' }) {
  const t = 0.075 * scale;
  const w = 1.25 * scale;
  const h = 1.05 * scale;
  const d = 1.65 * scale;
  return (
    <group>
      <RoundedBox args={[w, h, t]} position={[0, 0, -d / 2]} radius={0.05 * scale} smoothness={4}>
        <Metal state={state} color="#374151" metalness={0.9} roughness={0.32} />
      </RoundedBox>
      {open !== 'side' && (
        <>
          <RoundedBox args={[t, h, d]} position={[-w / 2, 0, 0]} radius={0.04 * scale} smoothness={4}>
            <Metal state={state} color="#475569" metalness={0.88} roughness={0.34} />
          </RoundedBox>
          <RoundedBox args={[t, h, d]} position={[w / 2, 0, 0]} radius={0.04 * scale} smoothness={4}>
            <Metal state={state} color="#475569" metalness={0.88} roughness={0.34} />
          </RoundedBox>
        </>
      )}
      {open !== 'top' && (
        <RoundedBox args={[w, t, d]} position={[0, -h / 2, 0]} radius={0.04 * scale} smoothness={4}>
          <Metal state={state} color="#334155" metalness={0.9} roughness={0.34} />
        </RoundedBox>
      )}
    </group>
  );
}

function BoltCircle({ count, radius, state, y = 0, size = 0.022 }: { count: number; radius: number; state: AdvancedEngineeringModelProps; y?: number; size?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[size, size, size * 1.8, 10]} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <Metal state={state} color="#d1d5db" metalness={0.97} roughness={0.14} />
          </Cylinder>
        );
      })}
    </>
  );
}

function GearDisk({
  state,
  teeth = 32,
  radius = 0.3,
  thickness = 0.11,
  toothDepth = 0.055,
  color = '#a8b0ba',
  innerRadius = 0.09,
  y = 0,
}: {
  state: AdvancedEngineeringModelProps;
  teeth?: number;
  radius?: number;
  thickness?: number;
  toothDepth?: number;
  color?: string;
  innerRadius?: number;
  y?: number;
}) {
  return (
    <group position={[0, y, 0]}>
      <Cylinder args={[radius, radius, thickness, 48]} rotation={[0, 0, 0]}>
        <Metal state={state} color={color} metalness={0.94} roughness={0.2} />
      </Cylinder>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        const toothR = radius + toothDepth * 0.5;
        return (
          <Box
            key={i}
            args={[toothDepth, thickness * 0.72, (Math.PI * 2 * toothR / teeth) * 0.66]}
            position={[Math.cos(a) * toothR, 0, Math.sin(a) * toothR]}
            rotation={[0, -a, 0]}
          >
            <Metal state={state} color={color} metalness={0.95} roughness={0.18} />
          </Box>
        );
      })}
      <Torus args={[innerRadius, Math.max(0.016, innerRadius * 0.16), 12, 48]} rotation={[0, 0, 0]}>
        <Metal state={state} color="#3f4752" metalness={0.9} roughness={0.22} />
      </Torus>
    </group>
  );
}

function CurvedBlade({
  state,
  root = 0.18,
  span = 0.26,
  chord = 0.10,
  thickness = 0.018,
  pitch = 0.34,
  color = '#cbd5e1',
}: {
  state: AdvancedEngineeringModelProps;
  root?: number;
  span?: number;
  chord?: number;
  thickness?: number;
  pitch?: number;
  color?: string;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(root, -chord * 0.24);
    s.quadraticCurveTo(root + span * 0.34, chord * 0.68, root + span, chord * 0.28);
    s.quadraticCurveTo(root + span * 0.70, -chord * 0.55, root, -chord * 0.24);
    return s;
  }, [root, span, chord]);
  const settings = useMemo<THREE.ExtrudeGeometryOptions>(() => ({
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: thickness * 0.55,
    bevelThickness: thickness * 0.45,
  }), [thickness]);
  return (
    <mesh rotation={[0, 0, pitch]}>
      <extrudeGeometry args={[shape, settings]} />
      <Metal state={state} color={color} metalness={0.92} roughness={0.2} />
    </mesh>
  );
}

function BladeWheel({
  state,
  blades = 24,
  radius = 0.24,
  span = 0.26,
  chord = 0.11,
  pitch = 0.3,
  direction = 1,
  y = 0,
  color = '#cbd5e1',
}: {
  state: AdvancedEngineeringModelProps;
  blades?: number;
  radius?: number;
  span?: number;
  chord?: number;
  pitch?: number;
  direction?: 1 | -1;
  y?: number;
  color?: string;
}) {
  return (
    <group position={[0, y, 0]}>
      <Cylinder args={[radius, radius, 0.08, 48]}>
        <Metal state={state} color="#606b78" metalness={0.95} roughness={0.2} />
      </Cylinder>
      {Array.from({ length: blades }).map((_, i) => (
        <group key={i} rotation={[0, (i / blades) * Math.PI * 2, 0]}>
          <CurvedBlade
            state={state}
            root={radius * 0.86}
            span={span}
            chord={chord}
            pitch={direction * pitch}
            color={color}
          />
        </group>
      ))}
      <BoltCircle count={blades > 20 ? 10 : 8} radius={radius * 0.66} state={state} size={0.012} />
    </group>
  );
}

function Bearing({ state, radius = 0.11, y = 0 }: { state: AdvancedEngineeringModelProps; radius?: number; y?: number }) {
  return (
    <group position={[0, y, 0]}>
      <Torus args={[radius * 0.7, radius * 0.18, 16, 48]}>
        <Metal state={state} color="#cbd5e1" metalness={0.96} roughness={0.14} />
      </Torus>
      <Torus args={[radius * 0.38, radius * 0.10, 12, 40]}>
        <Metal state={state} color="#313944" metalness={0.82} roughness={0.24} />
      </Torus>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[0.009, 0.009, radius * 0.48, 8]} position={[Math.cos(a) * radius * 0.55, 0, Math.sin(a) * radius * 0.55]} rotation={[Math.PI / 2, 0, a]}>
            <Metal state={state} color="#e5e7eb" metalness={0.98} roughness={0.12} />
          </Cylinder>
        );
      })}
    </group>
  );
}

function PMSEDetailed(state: AdvancedEngineeringModelProps) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <CutawayFrame state={state} scale={0.95} open="front" />
      <group position={[0, 0, 0.10]}>
        <Cylinder args={[0.48, 0.48, 0.12, 64]}>
          <Metal state={state} color="#596572" metalness={0.92} roughness={0.3} />
        </Cylinder>
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, a, 0]}>
              <Box args={[0.055, 0.36, 0.22]} position={[0.405, 0, 0]}>
                <Metal state={state} color="#67727f" metalness={0.88} roughness={0.28} />
              </Box>
              <Torus args={[0.438, 0.014, 8, 24, Math.PI * 1.25]} rotation={[Math.PI / 2, 0, 0]}>
                <Metal state={state} color="#c8750a" metalness={0.88} roughness={0.23} />
              </Torus>
            </group>
          );
        })}
        <Cylinder args={[0.31, 0.31, 0.45, 64]}>
          <Metal state={state} color="#3c4652" metalness={0.95} roughness={0.18} />
        </Cylinder>
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <RoundedBox key={i} args={[0.12, 0.16, 0.23]} radius={0.018} smoothness={3} position={[Math.cos(a) * 0.325, 0, Math.sin(a) * 0.325]} rotation={[0, -a, 0]}>
              <Metal state={state} color={i % 2 ? '#1d4ed8' : '#b45309'} metalness={0.52} roughness={0.25} />
            </RoundedBox>
          );
        })}
        <Bearing state={state} radius={0.13} y={0.32} />
        <Bearing state={state} radius={0.13} y={-0.32} />
        <Cylinder args={[0.075, 0.075, 1.30, 32]}>
          <Metal state={state} color="#d9dee5" metalness={0.98} roughness={0.12} />
        </Cylinder>
        <BoltCircle count={12} radius={0.43} state={state} y={0.075} size={0.014} />
      </group>
    </group>
  );
}

function PlanetaryDetailed(state: AdvancedEngineeringModelProps) {
  const planetAngles = useMemo(() => [0, Math.PI * 2 / 3, Math.PI * 4 / 3], []);
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <Torus args={[0.70, 0.085, 22, 96]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#4b5563" metalness={0.96} roughness={0.2} />
      </Torus>
      {Array.from({ length: 42 }).map((_, i) => {
        const a = (i / 42) * Math.PI * 2;
        return <Box key={i} args={[0.065, 0.12, 0.055]} position={[Math.cos(a) * 0.755, 0, Math.sin(a) * 0.755]} rotation={[0, -a, 0]}><Metal state={state} color="#adb5bf" metalness={0.96} roughness={0.18} /></Box>;
      })}
      <GearDisk state={state} teeth={18} radius={0.20} thickness={0.22} toothDepth={0.045} color="#d7dde4" innerRadius={0.095} />
      {planetAngles.map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.40, 0, Math.sin(a) * 0.40]}>
          <GearDisk state={state} teeth={26} radius={0.22} thickness={0.20} toothDepth={0.042} color="#e0a63a" innerRadius={0.075} />
          <Cylinder args={[0.032, 0.032, 0.34, 20]}>
            <Metal state={state} color="#f0f4f7" metalness={0.98} roughness={0.13} />
          </Cylinder>
          <Bearing state={state} radius={0.078} />
        </group>
      ))}
      <Torus args={[0.44, 0.032, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#b18a3a" metalness={0.84} roughness={0.24} />
      </Torus>
      <Box args={[0.12, 0.09, 0.95]} position={[0, 0.17, 0]}>
        <Metal state={state} color="#64748b" metalness={0.9} roughness={0.23} />
      </Box>
      <Box args={[0.12, 0.09, 0.95]} position={[0, -0.17, 0]}>
        <Metal state={state} color="#64748b" metalness={0.9} roughness={0.23} />
      </Box>
      <BoltCircle count={12} radius={0.61} state={state} y={0.23} size={0.017} />
    </group>
  );
}

function JetEngineDetailed(state: AdvancedEngineeringModelProps) {
  const compressorStages = [0.82, 0.48, 0.16];
  const turbineStages = [-0.52, -0.78, -1.04];
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <group>
        <Torus args={[0.58, 0.08, 20, 72]}>
          <Metal state={state} color="#7d8792" metalness={0.93} roughness={0.24} />
        </Torus>
        <Torus args={[0.50, 0.055, 20, 72]}>
          <Metal state={state} color="#3f4954" metalness={0.92} roughness={0.26} />
        </Torus>
        <BoltCircle count={16} radius={0.57} state={state} size={0.015} />
      </group>
      {compressorStages.map((y, stage) => (
        <group key={`c-${stage}`} position={[0, y, 0]}>
          <Torus args={[0.47, 0.035, 14, 64]}>
            <Metal state={state} color="#d3d8de" metalness={0.96} roughness={0.18} />
          </Torus>
          <BladeWheel state={state} blades={30} radius={0.16 + stage * 0.006} span={0.29} chord={0.12} pitch={0.26 + stage * 0.025} color="#c7ced6" />
          <Torus args={[0.21, 0.012, 12, 48]} rotation={[Math.PI / 2, 0, 0]}>
            <Metal state={state} color="#9ea7b1" metalness={0.95} roughness={0.16} />
          </Torus>
        </group>
      ))}
      <group position={[0, -0.12, 0]}>
        <Torus args={[0.46, 0.12, 20, 80]}>
          <Metal state={state} color="#8c3f23" metalness={0.76} roughness={0.38} />
        </Torus>
        {Array.from({ length: 12 }).map((_, i) => (
          <Cylinder key={i} args={[0.07, 0.07, 0.40, 20]} position={[Math.cos((i / 12) * Math.PI * 2) * 0.30, 0, Math.sin((i / 12) * Math.PI * 2) * 0.30]}>
            <Metal state={state} color="#a84d25" metalness={0.75} roughness={0.38} />
          </Cylinder>
        ))}
      </group>
      {turbineStages.map((y, stage) => (
        <group key={`t-${stage}`} position={[0, y, 0]}>
          <Torus args={[0.43, 0.03, 14, 64]}>
            <Metal state={state} color="#a8a29e" metalness={0.96} roughness={0.23} />
          </Torus>
          <BladeWheel state={state} blades={24} radius={0.14} span={0.31} chord={0.15} pitch={-0.46 - stage * 0.06} color="#89827b" direction={-1} />
        </group>
      ))}
      <Cylinder args={[0.085, 0.085, 2.65, 32]}>
        <Metal state={state} color="#e5e7eb" metalness={0.99} roughness={0.10} />
      </Cylinder>
      <Bearing state={state} radius={0.14} y={1.10} />
      <Bearing state={state} radius={0.14} y={-1.12} />
    </group>
  );
}

function HydraulicPumpDetailed(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <RoundedBox args={[1.16, 0.82, 0.92]} radius={0.10} smoothness={6}>
        <Metal state={state} color="#4a5663" metalness={0.90} roughness={0.30} />
      </RoundedBox>
      <RoundedBox args={[0.76, 0.58, 0.10]} position={[0, 0, 0.48]} radius={0.06} smoothness={4}>
        <Metal state={state} color="#2e3946" metalness={0.84} roughness={0.32} />
      </RoundedBox>
      <Cylinder args={[0.20, 0.20, 0.18, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.56]}>
        <Metal state={state} color="#343f4c" metalness={0.92} roughness={0.24} />
      </Cylinder>
      <group position={[0, 0, 0.46]}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.20, Math.sin(a) * 0.20, 0]} rotation={[0, 0, a]}>
              <Cylinder args={[0.045, 0.045, 0.25, 18]}>
                <Metal state={state} color="#cbd5e1" metalness={0.96} roughness={0.16} />
              </Cylinder>
              <Torus args={[0.055, 0.009, 8, 24]} rotation={[Math.PI / 2, 0, 0]}>
                <Metal state={state} color="#9b6b32" metalness={0.82} roughness={0.25} />
              </Torus>
            </group>
          );
        })}
      </group>
      <Torus args={[0.24, 0.045, 16, 56]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.20]}>
        <Metal state={state} color="#ad7a2e" metalness={0.88} roughness={0.24} />
      </Torus>
      <Cylinder args={[0.09, 0.09, 0.72, 28]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.63]}>
        <Metal state={state} color="#d9dee5" metalness={0.98} roughness={0.12} />
      </Cylinder>
      <Bearing state={state} radius={0.13} y={0.35} />
      <BoltCircle count={10} radius={0.43} state={state} y={0.43} size={0.018} />
      <Box args={[0.30, 0.15, 0.18]} position={[-0.43, -0.34, 0]}>
        <Metal state={state} color="#1f2937" metalness={0.22} roughness={0.55} />
      </Box>
      <Box args={[0.30, 0.15, 0.18]} position={[0.43, 0.34, 0]}>
        <Metal state={state} color="#1f2937" metalness={0.22} roughness={0.55} />
      </Box>
    </group>
  );
}

function TurbochargerDetailed(state: AdvancedEngineeringModelProps, turbine = false) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.38, 0.15, 28, 80]}>
        <Metal state={state} color={turbine ? '#4a4039' : '#707a86'} metalness={0.89} roughness={turbine ? 0.42 : 0.24} />
      </Torus>
      <group position={[0, 0, 0.05]}>
        <BladeWheel state={state} blades={turbine ? 18 : 22} radius={0.10} span={0.22} chord={0.12} pitch={turbine ? -0.46 : 0.34} direction={turbine ? -1 : 1} color={turbine ? '#78706a' : '#d7dde4'} />
        <Cylinder args={[0.055, 0.055, 0.55, 28]}>
          <Metal state={state} color="#d7dde4" metalness={0.98} roughness={0.11} />
        </Cylinder>
        <Bearing state={state} radius={0.085} y={0.10} />
        <Bearing state={state} radius={0.085} y={-0.10} />
      </group>
      <Torus args={[0.24, 0.026, 14, 56]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#3b424c" metalness={0.88} roughness={0.25} />
      </Torus>
    </group>
  );
}

function DifferentialDetailed(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <Torus args={[0.72, 0.11, 26, 96]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#4b5563" metalness={0.94} roughness={0.23} />
      </Torus>
      <GearDisk state={state} teeth={42} radius={0.72} thickness={0.12} toothDepth={0.07} color="#adb5bf" innerRadius={0.55} />
      <Cylinder args={[0.42, 0.42, 0.30, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#343e4a" metalness={0.88} roughness={0.30} />
      </Cylinder>
      <Cylinder args={[0.11, 0.11, 1.90, 28]} rotation={[0, 0, Math.PI / 2]}>
        <Metal state={state} color="#e1e6eb" metalness={0.99} roughness={0.11} />
      </Cylinder>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.25, 0, 0]}>
          <GearDisk state={state} teeth={18} radius={0.17} thickness={0.16} toothDepth={0.035} color="#c8d0d8" innerRadius={0.062} />
          <Bearing state={state} radius={0.075} />
        </group>
      ))}
      <GearDisk state={state} teeth={14} radius={0.17} thickness={0.15} toothDepth={0.032} color="#c28c3e" innerRadius={0.06} y={0.18} />
      <GearDisk state={state} teeth={14} radius={0.17} thickness={0.15} toothDepth={0.032} color="#c28c3e" innerRadius={0.06} y={-0.18} />
      <BoltCircle count={12} radius={0.60} state={state} y={0.22} size={0.018} />
    </group>
  );
}

function GearboxDetailed(state: AdvancedEngineeringModelProps) {
  const stages = [
    { z: 0.60, r: 0.29, teeth: 28 },
    { z: 0.20, r: 0.24, teeth: 24 },
    { z: -0.20, r: 0.33, teeth: 34 },
    { z: -0.58, r: 0.22, teeth: 20 },
  ];
  return (
    <group>
      <RoundedBox args={[1.24, 1.02, 1.86]} radius={0.16} smoothness={7}>
        <Metal state={state} color="#46515e" metalness={0.90} roughness={0.30} />
      </RoundedBox>
      <Box args={[0.98, 0.72, 0.06]} position={[0, 0.02, 0.94]}>
        <Metal state={state} color="#1f2937" metalness={0.5} roughness={0.38} />
      </Box>
      <Cylinder args={[0.065, 0.065, 1.72, 28]} rotation={[0, 0, Math.PI / 2]}>
        <Metal state={state} color="#dce1e6" metalness={0.99} roughness={0.10} />
      </Cylinder>
      {stages.map((s, i) => (
        <group key={i} position={[0, 0, s.z]}>
          <GearDisk state={state} teeth={s.teeth} radius={s.r} thickness={0.16} toothDepth={0.045} color={i % 2 ? '#c5ccd4' : '#8f9aa7'} innerRadius={0.07} />
          <Bearing state={state} radius={0.11} y={0.13} />
          <Bearing state={state} radius={0.11} y={-0.13} />
        </group>
      ))}
      <group position={[0.22, 0, 0]}>
        <Cylinder args={[0.055, 0.055, 1.65, 24]} rotation={[0, 0, Math.PI / 2]}>
          <Metal state={state} color="#c5ccd3" metalness={0.98} roughness={0.12} />
        </Cylinder>
        <GearDisk state={state} teeth={20} radius={0.21} thickness={0.12} toothDepth={0.038} color="#d3d9df" innerRadius={0.06} />
      </group>
      <Box args={[0.10, 0.28, 0.06]} position={[0.36, 0.30, 0]}>
        <Metal state={state} color="#a2aab4" metalness={0.88} roughness={0.24} />
      </Box>
      <Box args={[0.10, 0.28, 0.06]} position={[-0.36, -0.30, 0]}>
        <Metal state={state} color="#a2aab4" metalness={0.88} roughness={0.24} />
      </Box>
      <BoltCircle count={16} radius={0.50} state={state} y={0.48} size={0.017} />
    </group>
  );
}

function BrakeDetailed(state: AdvancedEngineeringModelProps, caliper = false) {
  if (caliper) {
    return (
      <group>
        <RoundedBox args={[0.38, 0.64, 0.26]} radius={0.075} smoothness={6}>
          <Metal state={state} color="#9f1d26" metalness={0.34} roughness={0.34} />
        </RoundedBox>
        {[-0.12, 0.12].map((x) => (
          <group key={x} position={[x, 0.16, 0]}>
            <Cylinder args={[0.052, 0.052, 0.035, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <Metal state={state} color="#e5e7eb" metalness={0.98} roughness={0.12} />
            </Cylinder>
            <Torus args={[0.055, 0.009, 10, 28]} rotation={[Math.PI / 2, 0, 0]}>
              <Metal state={state} color="#6b7280" metalness={0.86} roughness={0.24} />
            </Torus>
          </group>
        ))}
        <Box args={[0.50, 0.07, 0.28]} position={[0, -0.34, 0]}>
          <Metal state={state} color="#20262e" metalness={0.14} roughness={0.66} />
        </Box>
        <BoltCircle count={6} radius={0.21} state={state} y={0.33} size={0.014} />
      </group>
    );
  }
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.70, 0.70, 0.12, 72]}>
        <Metal state={state} color="#2f343b" metalness={0.82} roughness={0.27} />
      </Cylinder>
      <Cylinder args={[0.54, 0.54, 0.075, 64]}>
        <Metal state={state} color="#515862" metalness={0.78} roughness={0.29} />
      </Cylinder>
      {Array.from({ length: 30 }).map((_, i) => {
        const a = (i / 30) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box args={[0.032, 0.08, 0.34]} position={[0.44, 0, 0]}>
              <Metal state={state} color="#737b84" metalness={0.87} roughness={0.26} />
            </Box>
          </group>
        );
      })}
      {Array.from({ length: 20 }).map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[0.019, 0.019, 0.05, 12]} position={[Math.cos(a) * 0.52, 0, Math.sin(a) * 0.52]}>
            <Metal state={state} color="#111827" metalness={0.14} roughness={0.68} />
          </Cylinder>
        );
      })}
      <Torus args={[0.29, 0.04, 14, 60]} rotation={[Math.PI / 2, 0, 0]}>
        <Metal state={state} color="#8f969e" metalness={0.9} roughness={0.2} />
      </Torus>
      <BoltCircle count={5} radius={0.16} state={state} y={0.08} size={0.014} />
    </group>
  );
}

function StrutDetailed(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <Cylinder args={[0.17, 0.17, 1.78, 44]} position={[0, 0.08, 0]}>
        <Metal state={state} color="#46515d" metalness={0.9} roughness={0.28} />
      </Cylinder>
      <Cylinder args={[0.082, 0.082, 1.02, 32]} position={[0, 0.39, 0]}>
        <Metal state={state} color="#e1e6eb" metalness={0.98} roughness={0.10} />
      </Cylinder>
      {Array.from({ length: 30 }).map((_, i) => (
        <Torus key={i} args={[0.30 - i * 0.0012, 0.025, 14, 52]} position={[0, 0.78 - i * 0.055, 0]}>
          <Metal state={state} color="#b83a43" metalness={0.40} roughness={0.38} />
        </Torus>
      ))}
      <Torus args={[0.11, 0.04, 16, 48]} position={[0, 1.24, 0]}>
        <Metal state={state} color="#c8ced6" metalness={0.96} roughness={0.15} />
      </Torus>
      <Cylinder args={[0.07, 0.07, 0.30, 28]} position={[0, 1.34, 0]}>
        <Metal state={state} color="#dfe4e9" metalness={0.98} roughness={0.11} />
      </Cylinder>
      <Box args={[0.84, 0.09, 0.18]} position={[0, -0.90, 0]}>
        <Metal state={state} color="#3e4853" metalness={0.90} roughness={0.31} />
      </Box>
      <BoltCircle count={6} radius={0.33} state={state} y={-0.84} size={0.015} />
    </group>
  );
}

function SteeringRackDetailed(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <RoundedBox args={[2.22, 0.22, 0.28]} radius={0.07} smoothness={5}>
        <Metal state={state} color="#525e6b" metalness={0.91} roughness={0.28} />
      </RoundedBox>
      <Box args={[1.62, 0.12, 0.19]} position={[0, 0.10, 0]}>
        <Metal state={state} color="#20262f" metalness={0.48} roughness={0.34} />
      </Box>
      {Array.from({ length: 36 }).map((_, i) => (
        <Box key={i} args={[0.035, 0.055, 0.20]} position={[-0.80 + i * 0.046, 0.17, 0]}>
          <Metal state={state} color="#d3dae1" metalness={0.96} roughness={0.17} />
        </Box>
      ))}
      <Cylinder args={[0.13, 0.13, 0.46, 28]} rotation={[0, 0, Math.PI / 2]} position={[0.32, 0.28, 0]}>
        <Metal state={state} color="#4b5563" metalness={0.91} roughness={0.24} />
      </Cylinder>
      <Cylinder args={[0.045, 0.045, 0.50, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0.32, 0.56, 0]}>
        <Metal state={state} color="#e5e7eb" metalness={0.98} roughness={0.11} />
      </Cylinder>
      {[-0.96, 0.96].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Torus args={[0.10, 0.028, 12, 36]} rotation={[0, Math.PI / 2, 0]}>
            <Metal state={state} color="#20262b" metalness={0.05} roughness={0.82} />
          </Torus>
          <Cylinder args={[0.022, 0.022, 0.28, 16]} rotation={[0, 0, Math.PI / 2]}>
            <Metal state={state} color="#d2d8de" metalness={0.98} roughness={0.12} />
          </Cylinder>
        </group>
      ))}
      <BoltCircle count={10} radius={0.11} state={state} y={0.18} size={0.014} />
    </group>
  );
}

export function renderCutawayEngineeringModel(id: string, state: AdvancedEngineeringModelProps): React.ReactNode | null {
  switch (id) {
    case 'pmsm.stator_rotor': return <PMSEDetailed {...state} />;
    case 'planetary.gearset': return <PlanetaryDetailed {...state} />;
    case 'jetengine.core': return <JetEngineDetailed {...state} />;
    case 'hydraulic_pump.core': return <HydraulicPumpDetailed {...state} />;
    case 'turbo_comp': return TurbochargerDetailed(state, false);
    case 'turbo_turb': return TurbochargerDetailed(state, true);
    case 'diff_ring': return <DifferentialDetailed {...state} />;
    case 'gear_shaft': return <GearboxDetailed {...state} />;
    case 'brake_rotor': return BrakeDetailed(state, false);
    case 'brake_caliper': return BrakeDetailed(state, true);
    case 'susp_spring': return <StrutDetailed {...state} />;
    case 'steering_rack': return <SteeringRackDetailed {...state} />;
    default: return null;
  }
}
