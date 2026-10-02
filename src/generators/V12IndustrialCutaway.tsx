import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Box, Cylinder, RoundedBox, Torus, Tube } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CYLINDER_Z, BANK_ANGLE, CRANK_RADIUS, CRANK_OFFSETS, EngineMaterial, HexBolt } from './MechanicalGenerator';

interface V12IndustrialCutawayProps {
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

function Steel({
  color = '#8f99a4',
  state,
  materialType = 'FORGED_STEEL',
}: {
  color?: string;
  state: V12IndustrialCutawayProps;
  materialType?: React.ComponentProps<typeof EngineMaterial>['materialType'];
}) {
  return <EngineMaterial {...state} materialType={materialType} baseColor={color} />;
}

function FastenerField({
  state,
  x,
  y,
  zStart,
  count,
  spacing,
  radius = 0.018,
}: {
  state: V12IndustrialCutawayProps;
  x: number;
  y: number;
  zStart: number;
  count: number;
  spacing: number;
  radius?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <HexBolt
          key={i}
          position={[x, y, zStart + i * spacing]}
          radius={radius}
          height={radius * 0.95}
          state={state}
        />
      ))}
    </>
  );
}

function SpringPack({ state, position, focused = false }: { state: V12IndustrialCutawayProps; position: [number, number, number]; focused?: boolean }) {
  return (
    <group position={position}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Torus key={i} args={[0.064, 0.010, 10, 28]} position={[0, -i * 0.027, 0]}>
          <Steel state={state} color={focused ? '#d9f8ff' : '#c8ced5'} materialType="FORGED_STEEL" />
        </Torus>
      ))}
    </group>
  );
}

function ValveTrainBank({
  state,
  side,
}: {
  state: V12IndustrialCutawayProps;
  side: Side;
}) {
  const sign = side === 'left' ? -1 : 1;
  const angle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const focusedCylinder = state.focusedCylinder ?? 0;

  return (
    <group position={[sign * 0.46, 0.93, 0]} rotation={[0, 0, angle]}>
      {/* Split cylinder-head castings: no single giant top cover. */}
      {CYLINDER_Z.map((z, i) => {
        const cylinderNumber = side === 'left' ? i + 1 : i + 7;
        const focused = focusedCylinder === cylinderNumber;

        return (
          <group key={i} position={[0, 0, z]}>
            <RoundedBox
              args={[0.62, 0.14, 0.40]}
              radius={0.045}
              smoothness={6}
            >
              <Steel
                state={state}
                color={focused ? '#586673' : '#4a555f'}
                materialType="CAST_ALUMINUM"
              />
            </RoundedBox>

            {/* Four visible valve springs. */}
            {[-0.145, -0.048, 0.048, 0.145].map((x, valveIndex) => (
              <ValveSpring
                key={valveIndex}
                state={state}
                focused={focused}
                position={[x, 0.16, 0]}
              />
            ))}

            {/* Plug well / coil body. */}
            <Cylinder args={[0.038, 0.038, 0.15, 18]} position={[0, 0.25, 0.04]}>
              <Steel state={state} color="#cdd4da" materialType="CHROME" />
            </Cylinder>

            {[-0.24, 0.24].map((x) => (
              <HexBolt
                key={x}
                position={[x, 0.085, 0.13]}
                radius={0.012}
                height={0.013}
                state={state}
              />
            ))}
          </group>
        );
      })}

      {/* Exposed DOHC hardware. */}
      <Camshaft
        state={state}
        side={side}
        lateral={0.18}
        y={0.36}
        camOffset={side === 'left' ? 0.10 : 0.74}
      />
      <Camshaft
        state={state}
        side={side}
        lateral={0.02}
        y={0.36}
        camOffset={side === 'left' ? 1.05 : 1.68}
      />
    </group>
  );
}

