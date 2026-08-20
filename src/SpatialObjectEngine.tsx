import { EngineBlockAssembly, PistonAssemblyBank, ConnectingRodsAssembly, CrankshaftAssembly, ValvetrainAssembly, IntakePlenum, ExhaustManifold, CoolingSystem, LubricationSystem, ElectronicsSensors } from './generators/MechanicalGenerator';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line, Sphere, Box, Cylinder, Torus, Html } from '@react-three/drei';
import * as THREE from 'three';

class GLTFErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <group>
          <Box args={[1,1,1]}>
             <meshBasicMaterial color="#ef4444" wireframe />
          </Box>
          <Html center>
            <div className="bg-red-900/80 text-red-100 text-xs px-2 py-1 rounded font-mono border border-red-500">
              MISSING ASSET
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}


import { useGLTF } from '@react-three/drei';

// Preloads are handled on-demand within RealisticGLTFModel inside Canvas context


function RealisticGLTFModel({ 
  url, 
  isHovered, 
  isSelected, 
  scale = 1.0,
  xrayEnabled,
  blueprintEnabled,
  isHighlighted
}: { 
  url: string, 
  isHovered: boolean, 
  isSelected: boolean, 
  scale?: number,
  xrayEnabled?: boolean,
  blueprintEnabled?: boolean,
  isHighlighted?: boolean
}) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  const originalMaterialsRef = useRef<Map<any, { transparent: boolean, opacity: number, wireframe: boolean, emissive?: any }>>(new Map());
  
  const clonedScene = useMemo(() => {
    try {
      console.log("GLB LOADED: " + url);
      const clone = scene.clone();
      
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      let dist = camera.position.length();
      if (dist < 1 || isNaN(dist)) dist = 15;
      
      const fov = (camera as THREE.PerspectiveCamera).fov || 45;
      const vFOV = THREE.MathUtils.degToRad(fov);
      const visibleHeight = 2 * Math.tan(vFOV / 2) * dist;
      
      const targetSize = visibleHeight * 0.75; 
      const scaleMultiplier = maxDim > 0 ? targetSize / maxDim : 1.0;

      clone.position.x = -center.x;
      clone.position.y = -center.y;
      clone.position.z = -center.z;
      
      clone.scale.setScalar(scaleMultiplier);
      clone.position.multiplyScalar(scaleMultiplier);

      // Preserve original PBR materials and textures (no cyan tint washout)
      clone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          originalMaterialsRef.current.set(child.material, {
            transparent: child.material.transparent,
            opacity: child.material.opacity,
            wireframe: child.material.wireframe || false,
            emissive: child.material.emissive ? child.material.emissive.clone() : undefined
          });
        }
      });

      return clone;
    } catch (e) {
      console.error("GLB FAILED: " + url + " " + e);
      return null;
    }
  }, [scene, url, camera]);

  useEffect(() => {
    if (!clonedScene) return;
    clonedScene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        const orig = originalMaterialsRef.current.get(mat);

        if (xrayEnabled) {
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.depthWrite = false;
        } else if (orig) {
          mat.transparent = orig.transparent;
          mat.opacity = orig.opacity;
          mat.depthWrite = true;
        }

        if (blueprintEnabled) {
          mat.wireframe = true;
          if (mat.color) mat.color.set('#22d3ee');
        } else if (orig) {
          mat.wireframe = orig.wireframe;
        }

        if (isHighlighted && mat.emissive) {
          mat.emissive.set('#22d3ee');
        } else if (orig && orig.emissive && mat.emissive) {
          mat.emissive.copy(orig.emissive);
        }
      }
    });
  }, [clonedScene, xrayEnabled, blueprintEnabled, isHighlighted]);

  if (!clonedScene) {
     return <group><Box args={[1,1,1]}><meshBasicMaterial color="#ef4444" wireframe /></Box></group>;
  }

  // Tiny ambient floating particles around the object
  const particlesCount = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for(let i=0; i<particlesCount; i++) {
       pos[i*3] = (Math.random() - 0.5) * 10;
       pos[i*3+1] = (Math.random() - 0.5) * 10;
       pos[i*3+2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const particlesRef = useRef<THREE.Points>(null);
  useFrame((state) => {
     if (particlesRef.current) {
        particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02;
     }
  });

  return (
    <group scale={scale}>
       <primitive object={clonedScene} />
       <points ref={particlesRef}>
         <bufferGeometry>
           <bufferAttribute attach="attributes-position" args={[positions, 3]} />
         </bufferGeometry>
         <pointsMaterial color="#22d3ee" size={0.05} transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
       </points>
    </group>
  );
}


// 3D Spatial Metadata library with components and offsets
import { ComponentMetadata, ObjectMetadata, SPATIAL_LIBRARY } from './SpatialLibrary';
import { useGestureEngine } from './GestureContext';

export type SpatialMode = 'INSPECTION' | 'SHOWCASE' | 'EXPLODED' | 'DEMO';

interface SpatialObjectEngineProps {
  currentSpatialObject: string | string[] | null;
  selectedComponentId: string | null;
  hoveredComponentId: string | null;
  isExploded: boolean;
  isPresentationMode: boolean;
  presentationStep: number;
  spatialMode?: SpatialMode;
  onInteractionStateChange?: (isInteracting: boolean) => void;
  setSelectedComponentId: (id: string | null) => void;
  setHoveredComponentId: (id: string | null) => void;
  handTracking: any;
  setPresentationStep: React.Dispatch<React.SetStateAction<number>>;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  soundEnabled?: boolean;
  isExiting?: boolean;
  showLabels?: boolean;
  componentTransforms?: Record<string, { position: [number, number, number], rotation: [number, number, number], scale: [number, number, number] }>;
  explodedFactor?: number;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  highlightedComponentId?: string | null;
}


// Procedural Renderers
function ElectronCloud() {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 5000; i++) {
      // Gaussian distribution for probability cloud
      const u = 1 - Math.random(); // Converting [0,1) to (0,1]
      const v = Math.random();
      const radius = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * 0.8;
      
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pts.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
    }
    return new Float32Array(pts);
  }, []);
  
  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.2;
      ref.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#06b6d4" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function HydrogenAtom() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });
  return (
    <group ref={group}>
      <Sphere args={[0.2, 16, 16]} position={[0,0,0]}>
        <meshBasicMaterial color="#ef4444" transparent opacity={0.9} />
      </Sphere>
      <Torus args={[2, 0.01, 16, 100]} rotation={[Math.PI/2, 0, 0]}>
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </Torus>
      <Torus args={[2, 0.01, 16, 100]} rotation={[0, Math.PI/2, 0]}>
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </Torus>
      <Sphere args={[0.08, 16, 16]} position={[2,0,0]}>
        <meshBasicMaterial color="#22d3ee" transparent opacity={1} />
      </Sphere>
    </group>
  );
}

function AtomicNucleus() {
  return (
    <group>
      {/* 6 Protons, 6 Neutrons for Carbon-12 approximate clump */}
      {[...Array(12)].map((_, i) => {
        const isProton = i % 2 === 0;
        const radius = 0.5;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.cbrt(Math.random()) * radius;
        return (
          <Sphere key={i} args={[0.18, 16, 16]} position={[
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          ]}>
            <meshBasicMaterial color={isProton ? "#ef4444" : "#94a3b8"} transparent opacity={0.9} />
          </Sphere>
        );
      })}
    </group>
  );
}

function MagneticField() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.1;
  });
  return (
    <group ref={ref}>
      <Cylinder args={[0.3, 0.3, 2, 16]} rotation={[0, 0, Math.PI/2]}>
        <meshBasicMaterial color="#334155" />
      </Cylinder>
      {[...Array(20)].map((_, i) => (
        <Torus key={i} args={[1.5 + (i * 0.2), 0.01, 16, 64]} rotation={[Math.PI/2, Math.PI * (i/20), 0]}>
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
        </Torus>
      ))}
    </group>
  );
}

// --- HIGH FIDELITY PROCEDURAL MODELS ---

const HolographicMaterial = ({ 
  baseColor = '#06b6d4', 
  edgeColor = '#22d3ee',
  opacity = 0.8,
  wireframe = false,
  pulsate = false,
  isHovered = false,
  isSelected = false
}) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value = state.clock.elapsedTime;
      shaderRef.current.uniforms.isHovered.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.isHovered.value,
        isHovered ? 1.0 : 0.0,
        0.1
      );
      shaderRef.current.uniforms.isSelected.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.isSelected.value,
        isSelected ? 1.0 : 0.0,
        0.1
      );
    }
  });

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      baseColor: { value: new THREE.Color(baseColor) },
      edgeColor: { value: new THREE.Color(edgeColor) },
      globalOpacity: { value: opacity },
      isHovered: { value: isHovered ? 1.0 : 0.0 },
      isSelected: { value: isSelected ? 1.0 : 0.0 },
      pulsate: { value: pulsate ? 1.0 : 0.0 }
    }),
    [baseColor, edgeColor, opacity, pulsate]
  );

  return (
    <shaderMaterial
      ref={shaderRef}
      transparent
      depthWrite={!wireframe}
      wireframe={wireframe}
      blending={THREE.AdditiveBlending}
      side={THREE.DoubleSide}
      uniforms={uniforms}
      vertexShader={`
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 edgeColor;
        uniform float globalOpacity;
        uniform float isHovered;
        uniform float isSelected;
        uniform float pulsate;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          float buildY = (min(time, 3.0) * 2.0) - 3.0;
          if (time < 3.0 && vWorldPos.y > buildY) {
             discard;
          }

          vec3 viewDirection = normalize(-vPosition);
          float fresnelTerm = pow(1.0 - max(dot(vNormal, viewDirection), 0.0), 2.0);
          
          float scanline = sin(vPosition.y * 60.0 - time * 8.0) * 0.5 + 0.5;
          scanline = pow(scanline, 4.0) * 0.15;
          
          float pulse = 0.0;
          if (pulsate > 0.5) {
             pulse = sin(time * 3.0) * 0.5 + 0.5;
          }

          vec3 finalColor = baseColor;
          finalColor = mix(finalColor, edgeColor, fresnelTerm * 1.5);
          finalColor += edgeColor * scanline;
          
          // Selection and hover highlights
          finalColor += vec3(1.0, 1.0, 1.0) * isHovered * 0.3;
          finalColor += vec3(0.0, 1.0, 1.0) * isSelected * (0.5 + pulse * 0.3);

          float alpha = globalOpacity * (0.4 + fresnelTerm * 0.8 + scanline + isHovered * 0.4 + isSelected * 0.5);
          
          gl_FragColor = vec4(finalColor, min(alpha, 1.0));
        }
      `}
    />
  );
};




const QuantumCore = () => {
  const coreRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1.0 + Math.sin(state.clock.elapsedTime * 15.0) * 0.2);
    }
  });
  return (
    <group ref={coreRef}>
      <Sphere args={[0.05, 32, 32]}>
        <HolographicMaterial baseColor="#ffffff" isHovered={false} isSelected={false} opacity={1.0} pulsate={true} />
      </Sphere>
      <pointLight color="#ffffff" intensity={3.0} distance={4.0} />
    </group>
  );
};

