import React from 'react';
import { Box, Cylinder, RoundedBox, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

type State = AdvancedEngineeringModelProps;

function Pbr({ state, color, metalness = 0.82, roughness = 0.28 }: { state: State; color: string; metalness?: number; roughness?: number }) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.42} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.18 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.24 : 1}
      transmission={state.xrayEnabled ? 0.45 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.16}
      clearcoatRoughness={0.12}
      envMapIntensity={1.55}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.15 : state.isHovered ? 0.05 : 0}
    />
  );
}

function Bolts({ state, count, radius, y, size = 0.014 }: { state: State; count: number; radius: number; y: number; size?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[size, size, size * 1.8, 10]} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <Pbr state={state} color="#cbd5e1" metalness={0.96} roughness={0.13} />
          </Cylinder>
        );
      })}
    </>
  );
}

function Teeth({ state, count, radius, depth = 0.08, width = 0.045, y = 0, color = '#aeb7c0' }: { state: State; count: number; radius: number; depth?: number; width?: number; y?: number; color?: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Box key={i} args={[width, depth, width]} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]} rotation={[0, -a, 0]}>
            <Pbr state={state} color={color} metalness={0.93} roughness={0.18} />
          </Box>
        );
      })}
    </>
  );
}

function Windings({ state, count = 24, radius = 0.43, y = 0 }: { state: State; count?: number; radius?: number; y?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Torus args={[radius, 0.016, 8, 26, Math.PI * 0.82]} rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
              <Pbr state={state} color="#c8750a" metalness={0.78} roughness={0.22} />
            </Torus>
          </group>
        );
      })}
    </>
  );
}

function PMSMPrecision({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Windings state={state} count={30} radius={0.455} y={0.11} />
      <Windings state={state} count={30} radius={0.455} y={-0.11} />
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <Box args={[0.024, 0.22, 0.30]} position={[0.46, 0, 0]}>
              <Pbr state={state} color="#505b65" metalness={0.9} roughness={0.23} />
            </Box>
            <Box args={[0.018, 0.08, 0.34]} position={[0.37, 0, 0]}>
              <Pbr state={state} color="#d1d5db" metalness={0.96} roughness={0.15} />
            </Box>
          </group>
        );
      })}
      <Torus args={[0.50, 0.018, 12, 72]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#6b7280" metalness={0.94} roughness={0.19} />
      </Torus>
      <Torus args={[0.34, 0.022, 12, 72]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#252b31" metalness={0.78} roughness={0.24} />
      </Torus>
      <Bolts state={state} count={18} radius={0.53} y={0.40} />
      <Bolts state={state} count={18} radius={0.53} y={-0.40} />
    </group>
  );
}

function PlanetaryPrecision({ state }: { state: State }) {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <Teeth state={state} count={56} radius={0.77} depth={0.095} width={0.038} />
      <Teeth state={state} count={20} radius={0.195} depth={0.075} width={0.038} color="#d7dde4" />
      {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.40, 0, Math.sin(a) * 0.40]}>
          <Teeth state={state} count={28} radius={0.24} depth={0.075} width={0.035} color="#dda13c" />
          <Cylinder args={[0.034, 0.034, 0.44, 20]}>
            <Pbr state={state} color="#d8dee4" metalness={0.98} roughness={0.12} />
          </Cylinder>
          <Torus args={[0.075, 0.014, 10, 34]}>
            <Pbr state={state} color="#aeb7bf" metalness={0.96} roughness={0.13} />
          </Torus>
        </group>
      ))}
      <Torus args={[0.43, 0.026, 12, 72]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#ad8638" metalness={0.86} roughness={0.22} />
      </Torus>
      <Bolts state={state} count={16} radius={0.64} y={0.26} />
      <Bolts state={state} count={16} radius={0.64} y={-0.26} />
    </group>
  );
}

