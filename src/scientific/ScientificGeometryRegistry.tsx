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

    // Anatomy: Organ
    this.registerGeometry('anatomical_organ', ({ params, materialProps }) => {
      const r = params.radius ?? 0.6;
      if (params.organType === 'heart') {
        return (
          <group>
            <mesh castShadow receiveShadow scale={[1, 1.2, 0.9]}>
              <sphereGeometry args={[r, 48, 32]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
            </mesh>
            {/* Left Ventricle Muscular Apex */}
            <mesh position={[0.15, -r * 0.4, 0.1]} scale={[0.7, 0.9, 0.7]}>
              <coneGeometry args={[r * 0.65, r * 1.1, 32]} />
              <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
            </mesh>
          </group>
        );
      }
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[r, 24, 16]} />
          <meshPhysicalMaterial {...materialProps} envMapIntensity={1.2} />
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
                  <sphereGeometry args={[1, 28, 20]} />
                  {material}
                </mesh>
              );
            }

            if (part.shape === 'capsule') {
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[radius, radius, length, 20, 1]} />
                    {material}
                  </mesh>
                  <mesh position={[0, length / 2, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[radius, 20, 14]} />
                    {material}
                  </mesh>
                  <mesh position={[0, -length / 2, 0]} castShadow receiveShadow>
                    <sphereGeometry args={[radius, 20, 14]} />
                    {material}
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'muscle') {
              return (
                <group key={index} position={position} rotation={rotation}>
                  {/* Fusiform muscle belly with tapered tendon ends. */}
                  <mesh castShadow receiveShadow scale={[radius * 1.05, length * 0.34, radius * 0.82]}>
                    <sphereGeometry args={[1, 24, 18]} />
                    {material}
                  </mesh>
                  <mesh position={[0, length * 0.34, 0]} scale={[radius * 0.30, length * 0.20, radius * 0.30]}>
                    <sphereGeometry args={[1, 18, 12]} />
                    {material}
                  </mesh>
                  <mesh position={[0, -length * 0.34, 0]} scale={[radius * 0.30, length * 0.20, radius * 0.30]}>
                    <sphereGeometry args={[1, 18, 12]} />
                    {material}
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'bone') {
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[radius, radius * 0.92, length * 0.78, 18, 1]} />
                    {material}
                  </mesh>
                  <mesh position={[0, length * 0.38, 0]} scale={[headRadius, headRadius * 0.78, headRadius]}>
                    <sphereGeometry args={[1, 20, 14]} />
                    {material}
                  </mesh>
                  <mesh position={[0, -length * 0.38, 0]} scale={[headRadius * 0.92, headRadius * 0.76, headRadius * 0.94]}>
                    <sphereGeometry args={[1, 20, 14]} />
                    {material}
                  </mesh>
                </group>
              );
            }

            if (part.shape === 'joint') {
              return (
                <group key={index} position={position} rotation={rotation}>
                  <mesh castShadow receiveShadow>
                    <sphereGeometry args={[radius, 24, 18]} />
                    {material}
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.12, 1.12, 1.12]}>
                    <torusGeometry args={[radius * 0.78, radius * 0.11, 8, 24]} />
                    <meshPhysicalMaterial color="#b9e0df" metalness={0.02} roughness={0.34} transparent opacity={0.8} />
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
                <Tube key={index} args={[curve, 32, radius, 10, false]}>
                  {material}
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