const QuantumCloudPoints = () => {
  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.05;
      
      const time = state.clock.elapsedTime;
      const positions = pointsRef.current.geometry.attributes.position.array;
      for(let i=0; i<positions.length; i+=3) {
        // organic fluctuation
        // positions[i] += Math.sin(time + positions[i]*10) * 0.001;
      }
    }
  });

  // Create probability distribution (denser in center)
  const particles = 5000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particles * 3);
    for(let i = 0; i < particles; i++) {
      // Box-Muller transform for normal distribution
      const u = 1 - Math.random(); 
      const v = Math.random();
      const radius = Math.sqrt(-2.0 * Math.log(u)) * 0.25; 
      
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      pos[i*3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d946ef" size={0.03} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};


  const TechMaterial = ({ color, metalness = 0.5, roughness = 0.5, transparent = false, opacity = 1.0, isHovered = false, isSelected = false }: any) => {
    const customUniforms = useRef({ time: { value: 0 } });
    useFrame((state) => {
      customUniforms.current.time.value = state.clock.elapsedTime;
    });
    
    const onBeforeCompile = (shader: any) => {
      shader.uniforms.time = customUniforms.current.time;
      shader.vertexShader = `
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `.replace(
        `#include <worldpos_vertex>`,
        `
        #include <worldpos_vertex>
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      );
      shader.fragmentShader = `
        uniform float time;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
      `.replace(
        `#include <dithering_fragment>`,
        `
        #include <dithering_fragment>
        float buildY = (min(time, 3.0) * 2.0) - 3.0; 
        if (time < 3.0 && vWorldPos.y > buildY) {
           discard; 
        }
        if (time < 3.0 && vWorldPos.y > buildY - 0.05) {
           gl_FragColor = mix(gl_FragColor, vec4(0.13, 0.83, 0.93, 1.0), 0.8);
        }
        `
      );
    };

    return (
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? "#0ea5e9" : (isHovered ? "#38bdf8" : "#000000")}
        emissiveIntensity={isSelected ? 0.3 : (isHovered ? 0.15 : 0)}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        opacity={opacity}
        onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'TechMaterial'}
      />
    );
  };


