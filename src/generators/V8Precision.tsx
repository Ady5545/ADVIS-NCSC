import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Sphere, Torus, Tube } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

type State = AdvancedEngineeringModelProps & {
  crankAngleRef?: React.MutableRefObject<number> | null;
  isKinematicPlaying?: boolean;
  kinematicSpeed?: number;
  v8Rpm?: number;
};

const BANK = Math.PI / 4;
const Z = [-0.78, -0.26, 0.26, 0.78] as const;
// A conventional 90-degree cross-plane layout has four crank throws in crossed planes.
// This is a representative educational assembly, not an OEM-specific engine drawing.
const THROW_PHASES = [0, Math.PI / 2, -Math.PI / 2, Math.PI] as const;

function M({
  state,
  color,
  metalness = 0.78,
  roughness = 0.30,
  clearcoat = 0.16,
}: {
  state: State;
  color: string;
  metalness?: number;
  roughness?: number;
  clearcoat?: number;
}) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.48} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.2 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.28 : 1}
      transmission={state.xrayEnabled ? 0.25 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={clearcoat}
      clearcoatRoughness={0.2}
      envMapIntensity={2.0}
      emissive={state.isSelected ? '#0ea5e9' : state.isHovered ? '#38bdf8' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.11 : state.isHovered ? 0.035 : 0}
    />
  );
}

export function V8StudioLightRig() {
  return (
    <group>
      {/* Model-only studio lighting: neutral key, cool rim, warm fill and soft ambient lift. */}
      <hemisphereLight args={['#dce8f5', '#121a22', 0.85]} />
      <ambientLight color="#d8e1eb" intensity={0.28} />
      <directionalLight position={[4.5, 6, 5]} color="#fff1df" intensity={2.0} />
      <directionalLight position={[-4, 2.5, -3]} color="#83cfff" intensity={1.65} />
      <directionalLight position={[1, 3, -5]} color="#f3c28c" intensity={0.85} />
      <pointLight position={[0, 2.2, 1.5]} color="#c4e4ff" intensity={5} distance={8} decay={2} />
    </group>
  );
}

function Bolt({
  state,
  position,
  radius = 0.012,
  length = 0.018,
}: {
  state: State;
  position: [number, number, number];
  radius?: number;
  length?: number;
}) {
  return (
    <Cylinder args={[radius, radius, length, 10]} position={position}>
      <M state={state} color="#d7dde2" metalness={0.98} roughness={0.10} />
    </Cylinder>
  );
}

function BoltLine({
  state,
  points,
}: {
  state: State;
  points: Array<[number, number, number]>;
}) {
  return (
    <>
      {points.map((p, i) => <Bolt key={i} state={state} position={p} />)}
    </>
  );
}

