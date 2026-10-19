import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SystemState } from './App';
import { useGestureEngine } from './GestureContext';
import { useTheatreOrbPresentation } from './theatre/TheatreOrbBridge';

export interface HologramProps {
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
const PLANET_RADIUS = 3.24;
const GAS_COLORS = ['#7e68ff', '#d66aff', '#ff789e', '#57dfff', '#ff9c75', '#9ca6ff'];

function deterministicRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type CloudPuff = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity: number;
};

type GasWisp = {
  geometry: THREE.TubeGeometry;
  color: string;
  opacity: number;
  phase: number;
  speed: number;
};

function createCloudPuffs(): CloudPuff[] {
  const random = deterministicRandom(0x4e454255);
  return Array.from({ length: 20 }, () => {
    const y = random() * 1.72 - 0.86;
    const theta = random() * TAU;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const direction = new THREE.Vector3(ring * Math.cos(theta), y, ring * Math.sin(theta));
    const radius = PLANET_RADIUS * (0.91 + random() * 0.38);
    const size = 0.38 + random() * 0.68;
    const stretch = 1.0 + random() * 1.25;
    return {
      position: [
        direction.x * radius,
        direction.y * radius,
        direction.z * radius,
      ],
      rotation: [random() * TAU, random() * TAU, random() * TAU],
      scale: [
        size * stretch,
        size * (0.46 + random() * 0.72),
        size * (0.72 + random() * 1.0),
      ],
      color: GAS_COLORS[Math.floor(random() * GAS_COLORS.length)],
      opacity: 0.13 + random() * 0.17,
    };
  });
}