function EngineeringComponentRenderer({
  comp,
  objectId,
  isHovered,
  isSelected,
  xrayEnabled,
  blueprintEnabled,
  isHighlighted
}: {
  comp: ComponentMetadata;
  objectId: string;
  isHovered: boolean;
  isSelected: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  isHighlighted?: boolean;
}) {
  const { id, shape, size, color, assetPath, assetScale } = comp;
  
  if (assetPath) {
    const isLargeModel = assetPath.includes('heliomotion');
    return (
      <GLTFErrorBoundary>
        <React.Suspense fallback={
          <group>
            <Box args={size}>
              <meshBasicMaterial color="#22d3ee" wireframe opacity={0.3} transparent />
            </Box>
            <Html center>
              <div className="bg-slate-900/95 text-cyan-300 text-xs px-3 py-1.5 rounded-lg font-mono border border-cyan-500/50 shadow-xl flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                {isLargeModel ? 'Loading HelioMotion 3D Assembly (94MB)...' : 'Loading 3D Asset...'}
              </div>
            </Html>
          </group>
        }>
          <RealisticGLTFModel 
            url={assetPath} 
            isHovered={isHovered} 
            isSelected={isSelected} 
            scale={assetScale || 1.0} 
            xrayEnabled={xrayEnabled}
            blueprintEnabled={blueprintEnabled}
            isHighlighted={isHighlighted}
          />
        </React.Suspense>
      </GLTFErrorBoundary>
    );
  }

  const baseColor = color || '#475569';


  // 1. PCB and Microcontroller Board Base
  
  // --- ARDUINO UNO R3 ---
  
  // --- PV CELL CRYSTAL ---
  if (id === 'pv_cell_crystal') {
    return (
      <group>
        {/* Silicon Crystal Lattice Structure */}
        {Array.from({ length: 4 }).map((_, x) => (
          Array.from({ length: 3 }).map((_, y) => (
            Array.from({ length: 4 }).map((_, z) => (
              <group key={`atom-${x}-${y}-${z}`} position={[x * 0.2 - 0.3, y * 0.2 - 0.2, z * 0.2 - 0.3]}>
                <Sphere args={[0.04, 16, 16]}>
                  <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
                </Sphere>
                {/* Bonds */}
                {x < 3 && (
                  <Cylinder args={[0.01, 0.01, 0.2, 8]} position={[0.1, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                    <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                  </Cylinder>
                )}
                {y < 2 && (
                  <Cylinder args={[0.01, 0.01, 0.2, 8]} position={[0, 0.1, 0]}>
                    <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                  </Cylinder>
                )}
                {z < 3 && (
                  <Cylinder args={[0.01, 0.01, 0.2, 8]} position={[0, 0, 0.1]} rotation={[Math.PI/2, 0, 0]}>
                    <meshStandardMaterial color="#94a3b8" roughness={0.4} />
                  </Cylinder>
                )}
              </group>
            ))
          ))
        ))}
      </group>
    );
  }

  // --- PN JUNCTION ---
  if (id === 'pn_junction') {
    return (
      <group>
        {/* N-Type Silicon (Top, thinner) */}
        <Box args={[size[0], size[1]*0.3, size[2]]} position={[0, size[1]*0.35, 0]}>
          <TechMaterial color="#38bdf8" roughness={0.2} metalness={0.5} />
        </Box>
        {/* Depletion Zone (Middle) */}
        <Box args={[size[0], size[1]*0.1, size[2]]} position={[0, size[1]*0.15, 0]}>
          <TechMaterial color="#fbbf24" roughness={0.4} />
        </Box>
        {/* P-Type Silicon (Bottom, thicker) */}
        <Box args={[size[0], size[1]*0.6, size[2]]} position={[0, -size[1]*0.2, 0]}>
          <TechMaterial color="#1d4ed8" roughness={0.3} metalness={0.5} />
        </Box>
        
        {/* Top Contact Fingers (Silver) */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
           <Box key={`finger-${i}`} args={[0.02, 0.01, size[2]]} position={[x, size[1]*0.5 + 0.005, 0]}>
             <TechMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
           </Box>
        ))}
        
        {/* Bottom Contact (Solid Aluminum) */}
        <Box args={[size[0], 0.02, size[2]]} position={[0, -size[1]*0.5 - 0.01, 0]}>
          <TechMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </Box>
      </group>
    );
  }
if (id === 'uno_pcb') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#044530" roughness={0.7} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        {/* Corner Mounting Holes with Copper/Gold Rim */}
        {[-size[0]/2 + 0.15, size[0]/2 - 0.15].map((x, xi) => 
          [-size[2]/2 + 0.15, size[2]/2 - 0.15].map((z, zi) => (
            <group key={`pad-${xi}-${zi}`} position={[x, size[1]/2 + 0.005, z]}>
              <Cylinder args={[0.08, 0.08, 0.01, 16]}>
                <TechMaterial color="#fbbf24" metalness={0.8} roughness={0.4} />
              </Cylinder>
              <Cylinder args={[0.04, 0.04, 0.02, 16]}>
                <meshBasicMaterial color="#000000" />
              </Cylinder>
            </group>
          ))
        )}
        <gridHelper args={[size[0], 20, "#0ea5e9", "#14b8a6"]} position={[0, size[1]/2 + 0.001, 0]} material-opacity={0.3} material-transparent={true} />
      </group>
    );
  }
  if (id === 'uno_atmega') {
    return (
      <group>
        <Box args={[size[0] * 1.05, 0.04, size[2] * 1.1]} position={[0, -0.04, 0]}>
          <TechMaterial color="#111111" roughness={0.8} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={size}>
          <TechMaterial color="#1e293b" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <mesh position={[-size[0]/2 + 0.1, size[1]/2 + 0.005, -size[2]/2 + 0.08]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {[...Array(14)].map((_, i) => {
          const x = -size[0]/2 + 0.12 + i * ((size[0] - 0.24) / 13);
          return (
            <React.Fragment key={`pin-${i}`}>
              <mesh position={[x, -0.02, -size[2]/2 - 0.04]}>
                <boxGeometry args={[0.03, 0.12, 0.08]} />
                <TechMaterial color="#e2e8f0" metalness={0.9} roughness={0.3} />
              </mesh>
              <mesh position={[x, -0.02, size[2]/2 + 0.04]}>
                <boxGeometry args={[0.03, 0.12, 0.08]} />
                <TechMaterial color="#e2e8f0" metalness={0.9} roughness={0.3} />
              </mesh>
            </React.Fragment>
          );
        })}
      </group>
    );
  }
  if (id === 'uno_usb') {
    return (
      <group>
        <Box args={size}>
           <TechMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0]*0.8, size[1]*0.8, 0.05]} position={[0, 0, size[2]/2 + 0.01]}>
           <TechMaterial color="#000000" roughness={0.9} />
        </Box>
      </group>
    );
  }
  if (id === 'uno_dc') {
    return (
      <group>
        <Box args={size}>
           <TechMaterial color="#111111" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Cylinder args={[0.04, 0.04, 0.02, 16]} position={[0, 0, size[2]/2 + 0.01]} rotation={[Math.PI/2, 0, 0]}>
           <TechMaterial color="#cbd5e1" metalness={1} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.015, 0.015, 0.03, 16]} position={[0, 0, size[2]/2 + 0.01]} rotation={[Math.PI/2, 0, 0]}>
           <meshBasicMaterial color="#000000" />
        </Cylinder>
      </group>
    );
  }
  if (id === 'uno_headers' || id === 'esp32_headers') {
    return (
      <group>
        <Box args={size}>
           <TechMaterial color="#1f2937" roughness={0.8} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        {Array.from({ length: 20 }).map((_, i) => (
           <Box key={`pin-${i}`} args={[0.02, 0.02, 0.02]} position={[0, size[1]/2 + 0.01, -size[2]/2 + 0.02 + (i * 0.04)]}>
              <TechMaterial color="#cbd5e1" metalness={0.8} roughness={0.4} />
           </Box>
        ))}
      </group>
    );
  }

  // --- ESP32 ---
  if (id === 'esp32_pcb') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#111111" roughness={0.8} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <gridHelper args={[size[0], 20, "#eab308", "#111111"]} position={[0, size[1]/2 + 0.001, 0]} material-opacity={0.15} material-transparent={true} />
      </group>
    );
  }
  if (id === 'esp32_module') {
    return (
      <group>
        <Box args={size}>
           <TechMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0], size[1]*0.5, size[2]*0.3]} position={[0, 0, size[2]/2 - 0.05]}>
           <TechMaterial color="#111111" roughness={0.9} />
        </Box>
        <gridHelper args={[size[0]*0.8, 5, "#eab308", "#eab308"]} position={[0, size[1]/2 + 0.005, size[2]/2 - 0.05]} />
      </group>
    );
  }
  if (id === 'esp32_usb') {
    return (
      <group>
        <Box args={size}>
           <TechMaterial color="#94a3b8" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0]*0.8, size[1]*0.6, 0.05]} position={[0, 0, -size[2]/2 - 0.01]}>
           <TechMaterial color="#000000" roughness={0.9} />
        </Box>
      </group>
    );
  }

  // --- SG90 SERVO ---
  if (id === 'sg90_lower_casing' || id === 'sg90_upper_casing') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#2563eb" roughness={0.5} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        {id === 'sg90_upper_casing' && (
          <group>
            {/* Mounting Ears */}
            <Box args={[size[0] + 0.3, 0.05, size[2]]} position={[0, -size[1]/2 + 0.025, 0]}>
              <TechMaterial color="#2563eb" roughness={0.5} />
            </Box>
            {[-size[0]/2 - 0.08, size[0]/2 + 0.08].map((x, i) => (
               <Cylinder key={`mount-${i}`} args={[0.02, 0.02, 0.06, 16]} position={[x, -size[1]/2 + 0.025, 0]}>
                 <meshBasicMaterial color="#0f172a" />
               </Cylinder>
            ))}
          </group>
        )}
      </group>
    );
  }
  if (id === 'sg90_dc_motor') {
    return (
      <Cylinder args={[size[0]/2, size[0]/2, size[1], 24]} rotation={[0, 0, Math.PI/2]}>
        <TechMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
      </Cylinder>
    );
  }
  if (id === 'sg90_gear_train') {
    return (
      <group>
        {/* Splined Output Shaft */}
        <Cylinder args={[0.04, 0.04, 0.12, 24]} position={[0, 0.06, 0]}>
          <TechMaterial color="#f8fafc" roughness={0.4} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        <Cylinder args={[0.12, 0.12, 0.08, 24]}>
          <TechMaterial color="#f8fafc" roughness={0.4} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
      </group>
    );
  }
  if (id === 'sg90_pcb') {
    return (
      <Box args={size}>
        <TechMaterial color="#047857" roughness={0.7} isHovered={isHovered} isSelected={isSelected} />
      </Box>
    );
  }

  // --- SOLAR PANEL ---
  if (id === 'sp_glass') {
    return (
      <Box args={size}>
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} opacity={1} transparent roughness={0} ior={1.5} thickness={0.02} />
      </Box>
    );
  }
  if (id === 'sp_cells') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#020617" metalness={0.7} roughness={0.15} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <gridHelper args={[size[0], 12, "#cbd5e1", "#94a3b8"]} position={[0, size[1]/2 + 0.006, 0]} material-opacity={0.4} material-transparent={true} />
        <gridHelper args={[size[2], 24, "#cbd5e1", "#94a3b8"]} position={[0, size[1]/2 + 0.007, 0]} rotation={[0, Math.PI/2, 0]} material-opacity={0.4} material-transparent={true} />
      </group>
    );
  }
  if (id === 'sp_frame') {
    return (
      <group>
        <Box args={[size[0], size[1], size[2]]}>
          <TechMaterial color="#e2e8f0" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0] - 0.05, size[1] + 0.01, size[2] - 0.05]}>
          <meshBasicMaterial color="#000000" />
        </Box>
      </group>
    );
  }
  if (id === 'sp_backsheet') {
    return (
      <Box args={size}>
        <TechMaterial color="#f8fafc" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
      </Box>
    );
  }
  if (id === 'sp_jbox') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#0f172a" roughness={0.8} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Cylinder args={[0.02, 0.02, 0.05, 16]} position={[-0.05, 0, size[2]/2 + 0.025]} rotation={[Math.PI/2, 0, 0]}>
          <TechMaterial color="#ef4444" roughness={0.6} />
        </Cylinder>
        <Cylinder args={[0.02, 0.02, 0.05, 16]} position={[0.05, 0, size[2]/2 + 0.025]} rotation={[Math.PI/2, 0, 0]}>
          <TechMaterial color="#3b82f6" roughness={0.6} />
        </Cylinder>
      </group>
    );
  }

  // --- LDR SENSOR ---
  if (id === 'ldr_epoxy') {
    return (
      <Sphere args={[size[0]/2, 16, 16]}>
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={1} transparent roughness={0} ior={1.5} thickness={0.02} />
      </Sphere>
    );
  }
  if (id === 'ldr_track') {
    return (
      <group>
        <Cylinder args={[size[0]/2, size[0]/2, size[1], 24]}>
          <TechMaterial color="#d97706" roughness={0.4} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        <Box args={[0.02, size[1] + 0.005, size[0]*0.8]} position={[0, 0, 0]}>
          <TechMaterial color="#b45309" roughness={0.5} />
        </Box>
        <Box args={[size[0]*0.6, size[1] + 0.005, 0.02]} position={[0, 0, 0.04]}>
          <TechMaterial color="#b45309" roughness={0.5} />
        </Box>
        <Box args={[size[0]*0.6, size[1] + 0.005, 0.02]} position={[0, 0, -0.04]}>
          <TechMaterial color="#b45309" roughness={0.5} />
        </Box>
      </group>
    );
  }
  if (id === 'ldr_base') {
    return (
      <Cylinder args={[size[0]/2, size[0]/2, size[1], 24]}>
        <TechMaterial color="#e2e8f0" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
      </Cylinder>
    );
  }
  if (id === 'ldr_legs' || id === 'res_leads') {
    return (
      <group>
        <Cylinder args={[0.01, 0.01, size[1], 8]} position={[-size[0]/2 + 0.02, 0, 0]}>
           <TechMaterial color="#94a3b8" metalness={1} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        <Cylinder args={[0.01, 0.01, size[1], 8]} position={[size[0]/2 - 0.02, 0, 0]}>
           <TechMaterial color="#94a3b8" metalness={1} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
      </group>
    );
  }

  // --- 10K RESISTOR ---
  if (id === 'res_body') {
    return (
      <group>
        <Cylinder args={[size[1]/2, size[1]/2, size[0], 16]} rotation={[0, 0, Math.PI/2]}>
           <TechMaterial color="#e5e5e5" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        <Sphere args={[size[1]/2, 16, 16]} position={[-size[0]/2, 0, 0]}>
           <TechMaterial color="#e5e5e5" roughness={0.9} />
        </Sphere>
        <Sphere args={[size[1]/2, 16, 16]} position={[size[0]/2, 0, 0]}>
           <TechMaterial color="#e5e5e5" roughness={0.9} />
        </Sphere>
        {/* Color Bands: Brown, Black, Orange, Gold */}
        <Cylinder args={[size[1]/2 + 0.002, size[1]/2 + 0.002, 0.02, 16]} position={[-size[0]/2 + 0.03, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <TechMaterial color="#78350f" roughness={0.8} />
        </Cylinder>
        <Cylinder args={[size[1]/2 + 0.002, size[1]/2 + 0.002, 0.02, 16]} position={[-size[0]/2 + 0.08, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <TechMaterial color="#111111" roughness={0.8} />
        </Cylinder>
        <Cylinder args={[size[1]/2 + 0.002, size[1]/2 + 0.002, 0.02, 16]} position={[-size[0]/2 + 0.13, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <TechMaterial color="#f97316" roughness={0.8} />
        </Cylinder>
        <Cylinder args={[size[1]/2 + 0.002, size[1]/2 + 0.002, 0.02, 16]} position={[size[0]/2 - 0.03, 0, 0]} rotation={[0, 0, Math.PI/2]}>
           <TechMaterial color="#eab308" metalness={0.5} roughness={0.5} />
        </Cylinder>
      </group>
    );
  }
  if (id === 'res_element') {
    return (
      <Box args={size}>
        <TechMaterial color="#475569" roughness={0.8} isHovered={isHovered} isSelected={isSelected} />
      </Box>
    );
  }
if (id === 'pcb' || id === 'esp32_pcb' || id === 'rpi_pcb' || id === 'bb_housing' || id === 'relay_module') {
    return (
      <group>
        <Box args={size}>
          <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        {/* Corner Mounting Holes with Copper/Gold Rim */}
        {[-size[0]/2 + 0.15, size[0]/2 - 0.15].map((x, xi) => 
          [-size[2]/2 + 0.15, size[2]/2 - 0.15].map((z, zi) => (
            <group key={`pad-${xi}-${zi}`} position={[x, size[1]/2 + 0.005, z]}>
              <Cylinder args={[0.08, 0.08, 0.01, 16]}>
                <HolographicMaterial baseColor="#fbbf24" isHovered={isHovered} isSelected={isSelected} />
              </Cylinder>
              <Cylinder args={[0.04, 0.04, 0.02, 16]}>
                <meshBasicMaterial color="#000000" />
              </Cylinder>
            </group>
          ))
        )}
        {/* Copper Trace Silk Overlay */}
        <mesh position={[0, size[1]/2 + 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[size[0] * 0.9, size[2] * 0.9]} />
          <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
        </mesh>
      </group>
    );
  }

  // 2. ATmega328P DIP-28 Microcontroller IC
  if (id === 'atmega328p') {
    return (
      <group>
        <Box args={[size[0] * 1.05, 0.04, size[2] * 1.1]} position={[0, -0.04, 0]}>
          <HolographicMaterial baseColor="#111111" isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={size}>
          <HolographicMaterial baseColor="#1e293b" isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <mesh position={[-size[0]/2 + 0.1, size[1]/2 + 0.005, -size[2]/2 + 0.08]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {[...Array(14)].map((_, i) => {
          const x = -size[0]/2 + 0.12 + i * ((size[0] - 0.24) / 13);
          return (
            <React.Fragment key={`pin-${i}`}>
              <mesh position={[x, -0.02, -size[2]/2 - 0.04]}>
                <boxGeometry args={[0.03, 0.12, 0.08]} />
                <HolographicMaterial baseColor="#e2e8f0" isHovered={isHovered} isSelected={isSelected} />
              </mesh>
              <mesh position={[x, -0.02, size[2]/2 + 0.04]}>
                <boxGeometry args={[0.03, 0.12, 0.08]} />
                <HolographicMaterial baseColor="#e2e8f0" isHovered={isHovered} isSelected={isSelected} />
              </mesh>
            </React.Fragment>
          );
        })}
      </group>
    );
  }

  // 3. ESP32 Metal Shield Module
  if (id === 'esp32_chip') {
    return (
      <group>
        <Box args={size}>
          <HolographicMaterial baseColor="#cbd5e1" isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <mesh position={[0, size[1]/2 + 0.002, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[size[0]*0.8, size[2]*0.8]} />
          <HolographicMaterial baseColor="#475569" isHovered={isHovered} isSelected={isSelected} />
        </mesh>
      </group>
    );
  }

  // 4. USB Ports
  if (id === 'usb_port' || id === 'esp32_usb' || id === 'rpi_usb3') {
    return (
      <group>
        <Box args={size}>
          <HolographicMaterial baseColor="#94a3b8" isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <mesh position={[size[0]/2 - 0.01, 0, 0]}>
          <boxGeometry args={[0.02, size[1]*0.7, size[2]*0.7]} />
          <HolographicMaterial baseColor="#1e293b" isHovered={isHovered} isSelected={isSelected} />
        </mesh>
      </group>
    );
  }


  const generatorProps = {
    isHovered,
    isSelected,
    xrayEnabled: xrayEnabled || false,
    blueprintEnabled: blueprintEnabled || false
  };

  if (id === 'engine_block') return <EngineBlockAssembly {...generatorProps} />;
  if (id === 'piston_left_bank') return <PistonAssemblyBank bank="left" sign={-1} {...generatorProps} />;
  if (id === 'piston_right_bank') return <PistonAssemblyBank bank="right" sign={1} {...generatorProps} />;
  if (id === 'connecting_rods') return <ConnectingRodsAssembly {...generatorProps} />;
  if (id === 'crankshaft') return <CrankshaftAssembly {...generatorProps} />;
  if (id === 'valvetrain') return <ValvetrainAssembly {...generatorProps} />;
  if (id === 'intake_plenum') return <IntakePlenum {...generatorProps} />;
  if (id === 'exhaust_manifold') return <ExhaustManifold {...generatorProps} />;
  if (id === 'cooling_system') return <CoolingSystem {...generatorProps} />;
  if (id === 'lubrication_system') return <LubricationSystem {...generatorProps} />;
  if (id === 'electronics_sensors') return <ElectronicsSensors {...generatorProps} />;

  if (id === 'left_ventricle' || id === 'right_ventricle') {
    return (
      <group>
        <Sphere args={[size[0] / 2, 32, 32]}>
          <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
        </Sphere>
        {[...Array(4)].map((_, i) => (
          <mesh key={`cv-${i}`} position={[(i - 1.5) * 0.08, (i % 2 === 0 ? 0.1 : -0.1), size[0]/2 + 0.01]} rotation={[0, 0, (i - 1.5) * 0.3]}>
            <cylinderGeometry args={[0.015, 0.008, 0.35, 8]} />
            <HolographicMaterial baseColor="#f43f5e" isHovered={isHovered} isSelected={isSelected} />
          </mesh>
        ))}
      </group>
    );
  }

  if (id === 'aorta' || id === 'pulmonary_artery' || id === 'vena_cava') {
    return (
      <group>
        <Cylinder args={[size[0] / 2, size[0] / 2, size[1], 24]}>
          <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        <mesh position={[0, size[1]/2 + 0.08, 0.08]} rotation={[0.4, 0, 0.3]}>
          <cylinderGeometry args={[size[0]/3, size[0]/3, 0.2, 16]} />
          <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
        </mesh>
      </group>
    );
  }

  // 9. Brake Disc & Caliper
  if (id === 'brake_rotor') {
    return (
      <group>
        <Torus args={[size[0]/2, size[2]/2, 16, 48]}>
          <HolographicMaterial baseColor="#334155" isHovered={isHovered} isSelected={isSelected} />
        </Torus>
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[size[0]*0.25, size[0]*0.25, size[2]*1.2, 24]} />
          <HolographicMaterial baseColor="#0f172a" isHovered={isHovered} isSelected={isSelected} />
        </mesh>
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const r = size[0] * 0.38;
          return (
            <mesh key={`hole-${i}`} position={[Math.cos(angle)*r, Math.sin(angle)*r, 0]}>
              <cylinderGeometry args={[0.02, 0.02, size[2]*1.1, 12]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          );
        })}
      </group>
    );
  }

  
  // 9.5 Custom Iron Man Parts
  if (id === 'im_helmet') {
    return (
      <group>
        <Sphere args={[size[0]/2, 32, 32]}>
          <HolographicMaterial baseColor="#dc2626" isHovered={isHovered} isSelected={isSelected} />
        </Sphere>
        <mesh position={[0, 0, size[2]/2 + 0.01]}>
          <boxGeometry args={[0.2, 0.1, 0.1]} />
          <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} pulsate={true} />
        </mesh>
      </group>
    );
  }
  if (id === 'im_reactor') {
    return (
      <group>
        <Cylinder args={[size[0]/2, size[0]/2, size[1], 32]} rotation={[Math.PI/2, 0, 0]}>
          <HolographicMaterial baseColor="#ffffff" edgeColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} pulsate={true} opacity={1.0} />
        </Cylinder>
        <Torus args={[size[0]/2 + 0.05, 0.02, 16, 32]} rotation={[Math.PI/2, 0, 0]}>
          <HolographicMaterial baseColor="#94a3b8" isHovered={isHovered} isSelected={isSelected} />
        </Torus>
      </group>
    );
  }
  if (id === 'dna_bases') {
    return (
      <group>
        {[...Array(10)].map((_, i) => {
          const y = -size[1]/2 + i * (size[1]/10);
          const rot = i * 0.5;
          return (
             <mesh key={'base-'+i} position={[0, y, 0]} rotation={[0, rot, 0]}>
               <boxGeometry args={[size[0], 0.05, 0.05]} />
               <HolographicMaterial baseColor={i%2===0 ? "#f43f5e" : "#22d3ee"} isHovered={isHovered} isSelected={isSelected} pulsate={true} />
             </mesh>
          )
        })}
      </group>
    );
  }

  
  // 9.6 Custom Quantum Electron Parts
  if (id === 'q_cloud') {
    return (
      <group>
        <Sphere args={[size[0]/2, 64, 64]}>
          <HolographicMaterial baseColor="#a855f7" isHovered={isHovered} isSelected={isSelected} opacity={0.1} pulsate={true} />
        </Sphere>
        <QuantumCloudPoints />
      </group>
    );
  }
  if (id === 'q_field') {
    return (
      <group>
        <Sphere args={[size[0]/2, 32, 32]}>
          <HolographicMaterial baseColor="#d946ef" isHovered={isHovered} isSelected={isSelected} opacity={0.3} wireframe={true} pulsate={true} />
        </Sphere>
        <Torus args={[size[0]/2 * 0.8, 0.05, 16, 64]} rotation={[Math.PI/4, Math.PI/4, 0]}>
           <HolographicMaterial baseColor="#c026d3" isHovered={isHovered} isSelected={isSelected} opacity={0.6} pulsate={true} />
        </Torus>
        <Torus args={[size[0]/2 * 0.8, 0.05, 16, 64]} rotation={[-Math.PI/4, -Math.PI/4, 0]}>
           <HolographicMaterial baseColor="#c026d3" isHovered={isHovered} isSelected={isSelected} opacity={0.6} pulsate={true} />
        </Torus>
      </group>
    );
  }
  if (id === 'q_core') {
    return <QuantumCore />;
  }
  if (id === 'q_lines') {
    return (
      <group>
        <Sphere args={[size[0]/2, 16, 16]}>
          <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} opacity={0.15} wireframe={true} />
        </Sphere>
        <points>
          <sphereGeometry args={[size[0]/2, 16, 16]} />
          <pointsMaterial color="#22d3ee" size={0.03} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </group>
    );
  }
  if (id === 'q_grid') {
    return (
      <group>
        <Box args={size}>
          <HolographicMaterial baseColor="#0ea5e9" isHovered={isHovered} isSelected={isSelected} opacity={0.3} wireframe={true} />
        </Box>
        <gridHelper args={[size[0], 20, "#38bdf8", "#0ea5e9"]} />
      </group>
    );
  }

  
  if (id === 'hm_frame') {
    return (
      <group>
        {/* Base Plate Mount */}
        <Box args={[0.8, 0.04, 0.8]} position={[0, -size[1]/2, 0]}>
           <TechMaterial color="#334155" roughness={0.6} />
        </Box>
        {/* Main Pillar Structure */}
        <Cylinder args={[0.15, 0.2, size[1], 32]} position={[0, 0, 0]}>
           <TechMaterial color="#475569" metalness={0.7} roughness={0.4} isHovered={isHovered} isSelected={isSelected} />
        </Cylinder>
        {/* Pan Bearing Ring */}
        <Torus args={[0.18, 0.04, 16, 32]} position={[0, size[1]/2 - 0.1, 0]} rotation={[Math.PI/2, 0, 0]}>
           <TechMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </Torus>
        
        {/* U-Bracket for Tilt */}
        <group position={[0, size[1]/2 + 0.15, 0]}>
          <Box args={[0.4, 0.05, 0.2]}>
             <TechMaterial color="#334155" roughness={0.7} />
          </Box>
          {/* Side arms */}
          <Box args={[0.05, 0.3, 0.2]} position={[-0.175, 0.15, 0]}>
             <TechMaterial color="#334155" roughness={0.7} />
          </Box>
          <Box args={[0.05, 0.3, 0.2]} position={[0.175, 0.15, 0]}>
             <TechMaterial color="#334155" roughness={0.7} />
          </Box>
          {/* Tilt pivot pins */}
          <Cylinder args={[0.03, 0.03, 0.1, 16]} position={[-0.2, 0.25, 0]} rotation={[0, 0, Math.PI/2]}>
             <TechMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </Cylinder>
          <Cylinder args={[0.03, 0.03, 0.1, 16]} position={[0.2, 0.25, 0]} rotation={[0, 0, Math.PI/2]}>
             <TechMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
          </Cylinder>
        </group>
      </group>
    );
  }
  
  // --- RESTORED HELIOMOTION PARTS ---
  if (id === 'hm_arduino') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#044530" roughness={0.7} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <gridHelper args={[size[0], 20, "#0ea5e9", "#14b8a6"]} position={[0, size[1]/2 + 0.001, 0]} material-opacity={0.1} material-transparent={true} />
        <group position={[0.1, size[1]/2 + 0.02, -0.1]}>
          <Box args={[0.35, 0.04, 0.12]}>
             <TechMaterial color="#111111" roughness={0.8} />
          </Box>
        </group>
        <group position={[-0.25, size[1]/2 + 0.1, 0.35]}>
          <Box args={[0.15, 0.12, 0.16]}>
             <TechMaterial color="#cbd5e1" metalness={0.9} roughness={0.3} />
          </Box>
        </group>
        <group position={[-0.25, size[1]/2 + 0.08, -0.35]}>
          <Box args={[0.12, 0.14, 0.18]}>
             <TechMaterial color="#111111" roughness={0.9} />
          </Box>
        </group>
      </group>
    );
  }
  
  if (id === 'hm_panel') {
    return (
      <group>
        <Box args={[size[0] + 0.04, size[1], size[2] + 0.04]}>
          <TechMaterial color="#e2e8f0" metalness={0.9} roughness={0.3} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0] + 0.02, size[1] + 0.02, size[2] + 0.02]}>
          <TechMaterial color="#cbd5e1" metalness={0.8} roughness={0.4} />
        </Box>
        <Box args={[size[0], size[1]*0.8, size[2]]} position={[0, -0.01, 0]}>
          <TechMaterial color="#1e293b" roughness={0.9} />
        </Box>
        <Box args={[size[0] - 0.02, size[1]*1.1, size[2] - 0.02]}>
          <TechMaterial color="#020617" metalness={0.7} roughness={0.15} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <gridHelper args={[size[0] - 0.02, 12, "#cbd5e1", "#94a3b8"]} position={[0, size[1]/2 + 0.006, 0]} material-opacity={0.4} material-transparent={true} />
        <gridHelper args={[size[2] - 0.02, 24, "#cbd5e1", "#94a3b8"]} position={[0, size[1]/2 + 0.007, 0]} rotation={[0, Math.PI/2, 0]} material-opacity={0.4} material-transparent={true} />
      </group>
    );
  }

  if (id === 'hm_servo_pan' || id === 'hm_servo_tilt') {
    return (
      <group>
        <Box args={[size[0], size[1], size[2]]}>
          <TechMaterial color="#2563eb" roughness={0.5} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        <Box args={[size[0], size[1]*0.3, size[2]]} position={[0, -size[1]*0.35, 0]}>
          <TechMaterial color="#1d4ed8" roughness={0.6} />
        </Box>
        <Box args={[size[0] + 0.01, 0.01, size[2] + 0.01]} position={[0, size[1]*0.15, 0]}>
          <TechMaterial color="#0f172a" roughness={0.8} />
        </Box>
        <Cylinder args={[0.04, 0.04, 0.12, 24]} position={[0.15, size[1]/2 + 0.06, 0]}>
          <TechMaterial color="#f8fafc" roughness={0.4} />
        </Cylinder>
      </group>
    );
  }

  if (id === 'hm_ldr_array') {
    return (
      <group>
        <Box args={size}>
          <TechMaterial color="#e2e8f0" roughness={0.9} isHovered={isHovered} isSelected={isSelected} />
        </Box>
        {[-0.05, 0.05].map((x, i) => (
          [-0.05, 0.05].map((z, j) => (
            <group key={`ldr-${i}-${j}`} position={[x, size[1]/2 + 0.02, z]}>
              <Cylinder args={[0.02, 0.02, 0.04, 16]}>
                <TechMaterial color="#d97706" roughness={0.4} />
              </Cylinder>
              <Sphere args={[0.02, 16, 16]} position={[0, 0.02, 0]}>
                 <meshPhysicalMaterial color="#ffffff" transmission={0.9} opacity={1} transparent roughness={0} />
              </Sphere>
            </group>
          ))
        ))}
      </group>
    );
  }

  if (id === 'hm_wiring') {
    return (
      <group>
        {[
          { x: -0.1, rot: 0.2, color: "#ef4444" },
          { x: -0.05, rot: -0.1, color: "#3b82f6" },
          { x: 0, rot: 0.15, color: "#22c55e" },
          { x: 0.05, rot: -0.2, color: "#eab308" },
          { x: 0.1, rot: 0.05, color: "#111111" }
        ].map((wire, i) => (
          <group key={`wire-${i}`} position={[wire.x, 0, 0]}>
             <Cylinder args={[0.012, 0.012, size[0], 16]} rotation={[0, 0, Math.PI/2 + wire.rot]}>
                <TechMaterial color={wire.color} roughness={0.6} isHovered={isHovered} isSelected={isSelected} />
             </Cylinder>
          </group>
        ))}
      </group>
    );
  }
