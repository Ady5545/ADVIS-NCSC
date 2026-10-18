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

const TAU = Math.PI * 2;

function createParticleCloud(
  count: number,
  minRadius: number,
  maxRadius: number,
  seed: number,
): Float32Array {
  const positions = new Float32Array(count * 3);
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let i = 0; i < count; i++) {
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, Math.pow(random(), 0.68));
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius;
    positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
  }
  return positions;
}

/**
 * ADVIS Core — the original spatial-intelligence identity rebuilt around
 * a compact white-hot nucleus and three interlocking, animated orbital paths.
 * The geometry stays deliberately legible: energy, not a cloud of UI clutter.
 */
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
  const nucleusGroupRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const orbitARef = useRef<THREE.Group>(null);
  const orbitBRef = useRef<THREE.Group>(null);
  const orbitCRef = useRef<THREE.Group>(null);
  const outerParticlesRef = useRef<THREE.Points>(null);
  const innerParticlesRef = useRef<THREE.Points>(null);
  const ionSparksRef = useRef<THREE.Points>(null);
  const nucleusMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const hotCenterMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const spatialTransitionRef = useRef(0);
  const bootProgressRef = useRef(systemState === 'BOOTING' ? 0 : 1);

  const outerParticles = useMemo(
    () => createParticleCloud(210, 1.62, 2.55, 0xAD15A5),
    [],
  );
  const innerParticles = useMemo(
    () => createParticleCloud(74, 0.64, 1.52, 0x71F3C1),
    [],
  );
  // A small warm-white ion field echoes the supplied reference without changing
  // ADVIS's characteristic blue-white Core into an orange orb.
  const ionSparks = useMemo(
    () => createParticleCloud(34, 0.92, 2.18, 0xF2B36A),
    [],
  );

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const theatre = theatrePresentationRef.current;

    spatialTransitionRef.current = THREE.MathUtils.damp(
      spatialTransitionRef.current,
      isSpatial ? 1 : 0,
      5.5,
      delta,
    );
    const spatial = spatialTransitionRef.current;
    const collapse = Math.max(0.001, 1 - spatial);
    const visibility = Math.max(0.025, 1 - spatial * 0.975);
    bootProgressRef.current = THREE.MathUtils.damp(
      bootProgressRef.current,
      systemState === 'BOOTING' ? 0 : 1,
      4.5,
      delta,
    );

    const voice = THREE.MathUtils.smoothstep(audioLevel, 0.02, 0.35);
    const gestureEnergy = THREE.MathUtils.clamp(gestureState.energy.current, 0, 1);
    const motionEnergy = THREE.MathUtils.clamp(
      bass * 0.42 + treble * 0.20 + gestureEnergy * 0.32 + voice * 0.28,
      0,
      1,
    );

    let stateActivity = 0.18;
    if (systemState === 'LISTENING') stateActivity = 0.48;
    if (systemState === 'THINKING') stateActivity = 0.70;
    if (systemState === 'SEARCHING') stateActivity = 0.82;
    if (systemState === 'ANALYZING') stateActivity = 0.66;
    if (systemState === 'SPEAKING') stateActivity = 0.60;
    if (systemState === 'ERROR') stateActivity = 0.72;

    const pulse = THREE.MathUtils.clamp(
      0.30 + theatre.halo * 0.22 + Math.sin(time * 1.18) * 0.055
        + stateActivity * 0.12 + motionEnergy * 0.16,
      0.14,
      0.84,
    );
    const breath = 1 + (theatre.breathing - 0.5) * 0.06 + Math.sin(time * 0.74) * 0.012;
    const orbitSpeed = 0.55 + stateActivity * 0.42 + motionEnergy * 0.34;
    const compact = viewportWidth < 640 ? 1.12 : viewportWidth < 1024 ? 1.45 : 1.72;
    const homeOffsetX = isHome && viewportWidth >= 1024 ? 2.45 : 0;
    const homeOffsetY = isHome && viewportWidth < 1024 ? 2.45 : (isHome ? 0.08 : 0);

    if (groupRef.current) {
      groupRef.current.position.set(
        gestureState.pos.x + homeOffsetX,
        gestureState.pos.y + homeOffsetY,
        0,
      );
      groupRef.current.rotation.set(
        gestureState.rot.x,
        gestureState.rot.y,
        gestureState.rot.z,
      );
      groupRef.current.scale.setScalar(Math.max(
        0.001,
        bootProgressRef.current * hologramIntensity * gestureState.scale.current
          * breath * (1 + motionEnergy * 0.025) * compact * collapse,
      ));
    }

    if (nucleusGroupRef.current) {
      nucleusGroupRef.current.scale.setScalar((0.94 + pulse * 0.14) * collapse);
      nucleusGroupRef.current.rotation.y = time * 0.16 + treble * 0.06;
      nucleusGroupRef.current.rotation.x = Math.sin(time * 0.48) * 0.045;
    }
    if (auraRef.current) {
      auraRef.current.scale.setScalar(1.0 + pulse * 0.10 + Math.sin(time * 1.05) * 0.018);
      const material = auraRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.075 + pulse * 0.035 + voice * 0.035) * visibility;
    }
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1.0 + pulse * 0.045);
      const material = coronaRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.10 + pulse * 0.045 + motionEnergy * 0.025) * visibility;
    }

    // These three planes deliberately keep a readable atom-like silhouette while
    // slowly precessing around one another, rather than spinning as a rigid cage.
    if (orbitARef.current) {
      orbitARef.current.rotation.set(
        0.18 + Math.sin(time * 0.17) * 0.055,
        time * 0.12 * orbitSpeed,
        0.16 + Math.sin(time * 0.11) * 0.04,
      );
    }
    if (orbitBRef.current) {
      orbitBRef.current.rotation.set(
        1.03 + Math.sin(time * 0.13) * 0.045,
        0.62 - time * 0.085 * orbitSpeed,
        0.76 + Math.sin(time * 0.16) * 0.04,
      );
    }
    if (orbitCRef.current) {
      orbitCRef.current.rotation.set(
        1.72 + Math.sin(time * 0.15) * 0.04,
        -0.34 + time * 0.066 * orbitSpeed,
        1.32 - Math.sin(time * 0.12) * 0.045,
      );
    }

    if (outerParticlesRef.current) {
      outerParticlesRef.current.rotation.y = -time * 0.028 * orbitSpeed;
      outerParticlesRef.current.rotation.x = Math.sin(time * 0.19) * 0.025;
      const material = outerParticlesRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.30 + pulse * 0.12) * visibility;
    }
    if (innerParticlesRef.current) {
      innerParticlesRef.current.rotation.y = time * 0.06 * orbitSpeed;
      const material = innerParticlesRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.36 + pulse * 0.12) * visibility;
    }
    if (ionSparksRef.current) {
      ionSparksRef.current.rotation.y = -time * 0.045 * orbitSpeed;
      ionSparksRef.current.rotation.z = Math.sin(time * 0.27) * 0.04;
      const material = ionSparksRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.15 + pulse * 0.08 + voice * 0.06) * visibility;
    }
    if (nucleusMaterialRef.current) {
      nucleusMaterialRef.current.opacity = Math.min(1, 0.86 + pulse * 0.12) * visibility;
    }
    if (hotCenterMaterialRef.current) {
      hotCenterMaterialRef.current.opacity = Math.min(1, 0.82 + pulse * 0.18) * visibility;
    }
  });

  return (
    <group ref={groupRef}>
      {/* A quiet blue corona gives the nucleus depth without becoming a second sphere. */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.49, 48, 48]} />
        <meshBasicMaterial
          color="#168bff"
          transparent
          opacity={0.10}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[0.34, 48, 48]} />
        <meshBasicMaterial
          color="#55dcff"
          transparent
          opacity={0.13}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* A small white-hot centre remains visible at the heart of the orbital paths. */}
      <group ref={nucleusGroupRef}>
        <mesh>
          <sphereGeometry args={[0.235, 48, 48]} />
          <meshBasicMaterial
            ref={nucleusMaterialRef}
            color="#8deaff"
            transparent
            opacity={0.96}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.125, 40, 40]} />
          <meshBasicMaterial
            ref={hotCenterMaterialRef}
            color="#f1ffff"
            transparent
            opacity={0.96}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.065, 32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.98}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Each path has a broad low-opacity underglow and one crisp luminous line. */}
      <group ref={orbitARef}>
        <mesh>
          <torusGeometry args={[1.38, 0.024, 8, 160]} />
          <meshBasicMaterial color="#168bff" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.38, 0.009, 8, 192]} />
          <meshBasicMaterial color="#b8f4ff" transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <group ref={orbitBRef}>
        <mesh>
          <torusGeometry args={[1.47, 0.025, 8, 160]} />
          <meshBasicMaterial color="#1575ff" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.47, 0.008, 8, 192]} />
          <meshBasicMaterial color="#52cfff" transparent opacity={0.86} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <group ref={orbitCRef}>
        <mesh>
          <torusGeometry args={[1.56, 0.022, 8, 160]} />
          <meshBasicMaterial color="#2987ff" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.56, 0.008, 8, 192]} />
          <meshBasicMaterial color="#88e4ff" transparent opacity={0.82} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Fine, controlled particles orbit beyond the paths; a few warm sparks echo the reference. */}
      <points ref={outerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outerParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#78caff"
          size={0.019}
          sizeAttenuation
          transparent
          opacity={0.38}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={innerParticlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[innerParticles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e3fbff"
          size={0.013}
          sizeAttenuation
          transparent
          opacity={0.40}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={ionSparksRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ionSparks, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffc477"
          size={0.015}
          sizeAttenuation
          transparent
          opacity={0.20}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
