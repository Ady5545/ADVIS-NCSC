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

interface V12UltimateProps {
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
  casting: '#3f4852',
  castingDark: '#262e35',
  steel: '#8f99a2',
  bright: '#d9dfe4',
  chrome: '#edf1f4',
  liner: '#313940',
  black: '#14191e',
  red: '#e31f3f',
  copper: '#bc742e',
  brass: '#c38f36',
  rubber: '#13181d',
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

function BoltCircle({
  state,
  count,
  radius,
  z,
  yScale = 0.72,
  xScale = 1,
  boltRadius = 0.013,
}: {
  state: V12UltimateProps;
  count: number;
  radius: number;
  z: number;
  yScale?: number;
  xScale?: number;
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

function SpringPack({
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
      {Array.from({ length: 8 }).map((_, i) => (
        <Torus
          key={i}
          args={[0.047, 0.0075, 9, 26]}
          position={[0, -i * 0.023, 0]}
        >
          <M state={state} color={focused ? '#def9ff' : '#bfc7ce'} type="FORGED_STEEL" />
        </Torus>
      ))}
      <Cylinder args={[0.012, 0.012, 0.18, 14]} position={[0, -0.095, 0]}>
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
      <Cylinder args={[0.040, 0.040, 3.16, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <M state={state} color="#bcc4ca" type="FORGED_STEEL" />
      </Cylinder>
      {CYLINDER_Z.map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          {[[-0.052, 0.18], [0.052, -0.12]].map(([zz, rot], j) => (
            <RoundedBox
              key={j}
              args={[0.10, 0.085, 0.145]}
              radius={0.017}
              smoothness={4}
              position={[0.025 * Math.cos(offset + i * 0.2), 0.016 * Math.sin(offset + i * 0.18), zz]}
              rotation={[0, offset + i * 0.20 + rot, 0]}
            >
              <M state={state} color="#69747e" type="MACHINED_BILLET" />
            </RoundedBox>
          ))}
          <Torus args={[0.056, 0.009, 8, 30]}>
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
    <group position={[sign * 0.49, 0.97, 0]} rotation={[0, 0, angle]}>
      <RoundedBox args={[0.30, 0.19, 3.22]} radius={0.05} smoothness={7}>
        <M state={state} color={C.black} type="CAST_ALUMINUM" />
      </RoundedBox>

      <RoundedBox
        args={[0.020, 0.18, 3.10]}
        radius={0.004}
        smoothness={2}
        position={[sign * 0.15, 0.02, 0]}
      >
        <M state={state} color={C.red} type="WRINKLE_RED" />
      </RoundedBox>

      {CYLINDER_Z.flatMap((z) => [-0.115, 0.115].map((x) => (
        <HexBolt
          key={x + ':' + z}
          position={[x, 0.105, z]}
          radius={0.009}
          height={0.010}
          state={state}
        />
      )))}

      {CYLINDER_Z.map((z) => (
        <group key={z} position={[sign * 0.015, 0.20, z]}>
          <Cylinder args={[0.028, 0.028, 0.13, 18]}>
            <M state={state} color="#2e3740" type="PLASTIC" />
          </Cylinder>
          <Cylinder args={[0.013, 0.013, 0.07, 16]} position={[0, 0.095, 0]}>
            <M state={state} color="#c8d0d6" type="CHROME" />
          </Cylinder>
        </group>
      ))}
    </group>
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
  const focus = state.focusedCylinder ?? -1;

  return (
    <group position={[sign * 0.37, 0.76, 0]} rotation={[0, 0, angle]}>
      {/* Continuous head casting, segmented by machined joints. */}
      <RoundedBox args={[0.62, 0.20, 3.24]} radius={0.05} smoothness={6}>
        <M state={state} color="#4b5660" type="CAST_ALUMINUM" />
      </RoundedBox>

      {CYLINDER_Z.map((z, i) => {
        const cylinder = side === 'left' ? i + 1 : i + 7;
        const active = cylinder === focus;
        return (
          <group key={i} position={[0, 0.12, z]}>
            <RoundedBox args={[0.50, 0.06, 0.34]} radius={0.018} smoothness={4}>
              <M state={state} color={active ? '#63727e' : '#3b454f'} type="MACHINED_BILLET" />
            </RoundedBox>

            {/* Intake/exhaust valve spring pairings. */}
            {[-0.13, -0.043, 0.043, 0.13].map((x, valveIndex) => (
              <SpringPack
                key={valveIndex}
                state={state}
                focused={active}
                position={[x, 0.14, 0.02]}
              />
            ))}

            <Cylinder args={[0.031, 0.031, 0.14, 18]} position={[0, 0.27, -0.02]}>
              <M state={state} color=C.chrome type="CHROME" />
            </Cylinder>
          </group>
        );
      })}

      <Camshaft state={state} side={side} x={0.20} y={0.39} offset={side === 'left' ? 0.10 : 0.78} />
      <Camshaft state={state} side={side} x={0.025} y={0.39} offset={side === 'left' ? 1.02 : 1.70} />

      {/* Narrow inspection strip between cams. */}
      <RoundedBox args={[0.10, 0.11, 3.16]} radius={0.02} smoothness={4} position={[sign * 0.11, 0.45, 0]}>
        <M state={state} color="#191e23" type="CAST_ALUMINUM" />
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
  const pistonRef = useRef<THREE.Group>(null);
  const rodRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const rpm = state.v12Rpm ?? 600;
    const a = state.crankAngleRef?.current ?? clock.elapsedTime * (rpm / 60) * Math.PI * 2;
    const phase = a * (state.v12Direction === -1 ? -1 : 1) + CRANK_OFFSETS[index] + (side === 'right' ? Math.PI : 0);
    const crankX = Math.sin(phase) * CRANK_RADIUS;
    const crankY = Math.cos(phase) * CRANK_RADIUS;
    const rodLength = 0.62;
    const pistonY = 0.22 + crankY + Math.sqrt(Math.max(0.02, rodLength * rodLength - crankX * crankX));

    if (pistonRef.current) pistonRef.current.position.y = pistonY;
    if (rodRef.current) {
      rodRef.current.position.set(crankX * 0.18, pistonY - rodLength * 0.48, 0);
      rodRef.current.rotation.z = -Math.atan2(crankX, Math.max(0.08, pistonY - crankY)) * 0.68;
    }
  });

  const cylinder = side === 'left' ? index + 1 : index + 7;
  const focused = state.focusedCylinder === cylinder;

  return (
    <group position={[sign * 0.31, 0.28, CYLINDER_Z[index]]} rotation={[0, 0, angle]}>
      <group ref={pistonRef} position={[0, 0.46, 0]}>
        <Cylinder args={[0.172, 0.166, 0.20, 52]}>
          <M state={state} color={focused ? '#eefcff' : '#b7c0c7'} type="MACHINED_BILLET" />
        </Cylinder>
        <Cylinder args={[0.148, 0.148, 0.046, 52]} position={[0, 0.112, 0]}>
          <M state={state} color="#d2d9de" type="MACHINED_BILLET" />
        </Cylinder>
        {[0.066, 0.020, -0.027].map((y, i) => (
          <Torus key={i} args={[0.160 - i * 0.003, 0.0075, 10, 46]} position={[0, y, 0]}>
            <M state={state} color="#4b555e" type="CHROME" />
          </Torus>
        ))}
        <Cylinder args={[0.034, 0.034, 0.24, 24]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#7a848e" type="FORGED_STEEL" />
        </Cylinder>
      </group>

      <group ref={rodRef} position={[0, 0.04, 0]}>
        <RoundedBox args={[0.10, 0.60, 0.085]} radius={0.023} smoothness={4}>
          <M state={state} color={focused ? '#bceeff' : '#7f8b95'} type="FORGED_STEEL" />
        </RoundedBox>
        <Box args={[0.030, 0.43, 0.10]}>
          <M state={state} color="#c1c9cf" type="MACHINED_BILLET" />
        </Box>
        {[-0.29, 0.29].map((y) => (
          <Torus key={y} args={[0.062, 0.020, 12, 34]} position={[0, y, 0]}>
            <M state={state} color="#b6bec5" type="FORGED_STEEL" />
          </Torus>
        ))}
        <HexBolt position={[-0.040, -0.29, 0]} radius={0.010} height={0.011} state={state} />
        <HexBolt position={[0.040, -0.29, 0]} radius={0.010} height={0.011} state={state} />
      </group>
    </group>
  );
}

function BankBlock({
  state,
  side,
}: {
  state: V12UltimateProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  return (
    <group position={[sign * 0.26, 0.28, 0]} rotation={[0, 0, angle]}>
      {/* Heavy lower casting around the bores: this is the piece missing from the current screenshot. */}
      <RoundedBox args={[0.68, 0.35, 3.34]} radius={0.06} smoothness={6}>
        <M state={state} color={C.casting} type="CAST_ALUMINUM" />
      </RoundedBox>

      {/* Bore mouths are recessed into the casting, not floating cylinders. */}
      {CYLINDER_Z.map((z, i) => (
        <group key={i} position={[0, 0.29, z]}>
          <Torus args={[0.195, 0.022, 12, 48]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#bec7ce" type="CHROME" />
          </Torus>
          <Cylinder args={[0.182, 0.182, 0.12, 48]} position={[0, -0.055, 0]}>
            <M state={state} color={C.liner} type="HONED_LINER" />
          </Cylinder>
        </group>
      ))}

      {/* Main casting ribs and deck studs. */}
      {[-1.18, -0.70, -0.22, 0.26, 0.74, 1.22].map((z) => (
        <Box key={z} args={[0.72, 0.055, 0.085]} position={[0, 0.01, z]}>
          <M state={state} color="#55616b" type="CAST_ALUMINUM" />
        </Box>
      ))}
    </group>
  );
}

function IntakeManifold({
  state,
}: {
  state: V12UltimateProps;
}) {
  const runners = useMemo(
    () =>
      CYLINDER_Z.map(
        (z, i) =>
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.05, z),
            new THREE.Vector3(0, 1.28, z + (i - 2.5) * 0.015),
            new THREE.Vector3(0.10, 1.10, z + (i - 2.5) * 0.028),
          ])
      ),
    []
  );

  return (
    <group>
      <RoundedBox args={[0.28, 0.25, 3.00]} radius={0.055} smoothness={5} position={[0, 1.08, 0]}>
        <M state={state} color={C.black} type="CAST_ALUMINUM" />
      </RoundedBox>

      {runners.map((curve, i) => (
        <Tube key={i} args={[curve, 36, 0.026, 10, false]}>
          <M state={state} color="#76828c" type="CAST_ALUMINUM" />
        </Tube>
      ))}

      {/* Twin front throttle bodies / velocity stacks. */}
      {[-0.12, 0.12].map((x) => (
        <group key={x} position={[x, 1.08, 1.48]}>
          <Cylinder args={[0.11, 0.14, 0.18, 40]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color="#6f7b85" type="MACHINED_BILLET" />
          </Cylinder>
          <Torus args={[0.13, 0.014, 10, 40]} rotation={[Math.PI / 2, 0, 0]}>
            <M state={state} color={C.chrome} type="CHROME" />
          </Torus>
        </group>
      ))}
    </group>
  );
}

function ExhaustBank({
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
            new THREE.Vector3(sign * 0.53, 0.28, z),
            new THREE.Vector3(sign * 0.74, 0.16, z + (i - 2.5) * 0.04),
            new THREE.Vector3(sign * 0.96, -0.03, -0.52 + i * 0.11),
            new THREE.Vector3(sign * 1.10, -0.07, -0.28 + i * 0.08),
          ])
      ),
    [sign]
  );

  return (
    <group>
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 30, 0.030, 12, false]}>
          <M state={state} color="#727a82" type="EXHAUST_STEEL" />
        </Tube>
      ))}