function JetPrecision({ state }: { state: State }) {
  const stages = [0.80, 0.52, 0.24];
  const turbines = [-0.40, -0.68, -0.96];
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.60, 0.065, 20, 80]}>
        <Pbr state={state} color="#65717b" metalness={0.94} roughness={0.22} />
      </Torus>
      {stages.map((y, s) => (
        <group key={'c'+s} position={[0, y, 0]}>
          {Array.from({ length: 34 }).map((_, i) => {
            const a = (i / 34) * Math.PI * 2;
            return (
              <Box key={i} args={[0.022, 0.12, 0.27]} position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]} rotation={[0.16, -a, 0.30]}>
                <Pbr state={state} color="#cbd5e1" metalness={0.96} roughness={0.17} />
              </Box>
            );
          })}
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return (
              <Box key={'s'+i} args={[0.018, 0.14, 0.22]} position={[Math.cos(a) * 0.30, 0, Math.sin(a) * 0.30]} rotation={[0.12, -a, 0]}>
                <Pbr state={state} color="#7d8791" metalness={0.92} roughness={0.20} />
              </Box>
            );
          })}
        </group>
      ))}
      <Torus args={[0.47, 0.11, 20, 80]} position={[0, -0.08, 0]}>
        <Pbr state={state} color="#8b3e23" metalness={0.72} roughness={0.38} />
      </Torus>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[0.055, 0.055, 0.38, 18]} position={[Math.cos(a) * 0.32, -0.08, Math.sin(a) * 0.32]}>
            <Pbr state={state} color="#aa4f28" metalness={0.72} roughness={0.36} />
          </Cylinder>
        );
      })}
      {turbines.map((y, s) => (
        <group key={'t'+s} position={[0, y, 0]}>
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <Box key={i} args={[0.020, 0.09, 0.25]} position={[Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34]} rotation={[-0.16, -a, -0.25]}>
                <Pbr state={state} color="#8f8a84" metalness={0.96} roughness={0.22} />
              </Box>
            );
          })}
        </group>
      ))}
      <Cylinder args={[0.075, 0.075, 2.70, 28]}>
        <Pbr state={state} color="#e2e7eb" metalness={0.99} roughness={0.10} />
      </Cylinder>
    </group>
  );
}

function HydraulicPrecision({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[1.20, 0.88, 0.92]} radius={0.12} smoothness={7}>
        <Pbr state={state} color="#46525f" metalness={0.90} roughness={0.28} />
      </RoundedBox>
      <group position={[0, 0, 0.44]}>
        <Torus args={[0.28, 0.04, 16, 56]} rotation={[Math.PI / 2, 0, 0]}>
          <Pbr state={state} color="#ad7c2f" metalness={0.84} roughness={0.25} />
        </Torus>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.20, Math.sin(a) * 0.20, 0]} rotation={[0, 0, a]}>
              <Cylinder args={[0.035, 0.035, 0.30, 18]}>
                <Pbr state={state} color="#cbd5e1" metalness={0.98} roughness={0.14} />
              </Cylinder>
            </group>
          );
        })}
      </group>
      <Cylinder args={[0.085, 0.085, 0.88, 28]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.50]}>
        <Pbr state={state} color="#d5dbe0" metalness={0.99} roughness={0.11} />
      </Cylinder>
      <Bolts state={state} count={14} radius={0.47} y={0.42} size={0.016} />
      <Bolts state={state} count={14} radius={0.47} y={-0.42} size={0.016} />
    </group>
  );
}

