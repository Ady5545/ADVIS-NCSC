import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

type TurboState = AdvancedEngineeringModelProps & {
  /** Shared ADVIS kinematics transport. This is a presentation animation, not a CFD/RPM solver. */
  isKinematicPlaying?: boolean;
  kinematicSpeed?: number;
};

function Pbr({
  state,
  color,
  metalness = 0.82,
  roughness = 0.28,
}: {
  state: TurboState;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  if (state.blueprintEnabled) {
    return <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.48} side={THREE.DoubleSide} />;
  }

  return (
    <meshPhysicalMaterial
      color={color}
      metalness={metalness}
      roughness={state.xrayEnabled ? 0.18 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.28 : 1}
      transmission={state.xrayEnabled ? 0.34 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.22}
      clearcoatRoughness={0.16}
      envMapIntensity={1.45}
      side={THREE.DoubleSide}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.16 : state.isHovered ? 0.045 : 0}
    />
  );
}

function makeVoluteGeometry(
  startRadius: number,
  endRadius: number,
  tubeRadius: number,
  angleOffset = 0,
  zOffset = 0,
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const turns = Math.PI * 1.78;
  const start = -Math.PI * 0.72 + angleOffset;
  const tubularSegments = 180;
  const radialSegments = 24;

  for (let i = 0; i <= 150; i += 1) {
    const t = i / 150;
    const angle = start + turns * t;
    const radius = startRadius + (endRadius - startRadius) * t;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, zOffset));
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const indices: number[] = [];

  // A real volute grows in flow area as it winds around the scroll.
  // The cross-section therefore expands progressively rather than staying a constant tube.
  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const center = curve.getPointAt(t);
    const areaGrowth = 0.56 + 0.88 * t;
    const normalRadius = tubeRadius * areaGrowth;
    const binormalRadius = tubeRadius * areaGrowth * 0.76;

    for (let j = 0; j <= radialSegments; j += 1) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];
      const vertex = center
        .clone()
        .addScaledVector(normal, Math.cos(angle) * normalRadius)
        .addScaledVector(binormal, Math.sin(angle) * binormalRadius);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  }

  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makePipeGeometry(
  points: Array<[number, number, number]>,
  radius: number,
  tubularSegments = 72,
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
  );
  return new THREE.TubeGeometry(curve, tubularSegments, radius, 16, false);
}

/**
 * Builds a swept, cambered blade field in the XY plane. The two offset skins create
 * visible blade thickness; curved leading/trailing edges avoid the old flat-box look.
 */
