import React from 'react';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Sphere, Torus, Tube } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

type State = AdvancedEngineeringModelProps;

const BANK = Math.PI / 4;
const Z = [-0.78, -0.26, 0.26, 0.78] as const;

function M({
  state,
  color,
  metalness = 0.82,
  roughness = 0.27,
}: {
  state: State;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.42} />;
  }
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.16 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.24 : 1}
      transmission={state.xrayEnabled ? 0.42 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.22}
      clearcoatRoughness={0.13}
      envMapIntensity={1.65}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.14 : state.isHovered ? 0.045 : 0}
    />
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
  position,
}: {
  state: State;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* crown + skirt */}
      <Cylinder args={[0.152, 0.146, 0.19, 48]}>
        <M state={state} color="#b8c0c7" metalness={0.72} roughness={0.23} />
      </Cylinder>
      <Cylinder args={[0.132, 0.132, 0.045, 48]} position={[0, 0.105, 0]}>
        <M state={state} color="#d7dde2" metalness={0.90} roughness={0.16} />
      </Cylinder>
      {/* two compression rings + oil-control ring */}
      {[0.057, 0.018, -0.021].map((y, i) => (
        <Torus key={i} args={[0.141 - i * 0.002, 0.0065, 10, 40]} position={[0, y, 0]}>
          <M state={state} color="#46515e" metalness={0.93} roughness={0.16} />
        </Torus>
      ))}
      {/* wrist pin */}
      <Cylinder args={[0.030, 0.030, 0.24, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#78848e" metalness={0.96} roughness={0.14} />
      </Cylinder>
    </group>
  );
}

function Rod({
  state,
}: {
  state: State;
}) {
  return (
    <group>
      <RoundedBox args={[0.075, 0.44, 0.060]} radius={0.016} smoothness={4} position={[0, 0.18, 0]}>
        <M state={state} color="#7b8791" metalness={0.93} roughness={0.18} />
      </RoundedBox>
      <Box args={[0.028, 0.30, 0.072]} position={[0, 0.18, 0]}>
        <M state={state} color="#c1c9cf" metalness={0.92} roughness={0.15} />
      </Box>
      <Torus args={[0.054, 0.017, 12, 32]} position={[0, 0.42, 0]}>
        <M state={state} color="#b9c2c9" metalness={0.93} roughness={0.15} />
      </Torus>
      <Torus args={[0.060, 0.020, 12, 32]} position={[0, -0.04, 0]}>
        <M state={state} color="#b9c2c9" metalness={0.93} roughness={0.15} />
      </Torus>
      <Bolt state={state} position={[-0.036, -0.04, 0]} radius={0.009} length={0.012} />
      <Bolt state={state} position={[0.036, -0.04, 0]} radius={0.009} length={0.012} />
    </group>
  );
}

