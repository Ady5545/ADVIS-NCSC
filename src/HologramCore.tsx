import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial, Icosahedron, Octahedron } from '@react-three/drei';
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

function createDeterministicParticles(count: number, minRadius: number, maxRadius: number, seed: number) {
  const positions = new Float32Array(count * 3);
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, random());
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

function createOrbitalArcGeometry(): Float32Array {
  const rings = [
    { radius: 2.0, tilt: [0.12, 0.05, 0.15], start: 0.08, span: 0.9 },
    { radius: 2.22, tilt: [0.85, -0.35, 0.25], start: 1.15, span: 0.55 },
    { radius: 2.46, tilt: [-0.5, 0.55, -0.25], start: 2.05, span: 0.78 },
    { radius: 2.78, tilt: [1.35, 0.2, 0.65], start: 3.0, span: 0.46 },
    { radius: 3.03, tilt: [0.35, -0.75, 1.0], start: 4.05, span: 0.68 },
    { radius: 3.28, tilt: [-0.85, 0.15, -0.35], start: 5.05, span: 0.52 },
  ] as const;

  const points: number[] = [];
  const temp = new THREE.Vector3();
  const euler = new THREE.Euler();

  rings.forEach((ring, ringIndex) => {
    const samples = 96;
    const arcStart = ring.start * Math.PI;
    const arcSpan = ring.span * Math.PI;
    const gapPattern = ringIndex % 2 === 0 ? [0, 0.06, 0.16, 0.24] : [0.03, 0.11, 0.19];

    for (let i = 0; i < samples; i++) {
      const a0 = (i / samples) * TAU;
      const a1 = ((i + 1) / samples) * TAU;
      const normalized = ((a0 - arcStart + TAU) % TAU) / TAU;
      const gap = gapPattern[Math.floor(i / 8) % gapPattern.length];
      if (normalized > arcSpan / TAU || normalized < gap) continue;

      temp.set(Math.cos(a0) * ring.radius, Math.sin(a0) * ring.radius, 0);
      euler.set(ring.tilt[0], ring.tilt[1], ring.tilt[2]);
      temp.applyEuler(euler);
      points.push(temp.x, temp.y, temp.z);

      temp.set(Math.cos(a1) * ring.radius, Math.sin(a1) * ring.radius, 0);
      temp.applyEuler(euler);
      points.push(temp.x, temp.y, temp.z);
    }
  });

  return new Float32Array(points);
}