function Piston({
  state,
}: {
  state: State;
}) {
  return (
    <group>
      {/* Machined crown and skirt; the ring pack is separated into real visible bands. */}
      <Cylinder args={[0.148, 0.143, 0.17, 48]}>
        <M state={state} color="#c4cbd0" metalness={0.72} roughness={0.26} />
      </Cylinder>
      <Cylinder args={[0.136, 0.136, 0.075, 48]} position={[0, -0.055, 0]}>
        <M state={state} color="#929da5" metalness={0.66} roughness={0.32} />
      </Cylinder>
      {[-0.018, -0.045, -0.071].map((y, i) => (
        <React.Fragment key={i}>
          <Torus args={[0.143 - i * 0.003, 0.0045, 8, 48]} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color={i === 2 ? "#434b51" : "#e0e5e8"} metalness={0.9} roughness={0.2} clearcoat={0.08} />
          </Torus>
          <Torus args={[0.139 - i * 0.003, 0.003, 8, 48]} position={[0, y - 0.007, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#30383e" metalness={0.78} roughness={0.34} clearcoat={0.05} />
          </Torus>
        </React.Fragment>
      ))}
      {/* Wrist pin runs parallel to the crankshaft. */}
      <Cylinder args={[0.026, 0.026, 0.23, 28]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#aab4bb" metalness={0.96} roughness={0.16} />
      </Cylinder>
      <Cylinder args={[0.031, 0.031, 0.018, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.09]}>
        <M state={state} color="#515b63" metalness={0.86} roughness={0.22} />
      </Cylinder>
      <Cylinder args={[0.031, 0.031, 0.018, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.09]}>
        <M state={state} color="#515b63" metalness={0.86} roughness={0.22} />
      </Cylinder>
    </group>
  );
}

function Rod({ state }: { state: State }) {
  return (
    <group>
      {/* Forged I/H-beam shank with the small and big ends concentric with their pins. */}
      <RoundedBox args={[0.064, 0.32, 0.046]} radius={0.012} smoothness={5}>
        <M state={state} color="#87939c" metalness={0.91} roughness={0.22} />
      </RoundedBox>
      <Box args={[0.026, 0.255, 0.054]}>
        <M state={state} color="#b8c1c7" metalness={0.92} roughness={0.18} clearcoat={0.08} />
      </Box>
      <Torus args={[0.044, 0.011, 10, 32]} position={[0, 0.151, 0]}>
        <M state={state} color="#c0c8ce" metalness={0.94} roughness={0.17} />
      </Torus>
      <Torus args={[0.063, 0.014, 10, 36]} position={[0, -0.151, 0]}>
        <M state={state} color="#9ba6ae" metalness={0.93} roughness={0.2} />
      </Torus>
      <Cylinder args={[0.029, 0.029, 0.066, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.151, 0]}>
        <M state={state} color="#252d33" metalness={0.28} roughness={0.62} />
      </Cylinder>
      <Cylinder args={[0.043, 0.043, 0.074, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.151, 0]}>
        <M state={state} color="#252d33" metalness={0.28} roughness={0.62} />
      </Cylinder>
      {[-0.025, 0.025].map((x) => (
        <React.Fragment key={x}>
          <Cylinder args={[0.008, 0.008, 0.012, 8]} position={[x, -0.176, 0.026]}>
            <M state={state} color="#d7dee3" metalness={0.95} roughness={0.15} />
          </Cylinder>
        </React.Fragment>
      ))}
    </group>
  );
}

function V8CrankCore({ state }: { state: State }) {
  const crankRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (crankRef.current) {
      // The crank is coaxial with Z, matching the cylinder-row direction.
      crankRef.current.rotation.z = state.crankAngleRef?.current ?? 0;
    }
  });

  return (
    <group ref={crankRef}>
      {/* Main journal axis and five bearing lands: true Z-axis crankshaft orientation. */}
      <Cylinder args={[0.052, 0.052, 2.05, 40]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#aeb8c0" metalness={0.98} roughness={0.15} />
      </Cylinder>

      {Z.map((z, i) => {
        const throwAngle = THROW_PHASES[i];
        const x = Math.cos(throwAngle) * 0.108;
        const y = Math.sin(throwAngle) * 0.108;
        return (
          <group key={z}>
            {/* Forged counterweight webs flank each shared crankpin. */}
            {[-0.086, 0.086].map((offset) => (
              <RoundedBox
                key={offset}
                args={[0.13, 0.235, 0.065]}
                radius={0.025}
                smoothness={5}
                position={[x * 0.45, y * 0.45, z + offset]}
                rotation={[0, 0, throwAngle - Math.PI / 2]}
              >
                <M state={state} color="#56626b" metalness={0.92} roughness={0.22} />
              </RoundedBox>
            ))}
            <Cylinder args={[0.061, 0.061, 0.145, 36]} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
              <M state={state} color="#d1d8dd" metalness={0.99} roughness={0.12} clearcoat={0.08} />
            </Cylinder>
          </group>
        );
      })}

      {[-0.94, -0.47, 0, 0.47, 0.94].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <Cylinder args={[0.075, 0.075, 0.095, 36]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#a4afb7" metalness={0.96} roughness={0.19} />
          </Cylinder>
          <Torus args={[0.077, 0.006, 8, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.045]}>
            <M state={state} color="#65717a" metalness={0.93} roughness={0.26} />
          </Torus>
        </group>
      ))}

      {/* Rear flywheel and starter ring gear. */}
      <group position={[0, 0, 1.02]}>
        <Cylinder args={[0.22, 0.22, 0.075, 56]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#67737c" metalness={0.94} roughness={0.22} />
        </Cylinder>
        <Torus args={[0.205, 0.023, 10, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#222a30" metalness={0.76} roughness={0.32} />
        </Torus>
        {Array.from({ length: 32 }).map((_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return (
            <Box key={i} args={[0.022, 0.028, 0.065]} position={[Math.cos(a) * 0.224, Math.sin(a) * 0.224, 0]}>
              <M state={state} color="#8b969e" metalness={0.86} roughness={0.28} />
            </Box>
          );
        })}
      </group>
    </group>
  );
}

function V8BlockShell({ state }: { state: State }) {
  return (
    <group>
      {/* Deep-skirt cast block with a restrained dark graphite iron finish. */}
      <RoundedBox args={[0.74, 0.48, 1.90]} radius={0.065} smoothness={7}>
        <M state={state} color="#303a43" metalness={0.72} roughness={0.43} clearcoat={0.06} />
      </RoundedBox>

      {/* Machined cylinder decks and cast bank rails follow the two 45-degree banks. */}
      {[-1, 1].map((sign) => (
        <group key={sign} position={[sign * 0.19, 0.18, 0]} rotation={[0, 0, -sign * BANK]}>
          <RoundedBox args={[0.48, 0.34, 1.78]} radius={0.045} smoothness={6}>
            <M state={state} color="#414c55" metalness={0.74} roughness={0.38} clearcoat={0.06} />
          </RoundedBox>
          <RoundedBox args={[0.54, 0.065, 1.80]} radius={0.018} smoothness={4} position={[0, 0.20, 0]}>
            <M state={state} color="#b5bec5" metalness={0.86} roughness={0.28} clearcoat={0.08} />
          </RoundedBox>
          {/* Head-bolt bosses and machined fasteners along both deck rails. */}
          {Z.flatMap((z) => ([-0.16, 0.16] as const).map((x) => (
            <React.Fragment key={x + ':' + z}>
              <Cylinder args={[0.021, 0.021, 0.012, 14]} position={[x, 0.239, z]}>
                <M state={state} color="#59656d" metalness={0.8} roughness={0.31} />
              </Cylinder>
              <Bolt state={state} position={[x, 0.249, z]} radius={0.008} length={0.012} />
            </React.Fragment>
          )))}
        </group>
      ))}

      {/* Casting ribs, core plugs and cross-bolted main-cap structure. */}
      {[-0.73, -0.36, 0, 0.36, 0.73].map((z) => (
        <React.Fragment key={z}>
          <RoundedBox args={[0.055, 0.35, 0.09]} radius={0.012} smoothness={3} position={[-0.39, -0.02, z]} rotation={[0, 0, -0.25]}>
            <M state={state} color="#46525b" metalness={0.68} roughness={0.43} clearcoat={0.04} />
          </RoundedBox>
          <RoundedBox args={[0.055, 0.35, 0.09]} radius={0.012} smoothness={3} position={[0.39, -0.02, z]} rotation={[0, 0, 0.25]}>
            <M state={state} color="#46525b" metalness={0.68} roughness={0.43} clearcoat={0.04} />
          </RoundedBox>
          <RoundedBox args={[0.13, 0.12, 0.13]} radius={0.018} smoothness={3} position={[0, -0.285, z]}>
            <M state={state} color="#424d56" metalness={0.76} roughness={0.36} />
          </RoundedBox>
          {[-0.055, 0.055].map((x) => (
            <Bolt key={x} state={state} position={[x, -0.292, z]} radius={0.009} length={0.016} />
          ))}
        </React.Fragment>
      ))}

      {/* Core-plug faces on the crankcase sides: subtle circular cast details, not glow effects. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[-0.62, -0.20, 0.22, 0.62].map((z) => (
            <group key={z} position={[side * 0.381, -0.055, z]} rotation={[0, 0, side * Math.PI / 2]}>
              <Cylinder args={[0.048, 0.048, 0.014, 32]}>
                <M state={state} color="#69757d" metalness={0.78} roughness={0.31} />
              </Cylinder>
              <Torus args={[0.041, 0.004, 8, 32]}>
                <M state={state} color="#242d34" metalness={0.48} roughness={0.5} clearcoat={0.03} />
              </Torus>
            </group>
          ))}
        </group>
      ))}

      {/* Rear bellhousing flange and evenly spaced fasteners. */}
      <RoundedBox args={[0.62, 0.72, 0.055]} radius={0.035} smoothness={4} position={[0, 0.02, 0.96]}>
        <M state={state} color="#3a444d" metalness={0.74} roughness={0.38} />
      </RoundedBox>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <Bolt key={i} state={state} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.25, 0.995]} radius={0.009} length={0.014} />;
      })}
    </group>
  );
}