      <RoundedBox args={[0.18, 0.16, 0.96]} radius={0.035} smoothness={4} position={[sign * 1.12, -0.08, -0.28]}>
        <M state={state} color="#444c53" type="EXHAUST_STEEL" />
      </RoundedBox>
    </group>
  );
}

function MainBearingStructure({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <group position={[0, -0.26, 0]}>
      {[-1.53, -1.02, -0.51, 0, 0.51, 1.02, 1.53].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <RoundedBox args={[0.66, 0.12, 0.20]} radius={0.028} smoothness={4}>
            <M state={state} color="#3b454e" type="FORGED_STEEL" />
          </RoundedBox>
          <HexBolt position={[-0.21, 0.075, 0]} radius={0.013} height={0.013} state={state} />
          <HexBolt position={[0.21, 0.075, 0]} radius={0.013} height={0.013} state={state} />
        </group>
      ))}
    </group>
  );
}

function TimingDrive({
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
      Array.from({ length: 62 }).map((_, i) => {
        const t = (i / 62) * Math.PI * 2;
        return [0.34 * Math.cos(t), 0.56 * Math.sin(t), t] as [number, number, number];
      }),
    []
  );

  return (
    <group ref={ref} position={[0, 0.58, 1.80]}>
      <Cylinder args={[0.20, 0.20, 0.09, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <M state={state} color="#4f5a64" type="FORGED_STEEL" />
      </Cylinder>
      {[-0.20, 0.20].map((x) => (
        <Cylinder key={x} args={[0.25, 0.25, 0.09, 48]} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.36, 0]}>
          <M state={state} color="#56616b" type="FORGED_STEEL" />
        </Cylinder>
      ))}
      {links.map(([x, y, a], i) => (
        <group key={i} position={[x, y, 0.07]} rotation={[0, 0, a]}>
          <Box args={[0.028, 0.048, 0.014]}>
            <M state={state} color="#747e87" type="FORGED_STEEL" />
          </Box>
          <Cylinder args={[0.007, 0.007, 0.020, 10]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.008]}>
            <M state={state} color="#c7cdd2" type="CHROME" />
          </Cylinder>
        </group>
      ))}
      <RoundedBox args={[0.09, 0.82, 0.045]} radius={0.016} smoothness={3} position={[0, 0.10, -0.04]}>
        <M state={state} color="#2c343c" type="CAST_ALUMINUM" />
      </RoundedBox>
    </group>
  );
}

