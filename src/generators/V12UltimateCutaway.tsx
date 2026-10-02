import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Sphere, Torus, Tube } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  BANK_ANGLE,
  CRANK_OFFSETS,
  CRANK_RADIUS,
  CYLINDER_Z,
  EngineMaterial,
  HexBolt,
} from './MechanicalGenerator';

export interface V12UltimateProps {
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  v12Rpm?: number;
  v12Direction?: number;
  focusedCylinder?: number;
  crankAngleRef?: React.MutableRefObject<number> | null;
  sysTimeRef?: React.MutableRefObject<number> | null;
}

type Side = 'left' | 'right';

const C = {
  block: '#3b454f',
  block2: '#252d35',
  dark: '#171c21',
  steel: '#8f9aa4',
  steel2: '#5c6872',
  bright: '#d6dde2',
  chrome: '#eef2f5',
  liner: '#3e474f',
  red: '#e32040',
  copper: '#bb722d',
  brass: '#c0903b',
  rubber: '#151a1f',
};

function M({
  state,
  color = C.steel,
  type = 'FORGED_STEEL',
}: {
  state: V12UltimateProps;
  color?: string;
  type?: React.ComponentProps<typeof EngineMaterial>['materialType'];
}) {
  return <EngineMaterial {...state} baseColor={color} materialType={type} />;
}

function BoltRing({
  state,
  count,
  radius,
  z,
  xScale = 1,
  yScale = 0.74,
  boltRadius = 0.014,
}: {
  state: V12UltimateProps;
  count: number;
  radius: number;
  z: number;
  xScale?: number;
  yScale?: number;
  boltRadius?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <HexBolt
            key={i}
            position={[Math.cos(a) * radius * xScale, Math.sin(a) * radius * yScale, z]}
            radius={boltRadius}
            height={boltRadius}
            state={state}
          />
        );
      })}
    </>
  );
}

function ValveSpring({
  state,
  position,
  focused,
}: {
  state: V12UltimateProps;
  position: [number, number, number];
  focused: boolean;
}) {
  return (
    <group position={position}>
      {Array.from({ length: 9 }).map((_, i) => (
        <Torus
          key={i}
          args={[0.047, 0.0075, 8, 26]}
          position={[0, -i * 0.022, 0]}
        >
          <M state={state} color={focused ? '#dffaff' : '#bdc6cd'} type="FORGED_STEEL" />
        </Torus>
      ))}
      <Cylinder args={[0.010, 0.010, 0.20, 14]} position={[0, -0.095, 0]}>
        <M state={state} color={C.bright} type="TITANIUM" />
      </Cylinder>
    </group>
  );
}

function Camshaft({
  state,
  side,
  x,
  y,
  offset,
}: {
  state: V12UltimateProps;
  side: Side;
  x: number;
  y: number;
  offset: number;
}) {
  const sign = side === 'left' ? -1 : 1;
  return (
    <group position={[sign * x, y, 0]}>
      <Cylinder args={[0.042, 0.042, 3.18, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#bcc4ca" type="FORGED_STEEL" />
      </Cylinder>
      {CYLINDER_Z.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {[[-0.058, 0.22], [0.058, -0.17]].map(([zz, rot], j) => (
            <RoundedBox
              key={j}
              args={[0.10, 0.085, 0.15]}
              radius={0.018}
              smoothness={4}
              position={[0.028 * Math.cos(offset + i * 0.19), 0.018 * Math.sin(offset + i * 0.22), zz]}
              rotation={[0, offset + i * 0.17 + rot, 0]}
            >
              <M state={state} color="#68747f" type="MACHINED_BILLET" />
            </RoundedBox>
          ))}
          <Torus args={[0.057, 0.009, 8, 30]}>
            <M state={state} color={C.chrome} type="CHROME" />
          </Torus>
        </group>
      ))}
    </group>
  );
}

