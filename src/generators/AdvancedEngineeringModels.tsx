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


export function TurbochargerAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <group position={[-0.38, 0, 0]}>
        <Torus args={[0.36, 0.14, 28, 72]}>
          <DetailMaterial {...state} baseColor="#6b7280" metalness={0.88} roughness={0.28} clearcoat={0.18} />
        </Torus>
        <Cylinder args={[0.18, 0.22, 0.28, 48]} position={[0.02, 0, 0]}>
          <DetailMaterial {...state} baseColor="#9ca3af" metalness={0.92} roughness={0.22} />
        </Cylinder>
        <Cylinder args={[0.12, 0.12, 0.32, 32]} position={[0, 0, 0.18]}>
          <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.14} />
        </Cylinder>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <Box key={`comp-blade-${i}`} args={[0.025, 0.045, 0.22]} position={[Math.cos(a) * 0.23, Math.sin(a) * 0.23, 0.11]} rotation={[0.35, 0, -a]}>
              <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.95} roughness={0.18} />
            </Box>
          );
        })}
      </group>
      <group position={[0.38, 0, 0]}>
        <Torus args={[0.36, 0.15, 28, 72]}>
          <DetailMaterial {...state} baseColor="#44403c" metalness={0.82} roughness={0.42} />
        </Torus>
        <Cylinder args={[0.19, 0.19, 0.30, 48]} position={[0, 0, 0]}>
          <DetailMaterial {...state} baseColor="#57534e" metalness={0.88} roughness={0.34} />
        </Cylinder>
        <Cylinder args={[0.115, 0.115, 0.32, 32]} position={[0, 0, 0.18]}>
          <DetailMaterial {...state} baseColor="#a8a29e" metalness={0.95} roughness={0.20} />
        </Cylinder>
        {Array.from({ length: 20 }).map((_, i) => {
          const a = (i / 20) * Math.PI * 2;
          return (
            <Box key={`turbine-blade-${i}`} args={[0.022, 0.05, 0.20]} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.11]} rotation={[-0.28, 0, -a]}>
              <DetailMaterial {...state} baseColor="#78716c" metalness={0.94} roughness={0.26} />
            </Box>
          );
        })}
        <Box args={[0.18, 0.18, 0.22]} position={[0.30, -0.05, 0]}>
          <DetailMaterial {...state} baseColor="#1f2937" metalness={0.22} roughness={0.58} />
        </Box>
        <Cylinder args={[0.035, 0.035, 0.28, 16]} position={[0.30, -0.18, 0]}>
          <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16} />
        </Cylinder>
      </group>
      <Cylinder args={[0.07, 0.07, 1.10, 28]}>
        <DetailMaterial {...state} baseColor="#cbd5e1" metalness={0.98} roughness={0.12} />
      </Cylinder>
    </group>
  );
}

export function DifferentialAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <Torus args={[0.72, 0.10, 24, 96]} rotation={[Math.PI / 2, 0, 0]}>
        <DetailMaterial {...state} baseColor="#4b5563" metalness={0.94} roughness={0.24} clearcoat={0.24} />
      </Torus>
      <GearTeeth count={36} radius={0.74} toothLength={0.11} toothWidth={0.055} y={0} state={state} />
      <Cylinder args={[0.53, 0.53, 0.54, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <DetailMaterial {...state} baseColor="#374151" metalness={0.84} roughness={0.34} />
      </Cylinder>
      <Cylinder args={[0.13, 0.13, 1.85, 28]} rotation={[0, 0, Math.PI / 2]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.98} roughness={0.14} />
      </Cylinder>
      <Torus args={[0.34, 0.05, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <DetailMaterial {...state} baseColor="#b45309" metalness={0.84} roughness={0.28} />
      </Torus>
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <group key={`spider-${i}`} position={[Math.cos(a) * 0.27, 0, Math.sin(a) * 0.27]}>
            <Cylinder args={[0.13, 0.13, 0.22, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <DetailMaterial {...state} baseColor="#9ca3af" metalness={0.92} roughness={0.22} />
            </Cylinder>
            <GearTeeth count={16} radius={0.15} toothLength={0.06} toothWidth={0.038} y={0} state={state} color="#cbd5e1" />
          </group>
        );
      })}
      <RadialBoltCircle count={12} radius={0.60} y={0.28} state={state} size={0.028} />
      <RadialBoltCircle count={12} radius={0.60} y={-0.28} state={state} size={0.028} />
    </group>
  );
}