function createFilamentGeometry(): Float32Array {
  const points: number[] = [];
  const count = 42;
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * TAU;
    const phi = (i * 0.61803398875 % 1) * Math.PI;
    const startRadius = 1.02 + (i % 3) * 0.08;
    const endRadius = 2.65 + (i % 5) * 0.08;
    const wobble = Math.sin(i * 1.7) * 0.07;

    const sx = Math.cos(theta) * Math.sin(phi) * startRadius;
    const sy = Math.cos(phi) * startRadius;
    const sz = Math.sin(theta) * Math.sin(phi) * startRadius;

    const ex = Math.cos(theta + wobble) * Math.sin(phi) * endRadius;
    const ey = Math.cos(phi + wobble * 0.45) * endRadius;
    const ez = Math.sin(theta + wobble) * Math.sin(phi) * endRadius;

    points.push(sx, sy, sz, ex, ey, ez);
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
  const theatrePresentationRef = useTheatreOrbPresentation();

  const groupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const nucleusGlowRef = useRef<THREE.Mesh>(null);
  const shellARef = useRef<THREE.Mesh>(null);
  const shellBRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const orbitalRef = useRef<THREE.Group>(null);
  const arcRef = useRef<THREE.LineSegments>(null);
  const filamentRef = useRef<THREE.LineSegments>(null);
  const particleRef = useRef<THREE.Points>(null);
  const innerParticleRef = useRef<THREE.Points>(null);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const waveformRefs = useRef<Array<THREE.LineLoop | null>>([]);
  const spatialTransitionRef = useRef(0);
  const smoothedBassRef = useRef(0);
  const smoothedTrebleRef = useRef(0);
  const eventPulseRef = useRef(0);
  const previousStateRef = useRef<SystemState>(systemState);

  const orbitalArcPositions = useMemo(() => createOrbitalArcGeometry(), []);
  const filamentPositions = useMemo(() => createFilamentGeometry(), []);
  const particlePositions = useMemo(() => createDeterministicParticles(360, 2.75, 4.25, 0xAD15A5), []);
  const innerParticlePositions = useMemo(() => createDeterministicParticles(150, 1.15, 2.25, 0xA11CE5), []);

  const pointsCount = 144;
  const initialWavePoints = useMemo(() => {
    const arr = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const a = (i / pointsCount) * TAU;
      arr[i * 3] = Math.cos(a) * 2.15;
      arr[i * 3 + 1] = Math.sin(a) * 2.15;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  const ringConfigs = useMemo(() => [
    { radius: 2.02, tube: 0.009, rotation: [0.22, 0.12, 0.08] as [number, number, number], opacity: 0.56 },
    { radius: 2.28, tube: 0.012, rotation: [1.05, -0.22, 0.58] as [number, number, number], opacity: 0.36 },
    { radius: 2.55, tube: 0.008, rotation: [-0.58, 0.8, -0.35] as [number, number, number], opacity: 0.48 },
    { radius: 2.84, tube: 0.009, rotation: [0.62, 0.18, 1.22] as [number, number, number], opacity: 0.3 },
    { radius: 3.1, tube: 0.008, rotation: [-0.36, -0.76, 0.46] as [number, number, number], opacity: 0.42 },
  ], []);

  const colors = useMemo(() => ({
    core: new THREE.Color('#e9ffff'),
    accent: new THREE.Color('#0099ff'),
    deepAccent: new THREE.Color('#0068e8'),
    technical: new THREE.Color('#68dfff'),
  }), []);

  const materials = useMemo(() => ({
    core: new THREE.MeshBasicMaterial({
      color: '#e9ffff',
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    coreGlow: new THREE.MeshBasicMaterial({
      color: '#7de9ff',
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    shellA: new THREE.MeshBasicMaterial({
      color: '#008cff',
      transparent: true,
      opacity: 0.2,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    shellB: new THREE.MeshBasicMaterial({
      color: '#56d9ff',
      transparent: true,
      opacity: 0.13,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    halo: new THREE.MeshBasicMaterial({
      color: '#008cff',
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    pulse: new THREE.MeshBasicMaterial({
      color: '#a9ffff',
      transparent: true,
      opacity: 0,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    ring: new THREE.MeshBasicMaterial({
      color: '#008cff',
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    arc: new THREE.LineBasicMaterial({
      color: '#7ae9ff',
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    filament: new THREE.LineBasicMaterial({
      color: '#39cfff',
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    wave1: new THREE.LineBasicMaterial({
      color: '#efffff',
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    wave2: new THREE.LineBasicMaterial({
      color: '#2daeff',
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    wave3: new THREE.LineBasicMaterial({
      color: '#0b7fff',
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    particles: new THREE.PointsMaterial({
      color: '#aef7ff',
      transparent: true,
      opacity: 0.58,
      size: 0.037,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    innerParticles: new THREE.PointsMaterial({
      color: '#5ee7ff',
      transparent: true,
      opacity: 0.72,
      size: 0.028,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  }), []);

  useEffect(() => {
    const base = new THREE.Color(themeColor);
    if (systemState === 'ANALYZING') base.set('#8b5cf6');
    if (systemState === 'ERROR') base.set('#ff174e');
    if (systemState === 'SEARCHING') base.set('#147dff');
    if (systemState === 'LISTENING') base.set('#00d9ff');
    if (systemState === 'SPEAKING') base.set('#2de7ff');

    const accent = base.clone().multiplyScalar(Math.min(1.35, Math.max(0.35, hologramIntensity)));
    materials.shellA.color.copy(accent);
    materials.shellB.color.copy(base.clone().lerp(new THREE.Color('#d9ffff'), 0.4));
    materials.halo.color.copy(base);
    materials.ring.color.copy(base);
    materials.arc.color.copy(colors.technical);
    materials.filament.color.copy(base.clone().lerp(colors.technical, 0.35));
    materials.wave2.color.copy(base);
    materials.wave3.color.copy(base.clone().multiplyScalar(0.85));
    materials.core.color.copy(colors.core);

    materials.coreGlow.color.copy(base.clone().lerp(colors.core, 0.28));
    materials.pulse.color.copy(colors.core);
    materials.particles.color.copy(colors.core);
    materials.innerParticles.color.copy(base.clone().lerp(colors.core, 0.2));
  }, [systemState, themeColor, hologramIntensity, materials, colors]);

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
    eventPulseRef.current = THREE.MathUtils.damp(eventPulseRef.current, 0, 4.5, delta);

    const targetSpatial = isSpatial ? 1 : 0;
    spatialTransitionRef.current = THREE.MathUtils.damp(spatialTransitionRef.current, targetSpatial, 5.5, delta);
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.02, 1 - spatial);
    const opacityFactor = Math.max(0.03, 1 - spatial * 0.95);

    const curRotX = gestureState.rot.x;
    const curRotY = gestureState.rot.y;
    const curRotZ = gestureState.rot.z;
    const curEnergy = gestureState.energy.current;
    const momentumEnergy = Math.min(1, (Math.abs(curRotX) + Math.abs(curRotY)) * 0.08);

    const targetBass =
      bass +
      curEnergy * 0.5 +
      (systemState === 'THINKING' || systemState === 'ANALYZING' ? 0.14 : 0) +
      (systemState === 'SEARCHING' ? 0.2 : 0);
    const targetTreble =
      treble +
      curEnergy * 0.3 +
      (systemState === 'SEARCHING' ? 0.11 : 0) +
      (systemState === 'ANALYZING' ? 0.08 : 0);

    smoothedBassRef.current = THREE.MathUtils.damp(smoothedBassRef.current, Math.max(0, targetBass), 7, delta);
    smoothedTrebleRef.current = THREE.MathUtils.damp(smoothedTrebleRef.current, Math.max(0, targetTreble), 8, delta);

    const theatre = theatrePresentationRef.current;
    let stateActivity = 0.16;
    let stateSpeed = 0.7;
    switch (systemState) {
      case 'LISTENING':
        stateActivity = 0.65;
        stateSpeed = 1.0;
        break;
      case 'THINKING':
        stateActivity = 0.9;
        stateSpeed = 1.65;
        break;
      case 'SEARCHING':
        stateActivity = 1.0;
        stateSpeed = 2.0;
        break;
      case 'ANALYZING':
        stateActivity = 0.88;
        stateSpeed = 1.35;
        break;
      case 'SPEAKING':
        stateActivity = 0.76;
        stateSpeed = 1.1;
        break;
      case 'ERROR':
        stateActivity = 0.95;
        stateSpeed = 1.6;
        break;
      default:
        break;
    }

    const idleBass =
      systemState === 'BOOTING'
        ? 0
        : 0.035 + (0.055 * (0.5 + 0.5 * Math.sin(time * (systemState === 'ONLINE' ? 1.55 : 2.7))));
    const idleTreble =
      systemState === 'BOOTING'
        ? 0
        : 0.012 + 0.028 * (0.5 + 0.5 * Math.sin(time * (systemState === 'SEARCHING' ? 16 : 8.5)));

    const curBass = Math.max(idleBass, smoothedBassRef.current + momentumEnergy * 0.55);
    const curTreble = Math.max(idleTreble, smoothedTrebleRef.current + momentumEnergy * 0.35);

    const pulse = 0.5 + 0.5 * Math.sin(time * (1.4 + stateSpeed) + eventPulseRef.current * 4);
    const voiceResponse = THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35);
    const activity = THREE.MathUtils.clamp(curBass * 0.9 + curTreble * 0.45 + stateActivity * 0.25 + voiceResponse * 0.65, 0, 1.6);

    const gestureScale = Math.max(0.001, gestureState.scale.current);
    const proximity = Math.max(0, 1 - Math.sqrt(state.pointer.x * state.pointer.x + state.pointer.y * state.pointer.y) * 0.72);
    const proximityBoost = 1 + proximity * 0.22;
    const bootProgress = systemState === 'BOOTING'
      ? THREE.MathUtils.damp(1, 0, 3.8, delta)
      : 1;

    if (groupRef.current) {
      groupRef.current.position.set(gestureState.pos.x, gestureState.pos.y, 0);
      const authoredBreath = 1 + (theatre.breathing - 0.5) * 0.055;
      const reactiveScale = 1 + curBass * 0.18 + voiceResponse * 0.05;
      groupRef.current.scale.setScalar(
        Math.max(0.001, bootProgress * hologramIntensity * gestureScale * proximityBoost * authoredBreath * reactiveScale)
      );
      groupRef.current.rotation.set(curRotX, curRotY, curRotZ);
    }

    const coreScale = theatre.coreScale * (1 + curBass * 0.16 + voiceResponse * 0.06 + eventPulseRef.current * 0.04);
    const shellScale = theatre.shellScale * (1 + curTreble * 0.18 + activity * 0.02);
    const ringSpread = theatre.ringSpread * (1 + curBass * 0.15 + activity * 0.03);
    const ringSpeed = Math.max(0.05, theatre.ringSpeed * stateSpeed);

    if (nucleusRef.current) {
      nucleusRef.current.rotation.y -= delta * (0.32 + curTreble * 0.8);
      nucleusRef.current.rotation.x += delta * (0.12 + curBass * 0.15);
      const breathe = 1 + (pulse - 0.5) * 0.055 * Math.max(0.2, theatre.breathing);
      nucleusRef.current.scale.setScalar(coreScale * breathe * collapse);
      materials.core.opacity = Math.min(1, (0.72 + voiceResponse * 0.2 + theatre.halo * 0.08) * hologramIntensity) * opacityFactor;
    }

    if (nucleusGlowRef.current) {
      const glowScale = (1.35 + curBass * 0.34 + theatre.halo * 0.12) * collapse;
      nucleusGlowRef.current.scale.setScalar(glowScale);
      materials.coreGlow.opacity = Math.min(0.5, (0.12 + activity * 0.08 + voiceResponse * 0.16 + theatre.halo * 0.08) * hologramIntensity) * opacityFactor;
    }

    if (shellARef.current) {
      shellARef.current.rotation.x += delta * 0.12 * ringSpeed;
      shellARef.current.rotation.y -= delta * 0.25 * ringSpeed;
      shellARef.current.rotation.z += delta * 0.08 * ringSpeed;
      shellARef.current.scale.setScalar(1.28 * shellScale * collapse);
      materials.shellA.opacity = (0.16 + theatre.technicalOpacity * 0.12 + curTreble * 0.16 + momentumEnergy * 0.08) * opacityFactor;
    }

    if (shellBRef.current) {
      shellBRef.current.rotation.x -= delta * 0.19 * ringSpeed;
      shellBRef.current.rotation.y += delta * 0.16 * ringSpeed;
      shellBRef.current.rotation.z -= delta * 0.11 * ringSpeed;
      shellBRef.current.scale.setScalar(1.48 * shellScale * (1 + activity * 0.04) * collapse);
      materials.shellB.opacity = (0.08 + theatre.technicalOpacity * 0.1 + curBass * 0.08) * opacityFactor;
    }

    if (haloRef.current) {
      haloRef.current.scale.setScalar((1.65 + theatre.halo * 0.45 + curBass * 0.2) * collapse);
      materials.halo.opacity = (0.03 + theatre.halo * 0.055 + voiceResponse * 0.025) * opacityFactor;
    }

    if (orbitalRef.current) {
      orbitalRef.current.scale.setScalar(ringSpread * collapse);
      orbitalRef.current.rotation.x += delta * 0.09 * ringSpeed;
      orbitalRef.current.rotation.y -= delta * 0.16 * ringSpeed;
      orbitalRef.current.rotation.z += delta * 0.035 * ringSpeed;

      orbitalRef.current.children.forEach((child, index) => {
        child.rotation.z += delta * ringSpeed * (index % 2 === 0 ? 0.24 : -0.18);
        child.rotation.x += delta * ringSpeed * (index % 3 === 0 ? 0.035 : -0.02);
        const baseOpacity = ringConfigs[index].opacity;
        materials.ring.opacity = Math.min(0.8, baseOpacity + curBass * 0.28 + voiceResponse * 0.16) * opacityFactor;
      });
    }

    if (arcRef.current) {
      arcRef.current.rotation.x += delta * 0.05 * ringSpeed;
      arcRef.current.rotation.y -= delta * 0.13 * ringSpeed;
      arcRef.current.rotation.z += delta * 0.02 * ringSpeed;
      arcRef.current.scale.setScalar((0.94 + theatre.ringSpread * 0.08 + activity * 0.04) * collapse);
      materials.arc.opacity = (0.32 + theatre.technicalOpacity * 0.5 + curTreble * 0.24 + voiceResponse * 0.08) * opacityFactor;
    }

    if (filamentRef.current) {
      filamentRef.current.rotation.x -= delta * 0.04 * (0.7 + curTreble * 1.8);
      filamentRef.current.rotation.y += delta * 0.075 * ringSpeed;
      filamentRef.current.rotation.z += delta * 0.022;
      filamentRef.current.scale.setScalar((0.92 + curBass * 0.16) * collapse);
      materials.filament.opacity = (theatre.filamentIntensity * 0.56 + curTreble * 0.46 + activity * 0.08) * opacityFactor;
    }

    for (let i = 0; i < waveformRefs.current.length; i++) {
      const ref = waveformRefs.current[i];
      if (!ref) continue;
      const geom = ref.geometry;
      const position = geom.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < pointsCount; j++) {
        const angle = (j / pointsCount) * TAU;
        const waveA = Math.sin(angle * (2 + i) - time * (2.4 + i * 0.55)) * curBass * (0.9 + i * 0.15);
        const waveB = Math.sin(angle * (10 + i * 3) + time * (8.5 + i * 1.7)) * curTreble * (0.22 + i * 0.05);
        const asymmetric = Math.sin(angle * (3 + i) + time * 0.6) * activity * 0.05;
        const r = (2.12 + waveA + waveB + asymmetric) * (0.9 + theatre.technicalOpacity * 0.08);
        position.setX(j, Math.cos(angle) * r);
        position.setY(j, Math.sin(angle) * r);
      }
      position.needsUpdate = true;
      ref.rotation.z += delta * (i % 2 === 0 ? 0.055 : -0.07) * ringSpeed;
      ref.scale.setScalar((0.96 + theatre.ringSpread * 0.05) * collapse);
    }

    if (particleRef.current) {
      const mat = particleRef.current.material as THREE.PointsMaterial;
      particleRef.current.rotation.y += delta * (0.035 + curTreble * 0.18) * ringSpeed;
      particleRef.current.rotation.x += delta * 0.013;
      particleRef.current.scale.setScalar((0.96 + theatre.particleEnergy * 0.12 + activity * 0.04) * collapse);
      mat.opacity = (0.26 + theatre.particleEnergy * 0.32 + curTreble * 0.28 + voiceResponse * 0.1) * opacityFactor;
      mat.size = 0.028 + curTreble * 0.045 + voiceResponse * 0.012;
    }

    if (innerParticleRef.current) {
      const mat = innerParticleRef.current.material as THREE.PointsMaterial;
      innerParticleRef.current.rotation.y -= delta * (0.07 + curTreble * 0.32) * ringSpeed;
      innerParticleRef.current.rotation.z += delta * 0.025;
      innerParticleRef.current.scale.setScalar((0.94 + curBass * 0.12) * collapse);
      mat.opacity = (0.25 + theatre.particleEnergy * 0.28 + curBass * 0.18) * opacityFactor;
      mat.size = 0.02 + curTreble * 0.028;
    }

    pulseRefs.current.forEach((pulseRef, index) => {
      if (!pulseRef) return;
      const phase = (time * (0.55 + stateSpeed * 0.18) + index * 1.25) % 2.1;
      const t = phase / 2.1;
      const scale = (1.0 + t * (0.9 + curBass * 0.45)) * collapse;
      pulseRef.scale.setScalar(scale * (0.9 + theatre.halo * 0.18));
      materials.pulse.opacity =
        phase < 1.55
          ? (1 - t) * (0.12 + voiceResponse * 0.1 + eventPulseRef.current * 0.16) * opacityFactor
          : 0;
    });

    if (systemState === 'SPEAKING' && audioLevel > 0.04) {
      materials.wave1.opacity = (0.62 + voiceResponse * 0.3) * opacityFactor;
    } else if (systemState === 'LISTENING') {
      materials.wave1.opacity = (0.48 + curBass * 0.34) * opacityFactor;
    } else {
      materials.wave1.opacity = (0.34 + theatre.technicalOpacity * 0.34) * opacityFactor;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Layer 0 — luminous computational core */}
      <Sphere ref={nucleusGlowRef} args={[1.2, 40, 40]} material={materials.coreGlow} />
      <Sphere ref={nucleusRef} args={[0.82, 40, 40]} material={materials.core} />

      {/* Layer 1 — nested faceted energy shells */}
      <Icosahedron ref={shellARef} args={[1.42, 2]} material={materials.shellA} />
      <Octahedron ref={shellBRef} args={[1.6, 2]} material={materials.shellB} />

      {/* Layer 2 — soft volumetric halo */}
      <Sphere ref={haloRef} args={[1.55, 32, 32]} material={materials.halo} />

      {/* Layer 3 — precision orbital bands */}
      <group ref={orbitalRef}>
        {ringConfigs.map((ring, index) => (
          <Torus
            key={index}
            args={[ring.radius, ring.tube, 8, 72]}
            rotation={ring.rotation}
            material={materials.ring}
          />
        ))}
      </group>

      {/* Layer 4 — segmented orbital arc network */}
      <lineSegments ref={arcRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[orbitalArcPositions, 3]} />
        </bufferGeometry>
        <primitive object={materials.arc} attach="material" />
      </lineSegments>

      {/* Layer 5 — radial energy filaments */}
      <lineSegments ref={filamentRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[filamentPositions, 3]} />
        </bufferGeometry>
        <primitive object={materials.filament} attach="material" />
      </lineSegments>

      {/* Layer 6 — orthogonal analytical wavefields */}
      {[
        [0, 0, 0],
        [0, Math.PI / 2, 0],
        [Math.PI / 2, 0, 0],
      ].map((rotation, index) => (
        <lineLoop
          key={index}
          ref={(ref) => { waveformRefs.current[index] = ref; }}
          rotation={rotation as [number, number, number]}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[initialWavePoints, 3]} />
          </bufferGeometry>
          <primitive object={index === 0 ? materials.wave1 : index === 1 ? materials.wave2 : materials.wave3} attach="material" />
        </lineLoop>
      ))}

      {/* Layer 7 — living particle field */}
      <Points ref={particleRef} positions={particlePositions} stride={3} frustumCulled={false}>
        <primitive object={materials.particles} attach="material" />
      </Points>
      <Points ref={innerParticleRef} positions={innerParticlePositions} stride={3} frustumCulled={false}>
        <primitive object={materials.innerParticles} attach="material" />
      </Points>

      {/* Layer 8 — voice/processing pulse shells */}
      <group>
        {[0, 1, 2].map((index) => (
          <Sphere
            key={index}
            ref={(ref) => { pulseRefs.current[index] = ref; }}
            args={[1.95 + index * 0.18, 28, 28]}
            material={materials.pulse}
          />
        ))}
      </group>
    </group>
  );
}
