import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Sphere, Torus } from '@react-three/drei';
export interface AdvancedEngineeringModelProps {
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
}

function DetailMaterial({
  baseColor = '#94a3b8',
  isHovered = false,
  isSelected = false,
  xrayEnabled = false,
  blueprintEnabled = false,
  metalness = 0.75,
  roughness = 0.32,
  clearcoat = 0.12,
}: AdvancedEngineeringModelProps & {
  baseColor?: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
}) {
  if (blueprintEnabled) {
    return (
      <meshBasicMaterial
        color="#22d3ee"
        wireframe
        transparent
        opacity={0.5}
      />
    );
  }

  return (
    <meshPhysicalMaterial
      color={baseColor}
      metalness={metalness}
      roughness={xrayEnabled ? 0.18 : roughness}
      clearcoat={clearcoat}
      clearcoatRoughness={0.12}
      transparent={xrayEnabled}
      opacity={xrayEnabled ? 0.24 : 1}
      transmission={xrayEnabled ? 0.5 : 0}
      depthWrite={!xrayEnabled}
      emissive={isSelected ? '#0ea5e9' : isHovered ? '#22d3ee' : '#000000'}
      emissiveIntensity={isSelected ? 0.16 : isHovered ? 0.06 : 0}
      envMapIntensity={1.5}
    />
  );
}

function RadialBoltCircle({
  count,
  radius,
  y,
  size = 0.035,
  color = '#cbd5e1',
  state,
}: {
  count: number;
  radius: number;
  y: number;
  size?: number;
  color?: string;
  state: AdvancedEngineeringModelProps;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Cylinder
            key={`bolt-${i}`}
            args={[size, size, size * 1.8, 12]}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
          >
            <DetailMaterial {...state} baseColor={color} metalness={0.92} roughness={0.2} />
          </Cylinder>
        );
      })}
    </>
  );
}

function GearTeeth({
  count,
  radius,
  toothLength,
  toothWidth,
  y,
  state,
  color = '#9ca3af',
}: {
  count: number;
  radius: number;
  toothLength: number;
  toothWidth: number;
  y: number;
  state: AdvancedEngineeringModelProps;
  color?: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <Box
            key={`tooth-${i}`}
            args={[toothWidth, toothLength, toothWidth]}
            position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
            rotation={[0, angle, 0]}
          >
            <DetailMaterial {...state} baseColor={color} metalness={0.92} roughness={0.22} />
          </Box>
        );
      })}
    </>
  );
}

function RotorMagnetRing({
  count,
  radius,
  y,
  state,
}: {
  count: number;
  radius: number;
  y: number;
  state: AdvancedEngineeringModelProps;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <RoundedBox
            key={`magnet-${i}`}
            args={[0.10, 0.11, 0.20]}
            radius={0.018}
            smoothness={3}
            position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
            rotation={[0, -angle, 0]}
          >
            <DetailMaterial {...state} baseColor={i % 2 ? '#b91c1c' : '#1d4ed8'} metalness={0.35} roughness={0.28} />
          </RoundedBox>
        );
      })}
    </>
  );
}

export function PMSMMotorAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.54, 0.54, 0.86, 64]}>
        <DetailMaterial {...state} baseColor="#374151" metalness={0.86} roughness={0.29} clearcoat={0.22} />
      </Cylinder>

      {Array.from({ length: 18 }).map((_, i) => (
        <Torus
          key={`cooling-rib-${i}`}
          args={[0.525, 0.018, 10, 48]}
          position={[0, -0.37 + i * 0.044, 0]}
        >
          <DetailMaterial {...state} baseColor="#6b7280" metalness={0.86} roughness={0.28} />
        </Torus>
      ))}

      <Cylinder args={[0.48, 0.48, 0.08, 48]} position={[0, 0.47, 0]}>
        <DetailMaterial {...state} baseColor="#1f2937" metalness={0.8} roughness={0.34} />
      </Cylinder>
      <Cylinder args={[0.48, 0.48, 0.08, 48]} position={[0, -0.47, 0]}>
        <DetailMaterial {...state} baseColor="#1f2937" metalness={0.8} roughness={0.34} />
      </Cylinder>

      <Torus args={[0.365, 0.055, 18, 72]}>
        <DetailMaterial {...state} baseColor="#b45309" metalness={0.88} roughness={0.25} />
      </Torus>

      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return (
          <group key={`stator-slot-${i}`} rotation={[0, angle, 0]}>
            <Box args={[0.038, 0.18, 0.34]} position={[0.41, 0, 0]}>
              <DetailMaterial {...state} baseColor="#d97706" metalness={0.8} roughness={0.3} />
            </Box>
          </group>
        );
      })}

      <Cylinder args={[0.31, 0.31, 0.58, 48]}>
        <DetailMaterial {...state} baseColor="#475569" metalness={0.88} roughness={0.24} />
      </Cylinder>
      <RotorMagnetRing count={12} radius={0.335} y={0} state={state} />

      <Cylinder args={[0.075, 0.075, 1.18, 32]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.98} roughness={0.12} clearcoat={0.4} />
      </Cylinder>

      <RadialBoltCircle count={8} radius={0.41} y={0.43} state={state} />
      <RadialBoltCircle count={8} radius={0.41} y={-0.43} state={state} />

      <Box args={[0.32, 0.11, 0.22]} position={[0, -0.58, 0]}>
        <DetailMaterial {...state} baseColor="#111827" metalness={0.25} roughness={0.62} />
      </Box>
      <Box args={[0.22, 0.025, 0.14]} position={[0, -0.64, 0]}>
        <DetailMaterial {...state} baseColor="#111827" metalness={0.15} roughness={0.45} />
      </Box>
    </group>
  );
}