function createGasWisps(): GasWisp[] {
  const random = deterministicRandom(0xA7D15);
  const wisps: GasWisp[] = [];

  for (let i = 0; i < 28; i++) {
    const y = random() * 1.72 - 0.86;
    const theta = random() * TAU;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const direction = new THREE.Vector3(ring * Math.cos(theta), y, ring * Math.sin(theta)).normalize();
    let tangent = new THREE.Vector3(-direction.z, 0.22 + (random() - 0.5) * 0.5, direction.x);
    if (tangent.lengthSq() < 0.03) tangent = new THREE.Vector3(1, 0.2, 0);
    tangent.normalize();
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();
    const startRadius = PLANET_RADIUS * (0.92 + random() * 0.12);
    const length = 0.62 + random() * 1.42;
    const curvature = (random() - 0.5) * 1.1;
    const phase = random() * TAU;
    const points: THREE.Vector3[] = [];

    for (let step = 0; step <= 8; step++) {
      const t = step / 8;
      const point = direction.clone().multiplyScalar(startRadius + length * t);
      const bend = Math.sin(t * Math.PI * 0.92) * curvature;
      point.addScaledVector(tangent, bend + t * t * (random() - 0.5) * 0.14);
      point.addScaledVector(bitangent, Math.sin(t * Math.PI * 1.38 + phase) * (0.08 + random() * 0.18) * t);
      points.push(point);
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeRadius = 0.012 + random() * 0.034;
    wisps.push({
      geometry: new THREE.TubeGeometry(curve, 40, tubeRadius, 5, false),
      color: GAS_COLORS[Math.floor(random() * GAS_COLORS.length)],
      opacity: 0.10 + random() * 0.22,
      phase,
      speed: 0.12 + random() * 0.20,
    });
  }

  return wisps;
}

const noiseFunctions = `
float hash31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 5; octave++) {
    value += amplitude * noise3(p);
    p = p * 2.02 + vec3(17.1, 9.2, 13.7);
    amplitude *= 0.5;
  }
  return value;
}
`;

const nebulaVertexShader = `
varying vec3 vNebulaPosition;
varying vec3 vNormalView;
varying vec3 vViewDirection;

void main() {
  vNebulaPosition = normalize(position);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vNormalView = normalize(normalMatrix * normal);
  vViewDirection = normalize(-mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const nebulaFragmentShader = `
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
uniform vec3 uAccent;
varying vec3 vNebulaPosition;
varying vec3 vNormalView;
varying vec3 vViewDirection;

${noiseFunctions}

void main() {
  vec3 p = normalize(vNebulaPosition);
  float drift = uTime * 0.018;

  float broadWarp = fbm(p * 3.35 + vec3(drift, -drift * 0.72, drift * 0.9));
  vec3 warp = vec3(
    fbm(p * 3.15 + vec3(2.4, broadWarp * 2.6, uTime * 0.013)),
    fbm(p * 3.15 + vec3(5.8, 1.7 + broadWarp * 2.2, -uTime * 0.016)),
    fbm(p * 3.15 + vec3(9.1, 6.3, broadWarp * 2.0 + uTime * 0.011))
  );

  float broadClouds = fbm(p * 6.4 + (warp - 0.5) * 4.1 + vec3(drift, -drift * 0.8, drift * 0.6));
  float fineClouds = fbm(p * 15.0 + (warp - 0.5) * 5.0 - vec3(uTime * 0.025, uTime * 0.018, -uTime * 0.021));
  float density = clamp(broadClouds * 0.69 + fineClouds * 0.31, 0.0, 1.0);
  float filaments = pow(1.0 - abs(fineClouds * 2.0 - 1.0), 4.0);
  float blueField = fbm(p * 4.8 + vec3(11.6, 3.8, -6.1) + warp);
  float roseField = fbm(p * 5.4 + vec3(-7.5, 8.4, 2.9) + warp.yzx);
  float emberField = fbm(p * 7.1 + vec3(4.2, -5.6, 10.3) - warp.zxy);

  vec3 deepIndigo = vec3(0.012, 0.020, 0.095);
  vec3 violet = vec3(0.19, 0.075, 0.62);
  vec3 magenta = vec3(0.86, 0.12, 0.54);
  vec3 coral = vec3(1.0, 0.30, 0.17);
  vec3 cyan = vec3(0.055, 0.46, 0.98);

  vec3 color = mix(deepIndigo, violet, smoothstep(0.18, 0.70, density));
  color = mix(color, magenta, smoothstep(0.43, 0.77, roseField) * 0.76);
  color = mix(color, cyan, smoothstep(0.39, 0.79, blueField) * 0.84);
  color = mix(color, coral, smoothstep(0.58, 0.82, emberField) * smoothstep(0.30, 0.74, roseField) * 0.57);
  color += mix(cyan, magenta, roseField) * filaments * 0.34;
  color = mix(color, uAccent, smoothstep(0.54, 0.86, fbm(p * 6.1 + vec3(5.0, 0.2, 13.7))) * 0.24);

  float facing = max(dot(normalize(vNormalView), normalize(vViewDirection)), 0.0);
  float fresnel = pow(1.0 - facing, 2.0);
  float cloudBody = smoothstep(0.16, 0.66, density);
  float alpha = clamp((0.09 + cloudBody * 0.60 + filaments * 0.12 + fresnel * 0.34) * uOpacity, 0.0, 0.94);
  alpha *= mix(0.62, 1.0, smoothstep(0.05, 0.48, density));

  gl_FragColor = vec4(color * (1.25 + uEnergy * 0.34), alpha);
}
`;

const atmosphereFragmentShader = `
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
varying vec3 vNebulaPosition;
varying vec3 vNormalView;
varying vec3 vViewDirection;

${noiseFunctions}

void main() {
  vec3 p = normalize(vNebulaPosition);
  float hazeA = fbm(p * 4.8 + vec3(uTime * 0.012, -uTime * 0.018, uTime * 0.009));
  float hazeB = fbm(p * 10.2 + vec3(3.4, uTime * 0.018, 7.1));
  float haze = smoothstep(0.28, 0.82, hazeA * 0.66 + hazeB * 0.34);
  float facing = max(dot(normalize(vNormalView), normalize(vViewDirection)), 0.0);
  float rim = pow(1.0 - facing, 2.35);
  vec3 cloudColor = mix(vec3(0.30, 0.12, 0.72), vec3(0.06, 0.62, 1.0), hazeB);
  cloudColor = mix(cloudColor, vec3(0.96, 0.24, 0.66), smoothstep(0.52, 0.88, hazeA) * 0.44);
  float alpha = clamp((0.015 + haze * 0.09 + rim * 0.31) * uOpacity, 0.0, 0.40);
  gl_FragColor = vec4(cloudColor * (1.25 + uEnergy * 0.30), alpha);
}
`;

function createNebulaMaterial(accent: THREE.Color, opacity = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uOpacity: { value: opacity },
      uAccent: { value: accent.clone() },
    },
    vertexShader: nebulaVertexShader,
    fragmentShader: nebulaFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
}

export function HologramCore({
  systemState,
  audioLevel,
  bass = 0,
  treble = 0,
  hologramIntensity = 1,
  themeColor = '#168fff',
  handTracking: _handTracking,
  isSpatial = false,
}: HologramProps) {
  const gestureState = useGestureEngine();
  const theatrePresentationRef = useTheatreOrbPresentation(!isSpatial);

  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Group>(null);
  const spatialTransitionRef = useRef(0);
  const smoothedEnergyRef = useRef(0);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);
  const previousStateRef = useRef<SystemState>(systemState);

  const cloudPuffs = useMemo(() => createCloudPuffs(), []);
  const gasWisps = useMemo(() => createGasWisps(), []);
  const accentColor = useMemo(() => new THREE.Color(themeColor), [themeColor]);

  const planetMaterial = useMemo(() => createNebulaMaterial(accentColor), [accentColor]);
  const puffMaterials = useMemo(
    () => cloudPuffs.map((puff) => createNebulaMaterial(new THREE.Color(puff.color), puff.opacity)),
    [cloudPuffs]
  );
  const atmosphereMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uOpacity: { value: 1 },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: atmosphereFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    []
  );
  const wispMaterials = useMemo(
    () => gasWisps.map((wisp) => new THREE.MeshBasicMaterial({
      color: wisp.color,
      transparent: true,
      opacity: wisp.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    })),
    [gasWisps]
  );

  useEffect(() => {
    return () => {
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
      puffMaterials.forEach((material) => material.dispose());
      wispMaterials.forEach((material) => material.dispose());
      gasWisps.forEach((wisp) => wisp.geometry.dispose());
    };
  }, [planetMaterial, atmosphereMaterial, puffMaterials, wispMaterials, gasWisps]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const theatre = theatrePresentationRef.current;

    if (previousStateRef.current !== systemState) {
      previousStateRef.current = systemState;
    }

    const spatialTarget = isSpatial ? 1 : 0;
    spatialTransitionRef.current = THREE.MathUtils.damp(spatialTransitionRef.current, spatialTarget, 5.5, delta);
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.012, 1 - spatial);
    const visibility = Math.max(0.025, 1 - spatial * 0.975);

    let stateEnergy = 0.12;
    let stateSpeed = 1;
    if (systemState === 'LISTENING') { stateEnergy = 0.30; stateSpeed = 1.05; }
    if (systemState === 'THINKING') { stateEnergy = 0.58; stateSpeed = 1.38; }
    if (systemState === 'SEARCHING') { stateEnergy = 0.72; stateSpeed = 1.62; }
    if (systemState === 'ANALYZING') { stateEnergy = 0.54; stateSpeed = 1.28; }
    if (systemState === 'SPEAKING') { stateEnergy = 0.48; stateSpeed = 1.12; }
    if (systemState === 'ERROR') { stateEnergy = 0.65; stateSpeed = 1.4; }

    const gestureEnergy = Math.max(0, gestureState.energy.current || 0);
    const signalTarget = Math.max(0, bass) * 0.68 + Math.max(0, treble) * 0.22
      + gestureEnergy * 0.24 + stateEnergy * 0.32
      + THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35) * 0.42;
    smoothedEnergyRef.current = THREE.MathUtils.damp(
      smoothedEnergyRef.current,
      THREE.MathUtils.clamp(signalTarget, 0.08, 1.35),
      4.8,
      delta
    );
    const energy = smoothedEnergyRef.current;

    bootProgressRef.current = THREE.MathUtils.damp(
      bootProgressRef.current,
      systemState === 'BOOTING' ? 0 : 1,
      4.5,
      delta
    );
    const boot = bootProgressRef.current;
    const breathing = 1 + ((theatre.breathing ?? 0.5) - 0.5) * 0.06 + Math.sin(time * 0.62) * 0.012;

    if (groupRef.current) {
      groupRef.current.position.set(gestureState.pos.x, gestureState.pos.y, 0);
      groupRef.current.rotation.set(gestureState.rot.x, gestureState.rot.y, gestureState.rot.z);
      groupRef.current.scale.setScalar(Math.max(
        0.001,
        boot * hologramIntensity * gestureState.scale.current * breathing
          * (1 + energy * 0.075) * 1.08 * collapse
      ));
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * (0.025 + energy * 0.025) * stateSpeed;
      planetRef.current.rotation.x = Math.sin(time * 0.10) * 0.045;
      planetRef.current.rotation.z = Math.cos(time * 0.075) * 0.024;
    }

    if (plumeRef.current) {
      plumeRef.current.rotation.y -= delta * (0.013 + energy * 0.016) * stateSpeed;
      plumeRef.current.rotation.x = Math.sin(time * 0.085) * 0.035;
      plumeRef.current.rotation.z += delta * 0.004;
    }

    const planetUniforms = planetMaterial.uniforms;
    planetUniforms.uTime.value = time;
    planetUniforms.uEnergy.value = energy;
    planetUniforms.uOpacity.value = visibility * boot;
    atmosphereMaterial.uniforms.uTime.value = time * 0.82;
    atmosphereMaterial.uniforms.uEnergy.value = energy;
    atmosphereMaterial.uniforms.uOpacity.value = visibility * boot;

    puffMaterials.forEach((material, index) => {
      material.uniforms.uTime.value = time + index * 0.13;
      material.uniforms.uEnergy.value = energy;
      material.uniforms.uOpacity.value = cloudPuffs[index].opacity * visibility * boot;
    });
    wispMaterials.forEach((material, index) => {
      const pulse = 0.82 + 0.18 * Math.sin(time * gasWisps[index].speed + gasWisps[index].phase);
      material.opacity = gasWisps[index].opacity * pulse * (0.74 + energy * 0.32) * visibility * boot;
    });
  });

  return (
    <group ref={groupRef}>
      {/* A large gaseous body replaces the old white nucleus, technical lattice, and orbital rings. */}
      <group ref={planetRef}>
        <mesh material={planetMaterial} frustumCulled={false}>
          <sphereGeometry args={[PLANET_RADIUS, 128, 128]} />
        </mesh>

        {/* A soft outer atmosphere gives the sphere a cloud-lit silhouette rather than a hard shell. */}
        <mesh material={atmosphereMaterial} scale={1.075} frustumCulled={false}>
          <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
        </mesh>

        {/* Low-opacity billows blend into the body to create turbulent, volumetric-looking gas. */}
        {cloudPuffs.map((puff, index) => (
          <mesh
            key={index}
            position={puff.position}
            rotation={puff.rotation}
            scale={puff.scale}
            material={puffMaterials[index]}
            frustumCulled={false}
          >
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>
        ))}
      </group>

      {/* Curved, differently sized gas filaments stream away from the planet. */}
      <group ref={plumeRef}>
        {gasWisps.map((wisp, index) => (
          <mesh
            key={index}
            geometry={wisp.geometry}
            material={wispMaterials[index]}
            frustumCulled={false}
          />
        ))}
      </group>
    </group>
  );
}