function V8MovingCylinder({
  state,
  side,
  index,
  z,
}: {
  state: State;
  side: -1 | 1;
  index: number;
  z: number;
}) {
  const pistonRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Group>(null);
  const crankRadius = 0.108;
  const rodLength = 0.32;
  const crankAxisOffset = -0.32;

  useFrame(() => {
    const angle = (state.crankAngleRef?.current ?? 0) + THROW_PHASES[index] - (Math.PI / 2 - side * BANK);
    const crankX = crankRadius * Math.sin(angle);
    const crankY = crankAxisOffset + crankRadius * Math.cos(angle);
    const verticalRodLength = Math.sqrt(Math.max(0.0001, rodLength * rodLength - crankX * crankX));
    const pistonY = crankY + verticalRodLength;

    if (pistonRef.current) pistonRef.current.position.y = pistonY;
    if (rodRef.current) {
      rodRef.current.position.set(crankX * 0.5, (pistonY + crankY) * 0.5, 0);
      rodRef.current.rotation.z = Math.atan2(crankX, verticalRodLength);
    }
  });

  return (
    <group position={[0, 0, z]}>
      {/* Open liner makes the piston/ring pack readable in inspection and X-ray modes. */}
      <Cylinder args={[0.171, 0.171, 0.62, 48, 1, true]} position={[0, 0.06, 0]}>
        <M state={state} color="#697781" metalness={0.87} roughness={0.25} clearcoat={0.08} />
      </Cylinder>
      <Torus args={[0.171, 0.012, 10, 48]} position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#c5cdd2" metalness={0.94} roughness={0.19} />
      </Torus>
      <Torus args={[0.166, 0.005, 8, 48]} position={[0, 0.342, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#2b3339" metalness={0.75} roughness={0.34} />
      </Torus>
      <group ref={pistonRef}>
        <Piston state={state} />
      </group>
      <group ref={rodRef}>
        <Rod state={state} />
      </group>
    </group>
  );
}

function V8PistonBankPart({ state, side }: { state: State; side: -1 | 1 }) {
  // The SpatialLibrary parent already supplies this bank's position and 45-degree angle.
  // Keeping this geometry local prevents the old double translation/rotation error.
  return (
    <group>
      {Z.map((z, index) => (
        <V8MovingCylinder key={z} state={state} side={side} index={index} z={z} />
      ))}
    </group>
  );
}

function V8ValveAssembly({
  state,
  side,
  index,
  z,
  x,
  valveIndex,
}: {
  state: State;
  side: -1 | 1;
  index: number;
  z: number;
  x: number;
  valveIndex: number;
}) {
  const valveRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const crankAngle = state.crankAngleRef?.current ?? 0;
    const phase = THROW_PHASES[index] + (valveIndex === 0 ? 0.4 : 2.05) + (side < 0 ? 0 : 0.22);
    // A soft illustrative cam-lift curve; motion is phase-linked but not an OEM valve-timing simulation.
    const camAngle = crankAngle * 0.5 + phase;
    const lift = Math.max(0, Math.sin(camAngle)) ** 1.4 * 0.027;
    if (valveRef.current) valveRef.current.position.y = 0.095 + lift;
  });

  return (
    <group ref={valveRef} position={[x, 0.095, z]}>
      <Cylinder args={[0.008, 0.008, 0.145, 12]} position={[0, -0.01, 0]}>
        <M state={state} color="#abb6be" metalness={0.96} roughness={0.18} />
      </Cylinder>
      <Cylinder args={[0.022, 0.022, 0.012, 20]} position={[0, -0.082, 0]}>
        <M state={state} color="#d1d8dd" metalness={0.93} roughness={0.22} />
      </Cylinder>
      {/* Visible multi-coil valve spring and retainer. */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Torus key={i} args={[0.027, 0.0032, 7, 24]} position={[0, -0.022 + i * 0.017, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#8c989f" metalness={0.91} roughness={0.25} />
        </Torus>
      ))}
      <Cylinder args={[0.035, 0.035, 0.014, 20]} position={[0, 0.052, 0]}>
        <M state={state} color="#aeb8bf" metalness={0.9} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

function V8CylinderHeadPart({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group>
      {/* Cast-aluminium OHV head: ports and 2 valves per cylinder, not an overhead cam head. */}
      <RoundedBox args={[0.45, 0.18, 1.78]} radius={0.04} smoothness={6}>
        <M state={state} color="#aeb8be" metalness={0.71} roughness={0.32} clearcoat={0.08} />
      </RoundedBox>
      {[-0.68, -0.22, 0.22, 0.68].map((z, index) => (
        <group key={z}>
          {/* Machined combustion-chamber/seat recess cues on the underside. */}
          {[-0.075, 0.075].map((x, valveIndex) => (
            <group key={x}>
              <Cylinder args={[0.044, 0.039, 0.014, 28]} position={[x, -0.097, z]}>
                <M state={state} color="#717e87" metalness={0.65} roughness={0.38} />
              </Cylinder>
              <Torus args={[0.034, 0.004, 8, 28]} position={[x, -0.106, z]} rotation={[Math.PI / 2, 0, 0]}>
                <M state={state} color="#cfd6db" metalness={0.82} roughness={0.25} />
              </Torus>
              <V8ValveAssembly state={state} side={side} index={index} z={z} x={x} valveIndex={valveIndex} />
            </group>
          ))}
          {/* Spark plug with ceramic insulator and a steel hex base, placed at each chamber. */}
          <group position={[-side * 0.165, 0.005, z]} rotation={[0, 0, side * 0.12]}>
            <Cylinder args={[0.022, 0.022, 0.075, 18]} position={[0, 0.035, 0]}>
              <M state={state} color="#c3cbd1" metalness={0.92} roughness={0.2} />
            </Cylinder>
            <Cylinder args={[0.014, 0.014, 0.068, 16]} position={[0, 0.094, 0]}>
              <M state={state} color="#e5e7eb" metalness={0.1} roughness={0.28} clearcoat={0.3} />
            </Cylinder>
            <Cylinder args={[0.008, 0.008, 0.025, 12]} position={[0, 0.14, 0]}>
              <M state={state} color="#8b969e" metalness={0.92} roughness={0.18} />
            </Cylinder>
          </group>
          {/* Rocker arms and pushrod tips make the classic in-block-cam OHV architecture legible. */}
          {[-0.08, 0.08].map((x, j) => (
            <group key={x}>
              <Cylinder args={[0.009, 0.009, 0.25, 12]} position={[-side * 0.15, -0.04, z + (j ? 0.035 : -0.035)]} rotation={[0, 0, side * 0.08]}>
                <M state={state} color="#c3ccd2" metalness={0.94} roughness={0.2} />
              </Cylinder>
              <RoundedBox args={[0.12, 0.026, 0.045]} radius={0.009} smoothness={3} position={[x, 0.118, z + (j ? 0.04 : -0.04)]} rotation={[0, 0, side * 0.13]}>
                <M state={state} color="#68757e" metalness={0.9} roughness={0.24} />
              </RoundedBox>
              <Cylinder args={[0.011, 0.011, 0.02, 10]} position={[x, 0.13, z + (j ? 0.04 : -0.04)]}>
                <M state={state} color="#d2d9de" metalness={0.95} roughness={0.17} />
              </Cylinder>
            </group>
          ))}
          {/* Machined port covers / casting ribs on the outside edge. */}
          {[-1, 1].map((s) => (
            <Box key={s} args={[0.032, 0.06, 0.30]} position={[s * 0.205, -0.01, z]}>
              <M state={state} color="#8b989f" metalness={0.68} roughness={0.37} />
            </Box>
          ))}
        </group>
      ))}
      {[-0.72, -0.24, 0.24, 0.72].map((z) => (
        <React.Fragment key={z}>
          <Bolt state={state} position={[-0.18, 0.094, z]} radius={0.009} length={0.014} />
          <Bolt state={state} position={[0.18, 0.094, z]} radius={0.009} length={0.014} />
        </React.Fragment>
      ))}
    </group>
  );
}

function V8PushrodAndRocker({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group>
      {Z.flatMap((z) => [-0.085, 0.085].map((x, j) => (
        <group key={x + ':' + z}>
          <Cylinder args={[0.009, 0.009, 0.34, 12]} position={[-side * 0.12, -0.01, z + (j ? 0.055 : -0.055)]}>
            <M state={state} color="#c6cfd5" metalness={0.94} roughness={0.19} />
          </Cylinder>
          <RoundedBox args={[0.095, 0.028, 0.045]} radius={0.008} smoothness={3} position={[x, 0.17, z + (j ? 0.055 : -0.055)]}>
            <M state={state} color="#67747d" metalness={0.9} roughness={0.24} />
          </RoundedBox>
        </group>
      )))}
    </group>
  );
}

function V8CamshaftPart({ state }: { state: State }) {
  const camRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (camRef.current) camRef.current.rotation.z = (state.crankAngleRef?.current ?? 0) * 0.5;
  });

  return (
    <group ref={camRef}>
      {/* Single in-block camshaft appropriate to this representative pushrod V8. */}
      <Cylinder args={[0.034, 0.034, 1.95, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#9eaab2" metalness={0.97} roughness={0.18} />
      </Cylinder>
      {Z.flatMap((z, index) => [0, 1].map((lobe) => {
        const phase = THROW_PHASES[index] + (lobe ? Math.PI * 0.74 : 0.18);
        return (
          <group key={z + ':' + lobe} position={[0, 0, z + (lobe ? 0.105 : -0.105)]} rotation={[0, 0, phase]}>
            <Sphere args={[0.052, 24, 16]} scale={[0.72, 1.35, 0.7]} position={[0, 0.045, 0]}>
              <M state={state} color="#b9c3ca" metalness={0.93} roughness={0.2} />
            </Sphere>
          </group>
        );
      }))}
      <Cylinder args={[0.085, 0.085, 0.08, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.96]}>
        <M state={state} color="#59656d" metalness={0.9} roughness={0.24} />
      </Cylinder>
      <Torus args={[0.078, 0.009, 8, 36]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.005]}>
        <M state={state} color="#c2cbd1" metalness={0.91} roughness={0.2} />
      </Torus>
    </group>
  );
}

function V8IntakePart({ state }: { state: State }) {
  const runners = Z.flatMap((z, i) => ([-1, 1] as const).map((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.10, 0.025, z),
      new THREE.Vector3(side * 0.14, -0.04, z + (i - 1.5) * 0.025),
      new THREE.Vector3(side * 0.22, -0.16, z),
      new THREE.Vector3(side * 0.25, -0.23, z),
    ]);
    return (
      <group key={i + ':' + side}>
        <Tube args={[curve, 28, 0.032, 12, false]}>
          <M state={state} color="#929fa8" metalness={0.84} roughness={0.28} clearcoat={0.1} />
        </Tube>
        <Cylinder args={[0.018, 0.018, 0.055, 16]} position={[side * 0.20, -0.15, z]} rotation={[0, 0, side * 0.38]}>
          <M state={state} color="#b8833d" metalness={0.72} roughness={0.28} />
        </Cylinder>
      </group>
    );
  }));

  return (
    <group>
      {/* Cast aluminium intake manifold spans the V valley, with eight individual runners. */}
      <RoundedBox args={[0.44, 0.17, 1.60]} radius={0.055} smoothness={7} position={[0, 0.055, 0]}>
        <M state={state} color="#969fa6" metalness={0.78} roughness={0.34} clearcoat={0.12} />
      </RoundedBox>
      <RoundedBox args={[0.32, 0.045, 1.38]} radius={0.02} smoothness={4} position={[0, 0.145, 0]}>
        <M state={state} color="#aeb7bd" metalness={0.76} roughness={0.34} />
      </RoundedBox>
      {runners}
      {/* Throttle body, bore lip and butterfly plate at the front of the manifold. */}
      <group position={[0, 0.12, -0.83]}>
        <Cylinder args={[0.105, 0.12, 0.16, 40]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#9aa5ad" metalness={0.86} roughness={0.22} />
        </Cylinder>
        <Torus args={[0.103, 0.012, 10, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.085]}>
          <M state={state} color="#d4dade" metalness={0.95} roughness={0.16} />
        </Torus>
        <Cylinder args={[0.072, 0.072, 0.012, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.088]}>
          <M state={state} color="#333e46" metalness={0.35} roughness={0.52} />
        </Cylinder>
        <Box args={[0.012, 0.13, 0.014]} rotation={[0, 0, 0.28]} position={[0, 0, -0.097]}>
          <M state={state} color="#7d8992" metalness={0.82} roughness={0.25} />
        </Box>
      </group>
      {[-0.56, -0.28, 0, 0.28, 0.56].map((z) => (
        <Bolt key={z} state={state} position={[0, 0.15, z]} radius={0.008} length={0.012} />
      ))}
    </group>
  );
}

