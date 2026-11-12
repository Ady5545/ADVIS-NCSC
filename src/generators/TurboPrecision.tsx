import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Box, Cylinder, Sphere, Torus } from '@react-three/drei';
import type { AdvancedEngineeringModelProps } from './AdvancedEngineeringModels';

type State = AdvancedEngineeringModelProps;
type Point3 = [number, number, number];

function Pbr({
  state,
  color,
  metalness = 0.78,
  roughness = 0.36,
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
      roughness={state.xrayEnabled ? 0.2 : roughness}
      transparent={Boolean(state.xrayEnabled)}
      opacity={state.xrayEnabled ? 0.28 : 1}
      transmission={state.xrayEnabled ? 0.35 : 0}
      depthWrite={!state.xrayEnabled}
      clearcoat={0.16}
      clearcoatRoughness={0.2}
      side={THREE.DoubleSide}
      envMapIntensity={1.25}
      emissive={state.isSelected ? '#22d3ee' : state.isHovered ? '#67e8f9' : '#000000'}
      emissiveIntensity={state.isSelected ? 0.14 : state.isHovered ? 0.045 : 0}
    />
  );
}

/**
 * A closed annular volute casting. The outer wall grows around the scroll while
 * the central throat stays open for the rotor and the inlet bellmouth.
 */
function createVoluteGeometry(
  innerRadius: number,
  baseOuterRadius: number,
  scrollGrowth: number,
  halfDepth: number
) {
  const segments = 112;
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const outerRadius = baseOuterRadius + scrollGrowth * (i / (segments - 1));
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    vertices.push(
      innerRadius * cos, innerRadius * sin, halfDepth,
      outerRadius * cos, outerRadius * sin, halfDepth,
      outerRadius * cos, outerRadius * sin, -halfDepth,
      innerRadius * cos, innerRadius * sin, -halfDepth
    );
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 4;
    const b = ((i + 1) % segments) * 4;

    // Front and rear annular faces.
    indices.push(a, a + 1, b + 1, a, b + 1, b);
    indices.push(a + 3, b + 3, b + 2, a + 3, b + 2, a + 2);

    // Outer and inner walls.
    indices.push(a + 1, a + 2, b + 2, a + 1, b + 2, b + 1);
    indices.push(a, b, b + 3, a, b + 3, a + 3);
  }

  // Close the scroll seam at its narrow and wide ends.
  indices.push(0, 3, 2, 0, 2, 1);
  const end = (segments - 1) * 4;
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function BoltCircle({
  state,
  radius,
  z,
  count = 8,
  size = 0.018,
}: {
  state: State;
  radius: number;
  z: number;
  count?: number;
  size?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <Cylinder
            key={'bolt-' + i}
            args={[size, size, 0.025, 12]}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, z]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Pbr state={state} color="#69737d" metalness={0.94} roughness={0.23} />
          </Cylinder>
        );
      })}
    </>
  );
}

function SideBoltSet({
  state,
  x,
  y,
  z,
  count = 4,
}: {
  state: State;
  x: number;
  y: number;
  z: number;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const offsets = count === 4
          ? [[-0.075, -0.075], [0.075, -0.075], [-0.075, 0.075], [0.075, 0.075]]
          : [[-0.075, 0], [0.075, 0]];
        const [dy, dz] = offsets[i];
        return (
          <Cylinder
            key={'side-bolt-' + i}
            args={[0.018, 0.018, 0.028, 12]}
            position={[x, y + dy, z + dz]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <Pbr state={state} color="#68727c" metalness={0.94} roughness={0.22} />
          </Cylinder>
        );
      })}
    </>
  );
}

