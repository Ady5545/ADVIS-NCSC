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

type GasRibbon = {
  geometry: THREE.BufferGeometry;
  color: string;
  opacity: number;
  phase: number;
  speed: number;
};

function createGasRibbons(): GasRibbon[] {
  const random = deterministicRandom(0xA7D15);
  const ribbons: GasRibbon[] = [];
  const ribbonCount = 38;
  const segments = 52;

  for (let i = 0; i < ribbonCount; i++) {
    const y = random() * 1.72 - 0.86;
    const theta = random() * TAU;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const direction = new THREE.Vector3(
      ring * Math.cos(theta),
      y,
      ring * Math.sin(theta)
    ).normalize();

    const referenceAxis = Math.abs(direction.y) < 0.86
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(referenceAxis, direction).normalize();
    const bitangent = new THREE.Vector3().crossVectors(direction, tangent).normalize();

    const phase = random() * TAU;
    const flowAngle = 0.28 + random() * 1.08;
    const outwardDistance = 0.20 + random() * 1.08;
    const broadRibbon = random() < 0.24;
    const baseWidth = broadRibbon ? 0.085 + random() * 0.075 : 0.018 + random() * 0.043;
    const centers: THREE.Vector3[] = [];

    for (let step = 0; step <= segments; step++) {
      const t = step / segments;
      const swirl = flowAngle * t
        + Math.sin(t * TAU * 0.72 + phase) * 0.065 * t;
      const flowDirection = direction.clone()
        .multiplyScalar(Math.cos(swirl))
        .addScaledVector(tangent, Math.sin(swirl))
        .normalize();

      // The leading edge hugs the planet; the tail bends along the surface before
      // gently lifting into space. This avoids isolated spherical "puffs".
      const lift = outwardDistance * Math.pow(t, 1.7);
      const lateral = Math.sin(t * TAU * 0.68 + phase) * 0.13 * t;
      const crossDrift = Math.sin(t * TAU * 0.43 + phase * 1.3) * 0.08 * t;
      const center = flowDirection.clone().multiplyScalar(PLANET_RADIUS * 1.006 + lift);
      center.addScaledVector(bitangent, lateral);
      center.addScaledVector(tangent, crossDrift);
      centers.push(center);
    }

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let step = 0; step <= segments; step++) {
      const t = step / segments;
      const previous = centers[Math.max(0, step - 1)];
      const next = centers[Math.min(segments, step + 1)];
      const pathTangent = next.clone().sub(previous).normalize();
      const localNormal = centers[step].clone().normalize();
      let side = new THREE.Vector3().crossVectors(pathTangent, localNormal);
      if (side.lengthSq() < 0.0001) {
        side = new THREE.Vector3().crossVectors(pathTangent, bitangent);
      }
      side.normalize();

      // Fine, tapered sheets have soft shader edges; there are no solid tube bodies.
      const taper = 0.11 + Math.pow(Math.sin(Math.PI * t), 0.72) * 0.89;
      const width = baseWidth * taper * (1 - 0.28 * t);
      const left = centers[step].clone().addScaledVector(side, -width);
      const right = centers[step].clone().addScaledVector(side, width);

      positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
      uvs.push(0, t, 1, t);

      if (step < segments) {
        const a = step * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    ribbons.push({
      geometry,
      color: GAS_COLORS[Math.floor(random() * GAS_COLORS.length)],
      opacity: broadRibbon ? 0.28 + random() * 0.12 : 0.34 + random() * 0.20,
      phase,
      speed: 0.16 + random() * 0.34,
    });
  }

  return ribbons;
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
  for (int octave = 0; octave < 2; octave++) {
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
  float warp = fbm(p * 2.7 + vec3(drift, -drift * 0.72, drift * 0.9));
  float broadClouds = fbm(p * 5.6 + vec3(warp * 2.8, -warp * 2.3, warp * 1.9) + vec3(drift, -drift * 0.8, drift * 0.6));
  float fineClouds = fbm(p * 12.1 + vec3(broadClouds * 3.1, warp * 2.2, -broadClouds * 2.0) - vec3(uTime * 0.022, -uTime * 0.017, uTime * 0.018));
  float paletteField = fbm(p * 3.65 + vec3(6.4, 2.1, 9.5) + vec3(warp, -warp * 0.6, warp * 1.2));
  float density = clamp(broadClouds * 0.68 + fineClouds * 0.32, 0.0, 1.0);
  float filaments = pow(1.0 - abs(fineClouds * 2.0 - 1.0), 4.0);
  float blueMask = smoothstep(0.40, 0.77, paletteField + sin(p.y * 6.0 + uTime * 0.025) * 0.07);
  float roseMask = smoothstep(0.38, 0.76, broadClouds * 0.58 + fineClouds * 0.42 + sin(p.z * 7.0 - p.x * 4.0) * 0.12);
  float emberMask = smoothstep(0.61, 0.84, fineClouds + paletteField * 0.16);

  vec3 deepIndigo = vec3(0.012, 0.020, 0.095);
  vec3 violet = vec3(0.19, 0.075, 0.62);
  vec3 magenta = vec3(0.86, 0.12, 0.54);
  vec3 coral = vec3(1.0, 0.30, 0.17);
  vec3 cyan = vec3(0.055, 0.46, 0.98);

  vec3 color = mix(deepIndigo, violet, smoothstep(0.18, 0.70, density));
  color = mix(color, magenta, roseMask * 0.78);
  color = mix(color, cyan, blueMask * 0.84);
  color = mix(color, coral, emberMask * roseMask * 0.57);
  color += mix(cyan, magenta, roseMask) * filaments * 0.34;
  color = mix(color, uAccent, smoothstep(0.55, 0.85, paletteField) * 0.22);

  float facing = max(dot(normalize(vNormalView), normalize(vViewDirection)), 0.0);
  float fresnel = pow(1.0 - facing, 2.0);
  float cloudBody = smoothstep(0.16, 0.66, density);
  float alpha = clamp((0.09 + cloudBody * 0.60 + filaments * 0.12 + fresnel * 0.34) * uOpacity, 0.0, 0.94);
  alpha *= mix(0.62, 1.0, smoothstep(0.05, 0.48, density));
  gl_FragColor = vec4(color * (1.25 + uEnergy * 0.34), alpha);
  #include <colorspace_fragment>
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
  #include <colorspace_fragment>
}
`;

const gasRibbonVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const gasRibbonFragmentShader = `
uniform float uTime;
uniform float uEnergy;
uniform float uOpacity;
uniform float uPhase;
uniform float uSpeed;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  float across = abs(vUv.x * 2.0 - 1.0);
  float softEdge = pow(max(0.0, 1.0 - across), 1.55);
  float startFade = smoothstep(0.0, 0.10, vUv.y);
  float tailFade = 1.0 - smoothstep(0.70, 1.0, vUv.y);

  float slowWave = sin(vUv.y * 31.0 - uTime * (0.52 + uSpeed) + uPhase
    + sin(vUv.y * 11.0 + uPhase) * 1.7);
  float fineWave = sin(vUv.y * 79.0 + uTime * 0.24 + uPhase * 2.3);
  float turbulence = smoothstep(-0.82, 0.42, slowWave * 0.62 + fineWave * 0.20 + 0.13);

  // Alpha fades at both edges and at the end of each strand, so gas merges
  // into the atmosphere instead of looking like a rigid ribbon or cable.
  float alpha = softEdge * startFade * tailFade
    * (0.20 + turbulence * 0.62) * uOpacity
    * (0.82 + uEnergy * 0.24);

  vec3 coolerEdge = mix(uColor, vec3(0.40, 0.74, 1.0), smoothstep(0.18, 0.96, vUv.y) * 0.48);
  float brightSpine = pow(max(0.0, 1.0 - across), 4.0);
  vec3 gasColor = coolerEdge * (0.72 + turbulence * 0.42 + brightSpine * 0.52);
  gl_FragColor = vec4(gasColor, alpha);
  #include <colorspace_fragment>
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
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
}

export function NebulaPlanet({
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
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const plumeRef = useRef<THREE.Group>(null);
  const spatialTransitionRef = useRef(0);
  const smoothedEnergyRef = useRef(0);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);
  const previousStateRef = useRef<SystemState>(systemState);

  const gasRibbons = useMemo(() => createGasRibbons(), []);
  const accentColor = useMemo(() => new THREE.Color(themeColor), [themeColor]);

  const planetMaterial = useMemo(() => createNebulaMaterial(accentColor), [accentColor]);
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
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    []
  );
  const ribbonMaterials = useMemo(
    () => gasRibbons.map((ribbon) => new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uOpacity: { value: ribbon.opacity },
        uPhase: { value: ribbon.phase },
        uSpeed: { value: ribbon.speed },
        uColor: { value: new THREE.Color(ribbon.color) },
      },
      vertexShader: gasRibbonVertexShader,
      fragmentShader: gasRibbonFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })),
    [gasRibbons]
  );

  useEffect(() => {
    return () => {
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
      ribbonMaterials.forEach((material) => material.dispose());
      gasRibbons.forEach((ribbon) => ribbon.geometry.dispose());
    };
  }, [planetMaterial, atmosphereMaterial, ribbonMaterials, gasRibbons]);

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
      + THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35) * 0.42
      + THREE.MathUtils.clamp(theatre.particleEnergy ?? 0.3, 0, 1.3) * 0.12;
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
    const authoredScale = THREE.MathUtils.clamp(theatre.coreScale ?? 1, 0.75, 1.45);
    const authoredSpeed = THREE.MathUtils.clamp(theatre.ringSpeed ?? 1, 0.3, 2.5);
    const authoredShellScale = THREE.MathUtils.clamp(theatre.shellScale ?? 1, 0.76, 1.42);
    const technicalOpacity = THREE.MathUtils.clamp(theatre.technicalOpacity ?? 1, 0.5, 1.15);

    if (groupRef.current) {
      groupRef.current.position.set(gestureState.pos.x, gestureState.pos.y, 0);
      groupRef.current.rotation.set(gestureState.rot.x, gestureState.rot.y, gestureState.rot.z);
      groupRef.current.scale.setScalar(Math.max(
        0.001,
        boot * hologramIntensity * gestureState.scale.current * breathing
          * authoredScale * (1 + energy * 0.075) * 1.08 * collapse
      ));
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * (0.025 + energy * 0.025) * stateSpeed * authoredSpeed;
      planetRef.current.rotation.x = Math.sin(time * 0.10) * 0.045;
      planetRef.current.rotation.z = Math.cos(time * 0.075) * 0.024;
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.scale.setScalar(1.075 * authoredShellScale * (1 + (theatre.halo ?? 0.5) * 0.035));
    }

    if (plumeRef.current) {
      plumeRef.current.scale.setScalar(0.94 + (theatre.ringSpread ?? 1) * 0.05 + (theatre.depthActivity ?? 0.3) * 0.025);
      plumeRef.current.rotation.y -= delta * (0.013 + energy * 0.016) * stateSpeed * authoredSpeed;
      plumeRef.current.rotation.x = Math.sin(time * 0.085) * 0.035;
      plumeRef.current.rotation.z += delta * 0.004;
    }

    const planetUniforms = planetMaterial.uniforms;
    planetUniforms.uTime.value = time;
    planetUniforms.uEnergy.value = energy;
    planetUniforms.uOpacity.value = visibility * boot * technicalOpacity;
    atmosphereMaterial.uniforms.uTime.value = time * 0.82;
    atmosphereMaterial.uniforms.uEnergy.value = energy;
    atmosphereMaterial.uniforms.uOpacity.value = visibility * boot * (0.78 + (theatre.halo ?? 0.5) * 0.25);

    ribbonMaterials.forEach((material, index) => {
      const ribbon = gasRibbons[index];
      const pulse = 0.84 + 0.16 * Math.sin(time * ribbon.speed + ribbon.phase);
      material.uniforms.uTime.value = time;
      material.uniforms.uEnergy.value = energy;
      material.uniforms.uOpacity.value = ribbon.opacity * pulse * visibility * boot
        * (0.82 + energy * 0.16 + (theatre.radialIntensity ?? 0.5) * 0.05
          + (theatre.arcIntensity ?? 0.5) * 0.04 + (theatre.microEnergy ?? 0.5) * 0.04);
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
        <mesh ref={atmosphereRef} material={atmosphereMaterial} frustumCulled={false}>
          <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
        </mesh>

      </group>

      {/* Layered transparent gas sheets flow across and then peel away from the atmosphere. */}
      <group ref={plumeRef}>
        {gasRibbons.map((ribbon, index) => (
          <mesh
            key={index}
            geometry={ribbon.geometry}
            material={ribbonMaterials[index]}
            frustumCulled={false}
          />
        ))}
      </group>
    </group>
  );
}

// Keep the established import stable while naming the actual visual what it now is.
export const HologramCore = NebulaPlanet;