function V8ValveCoversPart({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group>
      {/* Satin enamel valve covers in deep engine-blue, with restrained machined ribs. */}
      <RoundedBox args={[0.27, 0.12, 1.75]} radius={0.035} smoothness={6}>
        <M state={state} color="#174c78" metalness={0.48} roughness={0.25} clearcoat={0.48} />
      </RoundedBox>
      <RoundedBox args={[0.21, 0.035, 1.57]} radius={0.018} smoothness={4} position={[0, 0.072, 0]}>
        <M state={state} color="#23618f" metalness={0.52} roughness={0.22} clearcoat={0.44} />
      </RoundedBox>
      {[-0.63, -0.42, -0.21, 0, 0.21, 0.42, 0.63].map((z) => (
        <Box key={z} args={[0.20, 0.012, 0.022]} position={[0, 0.094, z]}>
          <M state={state} color="#4f87ad" metalness={0.5} roughness={0.24} clearcoat={0.2} />
        </Box>
      ))}
      {[-0.72, -0.24, 0.24, 0.72].map((z) => (
        <React.Fragment key={z}>
          <Bolt state={state} position={[-0.095, 0.083, z]} radius={0.008} length={0.012} />
          <Bolt state={state} position={[0.095, 0.083, z]} radius={0.008} length={0.012} />
        </React.Fragment>
      ))}
      <RoundedBox args={[0.13, 0.035, 0.24]} radius={0.012} smoothness={3} position={[0, 0.104, -0.48]}>
        <M state={state} color="#c2cbd2" metalness={0.86} roughness={0.2} />
      </RoundedBox>
    </group>
  );
}