function V8CrankCore({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <Cylinder args={[0.058, 0.058, 2.05, 32]}>
        <M state={state} color="#9ca7b0" metalness={0.98} roughness={0.11} />
      </Cylinder>

      {Z.map((z, i) => {
        const throwAngle = i % 2 === 0 ? 0.28 : Math.PI + 0.28;
        const px = Math.cos(throwAngle) * 0.11;
        const py = Math.sin(throwAngle) * 0.11;
        return (
          <group key={i} position={[0, z, 0]}>
            {/* paired forged webs */}
            {[-0.055, 0.055].map((off) => (
              <group key={off} position={[0, 0, off]}>
                <Cylinder
                  args={[0.205, 0.205, 0.048, 36]}
                  position={[0, 0, 0]}
                  rotation={[Math.PI / 2, 0, throwAngle]}
                >
                  <M state={state} color="#5c6771" metalness={0.96} roughness={0.15} />
                </Cylinder>
              </group>
            ))}
            {/* main journal */}
            <Cylinder args={[0.075, 0.075, 0.11, 32]} rotation={[Math.PI / 2, 0, 0]}>
              <M state={state} color="#cbd2d8" metalness={0.99} roughness={0.10} />
            </Cylinder>
            {/* crank pin */}
            <Cylinder
              args={[0.055, 0.055, 0.11, 28]}
              position={[px, py, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <M state={state} color="#e0e5e9" metalness={0.99} roughness={0.09} />
            </Cylinder>
          </group>
        );
      })}

      {[-0.88, -0.44, 0, 0.44, 0.88].map((z) => (
        <Torus key={z} args={[0.083, 0.014, 10, 32]} position={[0, z, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#64707a" metalness={0.95} roughness={0.14} />
        </Torus>
      ))}
    </group>
  );
}

function V8BlockShell({ state }: { state: State }) {
  return (
    <group>
      {/* deep crankcase — the whole engine is structurally built around it */}
      <RoundedBox args={[0.74, 0.48, 1.90]} radius={0.065} smoothness={7}>
        <M state={state} color="#3f4953" metalness={0.86} roughness={0.29} />
      </RoundedBox>

      {/* two 45-degree bank castings */}
      {[-1, 1].map((sign) => (
        <group key={sign} position={[sign * 0.19, 0.30, 0]} rotation={[0, 0, sign * BANK]}>
          <RoundedBox args={[0.48, 0.34, 1.78]} radius={0.045} smoothness={6}>
            <M state={state} color="#49545e" metalness={0.84} roughness={0.28} />
          </RoundedBox>

          {/* deck surface and head studs */}
          <RoundedBox args={[0.54, 0.07, 1.80]} radius={0.022} smoothness={4} position={[0, 0.20, 0]}>
            <M state={state} color="#66727d" metalness={0.90} roughness={0.21} />
          </RoundedBox>
          {Z.flatMap((z) => ([-0.16, 0.16] as const).map((x) => (
            <Bolt
              key={x + ':' + z}
              state={state}
              position={[x, 0.245, z]}
              radius={0.009}
              length={0.014}
            />
          )))}
        </group>
      ))}

      {/* casting ribs */}
      {[-0.73, -0.36, 0, 0.36, 0.73].map((z) => (
        <React.Fragment key={z}>
          <Box args={[0.055, 0.34, 0.08]} position={[-0.39, -0.02, z]} rotation={[0, 0, -0.35]}>
            <M state={state} color="#58636d" metalness={0.75} roughness={0.33} />
          </Box>
          <Box args={[0.055, 0.34, 0.08]} position={[0.39, -0.02, z]} rotation={[0, 0, 0.35]}>
            <M state={state} color="#58636d" metalness={0.75} roughness={0.33} />
          </Box>
        </React.Fragment>
      ))}

      {/* bellhousing face */}
      <RoundedBox args={[0.62, 0.72, 0.055]} radius={0.035} smoothness={4} position={[0, 0.02, 0.96]}>
        <M state={state} color="#343e48" metalness={0.82} roughness={0.30} />
      </RoundedBox>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <Bolt key={i} state={state} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.25, 0.995]} radius={0.010} length={0.014} />;
      })}
    </group>
  );
}

function V8PistonBank({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group position={[side * 0.25, 0.26, 0]} rotation={[0, 0, side * BANK]}>
      {Z.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {/* bore / liner */}
          <Cylinder args={[0.185, 0.185, 0.60, 48, 1, true]} position={[0, 0.03, 0]}>
            <M state={state} color="#37414a" metalness={0.82} roughness={0.24} />
          </Cylinder>
          <Torus args={[0.186, 0.014, 12, 48]} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#d4dbe0" metalness={0.97} roughness={0.10} />
          </Torus>

          <Piston state={state} position={[0, 0.17, 0]} />
          <Rod state={state} />
        </group>
      ))}
    </group>
  );
}