function TurboPrecision({ state, turbine = false }: { state: State; turbine?: boolean }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Torus args={[0.38, 0.15, 30, 88]}>
        <Pbr state={state} color={turbine ? '#4a443f' : '#67727c'} metalness={0.88} roughness={turbine ? 0.39 : 0.26} />
      </Torus>
      <Cylinder args={[0.135, 0.16, 0.52, 40]}>
        <Pbr state={state} color="#98a2aa" metalness={0.94} roughness={0.19} />
      </Cylinder>
      {Array.from({ length: turbine ? 24 : 28 }).map((_, i) => {
        const a = (i / (turbine ? 24 : 28)) * Math.PI * 2;
        return (
          <RoundedBox key={i} args={[0.023, 0.055, 0.26]} radius={0.009} smoothness={3} position={[Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25]} rotation={[turbine ? -0.30 : 0.34, 0, -a]}>
            <Pbr state={state} color={turbine ? '#807970' : '#d7dce1'} metalness={0.96} roughness={0.16} />
          </RoundedBox>
        );
      })}
      <Cylinder args={[0.055, 0.055, 0.78, 24]}>
        <Pbr state={state} color="#dce2e7" metalness={0.99} roughness={0.10} />
      </Cylinder>
      <Torus args={[0.10, 0.018, 10, 40]} position={[0, 0.36, 0]}>
        <Pbr state={state} color="#7c8790" metalness={0.94} roughness={0.17} />
      </Torus>
      <Torus args={[0.10, 0.018, 10, 40]} position={[0, -0.36, 0]}>
        <Pbr state={state} color="#7c8790" metalness={0.94} roughness={0.17} />
      </Torus>
      <Bolts state={state} count={10} radius={0.39} y={0.20} size={0.012} />
    </group>
  );
}

function DifferentialPrecision({ state }: { state: State }) {
  return (
    <group>
      <Torus args={[0.73, 0.09, 24, 96]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#4b5563" metalness={0.95} roughness={0.20} />
      </Torus>
      <Teeth state={state} count={44} radius={0.77} depth={0.10} width={0.040} />
      <Cylinder args={[0.43, 0.43, 0.30, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#343e47" metalness={0.88} roughness={0.29} />
      </Cylinder>
      <Cylinder args={[0.115, 0.115, 2.05, 28]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#d7dde2" metalness={0.99} roughness={0.10} />
      </Cylinder>
      {[Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.30, 0, Math.sin(a) * 0.30]}>
          <Teeth state={state} count={18} radius={0.14} depth={0.07} width={0.032} color="#cbd5e1" />
          <Cylinder args={[0.056, 0.056, 0.33, 22]}>
            <Pbr state={state} color="#c0c7ce" metalness={0.98} roughness={0.12} />
          </Cylinder>
        </group>
      ))}
      <Torus args={[0.37, 0.035, 14, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#a9782f" metalness={0.84} roughness={0.23} />
      </Torus>
      <Bolts state={state} count={16} radius={0.62} y={0.21} size={0.014} />
    </group>
  );
}

function GearboxPrecision({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[1.24, 0.98, 1.82]} radius={0.15} smoothness={7}>
        <Pbr state={state} color="#46525e" metalness={0.90} roughness={0.28} />
      </RoundedBox>
      {[0.64, 0.28, -0.08, -0.44].map((z, s) => (
        <group key={s} position={[0, 0, z]}>
          <Cylinder args={[0.10, 0.10, 1.62, 28]} rotation={[0, 0, Math.PI / 2]}>
            <Pbr state={state} color="#d5dbe0" metalness={0.99} roughness={0.10} />
          </Cylinder>
          <Teeth state={state} count={28 - s * 2} radius={0.22 - s * 0.012} depth={0.075} width={0.038} y={0} />
          <Torus args={[0.17 - s * 0.01, 0.025, 12, 48]} rotation={[Math.PI / 2, 0, 0]}>
            <Pbr state={state} color="#b28638" metalness={0.80} roughness={0.26} />
          </Torus>
        </group>
      ))}
      <Cylinder args={[0.058, 0.058, 1.52, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0.18, 0, 0]}>
        <Pbr state={state} color="#d7dde2" metalness={0.98} roughness={0.11} />
      </Cylinder>
      <Bolts state={state} count={12} radius={0.54} y={0.46} size={0.014} />
      <Bolts state={state} count={12} radius={0.54} y={-0.46} size={0.014} />
    </group>
  );
}

function BrakePrecision({ state, caliper = false }: { state: State; caliper?: boolean }) {
  if (caliper) {
    return (
      <group>
        <RoundedBox args={[0.40, 0.66, 0.30]} radius={0.08} smoothness={7}>
          <Pbr state={state} color="#a61f2e" metalness={0.32} roughness={0.32} />
        </RoundedBox>
        {[-0.14, -0.045, 0.045, 0.14].map((x, i) => (
          <group key={i} position={[x, 0.12, 0]}>
            <Cylinder args={[0.050, 0.050, 0.04, 24]} rotation={[Math.PI / 2, 0, 0]}>
              <Pbr state={state} color="#e3e7eb" metalness={0.98} roughness={0.10} />
            </Cylinder>
          </group>
        ))}
        <Box args={[0.50, 0.08, 0.32]} position={[0, -0.34, 0]}>
          <Pbr state={state} color="#20262d" metalness={0.16} roughness={0.60} />
        </Box>
        <Cylinder args={[0.024, 0.024, 0.18, 16]} position={[0.19, 0.42, 0]}>
          <Pbr state={state} color="#e2e7ec" metalness={0.97} roughness={0.11} />
        </Cylinder>
      </group>
    );
  }

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Cylinder args={[0.71, 0.71, 0.14, 80]}>
        <Pbr state={state} color="#2e343b" metalness={0.82} roughness={0.25} />
      </Cylinder>
      <Cylinder args={[0.48, 0.48, 0.19, 64]}>
        <Pbr state={state} color="#57616b" metalness={0.84} roughness={0.25} />
      </Cylinder>
      {Array.from({ length: 42 }).map((_, i) => {
        const a = (i / 42) * Math.PI * 2;
        return (
          <Box key={'v'+i} args={[0.022, 0.11, 0.28]} position={[Math.cos(a) * 0.56, 0.0, Math.sin(a) * 0.56]} rotation={[0, -a, 0.24]}>
            <Pbr state={state} color="#8a9299" metalness={0.88} roughness={0.23} />
          </Box>
        );
      })}
      {Array.from({ length: 20 }).map((_, i) => {
        const a = (i / 20) * Math.PI * 2;
        return (
          <Cylinder key={'d'+i} args={[0.020, 0.020, 0.052, 12]} position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]}>
            <Pbr state={state} color="#151a1f" metalness={0.10} roughness={0.72} />
          </Cylinder>
        );
      })}
      <Torus args={[0.28, 0.038, 14, 64]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#9da5ad" metalness={0.92} roughness={0.18} />
      </Torus>
      <Bolts state={state} count={10} radius={0.19} y={0.11} size={0.013} />
    </group>
  );
}