function V8ExhaustPart({ state, side }: { state: State; side: -1 | 1 }) {
  const curves = Z.map((z, i) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.16, 0.015, z),
    new THREE.Vector3(side * 0.26, -0.055, z + (i - 1.5) * 0.035),
    new THREE.Vector3(side * 0.36, -0.17, -0.42 + i * 0.28),
    new THREE.Vector3(side * 0.43, -0.22, -0.30 + i * 0.20),
  ]));

  return (
    <group>
      {Z.map((z) => (
        <RoundedBox key={z} args={[0.10, 0.085, 0.12]} radius={0.012} smoothness={3} position={[side * 0.15, 0.015, z]}>
          <M state={state} color="#73716b" metalness={0.72} roughness={0.38} />
        </RoundedBox>
      ))}
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 32, 0.026, 12, false]}>
          <M state={state} color="#7b766e" metalness={0.86} roughness={0.31} clearcoat={0.08} />
        </Tube>
      ))}
      {/* Four primary pipes merge into a collector rather than ending as disconnected tubes. */}
      <Cylinder args={[0.067, 0.073, 0.82, 28]} rotation={[Math.PI / 2, 0, 0]} position={[side * 0.43, -0.22, 0.10]}>
        <M state={state} color="#55585b" metalness={0.84} roughness={0.36} />
      </Cylinder>
      <Torus args={[0.068, 0.009, 8, 32]} rotation={[Math.PI / 2, 0, 0]} position={[side * 0.43, -0.22, -0.315]}>
        <M state={state} color="#b0a18e" metalness={0.82} roughness={0.28} />
      </Torus>
      {[-0.25, 0.25].map((z) => (
        <Bolt key={z} state={state} position={[side * 0.44, -0.22, z]} radius={0.008} length={0.014} />
      ))}
    </group>
  );
}