function makeSweptBladeGeometry(
  count: number,
  rootRadius: number,
  tipRadius: number,
  sweep: number,
  chordAngle: number,
  axialCamber: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const radialSteps = 12;
  const chordSteps = 5;

  for (let blade = 0; blade < count; blade += 1) {
    const bladeAngle = (blade / count) * Math.PI * 2;

    const verticesPerSkin = (radialSteps + 1) * (chordSteps + 1);
    const lowerBase = positions.length / 3;
    const upperBase = lowerBase + verticesPerSkin;

    for (const skin of [-1, 1]) {
      const base = skin < 0 ? lowerBase : upperBase;

      for (let rStep = 0; rStep <= radialSteps; rStep += 1) {
        const radialT = rStep / radialSteps;
        const radius = rootRadius + (tipRadius - rootRadius) * radialT;

        for (let cStep = 0; cStep <= chordSteps; cStep += 1) {
          const chordT = cStep / chordSteps;
          const sweptAngle =
            bladeAngle +
            sweep * radialT * radialT +
            (chordT - 0.5) * chordAngle * (1 - 0.24 * radialT);
          const x = Math.cos(sweptAngle) * radius;
          const y = Math.sin(sweptAngle) * radius;
          const z =
            skin * 0.012 +
            axialCamber * Math.sin(chordT * Math.PI) * (0.25 + 0.75 * radialT) +
            (chordT - 0.5) * 0.025 * radialT;

          positions.push(x, y, z);
        }
      }

      for (let rStep = 0; rStep < radialSteps; rStep += 1) {
        for (let cStep = 0; cStep < chordSteps; cStep += 1) {
          const a = base + rStep * (chordSteps + 1) + cStep;
          const b = a + chordSteps + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }

    // Close the blade perimeter so the swept airfoil reads as a solid component.
    const boundary: number[] = [];
    for (let c = 0; c <= chordSteps; c += 1) boundary.push(c);
    for (let r = 1; r <= radialSteps; r += 1) boundary.push(r * (chordSteps + 1) + chordSteps);
    for (let c = chordSteps - 1; c >= 0; c -= 1) boundary.push(radialSteps * (chordSteps + 1) + c);
    for (let r = radialSteps - 1; r >= 1; r -= 1) boundary.push(r * (chordSteps + 1));

    for (let edge = 0; edge < boundary.length; edge += 1) {
      const next = (edge + 1) % boundary.length;
      const lowerA = lowerBase + boundary[edge];
      const lowerB = lowerBase + boundary[next];
      const upperA = upperBase + boundary[edge];
      const upperB = upperBase + boundary[next];
      indices.push(lowerA, upperA, lowerB, lowerB, upperA, upperB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function FlowMarkers({
  state,
  points,
  color,
  radius = 0.018,
}: {
  state: TurboState;
  points: Array<[number, number, number]>;
  color: string;
  radius?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
        false,
        'centripetal',
      ),
    [points],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current || state.isKinematicPlaying === false) return;
    const phase = (clock.elapsedTime * 0.12 * Math.max(0.25, state.kinematicSpeed ?? 1)) % 1;
    groupRef.current.children.forEach((child, index) => {
      const t = (phase + index / 5) % 1;
      child.position.copy(curve.getPointAt(t));
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={index}>
          <sphereGeometry args={[radius, 10, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.82} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function BoltCircle({
  state,
  radius,
  count = 8,
  z = 0,
  boltRadius = 0.022,
}: {
  state: TurboState;
  radius: number;
  count?: number;
  z?: number;
  boltRadius?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => {
        const angle = (index / count) * Math.PI * 2;
        return (
          <group
            key={index}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Cylinder args={[boltRadius, boltRadius, 0.032, 6]}>
              <Pbr state={state} color="#b8c0ca" metalness={0.94} roughness={0.2} />
            </Cylinder>
            <Torus args={[boltRadius * 1.35, 0.004, 6, 12]} position={[0, 0.018, 0]}>
              <Pbr state={state} color="#64707c" metalness={0.9} roughness={0.22} />
            </Torus>
          </group>
        );
      })}
    </>
  );
}

function TurboRotor({
  state,
  turbine = false,
}: {
  state: TurboState;
  turbine?: boolean;
}) {
  const rotorRef = useRef<THREE.Group>(null);
  const mainBlades = useMemo(
    () =>
      makeSweptBladeGeometry(
        turbine ? 11 : 8,
        turbine ? 0.075 : 0.085,
        turbine ? 0.305 : 0.32,
        turbine ? -0.66 : 0.78,
        turbine ? 0.66 : 0.82,
        turbine ? 0.045 : 0.035,
      ),
    [turbine],
  );
  const splitterBlades = useMemo(
    () => (!turbine ? makeSweptBladeGeometry(8, 0.17, 0.315, 0.66, 0.42, 0.024) : null),
    [turbine],
  );

  useFrame((_, delta) => {
    if (!rotorRef.current || state.isKinematicPlaying === false) return;
    const speed = THREE.MathUtils.clamp(state.kinematicSpeed ?? 1, 0, 3);
    rotorRef.current.rotation.z += delta * 6.4 * speed;
  });

  return (
    <group ref={rotorRef}>
      <Cylinder args={[0.305, 0.305, 0.055, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.015]}>
        <Pbr state={state} color={turbine ? '#777d86' : '#9da8b4'} metalness={0.94} roughness={0.2} />
      </Cylinder>
      <mesh geometry={mainBlades} castShadow receiveShadow>
        <Pbr state={state} color={turbine ? '#9b9fa7' : '#d5dbe2'} metalness={0.94} roughness={0.2} />
      </mesh>
      {splitterBlades && (
        <mesh geometry={splitterBlades} castShadow receiveShadow>
          <Pbr state={state} color="#aeb8c3" metalness={0.92} roughness={0.22} />
        </mesh>
      )}
      <Sphere args={[0.115, 32, 20]} scale={[1, 1, 0.62]} position={[0, 0, 0.035]}>
        <Pbr state={state} color={turbine ? '#6d747d' : '#c3ccd5'} metalness={0.95} roughness={0.18} />
      </Sphere>
      <Cylinder args={[0.018, 0.105, 0.19, 40]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.13]}>
        <Pbr state={state} color={turbine ? '#8e959e' : '#e1e6ec'} metalness={0.96} roughness={0.16} />
      </Cylinder>
      <Cylinder args={[0.048, 0.048, 0.045, 6]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.245]}>
        <Pbr state={state} color="#737b85" metalness={0.95} roughness={0.2} />
      </Cylinder>
      <Torus args={[0.12, 0.012, 10, 48]} position={[0, 0, -0.045]}>
        <Pbr state={state} color="#626b75" metalness={0.93} roughness={0.23} />
      </Torus>
    </group>
  );
}

export function TurboCompressorHousing({ state }: { state: TurboState }) {
  const volute = useMemo(() => makeVoluteGeometry(0.36, 0.55, 0.095), []);
  const discharge = useMemo(
    () => makePipeGeometry([[0.43, 0.27, 0], [0.56, 0.38, 0], [0.70, 0.38, 0.02], [0.78, 0.30, 0.02]], 0.09),
    [],
  );
  return (
    <group>
      <mesh geometry={volute} castShadow receiveShadow>
        <Pbr state={state} color="#b9c3cd" metalness={0.7} roughness={0.27} />
      </mesh>
      <mesh geometry={discharge} castShadow receiveShadow>
        <Pbr state={state} color="#a9b4c0" metalness={0.72} roughness={0.25} />
      </mesh>
      <Torus args={[0.345, 0.035, 16, 88]} position={[0, 0, 0.055]}>
        <Pbr state={state} color="#d5dce3" metalness={0.82} roughness={0.22} />
      </Torus>
      {/* Machined rear joint face and a broad V-band clamp seat. */}
      <Torus args={[0.505, 0.025, 12, 88]} position={[0, 0, -0.085]}>
        <Pbr state={state} color="#424b54" metalness={0.9} roughness={0.34} />
      </Torus>
      <Box args={[0.11, 0.075, 0.075]} position={[0.49, 0.07, -0.085]}>
        <Pbr state={state} color="#525b64" metalness={0.88} roughness={0.34} />
      </Box>
      <Cylinder args={[0.016, 0.016, 0.09, 12]} position={[0.49, 0.07, -0.085]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#c3cbd2" metalness={0.96} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.34, 0.34, 0.075, 64, 1, true]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.025]}>
        <Pbr state={state} color="#7d8995" metalness={0.76} roughness={0.34} />
      </Cylinder>
      <BoltCircle state={state} radius={0.48} count={10} z={0.055} boltRadius={0.018} />
      <FlowMarkers
        state={state}
        color="#38bdf8"
        points={[[0, 0, 0.10], [0.16, 0.04, 0.09], [0.28, 0.18, 0.07], [0.44, 0.26, 0.05], [0.58, 0.34, 0.03], [0.76, 0.31, 0.02]]}
      />
    </group>
  );
}

export function TurboCompressorWheel({ state }: { state: TurboState }) {
  return <TurboRotor state={state} />;
}

export function TurboTurbineHousing({ state }: { state: TurboState }) {
  const scrollA = useMemo(() => makeVoluteGeometry(0.35, 0.54, 0.105, 0.12, 0.055), []);
  const scrollB = useMemo(() => makeVoluteGeometry(0.34, 0.52, 0.105, Math.PI + 0.12, -0.055), []);
  const outlet = useMemo(
    () => makePipeGeometry([[0.34, -0.26, 0], [0.20, -0.44, 0], [0.04, -0.56, 0], [-0.02, -0.72, 0]], 0.105),
    [],
  );
  return (
    <group>
      <mesh geometry={scrollA} castShadow receiveShadow>
        <Pbr state={state} color="#5b473c" metalness={0.58} roughness={0.48} />
      </mesh>
      <mesh geometry={scrollB} castShadow receiveShadow>
        <Pbr state={state} color="#78543d" metalness={0.56} roughness={0.5} />
      </mesh>
      <mesh geometry={outlet} castShadow receiveShadow>
        <Pbr state={state} color="#574337" metalness={0.65} roughness={0.42} />
      </mesh>
      <Torus args={[0.32, 0.034, 14, 80]} position={[0, 0, 0.02]}>
        <Pbr state={state} color="#9b7454" metalness={0.72} roughness={0.34} />
      </Torus>
      {/* Turbine-side V-band joint with clamp lug and tightening bolt. */}
      <Torus args={[0.49, 0.026, 12, 88]} position={[0, 0, 0.105]}>
        <Pbr state={state} color="#353b40" metalness={0.9} roughness={0.42} />
      </Torus>
      <Box args={[0.11, 0.075, 0.075]} position={[0.47, 0.12, 0.105]}>
        <Pbr state={state} color="#45403b" metalness={0.84} roughness={0.5} />
      </Box>
      <Cylinder args={[0.016, 0.016, 0.09, 12]} position={[0.47, 0.12, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#c1c7cc" metalness={0.94} roughness={0.25} />
      </Cylinder>
      {/* Flat twin-scroll T3-style inlet flange and perimeter bolt heads. */}
      <Box args={[0.94, 0.13, 0.38]} position={[0, -0.37, 0]}>
        <Pbr state={state} color="#594536" metalness={0.52} roughness={0.76} />
      </Box>
      {[-0.36, 0.36].map((x) => [-0.115, 0.115].map((z) => (
        <Cylinder key={x + '-' + z} args={[0.025, 0.025, 0.04, 6]} position={[x, -0.292, z]}>
          <Pbr state={state} color="#b1a79c" metalness={0.9} roughness={0.32} />
        </Cylinder>
      )))}
      <Cylinder args={[0.335, 0.335, 0.08, 64, 1, true]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.02]}>
        <Pbr state={state} color="#59463a" metalness={0.58} roughness={0.5} />
      </Cylinder>
      <FlowMarkers
        state={state}
        color="#fb923c"
        points={[[0.58, -0.30, 0.04], [0.43, -0.30, 0.04], [0.25, -0.22, 0.03], [0.16, -0.06, 0.02], [0.06, 0.05, 0.01], [-0.02, -0.10, 0]]}
        radius={0.02}
      />
    </group>
  );
}

export function TurboTurbineWheel({ state }: { state: TurboState }) {
  return <TurboRotor state={state} turbine />;
}

export function TurboCenterHousing({ state }: { state: TurboState }) {
  return (
    <group>
      <Cylinder args={[0.205, 0.205, 0.43, 48]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#3e4650" metalness={0.76} roughness={0.3} />
      </Cylinder>
      <Torus args={[0.205, 0.035, 14, 64]} position={[0, 0, 0.18]}>
        <Pbr state={state} color="#8b949e" metalness={0.88} roughness={0.24} />
      </Torus>
      <Torus args={[0.205, 0.035, 14, 64]} position={[0, 0, -0.18]}>
        <Pbr state={state} color="#8b949e" metalness={0.88} roughness={0.24} />
      </Torus>
      <RoundedBox args={[0.18, 0.13, 0.18]} radius={0.035} smoothness={4} position={[0, 0.22, 0]}>
        <Pbr state={state} color="#505a66" metalness={0.72} roughness={0.34} />
      </RoundedBox>
      <Cylinder args={[0.055, 0.055, 0.18, 24]} position={[0, 0.22, 0.12]}>
        <Pbr state={state} color="#b68a4f" metalness={0.86} roughness={0.24} />
      </Cylinder>
      {/* Oil-feed flange bolts and drain-return flange. */}
      <Box args={[0.19, 0.045, 0.16]} position={[0, 0.16, 0]}>
        <Pbr state={state} color="#59636d" metalness={0.76} roughness={0.46} />
      </Box>
      {[-0.065, 0.065].map((x) => (
        <Cylinder key={x} args={[0.012, 0.012, 0.025, 6]} position={[x, 0.19, 0.07]}>
          <Pbr state={state} color="#c2c9cf" metalness={0.94} roughness={0.22} />
        </Cylinder>
      ))}
      <Box args={[0.20, 0.045, 0.16]} position={[0.04, -0.28, 0.04]}>
        <Pbr state={state} color="#626c75" metalness={0.78} roughness={0.46} />
      </Box>
      <Cylinder args={[0.055, 0.055, 0.18, 24]} position={[0, 0.22, -0.12]}>
        <Pbr state={state} color="#b68a4f" metalness={0.86} roughness={0.24} />
      </Cylinder>
      <Torus args={[0.13, 0.018, 10, 48]} position={[0, 0, 0.235]}>
        <Pbr state={state} color="#bdc5ce" metalness={0.94} roughness={0.18} />
      </Torus>
    </group>
  );
}

export function TurboShaft({ state }: { state: TurboState }) {
  const shaftRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!shaftRef.current || state.isKinematicPlaying === false) return;
    const speed = THREE.MathUtils.clamp(state.kinematicSpeed ?? 1, 0, 3);
    shaftRef.current.rotation.z += delta * 6.4 * speed;
  });

  return (
    <group ref={shaftRef}>
      <Cylinder args={[0.027, 0.027, 0.92, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#d5dbe2" metalness={0.97} roughness={0.13} />
      </Cylinder>
      <Cylinder args={[0.075, 0.075, 0.055, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.34]}>
        <Pbr state={state} color="#929ba6" metalness={0.96} roughness={0.17} />
      </Cylinder>
      <Cylinder args={[0.075, 0.075, 0.055, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.34]}>
        <Pbr state={state} color="#929ba6" metalness={0.96} roughness={0.17} />
      </Cylinder>
      <Torus args={[0.072, 0.009, 10, 36]} position={[0, 0, 0.375]}>
        <Pbr state={state} color="#c4ccd5" metalness={0.95} roughness={0.15} />
      </Torus>
      <Torus args={[0.072, 0.009, 10, 36]} position={[0, 0, -0.375]}>
        <Pbr state={state} color="#c4ccd5" metalness={0.95} roughness={0.15} />
      </Torus>
    </group>
  );
}

export function TurboCompressorInlet({ state }: { state: TurboState }) {
  return (
    <group>
      <Cylinder args={[0.205, 0.16, 0.24, 56, 1, true]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
        <Pbr state={state} color="#8d99a6" metalness={0.78} roughness={0.25} />
      </Cylinder>
      <Torus args={[0.205, 0.026, 14, 64]} position={[0, 0, 0.14]}>
        <Pbr state={state} color="#dce3ea" metalness={0.86} roughness={0.2} />
      </Torus>
      <BoltCircle state={state} radius={0.245} count={8} z={0.12} boltRadius={0.014} />
      <Cylinder args={[0.155, 0.155, 0.035, 48]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.105]}>
        <meshBasicMaterial color="#111820" />
      </Cylinder>
    </group>
  );
}

export function TurboCompressorOutlet({ state }: { state: TurboState }) {
  const pipe = useMemo(
    () => makePipeGeometry([[0, 0, 0], [0.12, 0.05, 0], [0.27, 0.16, 0], [0.42, 0.18, 0]], 0.075),
    [],
  );
  return (
    <group>
      <mesh geometry={pipe} castShadow receiveShadow>
        <Pbr state={state} color="#aeb8c3" metalness={0.78} roughness={0.25} />
      </mesh>
      <Torus args={[0.084, 0.018, 10, 36]} position={[0.42, 0.18, 0]}>
        <Pbr state={state} color="#d4dce4" metalness={0.86} roughness={0.2} />
      </Torus>
      <Cylinder args={[0.045, 0.045, 0.055, 24]} position={[0.42, 0.18, 0]}>
        <Pbr state={state} color="#59636e" metalness={0.72} roughness={0.3} />
      </Cylinder>
    </group>
  );
}

export function TurboTurbineInlets({ state }: { state: TurboState }) {
  const inletA = useMemo(
    () => makePipeGeometry([[-0.38, -0.30, 0], [-0.26, -0.22, 0], [-0.12, -0.10, 0.045], [0, 0, 0.045]], 0.083),
    [],
  );
  const inletB = useMemo(
    () => makePipeGeometry([[0.38, -0.30, 0], [0.26, -0.22, 0], [0.12, -0.10, -0.045], [0, 0, -0.045]], 0.083),
    [],
  );
  return (
    <group>
      <mesh geometry={inletA} castShadow receiveShadow>
        <Pbr state={state} color="#76513b" metalness={0.62} roughness={0.45} />
      </mesh>
      <mesh geometry={inletB} castShadow receiveShadow>
        <Pbr state={state} color="#76513b" metalness={0.62} roughness={0.45} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <group key={x} position={[x, -0.30, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Torus args={[0.09, 0.018, 10, 36]}>
            <Pbr state={state} color="#a98462" metalness={0.7} roughness={0.38} />
          </Torus>
          <BoltCircle state={state} radius={0.11} count={4} z={0.012} boltRadius={0.012} />
        </group>
      ))}
    </group>
  );
}

export function TurboTurbineOutlet({ state }: { state: TurboState }) {
  const downpipe = useMemo(
    () => makePipeGeometry([[0, 0, 0], [0.02, -0.14, 0], [0.06, -0.28, 0], [0.02, -0.42, 0]], 0.10),
    [],
  );
  return (
    <group>
      <mesh geometry={downpipe} castShadow receiveShadow>
        <Pbr state={state} color="#5c4638" metalness={0.7} roughness={0.42} />
      </mesh>
      <Torus args={[0.105, 0.018, 10, 40]} position={[0.02, -0.42, 0]}>
        <Pbr state={state} color="#9a785d" metalness={0.75} roughness={0.34} />
      </Torus>
      <Cylinder args={[0.08, 0.08, 0.06, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0.02, -0.42, 0]}>
        <meshBasicMaterial color="#171717" />
      </Cylinder>
    </group>
  );
}

export function TurboWastegate({ state }: { state: TurboState }) {
  return (
    <group>
      {/* Two-piece mounting bracket ties the actuator canister to the hot-side casting. */}
      <Box args={[0.25, 0.045, 0.18]} position={[0, -0.13, -0.08]}>
        <Pbr state={state} color="#4d555d" metalness={0.84} roughness={0.42} />
      </Box>
      <Box args={[0.045, 0.19, 0.15]} position={[-0.085, -0.035, -0.08]}>
        <Pbr state={state} color="#606a73" metalness={0.86} roughness={0.38} />
      </Box>
      <Box args={[0.045, 0.19, 0.15]} position={[0.085, -0.035, -0.08]}>
        <Pbr state={state} color="#606a73" metalness={0.86} roughness={0.38} />
      </Box>
      <Cylinder args={[0.115, 0.115, 0.22, 40]} position={[0, 0.05, 0]}>
        <Pbr state={state} color="#9da7b2" metalness={0.72} roughness={0.38} />
      </Cylinder>
      <Torus args={[0.112, 0.014, 10, 40]} position={[0, 0.16, 0]}>
        <Pbr state={state} color="#c7d0d9" metalness={0.84} roughness={0.24} />
      </Torus>
      <Cylinder args={[0.025, 0.025, 0.24, 18]} position={[0, -0.16, 0]}>
        <Pbr state={state} color="#c6ced7" metalness={0.92} roughness={0.18} />
      </Cylinder>
      <RoundedBox args={[0.14, 0.055, 0.10]} radius={0.018} smoothness={3} position={[0, -0.30, 0]}>
        <Pbr state={state} color="#555e68" metalness={0.72} roughness={0.34} />
      </RoundedBox>
      {/* Clevis and connecting rod terminate at the wastegate lever arm. */}
      <Cylinder args={[0.012, 0.012, 0.16, 12]} position={[0.06, -0.39, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#d0d6dc" metalness={0.96} roughness={0.18} />
      </Cylinder>
      <Sphere args={[0.022, 16, 12]} position={[0.14, -0.39, 0.02]}>
        <Pbr state={state} color="#aab3bb" metalness={0.9} roughness={0.24} />
      </Sphere>
      <Torus args={[0.038, 0.009, 8, 24]} position={[0, -0.30, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#c0c8d1" metalness={0.9} roughness={0.2} />
      </Torus>
    </group>
  );
}

export function TurboWastegateFlap({ state }: { state: TurboState }) {
  return (
    <group>
      <Cylinder args={[0.045, 0.045, 0.10, 24]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#9a7558" metalness={0.75} roughness={0.36} />
      </Cylinder>
      <Torus args={[0.12, 0.014, 10, 40]} position={[0, 0, 0.012]}>
        <Pbr state={state} color="#8d6a51" metalness={0.7} roughness={0.4} />
      </Torus>
      <Box args={[0.18, 0.035, 0.012]} position={[0.16, 0.02, 0.02]}>
        <Pbr state={state} color="#9ca3af" metalness={0.85} roughness={0.24} />
      </Box>
      <Cylinder args={[0.018, 0.018, 0.16, 16]} rotation={[0, 0, Math.PI / 2]} position={[0.24, 0.02, 0.02]}>
        <Pbr state={state} color="#cbd5e1" metalness={0.92} roughness={0.18} />
      </Cylinder>
    </group>
  );
}

export function TurboOilSystem({ state }: { state: TurboState }) {
  const feed = useMemo(
    () => makePipeGeometry([[0, 0.02, 0], [0, 0.16, 0.04], [0.06, 0.24, 0.04], [0.06, 0.34, 0.04]], 0.025),
    [],
  );
  const drain = useMemo(
    () => makePipeGeometry([[0, -0.02, 0], [0, -0.16, 0.04], [0.04, -0.24, 0.04], [0.04, -0.34, 0.04]], 0.034),
    [],
  );
  return (
    <group>
      <mesh geometry={feed} castShadow receiveShadow>
        <Pbr state={state} color="#d2a24b" metalness={0.88} roughness={0.25} />
      </mesh>
      <mesh geometry={drain} castShadow receiveShadow>
        <Pbr state={state} color="#b6bec8" metalness={0.84} roughness={0.28} />
      </mesh>
      <Cylinder args={[0.045, 0.045, 0.055, 24]} position={[0.06, 0.34, 0.04]}>
        <Pbr state={state} color="#c69a4f" metalness={0.88} roughness={0.22} />
      </Cylinder>
      <Cylinder args={[0.055, 0.055, 0.06, 24]} position={[0.04, -0.34, 0.04]}>
        <Pbr state={state} color="#8b949e" metalness={0.84} roughness={0.28} />
      </Cylinder>
    </group>
  );
}

export function TurboWaterCoolingLines({ state }: { state: TurboState }) {
  const lineA = useMemo(
    () => makePipeGeometry([[-0.18, 0.08, 0], [-0.32, 0.18, 0], [-0.35, 0.28, 0.02], [-0.22, 0.36, 0.02]], 0.022),
    [],
  );
  const lineB = useMemo(
    () => makePipeGeometry([[0.18, 0.08, 0], [0.32, 0.18, 0], [0.35, 0.28, -0.02], [0.22, 0.36, -0.02]], 0.022),
    [],
  );
  return (
    <group>
      <mesh geometry={lineA} castShadow receiveShadow>
        <Pbr state={state} color="#6c9eb8" metalness={0.78} roughness={0.25} />
      </mesh>
      <mesh geometry={lineB} castShadow receiveShadow>
        <Pbr state={state} color="#6c9eb8" metalness={0.78} roughness={0.25} />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0.36, 0]}>
          <Cylinder args={[0.035, 0.035, 0.035, 16]} rotation={[0, 0, Math.PI / 2]}>
            <Pbr state={state} color="#b8c2cc" metalness={0.9} roughness={0.28} />
          </Cylinder>
          <Torus args={[0.027, 0.006, 8, 24]} rotation={[0, Math.PI / 2, 0]}>
            <Pbr state={state} color="#687681" metalness={0.88} roughness={0.3} />
          </Torus>
        </group>
      ))}
    </group>
  );
}

export function TurboHousingFasteners({ state, turbine = false }: { state: TurboState; turbine?: boolean }) {
  const radius = turbine ? 0.49 : 0.50;
  return (
    <group>
      <BoltCircle state={state} radius={radius} count={12} z={0.09} boltRadius={0.018} />
      {/* A broad machined retaining band with discrete fasteners, not decorative wire loops. */}
      <Torus args={[radius, 0.024, 12, 96]} position={[0, 0, 0.08]}>
        <Pbr state={state} color={turbine ? '#514238' : '#515b65'} metalness={0.9} roughness={0.36} />
      </Torus>
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        return (
          <Cylinder
            key={index}
            args={[0.018, 0.018, 0.035, 6]}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.10]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Pbr state={state} color="#c2c9d0" metalness={0.94} roughness={0.22} />
          </Cylinder>
        );
      })}
    </group>
  );
}

export function renderTurboPrecisionComponent(
  objectId: string,
  componentId: string,
  state: TurboState,
): React.ReactNode | null {
  if (objectId !== 'turbocharger') return null;

  switch (componentId) {
    case 'turbo_comp':
      return <TurboCompressorHousing state={state} />;
    case 'turbo_comp_wheel':
      return <TurboCompressorWheel state={state} />;
    case 'turbo_comp_inlet':
      return <TurboCompressorInlet state={state} />;
    case 'turbo_comp_outlet':
      return <TurboCompressorOutlet state={state} />;
    case 'turbo_turb':
      return <TurboTurbineHousing state={state} />;
    case 'turbo_turb_wheel':
      return <TurboTurbineWheel state={state} />;
    case 'turbo_turb_inlets':
      return <TurboTurbineInlets state={state} />;
    case 'turbo_turb_outlet':
      return <TurboTurbineOutlet state={state} />;
    case 'turbo_center':
      return <TurboCenterHousing state={state} />;
    case 'turbo_shaft':
      return <TurboShaft state={state} />;
    case 'turbo_wastegate':
      return <TurboWastegate state={state} />;
    case 'turbo_wastegate_flap':
      return <TurboWastegateFlap state={state} />;
    case 'turbo_oil_system':
      return <TurboOilSystem state={state} />;
    case 'turbo_water_lines':
      return <TurboWaterCoolingLines state={state} />;
    case 'turbo_comp_fasteners':
      return <TurboHousingFasteners state={state} />;
    case 'turbo_turb_fasteners':
      return <TurboHousingFasteners state={state} turbine />;
    default:
      return null;
  }
}