export function GearboxAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <RoundedBox args={[1.12, 0.92, 1.70]} radius={0.16} smoothness={6}>
        <DetailMaterial {...state} baseColor="#475569" metalness={0.88} roughness={0.32} clearcoat={0.16} />
      </RoundedBox>
      {[0.58, 0.26, -0.08, -0.42].map((z, stage) => (
        <group key={`gear-stage-${stage}`} position={[0, 0, z]}>
          <Cylinder args={[0.22 - stage * 0.018, 0.22 - stage * 0.018, 0.18, 36]} rotation={[0, Math.PI / 2, 0]}>
            <DetailMaterial {...state} baseColor="#9ca3af" metalness={0.94} roughness={0.22} />
          </Cylinder>
          <GearTeeth count={24 - stage * 2} radius={0.25 - stage * 0.016} toothLength={0.075} toothWidth={0.045} y={0} state={state} />
        </group>
      ))}
      <Cylinder args={[0.07, 0.07, 1.80, 24]} rotation={[0, 0, Math.PI / 2]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.98} roughness={0.12} />
      </Cylinder>
      <Cylinder args={[0.055, 0.055, 1.55, 24]} position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <DetailMaterial {...state} baseColor="#c4b454" metalness={0.8} roughness={0.30} />
      </Cylinder>
      <RadialBoltCircle count={8} radius={0.50} y={0.45} state={state} />
      <RadialBoltCircle count={8} radius={0.50} y={-0.45} state={state} />
    </group>
  );
}

export function BrakeRotorAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.68, 0.10, 28, 96]}>
        <DetailMaterial {...state} baseColor="#27272a" metalness={0.72} roughness={0.31} />
      </Torus>
      <Cylinder args={[0.55, 0.55, 0.10, 64]}>
        <DetailMaterial {...state} baseColor="#3f3f46" metalness={0.80} roughness={0.30} />
      </Cylinder>
      <Cylinder args={[0.20, 0.20, 0.14, 48]}>
        <DetailMaterial {...state} baseColor="#64748b" metalness={0.92} roughness={0.22} />
      </Cylinder>
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2;
        return (
          <Box key={`vane-${i}`} args={[0.035, 0.12, 0.34]} position={[Math.cos(a) * 0.43, 0, Math.sin(a) * 0.43]} rotation={[0, -a, 0.18]}>
            <DetailMaterial {...state} baseColor="#71717a" metalness={0.86} roughness={0.27} />
          </Box>
        );
      })}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <Cylinder key={`drill-${i}`} args={[0.024, 0.024, 0.04, 12]} position={[Math.cos(a) * 0.50, 0, Math.sin(a) * 0.50]}>
            <DetailMaterial {...state} baseColor="#111827" metalness={0.15} roughness={0.72} />
          </Cylinder>
        );
      })}
      <RadialBoltCircle count={5} radius={0.15} y={0.08} state={state} size={0.018} />
    </group>
  );
}

export function BrakeCaliperAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <RoundedBox args={[0.34, 0.56, 0.24]} radius={0.07} smoothness={5}>
        <DetailMaterial {...state} baseColor="#b91c1c" metalness={0.35} roughness={0.36} clearcoat={0.40} />
      </RoundedBox>
      {[[-0.13, 0.10],[-0.13,-0.10],[0.13,0.10],[0.13,-0.10]].map(([x,z],i)=>(
        <Cylinder key={`piston-${i}`} args={[0.045,0.045,0.025,20]} position={[x,0.18,z]} rotation={[Math.PI/2,0,0]}>
          <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.95} roughness={0.16} />
        </Cylinder>
      ))}
      <Box args={[0.43,0.05,0.26]} position={[0,-0.30,0]}>
        <DetailMaterial {...state} baseColor="#111827" metalness={0.10} roughness={0.70} />
      </Box>
      <RadialBoltCircle count={4} radius={0.20} y={0.31} state={state} size={0.018} />
    </group>
  );
}