// 10. Default / Standard Parametric Component with Bevels and Metallic Finishes
  return (
    <group>
      {shape === 'box' && (
        <group>
          <Box args={size}>
            <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
          </Box>
          <Box args={[size[0]*1.02, size[1]*1.02, size[2]*1.02]}>
            <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} wireframe={true} opacity={0.15} pulsate={true} />
          </Box>
        </group>
      )}
      {shape === 'sphere' && (
        <group>
          <Sphere args={[size[0] / 2, 32, 32]}>
            <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
          </Sphere>
          <Sphere args={[(size[0] / 2) * 1.02, 16, 16]}>
            <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} wireframe={true} opacity={0.15} pulsate={true} />
          </Sphere>
        </group>
      )}
      {shape === 'cylinder' && (
        <group>
          <Cylinder args={[size[0] / 2, size[1] / 2, size[2], 32]}>
            <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
          </Cylinder>
          <Cylinder args={[(size[0] / 2) * 1.02, (size[1] / 2) * 1.02, size[2] * 1.02, 16]}>
            <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} wireframe={true} opacity={0.15} pulsate={true} />
          </Cylinder>
        </group>
      )}
      {shape === 'torus' && (
        <group>
          <Torus args={[size[0] / 2, size[1] / 6, 16, 48]}>
            <HolographicMaterial baseColor={baseColor} isHovered={isHovered} isSelected={isSelected} />
          </Torus>
          <Torus args={[(size[0] / 2) * 1.02, (size[1] / 6) * 1.02, 8, 24]}>
            <HolographicMaterial baseColor="#22d3ee" isHovered={isHovered} isSelected={isSelected} wireframe={true} opacity={0.15} pulsate={true} />
          </Torus>
        </group>
      )}
    </group>
  );
}