function V8TimingPart({ state }: { state: State }) {
  const gearRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (gearRef.current) gearRef.current.rotation.z = state.crankAngleRef?.current ?? 0;
  });

  return (
    <group>
      {/* Front timing cover is local to the library's front-face transform. */}
      <RoundedBox args={[0.58, 0.72, 0.075]} radius={0.04} smoothness={6}>
        <M state={state} color="#3a454e" metalness={0.69} roughness={0.38} clearcoat={0.08} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.61, 0.018]} radius={0.03} smoothness={4} position={[0, 0, -0.045]}>
        <M state={state} color="#2b343c" metalness={0.62} roughness={0.43} clearcoat={0.06} />
      </RoundedBox>
      <group ref={gearRef} position={[0, 0, -0.072]}>
        <Torus args={[0.22, 0.028, 12, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#262e34" metalness={0.45} roughness={0.53} />
        </Torus>
        <Cylinder args={[0.18, 0.18, 0.055, 48]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#7c8992" metalness={0.94} roughness={0.19} />
        </Cylinder>
        <Cylinder args={[0.055, 0.055, 0.062, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]}>
          <M state={state} color="#b7c1c8" metalness={0.96} roughness={0.16} />
        </Cylinder>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <Bolt key={i} state={state} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.27, 0]} radius={0.009} length={0.014} />;
        })}
      </group>
      {[-0.26, 0.26].map((x) => [-0.31, 0.31].map((y) => (
        <Bolt key={x + ':' + y} state={state} position={[x, y, 0.04]} radius={0.009} length={0.014} />
      )))}
      <Torus args={[0.12, 0.009, 8, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, -0.085]}>
        <M state={state} color="#1c242a" metalness={0.38} roughness={0.56} />
      </Torus>
    </group>
  );
}