function ValveCover({
  state,
  side,
}: {
  state: V12UltimateProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;

  return (
    <group position={[sign * 0.49, 1.03, 0]} rotation={[0, 0, angle]}>
      <RoundedBox
        args={[0.34, 0.20, 3.24]}
        radius={0.055}
        smoothness={7}
      >
        <M state={state} color="#1b2127" type="CAST_ALUMINUM" />
      </RoundedBox>

      <RoundedBox
        args={[0.025, 0.18, 3.14]}
        radius={0.006}
        smoothness={3}
        position={[sign * 0.17, 0.02, 0]}
      >
        <M state={state} color={C.red} type="WRINKLE_RED" />
      </RoundedBox>

      {CYLINDER_Z.map((z, i) => (
        <React.Fragment key={i}>
          <Cylinder
            args={[0.025, 0.025, 0.025, 20]}
            position={[0, 0.12, z]}
          >
            <M state={state} color="#aeb7bf" type="CHROME" />
          </Cylinder>
          <Torus args={[0.055, 0.008, 10, 32]} rotation={[Math.PI / 2, 0, 0]} position={[sign * 0.08, 0.12, z]}>
            <M state={state} color="#4d5660" type="FORGED_STEEL" />
          </Torus>
        </React.Fragment>
      ))}

      {/* Individual ignition coil bodies. */}
      {CYLINDER_Z.map((z, i) => (
        <group key={i} position={[sign * 0.03, 0.20, z]}>
          <Cylinder args={[0.032, 0.032, 0.16, 18]}>
            <M state={state} color="#2e3740" type="PLASTIC" />
          </Cylinder>
          <Cylinder args={[0.014, 0.014, 0.07, 16]} position={[0, 0.10, 0]}>
            <M state={state} color="#c7cdd2" type="CHROME" />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

function FlywheelEnd({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <group position={[0, -0.01, -1.80]}>
      <Cylinder
        args={[0.58, 0.58, 0.13, 72]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <M state={state} color="#30373e" type="FORGED_STEEL" />
      </Cylinder>
      <Cylinder
        args={[0.36, 0.36, 0.16, 64]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <M state={state} color="#aab2b9" type="MACHINED_BILLET" />
      </Cylinder>
      {Array.from({ length: 48 }).map((_, i) => {
        const a = (i / 48) * Math.PI * 2;
        return (
          <Box
            key={i}
            args={[0.030, 0.075, 0.060]}
            position={[
              Math.cos(a) * 0.54,
              Math.sin(a) * 0.54,
              0.07,
            ]}
            rotation={[0, -a, 0]}
          >
            <M state={state} color="#7f8992" type="FORGED_STEEL" />
          </Box>
        );
      })}
      <Torus args={[0.49, 0.028, 14, 72]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#c4cbd1" type="CHROME" />
      </Torus>
      <BoltRing state={state} count={10} radius={0.27} z={0.10} xScale={1} yScale={1} boltRadius={0.013} />
    </group>
  );
}

function MainCapBolts({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <>
      {[-1.53, -1.02, -0.51, 0, 0.51, 1.02, 1.53].flatMap((z) =>
        [-0.22, 0.22].map((x) => (
          <HexBolt
            key={x + ':' + z}
            position={[x, -0.20, z]}
            radius={0.013}
            height={0.013}
            state={state}
          />
        ))
      )}
    </>
  );
}

function HeadBank({
  state,
  side,
}: {
  state: V12UltimateProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const focus = state.focusedCylinder ?? 0;

  return (
    <group position={[sign * 0.42, 0.77, 0]} rotation={[0, 0, angle]}>
      {CYLINDER_Z.map((z, i) => {
        const cyl = side === 'left' ? i + 1 : i + 7;
        const selected = focus === cyl;
        return (
          <group key={i} position={[0, 0, z]}>
            <RoundedBox args={[0.62, 0.16, 0.44]} radius={0.04} smoothness={6}>
              <M state={state} color={selected ? '#566673' : '#46525d'} type="CAST_ALUMINUM" />
            </RoundedBox>

            {[-0.15, -0.05, 0.05, 0.15].map((x, valve) => (
              <ValveSpring
                key={valve}
                state={state}
                focused={selected}
                position={[x, 0.15, 0.02]}
              />
            ))}

            <Cylinder args={[0.032, 0.032, 0.16, 18]} position={[0, 0.27, -0.01]}>
              <M state={state} color={C.chrome} type="CHROME" />
            </Cylinder>
            <Cylinder args={[0.052, 0.052, 0.05, 22]} position={[0, 0.355, -0.01]}>
              <M state={state} color={C.dark} type="RUBBER" />
            </Cylinder>

            {[-0.22, 0.22].map((x) => (
              <HexBolt key={x} position={[x, 0.06, 0]} radius={0.011} height={0.012} state={state} />
            ))}
          </group>
        );
      })}

      <Camshaft state={state} side={side} x={0.20} y={0.40} offset={0.12} />
      <Camshaft state={state} side={side} x={0.03} y={0.40} offset={1.02} />

      <RoundedBox args={[0.11, 0.12, 3.20]} radius={0.022} smoothness={4} position={[sign * 0.12, 0.50, 0]}>
        <M state={state} color={C.dark} type="CAST_ALUMINUM" />
      </RoundedBox>
    </group>
  );
}

function PistonRod({
  state,
  side,
  index,
}: {
  state: V12UltimateProps;
  side: Side;
  index: number;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const piston = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const rpm = state.v12Rpm ?? 600;
    const a = state.crankAngleRef?.current ?? clock.elapsedTime * (rpm / 60) * Math.PI * 2;
    const phase = a * (state.v12Direction === -1 ? -1 : 1) + CRANK_OFFSETS[index] + (side === 'right' ? Math.PI : 0);
    const crankX = Math.sin(phase) * CRANK_RADIUS;
    const crankY = Math.cos(phase) * CRANK_RADIUS;
    const L = 0.72;
    const pistonY = 0.28 + crankY + Math.sqrt(Math.max(0.02, L * L - crankX * crankX));

    piston.current?.position.set(0, pistonY, 0);
    if (rod.current) {
      rod.current.position.set(crankX * 0.16, (pistonY + crankY) * 0.42, 0);
      rod.current.rotation.z = -Math.atan2(crankX, Math.max(0.08, pistonY - crankY)) * 0.76;
    }
  });

  const number = side === 'left' ? index + 1 : index + 7;
  const focused = state.focusedCylinder === number;

  return (
    <group position={[sign * 0.40, 0.30, CYLINDER_Z[index]]} rotation={[0, 0, angle]}>
      <group ref={piston} position={[0, 0.55, 0]}>
        <Cylinder args={[0.205, 0.198, 0.23, 56]}>
          <M state={state} color={focused ? '#eefcff' : '#b6c0c7'} type="MACHINED_BILLET" />
        </Cylinder>
        <Cylinder args={[0.18, 0.18, 0.046, 56]} position={[0, 0.13, 0]}>
          <M state={state} color="#d4dbe0" type="MACHINED_BILLET" />
        </Cylinder>
        {[0.075, 0.024, -0.026].map((y, i) => (
          <Torus key={i} args={[0.192 - i * 0.004, 0.008, 10, 48]} position={[0, y, 0]}>
            <M state={state} color="#4b555d" type="CHROME" />
          </Torus>
        ))}
        <Cylinder args={[0.040, 0.040, 0.28, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <M state={state} color="#77828c" type="FORGED_STEEL" />
        </Cylinder>
      </group>

      <group ref={rod} position={[0, 0.05, 0]}>
        <RoundedBox args={[0.13, 0.72, 0.11]} radius={0.025} smoothness={4}>
          <M state={state} color={focused ? '#bfefff' : '#7e8993'} type="FORGED_STEEL" />
        </RoundedBox>
        <Box args={[0.040, 0.54, 0.13]} position={[0, 0, 0]}>
          <M state={state} color="#c2c9cf" type="MACHINED_BILLET" />
        </Box>
        {[-0.35, 0.35].map((y) => (
          <Torus key={y} args={[0.073, 0.022, 12, 36]} position={[0, y, 0]}>
            <M state={state} color="#bec5cb" type="FORGED_STEEL" />
          </Torus>
        ))}
        <HexBolt position={[-0.052, -0.35, 0]} radius={0.012} height={0.013} state={state} />
        <HexBolt position={[0.052, -0.35, 0]} radius={0.012} height={0.013} state={state} />
      </group>
    </group>
  );
}

function Bank({
  state,
  side,
}: {
  state: V12UltimateProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;

  return (
    <group position={[sign * 0.37, 0.28, 0]} rotation={[0, 0, angle]}>
      {/* Machined outer shoulder gives the banks a real cast-engine silhouette. */}
      <RoundedBox
        args={[0.10, 0.34, 3.28]}
        radius={0.03}
        smoothness={4}
        position={[0.40, 0.23, 0]}
      >
        <M state={state} color="#3d4852" type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox
        args={[0.10, 0.34, 3.28]}
        radius={0.03}
        smoothness={4}
        position={[-0.40, 0.23, 0]}
      >
        <M state={state} color="#3d4852" type="CAST_ALUMINUM" />
      </RoundedBox>

            {/* Rails instead of a solid side wall. */}
      <RoundedBox args={[0.84, 0.10, 3.30]} radius={0.035} smoothness={5} position={[0, 0.50, 0]}>
        <M state={state} color={C.block} type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.10, 0.45, 3.30]} radius={0.03} smoothness={4} position={[-0.33, 0.25, 0]}>
        <M state={state} color="#46515b" type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.10, 0.45, 3.30]} radius={0.03} smoothness={4} position={[0.33, 0.25, 0]}>
        <M state={state} color="#46515b" type="CAST_ALUMINUM" />
      </RoundedBox>

      {CYLINDER_Z.map((z, i) => (
        <group key={i}>
          <Cylinder args={[0.225, 0.225, 0.72, 56, 1, true]} position={[0, 0.18, z]}>
            <M state={state} color={C.liner} type="HONED_LINER" />
          </Cylinder>
          <Torus args={[0.225, 0.017, 12, 52]} position={[0, 0.545, z]}>
            <M state={state} color={C.chrome} type="CHROME" />
          </Torus>
          <PistonRod state={state} side={side} index={i} />

          {/* Injector + retaining hardware. */}
          <Cylinder args={[0.018, 0.022, 0.18, 18]} position={[sign * 0.16, 0.74, z]}>
            <M state={state} color={C.brass} type="BRASS" />
          </Cylinder>
          <Sphere args={[0.023, 14, 10]} position={[sign * 0.16, 0.64, z]}>
            <M state={state} color={C.copper} type="COPPER" />
          </Sphere>
        </group>
      ))}

      {/* Fuel rail. */}
      <Cylinder args={[0.022, 0.022, 3.16, 18]} rotation={[Math.PI / 2, 0, 0]} position={[sign * 0.13, 0.88, 0]}>
        <M state={state} color="#bcc4ca" type="CHROME" />
      </Cylinder>
      {CYLINDER_Z.map((z, i) => (
        <Cylinder key={i} args={[0.013, 0.013, 0.08, 14]} position={[sign * 0.13, 0.80, z]}>
          <M state={state} color={C.brass} type="BRASS" />
        </Cylinder>
      ))}

      {/* Section edge, deliberately thin. */}
      <RoundedBox args={[0.020, 0.52, 3.32]} radius={0.004} smoothness={2} position={[sign * 0.39, 0.27, 0]}>
        <M state={state} color={C.red} type="WRINKLE_RED" />
      </RoundedBox>
    </group>
  );
}

function Intake({
  state,
}: {
  state: V12UltimateProps;
}) {
  const curves = useMemo(
    () =>
      CYLINDER_Z.map(
        (z, i) =>
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.20, z),
            new THREE.Vector3(0, 1.42, z),
            new THREE.Vector3(0.08, 1.24, z + (i - 2.5) * 0.02),
          ])
      ),
    []
  );

  return (
    <group>
      <RoundedBox args={[0.26, 0.24, 3.02]} radius={0.05} smoothness={5} position={[0, 1.18, 0]}>
        <M state={state} color={C.dark} type="CAST_ALUMINUM" />
      </RoundedBox>
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 32, 0.028, 10, false]}>
          <M state={state} color="#7e8992" type="CAST_ALUMINUM" />
        </Tube>
      ))}
      {CYLINDER_Z.map((z, i) => (
        <Torus key={i} args={[0.102, 0.012, 10, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.33, z]}>
          <M state={state} color="#b9c1c7" type="MACHINED_BILLET" />
        </Torus>
      ))}
    </group>
  );
}

