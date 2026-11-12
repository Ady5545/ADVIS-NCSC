import React from 'react';
import * as THREE from 'three';
import { Tube } from '@react-three/drei';

export interface GeometryRenderContext {
  params: Record<string, any>;
  materialProps: {
    color: string;
    emissive: string;
    emissiveIntensity: number;
    metalness: number;
    roughness: number;
    opacity: number;
    transparent: boolean;
    wireframe: boolean;
  };
  simulationVariables: Record<string, number>;
}

export type GeometryGenerator = (context: GeometryRenderContext) => React.ReactNode;

class ScientificGeometryRegistryClass {
  private generators: Map<string, GeometryGenerator> = new Map();

  constructor() {
    this.registerPrimitives();
    this.registerDomainGeometries();
  }

  public registerGeometry(key: string, generator: GeometryGenerator) {
    this.generators.set(key, generator);
  }

  public getGeometry(key: string): GeometryGenerator | undefined {
    return this.generators.get(key);
  }

  public hasGeometry(key: string): boolean {
    return this.generators.has(key);
  }

  private registerPrimitives() {
    // 1. Box
    this.registerGeometry('box', ({ params, materialProps }) => (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[params.width || 1, params.height || 1, params.depth || 1]} />
        <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
      </mesh>
    ));

    // 2. Cylinder
    this.registerGeometry('cylinder', ({ params, materialProps }) => (
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[
            params.radiusTop ?? 0.5,
            params.radiusBottom ?? 0.5,
            params.height ?? 1.0,
            params.radialSegments ?? 48
          ]}
        />
        <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
      </mesh>
    ));

    // 3. Sphere
    this.registerGeometry('sphere', ({ params, materialProps }) => (
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[
            params.radius ?? 0.5,
            params.widthSegments ?? 48,
            params.heightSegments ?? 32
          ]}
        />
        <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
      </mesh>
    ));

    // 4. Torus
    this.registerGeometry('torus', ({ params, materialProps }) => (
      <mesh castShadow receiveShadow>
        <torusGeometry
          args={[
            params.radius ?? 0.5,
            params.tube ?? 0.1,
            params.radialSegments ?? 48,
            params.tubularSegments ?? 64,
            params.arc ?? Math.PI * 2
          ]}
        />
        <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
      </mesh>
    ));

    // 5. Cone
    this.registerGeometry('cone', ({ params, materialProps }) => (
      <mesh castShadow receiveShadow>
        <coneGeometry
          args={[
            params.radius ?? 0.5,
            params.height ?? 1.0,
            params.radialSegments ?? 48
          ]}
        />
        <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
      </mesh>
    ));
  }

  private registerDomainGeometries() {
    // Mechanical: Piston Assembly
    this.registerGeometry('piston_assembly', ({ params, materialProps }) => {
      const r = params.radius ?? 0.44;
      const h = params.height ?? 0.62;
      return (
        <group>
          {/* Piston Crown & Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[r, r, h, 48]} />
            <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
          </mesh>
          {/* Compression Rings */}
          <mesh position={[0, h * 0.3, 0]}>
            <torusGeometry args={[r * 1.01, 0.015, 12, 64]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, h * 0.2, 0]}>
            <torusGeometry args={[r * 1.01, 0.015, 8, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Wrist Pin */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -h * 0.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, r * 1.8, 24]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      );
    });

    // Mechanical: Poppet Valve
    this.registerGeometry('valve', ({ params, materialProps }) => {
      const headR = params.headRadius ?? 0.18;
      const stemR = params.stemRadius ?? 0.035;
      const stemL = params.stemLength ?? 0.65;
      return (
        <group>
          {/* Valve Poppet Head */}
          <mesh castShadow receiveShadow position={[0, -stemL * 0.5, 0]}>
            <cylinderGeometry args={[headR, stemR, 0.08, 48]} />
            <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
          </mesh>
          {/* Valve Stem */}
          <mesh castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[stemR, stemR, stemL, 24]} />
            <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
          </mesh>
          {/* Valve Spring Retainer */}
          <mesh position={[0, stemL * 0.45, 0]}>
            <cylinderGeometry args={[stemR * 2.2, stemR * 1.8, 0.05, 24]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );
    });

    // Mechanical: Spark Plug
    this.registerGeometry('spark_plug', ({ params, materialProps, simulationVariables }) => {
      const h = params.height ?? 0.55;
      return (
        <group>
          {/* Threaded Base */}
          <mesh position={[0, -h * 0.35, 0]}>
            <cylinderGeometry args={[0.06, 0.06, h * 0.3, 32]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Hex Nut Collar */}
          <mesh position={[0, -h * 0.15, 0]}>
            <cylinderGeometry args={[0.09, 0.09, h * 0.12, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* White Alumina Ceramic Insulator */}
          <mesh position={[0, h * 0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.07, h * 0.45, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.1} />
          </mesh>
          {/* Terminal Stud */}
          <mesh position={[0, h * 0.42, 0]}>
            <cylinderGeometry args={[0.025, 0.025, h * 0.12, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Spark Electrode Arc (Active Firing) */}
          {simulationVariables['sparkFiring'] === 1 && (
            <mesh position={[0, -h * 0.52, 0]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          )}
        </group>
      );
    });

    // Mechanical: Crankshaft Segment
    this.registerGeometry('crank_segment', ({ params, materialProps }) => {
      const len = params.length ?? 3.2;
      return (
        <group>
          {/* Main Center Shaft */}
          <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, len, 32]} />
            <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
          </mesh>
          {/* Counterweights */}
          {[-0.9, -0.3, 0.3, 0.9].map((zPos, idx) => (
            <group key={idx} position={[0, 0, zPos]}>
              <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[0.16, 0.52, 0.2]} />
                <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
              </mesh>
              {/* Offset Crankpin */}
              <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.11, 0.11, 0.24, 24]} />
                <meshStandardMaterial color="#f1f5f9" metalness={0.95} roughness={0.15} />
              </mesh>
            </group>
          ))}
        </group>
      );
    });

    // Anatomy: organ-specific meshes with recognizable external morphology.
    this.registerGeometry('anatomical_organ', ({ params, materialProps }) => {
      const r = params.radius ?? 0.6;
      if (params.organType === 'heart') {
        return (
          <group>
            <mesh castShadow receiveShadow position={[-r * 0.25, r * 0.12, 0]} rotation={[0, 0, -0.18]} scale={[0.72, 0.86, 0.72]}>
              <sphereGeometry args={[r, 48, 36]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.35} clearcoat={0.32} clearcoatRoughness={0.38} />
            </mesh>
            <mesh castShadow receiveShadow position={[r * 0.28, r * 0.08, 0.015]} rotation={[0, 0, 0.2]} scale={[0.7, 0.9, 0.74]}>
              <sphereGeometry args={[r, 48, 36]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.35} clearcoat={0.32} clearcoatRoughness={0.38} />
            </mesh>
            <mesh castShadow receiveShadow position={[r * 0.04, -r * 0.48, 0.02]} rotation={[0, 0, Math.PI]} scale={[0.48, 0.88, 0.5]}>
              <coneGeometry args={[r * 0.78, r * 1.12, 48, 1]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.35} clearcoat={0.32} clearcoatRoughness={0.38} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * r * 0.22, r * 0.78, 0]} rotation={[0, 0, side * 0.2]}>
                <cylinderGeometry args={[r * 0.085, r * 0.11, r * 0.55, 24]} />
                <meshPhysicalMaterial color="#a83242" roughness={0.48} />
              </mesh>
            ))}
          </group>
        );
      }
      if (params.organType === 'lung_left' || params.organType === 'lung_right') {
        const isLeft = params.organType === 'lung_left';
        return (
          <group>
            <mesh castShadow receiveShadow position={[0, r * 0.12, 0]} scale={[0.72, 1.12, 0.58]}>
              <sphereGeometry args={[r, 56, 40]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} clearcoat={0.16} clearcoatRoughness={0.52} />
            </mesh>
            <mesh castShadow receiveShadow position={[isLeft ? r * 0.1 : -r * 0.1, -r * 0.35, r * 0.015]} scale={[0.68, 0.68, 0.56]}>
              <sphereGeometry args={[r, 48, 36]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} clearcoat={0.16} clearcoatRoughness={0.52} />
            </mesh>
            <mesh position={[0, r * 0.05, r * 0.58]} rotation={[0, 0, isLeft ? -0.12 : 0.12]}>
              <torusGeometry args={[r * 0.54, r * 0.012, 8, 48, Math.PI * 0.92]} />
              <meshStandardMaterial color="#d98aa6" roughness={0.8} transparent opacity={0.62} />
            </mesh>
          </group>
        );
      }
      if (params.organType === 'brain') {
        return (
          <group>
            {[-1, 1].map((side) => (
              <mesh key={side} castShadow receiveShadow position={[side * r * 0.28, 0, 0]} scale={[0.72, 0.9, 0.78]}>
                <sphereGeometry args={[r, 56, 40]} />
                <meshPhysicalMaterial {...materialProps} envMapIntensity={1.25} clearcoat={0.18} clearcoatRoughness={0.5} />
              </mesh>
            ))}
            <mesh position={[0, -r * 0.66, -r * 0.12]} scale={[r * 0.22, r * 0.52, r * 0.24]}>
              <capsuleGeometry args={[1, 1, 8, 20]} />
              <meshPhysicalMaterial color={materialProps.color} roughness={0.64} />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} position={[0, r * (0.48 - i * 0.14), r * 0.68]} rotation={[0, 0, (i - 3) * 0.13]}>
                <torusGeometry args={[r * (0.42 + (i % 2) * 0.06), r * 0.018, 8, 48, Math.PI * 1.25]} />
                <meshStandardMaterial color="#d99aa9" roughness={0.82} transparent opacity={0.55} />
              </mesh>
            ))}
          </group>
        );
      }
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[r, 56, 40]} />
          <meshPhysicalMaterial {...materialProps} envMapIntensity={1.25} clearcoat={0.18} />
        </mesh>
      );
    });


    // Anatomy: selectable full-body parts, muscles, bones and articulations.
    this.registerGeometry('anatomical_shape', ({ params, materialProps }) => {
      const parts = Array.isArray(params.parts) ? params.parts : [];
      const material = <meshPhysicalMaterial {...materialProps} envMapIntensity={1.25} clearcoat={0.12} clearcoatRoughness={0.42} />;
      return (
        <group>
          {parts.map((part: any, index: number) => {
            const position = part.position || [0, 0, 0];
            const rotation = part.rotation || [0, 0, 0];
            const radius = part.radius ?? 0.04;
            const length = part.length ?? 0.18;
            const headRadius = part.headRadius ?? radius * 1.8;

            if (part.shape === 'ellipsoid') {
              return (
                <mesh key={index} position={position} rotation={rotation} scale={part.scale || [1, 1, 1]} castShadow receiveShadow>
                  <sphereGeometry args={[1, 64, 48]} />
                  <meshPhysicalMaterial {...materialProps} envMapIntensity={1.35} clearcoat={0.18} clearcoatRoughness={0.48} />
                </mesh>
              );
            }

            if (part.shape === 'capsule') {
              return (
                <mesh key={index} position={position} rotation={rotation} castShadow receiveShadow>
                  <capsuleGeometry args={[radius, length, 12, 40]} />
                  <meshPhysicalMaterial {...materialProps} envMapIntensity={1.3} clearcoat={0.16} clearcoatRoughness={0.5} />
                </mesh>
              );
            }

            if (part.shape === 'muscle') {
              const half = length * 0.5;
              const belly = radius;
              const profile = [
                new THREE.Vector2(0, -half),
                new THREE.Vector2(belly * 0.18, -half * 0.94),
                new THREE.Vector2(belly * 0.38, -half * 0.78),
                new THREE.Vector2(belly * 0.72, -half * 0.48),
                new THREE.Vector2(belly, -half * 0.12),
                new THREE.Vector2(belly * 0.98, half * 0.12),
                new THREE.Vector2(belly * 0.72, half * 0.48),
                new THREE.Vector2(belly * 0.38, half * 0.78),
                new THREE.Vector2(belly * 0.18, half * 0.94),
                new THREE.Vector2(0, half),
              ];
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow>
                    <latheGeometry args={[profile, 48]} />
                    <meshPhysicalMaterial {...materialProps} envMapIntensity={1.25} clearcoat={0.22} clearcoatRoughness={0.42} sheen={0.16} sheenRoughness={0.55} />
                  </mesh>
                  <mesh position={[0, half * 0.78, 0]} scale={[belly * 0.2, half * 0.24, belly * 0.2]}>
                    <sphereGeometry args={[1, 24, 16]} />
                    <meshStandardMaterial color="#e8b9a9" roughness={0.72} />
                  </mesh>
                  <mesh position={[0, -half * 0.78, 0]} scale={[belly * 0.2, half * 0.24, belly * 0.2]}>
                    <sphereGeometry args={[1, 24, 16]} />
                    <meshStandardMaterial color="#e8b9a9" roughness={0.72} />
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'bone') {
              const half = length * 0.5;
              const shaft = radius;
              const head = headRadius;
              const profile = [
                new THREE.Vector2(0, -half),
                new THREE.Vector2(head * 0.68, -half),
                new THREE.Vector2(head * 0.94, -half * 0.91),
                new THREE.Vector2(head * 0.82, -half * 0.72),
                new THREE.Vector2(shaft * 1.18, -half * 0.48),
                new THREE.Vector2(shaft, 0),
                new THREE.Vector2(shaft * 1.18, half * 0.48),
                new THREE.Vector2(head * 0.82, half * 0.72),
                new THREE.Vector2(head * 0.94, half * 0.91),
                new THREE.Vector2(head * 0.68, half),
                new THREE.Vector2(0, half),
              ];
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow>
                    <latheGeometry args={[profile, 40]} />
                    <meshPhysicalMaterial {...materialProps} envMapIntensity={1.35} clearcoat={0.3} clearcoatRoughness={0.34} />
                  </mesh>
                  <mesh position={[0, half * 0.84, 0]} scale={[head * 0.72, head * 0.16, head * 0.72]}>
                    <sphereGeometry args={[1, 32, 20]} />
                    <meshPhysicalMaterial color={materialProps.color} roughness={0.62} metalness={0.01} />
                  </mesh>
                  <mesh position={[0, -half * 0.84, 0]} scale={[head * 0.72, head * 0.16, head * 0.72]}>
                    <sphereGeometry args={[1, 32, 20]} />
                    <meshPhysicalMaterial color={materialProps.color} roughness={0.62} metalness={0.01} />
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'joint') {
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow scale={[1, 0.94, 1]}>
                    <sphereGeometry args={[radius, 40, 32]} />
                    <meshPhysicalMaterial color={materialProps.color} roughness={0.42} metalness={0.01} clearcoat={0.24} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 1.12, 1.12]}>
                    <torusGeometry args={[radius * 0.78, radius * 0.095, 12, 48]} />
                    <meshPhysicalMaterial color="#b9e0df" metalness={0.01} roughness={0.3} transparent opacity={0.86} />
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'rib' && Array.isArray(part.points) && part.points.length >= 2) {
              const curve = new THREE.CatmullRomCurve3(
                part.points.map((point: number[]) => new THREE.Vector3(point[0], point[1], point[2])),
                false,
                'centripetal',
              );
              return (
                <Tube key={index} args={[curve, 64, radius, 14, false]}>
                  <meshPhysicalMaterial {...materialProps} envMapIntensity={1.3} clearcoat={0.22} clearcoatRoughness={0.4} />
                </Tube>
              );
            }

            if (part.shape === 'box') {
              return (
                <mesh key={index} position={position} rotation={rotation} scale={part.scale || [1, 1, 1]} castShadow receiveShadow>
                  <boxGeometry args={[1, 1, 1]} />
                  {material}
                </mesh>
              );
            }

            return null;
          })}
        </group>
      );
    });

    // Anatomy: Vascular Vessel
    this.registerGeometry('vascular_vessel', ({ params, materialProps }) => {
      const r = params.radius ?? 0.15;
      const l = params.length ?? 1.2;
      return (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[r, r, l, 32]} />
          <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
        </mesh>
      );
    });
  }
}

export const ScientificGeometryRegistry = new ScientificGeometryRegistryClass();