function V8CylinderHead({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group position={[side * 0.39, 0.66, 0]} rotation={[0, 0, side * BANK]}>
      <RoundedBox args={[0.45, 0.18, 1.78]} radius={0.04} smoothness={6}>
        <M state={state} color="#515d68" metalness={0.88} roughness={0.26} />
      </RoundedBox>

      {Z.map((z, i) => (
        <group key={i} position={[0, 0.10, z]}>
          {/* two valves */}
          <Cylinder args={[0.014, 0.014, 0.14, 12]} position={[-0.085, 0.10, 0]}>
            <M state={state} color="#c7cfd6" metalness={0.98} roughness={0.12} />
          </Cylinder>
          <Cylinder args={[0.014, 0.014, 0.14, 12]} position={[0.085, 0.10, 0]}>
            <M state={state} color="#c7cfd6" metalness={0.98} roughness={0.12} />
          </Cylinder>

          {/* spring retainers */}
          {[-0.085, 0.085].map((x, valve) => (
            <React.Fragment key={valve}>
              <Torus args={[0.043, 0.007, 8, 24]} position={[x, 0.17, 0]}>
                <M state={state} color="#b7c0c7" metalness={0.94} roughness={0.15} />
              </Torus>
              <Torus args={[0.043, 0.007, 8, 24]} position={[x, 0.145, 0]}>
                <M state={state} color="#b7c0c7" metalness={0.94} roughness={0.15} />
              </Torus>
            </React.Fragment>
          ))}

          {/* spark-plug well */}
          <Cylinder args={[0.025, 0.025, 0.14, 18]} position={[0, 0.19, 0]}>
            <M state={state} color="#e0e5e9" metalness={0.98} roughness={0.10} />
          </Cylinder>
        </group>
      ))}

      {[-0.18, 0.18].map((x) => (
        <Bolt key={x} state={state} position={[x, 0.19, 0]} radius={0.010} length={0.014} />
      ))}
    </group>
  );
}

function V8PushrodAndRocker({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group position={[side * 0.39, 0.92, 0]} rotation={[0, 0, side * BANK]}>
      {Z.flatMap((z) =>
        [-0.085, 0.085].map((x, j) => (
          <group key={x + ':' + z}>
            <Cylinder args={[0.010, 0.010, 0.30, 12]} position={[x, 0, z]}>
              <M state={state} color="#c4cbd1" metalness={0.96} roughness={0.14} />
            </Cylinder>
            <RoundedBox args={[0.11, 0.032, 0.05]} radius={0.008} smoothness={3} position={[x, 0.17, z]}>
              <M state={state} color="#6d7882" metalness={0.88} roughness={0.20} />
            </RoundedBox>
          </group>
        ))
      )}
    </group>
  );
}

function V8Camshaft({ state }: { state: State }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.02, 0]}>
      <Cylinder args={[0.038, 0.038, 1.92, 28]}>
        <M state={state} color="#c7cfd6" metalness={0.99} roughness={0.11} />
      </Cylinder>
      {Z.flatMap((z) => [-0.060, 0.060].map((offset, i) => (
        <group key={offset + ':' + z} position={[0, z, 0]}>
          <RoundedBox
            args={[0.085, 0.08, 0.05]}
            radius={0.012}
            smoothness={3}
            position={[0.0, 0.0, offset]}
            rotation={[0, 0, (i ? 0.42 : -0.42)]}
          >
            <M state={state} color="#727e88" metalness={0.93} roughness={0.18} />
          </RoundedBox>
        </group>
      )))}
      <Torus args={[0.067, 0.013, 10, 30]} position={[0, -0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#b38a40" metalness={0.79} roughness={0.22} />
      </Torus>
    </group>
  );
}

