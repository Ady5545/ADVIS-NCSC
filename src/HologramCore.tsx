import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

const orbVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vLocalPosition = normalize(position);
    vViewNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const orbFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uPulse;
  uniform float uVoice;
  uniform float uActivity;
  uniform float uVisibility;
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 n = normalize(vViewNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(vec3(-0.48, 0.56, 0.72));
    float diffuse = max(dot(n, lightDir), 0.0);
    float facing = max(dot(n, viewDir), 0.0);
    float rim = pow(1.0 - facing, 3.1);
    float specular = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 34.0);

    vec3 deep = vec3(0.004, 0.014, 0.065);
    vec3 cobalt = vec3(0.012, 0.085, 0.39);
    vec3 blue = vec3(0.025, 0.27, 0.94);
    vec3 ice = vec3(0.34, 0.84, 1.0);
    float lit = smoothstep(0.0, 0.92, diffuse);
    vec3 color = mix(deep, cobalt, lit);
    color = mix(color, blue, pow(lit, 1.55) * 0.8);

    float latitude = asin(clamp(vLocalPosition.y, -1.0, 1.0));
    float longitude = atan(vLocalPosition.z, vLocalPosition.x);
    float latLine = 1.0 - smoothstep(0.018, 0.055, abs(sin(latitude * 17.0)));
    float lonLine = 1.0 - smoothstep(0.018, 0.055, abs(sin(longitude * 22.0)));
    float grid = max(latLine, lonLine) * smoothstep(0.05, 0.55, diffuse);
    color += vec3(0.025, 0.20, 0.56) * grid * 0.19;

    float currentA = sin(longitude * 3.4 - latitude * 4.8 - uTime * 0.46);
    float currentB = sin(longitude * 7.0 + latitude * 2.8 + uTime * 0.29);
    float current = smoothstep(0.83, 0.99, currentA + currentB * 0.22);
    color = mix(color, vec3(0.10, 0.58, 1.0), current * (0.20 + uPulse * 0.22));

    float coreLight = pow(max(0.0, 1.0 - length(vLocalPosition - vec3(-0.28, 0.34, 0.75))), 4.0);
    color += ice * coreLight * (0.22 + uVoice * 0.25);
    color += ice * rim * (0.42 + uPulse * 0.38);
    color += vec3(0.68, 0.91, 1.0) * specular * (0.70 + uVoice * 0.4);
    color *= 0.94 + uPulse * 0.12 + uActivity * 0.07;
    gl_FragColor = vec4(color, uVisibility);
  }
`;

const auraFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uPulse;
  uniform float uVisibility;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 n = normalize(vViewNormal);
    vec3 viewDir = normalize(vViewPosition);
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.15);
    float alpha = rim * (0.22 + uPulse * 0.14) * uVisibility;
    vec3 color = mix(vec3(0.01, 0.055, 0.30), vec3(0.02, 0.36, 1.0), smoothstep(0.1, 0.95, rim));
    gl_FragColor = vec4(color, alpha);
  }
`;

function createParticlePositions(count: number) {
  const positions = new Float32Array(count * 3);
  let seed = 0xA17D15;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2;
    const y = random() * 2 - 1;
    const radius = 1.65 + random() * 0.95;
    const ringRadius = Math.sqrt(1 - y * y) * radius;
    positions[i * 3] = Math.cos(theta) * ringRadius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * ringRadius;
  }
  return positions;
}