function PistonAndRod({
  state,
  side,
  index,
  crankAngle,
}: {
  state: V12IndustrialCutawayProps;
  side: Side;
  index: number;
  crankAngle: number;
}) {
  const s = side === 'left' ? -1 : 1;
  const bankAngle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const cylinderNumber = side === 'left' ? index + 1 : index + 7;
  const focused = state.focusedCylinder === cylinderNumber;
  const phaseOffset = CRANK_OFFSETS[index] + (side === 'right' ? Math.PI : 0);
  const phase = crankAngle + phaseOffset;
  const assemblyRef = useRef<THREE.Group>(null);

  useFrame((frameState) => {
    if (!assemblyRef.current) return;
    const angle = state.crankAngleRef?.current ?? (frameState.clock.elapsedTime * ((state.v12Rpm ?? 600) / 60) * Math.PI * 2);
    const phase = angle + phaseOffset;
    const stroke = 0.31 * Math.cos(phase);
    const pistonY = 0.27 + stroke;
    const crankX = Math.sin(phase) * CRANK_RADIUS;
    const crankY = Math.cos(phase) * CRANK_RADIUS;
    const rodAngle = Math.atan2(crankX, Math.max(0.05, pistonY - crankY));
    const pistonGroup = assemblyRef.current.children[0] as THREE.Group | undefined;
    const rodGroup = assemblyRef.current.children[1] as THREE.Group | undefined;
    if (pistonGroup) pistonGroup.position.set(0, pistonY, 0);
    if (rodGroup) {
      rodGroup.rotation.z = -rodAngle * 0.36;
      rodGroup.position.set(crankX * 0.18, (pistonY + crankY) * 0.42, 0);
    }
  });

  return (
    <group ref={assemblyRef} position={[s * 0.37, 0.43, CYLINDER_Z[index]]} rotation={[0, 0, bankAngle]}>
      <group position={[0, 0.27, 0]}>
        <Cylinder args={[0.215, 0.208, 0.23, 40]}>
          <Steel state={state} color={focused ? '#e6f8ff' : '#b8c0c8'} materialType="MACHINED_BILLET" />
        </Cylinder>
        <Cylinder args={[0.18, 0.18, 0.055, 40]} position={[0, 0.125, 0]}>
          <Steel state={state} color="#d9dee4" materialType="MACHINED_BILLET" />
        </Cylinder>
        {[0.03, 0.085, -0.03].map((ringY, i) => (
          <Torus key={i} args={[0.193 - i * 0.004, 0.010, 10, 40]} position={[0, ringY, 0]}>
            <Steel state={state} color="#4d555d" materialType="CHROME" />
          </Torus>
        ))}
        <Cylinder args={[0.045, 0.045, 0.28, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <Steel state={state} color="#76808a" materialType="FORGED_STEEL" />
        </Cylinder>
      </group>

      <group position={[0, 0.02, 0]}>
        <RoundedBox args={[0.12, 0.68, 0.12]} radius={0.028} smoothness={4} rotation={[0, 0, 0.16 * Math.sin(phase)]}>
          <Steel state={state} color={focused ? '#b9f0ff' : '#8b949d'} materialType="TITANIUM" />
        </RoundedBox>
        <Torus args={[0.075, 0.025, 14, 36]} position={[0, 0.34, 0]}>
          <Steel state={state} color="#c6cdd4" materialType="FORGED_STEEL" />
        </Torus>
        <Torus args={[0.080, 0.026, 14, 36]} position={[0, -0.34, 0]}>
          <Steel state={state} color="#c6cdd4" materialType="FORGED_STEEL" />
        </Torus>
        {[-0.055, 0.055].map((x) => (
          <HexBolt key={x} position={[x, 0.34, 0]} radius={0.013} height={0.014} state={state} />
        ))}
      </group>
    </group>
  );
}

function CylinderBank({
  state,
  side,
  crankAngle,
}: {
  state: V12IndustrialCutawayProps;
  side: Side;
  crankAngle: number;
}) {
  const s = side === 'left' ? -1 : 1;
  const bankAngle = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;

  return (
    <group position={[s * 0.22, 0.28, 0]} rotation={[0, 0, bankAngle]}>
      {/* Open cutaway bank shell: deck + outer rails leave the cylinders and valvetrain visibly exposed. */}
      <RoundedBox args={[0.82, 0.10, 3.22]} radius={0.035} smoothness={4} position={[0, 0.48, 0]}>
        <Steel state={state} color="#555f69" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.10, 0.36, 3.22]} radius={0.035} smoothness={4} position={[-0.31, 0.24, 0]}>
        <Steel state={state} color="#49545f" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.10, 0.36, 3.22]} radius={0.035} smoothness={4} position={[0.31, 0.24, 0]}>
        <Steel state={state} color="#49545f" materialType="CAST_ALUMINUM" />
      </RoundedBox>

      {CYLINDER_Z.map((z, i) => (
        <group key={i}>
          <Cylinder args={[0.225, 0.225, 0.72, 48, 1, true]} position={[0, 0.20, z]}>
            <Steel state={state} color="#424b54" materialType="HONED_LINER" />
          </Cylinder>
          <Torus args={[0.225, 0.018, 12, 48]} position={[0, 0.565, z]}>
            <Steel state={state} color="#d8dee5" materialType="CHROME" />
          </Torus>
          <PistonAndRod state={state} side={side} index={i} crankAngle={crankAngle} />
          <group position={[s * 0.24, 0.68, z]}>
            <Cylinder args={[0.040, 0.040, 0.26, 20]}>
              <Steel state={state} color="#bcc4cb" materialType="TITANIUM" />
            </Cylinder>
            <Torus args={[0.047, 0.010, 10, 30]} rotation={[Math.PI / 2, 0, 0]}>
              <Steel state={state} color="#d9e0e6" materialType="CHROME" />
            </Torus>
          </group>
        </group>
      ))}
    </group>
  );
}