function SuspensionPrecision({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.175, 0.175, 1.82, 44]} position={[0, 0.05, 0]}>
        <Pbr state={state} color="#46515c" metalness={0.91} roughness={0.27} />
      </Cylinder>
      <Cylinder args={[0.080, 0.080, 1.12, 32]} position={[0, 0.36, 0]}>
        <Pbr state={state} color="#e2e7ec" metalness={0.99} roughness={0.10} />
      </Cylinder>
      {Array.from({ length: 28 }).map((_, i) => (
        <Torus key={i} args={[0.295 - i * 0.0010, 0.024, 14, 52]} position={[0, 0.80 - i * 0.057, 0]}>
          <Pbr state={state} color="#b13b46" metalness={0.36} roughness={0.39} />
        </Torus>
      ))}
      <Torus args={[0.13, 0.040, 16, 52]} position={[0, 1.28, 0]}>
        <Pbr state={state} color="#cbd3da" metalness={0.97} roughness={0.14} />
      </Torus>
      <RoundedBox args={[0.74, 0.14, 0.50]} radius={0.06} smoothness={5} position={[0, -0.88, 0]}>
        <Pbr state={state} color="#3d4852" metalness={0.88} roughness={0.29} />
      </RoundedBox>
      <Bolts state={state} count={8} radius={0.28} y={-0.82} size={0.014} />
      {[-0.42, 0.42].map((x, i) => (
        <Sphere key={i} args={[0.055, 18, 12]} position={[x, -0.88, 0]}>
          <Pbr state={state} color="#20262d" metalness={0.10} roughness={0.76} />
        </Sphere>
      ))}
    </group>
  );
}