export function HologramCore({
  systemState,
  audioLevel,
  bass = 0,
  treble = 0,
  hologramIntensity = 1,
  isSpatial = false,
  isHome = false,
}: HologramProps) {
  const gestureState = useGestureEngine();
  const theatrePresentationRef = useTheatreOrbPresentation(!isSpatial);
  const viewportWidth = useThree((state) => state.size.width);
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const orbitARef = useRef<THREE.Group>(null);
  const orbitBRef = useRef<THREE.Group>(null);
  const orbitCRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const spatialTransitionRef = useRef(0);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);

  const particlePositions = useMemo(() => createParticlePositions(108), []);
  const coreUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPulse: { value: 0.3 },
    uVoice: { value: 0 },
    uActivity: { value: 0 },
    uVisibility: { value: 1 },
  }), []);
  const auraUniforms = useMemo(() => ({
    uPulse: { value: 0.3 },
    uVisibility: { value: 1 },
  }), []);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const theatre = theatrePresentationRef.current;
    spatialTransitionRef.current = THREE.MathUtils.damp(spatialTransitionRef.current, isSpatial ? 1 : 0, 5.5, delta);
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.001, 1 - spatial);
    const visibility = Math.max(0, 1 - spatial * 0.98);
    bootProgressRef.current = THREE.MathUtils.damp(bootProgressRef.current, systemState === 'BOOTING' ? 0 : 1, 4.5, delta);

    const voice = THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35);
    const gestureEnergy = THREE.MathUtils.clamp(gestureState.energy.current, 0, 1);
    let stateActivity = 0.16;
    if (systemState === 'LISTENING') stateActivity = 0.48;
    if (systemState === 'THINKING') stateActivity = 0.72;
    if (systemState === 'SEARCHING') stateActivity = 0.82;
    if (systemState === 'ANALYZING') stateActivity = 0.68;
    if (systemState === 'SPEAKING') stateActivity = 0.58;
    if (systemState === 'ERROR') stateActivity = 0.70;
    const audioMotion = THREE.MathUtils.clamp(bass * 0.20 + treble * 0.12, 0, 0.3);
    const activity = THREE.MathUtils.clamp(stateActivity * 0.12 + audioMotion + voice * 0.30 + gestureEnergy * 0.24, 0, 1);
    const pulse = THREE.MathUtils.clamp(0.30 + theatre.halo * 0.22 + Math.sin(time * 0.82) * 0.05 + activity * 0.15, 0.12, 0.82);

    coreUniforms.uTime.value = time;
    coreUniforms.uPulse.value = pulse;
    coreUniforms.uVoice.value = voice;
    coreUniforms.uActivity.value = activity;
    coreUniforms.uVisibility.value = visibility;
    auraUniforms.uPulse.value = pulse;
    auraUniforms.uVisibility.value = visibility;

    if (groupRef.current) {
      const breathing = 1 + (theatre.breathing - 0.5) * 0.065 + Math.sin(time * 0.72) * 0.01;
      const compact = viewportWidth < 640 ? 1.28 : 1.82;
      const homeOffsetX = isHome && viewportWidth >= 640 ? 2.45 : 0;
      const homeOffsetY = isHome && viewportWidth < 640 ? 1.85 : (isHome ? 0.12 : 0);
      groupRef.current.position.set(gestureState.pos.x + homeOffsetX, gestureState.pos.y + homeOffsetY, 0);
      groupRef.current.rotation.set(gestureState.rot.x, gestureState.rot.y, gestureState.rot.z);
      groupRef.current.scale.setScalar(Math.max(
        0.001,
        bootProgressRef.current * hologramIntensity * gestureState.scale.current * breathing
          * (1 + activity * 0.025) * compact * collapse
      ));
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.055;
      coreRef.current.rotation.x = Math.sin(time * 0.32) * 0.025;
    }
    if (auraRef.current) {
      auraRef.current.scale.setScalar(1.13 + Math.sin(time * 0.82) * 0.018 + pulse * 0.025);
    }
    if (orbitARef.current) {
      orbitARef.current.rotation.set(0.72 + Math.sin(time * 0.15) * 0.04, time * 0.10, 0.28);
    }
    if (orbitBRef.current) {
      orbitBRef.current.rotation.set(1.13, -time * 0.075, 0.72 + Math.sin(time * 0.17) * 0.035);
    }
    if (orbitCRef.current) {
      orbitCRef.current.rotation.set(0.12, time * 0.045, -0.38);
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -time * 0.025;
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.34 + pulse * 0.16;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ADVIS Core: deep cobalt energy, an animated surface grid and a cold-blue rim. */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.9, 96, 96]} />
        <shaderMaterial uniforms={coreUniforms} vertexShader={orbVertexShader} fragmentShader={orbFragmentShader} transparent depthWrite={false} side={THREE.FrontSide} />
      </mesh>
      <mesh ref={auraRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial uniforms={auraUniforms} vertexShader={orbVertexShader} fragmentShader={auraFragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.FrontSide} />
      </mesh>

      {/* Three restrained orbital traces restore the recognizable spatial-intelligence silhouette. */}
      <group ref={orbitARef}>
        <mesh>
          <torusGeometry args={[1.42, 0.009, 8, 180]} />
          <meshBasicMaterial color="#2d83ff" transparent opacity={0.72} depthWrite={false} />
        </mesh>
        <mesh rotation={[0, 0, 0.22]}>
          <torusGeometry args={[1.52, 0.0035, 6, 180, Math.PI * 0.64]} />
          <meshBasicMaterial color="#8ceaff" transparent opacity={0.92} depthWrite={false} />
        </mesh>
      </group>
      <group ref={orbitBRef}>
        <mesh>
          <torusGeometry args={[1.72, 0.006, 8, 180, Math.PI * 1.52]} />
          <meshBasicMaterial color="#1264e8" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>
      <group ref={orbitCRef}>
        <mesh>
          <torusGeometry args={[2.02, 0.0035, 6, 180, Math.PI * 0.78]} />
          <meshBasicMaterial color="#4ab9ff" transparent opacity={0.66} depthWrite={false} />
        </mesh>
      </group>

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#78caff" size={0.024} sizeAttenuation transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