function CrankAssembly({ state }: { state: V12IndustrialCutawayProps }) {
  const crank = useRef<THREE.Group>(null);
  const rpm = typeof state.v12Rpm === 'number' ? state.v12Rpm : 600;
  const direction = typeof state.v12Direction === 'number' ? state.v12Direction : 1;

  useFrame((frameState) => {
    const angle = state.crankAngleRef?.current ?? (frameState.clock.elapsedTime * rpm / 60 * Math.PI * 2);
    if (crank.current) crank.current.rotation.z = angle * direction;
  });

  return (
    <group ref={crank}>
      <Cylinder args={[0.075, 0.075, 3.45, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <Steel state={state} color="#aeb7c0" materialType="FORGED_STEEL" />
      </Cylinder>

      {CYLINDER_Z.map((z, i) => {
        const theta = CRANK_OFFSETS[i];
        const x = Math.sin(theta) * CRANK_RADIUS;
        const y = Math.cos(theta) * CRANK_RADIUS;
        return (
          <group key={i} position={[0, 0, z]}>
            <Cylinder args={[0.10, 0.10, 0.18, 36]} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <Steel state={state} color="#d0d6dc" materialType="MACHINED_BILLET" />
            </Cylinder>
            {[-0.10, 0.10].map((zOff) => (
              <RoundedBox key={zOff} args={[0.42, 0.30, 0.08]} radius={0.026} smoothness={3} position={[x * -0.55, y * -0.55, zOff]} rotation={[0, 0, theta + Math.PI]}>
                <Steel state={state} color="#59636d" materialType="FORGED_STEEL" />
              </RoundedBox>
            ))}
            <Torus args={[0.105, 0.020, 12, 36]} rotation={[Math.PI / 2, 0, 0]}>
              <Steel state={state} color="#c6cdd4" materialType="FORGED_STEEL" />
            </Torus>
          </group>
        );
      })}

      {[-1.50, -1.0, -0.50, 0, 0.50, 1.0, 1.50].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <Torus args={[0.125, 0.032, 14, 44]} rotation={[Math.PI / 2, 0, 0]}>
            <Steel state={state} color="#d4dae0" materialType="FORGED_STEEL" />
          </Torus>
        </group>
      ))}
    </group>
  );
}

function TimingDrive({ state }: { state: V12IndustrialCutawayProps }) {
  const chainRef = useRef<THREE.Group>(null);

  const links = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    const total = 64;
    for (let i = 0; i < total; i++) {
      const t = (i / total) * Math.PI * 2;
      const x = 0.42 * Math.cos(t);
      const y = 0.72 * Math.sin(t);
      points.push([x, y, t]);
    }
    return points;
  }, []);

  useFrame(({ clock }) => {
    if (chainRef.current) {
      chainRef.current.rotation.z = clock.elapsedTime * 0.16;
    }
  });

  return (
    <group position={[0, 0.62, 1.82]} ref={chainRef}>
      {/* Three visible sprockets: crank + two cam drives. */}
      <Cylinder args={[0.23, 0.23, 0.09, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
        <Steel state={state} color="#4b5660" materialType="FORGED_STEEL" />
      </Cylinder>

      {[-0.22, 0.22].map((x) => (
        <Cylinder key={x} args={[0.28, 0.28, 0.09, 48]} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.42, 0]}>
          <Steel state={state} color="#56616c" materialType="FORGED_STEEL" />
        </Cylinder>
      ))}

      {links.map(([x, y, rotation], i) => (
        <group key={i} position={[x, y, 0.06]} rotation={[0, 0, rotation]}>
          <Box args={[0.030, 0.052, 0.016]}>
            <Steel state={state} color="#7b858e" materialType="FORGED_STEEL" />
          </Box>
        </group>
      ))}

      {/* Thin timing-rail braces instead of a solid cover. */}
      <RoundedBox args={[0.78, 0.06, 0.05]} radius={0.018} smoothness={3} position={[0, 0.10, -0.05]}>
        <Steel state={state} color="#303842" materialType="CAST_ALUMINUM" />
      </RoundedBox>

      {[-0.34, 0.34].map((x) => (
        <HexBolt
          key={x}
          position={[x, -0.02, 0.08]}
          radius={0.014}
          height={0.014}
          state={state}
        />
      ))}
    </group>
  );
}