function Exhaust({
  state,
  side,
}: {
  state: V12UltimateProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const curves = useMemo(
    () =>
      CYLINDER_Z.map(
        (z, i) =>
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(sign * 0.55, 0.30, z),
            new THREE.Vector3(sign * 0.74, 0.13, z + (i - 2.5) * 0.035),
            new THREE.Vector3(sign * 0.96, -0.05, -0.58 + i * 0.11),
            new THREE.Vector3(sign * 1.06, -0.08, -0.28 + i * 0.09),
          ])
      ),
    [sign]
  );
  return (
    <group>
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 30, 0.032, 12, false]}>
          <M state={state} color="#7a828a" type="EXHAUST_STEEL" />
        </Tube>
      ))}
      <RoundedBox args={[0.17, 0.17, 1.06]} radius={0.035} smoothness={4} position={[sign * 1.07, -0.09, -0.30]}>
        <M state={state} color="#444b52" type="EXHAUST_STEEL" />
      </RoundedBox>
    </group>
  );
}

function Crankshaft({
  state,
}: {
  state: V12UltimateProps;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const rpm = state.v12Rpm ?? 600;
    const angle = state.crankAngleRef?.current ?? clock.elapsedTime * (rpm / 60) * Math.PI * 2;
    if (ref.current) ref.current.rotation.z = angle * (state.v12Direction === -1 ? -1 : 1);
  });

  return (
    <group ref={ref}>
      <Cylinder args={[0.076, 0.076, 3.55, 36]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#9ca7af" type="FORGED_STEEL" />
      </Cylinder>

      {[-1.53, -1.02, -0.51, 0, 0.51, 1.02, 1.53].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <Cylinder args={[0.125, 0.125, 0.11, 36]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#cad1d6" type="MACHINED_BILLET" />
          </Cylinder>
          <Torus args={[0.125, 0.020, 10, 40]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#5b6670" type="FORGED_STEEL" />
          </Torus>
        </group>
      ))}

      {CYLINDER_Z.map((z, i) => {
        const phase = CRANK_OFFSETS[i];
        const x = Math.sin(phase) * 0.20;
        const y = Math.cos(phase) * 0.20;
        return (
          <group key={i} position={[0, 0, z]}>
            {[-0.095, 0.095].map((offset) => (
              <Cylinder
                key={offset}
                args={[0.29, 0.29, 0.064, 40]}
                position={[x * 0.44, y * 0.44, offset]}
                rotation={[Math.PI / 2, 0, phase]}
              >
                <M state={state} color="#58636d" type="FORGED_STEEL" />
              </Cylinder>
            ))}
            <Cylinder args={[0.072, 0.072, 0.22, 30]} rotation={[Math.PI / 2, 0, 0]} position={[x, y, 0]}>
              <M state={state} color="#d6dce1" type="CHROME" />
            </Cylinder>
          </group>
        );
      })}
    </group>
  );
}