export function PlanetaryGearsetAssembly(state: AdvancedEngineeringModelProps) {
  const planetAngles = useMemo(() => [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3], []);

  return (
    <group>
      <Torus args={[0.72, 0.075, 20, 96]} rotation={[Math.PI / 2, 0, 0]}>
        <DetailMaterial {...state} baseColor="#4b5563" metalness={0.95} roughness={0.22} clearcoat={0.26} />
      </Torus>
      <GearTeeth
        count={40}
        radius={0.755}
        toothLength={0.10}
        toothWidth={0.055}
        y={0}
        state={state}
      />

      <Cylinder args={[0.16, 0.16, 0.25, 32]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16} />
      </Cylinder>
      <GearTeeth count={18} radius={0.19} toothLength={0.08} toothWidth={0.05} y={0} state={state} color="#d1d5db" />

      {planetAngles.map((angle) => {
        const x = Math.cos(angle) * 0.41;
        const z = Math.sin(angle) * 0.41;
        return (
          <group key={`planet-${angle}`} position={[x, 0, z]}>
            <Cylinder args={[0.22, 0.22, 0.18, 32]}>
              <DetailMaterial {...state} baseColor="#6b7280" metalness={0.94} roughness={0.24} />
            </Cylinder>
            <GearTeeth count={20} radius={0.245} toothLength={0.07} toothWidth={0.05} y={0} state={state} />
          </group>
        );
      })}

      <Torus args={[0.44, 0.035, 12, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <DetailMaterial {...state} baseColor="#c4b454" metalness={0.82} roughness={0.28} />
      </Torus>

      <Box args={[0.98, 0.06, 0.10]} position={[0, 0.20, 0]}>
        <DetailMaterial {...state} baseColor="#64748b" metalness={0.9} roughness={0.26} />
      </Box>
      <Box args={[0.98, 0.06, 0.10]} position={[0, -0.20, 0]}>
        <DetailMaterial {...state} baseColor="#64748b" metalness={0.9} roughness={0.26} />
      </Box>

      {planetAngles.map((angle, i) => {
        const x = Math.cos(angle) * 0.41;
        const z = Math.sin(angle) * 0.41;
        return (
          <Cylinder
            key={`pin-${i}`}
            args={[0.035, 0.035, 0.52, 16]}
            position={[x, 0, z]}
          >
            <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16} />
          </Cylinder>
        );
      })}
    </group>
  );
}

export function JetEngineCoreAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.66, 0.60, 2.25, 64]}>
        <DetailMaterial {...state} baseColor="#475569" metalness={0.9} roughness={0.28} clearcoat={0.2} />
      </Cylinder>

      <Cylinder args={[0.50, 0.46, 0.28, 48]} position={[0, 1.18, 0]}>
        <DetailMaterial {...state} baseColor="#64748b" metalness={0.92} roughness={0.22} />
      </Cylinder>
      <Cylinder args={[0.43, 0.40, 0.14, 48]} position={[0, 1.34, 0]}>
        <DetailMaterial {...state} baseColor="#111827" metalness={0.22} roughness={0.55} />
      </Cylinder>

      {[0.82, 0.50, 0.18].map((y, stage) => (
        <group key={`compressor-stage-${stage}`} position={[0, y, 0]}>
          <Torus args={[0.49, 0.045, 14, 60]}>
            <DetailMaterial {...state} baseColor="#94a3b8" metalness={0.94} roughness={0.20} />
          </Torus>
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <Box
                key={`compressor-blade-${stage}-${i}`}
                args={[0.025, 0.10, 0.25]}
                position={[Math.cos(a) * 0.37, 0, Math.sin(a) * 0.37]}
                rotation={[0.10, -a, 0.32]}
              >
                <DetailMaterial {...state} baseColor="#cbd5e1" metalness={0.9} roughness={0.22} />
              </Box>
            );
          })}
        </group>
      ))}

      <Torus args={[0.48, 0.12, 20, 72]} position={[0, -0.20, 0]}>
        <DetailMaterial {...state} baseColor="#7c2d12" metalness={0.75} roughness={0.46} />
      </Torus>

      {[[-0.44, -0.66], [0.44, -0.66], [-0.44, -0.92], [0.44, -0.92]].map(([x, y], i) => (
        <Cylinder key={`combustor-can-${i}`} args={[0.08, 0.08, 0.35, 16]} position={[x, y, 0]}>
          <DetailMaterial {...state} baseColor="#9a3412" metalness={0.75} roughness={0.4} />
        </Cylinder>
      ))}

      {[-0.48, -0.72, -0.96].map((y, stage) => (
        <group key={`turbine-stage-${stage}`} position={[0, y, 0]}>
          <Torus args={[0.43, 0.04, 14, 60]}>
            <DetailMaterial {...state} baseColor="#a8a29e" metalness={0.93} roughness={0.25} />
          </Torus>
          {Array.from({ length: 22 }).map((_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return (
              <Box
                key={`turbine-blade-${stage}-${i}`}
                args={[0.022, 0.08, 0.22]}
                position={[Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34]}
                rotation={[0.18, -a, -0.26]}
              >
                <DetailMaterial {...state} baseColor="#78716c" metalness={0.94} roughness={0.27} />
              </Box>
            );
          })}
        </group>
      ))}

      <Cylinder args={[0.11, 0.11, 2.55, 24]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.98} roughness={0.12} clearcoat={0.42} />
      </Cylinder>

      <Torus args={[0.57, 0.025, 10, 72]} position={[0, 0.02, 0]}>
        <DetailMaterial {...state} baseColor="#22d3ee" metalness={0.22} roughness={0.32} />
      </Torus>
    </group>
  );
}