function TargetingBeam({ 
  hoveredComponentId, 
  hoverHitPointRef, 
  pointerRayPosRef 
}: { 
  hoveredComponentId: string | null; 
  hoverHitPointRef: React.RefObject<THREE.Vector3 | null>; 
  pointerRayPosRef: React.RefObject<THREE.Vector3 | null>; 
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const reticleGroupRef = useRef<THREE.Group>(null);
  const containerGroupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const hasTarget = Boolean(hoveredComponentId && hoverHitPointRef.current && pointerRayPosRef.current);
    if (containerGroupRef.current) {
      containerGroupRef.current.visible = hasTarget;
      if (hasTarget && hoverHitPointRef.current && pointerRayPosRef.current) {
        if (reticleGroupRef.current) {
          reticleGroupRef.current.position.copy(hoverHitPointRef.current);
        }
        if (geometryRef.current) {
          const posAttr = geometryRef.current.attributes.position;
          if (posAttr) {
            posAttr.setXYZ(0, pointerRayPosRef.current.x, pointerRayPosRef.current.y, pointerRayPosRef.current.z);
            posAttr.setXYZ(1, hoverHitPointRef.current.x, hoverHitPointRef.current.y, hoverHitPointRef.current.z);
            posAttr.needsUpdate = true;
          }
        }
      }
    }
  });

  return (
    <group ref={containerGroupRef} visible={false}>
      <line>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.7} linewidth={1.5} />
      </line>
      <group ref={reticleGroupRef}>
        <mesh>
          <ringGeometry args={[0.08, 0.12, 16]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

export function SpatialObjectEngine({
  currentSpatialObject,
  selectedComponentId,
  hoveredComponentId,
  isExploded,
  isPresentationMode,
  presentationStep,
  spatialMode,
  onInteractionStateChange,
  setSelectedComponentId,
  setHoveredComponentId,
  handTracking,
  setPresentationStep,
  setMessages,
  soundEnabled = true,
  isExiting = false,
  showLabels = false,
  componentTransforms,
  explodedFactor = 0,
  xrayEnabled = false,
  blueprintEnabled = false,
  highlightedComponentId = null
}: SpatialObjectEngineProps) {
  const gestureState = useGestureEngine();
  const { raycaster, camera, scene } = useThree();
  const mainGroupRef = useRef<THREE.Group>(null);
  const componentRefs = useRef<Record<string, THREE.Object3D>>({});
  const idleRotationRef = useRef(0);

  // Transition and Level Of Detail States
  const transitionRef = useRef(0);
  const [lod, setLod] = useState<'FAR' | 'MEDIUM' | 'CLOSE'>('MEDIUM');
  const [matPhase, setMatPhase] = useState<'PULSE' | 'SCAN' | 'WIREFRAME' | 'FINAL'>('FINAL');
  const [matProgress, setMatProgress] = useState(1);
  
  useEffect(() => {
    if (currentSpatialObject) {
      setMatPhase('PULSE');
      setMatProgress(0);
      
      const tl = [
        { phase: 'PULSE', duration: 600 },
        { phase: 'SCAN', duration: 1000 },
        { phase: 'WIREFRAME', duration: 1200 },
        { phase: 'FINAL', duration: 500 }
      ] as const;
      
      let currentIdx = 0;
      let startTime = Date.now();
      let raf: number;
      
      const animate = () => {
        const now = Date.now();
        const step = tl[currentIdx];
        const elapsed = now - startTime;
        
        if (elapsed > step.duration) {
          currentIdx++;
          if (currentIdx >= tl.length) {
             setMatPhase('FINAL');
             setMatProgress(1);
             
              // Speech Confirmation after render
              if (!isPresentationMode && soundEnabled && window.speechSynthesis) {
                  const objectIds = Array.isArray(currentSpatialObject) ? currentSpatialObject : [currentSpatialObject];
                  const speakText = objectIds.length > 1 
                    ? `Displaying showcase with ${objectIds.map(id => SPATIAL_LIBRARY[id]?.name || id).join(', ')}.`
                    : (SPATIAL_LIBRARY[objectIds[0]] ? `Displaying ${SPATIAL_LIBRARY[objectIds[0]].name}.` : 'Displaying models.');
                  // Check if there is already a speech happening
                  if (!window.speechSynthesis.speaking) {
                     const utterance = new SpeechSynthesisUtterance(speakText);
                     utterance.rate = 1.05;
                     utterance.pitch = 0.95;
                     const voices = window.speechSynthesis.getVoices();
                     let bestVoice = voices.find(v => v.name.includes("Daniel"));
                     if (!bestVoice) bestVoice = voices.find(v => v.name.includes("UK English Male"));
                     if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith("en"));
                     if (bestVoice) utterance.voice = bestVoice;
                     window.speechSynthesis.speak(utterance);
                  }
              }
             
             return;
          }
          startTime = now;
          setMatPhase(tl[currentIdx].phase);
          setMatProgress(0);
          raf = requestAnimationFrame(animate);
        } else {
          setMatProgress(elapsed / step.duration);
          raf = requestAnimationFrame(animate);
        }
      };
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }
  }, [currentSpatialObject, isPresentationMode, soundEnabled]);
  const currentLod = useRef<'FAR' | 'MEDIUM' | 'CLOSE'>('MEDIUM');
  const velocityRot = useRef<[number, number, number]>([0, 0, 0]);
  

  // Stable refs to prevent closure issues inside useFrame
  const gestureEngine = useGestureEngine();
  const gestureEngineRef = useRef(gestureEngine);
  gestureEngineRef.current = gestureEngine;

  const handTrackingRef = useRef(handTracking);
  handTrackingRef.current = handTracking;

  const hoveredComponentIdRef = useRef(hoveredComponentId);
  const selectedComponentIdRef = useRef(selectedComponentId);
  const isPresentationModeRef = useRef(isPresentationMode);
  const presentationStepRef = useRef(presentationStep);
  const currentSpatialObjectRef = useRef(currentSpatialObject);
  const isExplodedRef = useRef(isExploded);

  // Intent-Based Selection System State Machine
  const selectionStateRef = useRef<'NONE' | 'HOVERING' | 'TARGET CONFIRMED' | 'PINCH SELECT' | 'DETAIL VIEW'>('NONE');
  const targetConfidenceRef = useRef<number>(0);
  const hoverHitPointRef = useRef<THREE.Vector3 | null>(null);
  const pointerRayPosRef = useRef<THREE.Vector3 | null>(null);
  const prevPinchStateRef = useRef<boolean>(false);

  const lastSnapshotLogTimeRef = useRef<number>(0);
  const lastOverlayUpdateRef = useRef<number>(0);
  const raycastTargetSourceRef = useRef<'NONE' | 'COMPONENT_MESH' | 'PARENT_MODEL' | 'BACKGROUND' | 'UNKNOWN'>('NONE');
  const lastTwoHandMetricsRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  const effectiveMode = spatialMode || (isPresentationMode ? 'DEMO' : isExploded ? 'EXPLODED' : 'INSPECTION');
  const spatialModeRef = useRef<SpatialMode>(effectiveMode);
  const isInteractingRef = useRef<boolean>(false);

  hoveredComponentIdRef.current = hoveredComponentId;
  selectedComponentIdRef.current = selectedComponentId;
  isPresentationModeRef.current = isPresentationMode;
  presentationStepRef.current = presentationStep;
  currentSpatialObjectRef.current = currentSpatialObject;
  isExplodedRef.current = isExploded;
  spatialModeRef.current = effectiveMode;

  useEffect(() => {
    if (effectiveMode === 'INSPECTION' || effectiveMode === 'EXPLODED') {
      rotationVelocityRef.current = 0;
    }
  }, [effectiveMode]);

  // Smooth animation interpolation goals - Centralized [0, 0, 0] for true Spatial Mode V2
  const targetPos = useRef<[number, number, number]>([0, 0, 0]);
  const targetRot = useRef<[number, number, number]>([0.2, -0.4, 0]);
  const targetScale = useRef<number>(1.0);

  // Physical Hologram Grab Mode & Safe Clutch System Refs
  const objectPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const objectVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isGrabbingRef = useRef<boolean>(false);
  const grabAnchorHandRef = useRef<THREE.Vector3 | null>(null);
  const grabAnchorObjectRef = useRef<THREE.Vector3 | null>(null);
  const grabAnchorRotRef = useRef<number | null>(null);
  const grabAnchorObjectRotRef = useRef<number | null>(null);

  // Tracking last values to compute delta offsets
  const lastHandsMidpoint = useRef<THREE.Vector3 | null>(null);
  const lastHandsDistance = useRef<number | null>(null);
  const lastHandRotation = useRef<number | null>(null);
  const hasUserInteractedRef = useRef<boolean>(false);
  const rotationVelocityRef = useRef<number>(0);
  const lastHandRotationRef = useRef<number | null>(null);
  const prevPinchPosRef = useRef<{ x: number; y: number } | null>(null);

  // Diagnostic Keyboard Control for Model Transform Isolation Test
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let handled = false;
      const gEngine = gestureEngineRef.current;
      
      if (e.key === 'ArrowLeft') {
        gEngine.spatialCam.targetTheta -= 0.15;
        handled = true;
      } else if (e.key === 'ArrowRight') {
        gEngine.spatialCam.targetTheta += 0.15;
        handled = true;
      } else if (e.key === 'ArrowUp') {
        gEngine.spatialCam.targetPhi = Math.max(0.15, gEngine.spatialCam.targetPhi - 0.15);
        handled = true;
      } else if (e.key === 'ArrowDown') {
        gEngine.spatialCam.targetPhi = Math.min(Math.PI - 0.15, gEngine.spatialCam.targetPhi + 0.15);
        handled = true;
      } else if (e.key === '+' || e.key === '=') {
        gEngine.spatialCam.targetRadius = Math.max(3.0, gEngine.spatialCam.targetRadius - 1.5);
        handled = true;
      } else if (e.key === '-') {
        gEngine.spatialCam.targetRadius = Math.min(38.0, gEngine.spatialCam.targetRadius + 1.5);
        handled = true;
      } else if (e.key === 'z' || e.key === 'Z') {
        gEngine.spatialCam.targetRadius = Math.max(3.0, gEngine.spatialCam.targetRadius - 5.0);
        handled = true;
      } else if (e.key === 'x' || e.key === 'X') {
        gEngine.spatialCam.targetRadius = Math.min(38.0, gEngine.spatialCam.targetRadius + 5.0);
        handled = true;
      } else if (e.key === 'r' || e.key === 'R') {
        hasUserInteractedRef.current = true;
        idleRotationRef.current += 0.3;
        handled = true;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync default scale on object load
  useEffect(() => {
    const primaryId = Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject;
    if (primaryId && SPATIAL_LIBRARY[primaryId]) {
      const defScale = SPATIAL_LIBRARY[primaryId].defaultScale;
      const objectIds = Array.isArray(currentSpatialObject) ? currentSpatialObject : (currentSpatialObject ? [currentSpatialObject] : []);
      const scaleMultiplier = objectIds.length > 1 ? defScale * 0.8 : defScale;
      targetScale.current = scaleMultiplier;
      
      // Load at center
      targetPos.current = [0, 0, 0];
      targetRot.current = [0.2, -0.4, 0];

      if (mainGroupRef.current) {
        mainGroupRef.current.position.set(0, 0, 0);
        mainGroupRef.current.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);
        mainGroupRef.current.rotation.set(0.2, -0.4, 0);
      }
    }
  }, [currentSpatialObject]);

  // Handle Presentation Step Narrative Speaks
  useEffect(() => {
    if (isPresentationMode && currentSpatialObject && SPATIAL_LIBRARY[Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject as string]) {
      const obj = SPATIAL_LIBRARY[Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject as string];
      
      // Step 0 is introduction, step 1+ are components
      if (presentationStep === 0) {
        speakNarration(`Initiating spatial presentation of the ${obj.name}, Sir. This is categorized under ${obj.category}. ${obj.description}`);
      } else {
        const compIdx = presentationStep - 1;
        if (compIdx >= 0 && compIdx < obj.components.length) {
          const comp = obj.components[compIdx];
          setSelectedComponentId(comp.id);
          speakNarration(`Highlighting component ${comp.name}. ${comp.description}`);
        }
      }
    }
  }, [presentationStep, isPresentationMode, currentSpatialObject]);

  // Advance presentation steps automatically
  useEffect(() => {
    if (!isPresentationMode || !currentSpatialObject || !SPATIAL_LIBRARY[Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject as string]) return;
    const obj = SPATIAL_LIBRARY[Array.isArray(currentSpatialObject) ? currentSpatialObject[0] : currentSpatialObject as string];
    const totalSteps = obj.components.length + 1;

    const interval = setInterval(() => {
      setPresentationStep(prev => {
        const next = prev + 1;
        if (next >= totalSteps) {
          // Defer speech outside state updater phase
          setTimeout(() => {
            speakNarration(`Spatial demonstration completed, Sir. Returning the system to interactive mode.`);
          }, 0);
          return 0;
        }
        return next;
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [isPresentationMode, currentSpatialObject]);

  const speakNarration = (text: string) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Add to chat feed
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: text,
        timestamp: Date.now()
      }
    ]);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    // Try to find UK Male/Daniel/Natural
    const voices = window.speechSynthesis.getVoices();
    let bestVoice = voices.find(v => v.name.includes("Daniel"));
    if (!bestVoice) bestVoice = voices.find(v => v.name.includes("UK English Male"));
    if (!bestVoice) bestVoice = voices.find(v => v.lang.startsWith("en"));
    if (bestVoice) utterance.voice = bestVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Run Three.js Render Loop operations
  useFrame((state, delta) => {
    // A. Smoothly interpolate spatial transition progress
    const targetTransition = (currentSpatialObjectRef.current && !isExiting) ? 1.0 : 0.0;
    transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, targetTransition, 0.06);
    const sTrans = transitionRef.current;

    // B. Calculate Level Of Detail (LOD) based on camera distance
    if (mainGroupRef.current) {
      const dist = camera.position.distanceTo(mainGroupRef.current.position);
      let newLod: 'FAR' | 'MEDIUM' | 'CLOSE' = 'MEDIUM';
      if (dist > 14) {
        newLod = 'FAR';
      } else if (dist < 6) {
        newLod = 'CLOSE';
      }
      if (currentLod.current !== newLod) {
        currentLod.current = newLod;
      }
    }

    

    // Diagnostic logging for Spatial Model Transform Isolation Test
    const gEngine = gestureEngineRef.current;

    // Unconditionally sync Spatial Intent Monitor HUD overlay with gEngine.handsCount
    const nowOverlay = Date.now();
    if (nowOverlay - lastOverlayUpdateRef.current >= 100) {
      lastOverlayUpdateRef.current = nowOverlay;
      const isPinchActive = Boolean(gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || handTrackingRef.current?.gesture === 'PINCH');
      const isPointingActive = Boolean(gEngine.isPointing || gEngine.interactionState === 'HOVERING');
      const isTargetingComp = hoveredComponentIdRef.current !== null && targetConfidenceRef.current >= 0.2;
      
      let dominantIntent = 'IDLE';
      if (!gEngine.isHandActive || gEngine.handsCount === 0) {
        dominantIntent = 'IDLE';
      } else if (gEngine.handsCount === 2) {
        if (gEngine.zoomDelta < -0.001) dominantIntent = 'TWO_HAND_ZOOM_IN';
        else if (gEngine.zoomDelta > 0.001) dominantIntent = 'TWO_HAND_ZOOM_OUT';
        else dominantIntent = 'TWO_HAND_ORBIT';
      } else if (isPinchActive) {
        dominantIntent = isTargetingComp ? 'SELECTING_COMPONENT' : 'INSPECTION_ROTATION';
      } else if (hoveredComponentIdRef.current !== null) {
        dominantIntent = 'HOVERING_COMPONENT';
      } else if (isPointingActive) {
        dominantIntent = 'HOVERING';
      }
    }
    if (Math.random() < 0.04) {
      console.log('[SPATIAL TRANSFORM ISOLATION]', {
        cameraTheta: Number(gEngine.spatialCam.theta.toFixed(4)),
        cameraPhi: Number(gEngine.spatialCam.phi.toFixed(4)),
        cameraRadius: Number(gEngine.spatialCam.radius.toFixed(4)),
        mainGroupRotation: mainGroupRef.current ? {
          x: Number(mainGroupRef.current.rotation.x.toFixed(4)),
          y: Number(mainGroupRef.current.rotation.y.toFixed(4)),
          z: Number(mainGroupRef.current.rotation.z.toFixed(4))
        } : null,
        selectedInteractionState: gEngine.interactionState,
        handsCount: gEngine.handsCount,
        isPinch: gEngine.isPinch,
        zoomDelta: Number(gEngine.zoomDelta.toFixed(4)),
        orbitDelta: {
          theta: Number(gEngine.orbitDelta?.theta?.toFixed(4) || 0),
          phi: Number(gEngine.orbitDelta?.phi?.toFixed(4) || 0)
        }
      });
    }

    // E. Programmatic Raycasting & Intent-Based Holographic Selection Engine
    const allowRaycast = (spatialModeRef.current !== 'SHOWCASE') || gEngine.isPinch;
    if (allowRaycast && currentSpatialObjectRef.current && gEngine.isHandActive && gEngine.cursorPosition) {
      const isPointerState = 
        gEngine.isPointing || 
        gEngine.isPinch || 
        gEngine.interactionState === 'HOVERING' || 
        gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG';

      if (isPointerState) {
        const ndcX = (1 - gEngine.cursorPosition.x) * 2 - 1;
        const ndcY = -(gEngine.cursorPosition.y * 2 - 1);

        raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
        
        // 3D laser origin from camera pointer ray
        const rayDir = raycaster.ray.direction.clone().multiplyScalar(5);
        const pointer3DWorld = camera.position.clone().add(rayDir);
        pointerRayPosRef.current = pointer3DWorld;
        
        if (mainGroupRef.current) {
          const intersects = raycaster.intersectObjects(mainGroupRef.current.children, true);
          let foundComponentId: string | null = null;
          let hitPoint: THREE.Vector3 | null = null;
          
          if (intersects.length > 0) {
            let hasCompHit = false;
            for (const hit of intersects) {
              let objNode: THREE.Object3D | null = hit.object;
              while (objNode && objNode !== mainGroupRef.current) {
                if (objNode.userData && objNode.userData.selectableId) {
                  foundComponentId = objNode.userData.selectableId;
                  hitPoint = hit.point.clone();
                  hasCompHit = true;
                  break;
                }
                objNode = objNode.parent;
              }
              if (foundComponentId) break;
            }
            raycastTargetSourceRef.current = hasCompHit ? 'COMPONENT_MESH' : 'PARENT_MODEL';
          } else {
            raycastTargetSourceRef.current = 'BACKGROUND';
          }

          const isPinchActive = gEngine.isPinch || 
                               gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || 
                               handTrackingRef.current?.gesture === 'PINCH';
          const isPinchJustTriggered = isPinchActive && !prevPinchStateRef.current;
          prevPinchStateRef.current = isPinchActive;

          if (foundComponentId && hitPoint) {
            hoverHitPointRef.current = hitPoint;

            if (hoveredComponentIdRef.current !== foundComponentId) {
              hoveredComponentIdRef.current = foundComponentId;
              setHoveredComponentId(foundComponentId);
              targetConfidenceRef.current = 0.3;
            } else {
              targetConfidenceRef.current = Math.min(1.0, targetConfidenceRef.current + 0.05);
            }

            const confidence = targetConfidenceRef.current;

            // INTENT-BASED SELECTION: Pointer movement alone ONLY hovers/targets.
            // Pinch gesture is STRICTLY REQUIRED to select the component!
            if (isPinchActive && (isPinchJustTriggered || confidence >= 0.2)) {
              selectionStateRef.current = 'PINCH SELECT';
              if (selectedComponentIdRef.current !== foundComponentId) {
                selectedComponentIdRef.current = foundComponentId;
                setSelectedComponentId(foundComponentId);
              }
            } else if (selectedComponentIdRef.current === foundComponentId) {
              selectionStateRef.current = 'DETAIL VIEW';
            } else if (confidence >= 0.5) {
              selectionStateRef.current = 'TARGET CONFIRMED';
            } else {
              selectionStateRef.current = 'HOVERING';
            }

          } else {
            // Pointer raycast hit no component -> reset hover state cleanly
            hoverHitPointRef.current = null;
            targetConfidenceRef.current = Math.max(0, targetConfidenceRef.current - 0.1);
            if (targetConfidenceRef.current === 0 && hoveredComponentIdRef.current !== null) {
              hoveredComponentIdRef.current = null;
              setHoveredComponentId(null);
            }
            selectionStateRef.current = selectedComponentIdRef.current ? 'DETAIL VIEW' : 'NONE';
          }

          // SPATIAL INTENT DIAGNOSTICS & CONTROLLED 1000MS LOGGING
          const isTargetingComp = hoveredComponentIdRef.current !== null && targetConfidenceRef.current >= 0.2;
          const pinchDestination = isPinchActive ? (isTargetingComp ? 'COMPONENT_SELECTION' : 'INSPECTION_ROTATION') : 'NONE';

          let dominantAction: 'IDLE' | 'HOVERING' | 'HOVERING_COMPONENT' | 'SELECTING_COMPONENT' | 'INSPECTION_ROTATION' | 'TWO_HAND_ORBIT' | 'TWO_HAND_ZOOM_IN' | 'TWO_HAND_ZOOM_OUT' = 'IDLE';

          if (!gEngine.isHandActive || gEngine.handsCount === 0) {
            dominantAction = 'IDLE';
          } else if (gEngine.handsCount === 2) {
            if (gEngine.zoomDelta < -0.001) {
              dominantAction = 'TWO_HAND_ZOOM_IN';
            } else if (gEngine.zoomDelta > 0.001) {
              dominantAction = 'TWO_HAND_ZOOM_OUT';
            } else {
              dominantAction = 'TWO_HAND_ORBIT';
            }
          } else if (isPinchActive) {
            if (isTargetingComp) {
              dominantAction = 'SELECTING_COMPONENT';
            } else {
              dominantAction = 'INSPECTION_ROTATION';
            }
          } else {
            if (hoveredComponentIdRef.current !== null) {
              dominantAction = 'HOVERING_COMPONENT';
            } else if (gEngine.isPointing || gEngine.interactionState === 'HOVERING') {
              dominantAction = 'HOVERING';
            } else {
              dominantAction = 'IDLE';
            }
          }

          // Compute Two-Hand Midpoint & Deltas for Debug Audit
          const lPos = handTracking?.leftHandPosition;
          const rPos = handTracking?.rightHandPosition;
          const hasTwoHands = Boolean(lPos && rPos);

          let currentHandsDist = 0;
          let previousHandsDist = 0;
          let distanceDelta = 0;
          let midpointX = 0;
          let midpointY = 0;
          let midpointDeltaX = 0;
          let midpointDeltaY = 0;

          if (hasTwoHands && lPos && rPos) {
            midpointX = (lPos.x + rPos.x) / 2;
            midpointY = (lPos.y + rPos.y) / 2;
            currentHandsDist = handTracking?.handsDistance || Math.hypot(lPos.x - rPos.x, lPos.y - rPos.y);

            if (lastTwoHandMetricsRef.current) {
              previousHandsDist = lastTwoHandMetricsRef.current.dist;
              distanceDelta = currentHandsDist - previousHandsDist;
              midpointDeltaX = midpointX - lastTwoHandMetricsRef.current.x;
              midpointDeltaY = midpointY - lastTwoHandMetricsRef.current.y;
            } else {
              previousHandsDist = currentHandsDist;
              distanceDelta = 0;
              midpointDeltaX = 0;
              midpointDeltaY = 0;
            }
            lastTwoHandMetricsRef.current = { x: midpointX, y: midpointY, dist: currentHandsDist };
          } else {
            lastTwoHandMetricsRef.current = null;
          }

          const rotationActive = (isPinchActive && !isTargetingComp) || (gEngine.handsCount === 2 && dominantAction === 'TWO_HAND_ORBIT');
          const zoomActive = gEngine.handsCount === 2 && Math.abs(gEngine.zoomDelta) > 0.001;

          const now = Date.now();
          if (now - lastSnapshotLogTimeRef.current >= 1000) {
            lastSnapshotLogTimeRef.current = now;
            // Removed debug logging
          }
        }
      } else {
        raycastTargetSourceRef.current = 'NONE';
        hoverHitPointRef.current = null;
        targetConfidenceRef.current = 0;
        if (hoveredComponentIdRef.current !== null) {
          hoveredComponentIdRef.current = null;
          setHoveredComponentId(null);
        }
        selectionStateRef.current = selectedComponentIdRef.current ? 'DETAIL VIEW' : 'NONE';
      }
    } else {
      raycastTargetSourceRef.current = 'NONE';
      hoverHitPointRef.current = null;
      targetConfidenceRef.current = 0;
      if (hoveredComponentIdRef.current !== null) {
        hoveredComponentIdRef.current = null;
        setHoveredComponentId(null);
      }
      selectionStateRef.current = selectedComponentIdRef.current ? 'DETAIL VIEW' : 'NONE';
    }

    // F. Spatial Inspection Mode (Iron-Man style spatial inspection)
    if (mainGroupRef.current) {
      const floatUpY = THREE.MathUtils.lerp(-2.8, 0, sTrans);

      // Hologram remains anchored in 3D world space at origin
      objectPosRef.current.set(0, 0, 0);
      objectVelRef.current.set(0, 0, 0);

      mainGroupRef.current.position.x = 0;
      mainGroupRef.current.position.y = floatUpY;
      mainGroupRef.current.position.z = 0;
      mainGroupRef.current.scale.setScalar(sTrans);

      // =========================================================================
      // INTENT SEPARATION & STRICT GESTURE ROTATION CONTROLLER
      // =========================================================================
      // States:
      // - HAND_PRESENT: Hand detected, open palm, stationary -> NO ACTION. Model frozen.
      // - HAND_HOVER: Pointing gesture -> Pointer raycast selection only. Zero model movement.
      // - PINCH_ACTIVE: Single-hand pinch -> Controlled rotation via hand movement DELTA (dx).
      // - TWO_HAND_ROTATE: Explicit two-hand rotation gesture -> Controlled rotation via angle DELTA.
      // =========================================================================

      const currentGesture = handTrackingRef.current?.gesture;
      const rawHandRot = handTrackingRef.current?.handRotation;

      // 1. PINCH_ACTIVE check
      const isSingleHandPinch = gEngine.isHandActive &&
        gEngine.handsCount === 1 &&
        (gEngine.isPinch || gEngine.interactionState === 'PINCH_HOLD' || gEngine.interactionState === 'PINCH_START' || gEngine.interactionState === 'PINCH_DRAG' || currentGesture === 'PINCH') &&
        gEngine.cursorPosition !== null;

      // 2. TWO_HAND_ROTATE check
      const isTwoHandRotate = gEngine.isHandActive &&
        gEngine.handsCount === 2 &&
        (currentGesture === 'TWO HAND ROTATE' ||
         currentGesture === 'TWO FINGER ROTATION' ||
         gEngine.interactionState === 'ROTATING');

      // Intentional manipulation active flag
      const isActivelyInteracting = isSingleHandPinch || isTwoHandRotate;

      if (isInteractingRef.current !== isActivelyInteracting) {
        isInteractingRef.current = isActivelyInteracting;
        if (onInteractionStateChange) {
          onInteractionStateChange(isActivelyInteracting);
        }
      }

      let frameInspectionRotDelta = 0;
      const isTargetingComp = hoveredComponentIdRef.current !== null && targetConfidenceRef.current >= 0.2;

      if (isSingleHandPinch && isTargetingComp) {
        // COMPONENT SELECTION PINCH: Suppress inspection model rotation so object remains stable during component selection
        prevPinchPosRef.current = null;
        isGrabbingRef.current = false;
        rotationVelocityRef.current = 0;
      } else if (isSingleHandPinch && !isTargetingComp && gEngine.cursorPosition) {
        // INSPECTION MANIPULATION PINCH: Single-hand pinch in empty space rotates 3D model
        const cursorX = gEngine.cursorPosition.x;
        const cursorY = gEngine.cursorPosition.y;

        if (prevPinchPosRef.current === null) {
          // Initial pinch grab frame: capture start position without rotation jump
          prevPinchPosRef.current = { x: cursorX, y: cursorY };
          isGrabbingRef.current = true;
          hasUserInteractedRef.current = true;
          rotationVelocityRef.current = 0;
        } else {
          // Hand movement delta
          const dx = cursorX - prevPinchPosRef.current.x;
          prevPinchPosRef.current = { x: cursorX, y: cursorY };

          const DEADZONE_DISPLACEMENT = 0.0015; // Noise deadzone filter
          if (Math.abs(dx) > DEADZONE_DISPLACEMENT) {
            // Directional movement delta induces rotation
            const rotVel = -dx * 2.5;
            rotationVelocityRef.current = THREE.MathUtils.clamp(rotVel, -0.06, 0.06);
            idleRotationRef.current += rotationVelocityRef.current;
            frameInspectionRotDelta = rotVel;
          } else {
            // DEAD STOP REQUIREMENT: Hand stopped moving -> velocity rapidly decays to zero!
            rotationVelocityRef.current *= 0.3;
            if (Math.abs(rotationVelocityRef.current) < 0.0001) {
              rotationVelocityRef.current = 0;
            }
          }
        }
      } else {
        // Reset single-hand pinch state when pinch ends
        if (prevPinchPosRef.current !== null || isGrabbingRef.current) {
          prevPinchPosRef.current = null;
          isGrabbingRef.current = false;
        }
      }

      if (isTwoHandRotate && rawHandRot !== undefined) {
        if (lastHandRotationRef.current === null) {
          lastHandRotationRef.current = rawHandRot;
          rotationVelocityRef.current = 0;
        } else {
          let rotDelta = rawHandRot - lastHandRotationRef.current;
          lastHandRotationRef.current = rawHandRot;

          while (rotDelta < -Math.PI) rotDelta += 2 * Math.PI;
          while (rotDelta > Math.PI) rotDelta -= 2 * Math.PI;

          const DEADZONE_ROTATION = 0.012;
          if (Math.abs(rotDelta) > DEADZONE_ROTATION) {
            hasUserInteractedRef.current = true;
            const rotVel = rotDelta * 0.8;
            rotationVelocityRef.current = THREE.MathUtils.clamp(rotVel, -0.06, 0.06);
            idleRotationRef.current += rotationVelocityRef.current;
          } else {
            // DEAD STOP REQUIREMENT: Hands stopped rotating -> velocity rapidly decays to zero!
            rotationVelocityRef.current *= 0.3;
            if (Math.abs(rotationVelocityRef.current) < 0.0001) {
              rotationVelocityRef.current = 0;
            }
          }
        }
      } else {
        lastHandRotationRef.current = null;
      }

      // If user is not intentionally pinching or two-hand rotating (e.g. HAND_PRESENT or HAND_HOVER)
      if (!isActivelyInteracting) {
        // Dead stop momentum decay
        if (Math.abs(rotationVelocityRef.current) > 0.0001) {
          idleRotationRef.current += rotationVelocityRef.current;
          rotationVelocityRef.current *= 0.5; // Rapid decay to dead stop
        } else {
          rotationVelocityRef.current = 0;
        }
      }

      // =========================================================================
      // ADVIS SPATIAL MODE CONTROLLERS (MODE SEPARATION V2)
      // =========================================================================
      // - SHOWCASE: Museum exhibit, slow cinematic auto rotation ONLY when not manipulating.
      // - EXPLODED: Engineering CAD analysis. Absolutely ZERO auto rotation.
      // - DEMO: Educational presentation. Micro component facing alignment.
      // - INSPECTION (Default): Pure direct manual control. Zero auto rotation.
      // =========================================================================
      const currentMode = spatialModeRef.current;
      const activeObjForDemo = currentSpatialObjectRef.current ? SPATIAL_LIBRARY[Array.isArray(currentSpatialObjectRef.current) ? currentSpatialObjectRef.current[0] : currentSpatialObjectRef.current as string] : null;

      if (!isActivelyInteracting && rotationVelocityRef.current === 0) {
        if (currentMode === 'SHOWCASE') {
          // [SHOWCASE_CONTROLLER]: Smooth cinematic museum exhibition (~2x speed)
          idleRotationRef.current += 0.10 * delta;
        } else if (currentMode === 'EXPLODED') {
          // [EXPLODE_CONTROLLER]: Engineering CAD analysis. Absolutely NO automatic rotation.
        } else if (currentMode === 'DEMO') {
          // [DEMO_CONTROLLER]: Gentle micro-alignment to face the currently highlighted step component
          if (activeObjForDemo && presentationStepRef.current > 0) {
            const compIdx = presentationStepRef.current - 1;
            if (compIdx >= 0 && compIdx < activeObjForDemo.components.length) {
              const comp = activeObjForDemo.components[compIdx];
              const targetAngle = -Math.atan2(comp.position[0], comp.position[2]);
              let diff = targetAngle - idleRotationRef.current;
              while (diff < -Math.PI) diff += 2 * Math.PI;
              while (diff > Math.PI) diff -= 2 * Math.PI;
              idleRotationRef.current += diff * 0.03;
            }
          }
        } else {
          // [INSPECTION_CONTROLLER] (Default): Pure manual inspection. Model stays frozen.
        }
      }

      mainGroupRef.current.rotation.set(0, idleRotationRef.current, 0);

      // Temporary debug logging for rotation
      if (Math.random() < 0.04) {
        console.log('[ROTATION DEBUG]', {
          handsCount: gEngine.handsCount,
          isPinch: gEngine.isPinch,
          twoHand: gEngine.handsCount === 2,
          rotationDelta: Number(frameInspectionRotDelta.toFixed(4)),
          rotationVelocity: Number(rotationVelocityRef.current.toFixed(4)),
          currentRotation: Number(idleRotationRef.current.toFixed(4))
        });
      }

      // [INSPECTION DEBUG] Required logging
      if (Math.random() < 0.06) {
        console.log('[INSPECTION DEBUG]', {
          pinch: isSingleHandPinch,
          rotationDelta: Number(rotationVelocityRef.current.toFixed(4)),
          objectPosition: {
            x: Number(objectPosRef.current.x.toFixed(3)),
            y: Number(objectPosRef.current.y.toFixed(3)),
            z: Number(objectPosRef.current.z.toFixed(3))
          },
          cameraRadius: Number(gEngine.spatialCam.radius.toFixed(2)),
          cameraTheta: Number(gEngine.spatialCam.theta.toFixed(2)),
          cameraPhi: Number(gEngine.spatialCam.phi.toFixed(2))
        });
      }
    }
    
    // G. Explode animations and mechanical reciprocating movements
    const currentObjIds = currentSpatialObjectRef.current 
      ? (Array.isArray(currentSpatialObjectRef.current) ? currentSpatialObjectRef.current : [currentSpatialObjectRef.current])
      : [];
    currentObjIds.forEach(objId => {
      const activeObject = SPATIAL_LIBRARY[objId];
      if (activeObject) {
        activeObject.components.forEach(comp => {
          const meshObj = componentRefs.current[comp.id];
          if (meshObj) {
            const targetOffset = isExplodedRef.current ? comp.explodedOffset : [0, 0, 0];
            meshObj.position.x += ((comp.position[0] + targetOffset[0]) - meshObj.position.x) * 0.08;
            meshObj.position.y += ((comp.position[1] + targetOffset[1]) - meshObj.position.y) * 0.08;
            meshObj.position.z += ((comp.position[2] + targetOffset[2]) - meshObj.position.z) * 0.08;

            if (objId === 'engine_v12' && !isExplodedRef.current) {
              const time = state.clock.elapsedTime * 6;
              if (comp.id === 'piston_left_bank') {
                meshObj.position.y = comp.position[1] + Math.sin(time) * 0.4;
              } else if (comp.id === 'piston_right_bank') {
                meshObj.position.y = comp.position[1] + Math.sin(time + Math.PI) * 0.4;
              } else if (comp.id === 'crankshaft') {
                meshObj.rotation.x = time;
              }
            }

            if (objId === 'human_heart') {
              const pulse = 1 + Math.sin(state.clock.elapsedTime * 4.5) * 0.06;
              meshObj.scale.set(pulse, pulse, pulse);
            }
          }
        });
      }
    });
  });

  const objectIds = Array.isArray(currentSpatialObject) 
    ? currentSpatialObject 
    : (currentSpatialObject ? [currentSpatialObject] : []);

  if (objectIds.length === 0 || !objectIds.every(id => SPATIAL_LIBRARY[id])) return null;

  return (
    <group
      ref={mainGroupRef}
      position={[0, -2.8, 0]}
      rotation={[0.2, -0.4, 0]}
      scale={[0.001, 0.001, 0.001]}
    >
      {/* Base Holographic Projector (Tony Stark style from below) */}
      <group position={[0, -2.8, 0]}>
        <Cylinder args={[0.3, 0.4, 0.1, 32]}>
           <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.25, 0.25, 0.11, 32]}>
           <meshBasicMaterial color="#06b6d4" />
        </Cylinder>
      </group>

      {/* RENDER THE OBJECT STATUS OR COMPONENTS */}
      <group>
        {objectIds.map((objId, idx) => {
          const obj = SPATIAL_LIBRARY[objId];
          if (!obj) return null;

          const baseSpacing = 6.0;
          const spacing = Math.max(baseSpacing, (obj.defaultScale || 1.0) * 4.5 + (objectIds.length > 2 ? 2.0 : 0));
          const totalWidth = (objectIds.length - 1) * spacing;
          const offsetX = (idx * spacing) - (totalWidth / 2);

          return (
            <group key={objId} position={[offsetX, 0, 0]}>
              {obj.modelStatus === 'AWAITING_ASSET' ? (
                <Html position={[0, 0, 0]} center transform distanceFactor={12}>
                  <div className="flex flex-col items-center justify-center border border-cyan-500/20 bg-cyan-950/30 px-10 py-8 rounded-2xl backdrop-blur-lg shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                    <div className="text-cyan-400 font-mono font-bold tracking-[0.3em] text-[10px] uppercase mb-4 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
                      MODEL REGISTRY
                    </div>
                    <div className="text-cyan-50 font-sans font-light text-xl tracking-wide text-center mb-1">
                      {obj.name}
                    </div>
                    <div className="text-cyan-300/60 font-mono text-xs tracking-widest uppercase mb-6">
                      ASSET STATUS: UNAVAILABLE
                    </div>
                  </div>
                </Html>
              ) : obj.modelStatus === 'UNAVAILABLE' ? (
                <Html center position={[0, 0, 0]}>
                  <div className="flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] min-w-[300px]">
                    <div className="w-12 h-12 mb-4 rounded-full border border-dashed border-cyan-400/50 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" />
                    </div>
                    <h2 className="text-xl font-sans font-light text-cyan-50 mb-2 tracking-wide text-center">Model Unavailable</h2>
                    <p className="text-cyan-200/60 font-mono text-xs text-center leading-relaxed">
                      The high-fidelity asset for<br/>
                      <span className="text-cyan-400 font-bold">{obj.name}</span><br/>
                      is currently missing from the local repository.
                    </p>
                  </div>
                </Html>
              ) : (
                <group>
                  {obj.modelStatus === 'FALLBACK' && (
                    <Html position={[0, 2, 0]} center transform distanceFactor={10}>
                       <div className="px-4 py-2 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg text-cyan-400 font-mono text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                          {obj.name.split(' ')[0]} Visualization
                       </div>
                    </Html>
                  )}
                  
                  {obj.id === 'electron' ? <ElectronCloud />
                   : obj.id === 'hydrogen_atom' ? <HydrogenAtom />
                  : obj.id === 'atomic_nucleus' ? <AtomicNucleus />
                  : obj.id === 'magnetic_field' ? <MagneticField />
                  : (
                    obj.components.map(comp => {
                      const isHovered = hoveredComponentId === comp.id;
                      const isSelected = selectedComponentId === comp.id;
                      const isHighlighted = highlightedComponentId === comp.id || isSelected;
                      
                      const transform = componentTransforms?.[comp.id];
                      const basePos = transform ? transform.position : comp.position;
                      const expOffset = comp.explodedOffset || [0, 0, 0];
                      const currentExplodedFactor = explodedFactor || 0;
                      
                      const pos: [number, number, number] = [
                        basePos[0] + expOffset[0] * currentExplodedFactor,
                        basePos[1] + expOffset[1] * currentExplodedFactor,
                        basePos[2] + expOffset[2] * currentExplodedFactor,
                      ];

                      const rot = transform ? transform.rotation : (comp.rotation || [0, 0, 0]);
                      const scl = transform ? transform.scale : [1, 1, 1];
                      
                      return (
                        <group 
                          key={comp.id} 
                          ref={(el) => {
                            if (el) componentRefs.current[comp.id] = el;
                          }}
                          position={pos}
                          rotation={rot as [number, number, number]}
                          scale={scl as [number, number, number]}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComponentId(comp.id);
                          }}
                          onPointerOver={(e) => {
                            e.stopPropagation();
                            setHoveredComponentId(comp.id);
                          }}
                          onPointerOut={(e) => {
                            e.stopPropagation();
                            if (hoveredComponentId === comp.id) {
                              setHoveredComponentId(null);
                            }
                          }}
                          userData={{ 
                            selectableId: comp.id,
                            componentName: comp.name,
                            description: comp.description,
                            category: obj.category,
                            specifications: comp.specifications || obj.educationalInformation?.specifications || { "Status": "Active" },
                            explodedOffset: comp.explodedOffset,
                            interactionEnabled: comp.interactionEnabled !== false
                          }}
                        >
                          <EngineeringComponentRenderer
                            comp={comp}
                            objectId={obj.id}
                            isHovered={isHovered}
                            isSelected={isSelected}
                            xrayEnabled={xrayEnabled}
                            blueprintEnabled={blueprintEnabled}
                            isHighlighted={isHighlighted}
                          />
                          
                           {(isHovered || isSelected || showLabels) && (
                            <Html distanceFactor={8} position={[comp.size[0]/2 + 0.5, comp.size[1]/2 + 0.5, 0]} center zIndexRange={[100, 0]}>
                              <div className="flex flex-row items-center pointer-events-none animate-fade-in mix-blend-screen transition-opacity duration-300">
                                <div className="w-16 h-[1px] bg-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                                <div className="flex flex-col pl-3 pt-1 border-l-[1px] border-cyan-400/40 pb-2 bg-slate-950/85 p-3 rounded-r-xl border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-mono font-bold text-cyan-300 text-[11px] uppercase tracking-[0.2em] drop-shadow-md">
                                      {comp.name}
                                    </span>
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                      OPERATIONAL
                                    </span>
                                  </div>
                                  <span className="font-sans font-light text-[9px] text-cyan-50/80 leading-snug w-56 mt-1 tracking-wide">
                                    {comp.description}
                                  </span>
                                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-cyan-500/20 pt-1.5">
                                    <div><span className="text-cyan-400/60">Material:</span> <span className="text-cyan-200 font-bold">{comp.engineeringDetails?.material || 'Alloy Steel'}</span></div>
                                    <div><span className="text-cyan-400/60">Temp:</span> <span className="text-cyan-200 font-bold">84°C</span></div>
                                    <div><span className="text-cyan-400/60">Load:</span> <span className="text-emerald-400 font-bold">Normal</span></div>
                                    <div><span className="text-cyan-400/60">Tolerance:</span> <span className="text-cyan-200 font-bold">±0.01mm</span></div>
                                  </div>
                                </div>
                              </div>
                            </Html>
                          )}
                        </group>
                      );
                    })
                  )}
                </group>
              )}
            </group>
          );
        })}
      </group>

      {/* 3D HOLOGRAPHIC TARGETING BEAM AND RETICLE */}
      <TargetingBeam 
        hoveredComponentId={hoveredComponentId} 
        hoverHitPointRef={hoverHitPointRef} 
        pointerRayPosRef={pointerRayPosRef} 
      />

      <gridHelper args={[8, 8, '#06b6d4', '#0891b2']} position={[0, -0.5, 0]} material-transparent={true} material-opacity={0.12} />
    </group>
  );
}