function SteeringPrecision({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[2.28, 0.24, 0.30]} radius={0.075} smoothness={6}>
        <Pbr state={state} color="#515d69" metalness={0.92} roughness={0.25} />
      </RoundedBox>
      <Box args={[1.74, 0.12, 0.20]} position={[0, 0.11, 0]}>
        <Pbr state={state} color="#222830" metalness={0.48} roughness={0.34} />
      </Box>
      {Array.from({ length: 40 }).map((_, i) => (
        <Box key={i} args={[0.033, 0.058, 0.20]} position={[-0.86 + i * 0.044, 0.18, 0]}>
          <Pbr state={state} color="#d1d8de" metalness={0.97} roughness={0.13} />
        </Box>
      ))}
      {/* Pinion, housing, yoke and tie rods. */}
      <Cylinder args={[0.13, 0.13, 0.48, 30]} position={[0.34, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#4b5560" metalness={0.92} roughness={0.24} />
      </Cylinder>
      <Teeth state={state} count={18} radius={0.15} depth={0.07} width={0.033} y={0.0} color="#d1d7dd" />
      {[-0.98, 0.98].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <Torus args={[0.105, 0.030, 12, 40]} rotation={[0, Math.PI / 2, 0]}>
            <Pbr state={state} color="#20262b" metalness={0.05} roughness={0.82} />
          </Torus>
          <Cylinder args={[0.024, 0.024, 0.34, 18]} rotation={[0, 0, Math.PI / 2]} position={[0.12 * (i ? -1 : 1), 0, 0]}>
            <Pbr state={state} color="#d4dbe1" metalness={0.98} roughness={0.11} />
          </Cylinder>
        </group>
      ))}
      <Bolts state={state} count={12} radius={0.12} y={0.20} size={0.014} />
    </group>
  );
}

