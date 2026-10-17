import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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

const orbVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vLocalPosition = position;
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
    vec3 normal = normalize(vViewNormal);
    vec3 viewDirection = normalize(vViewPosition);
    vec3 lightDirection = normalize(vec3(-0.42, 0.48, 0.78));

    float diffuse = max(dot(normal, lightDirection), 0.0);
    float facing = max(dot(normal, viewDirection), 0.0);
    float rim = pow(1.0 - facing, 3.0);
    float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 28.0);

    vec3 midnight = vec3(0.006, 0.018, 0.075);
    vec3 cobalt = vec3(0.018, 0.105, 0.48);
    vec3 electricBlue = vec3(0.025, 0.30, 0.96);
    vec3 iceBlue = vec3(0.20, 0.79, 1.0);

    float illumination = smoothstep(0.0, 0.95, diffuse);
    vec3 color = mix(midnight, cobalt, illumination);
    color = mix(color, electricBlue, pow(illumination, 1.7) * 0.72);

    // A single slow, soft current gives the surface life without adding geometry.
    float currentWave = sin(
      vLocalPosition.y * 4.1
      + sin(vLocalPosition.x * 3.0 + uTime * 0.18) * 0.52
      + vLocalPosition.z * 2.0
      - uTime * 0.14
    );
    float current = smoothstep(0.68, 0.98, currentWave) * 0.075;
    color = mix(color, vec3(0.035, 0.34, 0.92), current);

    color += iceBlue * rim * (0.30 + uPulse * 0.22);
    color += vec3(0.54, 0.88, 1.0) * specular * (0.55 + uVoice * 0.35);
    color *= 0.94 + uPulse * 0.10 + uActivity * 0.045;

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
    vec3 normal = normalize(vViewNormal);
    vec3 viewDirection = normalize(vViewPosition);
    float facing = max(dot(normal, viewDirection), 0.0);
    float rim = pow(1.0 - facing, 3.4);
    float alpha = rim * (0.19 + uPulse * 0.12) * uVisibility;
    vec3 deepBlue = vec3(0.012, 0.08, 0.46);
    vec3 brightBlue = vec3(0.025, 0.32, 1.0);
    vec3 color = mix(deepBlue, brightBlue, smoothstep(0.12, 0.95, rim));
    gl_FragColor = vec4(color, alpha);
  }
`;

export function HologramCore({
  systemState,
  audioLevel,
  bass = 0,
  treble = 0,
  hologramIntensity = 1,
  isSpatial = false,
}: HologramProps) {
  const gestureState = useGestureEngine();
  const theatrePresentationRef = useTheatreOrbPresentation(!isSpatial);

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const spatialTransitionRef = useRef(0);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);

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

    spatialTransitionRef.current = THREE.MathUtils.damp(
      spatialTransitionRef.current,
      isSpatial ? 1 : 0,
      5.5,
      delta
    );
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.001, 1 - spatial);
    const visibility = Math.max(0, 1 - spatial * 0.98);

    bootProgressRef.current = THREE.MathUtils.damp(
      bootProgressRef.current,
      systemState === 'BOOTING' ? 0 : 1,
      4.5,
      delta
    );

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
    const activity = THREE.MathUtils.clamp(
      stateActivity * 0.12 + audioMotion + voice * 0.30 + gestureEnergy * 0.24,
      0,
      1
    );
    const pulse = THREE.MathUtils.clamp(
      0.24 + theatre.halo * 0.18 + Math.sin(time * 0.82) * 0.045 + activity * 0.12,
      0.12,
      0.78
    );

    coreUniforms.uTime.value = time;
    coreUniforms.uPulse.value = pulse;
    coreUniforms.uVoice.value = voice;
    coreUniforms.uActivity.value = activity;
    coreUniforms.uVisibility.value = visibility;

    auraUniforms.uPulse.value = pulse;
    auraUniforms.uVisibility.value = visibility;

    if (groupRef.current) {
      const breathing = 1 + (theatre.breathing - 0.5) * 0.055 + Math.sin(time * 0.72) * 0.008;
      groupRef.current.position.set(gestureState.pos.x, gestureState.pos.y, 0);
      groupRef.current.rotation.set(
        gestureState.rot.x,
        gestureState.rot.y,
        gestureState.rot.z
      );
      groupRef.current.scale.setScalar(
        Math.max(
          0.001,
          bootProgressRef.current
            * hologramIntensity
            * gestureState.scale.current
            * breathing
            * (1 + activity * 0.018)
            * collapse
        )
      );
    }

    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.045;
      coreRef.current.rotation.x = Math.sin(time * 0.31) * 0.018;
    }

    if (auraRef.current) {
      const breathing = Math.sin(time * 0.82) * 0.012;
      auraRef.current.scale.setScalar(1.15 + breathing + pulse * 0.018);
    }
  });

  return (
    <group ref={groupRef}>
      {/* One sculpted blue energy sphere. Its light and surface current live in the shader. */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.9, 96, 96]} />
        <shaderMaterial
          uniforms={coreUniforms}
          vertexShader={orbVertexShader}
          fragmentShader={orbFragmentShader}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* A single feather-light rim gives the sphere depth without surrounding clutter. */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          uniforms={auraUniforms}
          vertexShader={orbVertexShader}
          fragmentShader={auraFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