function V8OilPanPart({ state }: { state: State }) {
  return (
    <group>
      {/* Pressed steel sump with stepped lower bowl, flange and drain plug. */}
      <RoundedBox args={[0.78, 0.15, 1.90]} radius={0.045} smoothness={5} position={[0, 0.015, 0]}>
        <M state={state} color="#20272d" metalness={0.48} roughness={0.5} clearcoat={0.04} />
      </RoundedBox>
      <RoundedBox args={[0.49, 0.16, 1.36]} radius={0.05} smoothness={5} position={[0, -0.12, 0.02]}>
        <M state={state} color="#161d22" metalness={0.4} roughness={0.58} clearcoat={0.03} />
      </RoundedBox>
      {[-0.34, 0, 0.34].flatMap((x) => Z.map((z) => (
        <Bolt key={x + ':' + z} state={state} position={[x, 0.10, z]} radius={0.008} length={0.014} />
      )))}
      {[-0.62, -0.22, 0.22, 0.62].map((z) => (
        <Box key={z} args={[0.045, 0.018, 0.20]} position={[0.24, -0.19, z]}>
          <M state={state} color="#3b454c" metalness={0.46} roughness={0.52} />
        </Box>
      ))}
      <Cylinder args={[0.024, 0.024, 0.065, 16]} position={[0.16, -0.21, 0.64]} rotation={[0, 0, Math.PI / 2]}>
        <M state={state} color="#a8b2b9" metalness={0.92} roughness={0.22} />
      </Cylinder>
      <Torus args={[0.029, 0.004, 8, 24]} position={[0.195, -0.21, 0.64]} rotation={[0, Math.PI / 2, 0]}>
        <M state={state} color="#d1d8dc" metalness={0.9} roughness={0.22} />
      </Torus>
    </group>
  );
}

function RotatingPulley({
  state,
  radius,
  position,
  ribCount = 6,
}: {
  state: State;
  radius: number;
  position: [number, number, number];
  ribCount?: number;
}) {
  const pulleyRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (pulleyRef.current) pulleyRef.current.rotation.z = state.crankAngleRef?.current ?? 0;
  });

  return (
    <group ref={pulleyRef} position={position}>
      <Cylinder args={[radius, radius, 0.075, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#59656d" metalness={0.86} roughness={0.25} />
      </Cylinder>
      {Array.from({ length: ribCount }).map((_, i) => (
        <Torus key={i} args={[radius * (0.65 + i * 0.045), 0.0045, 6, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.042]}>
          <M state={state} color="#252d33" metalness={0.36} roughness={0.58} />
        </Torus>
      ))}
      <Cylinder args={[radius * 0.30, radius * 0.30, 0.095, 12]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
        <M state={state} color="#c3cbd1" metalness={0.97} roughness={0.15} />
      </Cylinder>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[0.008, 0.008, 0.012, 8]} position={[Math.cos(angle) * radius * 0.48, Math.sin(angle) * radius * 0.48, -0.044]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#e0e6ea" metalness={0.92} roughness={0.18} />
          </Cylinder>
        );
      })}
    </group>
  );
}

function V8AccessoriesPart({ state }: { state: State }) {
  const beltPoints = [
    [-0.54, 0.19, -0.065], [-0.49, 0.38, -0.065], [-0.27, 0.49, -0.065],
    [0.08, 0.49, -0.065], [0.24, 0.34, -0.065], [0.27, 0.02, -0.065],
    [0.25, -0.36, -0.065], [0.10, -0.51, -0.065], [-0.12, -0.49, -0.065],
    [-0.29, -0.34, -0.065], [-0.49, -0.14, -0.065], [-0.56, 0.02, -0.065],
  ].map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const beltCurve = new THREE.CatmullRomCurve3(beltPoints, true, 'centripetal');

  return (
    <group>
      {/* Alternator, coolant-pump housing, crank damper and a continuous rubber belt. */}
      <group position={[-0.42, 0.20, 0]}>
        <Cylinder args={[0.15, 0.15, 0.22, 40]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#85919a" metalness={0.82} roughness={0.31} />
        </Cylinder>
        <Cylinder args={[0.115, 0.115, 0.23, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.015]}>
          <M state={state} color="#5c6871" metalness={0.84} roughness={0.3} />
        </Cylinder>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <Box key={i} args={[0.018, 0.072, 0.16]} position={[Math.cos(a) * 0.125, Math.sin(a) * 0.125, 0.0]} rotation={[0, 0, a]}>
              <M state={state} color="#3b454d" metalness={0.62} roughness={0.4} />
            </Box>
          );
        })}
      </group>
      <group position={[0, 0.31, 0]}>
        <Cylinder args={[0.17, 0.19, 0.15, 40]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#8d999f" metalness={0.8} roughness={0.32} />
        </Cylinder>
        <Torus args={[0.17, 0.012, 8, 44]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.08]}>
          <M state={state} color="#c4cbd0" metalness={0.9} roughness={0.2} />
        </Torus>
      </group>
      <RotatingPulley state={state} radius={0.145} position={[-0.42, 0.20, -0.14]} ribCount={5} />
      <RotatingPulley state={state} radius={0.185} position={[0, 0.31, -0.12]} ribCount={5} />
      <RotatingPulley state={state} radius={0.245} position={[0, -0.28, -0.10]} ribCount={7} />
      <RotatingPulley state={state} radius={0.082} position={[0.25, 0.04, -0.10]} ribCount={4} />
      <Tube args={[beltCurve, 96, 0.018, 10, true]}>
        <M state={state} color="#171c20" metalness={0.08} roughness={0.83} clearcoat={0.02} />
      </Tube>
      {/* Bracket and tensioner support. */}
      <RoundedBox args={[0.08, 0.48, 0.12]} radius={0.015} smoothness={3} position={[0.26, -0.10, 0.02]}>
        <M state={state} color="#545f67" metalness={0.79} roughness={0.34} />
      </RoundedBox>
      <Bolt state={state} position={[0.26, 0.12, 0.09]} radius={0.009} length={0.014} />
      <Bolt state={state} position={[0.26, -0.31, 0.09]} radius={0.009} length={0.014} />
    </group>
  );
}