function Inline4Premium({ state }: { state: State }) {
  return (
    <group rotation={[0.10, -0.48, 0]}>
      <RoundedBox args={[1.02, 0.82, 2.40]} radius={0.08} smoothness={7}>
        <Pbr state={state} color="#46515c" metalness={0.88} roughness={0.28} />
      </RoundedBox>
      {[ -0.78, -0.26, 0.26, 0.78 ].map((z, i) => (
        <group key={i}>
          <Cylinder args={[0.25, 0.25, 0.72, 48, 1, true]} position={[0, 0.30, z]}>
            <Pbr state={state} color="#3a434b" metalness={0.86} roughness={0.26} />
          </Cylinder>
          <Cylinder args={[0.19, 0.19, 0.28, 48]} position={[0, 0.28, z]}>
            <Pbr state={state} color="#b9c1c8" metalness={0.92} roughness={0.17} />
          </Cylinder>
          <Torus args={[0.19, 0.009, 10, 42]} position={[0, 0.42, z]}>
            <Pbr state={state} color="#4c565f" metalness={0.88} roughness={0.18} />
          </Torus>
        </group>
      ))}
      <Cylinder args={[0.075, 0.075, 2.48, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#9ca7b0" metalness={0.98} roughness={0.11} />
      </Cylinder>
      {[-0.78, -0.26, 0.26, 0.78].map((z, i) => (
        <group key={i}>
          <Torus args={[0.07, 0.020, 12, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.10, z]}>
            <Pbr state={state} color="#8d969e" metalness={0.94} roughness={0.14} />
          </Torus>
          <HexBolt state={state} position={[-0.25, -0.33, z]} />
          <HexBolt state={state} position={[0.25, -0.33, z]} />
        </group>
      ))}
      <HeadRail state={state} />
    </group>
  );
}

function HexBolt({ state, position }: { state: State; position: [number, number, number] }) {
  return (
    <Cylinder args={[0.018, 0.018, 0.016, 6]} position={position}>
      <Pbr state={state} color="#d6dce1" metalness={0.98} roughness={0.11} />
    </Cylinder>
  );
}

function HeadRail({ state }: { state: State }) {
  return (
    <group position={[0, 0.82, 0]}>
      <RoundedBox args={[0.70, 0.16, 2.28]} radius={0.04} smoothness={5}>
        <Pbr state={state} color="#1d2329" metalness={0.42} roughness={0.38} />
      </RoundedBox>
      {[-0.78,-0.26,0.26,0.78].map(z => (
        <HexBolt key={z} state={state} position={[-0.28,0.10,z]} />
      ))}
      {[-0.78,-0.26,0.26,0.78].map(z => (
        <HexBolt key={'r'+z} state={state} position={[0.28,0.10,z]} />
      ))}
    </group>
  );
}

function V8Premium({ state }: { state: State }) {
  return (
    <group rotation={[0.12, -0.45, 0]}>
      <RoundedBox args={[1.12, 0.74, 2.20]} radius={0.09} smoothness={7}>
        <Pbr state={state} color="#414c57" metalness={0.88} roughness={0.28} />
      </RoundedBox>
      {[-1,-0.5,0,0.5].map((z,i)=>(
        <group key={i}>
          {[-0.34,0.34].map(x=>(
            <Cylinder key={x} args={[0.22,0.22,0.62,48,1,true]} position={[x,0.20,z]}>
              <Pbr state={state} color="#39434c" metalness={0.86} roughness={0.27}/>
            </Cylinder>
          ))}
        </group>
      ))}
      <Cylinder args={[0.075,0.075,2.40,32]} rotation={[Math.PI/2,0,0]}>
        <Pbr state={state} color="#9ca7b0" metalness={0.98} roughness={0.11}/>
      </Cylinder>
      <HeadRail state={state}/>
      <Bolts state={state} count={14} radius={0.56} y={-0.34}/>
    </group>
  );
}

function RotaryPremium({ state }: { state: State }) {
  return (
    <group rotation={[0.18,-0.38,0]}>
      <RoundedBox args={[1.06,1.06,0.42]} radius={0.12} smoothness={8}>
        <Pbr state={state} color="#4a5561" metalness={0.90} roughness={0.27}/>
      </RoundedBox>
      <Torus args={[0.49,0.08,18,72]} rotation={[Math.PI/2,0,0]}>
        <Pbr state={state} color="#5d6872" metalness={0.88} roughness={0.24}/>
      </Torus>
      <Box args={[0.68,0.10,0.58]} position={[0,0,0.18]}>
        <Pbr state={state} color="#3c4650" metalness={0.86} roughness={0.28}/>
      </Box>
      <Cylinder args={[0.085,0.085,1.55,28]}>
        <Pbr state={state} color="#d5dbe1" metalness={0.99} roughness={0.10}/>
      </Cylinder>
      <Torus args={[0.16,0.028,12,44]} rotation={[Math.PI/2,0,0]}>
        <Pbr state={state} color="#b27e2d" metalness={0.84} roughness={0.23}/>
      </Torus>
      <Bolts state={state} count={10} radius={0.48} y={0.26}/>
    </group>
  );
}

function TeslaPremium({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI/2,0,0]}>
      <RoundedBox args={[1.28,0.90,1.36]} radius={0.15} smoothness={8}>
        <Pbr state={state} color="#3d4853" metalness={0.91} roughness={0.26}/>
      </RoundedBox>
      <group>
        {Array.from({length:30}).map((_,i)=>{
          const a=i/30*Math.PI*2;
          return <Box key={i} args={[0.025,0.26,0.28]} position={[Math.cos(a)*0.48,0,Math.sin(a)*0.48]} rotation={[0,-a,0]}>
            <Pbr state={state} color="#bf732b" metalness={0.78} roughness={0.23}/>
          </Box>
        })}
      </group>
      <Cylinder args={[0.30,0.30,0.92,48]}>
        <Pbr state={state} color="#64707a" metalness={0.97} roughness={0.14}/>
      </Cylinder>
      <Cylinder args={[0.09,0.09,1.70,28]}>
        <Pbr state={state} color="#dce2e7" metalness={0.99} roughness={0.10}/>
      </Cylinder>
      <RoundedBox args={[0.70,0.18,0.72]} radius={0.07} smoothness={5} position={[0,0.52,0]}>
        <Pbr state={state} color="#25303a" metalness={0.42} roughness={0.34}/>
      </RoundedBox>
      <Bolts state={state} count={12} radius={0.58} y={0.46}/>
    </group>
  );
}