function VBandClamp({ state, z }: { state: State; z: number }) {
  return (
    <group>
      <Torus args={[0.333, 0.018, 10, 72]} position={[0, 0, z]}>
        <Pbr state={state} color="#3c4349" metalness={0.9} roughness={0.3} />
      </Torus>
      <Box args={[0.095, 0.052, 0.055]} position={[0.325, 0.045, z]}>
        <Pbr state={state} color="#4b535b" metalness={0.88} roughness={0.3} />
      </Box>
      <Cylinder args={[0.014, 0.014, 0.075, 12]} position={[0.325, 0.045, z]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#aeb6bd" metalness={0.94} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

function Pipe({
  state,
  points,
  radius,
  color,
}: {
  state: State;
  points: Point3[];
  radius: number;
  color: string;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2]))),
    [points]
  );
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 28, radius, 10, false),
    [curve, radius]
  );

  return (
    <mesh geometry={geometry} castShadow>
      <Pbr state={state} color={color} metalness={0.76} roughness={0.29} />
    </mesh>
  );
}

const OIL_FEED_PATH: Point3[] = [
  [0, 0.18, 0],
  [0, 0.245, 0],
  [0.035, 0.29, 0],
  [0.035, 0.33, 0],
];

const COOLANT_LEFT_PATH: Point3[] = [
  [-0.13, 0.03, 0.085],
  [-0.22, 0.09, 0.085],
  [-0.245, 0.17, 0.085],
  [-0.205, 0.225, 0.085],
];

const COOLANT_RIGHT_PATH: Point3[] = [
  [0.13, 0.03, -0.085],
  [0.22, 0.09, -0.085],
  [0.245, 0.17, -0.085],
  [0.205, 0.225, -0.085],
];