function V8PistonBankSide({ state, side }: { state: State; side: -1 | 1 }) {
  return <V8PistonBankPart state={state} side={side} />;
}

function V8Assembly({ state }: { state: State }) {
  return (
    <group rotation={[0.12, -0.46, 0.02]}>
      <V8BlockShell state={state} />
      <V8PistonBankPart state={state} side={-1} />
      <V8PistonBankPart state={state} side={1} />
      <V8CylinderHeadPart state={state} side={-1} />
      <V8CylinderHeadPart state={state} side={1} />
      <V8PushrodAndRocker state={state} side={-1} />
      <V8PushrodAndRocker state={state} side={1} />
      <V8CamshaftPart state={state} />
      <V8IntakePart state={state} />
      <V8ValveCoversPart state={state} side={-1} />
      <V8ValveCoversPart state={state} side={1} />
      <V8ExhaustPart state={state} side={-1} />
      <V8ExhaustPart state={state} side={1} />
      <V8CrankCore state={state} />
      <V8TimingPart state={state} />
      <V8OilPanPart state={state} />
      <V8AccessoriesPart state={state} />
    </group>
  );
}

export function V8Block({ state }: { state: State }) {
  return <V8BlockShell state={state} />;
}

export function V8Crankshaft({ state }: { state: State }) {
  return <V8CrankCore state={state} />;
}

export function V8PistonBank({ state }: { state: State }) {
  return <V8PistonBankSide state={state} side={-1} />;
}

export function V8Head({ state }: { state: State }) {
  return <V8CylinderHeadPart state={state} side={-1} />;
}

export function V8ValveCover({ state }: { state: State }) {
  return <V8ValveCoversPart state={state} side={-1} />;
}

export function V8Camshaft({ state }: { state: State }) {
  return <V8CamshaftPart state={state} />;
}

export function V8IntakeManifold({ state }: { state: State }) {
  return <V8IntakePart state={state} />;
}

export function V8ExhaustManifold({ state }: { state: State }) {
  return <V8ExhaustPart state={state} side={-1} />;
}

export function V8TimingCover({ state }: { state: State }) {
  return <V8TimingPart state={state} />;
}

export function V8OilPan({ state }: { state: State }) {
  return <V8OilPanPart state={state} />;
}

export function V8Accessories({ state }: { state: State }) {
  return <V8AccessoriesPart state={state} />;
}

export function renderV8PrecisionComponent(
  objectId: string,
  componentId: string,
  state: State
): React.ReactNode | null {
  if (objectId !== 'v8_engine') return null;

  // The collapsed component is intentionally still the complete hero assembly.
  // Individual component selections return the same coherent subsystem while the
  // parent transform/metadata controls its isolation and explode behavior.
  switch (componentId) {
    case 'v8_block':
      return <V8Block state={state} />;
    case 'v8_crankshaft':
      return <V8Crankshaft state={state} />;
    case 'v8_pistons_a':
      return <V8PistonBankSide state={state} side={-1} />;
    case 'v8_pistons_b':
      return <V8PistonBankSide state={state} side={1} />;
    case 'v8_head_a':
      return <V8CylinderHeadPart state={state} side={-1} />;
    case 'v8_head_b':
      return <V8CylinderHeadPart state={state} side={1} />;
    case 'v8_valve_cover_a':
      return <V8ValveCoversPart state={state} side={-1} />;
    case 'v8_valve_cover_b':
      return <V8ValveCoversPart state={state} side={1} />;
    case 'v8_camshaft':
      return <V8CamshaftPart state={state} />;
    case 'v8_intake':
      return <V8IntakeManifold state={state} />;
    case 'v8_exhaust_a':
      return <V8ExhaustPart state={state} side={-1} />;
    case 'v8_exhaust_b':
      return <V8ExhaustPart state={state} side={1} />;
    case 'v8_timing_cover':
      return <V8TimingCover state={state} />;
    case 'v8_oil_pan':
      return <V8OilPanPart state={state} />;
    case 'v8_accessories':
      return <V8AccessoriesPart state={state} />;
    default:
      return null;
  }
}