function V8Intake({ state }: { state: State }) {
  const runners = Z.flatMap((z, i) => ([-1, 1] as const).map((side) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.98, z),
      new THREE.Vector3(side * 0.15, 0.88, z),
      new THREE.Vector3(side * 0.23, 0.72, z),
    ]);
    return <Tube key={i + ':' + side} args={[curve, 24, 0.027, 10, false]}>
      <M state={state} color="#626e78" metalness={0.68} roughness={0.32} />
    </Tube>;
  }));

  return (
    <group>
      <RoundedBox args={[0.34, 0.28, 1.55]} radius={0.06} smoothness={6} position={[0, 1.04, 0]}>
        <M state={state} color="#49545e" metalness={0.75} roughness={0.30} />
      </RoundedBox>
      {runners}
      <Cylinder args={[0.10, 0.13, 0.14, 32]} position={[0, 1.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#7d8790" metalness={0.90} roughness={0.20} />
      </Cylinder>
      <Torus args={[0.12, 0.012, 10, 40]} position={[0, 1.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#dde3e7" metalness={0.97} roughness={0.10} />
      </Torus>
    </group>
  );
}

function V8ValveCovers({ state, side }: { state: State; side: -1 | 1 }) {
  return (
    <group position={[side * 0.50, 0.95, 0]} rotation={[0, 0, side * BANK]}>
      <RoundedBox args={[0.27, 0.12, 1.75]} radius={0.035} smoothness={6}>
        <M state={state} color="#1f252b" metalness={0.72} roughness={0.30} />
      </RoundedBox>
      {[-0.63, -0.21, 0.21, 0.63].map((z) => (
        <Box key={z} args={[0.29, 0.018, 0.035]} position={[0, 0.072, z]}>
          <M state={state} color="#3d4750" metalness={0.78} roughness={0.26} />
        </Box>
      ))}
      {[-0.72, -0.24, 0.24, 0.72].map((z) => (
        <Bolt key={z} state={state} position={[0, 0.085, z]} radius={0.008} length={0.011} />
      ))}
    </group>
  );
}

function V8Exhaust({ state, side }: { state: State; side: -1 | 1 }) {
  const sign = side;
  const curves = Z.map((z, i) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(sign * 0.46, 0.42, z),
    new THREE.Vector3(sign * 0.63, 0.22, z + (i - 1.5) * 0.025),
    new THREE.Vector3(sign * 0.82, 0.03, -0.46 + i * 0.28),
  ]));

  return (
    <group>
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 28, 0.028, 10, false]}>
          <M state={state} color="#68717a" metalness={0.84} roughness={0.33} />
        </Tube>
      ))}
      <Cylinder args={[0.065, 0.065, 0.72, 22]} rotation={[Math.PI / 2, 0, 0]} position={[sign * 0.84, 0.03, 0]}>
        <M state={state} color="#4d555d" metalness={0.82} roughness={0.37} />
      </Cylinder>
    </group>
  );
}

function V8Timing({ state }: { state: State }) {
  return (
    <group position={[0, 0.10, 1.02]}>
      <RoundedBox args={[0.58, 0.72, 0.075]} radius={0.04} smoothness={5}>
        <M state={state} color="#353f49" metalness={0.84} roughness={0.30} />
      </RoundedBox>
      <Torus args={[0.22, 0.030, 12, 56]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0.055]}>
        <M state={state} color="#1c2228" metalness={0.24} roughness={0.68} />
      </Torus>
      <Cylinder args={[0.18, 0.18, 0.055, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
        <M state={state} color="#68737d" metalness={0.94} roughness={0.17} />
      </Cylinder>
      <BoltLine state={state} points={Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 0.22, Math.sin(a) * 0.27, 0.082] as [number, number, number];
      })} />
    </group>
  );
}

function V8OilPan({ state }: { state: State }) {
  return (
    <group position={[0, -0.47, 0]}>
      <RoundedBox args={[0.78, 0.18, 1.90]} radius={0.055} smoothness={5}>
        <M state={state} color="#22282e" metalness={0.62} roughness={0.42} />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.16, 1.30]} radius={0.045} smoothness={4} position={[0, -0.12, 0]}>
        <M state={state} color="#171c21" metalness={0.52} roughness={0.52} />
      </RoundedBox>
      <BoltLine state={state} points={[-0.34, -0.12, 0.34].flatMap((x) => Z.map((z) => [x, 0.01, z] as [number, number, number]))} />
      <Cylinder args={[0.025, 0.025, 0.06, 12]} position={[0, -0.19, 0.68]}>
        <M state={state} color="#8e989f" metalness={0.90} roughness={0.23} />
      </Cylinder>
    </group>
  );
}