function FrontAccessories({ state }: { state: V12IndustrialCutawayProps }) {
  const pulleys = [
    { x: -0.48, y: 0.10, r: 0.22 },
    { x: 0.48, y: 0.10, r: 0.22 },
    { x: 0, y: 0.46, r: 0.24 },
    { x: 0, y: -0.44, r: 0.30 },
  ];

  return (
    <group position={[0, 0, 1.86]}>
      {pulleys.map((p, i) => (
        <group key={i} position={[p.x, p.y, 0]}>
          <Cylinder args={[p.r, p.r, 0.11, 48]} rotation={[Math.PI / 2, 0, 0]}>
            <Steel state={state} color="#66717b" materialType="FORGED_STEEL" />
          </Cylinder>
          {Array.from({ length: 6 }).map((_, g) => (
            <Torus key={g} args={[p.r * (0.78 + g * 0.035), 0.008, 8, 48]} rotation={[Math.PI / 2, 0, 0]}>
              <Steel state={state} color="#313944" materialType="RUBBER" />
            </Torus>
          ))}
        </group>
      ))}
      <RoundedBox args={[0.94, 0.68, 0.20]} radius={0.08} smoothness={5} position={[0, 0.02, -0.05]}>
        <Steel state={state} color="#48535d" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      {[-0.27, 0.27].map((x) => (
        <Cylinder key={x} args={[0.11, 0.11, 0.14, 28]} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.02, 0.08]}>
          <Steel state={state} color="#8d969f" materialType="CAST_ALUMINUM" />
        </Cylinder>
      ))}
    </group>
  );
}

function IntakeValley({ state }: { state: V12IndustrialCutawayProps }) {
  return (
    <group position={[0, 1.23, 0]}>
      <RoundedBox args={[0.46, 0.34, 3.12]} radius={0.065} smoothness={6}>
        <Steel state={state} color="#1d232b" materialType="CARBON_FIBER" />
      </RoundedBox>
      <RoundedBox args={[0.30, 0.18, 3.00]} position={[0, -0.24, 0]} radius={0.045} smoothness={5}>
        <Steel state={state} color="#343d46" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      {CYLINDER_Z.map((z, i) => (
        <group key={i} position={[0, -0.02, z]}>
          <Torus args={[0.11, 0.015, 10, 40]} rotation={[Math.PI / 2, 0, 0]}>
            <Steel state={state} color="#bfc6cd" materialType="MACHINED_BILLET" />
          </Torus>
          <Cylinder args={[0.065, 0.065, 0.16, 24]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <Steel state={state} color="#58636e" materialType="CAST_ALUMINUM" />
          </Cylinder>
        </group>
      ))}
    </group>
  );
}

function ExhaustHeaders({ state, side }: { state: V12IndustrialCutawayProps; side: Side }) {
  const s = side === 'left' ? -1 : 1;
  const curves = useMemo(() => CYLINDER_Z.map((z, i) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(s * 0.68, 0.74, z),
    new THREE.Vector3(s * 0.84, 0.45 + Math.sin(i) * 0.04, z + (i - 2.5) * 0.04),
    new THREE.Vector3(s * 1.02, 0.18, -0.65 + i * 0.10),
  ])), [s]);

  return (
    <group>
      {curves.map((curve, i) => (
        <Tube key={i} args={[curve, 28, 0.026, 10, false]}>
          <Steel state={state} color="#8f969e" materialType="EXHAUST_STEEL" />
        </Tube>
      ))}
      <Cylinder args={[0.07, 0.07, 0.92, 28]} rotation={[Math.PI / 2, 0, 0]} position={[s * 1.02, 0.18, -0.35]}>
        <Steel state={state} color="#666f78" materialType="EXHAUST_STEEL" />
      </Cylinder>
    </group>
  );
}