export function HydraulicPumpAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <RoundedBox args={[1.05, 0.74, 0.86]} radius={0.12} smoothness={6}>
        <DetailMaterial {...state} baseColor="#4b5563" metalness={0.88} roughness={0.3} clearcoat={0.18} />
      </RoundedBox>

      <Cylinder args={[0.22, 0.22, 0.18, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.52]}>
        <DetailMaterial {...state} baseColor="#1f2937" metalness={0.86} roughness={0.26} />
      </Cylinder>

      <Cylinder args={[0.10, 0.10, 0.46, 24]} position={[0, 0, 0.68]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.97} roughness={0.15} />
      </Cylinder>

      <Torus args={[0.22, 0.05, 16, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.10]}>
        <DetailMaterial {...state} baseColor="#b45309" metalness={0.86} roughness={0.28} />
      </Torus>
      <Torus args={[0.15, 0.038, 16, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.10]}>
        <DetailMaterial {...state} baseColor="#b45309" metalness={0.86} roughness={0.28} />
      </Torus>

      <Cylinder args={[0.12, 0.12, 0.38, 32]} rotation={[0, Math.PI / 2, 0]} position={[-0.66, 0.10, 0]}>
        <DetailMaterial {...state} baseColor="#334155" metalness={0.9} roughness={0.25} />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.38, 32]} rotation={[0, Math.PI / 2, 0]} position={[0.66, -0.10, 0]}>
        <DetailMaterial {...state} baseColor="#334155" metalness={0.9} roughness={0.25} />
      </Cylinder>

      <RadialBoltCircle count={8} radius={0.39} y={0.39} state={state} />
      <RadialBoltCircle count={8} radius={0.39} y={-0.39} state={state} />

      {Array.from({ length: 10 }).map((_, i) => (
        <Box
          key={`pump-rib-${i}`}
          args={[0.88, 0.025, 0.03]}
          position={[0, -0.34 + i * 0.075, -0.45]}
        >
          <DetailMaterial {...state} baseColor="#6b7280" metalness={0.88} roughness={0.3} />
        </Box>
      ))}
    </group>
  );
}

export function renderAdvancedEngineeringModel(
  id: string,
  state: AdvancedEngineeringModelProps,
): React.ReactNode | null {
  if (id === 'pmsm.stator_rotor') return <PMSMMotorAssembly {...state} />;
  if (id === 'planetary.gearset') return <PlanetaryGearsetAssembly {...state} />;
  if (id === 'jetengine.core') return <JetEngineCoreAssembly {...state} />;
  if (id === 'hydraulic_pump.core') return <HydraulicPumpAssembly {...state} />;
  return null;
}