export function StrutAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <Cylinder args={[0.16, 0.16, 1.75, 40]} position={[0, 0.1, 0]}>
        <DetailMaterial {...state} baseColor="#475569" metalness={0.88} roughness={0.30} />
      </Cylinder>
      {Array.from({ length: 28 }).map((_, i) => (
        <Torus key={`spring-${i}`} args={[0.30 - i * 0.001, 0.026, 12, 48]} position={[0, 0.75 - i * 0.055, 0]}>
          <DetailMaterial {...state} baseColor="#dc2626" metalness={0.36} roughness={0.42} clearcoat={0.32} />
        </Torus>
      ))}
      <Cylinder args={[0.08, 0.08, 0.32, 24]} position={[0, 1.07, 0]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16} />
      </Cylinder>
      <Box args={[0.78, 0.08, 0.16]} position={[0, -0.88, 0]}>
        <DetailMaterial {...state} baseColor="#374151" metalness={0.86} roughness={0.32} />
      </Box>
      <Cylinder args={[0.05,0.05,0.18,20]} position={[-0.35,-0.88,0]} rotation={[0,0,Math.PI/2]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16}/>
      </Cylinder>
      <Cylinder args={[0.05,0.05,0.18,20]} position={[0.35,-0.88,0]} rotation={[0,0,Math.PI/2]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.96} roughness={0.16}/>
      </Cylinder>
    </group>
  );
}

export function SteeringRackAssembly(state: AdvancedEngineeringModelProps) {
  return (
    <group>
      <Box args={[2.10,0.16,0.18]} position={[0,0,0]}>
        <DetailMaterial {...state} baseColor="#6b7280" metalness={0.92} roughness={0.28}/>
      </Box>
      {Array.from({ length: 34 }).map((_, i)=>(
        <Box key={`rack-tooth-${i}`} args={[0.04,0.06,0.20]} position={[-0.78+i*0.047,0.11,0]}>
          <DetailMaterial {...state} baseColor="#cbd5e1" metalness={0.96} roughness={0.18}/>
        </Box>
      ))}
      <Cylinder args={[0.11,0.11,0.42,28]} position={[0.35,0.23,0]} rotation={[0,0,Math.PI/2]}>
        <DetailMaterial {...state} baseColor="#4b5563" metalness={0.90} roughness={0.27}/>
      </Cylinder>
      <Cylinder args={[0.045,0.045,0.48,24]} position={[0.35,0.46,0]} rotation={[Math.PI/2,0,0]}>
        <DetailMaterial {...state} baseColor="#d1d5db" metalness={0.98} roughness={0.14}/>
      </Cylinder>
      <Torus args={[0.08,0.025,12,36]} position={[-0.90,-0.01,0]} rotation={[0,Math.PI/2,0]}>
        <DetailMaterial {...state} baseColor="#18181b" metalness={0.05} roughness={0.82}/>
      </Torus>
      <Torus args={[0.08,0.025,12,36]} position={[0.90,-0.01,0]} rotation={[0,Math.PI/2,0]}>
        <DetailMaterial {...state} baseColor="#18181b" metalness={0.05} roughness={0.82}/>
      </Torus>
      <RadialBoltCircle count={6} radius={0.10} y={0.22} state={state} size={0.016}/>
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
  if (id === 'turbo_comp' || id === 'turbo_turb') return <TurbochargerAssembly {...state} />;
  if (id === 'diff_ring') return <DifferentialAssembly {...state} />;
  if (id === 'gear_shaft') return <GearboxAssembly {...state} />;
  if (id === 'brake_rotor') return <BrakeRotorAssembly {...state} />;
  if (id === 'brake_caliper') return <BrakeCaliperAssembly {...state} />;
  if (id === 'susp_spring') return <StrutAssembly {...state} />;
  if (id === 'steering_rack') return <SteeringRackAssembly {...state} />;
  return null;
}