function CoolingAndAccessories({
  state,
}: {
  state: V12UltimateProps;
}) {
  const fanRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (fanRef.current) fanRef.current.rotation.z = clock.elapsedTime * 1.2;
  });

  return (
    <group position={[0, -0.02, 1.91]}>
      {/* One believable harmonic balancer dominates the crank end, not four black discs. */}
      <group position={[0, -0.18, 0]}>
        <Cylinder args={[0.29, 0.29, 0.12, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#5a646e" type="FORGED_STEEL" />
        </Cylinder>
        <Torus args={[0.245, 0.028, 14, 56]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#242a30" type="RUBBER" />
        </Torus>
        <Cylinder args={[0.11, 0.11, 0.15, 8]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color=C.chrome type="CHROME" />
        </Cylinder>
      </group>

      {/* Water-pump hub + fan. */}
      <Cylinder args={[0.16, 0.16, 0.18, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.28, 0]}>
        <M state={state} color="#67727c" type="CAST_ALUMINUM" />
      </Cylinder>

      <group ref={fanRef} position={[0, 0.28, 0.10]}>
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <RoundedBox
              key={i}
              args={[0.055, 0.25, 0.028]}
              radius={0.014}
              smoothness={4}
              position={[Math.cos(a) * 0.20, Math.sin(a) * 0.20, 0]}
              rotation={[0, 0, a + 0.34]}
            >
              <M state={state} color="#89939c" type="FORGED_STEEL" />
            </RoundedBox>
          );
        })}
      </group>

      {/* Alternator and idler. */}
      <group position={[-0.42, 0.10, 0.05]}>
        <Cylinder args={[0.18, 0.18, 0.12, 48]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#5e6973" type="CAST_ALUMINUM" />
        </Cylinder>
        <Torus args={[0.18, 0.018, 12, 48]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#c1c8ce" type="CHROME" />
        </Torus>
      </group>

      <group position={[0.46, 0.08, 0.05]}>
        <Cylinder args={[0.13, 0.13, 0.10, 48]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#626d76" type="CAST_ALUMINUM" />
        </Cylinder>
      </group>

      {/* Serpentine belt. */}
      <Tube
        args={[
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.50, 0.12, 0.10),
            new THREE.Vector3(-0.58, -0.28, 0.10),
            new THREE.Vector3(0, -0.50, 0.10),
            new THREE.Vector3(0.55, -0.26, 0.10),
            new THREE.Vector3(0.52, 0.16, 0.10),
            new THREE.Vector3(0.18, 0.42, 0.10),
            new THREE.Vector3(-0.18, 0.42, 0.10),
            new THREE.Vector3(-0.50, 0.12, 0.10),
          ], true),
          64,
          0.018,
          8,
          false,
        ]}
      >
        <M state={state} color={C.rubber} type="RUBBER" />
      </Tube>
    </group>
  );
}