function MainBearings({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <group position={[0, -0.32, 0]}>
      {[-1.53, -1.02, -0.51, 0, 0.51, 1.02, 1.53].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <RoundedBox args={[0.72, 0.14, 0.22]} radius={0.028} smoothness={4}>
            <M state={state} color="#3c4650" type="FORGED_STEEL" />
          </RoundedBox>
          <HexBolt position={[-0.24, 0.08, z]} radius={0.015} height={0.014} state={state} />
          <HexBolt position={[0.24, 0.08, z]} radius={0.015} height={0.014} state={state} />
        </group>
      ))}
    </group>
  );
}

function Timing({
  state,
}: {
  state: V12UltimateProps;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * 0.14;
  });

  const links = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => {
        const t = (i / 70) * Math.PI * 2;
        return [0.40 * Math.cos(t), 0.68 * Math.sin(t), t] as [number, number, number];
      }),
    []
  );

  return (
    <group ref={ref} position={[0, 0.61, 1.82]}>
      {[[-0.22, 0.42, 0.28], [0.22, 0.42, 0.28], [0, -0.22, 0.23]].map(([x, y, r], i) => (
        <Cylinder key={i} args={[r, r, 0.09, 48]} rotation={[Math.PI / 2, 0, 0]} position={[x, y, 0]}>
          <M state={state} color="#4e5963" type="FORGED_STEEL" />
        </Cylinder>
      ))}
      {links.map(([x, y, a], i) => (
        <group key={i} position={[x, y, 0.06]} rotation={[0, 0, a]}>
          <Box args={[0.030, 0.050, 0.014]}>
            <M state={state} color="#78828a" type="FORGED_STEEL" />
          </Box>
          <Cylinder args={[0.008, 0.008, 0.022, 10]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#c7cdd2" type="CHROME" />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

function Accessories({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <group position={[0, -0.02, 1.89]}>
      <RingedPulley state={state} radius={0.22} position={[-0.46, 0.04, 0]} />
      <RingedPulley state={state} radius={0.22} position={[0.46, 0.04, 0]} />
      <RingedPulley state={state} radius={0.29} position={[0, -0.39, 0]} />
      <RingedPulley state={state} radius={0.18} position={[0, 0.43, 0]} />
      <RoundedBox args={[0.56, 0.46, 0.20]} radius={0.05} smoothness={5} position={[0, 0.04, -0.05]}>
        <M state={state} color="#505b65" type="CAST_ALUMINUM" />
      </RoundedBox>
    </group>
  );
}

function RingedPulley({
  state,
  position,
  radius,
}: {
  state: V12UltimateProps;
  position: [number, number, number];
  radius: number;
}) {
  return (
    <group position={position}>
      <Cylinder args={[radius, radius, 0.10, 56]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#616d77" type="FORGED_STEEL" />
      </Cylinder>
      {Array.from({ length: 6 }).map((_, i) => (
        <Torus key={i} args={[radius * (0.76 + i * 0.04), 0.0055, 8, 44]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color={C.rubber} type="RUBBER" />
        </Torus>
      ))}
      <Cylinder args={[radius * 0.30, radius * 0.30, 0.14, 6]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color={C.chrome} type="CHROME" />
      </Cylinder>
    </group>
  );
}

function OilPan({
  state,
}: {
  state: V12UltimateProps;
}) {
  const bolts = useMemo(
    () =>
      [-1.48, -0.99, -0.50, 0, 0.50, 0.99, 1.48].flatMap((z) => [
        [-0.53, -0.52, z] as [number, number, number],
        [0.53, -0.52, z] as [number, number, number],
      ]),
    []
  );

  return (
    <group>
      <RoundedBox args={[1.10, 0.18, 3.36]} radius={0.055} smoothness={5} position={[0, -0.66, 0]}>
        <M state={state} color={C.block2} type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.16, 1.30]} radius={0.05} smoothness={5} position={[0, -0.79, 0]}>
        <M state={state} color="#20262c" type="CAST_ALUMINUM" />
      </RoundedBox>
      <Fasteners state={state} points={bolts} />
    </group>
  );
}

function Fasteners({
  state,
  points,
}: {
  state: V12UltimateProps;
  points: Array<[number, number, number]>;
}) {
  return (
    <>
      {points.map((p, i) => (
        <HexBolt key={i} position={p} radius={0.014} height={0.014} state={state} />
      ))}
    </>
  );
}

export function V12UltimateCutaway(state: V12UltimateProps) {
  return (
    <group rotation={[0.13, -1.02, 0.04]}>
      {/* Open crankcase framing: keep the viewing side clear. */}
      <RoundedBox args={[1.16, 0.12, 3.42]} radius={0.04} smoothness={5} position={[0, -0.24, 0]}>
        <M state={state} color={C.block} type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.11, 0.58, 3.42]} radius={0.035} smoothness={4} position={[-0.54, 0.03, 0]}>
        <M state={state} color="#343e48" type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.11, 0.58, 3.42]} radius={0.035} smoothness={4} position={[0.54, 0.03, 0]}>
        <M state={state} color="#343e48" type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.020, 0.64, 3.44]} radius={0.005} smoothness={2} position={[-0.60, 0.03, 0]}>
        <M state={state} color={C.red} type="WRINKLE_RED" />
      </RoundedBox>
      <RoundedBox args={[0.020, 0.64, 3.44]} radius={0.005} smoothness={2} position={[0.60, 0.03, 0]}>
        <M state={state} color={C.red} type="WRINKLE_RED" />
      </RoundedBox>

      <Bank state={state} side="left" />
      <Bank state={state} side="right" />
      <HeadBank state={state} side="left" />
      <HeadBank state={state} side="right" />

      <Intake state={state} />
      <Exhaust state={state} side="left" />
      <Exhaust state={state} side="right" />

      <Crankshaft state={state} />
      <MainBearings state={state} />
      <Timing state={state} />
      <Accessories state={state} />
      <OilPan state={state} />

      {/* Compact machined front flange: details without blocking the crankshaft. */}
      <RoundedBox args={[0.46, 0.54, 0.050]} radius={0.03} smoothness={4} position={[0, 0.02, 1.72]}>
        <M state={state} color="#46515f" type="CAST_ALUMINUM" />
      </RoundedBox>
      <BoltRing state={state} count={10} radius={0.23} z={1.75} xScale={1} yScale={0.82} boltRadius={0.012} />

      <ValveCover state={state} side="left" />
      <ValveCover state={state} side="right" />
      <FlywheelEnd state={state} />
      <MainCapBolts state={state} />

      {/* Small casting ribs. */}
      {[-1.18, -0.70, -0.22, 0.26, 0.74, 1.22].map((z) => (
        <React.Fragment key={z}>
          <Box args={[0.045, 0.36, 0.085]} position={[-0.62, -0.01, z]} rotation={[0, 0, -0.35]}>
            <M state={state} color="#55616b" type="CAST_ALUMINUM" />
          </Box>
          <Box args={[0.045, 0.36, 0.085]} position={[0.62, -0.01, z]} rotation={[0, 0, 0.35]}>
            <M state={state} color="#55616b" type="CAST_ALUMINUM" />
          </Box>
        </React.Fragment>
      ))}
    </group>
  );
}
