import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Points } from '@react-three/drei';
import * as THREE from 'three';
import { SystemState } from './App';
import { useGestureEngine } from './GestureContext';
import { useTheatreOrbPresentation } from './theatre/TheatreOrbBridge';

interface HologramProps {
  systemState: SystemState;
  audioLevel: number;
  bass?: number;
  treble?: number;
  hologramIntensity?: number;
  themeColor?: string;
  handTracking?: any;
  isSpatial?: boolean;
  isHome?: boolean;
}

const TAU = Math.PI * 2;

function deterministicRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createParticleCloud(
  count: number,
  minRadius: number,
  maxRadius: number,
  seed: number,
  shellBias = 0.5
): Float32Array {
  const random = deterministicRandom(seed);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);
    const bias = Math.pow(random(), shellBias);
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, bias);
    const wobble = (random() - 0.5) * 0.05;

    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * (radius + wobble);
    positions[i * 3 + 1] = Math.cos(phi) * (radius + wobble);
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * (radius + wobble);
  }
  return positions;
}

interface EjectionCloud {
  geometry: THREE.BufferGeometry;
  origins: Float32Array;
  directions: Float32Array;
  phases: Float32Array;
  speeds: Float32Array;
  sizes: Float32Array;
  fades: Float32Array;
}

function createEjectionCloud(count: number): EjectionCloud {
  const random = deterministicRandom(0xE71C710);
  const geometry = new THREE.BufferGeometry();
  const origins = new Float32Array(count * 3);
  const directions = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const fades = new Float32Array(count);

  // The source regions are intentionally uneven and oblique—no cross-shaped jets or aligned rows.
  const sourceRegions = [
    new THREE.Vector3(0.70, 0.34, 0.62).normalize(),
    new THREE.Vector3(-0.62, 0.50, 0.58).normalize(),
    new THREE.Vector3(0.16, -0.78, 0.60).normalize(),
    new THREE.Vector3(-0.78, -0.32, -0.46).normalize(),
    new THREE.Vector3(0.60, -0.56, -0.48).normalize(),
  ];
  const palette = [
    new THREE.Color('#ff70b5'),
    new THREE.Color('#58baff'),
    new THREE.Color('#ffe7f3'),
    new THREE.Color('#7c8dff'),
    new THREE.Color('#ff9ac9'),
  ];

  for (let i = 0; i < count; i++) {
    const sourceIndex = Math.min(sourceRegions.length - 1, Math.floor(i / (count / sourceRegions.length)));
    const axis = sourceRegions[sourceIndex];
    const reference = Math.abs(axis.y) > 0.82
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(axis, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(axis, tangent).normalize();

    // Wide, overlapping source patches make a billowing halo rather than three straight bead-strings.
    const spreadA = (random() - 0.5) * 0.78;
    const spreadB = (random() - 0.5) * 0.70;
    const origin = axis.clone()
      .addScaledVector(tangent, spreadA)
      .addScaledVector(bitangent, spreadB)
      .normalize()
      .multiplyScalar(0.80 + random() * 0.055);

    const direction = origin.clone().normalize()
      .addScaledVector(tangent, (random() - 0.5) * 0.92)
      .addScaledVector(bitangent, (random() - 0.5) * 0.84)
      .normalize();

    origins.set([origin.x, origin.y, origin.z], i * 3);
    directions.set([direction.x, direction.y, direction.z], i * 3);
    positions.set([origin.x, origin.y, origin.z], i * 3);
    phases[i] = random();
    speeds[i] = THREE.MathUtils.lerp(0.095, 0.175, random());
    sizes[i] = THREE.MathUtils.lerp(0.16, 0.42, random());
    const color = palette[sourceIndex].clone().multiplyScalar(THREE.MathUtils.lerp(0.78, 1.18, random()));
    colors.set([color.r, color.g, color.b], i * 3);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aFade', new THREE.BufferAttribute(fades, 1));
  return { geometry, origins, directions, phases, speeds, sizes, fades };
}

function createGasPlumeGeometry(count: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const random = deterministicRandom(0x6A5F10);
  const segments = 44;
  const acrossSteps = 10;
  const vertexCount = count * (segments + 1) * (acrossSteps + 1);
  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const colors = new Float32Array(vertexCount * 3);
  const seeds = new Float32Array(vertexCount);
  const drifts = new Float32Array(vertexCount * 3);
  const indices: number[] = [];

  const axes = [
    new THREE.Vector3(0.78, 0.26, 0.57),
    new THREE.Vector3(-0.76, 0.36, 0.54),
    new THREE.Vector3(0.12, 0.86, 0.50),
    new THREE.Vector3(-0.22, -0.82, 0.53),
    new THREE.Vector3(0.54, -0.58, 0.61),
    new THREE.Vector3(-0.58, -0.30, 0.76),
    new THREE.Vector3(0.96, -0.10, 0.24),
    new THREE.Vector3(-0.90, 0.06, 0.43),
    new THREE.Vector3(0.42, 0.62, 0.66),
    new THREE.Vector3(-0.36, 0.62, 0.70),
    new THREE.Vector3(0.32, -0.28, 0.90),
    new THREE.Vector3(-0.20, -0.48, 0.85),
  ].map((axis) => axis.normalize());
  const palette = [
    new THREE.Color('#ff70b5'),
    new THREE.Color('#6bc9ff'),
    new THREE.Color('#ffe4f2'),
    new THREE.Color('#ff4f92'),
    new THREE.Color('#75b5ff'),
    new THREE.Color('#f5c8ff'),
    new THREE.Color('#ff91c8'),
    new THREE.Color('#8e9cff'),
    new THREE.Color('#fff0f7'),
    new THREE.Color('#4fbaff'),
    new THREE.Color('#ff7db6'),
    new THREE.Color('#c6b3ff'),
  ];

  for (let plume = 0; plume < count; plume++) {
    const axis = axes[plume % axes.length].clone();
    const reference = Math.abs(axis.y) > 0.82
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3().crossVectors(axis, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(axis, tangent).normalize();
    const planeAngle = random() * TAU;
    const side = tangent.clone().multiplyScalar(Math.cos(planeAngle))
      .addScaledVector(bitangent, Math.sin(planeAngle)).normalize();
    const drift = tangent.clone().multiplyScalar(-Math.sin(planeAngle))
      .addScaledVector(bitangent, Math.cos(planeAngle)).normalize();
    const phase = random() * TAU;
    const width = THREE.MathUtils.lerp(0.15, 0.34, random());
    const length = THREE.MathUtils.lerp(1.45, 2.05, random());
    const bendFrequencyA = THREE.MathUtils.lerp(3.2, 5.7, random());
    const bendFrequencyB = THREE.MathUtils.lerp(3.6, 5.0, random());
    const slopeA = (random() - 0.5) * 0.42;
    const slopeB = (random() - 0.5) * 0.46;
    const color = palette[plume % palette.length];
    const vertexBase = plume * (segments + 1) * (acrossSteps + 1);

    for (let along = 0; along <= segments; along++) {
      const u = along / segments;
      const radius = 0.79 + u * length;
      const bendA = Math.sin(u * bendFrequencyA + phase) * 0.14 * u;
      const bendB = Math.sin(u * bendFrequencyB + phase * 1.7) * 0.105 * u;
      const center = axis.clone().multiplyScalar(radius)
        .addScaledVector(tangent, slopeA * u + bendA)
        .addScaledVector(bitangent, slopeB * u + bendB);
      const body = Math.pow(Math.sin(Math.PI * u), 0.72);
      const plumeWidth = (0.025 + width * body) * (1.0 - 0.25 * u);

      for (let across = 0; across <= acrossSteps; across++) {
        const v = across / acrossSteps;
        const vertex = vertexBase + along * (acrossSteps + 1) + across;
        const lateral = (v - 0.5) * 2.0 * plumeWidth;
        const point = center.clone().addScaledVector(side, lateral);

        positions[vertex * 3] = point.x;
        positions[vertex * 3 + 1] = point.y;
        positions[vertex * 3 + 2] = point.z;
        uvs[vertex * 2] = u;
        uvs[vertex * 2 + 1] = v;
        colors[vertex * 3] = color.r;
        colors[vertex * 3 + 1] = color.g;
        colors[vertex * 3 + 2] = color.b;
        seeds[vertex] = phase / TAU;
        drifts[vertex * 3] = drift.x;
        drifts[vertex * 3 + 1] = drift.y;
        drifts[vertex * 3 + 2] = drift.z;
      }
    }

    for (let along = 0; along < segments; along++) {
      for (let across = 0; across < acrossSteps; across++) {
        const a = vertexBase + along * (acrossSteps + 1) + across;
        const b = a + acrossSteps + 1;
        const c = a + 1;
        const d = b + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createSphereGrid(): Float32Array {
  const points: number[] = [];
  const radius = 1.78;
  const latitudes = 17;
  const longitudes = 26;
  const samples = 96;

  for (let i = 1; i < latitudes; i++) {
    const phi = Math.PI * (i / latitudes);
    for (let j = 0; j < samples; j++) {
      const a0 = TAU * (j / samples);
      const a1 = TAU * ((j + 1) / samples);
      const x0 = radius * Math.sin(phi) * Math.cos(a0);
      const y0 = radius * Math.cos(phi);
      const z0 = radius * Math.sin(phi) * Math.sin(a0);
      const x1 = radius * Math.sin(phi) * Math.cos(a1);
      const y1 = radius * Math.cos(phi);
      const z1 = radius * Math.sin(phi) * Math.sin(a1);
      points.push(x0, y0, z0, x1, y1, z1);
    }
  }

  for (let i = 0; i < longitudes; i++) {
    const theta = TAU * (i / longitudes);
    for (let j = 0; j < samples; j++) {
      const p0 = Math.PI * (j / samples);
      const p1 = Math.PI * ((j + 1) / samples);
      const x0 = radius * Math.sin(p0) * Math.cos(theta);
      const y0 = radius * Math.cos(p0);
      const z0 = radius * Math.sin(p0) * Math.sin(theta);
      const x1 = radius * Math.sin(p1) * Math.cos(theta);
      const y1 = radius * Math.cos(p1);
      const z1 = radius * Math.sin(p1) * Math.sin(theta);
      points.push(x0, y0, z0, x1, y1, z1);
    }
  }

  return new Float32Array(points);
}

function createRadialDataGeometry(): Float32Array {
  const points: number[] = [];
  const random = deterministicRandom(0x51a7);
  const spokes = 44;

  for (let i = 0; i < spokes; i++) {
    const theta = (i / spokes) * TAU + random() * 0.03;
    const phi = Math.acos(2 * random() - 1);
    const inner = 1.35 + random() * 0.25;
    const outer = 2.95 + random() * 1.1;

    const sx = Math.sin(phi) * Math.cos(theta) * inner;
    const sy = Math.cos(phi) * inner;
    const sz = Math.sin(phi) * Math.sin(theta) * inner;

    // Keep each spoke on one perturbed spherical direction; randomizing each axis independently
    // created skewed endpoints that looked like misplaced, broken line fragments.
    const endPhi = THREE.MathUtils.clamp(phi + (random() - 0.5) * 0.12, 0.04, Math.PI - 0.04);
    const endTheta = theta + (random() - 0.5) * 0.12;
    const ex = Math.sin(endPhi) * Math.cos(endTheta) * outer;
    const ey = Math.cos(endPhi) * outer;
    const ez = Math.sin(endPhi) * Math.sin(endTheta) * outer;

    points.push(sx, sy, sz, ex, ey, ez);
  }
  return new Float32Array(points);
}

function createEnergyFilamentGeometry(): Float32Array {
  const points: number[] = [];
  const random = deterministicRandom(0xB17E5);
  const filaments = 110;

  for (let i = 0; i < filaments; i++) {
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);
    const inner = 0.86 + random() * 0.52;
    const outer = 2.25 + random() * 2.35;

    const direction = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize();

    const tangent = new THREE.Vector3(-direction.z, 0.22, direction.x).normalize();
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();
    const wobbleA = (random() - 0.5) * 0.20;
    const wobbleB = (random() - 0.5) * 0.34;
    const wobbleC = (random() - 0.5) * 0.18;

    const start = direction.clone().multiplyScalar(inner);
    const end = direction.clone().multiplyScalar(outer);
    const p1 = start.clone().lerp(end, 0.20)
      .addScaledVector(tangent, wobbleA)
      .addScaledVector(bitangent, wobbleB * 0.40);
    const p2 = start.clone().lerp(end, 0.43)
      .addScaledVector(tangent, wobbleB)
      .addScaledVector(bitangent, wobbleC);
    const p3 = start.clone().lerp(end, 0.68)
      .addScaledVector(tangent, -wobbleA * 1.55)
      .addScaledVector(bitangent, wobbleB * 0.75);
    const p4 = end.clone()
      .addScaledVector(tangent, wobbleC)
      .addScaledVector(bitangent, -wobbleA * 0.55);

    points.push(start.x, start.y, start.z, p1.x, p1.y, p1.z);
    points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    points.push(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z);
    points.push(p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
    points.push(p4.x, p4.y, p4.z, end.x, end.y, end.z);
  }

  return new Float32Array(points);
}

function createSurfaceCircuitGeometry(): Float32Array {
  const points: number[] = [];
  const random = deterministicRandom(0xC1AC7);
  const traces = 150;

  for (let i = 0; i < traces; i++) {
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);
    const radius = 1.82 + random() * 0.16;

    const normal = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize();

    const tangent = new THREE.Vector3(-normal.z, 0.18, normal.x).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    const start = normal.clone().multiplyScalar(radius)
      .addScaledVector(tangent, (random() - 0.5) * 0.34)
      .addScaledVector(bitangent, (random() - 0.5) * 0.22);
    const middle = start.clone()
      .addScaledVector(tangent, THREE.MathUtils.lerp(0.035, 0.14, random()))
      .addScaledVector(bitangent, (random() - 0.5) * 0.08);
    const end = middle.clone()
      .addScaledVector(bitangent, THREE.MathUtils.lerp(0.035, 0.12, random()));

    points.push(start.x, start.y, start.z, middle.x, middle.y, middle.z);
    points.push(middle.x, middle.y, middle.z, end.x, end.y, end.z);
  }

  return new Float32Array(points);
}

function createArcNetwork(): Float32Array {
  const points: number[] = [];
  const random = deterministicRandom(0xA71F);
  const arcCount = 3;
  const segmentsPerArc = 22;

  // Build a handful of smooth, continuous orbital fragments instead of disconnected random chords.
  for (let arc = 0; arc < arcCount; arc++) {
    const radius = 2.24 + arc * 0.18;
    const tilt = [
      (random() - 0.5) * 0.82,
      (random() - 0.5) * 0.92,
      (random() - 0.5) * 1.05,
    ] as [number, number, number];
    const euler = new THREE.Euler(...tilt);
    const start = random() * TAU;
    const span = THREE.MathUtils.lerp(0.48, 1.08, random());
    let previous: THREE.Vector3 | null = null;

    for (let segment = 0; segment <= segmentsPerArc; segment++) {
      const angle = start + span * (segment / segmentsPerArc);
      const point = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.sin(angle * 1.4 + arc * 0.85) * 0.035,
      ).applyEuler(euler);

      if (previous) points.push(previous.x, previous.y, previous.z, point.x, point.y, point.z);
      previous = point;
    }
  }

  return new Float32Array(points);
}

export function HologramCore({
  systemState,
  audioLevel,
  bass = 0,
  treble = 0,
  hologramIntensity = 1,
  themeColor: _themeColor = '#e20246',
  handTracking: _handTracking,
  isSpatial = false,
  isHome = false
}: HologramProps) {
  const gestureState = useGestureEngine();
  const theatrePresentationRef = useTheatreOrbPresentation(!isSpatial);

  const groupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const nucleusGlowRef = useRef<THREE.Mesh>(null);
  const gasWispsRef = useRef<THREE.Mesh>(null);
  const gasFlowRef = useRef<THREE.Mesh>(null);
  const innerShellRef = useRef<THREE.Mesh>(null);
  const outerShellRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const orbitalRef = useRef<THREE.Group>(null);
  const waveRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const radialRef = useRef<THREE.LineSegments>(null);
  const arcRef = useRef<THREE.LineSegments>(null);
  const circuitRef = useRef<THREE.LineSegments>(null);
  const filamentRef = useRef<THREE.LineSegments>(null);
  const arcOrbitRef = useRef<THREE.Group>(null);
  const outerParticlesRef = useRef<THREE.Points>(null);
  const ejectionRef = useRef<THREE.Points>(null);
  const waveformRefs = useRef<Array<THREE.LineLoop | null>>([]);
  const spatialTransitionRef = useRef(0);
  const smoothedBassRef = useRef(0);
  const smoothedTrebleRef = useRef(0);
  const eventPulseRef = useRef(0);
  const previousStateRef = useRef<SystemState>(systemState);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);

  const sphereGrid = useMemo(() => createSphereGrid(), []);
  const radialData = useMemo(() => createRadialDataGeometry(), []);
  const arcNetwork = useMemo(() => createArcNetwork(), []);
  const surfaceCircuit = useMemo(() => createSurfaceCircuitGeometry(), []);
  const energyFilaments = useMemo(() => createEnergyFilamentGeometry(), []);
  // Keep star points outside the gas sphere so they read as distant stars, not specks buried in the core.
  const outerParticles = useMemo(() => createParticleCloud(56, 3.15, 4.35, 0xc7f5ff, 0.58), []);
  // Wide translucent ribbons carry the gas motion; fewer point sprites remain only as glowing condensates.
  const ejectionCloud = useMemo(() => createEjectionCloud(84), []);
  const gasPlumeGeometry = useMemo(() => createGasPlumeGeometry(12), []);

  const pointsCount = 192;
  const initialWavePoints = useMemo(() => {
    const arr = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const a = (i / pointsCount) * TAU;
      arr[i * 3] = Math.cos(a) * 2.1;
      arr[i * 3 + 1] = Math.sin(a) * 2.1;
    }
    return arr;
  }, []);

  const ringConfigs = useMemo(() => [
    { radius: 1.96, tube: 0.010, rotation: [0.28, 0.16, 0.08] as [number, number, number], opacity: 0.40 },
    { radius: 2.68, tube: 0.006, rotation: [0.92, -0.35, 0.52] as [number, number, number], opacity: 0.18 },
  ], []);

  // The UI stays industrial red/black; the Core follows the reference's rose, blue, cyan and warm-star palette.
  const colors = useMemo(() => ({
    core: new THREE.Color('#08091f'),
    technical: new THREE.Color('#429eff'),
    plasma: new THREE.Color('#ff477f'),
    hot: new THREE.Color('#fff0f5'),
    warm: new THREE.Color('#f2bd83'),
  }), []);

  const materials = useMemo(() => ({
    // A lit, procedural nebula surface: actual spherical depth with animated gas filaments.
    core: new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVoice: { value: 0 },
        uActivity: { value: 0 },
        uOpacity: { value: 1 },
      },
      vertexShader: [
        "varying vec3 vNormalView;",
        "varying vec3 vViewPosition;",
        "varying vec3 vObjectPosition;",
        "void main() {",
        "  vObjectPosition = position;",
        "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
        "  vViewPosition = -mvPosition.xyz;",
        "  vNormalView = normalize(normalMatrix * normal);",
        "  gl_Position = projectionMatrix * mvPosition;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime;",
        "uniform float uVoice;",
        "uniform float uActivity;",
        "uniform float uOpacity;",
        "varying vec3 vNormalView;",
        "varying vec3 vViewPosition;",
        "varying vec3 vObjectPosition;",
        "float hash31(vec3 p) {",
        "  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));",
        "  p *= 17.0;",
        "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
        "}",
        "float noise3(vec3 p) {",
        "  vec3 i = floor(p);",
        "  vec3 f = fract(p);",
        "  f = f * f * (3.0 - 2.0 * f);",
        "  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));",
        "  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));",
        "  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));",
        "  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));",
        "  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));",
        "  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));",
        "  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));",
        "  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));",
        "  float z0 = mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y);",
        "  float z1 = mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y);",
        "  return mix(z0, z1, f.z);",
        "}",
        "float fbm(vec3 p) {",
        "  float value = 0.0;",
        "  float amplitude = 0.5;",
        "  for (int i = 0; i < 4; i++) {",
        "    value += amplitude * noise3(p);",
        "    p = p * 2.03 + 17.17;",
        "    amplitude *= 0.5;",
        "  }",
        "  return value;",
        "}",
        "void main() {",
        "  vec3 p = normalize(vObjectPosition);",
        "  vec3 drift = vec3(uTime * 0.035, -uTime * 0.021, uTime * 0.028);",
        "  vec3 warp = vec3(",
        "    fbm(p * 2.6 + drift),",
        "    fbm(p * 2.6 + vec3(7.3, 1.7, -2.4) - drift),",
        "    fbm(p * 2.6 + vec3(-4.1, 8.2, 3.6) + drift)",
        "  );",
        "  float cloud = fbm(p * 3.15 + (warp - 0.5) * 1.9 + drift);",
        "  float detail = fbm(p * 5.45 + (warp - 0.5) * 2.1 - drift);",
        "  float clouds = smoothstep(0.30, 0.68, cloud * 0.76 + detail * 0.24);",
        "  float pink = smoothstep(0.34, 0.67, warp.x * 0.60 + cloud * 0.40);",
        "  float blue = smoothstep(0.34, 0.67, warp.z * 0.56 + cloud * 0.44);",
        "  float gold = smoothstep(0.61, 0.82, warp.y * 0.58 + detail * 0.42);",
        "  float hotCloud = pow(smoothstep(0.48, 0.70, cloud * 0.68 + detail * 0.32), 1.5) * clouds;",
        "  float filaments = pow(1.0 - abs(sin((cloud * 1.15 + detail * 0.30 + warp.y * 0.22) * 7.4)), 4.8);",
        "  filaments *= smoothstep(0.40, 0.64, cloud);",
        "  vec3 deep = vec3(0.008, 0.009, 0.027);",
        "  vec3 indigo = vec3(0.045, 0.055, 0.19);",
        "  vec3 rose = vec3(1.0, 0.055, 0.30);",
        "  vec3 hotRose = vec3(1.0, 0.24, 0.52);",
        "  vec3 nebulaBlue = vec3(0.10, 0.36, 1.0);",
        "  vec3 cyanGas = vec3(0.27, 0.78, 1.0);",
        "  vec3 col = mix(deep, indigo, 0.24 + clouds * 0.54);",
        "  col = mix(col, nebulaBlue, blue * (0.22 + clouds * 0.30));",
        "  col = mix(col, rose, pink * (0.24 + clouds * 0.38));",
        "  col = mix(col, hotRose, hotCloud * 0.44);",
        "  col = mix(col, vec3(1.0, 0.68, 0.83), hotCloud * 0.26);",
        "  col += cyanGas * pow(blue, 1.45) * clouds * 0.20;",
        "  col += vec3(1.0, 0.82, 0.91) * pow(smoothstep(0.60, 0.82, detail), 2.0) * clouds * 0.20;",
        "  col += vec3(1.0, 0.35, 0.16) * gold * clouds * 0.07;",
        "  col += mix(vec3(0.20, 0.62, 1.0), vec3(1.0, 0.20, 0.48), pink) * filaments * (0.12 + uActivity * 0.10 + uVoice * 0.08);",
        "  float gasSpark = pow(smoothstep(0.62, 0.88, detail), 2.4) * smoothstep(0.38, 0.66, cloud);",
        "  col += cyanGas * gasSpark * 0.32;",
        "  vec3 normal = normalize(vNormalView);",
        "  vec3 viewDir = normalize(vViewPosition);",
        "  float diffuse = 0.70 + 0.30 * max(dot(normal, normalize(vec3(-0.35, 0.5, 1.0))), 0.0);",
        "  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);",
        "  col *= 0.78 + diffuse * 0.52;",
        "  col += vec3(0.10, 0.29, 0.92) * rim * (0.46 + uActivity * 0.20);",
        "  col += vec3(0.98, 0.10, 0.38) * pow(rim, 3.4) * (0.22 + uActivity * 0.10);",
        "  col += vec3(0.20, 0.66, 1.0) * pow(rim, 5.0) * (0.58 + uVoice * 0.38);",
        "  col *= 1.20 + uVoice * 0.22 + uActivity * 0.06;",
        "  gl_FragColor = vec4(col, uOpacity);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
    gasWisps: new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActivity: { value: 0 },
        uVoice: { value: 0 },
      },
      vertexShader: [
        "varying vec3 vObjectPosition;",
        "varying vec3 vNormalView;",
        "varying vec3 vViewPosition;",
        "void main() {",
        "  vObjectPosition = position;",
        "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
        "  vNormalView = normalize(normalMatrix * normal);",
        "  vViewPosition = -mvPosition.xyz;",
        "  gl_Position = projectionMatrix * mvPosition;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime;",
        "uniform float uActivity;",
        "uniform float uVoice;",
        "varying vec3 vObjectPosition;",
        "varying vec3 vNormalView;",
        "varying vec3 vViewPosition;",
        "float hash31(vec3 p) {",
        "  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));",
        "  p *= 17.0;",
        "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
        "}",
        "float noise3(vec3 p) {",
        "  vec3 i = floor(p);",
        "  vec3 f = fract(p);",
        "  f = f * f * (3.0 - 2.0 * f);",
        "  float a = mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x);",
        "  float b = mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x);",
        "  float c = mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x);",
        "  float d = mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x);",
        "  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);",
        "}",
        "float fbm(vec3 p) {",
        "  float result = 0.0;",
        "  float amplitude = 0.5;",
        "  for (int i = 0; i < 4; i++) {",
        "    result += amplitude * noise3(p);",
        "    p = p * 2.02 + 13.17;",
        "    amplitude *= 0.5;",
        "  }",
        "  return result;",
        "}",
        "void main() {",
        "  vec3 p = normalize(vObjectPosition);",
        "  vec3 drift = vec3(uTime * 0.045, -uTime * 0.032, uTime * 0.038);",
        "  vec3 warp = vec3(fbm(p * 2.0 + drift), fbm(p * 2.0 + vec3(4.1, -3.2, 2.6) - drift), fbm(p * 2.0 + vec3(-2.4, 5.2, 3.6) + drift));",
        "  float cloud = fbm(p * 3.3 + (warp - 0.5) * 2.0 + drift);",
        "  float detail = fbm(p * 5.8 + (warp - 0.5) * 2.5 - drift);",
        "  float field = cloud * 0.72 + detail * 0.28;",
        "  float cloudPatch = smoothstep(0.515, 0.635, field) * (1.0 - smoothstep(0.77, 0.90, field) * 0.42);",
        "  float threads = pow(1.0 - abs(sin((cloud * 1.15 + detail * 0.32 + warp.y * 0.28) * 7.8)), 4.4) * smoothstep(0.46, 0.62, cloud);",
        "  float edge = pow(1.0 - max(dot(normalize(vNormalView), normalize(vViewPosition)), 0.0), 2.2);",
        "  float density = clamp(cloudPatch * 0.32 + threads * 0.075, 0.0, 0.17);",
        "  density *= 0.32 + edge * 0.64;",
        "  if (density < 0.018) discard;",
        "  vec3 rose = vec3(1.0, 0.18, 0.48);",
        "  vec3 cyan = vec3(0.28, 0.76, 1.0);",
        "  vec3 whitePink = vec3(1.0, 0.78, 0.88);",
        "  float hue = smoothstep(0.36, 0.64, warp.x * 0.62 + detail * 0.38);",
        "  vec3 color = mix(cyan, rose, hue);",
        "  color = mix(color, whitePink, pow(smoothstep(0.60, 0.79, detail), 2.0) * 0.48);",
        "  color += vec3(0.24, 0.36, 1.0) * threads * 0.20;",
        "  float voiceGlow = 0.88 + uVoice * 0.18 + uActivity * 0.10;",
        "  gl_FragColor = vec4(color * voiceGlow, density);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
    gasFlow: new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActivity: { value: 0 },
        uVoice: { value: 0 },
      },
      vertexShader: [
        "attribute vec3 aColor;",
        "attribute float aSeed;",
        "attribute vec3 aDrift;",
        "uniform float uTime;",
        "uniform float uActivity;",
        "uniform float uVoice;",
        "varying vec2 vUv;",
        "varying vec3 vColor;",
        "varying float vSeed;",
        "varying float vFlow;",
        "void main() {",
        "  vUv = uv;",
        "  vColor = aColor;",
        "  vSeed = aSeed;",
        "  float along = uv.x;",
        "  float across = uv.y * 2.0 - 1.0;",
        "  float envelope = sin(3.14159265 * along);",
        "  float energy = 0.42 + uActivity * 0.24 + uVoice * 0.18;",
        "  float broad = sin(along * 5.6 - uTime * (0.48 + uActivity * 0.16) + aSeed * 6.2831853 + sin(along * 3.1 + aSeed * 4.2) * 1.35);",
        "  float fine = sin(along * 14.0 + uTime * 0.25 + aSeed * 15.0 + across * 2.1);",
        "  float crossFlow = sin(along * 8.6 - uTime * 0.19 + aSeed * 9.0 + across * 4.0);",
        "  vec3 p = position;",
        "  float sway = (broad * 0.042 + fine * 0.012 + crossFlow * 0.009) * envelope * energy;",
        "  p += aDrift * sway * (0.35 + along * 1.2);",
        "  p += normalize(position) * crossFlow * across * 0.007 * envelope * energy;",
        "  vFlow = broad * 0.42 + fine * 0.25 + crossFlow * 0.33;",
        "  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mvPosition;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime;",
        "uniform float uActivity;",
        "uniform float uVoice;",
        "varying vec2 vUv;",
        "varying vec3 vColor;",
        "varying float vSeed;",
        "varying float vFlow;",
        "float hash21(vec2 p) {",
        "  p = fract(p * vec2(123.34, 456.21));",
        "  p += dot(p, p + 45.32);",
        "  return fract(p.x * p.y);",
        "}",
        "float noise21(vec2 p) {",
        "  vec2 i = floor(p);",
        "  vec2 f = fract(p);",
        "  f = f * f * (3.0 - 2.0 * f);",
        "  float a = hash21(i);",
        "  float b = hash21(i + vec2(1.0, 0.0));",
        "  float c = hash21(i + vec2(0.0, 1.0));",
        "  float d = hash21(i + vec2(1.0, 1.0));",
        "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
        "}",
        "float fbm21(vec2 p) {",
        "  float value = 0.0;",
        "  float amplitude = 0.5;",
        "  for (int i = 0; i < 4; i++) {",
        "    value += amplitude * noise21(p);",
        "    p = p * 2.03 + 13.7;",
        "    amplitude *= 0.5;",
        "  }",
        "  return value;",
        "}",
        "void main() {",
        "  float u = vUv.x;",
        "  float across = abs(vUv.y * 2.0 - 1.0);",
        "  float softEdge = pow(max(0.0, 1.0 - across), 1.65);",
        "  float life = smoothstep(0.0, 0.09, u) * (1.0 - smoothstep(0.82, 1.0, u));",
        "  vec2 flow = vec2(u * 2.9 - uTime * (0.12 + uActivity * 0.03), vUv.y * 2.4 + sin(u * 4.4 - uTime * 0.22 + vSeed * 8.0) * 0.22);",
        "  float warp = fbm21(flow * 0.72 + vec2(vSeed * 3.1, -uTime * 0.03));",
        "  float cloud = fbm21(flow + vec2(warp * 0.75, -warp * 0.48) + vec2(0.0, uTime * 0.06));",
        "  float fine = fbm21(flow * 2.35 + vec2(-uTime * 0.14, vSeed * 4.0));",
        "  float micro = fbm21(flow * 4.6 + vec2(uTime * 0.19, vSeed * 9.0));",
        "  float field = cloud * 0.48 + fine * 0.34 + micro * 0.18;",
        "  float cloudBody = smoothstep(0.32, 0.68, field);",
        "  float flowWave = sin(u * 21.0 - uTime * (0.48 + uActivity * 0.12) + vSeed * 6.2831853 + sin(u * 8.0 + vSeed * 7.0) * 1.3 + vUv.y * 3.6);",
        "  float filamentPattern = pow(max(0.0, 1.0 - abs(sin((field * 1.4 + fine * 0.5 + vSeed * 0.12 + flowWave * 0.035) * 8.0))), 3.0);",
        "  float wispyMask = smoothstep(0.16, 0.66, field * 0.72 + cloud * 0.28 + flowWave * 0.055 + vFlow * 0.035);",
        "  float density = softEdge * life * (0.045 + cloudBody * 0.22 + filamentPattern * 0.11);",
        "  density *= (0.36 + wispyMask * 0.64) * (0.74 + uActivity * 0.16 + uVoice * 0.12);",
        "  if (density < 0.014) discard;",
        "  vec3 cyan = vec3(0.24, 0.72, 1.0);",
        "  vec3 pearl = vec3(1.0, 0.82, 0.92);",
        "  float blueMist = smoothstep(0.35, 0.68, fine + vColor.b * 0.22 + vFlow * 0.04);",
        "  float hotMist = pow(smoothstep(0.56, 0.84, cloud * 0.6 + fine * 0.4), 2.0);",
        "  vec3 gasColor = mix(vColor, cyan, blueMist * 0.34);",
        "  gasColor = mix(gasColor, pearl, hotMist * 0.30);",
        "  gasColor *= 0.92 + cloudBody * 0.12 + filamentPattern * 0.08;",
        "  gl_FragColor = vec4(gasColor * (1.05 + uActivity * 0.12 + uVoice * 0.08), min(density, 0.24));",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    coreGlow: new THREE.MeshBasicMaterial({ color: '#ff477f', transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }),
    shellInner: new THREE.MeshBasicMaterial({ color: '#a7ddff', transparent: true, opacity: 0.025, wireframe: true, blending: THREE.NormalBlending, depthWrite: false }),
    shellOuter: new THREE.MeshBasicMaterial({ color: '#4c2a92', transparent: true, opacity: 0.025, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    halo: new THREE.MeshBasicMaterial({ color: '#2869e8', transparent: true, opacity: 0.038, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }),
    grid: new THREE.LineBasicMaterial({ color: '#5d9de8', transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }),
    radial: new THREE.LineBasicMaterial({ color: '#49bdff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false }),
    arc: new THREE.LineBasicMaterial({ color: '#ffc4df', transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false }),
    circuit: new THREE.LineBasicMaterial({ color: '#4f9dff', transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }),
    ring: ringConfigs.map((r, index) => new THREE.MeshBasicMaterial({
      color: index === 1 ? '#ff6fa8' : index === 0 ? '#62b8ff' : '#d9f5ff', transparent: true, opacity: r.opacity * 0.82,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })),
    wave: [
      new THREE.LineBasicMaterial({ color: '#e2f7ff', transparent: true, opacity: 0.64, blending: THREE.AdditiveBlending, depthWrite: false }),
      new THREE.LineBasicMaterial({ color: '#ff79b0', transparent: true, opacity: 0.56, blending: THREE.AdditiveBlending, depthWrite: false }),
      new THREE.LineBasicMaterial({ color: '#56aaff', transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }),
    ],
    particles: new THREE.PointsMaterial({ color: '#fff0c7', transparent: true, opacity: 0.42, size: 0.026, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    midParticles: new THREE.PointsMaterial({ color: '#ff5c98', transparent: true, opacity: 0.18, size: 0.010, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    innerParticles: new THREE.PointsMaterial({ color: '#449eff', transparent: true, opacity: 0.18, size: 0.009, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    microParticles: new THREE.PointsMaterial({ color: '#d7f5ff', transparent: true, opacity: 0.16, size: 0.007, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    ejection: new THREE.ShaderMaterial({
      uniforms: {
        uActivity: { value: 0 },
        uVoice: { value: 0 },
      },
      vertexShader: [
        "attribute float aSize;",
        "attribute vec3 aColor;",
        "attribute float aFade;",
        "uniform float uActivity;",
        "uniform float uVoice;",
        "varying vec3 vColor;",
        "varying float vFade;",
        "void main() {",
        "  vColor = aColor;",
        "  vFade = aFade;",
        "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
        "  gl_Position = projectionMatrix * mvPosition;",
        "  gl_PointSize = clamp(aSize * (300.0 / max(1.0, -mvPosition.z)) * (1.0 + uActivity * 0.08 + uVoice * 0.08), 2.4, 8.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "varying vec3 vColor;",
        "varying float vFade;",
        "void main() {",
        "  float distanceFromCenter = length(gl_PointCoord - vec2(0.5));",
        "  float hotCenter = 1.0 - smoothstep(0.02, 0.22, distanceFromCenter);",
        "  float softHalo = 1.0 - smoothstep(0.06, 0.5, distanceFromCenter);",
        "  float alpha = (hotCenter * 0.50 + softHalo * 0.26) * vFade;",
        "  if (alpha < 0.012) discard;",
        "  gl_FragColor = vec4(vColor * (0.64 + hotCenter * 1.20), alpha);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  }), [ringConfigs]);

  useEffect(() => {
    // Keep the gas rose-forward, with blue/cyan edges and warm distant stars.
    const base = colors.technical.clone();
    materials.coreGlow.color.copy(colors.plasma.clone().lerp(colors.technical, 0.12));
    materials.halo.color.copy(base.clone().lerp(colors.plasma, 0.18));
    materials.grid.color.copy(base.clone().lerp(colors.hot, 0.12));
    materials.radial.color.copy(new THREE.Color('#49bdff'));
    materials.arc.color.copy(colors.hot);
    materials.circuit.color.copy(base.clone().lerp(colors.hot, 0.22));
    const ringColors = [colors.technical, colors.plasma, colors.hot];
    materials.ring.forEach((m, index) => m.color.copy(ringColors[index % ringColors.length]));
    materials.wave[1].color.copy(colors.plasma);
    materials.wave[2].color.copy(colors.technical);
    materials.innerParticles.color.copy(colors.technical);
    materials.midParticles.color.copy(colors.plasma);
    materials.particles.color.copy(colors.warm);
    materials.microParticles.color.copy(colors.hot);
  }, [systemState, materials, colors]);

  useEffect(() => () => {
    ejectionCloud.geometry.dispose();
    gasPlumeGeometry.dispose();
    Object.values(materials).forEach((material) => {
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material.dispose();
    });
  }, [materials]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (previousStateRef.current !== systemState) {
      previousStateRef.current = systemState;
      eventPulseRef.current = 1;
    }
    eventPulseRef.current = THREE.MathUtils.damp(eventPulseRef.current, 0, 4.8, delta);

    const spatialTarget = isSpatial ? 1 : 0;
    spatialTransitionRef.current = THREE.MathUtils.damp(spatialTransitionRef.current, spatialTarget, 6, delta);
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.012, 1 - spatial);
    const opacityFactor = Math.max(0.03, 1 - spatial * 0.97);

    const curEnergy = gestureState.energy.current;
    const momentum = Math.min(1, (Math.abs(gestureState.rot.x) + Math.abs(gestureState.rot.y)) * 0.1);
    const targetBass = bass + curEnergy * 0.5 + (systemState === 'THINKING' ? 0.18 : 0) + (systemState === 'SEARCHING' ? 0.25 : 0);
    const targetTreble = treble + curEnergy * 0.3 + (systemState === 'SEARCHING' ? 0.14 : 0) + (systemState === 'ANALYZING' ? 0.11 : 0);

    smoothedBassRef.current = THREE.MathUtils.damp(smoothedBassRef.current, Math.max(0, targetBass), 7, delta);
    smoothedTrebleRef.current = THREE.MathUtils.damp(smoothedTrebleRef.current, Math.max(0, targetTreble), 8, delta);

    let stateActivity = 0.16;
    let stateSpeed = 0.72;
    if (systemState === 'LISTENING') { stateActivity = 0.64; stateSpeed = 1.0; }
    if (systemState === 'THINKING') { stateActivity = 0.94; stateSpeed = 1.8; }
    if (systemState === 'SEARCHING') { stateActivity = 1.0; stateSpeed = 2.25; }
    if (systemState === 'ANALYZING') { stateActivity = 0.92; stateSpeed = 1.55; }
    if (systemState === 'SPEAKING') { stateActivity = 0.8; stateSpeed = 1.15; }
    if (systemState === 'ERROR') { stateActivity = 0.92; stateSpeed = 1.7; }

    const idleBass = systemState === 'BOOTING' ? 0 : 0.03 + 0.06 * (0.5 + 0.5 * Math.sin(time * (systemState === 'ONLINE' ? 1.35 : 2.5)));
    const idleTreble = systemState === 'BOOTING' ? 0 : 0.01 + 0.03 * (0.5 + 0.5 * Math.sin(time * (systemState === 'SEARCHING' ? 18 : 9)));
    const curBass = Math.max(idleBass, smoothedBassRef.current + momentum * 0.55);
    const curTreble = Math.max(idleTreble, smoothedTrebleRef.current + momentum * 0.35);

    const micVoice = THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35);
    const voice = THREE.MathUtils.clamp(
      Math.max(micVoice, systemState === 'SPEAKING' ? 0.55 : systemState === 'LISTENING' ? 0.18 : 0),
      0,
      1,
    );
    const activity = THREE.MathUtils.clamp(curBass * 0.95 + curTreble * 0.5 + stateActivity * 0.3 + voice * 0.65, 0, 1.7);
    materials.core.uniforms.uTime.value = time;
    materials.core.uniforms.uVoice.value = voice;
    materials.core.uniforms.uActivity.value = activity;
    materials.gasWisps.uniforms.uTime.value = time;
    materials.gasWisps.uniforms.uVoice.value = voice;
    materials.gasWisps.uniforms.uActivity.value = activity;
    materials.gasFlow.uniforms.uTime.value = time;
    materials.gasFlow.uniforms.uVoice.value = voice;
    materials.gasFlow.uniforms.uActivity.value = activity;
    materials.core.uniforms.uOpacity.value = Math.min(1, (0.88 + voice * 0.12 + eventPulseRef.current * 0.08) * hologramIntensity) * opacityFactor;

    const theatre = theatrePresentationRef.current;
    const authoredBreath = 1 + (theatre.breathing - 0.5) * 0.075;
    const authoredCore = theatre.coreScale * (1 + curBass * 0.22 + voice * 0.08);
    const authoredShell = theatre.shellScale * (1 + curTreble * 0.12);
    const authoredRings = theatre.ringSpread * (1 + curBass * 0.18);
    const authoredSpeed = Math.max(0.08, theatre.ringSpeed * stateSpeed);
    const technicalOpacity = THREE.MathUtils.clamp(theatre.technicalOpacity + activity * 0.08, 0, 1);
    const gridControl = THREE.MathUtils.clamp(theatre.gridOpacity + activity * 0.05, 0, 1.2);
    const radialControl = THREE.MathUtils.clamp(theatre.radialIntensity + curTreble * 0.12, 0, 1.5);
    const arcControl = THREE.MathUtils.clamp(theatre.arcIntensity + activity * 0.08, 0, 1.5);
    const microControl = THREE.MathUtils.clamp(theatre.microEnergy + voice * 0.18 + curTreble * 0.16, 0, 1.5);
    const depthControl = THREE.MathUtils.clamp(theatre.depthActivity + activity * 0.08, 0, 1);
    const circuitControl = THREE.MathUtils.clamp(theatre.circuitOpacity + depthControl * 0.1, 0, 1.4);
    const scanSpeed = Math.max(0.08, theatre.scanSpeed * (0.7 + authoredSpeed * 0.45));

    bootProgressRef.current = THREE.MathUtils.damp(bootProgressRef.current, systemState === 'BOOTING' ? 0 : 1, 4.5, delta);
    const boot = bootProgressRef.current;

    if (groupRef.current) {
      groupRef.current.position.set(isHome ? 0 : gestureState.pos.x, isHome ? 0 : gestureState.pos.y, 0);
      groupRef.current.rotation.set(gestureState.rot.x, gestureState.rot.y, gestureState.rot.z);
      groupRef.current.scale.setScalar(
        Math.max(0.001, 1.4 * boot * hologramIntensity * gestureState.scale.current * authoredBreath * (1 + curBass * 0.12))
      );
    }

    if (nucleusRef.current) {
      nucleusRef.current.rotation.y += delta * (0.12 + curTreble * 0.38);
      nucleusRef.current.rotation.x -= delta * (0.045 + curBass * 0.07);
      nucleusRef.current.scale.setScalar(authoredCore * (0.99 + (Math.sin(time * 1.35) * 0.018)) * collapse);
      materials.core.uniforms.uOpacity.value = Math.min(1, (0.92 + voice * 0.08 + eventPulseRef.current * 0.04) * hologramIntensity) * opacityFactor;
    }

    if (gasWispsRef.current) {
      gasWispsRef.current.rotation.y += delta * (0.055 + curTreble * 0.055);
      gasWispsRef.current.rotation.x -= delta * (0.025 + curBass * 0.025);
      gasWispsRef.current.scale.setScalar((1.0 + curBass * 0.018 + voice * 0.012) * collapse);
    }

    if (gasFlowRef.current) {
      gasFlowRef.current.rotation.y += delta * (0.035 + curTreble * 0.025);
      gasFlowRef.current.rotation.z -= delta * (0.018 + curBass * 0.016);
      gasFlowRef.current.scale.setScalar((1.0 + curBass * 0.025 + voice * 0.018) * collapse);
    }

    if (nucleusGlowRef.current) {
      nucleusGlowRef.current.scale.setScalar((1.015 + curBass * 0.035 + voice * 0.025) * collapse);
      materials.coreGlow.opacity = Math.min(0.15, (0.035 + activity * 0.018 + voice * 0.035 + theatre.halo * 0.012) * hologramIntensity) * opacityFactor;
    }

    if (innerShellRef.current) {
      innerShellRef.current.rotation.x += delta * 0.18 * authoredSpeed;
      innerShellRef.current.rotation.y -= delta * 0.28 * authoredSpeed;
      innerShellRef.current.rotation.z += delta * 0.13 * authoredSpeed;
      innerShellRef.current.scale.setScalar(1.12 * authoredShell * collapse);
      // A faint geodesic glint gives depth without drawing a cage across the nebula's brightest clouds.
      materials.shellInner.opacity = (0.008 + technicalOpacity * 0.012 + curTreble * 0.006 + momentum * 0.004) * opacityFactor;
    }

    if (outerShellRef.current) {
      outerShellRef.current.rotation.x -= delta * 0.12 * authoredSpeed;
      outerShellRef.current.rotation.y += delta * 0.19 * authoredSpeed;
      outerShellRef.current.rotation.z -= delta * 0.09 * authoredSpeed;
      outerShellRef.current.scale.setScalar(1.33 * authoredShell * collapse);
      materials.shellOuter.opacity = (0.015 + technicalOpacity * 0.025 + curBass * 0.025) * opacityFactor;
    }

    if (haloRef.current) {
      haloRef.current.scale.setScalar((1.34 + theatre.halo * 0.22 + curBass * 0.08) * collapse);
      materials.halo.opacity = (0.022 + theatre.halo * 0.03 + voice * 0.055 + activity * 0.015) * opacityFactor;
    }

    if (orbitalRef.current) {
      orbitalRef.current.scale.setScalar(authoredRings * collapse);
      orbitalRef.current.rotation.x += delta * 0.085 * authoredSpeed;
      orbitalRef.current.rotation.y -= delta * 0.14 * authoredSpeed;
      orbitalRef.current.rotation.z += delta * 0.03 * authoredSpeed;
      orbitalRef.current.children.forEach((child, index) => {
        child.rotation.z += delta * authoredSpeed * (index % 2 === 0 ? 0.22 : -0.16);
        child.rotation.x += delta * authoredSpeed * (index % 3 === 0 ? 0.05 : -0.027);
        materials.ring[index].opacity = Math.min(
          0.86,
          ringConfigs[index].opacity + curBass * 0.25 + voice * 0.18 + activity * 0.06
        ) * opacityFactor;
      });
    }

    if (gridRef.current) {
      gridRef.current.rotation.x = time * 0.045 * authoredSpeed;
      gridRef.current.rotation.y = -time * 0.065 * authoredSpeed;
      gridRef.current.rotation.z = time * 0.025 * authoredSpeed;
      gridRef.current.scale.setScalar((0.95 + theatre.ringSpread * 0.09 + curBass * 0.05) * collapse);
      materials.grid.opacity = (0.025 + gridControl * 0.34 + curTreble * 0.08) * opacityFactor;
    }

    if (radialRef.current) {
      radialRef.current.rotation.x -= delta * 0.045 * authoredSpeed;
      radialRef.current.rotation.y += delta * 0.075 * authoredSpeed;
      radialRef.current.rotation.z += delta * 0.02;
      radialRef.current.scale.setScalar((0.92 + theatre.ringSpread * 0.08) * collapse);
      materials.radial.opacity = (0.04 + radialControl * 0.52 + curTreble * 0.22) * opacityFactor;
    }

    if (arcRef.current) {
      arcRef.current.rotation.x += delta * 0.035 * authoredSpeed;
      arcRef.current.rotation.y -= delta * 0.11 * authoredSpeed;
      arcRef.current.rotation.z += delta * 0.018 * (1 + curBass);
      arcRef.current.scale.setScalar((0.94 + theatre.ringSpread * 0.1 + activity * 0.035) * collapse);
      materials.arc.opacity = (0.08 + arcControl * 0.62 + curTreble * 0.25 + voice * 0.08) * opacityFactor;
    }

    if (filamentRef.current) {
      filamentRef.current.rotation.y -= delta * 0.10 * scanSpeed;
      filamentRef.current.rotation.z += delta * 0.018;
      filamentRef.current.scale.setScalar((0.96 + activity * 0.05) * collapse);
      materials.radial.opacity = (0.07 + radialControl * 0.58 + curTreble * 0.28) * opacityFactor;
    }

    if (circuitRef.current) {
      circuitRef.current.rotation.x -= delta * 0.11 * scanSpeed;
      circuitRef.current.rotation.y += delta * 0.08 * scanSpeed;
      circuitRef.current.rotation.z += delta * 0.025;
      circuitRef.current.scale.setScalar((0.99 + depthControl * 0.06) * collapse);
      materials.circuit.opacity = (0.05 + circuitControl * 0.3 + curTreble * 0.2) * opacityFactor;
    }

    if (arcOrbitRef.current) {
      arcOrbitRef.current.rotation.y += delta * 0.18 * scanSpeed;
      arcOrbitRef.current.rotation.x -= delta * 0.045 * scanSpeed;
      arcOrbitRef.current.children.forEach((child, index) => {
        child.rotation.z += delta * scanSpeed * (index % 2 === 0 ? 0.26 : -0.2);
        child.scale.setScalar((0.96 + theatre.ringSpread * 0.06 + activity * 0.03) * collapse);
      });
    }

    for (let i = 0; i < waveformRefs.current.length; i++) {
      const ref = waveformRefs.current[i];
      if (!ref) continue;
      const position = ref.geometry.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < pointsCount; j++) {
        const angle = (j / pointsCount) * TAU;
        const low = Math.sin(angle * (2 + i) - time * (2.5 + i * 0.65)) * curBass * (0.92 + i * 0.16);
        const high = Math.sin(angle * (11 + i * 4) + time * (9 + i * 1.9)) * curTreble * (0.24 + i * 0.06);
        const interference = Math.sin(angle * (5 + i * 2) - time * 0.85) * activity * 0.045;
        const r = 2.08 + low + high + interference;
        position.setX(j, Math.cos(angle) * r);
        position.setY(j, Math.sin(angle) * r);
      }
      position.needsUpdate = true;
      ref.rotation.z += delta * (i % 2 === 0 ? 0.065 : -0.085) * authoredSpeed;
      ref.scale.setScalar((0.96 + theatre.ringSpread * 0.06) * collapse);
    }

    const particleSpin = 0.5 + authoredSpeed * 0.25;
    if (outerParticlesRef.current) {
      outerParticlesRef.current.rotation.y += delta * (0.032 + curTreble * 0.22) * particleSpin;
      outerParticlesRef.current.rotation.x -= delta * 0.01;
      outerParticlesRef.current.rotation.z += delta * 0.006;
      outerParticlesRef.current.scale.setScalar((1 + theatre.particleEnergy * 0.16 + activity * 0.05) * collapse);
      const mat = outerParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = (0.18 + theatre.particleEnergy * 0.14 + curTreble * 0.06) * opacityFactor;
      mat.size = 0.024 + curTreble * 0.006 + voice * 0.003;
    }

    if (ejectionRef.current) {
      const position = ejectionCloud.geometry.attributes.position as THREE.BufferAttribute;
      const fade = ejectionCloud.geometry.attributes.aFade as THREE.BufferAttribute;
      for (let i = 0; i < ejectionCloud.phases.length; i++) {
        const phase = ejectionCloud.phases[i];
        const progress = (time * ejectionCloud.speeds[i] + phase) % 1;
        const travel = progress * (1.55 + ejectionCloud.sizes[i] * 0.64) * (1.0 + voice * 0.14 + activity * 0.06);
        const curlX = (Math.sin(time * 1.35 + phase * TAU) * 0.26 + Math.sin(phase * 13.0 + progress * 4.2) * 0.10) * progress;
        const curlY = (Math.cos(time * 1.08 + phase * 7.3) * 0.23 + Math.cos(phase * 9.0 - progress * 3.8) * 0.10) * progress;
        const curlZ = (Math.sin(time * 0.92 + phase * 9.1) * 0.22 + Math.sin(phase * 11.0 + progress * 3.4) * 0.08) * progress;
        const offset = i * 3;
        position.setXYZ(
          i,
          ejectionCloud.origins[offset] + ejectionCloud.directions[offset] * travel + curlX,
          ejectionCloud.origins[offset + 1] + ejectionCloud.directions[offset + 1] * travel + curlY,
          ejectionCloud.origins[offset + 2] + ejectionCloud.directions[offset + 2] * travel + curlZ,
        );
        const arrival = THREE.MathUtils.smoothstep(progress, 0.02, 0.16);
        const departure = 1 - THREE.MathUtils.smoothstep(progress, 0.72, 1.0);
        fade.setX(i, arrival * departure * opacityFactor * collapse);
      }
      position.needsUpdate = true;
      fade.needsUpdate = true;
      materials.ejection.uniforms.uActivity.value = activity;
      materials.ejection.uniforms.uVoice.value = voice;
    }

  });

  return (
    <group ref={groupRef}>
      {/* The Core body has a narrow corona, with broken cloud wisps rather than a filled transparent bubble. */}
      <Sphere ref={nucleusGlowRef} args={[0.90, 56, 56]} material={materials.coreGlow} />
      <Sphere ref={nucleusRef} args={[0.82, 80, 80]} material={materials.core} />
      <Sphere ref={gasWispsRef} args={[0.98, 72, 72]} material={materials.gasWisps} />
      <mesh ref={gasFlowRef} geometry={gasPlumeGeometry} material={materials.gasFlow} frustumCulled={false} renderOrder={3} />

      {/* Round ambient stars sit behind the Core; the soft animated points flow outward from its surface. */}
      <Points ref={outerParticlesRef} positions={outerParticles} stride={3} frustumCulled={false}>
        <primitive object={materials.particles} attach="material" />
      </Points>
      <points ref={ejectionRef} frustumCulled={false}>
        <primitive object={ejectionCloud.geometry} attach="geometry" />
        <primitive object={materials.ejection} attach="material" />
      </points>

    </group>
  );
}