function OilPan({
  state,
}: {
  state: V12UltimateProps;
}) {
  return (
    <group>
      <RoundedBox args={[1.12, 0.20, 3.38]} radius={0.05} smoothness={5} position={[0, -0.67, 0]}>
        <M state={state} color={C.castingDark} type="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.66, 0.18, 1.34]} radius={0.05} smoothness={5} position={[0, -0.80, 0]}>
        <M state={state} color="#1f252b" type="CAST_ALUMINUM" />
      </RoundedBox>

      {[-1.48, -0.99, -0.50, 0, 0.50, 0.99, 1.48].flatMap((z) => [-0.52, 0.52].map((x) => (
        <HexBolt key={x + ':' + z} position={[x, -0.54, z]} radius={0.013} height={0.013} state={state} />
      )))}
    </group>
  );
}

export function V12UltimateCutaway(state: V12UltimateProps) {
  return (
    <group rotation={[0.10, -1.10, 0.035]}>
      {/* Deep central crankcase: continuous structure behind the cutaway banks. */}
      <RoundedBox args={[0.92, 0.46, 3.40]} radius={0.08} smoothness={7}>
        <M state={state} color={C.castingDark} type="CAST_ALUMINUM" />
      </RoundedBox>

      <BankBlock state={state} side="left" />
      <BankBlock state={state} side="right" />

      <HeadBank state={state} side="left" />
      <HeadBank state={state} side="right" />

      <ValveCover state={state} side="left" />
      <ValveCover state={state} side="right" />

      <IntakeManifold state={state} />

      <ExhaustBank state={state} side="left" />
      <ExhaustBank state={state} side="right" />

      <Crankshaft state={state} />

      <MainBearingStructure state={state} />

      <TimingDrive state={state} />

      <CoolingAndAccessories state={state} />

      <OilPan state={state} />

      {/* Front timing / crank flange, intentionally compact. */}
      <RoundedBox args={[0.52, 0.54, 0.07]} radius={0.03} smoothness={4} position={[0, 0.0, 1.73]}>
        <M state={state} color="#414b55" type="CAST_ALUMINUM" />
      </RoundedBox>
      <BoltCircle state={state} count={10} radius={0.25} z={1.77} yScale={0.8} boltRadius={0.012} />

      {/* Rear flywheel edge. */}
      <group position={[0, -0.01, -1.78]}>
        <Cylinder args={[0.50, 0.50, 0.10, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#30373e" type="FORGED_STEEL" />
        </Cylinder>
        <Torus args={[0.43, 0.022, 12, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <M state={state} color="#b8c0c7" type="CHROME" />
        </Torus>
      </group>

      {/* Structural mounts. */}
      {[-1, 1].map((sign) => (
        <group key={sign} position={[sign * 0.66, -0.37, 0]}>
          <RoundedBox args={[0.22, 0.17, 0.44]} radius={0.035} smoothness={4}>
            <M state={state} color="#4b5660" type="CAST_ALUMINUM" />
          </RoundedBox>
          <HexBolt position={[0, 0.11, 0]} radius={0.015} height={0.015} state={state} />
        </group>
      ))}
    </group>
  );
}