export function V12IndustrialCutaway(state: V12IndustrialCutawayProps) {
  const angleRef = state.crankAngleRef;
  const localAngle = angleRef?.current ?? 0;

  return (
    <group rotation={[0.20, -0.54, 0.06]}>
      {/* Open deep-skirt crankcase: the section is intentionally removed on the viewing side. */}
      <RoundedBox args={[1.22, 0.12, 3.38]} radius={0.04} smoothness={5} position={[0, -0.28, 0]}>
        <Steel state={state} color="#343d46" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.55, 3.38]} radius={0.04} smoothness={5} position={[-0.55, -0.02, 0]}>
        <Steel state={state} color="#343d46" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.55, 3.38]} radius={0.04} smoothness={5} position={[0.55, -0.02, 0]}>
        <Steel state={state} color="#343d46" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.10, 0.12]} radius={0.03} smoothness={4} position={[0, 0.27, -1.64]}>
        <Steel state={state} color="#444f59" materialType="CAST_ALUMINUM" />
      </RoundedBox>

      {/* Red cutaway planes/edges: an intentional sectioned-CAD visual language */}
      <RoundedBox args={[0.035, 0.88, 3.38]} position={[-0.602, 0.04, 0]} radius={0.012} smoothness={3}>
        <Steel state={state} color="#ef233c" materialType="WRINKLE_RED" />
      </RoundedBox>
      <RoundedBox args={[0.035, 0.88, 3.38]} position={[0.602, 0.04, 0]} radius={0.012} smoothness={3}>
        <Steel state={state} color="#ef233c" materialType="WRINKLE_RED" />
      </RoundedBox>

      <CylinderBank state={state} side="left" crankAngle={localAngle} />
      <CylinderBank state={state} side="right" crankAngle={localAngle} />

      <ValveTrainBank state={state} side="left" />
      <ValveTrainBank state={state} side="right" />

      <IntakeValley state={state} />

      <ExhaustHeaders state={state} side="left" />
      <ExhaustHeaders state={state} side="right" />

      <CrankAssembly state={state} />

      {/* Dry-sump oil pan / lower structural section */}
      <RoundedBox args={[1.12, 0.18, 3.34]} position={[0, -0.67, 0]} radius={0.07} smoothness={6}>
        <Steel state={state} color="#252c34" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      {[-0.48, -0.24, 0, 0.24, 0.48].map((x) => (
        <Box key={x} args={[0.045, 0.08, 3.16]} position={[x, -0.73, 0]}>
          <Steel state={state} color="#4c5660" materialType="CAST_ALUMINUM" />
        </Box>
      ))}
      <FastenerField state={state} x={-0.55} y={-0.43} zStart={-1.42} count={7} spacing={0.47} radius={0.015} />
      <FastenerField state={state} x={0.55} y={-0.43} zStart={-1.42} count={7} spacing={0.47} radius={0.015} />

      <TimingDrive state={state} />
      <FrontAccessories state={state} />

      {/* Machined front and rear flange details */}
      <RoundedBox args={[0.82, 0.72, 0.045]} position={[0, 0.04, 1.73]} radius={0.04} smoothness={4}>
        <Steel state={state} color="#46515f" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      <RoundedBox args={[1.05, 1.05, 0.065]} position={[0, 0.02, -1.72]} radius={0.04} smoothness={4}>
        <Steel state={state} color="#424b55" materialType="CAST_ALUMINUM" />
      </RoundedBox>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <HexBolt
            key={i}
            position={[Math.cos(a) * 0.44, 0.20 + Math.sin(a) * 0.44, 1.76]}
            radius={0.016}
            height={0.016}
            state={state}
          />
        );
      })}

      {/* Subtle casting ribs along the outer skirts */}
      {[-1.15, -0.72, -0.29, 0.14, 0.57, 1.0].map((z) => (
        <React.Fragment key={z}>
          <Box args={[0.05, 0.42, 0.08]} position={[-0.62, 0.02, z]} rotation={[0, 0, -0.35]}>
            <Steel state={state} color="#59636d" materialType="CAST_ALUMINUM" />
          </Box>
          <Box args={[0.05, 0.42, 0.08]} position={[0.62, 0.02, z]} rotation={[0, 0, 0.35]}>
            <Steel state={state} color="#59636d" materialType="CAST_ALUMINUM" />
          </Box>
        </React.Fragment>
      ))}
    </group>
  );
}