/** Centrifugal impeller / radial turbine rotor on the common Z-axis shaft. */
function RotorWheel({ state, turbine = false }: { state: State; turbine?: boolean }) {
  const bladeCount = turbine ? 12 : 11;
  const bladeColor = turbine ? '#777f87' : '#c3cbd2';

  return (
    <group>
      <Cylinder
        args={[0.19, 0.19, 0.022, 40]}
        position={[0, 0, -0.025]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <Pbr state={state} color={turbine ? '#555d65' : '#89939c'} metalness={0.86} roughness={0.3} />
      </Cylinder>
      <Cylinder
        args={[0.038, 0.092, 0.075, 28]}
        position={[0, 0, 0.015]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <Pbr state={state} color={turbine ? '#7b8188' : '#d4dbe1'} metalness={0.95} roughness={0.2} />
      </Cylinder>

      {Array.from({ length: bladeCount }).map((_, i) => {
        const angle = (i / bladeCount) * Math.PI * 2;
        return (
          <group key={'main-vane-' + i} rotation={[0, 0, angle]}>
            <Box
              args={[0.15, 0.034, 0.018]}
              position={[0.105, 0, turbine ? -0.012 : 0.026]}
              rotation={[0, 0, turbine ? -0.38 : 0.34]}
            >
              <Pbr state={state} color={bladeColor} metalness={0.91} roughness={turbine ? 0.32 : 0.2} />
            </Box>
          </group>
        );
      })}

      {!turbine && Array.from({ length: bladeCount }).map((_, i) => {
        const angle = ((i + 0.5) / bladeCount) * Math.PI * 2;
        return (
          <group key={'splitter-vane-' + i} rotation={[0, 0, angle]}>
            <Box args={[0.09, 0.019, 0.012]} position={[0.15, 0, 0.022]} rotation={[0, 0, 0.28]}>
              <Pbr state={state} color="#aeb8c0" metalness={0.9} roughness={0.24} />
            </Box>
          </group>
        );
      })}
    </group>
  );
}

export function TurboCompressorHousing({ state }: { state: State }) {
  const volute = useMemo(() => createVoluteGeometry(0.178, 0.292, 0.066, 0.115), []);

  return (
    <group>
      <mesh geometry={volute} castShadow receiveShadow>
        <Pbr state={state} color="#aeb8c0" metalness={0.68} roughness={0.48} />
      </mesh>

      {/* Bellmouth throat and machined inlet lip. */}
      <Cylinder
        args={[0.172, 0.19, 0.22, 48, 1, true]}
        position={[0, 0, 0.245]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <Pbr state={state} color="#c1c9d0" metalness={0.72} roughness={0.32} />
      </Cylinder>
      <Torus args={[0.174, 0.023, 14, 64]} position={[0, 0, 0.36]}>
        <Pbr state={state} color="#d1d7dc" metalness={0.78} roughness={0.28} />
      </Torus>
      <Torus args={[0.205, 0.012, 10, 56]} position={[0, 0, 0.105]}>
        <Pbr state={state} color="#7c8790" metalness={0.88} roughness={0.3} />
      </Torus>

      {/* The rear flange meets the CHRA; its V-band is a real clamp, not a wire loop. */}
      <Torus args={[0.326, 0.02, 10, 64]} position={[0, 0, -0.12]}>
        <Pbr state={state} color="#4a535c" metalness={0.9} roughness={0.32} />
      </Torus>
      <VBandClamp state={state} z={-0.137} />
      <BoltCircle state={state} radius={0.286} z={-0.13} count={8} size={0.016} />

      {/* Compressor discharge neck and a bolted charge-pipe flange. */}
      <Cylinder
        args={[0.082, 0.105, 0.28, 32, 1, true]}
        position={[0.385, 0.035, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <Pbr state={state} color="#aeb8c0" metalness={0.68} roughness={0.46} />
      </Cylinder>
      <Box args={[0.075, 0.235, 0.225]} position={[0.535, 0.035, 0]}>
        <Pbr state={state} color="#919ba4" metalness={0.72} roughness={0.42} />
      </Box>
      <SideBoltSet state={state} x={0.58} y={0.035} z={0} count={4} />
    </group>
  );
}

export function TurboCompressorWheel({ state }: { state: State }) {
  return <group position={[0, 0, 0.055]}><RotorWheel state={state} /></group>;
}

export function TurboTurbineHousing({ state }: { state: State }) {
  const volute = useMemo(() => createVoluteGeometry(0.17, 0.29, 0.075, 0.12), []);

  return (
    <group>
      <mesh geometry={volute} castShadow receiveShadow>
        <Pbr state={state} color="#604332" metalness={0.58} roughness={0.72} />
      </mesh>

      {/* Heat-darkened cast scroll, inner retaining lip and CHRA V-band joint. */}
      <Torus args={[0.18, 0.025, 12, 64]} position={[0, 0, -0.125]}>
        <Pbr state={state} color="#7b5238" metalness={0.58} roughness={0.68} />
      </Torus>
      <Torus args={[0.326, 0.02, 10, 64]} position={[0, 0, 0.12]}>
        <Pbr state={state} color="#353b40" metalness={0.86} roughness={0.38} />
      </Torus>
      <VBandClamp state={state} z={0.137} />
      <BoltCircle state={state} radius={0.285} z={0.13} count={8} size={0.016} />

      {/* Twin-scroll T3-style manifold inlet flange with two separate gas passages. */}
      <Box args={[0.42, 0.12, 0.285]} position={[0, -0.345, 0]}>
        <Pbr state={state} color="#674936" metalness={0.52} roughness={0.72} />
      </Box>
      <Box args={[0.125, 0.018, 0.17]} position={[-0.105, -0.277, 0]}>
        <Pbr state={state} color="#201c19" metalness={0.24} roughness={0.86} />
      </Box>
      <Box args={[0.125, 0.018, 0.17]} position={[0.105, -0.277, 0]}>
        <Pbr state={state} color="#201c19" metalness={0.24} roughness={0.86} />
      </Box>
      {[-0.155, 0.155].map((x) => [-0.09, 0.09].map((z) => (
        <Cylinder
          key={'t3-bolt-' + x + '-' + z}
          args={[0.02, 0.02, 0.035, 12]}
          position={[x, -0.272, z]}
        >
          <Pbr state={state} color="#a4a9ad" metalness={0.92} roughness={0.26} />
        </Cylinder>
      )))}

      {/* Cast outlet neck and a flat downpipe flange with perimeter fasteners. */}
      <Cylinder
        args={[0.09, 0.12, 0.3, 32, 1, true]}
        position={[-0.39, 0.015, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <Pbr state={state} color="#604332" metalness={0.56} roughness={0.72} />
      </Cylinder>
      <Box args={[0.075, 0.255, 0.25]} position={[-0.55, 0.015, 0]}>
        <Pbr state={state} color="#59402f" metalness={0.55} roughness={0.7} />
      </Box>
      <SideBoltSet state={state} x={-0.59} y={0.015} z={0} count={4} />
    </group>
  );
}

export function TurboTurbineWheel({ state }: { state: State }) {
  return <group position={[0, 0, -0.045]}><RotorWheel state={state} turbine /></group>;
}

export function TurboCenterHousing({ state }: { state: State }) {
  return (
    <group>
      {/* CHRA bearing cartridge and the two machined housing end faces. */}
      <Cylinder args={[0.158, 0.158, 0.48, 40]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#48525b" metalness={0.78} roughness={0.43} />
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 0.055, 40]} position={[0, 0, 0.225]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#707a83" metalness={0.86} roughness={0.32} />
      </Cylinder>
      <Cylinder args={[0.18, 0.18, 0.055, 40]} position={[0, 0, -0.225]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#707a83" metalness={0.86} roughness={0.32} />
      </Cylinder>
      <Torus args={[0.145, 0.018, 10, 48]} position={[0, 0, 0.245]}>
        <Pbr state={state} color="#aeb6bd" metalness={0.9} roughness={0.25} />
      </Torus>
      <Torus args={[0.145, 0.018, 10, 48]} position={[0, 0, -0.245]}>
        <Pbr state={state} color="#aeb6bd" metalness={0.9} roughness={0.25} />
      </Torus>

      {/* Oil feed flange and hard line on top of the CHRA. */}
      <Box args={[0.145, 0.065, 0.135]} position={[0, 0.18, 0]}>
        <Pbr state={state} color="#3b4249" metalness={0.68} roughness={0.48} />
      </Box>
      <Cylinder args={[0.037, 0.037, 0.09, 16]} position={[0, 0.245, 0]}>
        <Pbr state={state} color="#b88a35" metalness={0.78} roughness={0.3} />
      </Cylinder>
      <Cylinder args={[0.052, 0.052, 0.026, 6]} position={[0, 0.295, 0]}>
        <Pbr state={state} color="#c39a4c" metalness={0.82} roughness={0.26} />
      </Cylinder>
      <Pipe state={state} points={OIL_FEED_PATH} radius={0.012} color="#c49a4b" />

      {/* Coolant hard lines turn into real side ports instead of ending in space. */}
      <Pipe state={state} points={COOLANT_LEFT_PATH} radius={0.013} color="#86b9ca" />
      <Pipe state={state} points={COOLANT_RIGHT_PATH} radius={0.013} color="#86b9ca" />
      {[-1, 1].map((side) => (
        <group key={'coolant-port-' + side}>
          <Cylinder
            args={[0.027, 0.027, 0.055, 16]}
            position={[side * 0.205, 0.225, side * 0.085]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <Pbr state={state} color="#8db7c6" metalness={0.82} roughness={0.3} />
          </Cylinder>
          <Cylinder
            args={[0.035, 0.035, 0.025, 6]}
            position={[side * 0.237, 0.225, side * 0.085]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <Pbr state={state} color="#b5c0c7" metalness={0.88} roughness={0.28} />
          </Cylinder>
        </group>
      ))}

      {/* Bottom oil-return flange and drain stub. */}
      <Box args={[0.19, 0.065, 0.15]} position={[0, -0.185, 0]}>
        <Pbr state={state} color="#3b4249" metalness={0.7} roughness={0.5} />
      </Box>
      <Cylinder args={[0.062, 0.062, 0.12, 20]} position={[0, -0.265, 0]}>
        <Pbr state={state} color="#555f67" metalness={0.8} roughness={0.43} />
      </Cylinder>
      <Cylinder args={[0.075, 0.075, 0.024, 20]} position={[0, -0.325, 0]}>
        <Pbr state={state} color="#8b949c" metalness={0.86} roughness={0.32} />
      </Cylinder>
    </group>
  );
}

export function TurboShaft({ state }: { state: State }) {
  return (
    <group>
      <Cylinder args={[0.018, 0.018, 0.82, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#d4d9de" metalness={0.97} roughness={0.16} />
      </Cylinder>
      <Cylinder args={[0.033, 0.033, 0.055, 24]} position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#737d86" metalness={0.94} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.033, 0.033, 0.055, 24]} position={[0, 0, -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <Pbr state={state} color="#737d86" metalness={0.94} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

export function TurboWastegate({ state }: { state: State }) {
  return (
    <group>
      {/* Mounting saddle and bracket are bolted to the turbine housing. */}
      <Box args={[0.19, 0.035, 0.12]} position={[0, -0.155, -0.045]}>
        <Pbr state={state} color="#4b535a" metalness={0.82} roughness={0.4} />
      </Box>
      <Box args={[0.035, 0.16, 0.11]} position={[-0.065, -0.09, -0.045]}>
        <Pbr state={state} color="#59636b" metalness={0.84} roughness={0.36} />
      </Box>
      <Box args={[0.035, 0.16, 0.11]} position={[0.065, -0.09, -0.045]}>
        <Pbr state={state} color="#59636b" metalness={0.84} roughness={0.36} />
      </Box>

      {/* Pneumatic canister with a rolled end cap and visible seam. */}
      <Cylinder args={[0.073, 0.073, 0.22, 28]} position={[0, 0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#9ba5ad" metalness={0.74} roughness={0.4} />
      </Cylinder>
      <Torus args={[0.069, 0.008, 8, 32]} position={[0.105, 0.035, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Pbr state={state} color="#68737c" metalness={0.84} roughness={0.3} />
      </Torus>
      <Cylinder args={[0.012, 0.012, 0.23, 12]} position={[0.09, -0.14, -0.035]}>
        <Pbr state={state} color="#d0d5d9" metalness={0.96} roughness={0.17} />
      </Cylinder>
      <Sphere args={[0.022, 16, 12]} position={[0.09, -0.255, -0.035]}>
        <Pbr state={state} color="#aab2b9" metalness={0.9} roughness={0.24} />
      </Sphere>

      {/* The rod ends at the wastegate lever / flapper arm on the turbine casting. */}
      <Box args={[0.13, 0.022, 0.035]} position={[0.02, -0.285, -0.085]} rotation={[0, 0, -0.12]}>
        <Pbr state={state} color="#626c74" metalness={0.88} roughness={0.33} />
      </Box>
      <Cylinder args={[0.018, 0.018, 0.045, 12]} position={[-0.035, -0.285, -0.085]}>
        <Pbr state={state} color="#c1c7cc" metalness={0.93} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.012, 0.012, 0.11, 12]} position={[0, -0.17, -0.045]} rotation={[0, 0, Math.PI / 2]}>
        <Pbr state={state} color="#c3cbd1" metalness={0.96} roughness={0.18} />
      </Cylinder>
    </group>
  );
}

export function renderTurboPrecisionComponent(
  objectId: string,
  componentId: string,
  state: State
): React.ReactNode | null {
  if (objectId !== 'turbocharger') return null;

  switch (componentId) {
    case 'turbo_comp': return <TurboCompressorHousing state={state} />;
    case 'turbo_comp_wheel': return <TurboCompressorWheel state={state} />;
    case 'turbo_turb': return <TurboTurbineHousing state={state} />;
    case 'turbo_turb_wheel': return <TurboTurbineWheel state={state} />;
    case 'turbo_center': return <TurboCenterHousing state={state} />;
    case 'turbo_shaft': return <TurboShaft state={state} />;
    case 'turbo_wastegate': return <TurboWastegate state={state} />;
    default: return null;
  }
}