function V8Accessories({ state }: { state: State }) {
  const pulley = (r: number, x: number, y: number) => (
    <group position={[x, y, 1.08]}>
      <Cylinder args={[r, r, 0.07, 56]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#59656f" metalness={0.86} roughness={0.22} />
      </Cylinder>
      <Torus args={[r * 0.80, 0.008, 8, 44]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#1b2025" metalness={0.12} roughness={0.76} />
      </Torus>
      <Cylinder args={[r * 0.30, r * 0.30, 0.09, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#c8cfd5" metalness={0.96} roughness={0.12} />
      </Cylinder>
    </group>
  );

  return (
    <group>
      {pulley(0.18, -0.34, 0.04)}
      {pulley(0.20, 0.34, 0.05)}
      {pulley(0.25, 0.0, -0.28)}
      <RoundedBox args={[0.34, 0.34, 0.28]} radius={0.05} smoothness={5} position={[-0.34, 0.03, 1.04]}>
        <M state={state} color="#55616b" metalness={0.80} roughness={0.30} />
      </RoundedBox>
      <Sphere args={[0.11, 20, 14]} position={[0.0, 0.03, 1.06]}>
        <M state={state} color="#818c95" metalness={0.83} roughness={0.27} />
      </Sphere>
    </group>
  );
}

function V8PistonBankSide({ state, side }: { state: State; side: -1 | 1 }) {
  return <group position={[side * 0.25, 0.26, 0]} rotation={[0, 0, side * BANK]}>
    {Z.map((z, i) => (
      <group key={i} position={[0, 0, z]}>
        <Cylinder args={[0.185, 0.185, 0.60, 48, 1, true]} position={[0, 0.03, 0]}>
          <M state={state} color="#37414a" metalness={0.82} roughness={0.24} />
        </Cylinder>
        <Torus args={[0.186, 0.014, 12, 48]} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#d4dbe0" metalness={0.97} roughness={0.10} />
        </Torus>
        <Piston state={state} position={[0, 0.17, 0]} />
        <Rod state={state} />
      </group>
    ))}
  </group>;
}

function V8Assembly({ state }: { state: State }) {
  return (
    <group rotation={[0.12, -0.46, 0.02]}>
      <V8BlockShell state={state} />
      <V8PistonBank state={state} side={-1} />
      <V8PistonBank state={state} side={1} />
      <V8CylinderHead state={state} side={-1} />
      <V8CylinderHead state={state} side={1} />
      <V8PushrodAndRocker state={state} side={-1} />
      <V8PushrodAndRocker state={state} side={1} />
      <V8Camshaft state={state} />
      <V8Intake state={state} />
      <V8ValveCovers state={state} side={-1} />
      <V8ValveCovers state={state} side={1} />
      <V8Exhaust state={state} side={-1} />
      <V8Exhaust state={state} side={1} />
      <V8CrankCore state={state} />
      <V8Timing state={state} />
      <V8OilPan state={state} />
      <V8Accessories state={state} />
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
  return <V8CylinderHead state={state} side={-1} />;
}

export function V8ValveCover({ state }: { state: State }) {
  return <V8ValveCovers state={state} side={-1} />;
}

export function V8Camshaft({ state }: { state: State }) {
  return <V8Camshaft state={state} />;
}

export function V8IntakeManifold({ state }: { state: State }) {
  return <V8Intake state={state} />;
}

export function V8ExhaustManifold({ state }: { state: State }) {
  return <V8Exhaust state={state} side={-1} />;
}

export function V8TimingCover({ state }: { state: State }) {
  return <V8Timing state={state} />;
}

export function V8OilPan({ state }: { state: State }) {
  return <V8OilPan state={state} />;
}

export function V8Accessories({ state }: { state: State }) {
  return <V8Accessories state={state} />;
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
      return <V8CylinderHead state={state} side={-1} />;
    case 'v8_head_b':
      return <V8CylinderHead state={state} side={1} />;
    case 'v8_valve_cover_a':
      return <V8ValveCovers state={state} side={-1} />;
    case 'v8_valve_cover_b':
      return <V8ValveCovers state={state} side={1} />;
    case 'v8_camshaft':
      return <V8Camshaft state={state} />;
    case 'v8_intake':
      return <V8IntakeManifold state={state} />;
    case 'v8_exhaust_a':
      return <V8Exhaust state={state} side={-1} />;
    case 'v8_exhaust_b':
      return <V8Exhaust state={state} side={1} />;
    case 'v8_timing_cover':
      return <V8TimingCover state={state} />;
    case 'v8_oil_pan':
      return <V8OilPan state={state} />;
    case 'v8_accessories':
      return <V8Accessories state={state} />;
    default:
      return null;
  }
}
