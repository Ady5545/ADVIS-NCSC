import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Points, PointMaterial, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { SystemState } from './App';
import { useGestureEngine } from './GestureContext';

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

export function HologramCore({
  systemState,
  audioLevel,
  bass = 0,
  treble = 0,
  hologramIntensity = 1,
  themeColor = '#0088ff',
  handTracking,
  isSpatial = false
}: HologramProps) {
  const gestureState = useGestureEngine();
  const groupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const innerShellRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const ripplesRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const spatialTransitionRef = useRef(0);

  // Holographic 3D Frequency Waveform Loop Refs
  const waveformRef1 = useRef<THREE.LineLoop>(null);
  const waveformRef2 = useRef<THREE.LineLoop>(null);
  const waveformRef3 = useRef<THREE.LineLoop>(null);

  // Ref trackers for smooth frequency interpolation
  const smoothedBassRef = useRef(0);
  const smoothedTrebleRef = useRef(0);

  const particleCount = 120; // Drastically reduced for performance
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.5 + Math.random() * 2.0;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  const ringConfigs = useMemo(() => {
    // Reduced to 3 essential rings
    return [
      { radius: 2.8, tube: 0.008, rx: 0, ry: 0, rz: 0 },
      { radius: 3.2, tube: 0.015, rx: Math.PI / 4, ry: Math.PI / 4, rz: 0 },
      { radius: 3.8, tube: 0.01, rx: Math.PI / 2, ry: 0, rz: Math.PI / 4 },
    ];
  }, []);

  const pointsCount = 120;
  const initialPointsArr = useMemo(() => {
    const arr = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;
      arr[i * 3] = Math.cos(angle) * 2.5;
      arr[i * 3 + 1] = Math.sin(angle) * 2.5;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);

  const getThemeColor = () => {
    switch(systemState) {
      case 'LISTENING': return '#00ffff'; 
      case 'THINKING': return '#00aaff'; 
      case 'SEARCHING': return '#0066ff';
      case 'ANALYZING': return '#9933ff'; 
      case 'SPEAKING': return '#00e5ff'; 
      case 'ERROR': return '#ff0033'; 
      default: return themeColor; 
    }
  };

  const whiteBlue = '#ccffff';

  // Memoize materials to prevent recreation and reduce draw call overhead
  const materials = useMemo(() => {
    return {
      nucleus: new THREE.MeshBasicMaterial({ color: whiteBlue, transparent: true, opacity: 0.8 }),
      shell: new THREE.MeshBasicMaterial({ color: '#0088ff', transparent: true, opacity: 0.3, wireframe: true, blending: THREE.AdditiveBlending }),
      ripples: [0, 1].map(() => new THREE.MeshBasicMaterial({ color: whiteBlue, transparent: true, opacity: 0, wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending })),
      rings: ringConfigs.map((_, i) => new THREE.MeshBasicMaterial({
        color: '#0088ff',
        transparent: true,
        opacity: i % 2 === 0 ? 0.6 : 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })),
      wave1: new THREE.LineBasicMaterial({ color: whiteBlue, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
      wave2: new THREE.LineBasicMaterial({ color: '#0088ff', transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }),
      wave3: new THREE.LineBasicMaterial({ color: '#0088ff', transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false })
    };
  }, [ringConfigs]);

  // Update material colors efficiently without recreating them
  useEffect(() => {
    const baseColor = new THREE.Color(getThemeColor());
    
    // Scale color brightness by hologramIntensity
    const c = new THREE.Color(
      Math.min(1, baseColor.r * hologramIntensity),
      Math.min(1, baseColor.g * hologramIntensity),
      Math.min(1, baseColor.b * hologramIntensity)
    );
    
    materials.shell.color = c;
    materials.rings.forEach(m => m.color = c);
    materials.wave2.color = c;
    materials.wave3.color = c;

    const whiteBlueBase = new THREE.Color('#ccffff');
    const wb = new THREE.Color(
      Math.min(1, whiteBlueBase.r * hologramIntensity),
      Math.min(1, whiteBlueBase.g * hologramIntensity),
      Math.min(1, whiteBlueBase.b * hologramIntensity)
    );
    materials.nucleus.color = wb;
    materials.ripples.forEach(m => m.color = wb);
  }, [systemState, materials, hologramIntensity, themeColor]);

  const pulseTimeRef = useRef(0);
  const bootProgressRef = useRef(0);
  
  

  

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    pulseTimeRef.current += delta * ((systemState === 'THINKING' || systemState === 'ANALYZING' || systemState === 'SEARCHING') ? 4 : 1.5);
    
    // Boot sequence animation
    if (systemState === 'BOOTING') {
      bootProgressRef.current = THREE.MathUtils.lerp(bootProgressRef.current, 0, 0.1);
    } else {
      bootProgressRef.current = THREE.MathUtils.lerp(bootProgressRef.current, 1, 0.05);
    }
    
    // Calculate mouse proximity (distance from center 0,0)
    const distance = Math.sqrt(state.pointer.x * state.pointer.x + state.pointer.y * state.pointer.y);
    const proximity = Math.max(0, 1 - distance * 0.8); // 1 near center, drops off towards edges
    const proximityBoost = 1 + (proximity * 0.5); // 1.0 to 1.5x brightness/scale boost

        
    const curPosX = gestureState.pos.x;
    const curPosY = gestureState.pos.y;
    const curScaleMult = gestureState.scale.current;
    const curRotX = gestureState.rot.x;
    const curRotY = gestureState.rot.y;
    const curRotZ = gestureState.rot.z;
    const curEnergy = gestureState.energy.current;
    
    

    const totalVelocity = Math.abs(curRotX * 2) + Math.abs(curRotY * 2);
                          
    const momentumEnergy = Math.min(1.0, totalVelocity * 0.05);

    const bootP = bootProgressRef.current * hologramIntensity * proximityBoost * curScaleMult;
    const activeBootP = bootP * (1.0 + momentumEnergy * 0.15);

    if (groupRef.current) {
      groupRef.current.position.set(curPosX, curPosY, 0);
      groupRef.current.scale.setScalar(Math.max(0.001, activeBootP));
      groupRef.current.rotation.set(curRotX, curRotY, curRotZ);
    }

    // --- Dynamic Bass and Treble Interpolation & Idle Behavior ---
    smoothedBassRef.current = THREE.MathUtils.lerp(smoothedBassRef.current, bass + curEnergy * 0.5, 0.15);
    smoothedTrebleRef.current = THREE.MathUtils.lerp(smoothedTrebleRef.current, treble + curEnergy * 0.3, 0.15);

    let idleBass = 0;
    let idleTreble = 0;

    if (systemState === 'THINKING' || systemState === 'ANALYZING') {
      idleBass = (Math.sin(time * 5) * 0.15 + 0.15);
      idleTreble = (Math.sin(time * 12) * 0.08 + 0.08);
    } else if (systemState === 'SEARCHING') {
      idleBass = (Math.sin(time * 8) * 0.2 + 0.2);
      idleTreble = (Math.sin(time * 18) * 0.1 + 0.1);
    } else if (systemState === 'BOOTING') {
      idleBass = 0;
      idleTreble = 0;
    } else {
      // Gentle idle hum
      idleBass = (Math.sin(time * 1.5) * 0.05 + 0.05);
      idleTreble = (Math.sin(time * 4.0) * 0.02 + 0.02);
    }

    const curBass = Math.max(idleBass, smoothedBassRef.current + momentumEnergy * 0.6);
    const curTreble = Math.max(idleTreble, smoothedTrebleRef.current + momentumEnergy * 0.4);

    // --- 3D Frequency Waveform Loops (Orthogonal Deformations) ---

    // XY plane wave loop (ref1)
    if (waveformRef1.current) {
      const geom = waveformRef1.current.geometry;
      const pos = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        
        // Bass creates slow swelling waves with low peak frequency
        const bassFactor = Math.sin(angle * 2 - time * 3.5) * curBass * 1.3;
        // Treble creates high-speed ripples with high peak frequency
        const trebleFactor = Math.sin(angle * 12 + time * 14.0) * curTreble * 0.45;
        
        const r = 2.4 + bassFactor + trebleFactor;
        pos.setXY(i, Math.cos(angle) * r, Math.sin(angle) * r);
      }
      pos.needsUpdate = true;
      // Slow rotation of XY plane
      waveformRef1.current.rotation.z = time * 0.08;
    }

    // YZ plane wave loop (ref2)
    if (waveformRef2.current) {
      const geom = waveformRef2.current.geometry;
      const pos = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        
        // Offset phases to create organic 3D variation
        const bassFactor = Math.cos(angle * 3 - time * 2.8) * curBass * 1.0;
        const trebleFactor = Math.cos(angle * 16 + time * 16.5) * curTreble * 0.35;
        
        const r = 2.4 + bassFactor + trebleFactor;
        pos.setXY(i, Math.cos(angle) * r, Math.sin(angle) * r);
      }
      pos.needsUpdate = true;
      // Reverse slow rotation of YZ plane
      waveformRef2.current.rotation.z = -time * 0.12;
    }

    // XZ plane wave loop (ref3)
    if (waveformRef3.current) {
      const geom = waveformRef3.current.geometry;
      const pos = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        
        // Third orthogonal representation with unique mathematical patterns
        const bassFactor = Math.sin(angle * 4 - time * 4.2) * curBass * 1.1;
        const trebleFactor = Math.sin(angle * 10 - time * 9.5) * curTreble * 0.5;
        
        const r = 2.4 + bassFactor + trebleFactor;
        pos.setXY(i, Math.cos(angle) * r, Math.sin(angle) * r);
      }
      pos.needsUpdate = true;
      // Slow tilt-spinning of XZ plane
      waveformRef3.current.rotation.z = time * 0.15;
    }

    // --- Sub-component reactive scaling with spatial transition collapse ---
    const targetSpatialTransition = isSpatial ? 1.0 : 0.0;
    spatialTransitionRef.current = THREE.MathUtils.lerp(spatialTransitionRef.current, targetSpatialTransition, 0.05);
    const sTrans = spatialTransitionRef.current;
    const transScaleFactor = 1.0 - sTrans * 1.0; // shrinks to 15% size
    const transCollapseFactor = 1.0 - sTrans * 1.0; // collapses rings/waves/shells to 5% size
    const transOpacityFactor = 1.0 - sTrans * 1.0; // dims to 20% opacity

    if (nucleusRef.current) {
      nucleusRef.current.rotation.y -= delta * 0.5;
      nucleusRef.current.rotation.x -= delta * 0.3;
      
      // Core size scales with the bass intensity and collapses during spatial transition
      const nucleusScale = (1.0 + curBass * 0.4) * transScaleFactor;
      nucleusRef.current.scale.setScalar(nucleusScale);

      if (systemState === 'SPEAKING' || systemState === 'LISTENING') {
        materials.nucleus.opacity = Math.min(1, (systemState === 'LISTENING' ? 0.75 : 0.6) + (curBass * 0.5)) * bootP * transOpacityFactor;
      } else {
        materials.nucleus.opacity = (0.7 + Math.sin(pulseTimeRef.current) * 0.1) * bootP * transOpacityFactor;
      }
    }

    if (innerShellRef.current) {
      innerShellRef.current.rotation.y += delta * (0.3 + curTreble * 1.5); // Spins faster with treble!
      innerShellRef.current.rotation.z += delta * (0.2 + curBass * 0.5);   // Wobbles with bass!
      
      const shellScale = (1.0 + curTreble * 0.25) * transCollapseFactor;
      innerShellRef.current.scale.setScalar(shellScale);
      materials.shell.opacity = (0.25 + curTreble * 0.2 + momentumEnergy * 0.3) * bootP * transOpacityFactor;
    }

    if (ringsRef.current) {
      const momentumSpeedBoost = momentumEnergy * 3.0;
      const speedMult = (systemState === 'THINKING' || systemState === 'ANALYZING') ? 2.5 : (systemState === 'SEARCHING' ? 3.0 : 0.6 + curBass * 1.5 + momentumSpeedBoost);
      ringsRef.current.scale.setScalar(transCollapseFactor);
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.z += delta * speedMult * (i % 2 === 0 ? 0.4 : -0.4);
        const baseOpacity = i % 2 === 0 ? 0.5 : 0.25;
        if (systemState === 'SPEAKING' || systemState === 'LISTENING') {
          materials.rings[i].opacity = Math.min(1, baseOpacity + (curBass * 0.6)) * Math.max(0, (bootP - 0.6) / 0.4) * transOpacityFactor;
        } else {
          materials.rings[i].opacity = baseOpacity * Math.max(0, (bootP - 0.6) / 0.4) * transOpacityFactor;
        }
      });
    }

    if (ripplesRef.current) {
      ripplesRef.current.scale.setScalar(transCollapseFactor);
      ripplesRef.current.children.forEach((ripple, i) => {
        if (systemState === 'SPEAKING' && audioLevel > 0.05) {
          const offset = i * 0.8;
          const rippleCycle = (time * 2.0 + offset) % 2.5;
          const scale = 1 + (rippleCycle * 0.3) + curBass * 0.2;
          ripple.scale.set(scale, scale, scale);
          const fadeOut = Math.max(0, 1 - (rippleCycle / 2.5)); 
          materials.ripples[i].opacity = fadeOut * (audioLevel * 0.8) * bootP * transOpacityFactor;
        } else if (systemState === 'LISTENING') {
          const offset = i * 1.5;
          const rippleCycle = (time * 1.0 + offset) % 4.0;
          const scale = 1 + (rippleCycle * 0.15) + curBass * 0.15;
          ripple.scale.set(scale, scale, scale);
          const fadeOut = Math.max(0, 1 - (rippleCycle / 4.0)); 
          materials.ripples[i].opacity = fadeOut * 0.2 * bootP * transOpacityFactor;
        } else {
          ripple.scale.set(1, 1, 1);
          materials.ripples[i].opacity += (0 - materials.ripples[i].opacity) * 0.15;
        }
      });
    }

    if (particlesRef.current) {
      particlesRef.current.scale.setScalar(1.0 - sTrans * 0.9); // collapse particles inward to center!
      particlesRef.current.rotation.y += delta * ((systemState === 'THINKING' || systemState === 'ANALYZING' || systemState === 'SEARCHING') ? 0.3 : 0.05 + curTreble * 0.5);
      particlesRef.current.rotation.x += delta * 0.02;
      const mat = particlesRef.current.material as THREE.PointsMaterial;
      if (systemState === 'SPEAKING' || systemState === 'LISTENING') {
        mat.size += ((0.04 + (curTreble * 0.06)) - mat.size) * 0.1;
      } else {
        mat.size += (0.04 - mat.size) * 0.1;
      }
      mat.opacity = (0.6 + curTreble * 0.4) * Math.max(0, (bootP - 0.7) / 0.3) * transOpacityFactor;
    }

    // Collapse orthogonal wave loops
    if (waveformRef1.current) waveformRef1.current.scale.setScalar(transCollapseFactor);
    if (waveformRef2.current) waveformRef2.current.scale.setScalar(transCollapseFactor);
    if (waveformRef3.current) waveformRef3.current.scale.setScalar(transCollapseFactor);
  });

  return (
    <group ref={groupRef}>
      {/* Central Nucleus */}
      <Sphere ref={nucleusRef} args={[1.2, 24, 24]} material={materials.nucleus} />

      {/* Inner Geometric Shell */}
      <Icosahedron ref={innerShellRef} args={[1.6, 1]} material={materials.shell} />
      
      {/* Voice Ripples */}
      <group ref={ripplesRef}>
        {[0, 1].map((i) => (
          <Sphere key={`ripple-${i}`} args={[2.05, 32, 32]} material={materials.ripples[i]} />
        ))}
      </group>

      {/* Primary Rings Removed per Tony Stark style */}

      {/* --- 3D Frequency Waveform Loops (Orthogonal Planes) --- */}
      <lineLoop ref={waveformRef1}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPointsArr, 3]}
          />
        </bufferGeometry>
        <primitive object={materials.wave1} attach="material" />
      </lineLoop>

      <lineLoop ref={waveformRef2} rotation={[0, Math.PI / 2, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPointsArr, 3]}
          />
        </bufferGeometry>
        <primitive object={materials.wave2} attach="material" />
      </lineLoop>

      <lineLoop ref={waveformRef3} rotation={[Math.PI / 2, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPointsArr, 3]}
          />
        </bufferGeometry>
        <primitive object={materials.wave3} attach="material" />
      </lineLoop>

      {/* Sparse Particle Cloud */}
      <Points ref={particlesRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial 
          transparent 
          color={new THREE.Color('#ccffff').multiplyScalar(Math.min(1.5, hologramIntensity))} 
          size={0.04} 
          sizeAttenuation={true} 
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}