function BLDCPrecision({ state }: { state: State }) {
  return (
    <group rotation={[Math.PI/2,0,0]}>
      <Cylinder args={[0.52,0.52,0.46,64]}>
        <Pbr state={state} color="#3e4852" metalness={0.90} roughness={0.24}/>
      </Cylinder>
      {Array.from({length:12}).map((_,i)=>{
        const a=i/12*Math.PI*2;
        return <group key={i} rotation={[0,a,0]}>
          <RoundedBox args={[0.11,0.20,0.24]} radius={0.018} smoothness={3} position={[0.42,0,0]}>
            <Pbr state={state} color={i%2?'#1d4ed8':'#b45309'} metalness={0.50} roughness={0.25}/>
          </RoundedBox>
        </group>
      })}
      {Array.from({length:18}).map((_,i)=>{
        const a=i/18*Math.PI*2;
        return <Torus key={'w'+i} args={[0.42,0.013,8,28,Math.PI*0.78]} rotation={[Math.PI/2,0,0]} position={[0,0.12,0]}>
          <Pbr state={state} color="#c6750f" metalness={0.80} roughness={0.22}/>
        </Torus>
      })}
      <Cylinder args={[0.075,0.075,1.22,28]}>
        <Pbr state={state} color="#d7dde2" metalness={0.99} roughness={0.10}/>
      </Cylinder>
      <Bolts state={state} count={12} radius={0.48} y={0.23}/>
    </group>
  );
}

function StepperPremium({ state }: { state: State }) {
  return (
    <group>
      <RoundedBox args={[1.18,1.18,1.18]} radius={0.08} smoothness={7}>
        <Pbr state={state} color="#1f2933" metalness={0.60} roughness={0.37}/>
      </RoundedBox>
      {[-0.34,0,0.34].map((x)=>(
        <group key={x}>
          <Box args={[0.10,0.62,0.86]} position={[x,0,0]}>
            <Pbr state={state} color="#303b46" metalness={0.82} roughness={0.28}/>
          </Box>
        </group>
      ))}
      <Cylinder args={[0.30,0.30,0.66,48]} rotation={[Math.PI/2,0,0]}>
        <Pbr state={state} color="#59656f" metalness={0.88} roughness={0.24}/>
      </Cylinder>
      <Cylinder args={[0.055,0.055,1.28,24]}>
        <Pbr state={state} color="#dce2e7" metalness={0.99} roughness={0.10}/>
      </Cylinder>
      <Bolts state={state} count={4} radius={0.47} y={0.59} size={0.018}/>
    </group>
  );
}

function DCMotorPremium({ state }: { state: State }) {
  return (
    <group rotation={[0,0,Math.PI/2]}>
      <Cylinder args={[0.38,0.38,0.92,64,1,true]}>
        <Pbr state={state} color="#aeb7bf" metalness={0.90} roughness={0.25}/>
      </Cylinder>
      {[-0.28,0,0.28].map((x,i)=>(
        <Box key={i} args={[0.06,0.48,0.64]} position={[0,x,0]}>
          <Pbr state={state} color={i===1?'#a16207':'#515b65'} metalness={0.80} roughness={0.29}/>
        </Box>
      ))}
      <Cylinder args={[0.19,0.19,0.66,40]} position={[0,0,0]}>
        <Pbr state={state} color="#6b7280" metalness={0.92} roughness={0.22}/>
      </Cylinder>
      <Torus args={[0.15,0.022,10,36]} position={[0,0,-0.41]}>
        <Pbr state={state} color="#c47b0f" metalness={0.82} roughness={0.23}/>
      </Torus>
      <Cylinder args={[0.052,0.052,1.36,24]} position={[0,0,0.62]}>
        <Pbr state={state} color="#dce2e7" metalness={0.99} roughness={0.10}/>
      </Cylinder>
    </group>
  );
}

