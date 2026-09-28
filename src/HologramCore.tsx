import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, Icosahedron, Octahedron } from '@react-three/drei';
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
  const spokes = 92;

  for (let i = 0; i < spokes; i++) {
    const theta = (i / spokes) * TAU + random() * 0.03;
    const phi = Math.acos(2 * random() - 1);
    const inner = 1.35 + random() * 0.25;
    const outer = 2.95 + random() * 1.1;

    const sx = Math.sin(phi) * Math.cos(theta) * inner;
    const sy = Math.cos(phi) * inner;
    const sz = Math.sin(phi) * Math.sin(theta) * inner;

    const ex = Math.sin(phi + (random() - 0.5) * 0.12) * Math.cos(theta) * outer;
    const ey = Math.cos(phi + (random() - 0.5) * 0.12) * outer;
    const ez = Math.sin(phi + (random() - 0.5) * 0.12) * Math.sin(theta) * outer;

    points.push(sx, sy, sz, ex, ey, ez);
  }
  return new Float32Array(points);
}

function createArcNetwork(): Float32Array {
  const points: number[] = [];
  const random = deterministicRandom(0xA71F);
  const layers = 10;
  const segmentsPerLayer = 9;

  for (let layer = 0; layer < layers; layer++) {
    const radius = 2.05 + layer * 0.13;
    const tilt = [
      (random() - 0.5) * 1.4,
      (random() - 0.5) * 1.1,
      (random() - 0.5) * 1.6,
    ] as [number, number, number];

    for (let s = 0; s < segmentsPerLayer; s++) {
      const start = random() * TAU;
      const span = THREE.MathUtils.lerp(0.12, 0.55, random());
      const a0 = start;
      const a1 = start + span;

      const euler = new THREE.Euler(...tilt);
      const p0 = new THREE.Vector3(Math.cos(a0) * radius, Math.sin(a0) * radius, 0).applyEuler(euler);
      const p1 = new THREE.Vector3(Math.cos(a1) * radius, Math.sin(a1) * radius, 0).applyEuler(euler);
      points.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
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
  themeColor = '#0088ff',
  handTracking: _handTracking,
  isSpatial = false
}: HologramProps) {
  const gestureState = useGestureEngine();
  const theatrePresentationRef = useTheatreOrbPresentation(!isSpatial);

  const groupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const nucleusGlowRef = useRef<THREE.Mesh>(null);
  const innerShellRef = useRef<THREE.Mesh>(null);
  const outerShellRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const orbitalRef = useRef<THREE.Group>(null);
  const waveRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.LineSegments>(null);
  const radialRef = useRef<THREE.LineSegments>(null);
  const arcRef = useRef<THREE.LineSegments>(null);
  const outerParticlesRef = useRef<THREE.Points>(null);
  const midParticlesRef = useRef<THREE.Points>(null);
  const innerParticlesRef = useRef<THREE.Points>(null);
  const microParticlesRef = useRef<THREE.Points>(null);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);
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
  const outerParticles = useMemo(() => createParticleCloud(1050, 2.75, 4.65, 0xAD15A5, 0.62), []);
  const midParticles = useMemo(() => createParticleCloud(720, 2.15, 3.55, 0x71F3C1, 0.48), []);
  const innerParticles = useMemo(() => createParticleCloud(300, 1.15, 2.35, 0xA11CE5, 0.72), []);
  const microParticles = useMemo(() => createParticleCloud(520, 0.88, 1.7, 0xEFA71A, 0.35), []);

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
    { radius: 2.0, tube: 0.007, rotation: [0.18, 0.12, 0.08] as [number, number, number], opacity: 0.62 },
    { radius: 2.18, tube: 0.009, rotation: [1.05, -0.22, 0.58] as [number, number, number], opacity: 0.34 },
    { radius: 2.38, tube: 0.007, rotation: [-0.58, 0.8, -0.35] as [number, number, number], opacity: 0.5 },
    { radius: 2.6, tube: 0.008, rotation: [0.62, 0.18, 1.22] as [number, number, number], opacity: 0.34 },
    { radius: 2.84, tube: 0.006, rotation: [-0.36, -0.76, 0.46] as [number, number, number], opacity: 0.44 },
    { radius: 3.08, tube: 0.005, rotation: [0.78, 0.46, -0.92] as [number, number, number], opacity: 0.24 },
  ], []);

  const colors = useMemo(() => ({
    core: new THREE.Color('#ecffff'),
    technical: new THREE.Color('#67dcff'),
  }), []);

  const materials = useMemo(() => ({
    core: new THREE.MeshBasicMaterial({ color: '#ecffff', transparent: true, opacity: 0.96, blending: THREE.AdditiveBlending, depthWrite: false }),
    coreGlow: new THREE.MeshBasicMaterial({ color: '#7de9ff', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
    shellInner: new THREE.MeshBasicMaterial({ color: '#1bbaff', transparent: true, opacity: 0.28, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    shellOuter: new THREE.MeshBasicMaterial({ color: '#4ddfff', transparent: true, opacity: 0.16, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    halo: new THREE.MeshBasicMaterial({ color: '#008cff', transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    grid: new THREE.LineBasicMaterial({ color: '#39d6ff', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }),
    radial: new THREE.LineBasicMaterial({ color: '#73eaff', transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false }),
    arc: new THREE.LineBasicMaterial({ color: '#bcf6ff', transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }),
    ring: ringConfigs.map((r) => new THREE.MeshBasicMaterial({ color: '#129dff', transparent: true, opacity: r.opacity, blending: THREE.AdditiveBlending, depthWrite: false })),
    wave: [
      new THREE.LineBasicMaterial({ color: '#f1ffff', transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false }),
      new THREE.LineBasicMaterial({ color: '#37c2ff', transparent: true, opacity: 0.56, blending: THREE.AdditiveBlending, depthWrite: false }),
      new THREE.LineBasicMaterial({ color: '#1186ff', transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }),
    ],
    particles: new THREE.PointsMaterial({ color: '#c8fbff', transparent: true, opacity: 0.7, size: 0.028, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    midParticles: new THREE.PointsMaterial({ color: '#78e9ff', transparent: true, opacity: 0.54, size: 0.022, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    innerParticles: new THREE.PointsMaterial({ color: '#4ddcff', transparent: true, opacity: 0.68, size: 0.018, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    microParticles: new THREE.PointsMaterial({ color: '#eaffff', transparent: true, opacity: 0.82, size: 0.014, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    pulse: new THREE.MeshBasicMaterial({ color: '#bfffff', transparent: true, opacity: 0, wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  }), [ringConfigs]);

  useEffect(() => {
    const base = new THREE.Color(themeColor);
    if (systemState === 'ANALYZING') base.set('#8b5cf6');
    if (systemState === 'ERROR') base.set('#ff174e');
    if (systemState === 'SEARCHING') base.set('#147dff');
    if (systemState === 'LISTENING') base.set('#00d9ff');
    if (systemState === 'SPEAKING') base.set('#2de7ff');

    materials.coreGlow.color.copy(base.clone().lerp(colors.core, 0.28));
    materials.halo.color.copy(base);
    materials.grid.color.copy(base.clone().lerp(colors.technical, 0.45));
    materials.radial.color.copy(base.clone().lerp(colors.technical, 0.35));
    materials.arc.color.copy(colors.technical);
    materials.ring.forEach((m) => m.color.copy(base));
    materials.wave[1].color.copy(base);
    materials.wave[2].color.copy(base.clone().multiplyScalar(0.85));
    materials.innerParticles.color.copy(base.clone().lerp(colors.core, 0.2));
    materials.midParticles.color.copy(base.clone().lerp(colors.technical, 0.15));
    materials.microParticles.color.copy(colors.core);
  }, [systemState, themeColor, materials, colors]);

  useEffect(() => () => {
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

    const voice = THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35);
    const activity = THREE.MathUtils.clamp(curBass * 0.95 + curTreble * 0.5 + stateActivity * 0.3 + voice * 0.65, 0, 1.7);

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

    bootProgressRef.current = THREE.MathUtils.damp(bootProgressRef.current, systemState === 'BOOTING' ? 0 : 1, 4.5, delta);
    const boot = bootProgressRef.current;

    if (groupRef.current) {
      groupRef.current.position.set(gestureState.pos.x, gestureState.pos.y, 0);
      groupRef.current.rotation.set(gestureState.rot.x, gestureState.rot.y, gestureState.rot.z);
      groupRef.current.scale.setScalar(
        Math.max(0.001, boot * hologramIntensity * gestureState.scale.current * authoredBreath * (1 + curBass * 0.12))
      );
    }

    if (nucleusRef.current) {
      nucleusRef.current.rotation.y += delta * (0.34 + curTreble * 1.1);
      nucleusRef.current.rotation.x -= delta * (0.1 + curBass * 0.18);
      nucleusRef.current.scale.setScalar(authoredCore * (0.98 + (Math.sin(time * 2.2) * 0.035)) * collapse);
      materials.core.opacity = Math.min(1, (0.75 + voice * 0.22 + theatre.halo * 0.08 + eventPulseRef.current * 0.1) * hologramIntensity) * opacityFactor;
    }

    if (nucleusGlowRef.current) {
      nucleusGlowRef.current.scale.setScalar((1.36 + curBass * 0.42 + theatre.halo * 0.22) * collapse);
      materials.coreGlow.opacity = Math.min(0.62, (0.1 + activity * 0.09 + voice * 0.18 + theatre.halo * 0.1 + depthControl * 0.04) * hologramIntensity) * opacityFactor;
    }

    if (innerShellRef.current) {
      innerShellRef.current.rotation.x += delta * 0.18 * authoredSpeed;
      innerShellRef.current.rotation.y -= delta * 0.28 * authoredSpeed;
      innerShellRef.current.rotation.z += delta * 0.13 * authoredSpeed;
      innerShellRef.current.scale.setScalar(1.22 * authoredShell * collapse);
      materials.shellInner.opacity = (0.18 + technicalOpacity * 0.16 + curTreble * 0.2 + momentum * 0.1) * opacityFactor;
    }

    if (outerShellRef.current) {
      outerShellRef.current.rotation.x -= delta * 0.12 * authoredSpeed;
      outerShellRef.current.rotation.y += delta * 0.19 * authoredSpeed;
      outerShellRef.current.rotation.z -= delta * 0.09 * authoredSpeed;
      outerShellRef.current.scale.setScalar(1.46 * authoredShell * collapse);
      materials.shellOuter.opacity = (0.08 + technicalOpacity * 0.11 + curBass * 0.11) * opacityFactor;
    }

    if (haloRef.current) {
      haloRef.current.scale.setScalar((1.58 + theatre.halo * 0.65 + curBass * 0.22) * collapse);
      materials.halo.opacity = (0.024 + theatre.halo * 0.06 + voice * 0.03) * opacityFactor;
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
      mat.opacity = (0.22 + theatre.particleEnergy * 0.42 + curTreble * 0.3) * opacityFactor;
      mat.size = 0.018 + curTreble * 0.038 + voice * 0.009;
    }

    if (midParticlesRef.current) {
      midParticlesRef.current.rotation.y -= delta * (0.07 + curBass * 0.28) * particleSpin;
      midParticlesRef.current.rotation.z += delta * 0.018;
      midParticlesRef.current.scale.setScalar((1 + activity * 0.08) * collapse);
      const mat = midParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = (0.17 + theatre.particleEnergy * 0.34 + curBass * 0.22) * opacityFactor;
      mat.size = 0.014 + curTreble * 0.032;
    }

    if (innerParticlesRef.current) {
      innerParticlesRef.current.rotation.y += delta * (0.11 + curTreble * 0.42) * particleSpin;
      innerParticlesRef.current.rotation.x += delta * 0.025;
      innerParticlesRef.current.scale.setScalar((0.98 + curBass * 0.1) * collapse);
      const mat = innerParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = (0.18 + theatre.particleEnergy * 0.4 + curBass * 0.22) * opacityFactor;
      mat.size = 0.011 + curTreble * 0.022;
    }

    if (microParticlesRef.current) {
      microParticlesRef.current.rotation.y -= delta * (0.15 + curTreble * 0.7) * particleSpin;
      microParticlesRef.current.rotation.z += delta * 0.055;
      microParticlesRef.current.scale.setScalar((1.02 + curBass * 0.13) * collapse);
      const mat = microParticlesRef.current.material as THREE.PointsMaterial;
      mat.opacity = (0.18 + theatre.particleEnergy * 0.4 + microControl * 0.16 + voice * 0.12 + curTreble * 0.16) * opacityFactor;
      mat.size = 0.008 + microControl * 0.004 + curTreble * 0.018 + voice * 0.006;
    }

    pulseRefs.current.forEach((pulseRef, index) => {
      if (!pulseRef) return;
      const cycle = (time * (0.52 + stateSpeed * 0.16) + index * 0.72) % 2.2;
      const t = cycle / 2.2;
      pulseRef.scale.setScalar((1 + t * (1.0 + curBass * 0.5)) * collapse);
      materials.pulse.opacity = cycle < 1.65
        ? (1 - t) * (0.07 + voice * 0.1 + eventPulseRef.current * 0.22) * opacityFactor
        : 0;
    });
  });

  return (
    <group ref={groupRef}>
      {/* 0 — concentrated luminous computation core */}
      <Sphere ref={nucleusGlowRef} args={[1.18, 48, 48]} material={materials.coreGlow} />
      <Sphere ref={nucleusRef} args={[0.84, 56, 56]} material={materials.core} />

      {/* 1 — nested high-resolution faceted shells */}
      <Icosahedron ref={innerShellRef} args={[1.5, 3]} material={materials.shellInner} />
      <Octahedron ref={outerShellRef} args={[1.72, 3]} material={materials.shellOuter} />
      <Sphere ref={haloRef} args={[1.56, 48, 48]} material={materials.halo} />

      {/* 2 — six precision orbital bands */}
      <group ref={orbitalRef}>
        {ringConfigs.map((ring, index) => (
          <Torus key={index} args={[ring.radius, ring.tube, 10, 96]} rotation={ring.rotation} material={materials.ring[index]} />
        ))}
      </group>

      {/* 3 — dense spherical technical lattice */}
      <lineSegments ref={gridRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sphereGrid, 3]} />
        </bufferGeometry>
        <primitive object={materials.grid} attach="material" />
      </lineSegments>

      {/* 4 — radial computational filaments */}
      <lineSegments ref={radialRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[radialData, 3]} />
        </bufferGeometry>
        <primitive object={materials.radial} attach="material" />
      </lineSegments>

      {/* 5 — segmented orbital/data arc network */}
      <lineSegments ref={arcRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[arcNetwork, 3]} />
        </bufferGeometry>
        <primitive object={materials.arc} attach="material" />
      </lineSegments>

      {/* 6 — three orthogonal data wavefields */}
      {[0, 1, 2].map((index) => (
        <lineLoop
          key={index}
          ref={(ref) => { waveformRefs.current[index] = ref; }}
          rotation={
            index === 0 ? [0, 0, 0]
              : index === 1 ? [0, Math.PI / 2, 0]
              : [Math.PI / 2, 0, 0]
          }
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[initialWavePoints, 3]} />
          </bufferGeometry>
          <primitive object={materials.wave[index]} attach="material" />
        </lineLoop>
      ))}

      {/* 7 — multi-scale particulate computation field */}
      <Points ref={outerParticlesRef} positions={outerParticles} stride={3} frustumCulled={false}>
        <primitive object={materials.particles} attach="material" />
      </Points>
      <Points ref={midParticlesRef} positions={midParticles} stride={3} frustumCulled={false}>
        <primitive object={materials.midParticles} attach="material" />
      </Points>
      <Points ref={innerParticlesRef} positions={innerParticles} stride={3} frustumCulled={false}>
        <primitive object={materials.innerParticles} attach="material" />
      </Points>
      <Points ref={microParticlesRef} positions={microParticles} stride={3} frustumCulled={false}>
        <primitive object={materials.microParticles} attach="material" />
      </Points>

      {/* 8 — subtle propagating energy shells */}
      {[0, 1, 2, 3].map((index) => (
        <Sphere
          key={index}
          ref={(ref) => { pulseRefs.current[index] = ref; }}
          args={[1.92 + index * 0.16, 28, 28]}
          material={materials.pulse}
        />
      ))}
    </group>
  );
}