function BatteryPremium({ state }: { state: State }) {
  return (
    <group rotation={[0.05,-0.32,0]}>
      <RoundedBox args={[1.70,0.34,1.10]} radius={0.09} smoothness={7}>
        <Pbr state={state} color="#26323b" metalness={0.58} roughness={0.38}/>
      </RoundedBox>
      {Array.from({length:16}).map((_,i)=>{
        const x=(i%4-1.5)*0.36;
        const z=(Math.floor(i/4)-1.5)*0.24;
        return <Cylinder key={i} args={[0.145,0.145,0.52,36]} position={[x,0,z]}>
          <Pbr state={state} color={i%2?'#374151':'#52606c'} metalness={0.42} roughness={0.34}/>
        </Cylinder>
      })}
      <Box args={[1.42,0.045,0.78]} position={[0,0.30,0]}>
        <Pbr state={state} color="#b8c1c8" metalness={0.96} roughness={0.16}/>
      </Box>
      {[-0.52,0,0.52].map(x=>(
        <Box key={x} args={[0.42,0.025,0.06]} position={[x,0.34,0]}>
          <Pbr state={state} color="#d1d5db" metalness={0.98} roughness={0.12}/>
        </Box>
      ))}
    </group>
  );
}

export function renderPremiumEngineeringDetail(id: string, state: State): React.ReactNode | null {
  switch (id) {
    case 'pmsm.stator_rotor': return <PMSMPrecision state={state} />;
    case 'planetary.gearset': return <PlanetaryPrecision state={state} />;
    case 'jetengine.core': return <JetPrecision state={state} />;
    case 'hydraulic_pump.core': return <HydraulicPrecision state={state} />;
    case 'turbo_comp': return <TurboPrecision state={state} turbine={false} />;
    case 'turbo_turb': return <TurboPrecision state={state} turbine />;
    case 'diff_ring': return <DifferentialPrecision state={state} />;
    case 'gear_shaft': return <GearboxPrecision state={state} />;
    case 'brake_rotor': return <BrakePrecision state={state} caliper={false} />;
    case 'brake_caliper': return <BrakePrecision state={state} caliper />;
    case 'susp_spring': return <SuspensionPrecision state={state} />;
    case 'steering_rack': return <SteeringPrecision state={state} />;
    default: return null;
  }
}

export function renderPremiumWholeModel(objectId: string, componentId: string, state: State): React.ReactNode | null {
  if (objectId === 'v12_engine') return null;
  switch (objectId) {
    case 'inline4_engine':
      if (componentId === 'i4_block') return <Inline4Premium state={state} />;
      break;
    case 'v8_engine':
      if (componentId === 'v8_block') return <V8Premium state={state} />;
      break;
    case 'rotary_engine':
      if (componentId === 'rotor_housing') return <RotaryPremium state={state} />;
      break;
    case 'tesla_motor':
      if (componentId === 'tm_stator') return <TeslaPremium state={state} />;
      break;
    case 'brushless_motor':
      if (componentId === 'bldc_stator') return <BLDCPrecision state={state} />;
      break;
    case 'stepper_motor':
      if (componentId === 'stepper_casing') return <StepperPremium state={state} />;
      break;
    case 'dc_motor':
      if (componentId === 'dc_can') return <DCMotorPremium state={state} />;
      break;
    case 'li_ion_battery':
      if (componentId === 'bat_cells') return <BatteryPremium state={state} />;
      break;
    default:
      break;
  }
  return null;
}
