import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { CadModelData } from './CadTypes';

function CadMesh({
  model,
  sectionOffset = 0,
  sectionEnabled = false,
}: {
  model: CadModelData;
  sectionOffset?: number;
  sectionEnabled?: boolean;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(model.mesh.positions, 3));
    if (model.mesh.normals) {
      g.setAttribute('normal', new THREE.BufferAttribute(model.mesh.normals, 3));
    } else {
      g.computeVertexNormals();
    }
    g.setIndex(new THREE.BufferAttribute(model.mesh.indices, 1));
    g.computeBoundingBox();
    g.computeBoundingSphere();

    const center = g.boundingBox?.getCenter(new THREE.Vector3()) ?? new THREE.Vector3();
    g.translate(-center.x, -center.y, -center.z);
    return g;
  }, [model]);

  const clippingPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(1, 0, 0), sectionOffset),
    [sectionOffset],
  );

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#9ca3af"
        metalness={0.62}
        roughness={0.28}
        side={THREE.DoubleSide}
        clippingPlanes={sectionEnabled ? [clippingPlane] : []}
        clipShadows={sectionEnabled}
      />
    </mesh>
  );
}

export function CadModelCanvas({
  model,
  sectionEnabled = false,
  sectionOffset = 0,
}: {
  model: CadModelData;
  sectionEnabled?: boolean;
  sectionOffset?: number;
}) {
  return (
    <div className="h-full min-h-[360px] rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950">
      <Canvas
        gl={{ localClippingEnabled: true }}
        camera={{ position: [3.6, 2.8, 4.2], fov: 42 }}
        dpr={[1, 1.8]}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
        <directionalLight position={[-4, 2, -2]} intensity={0.65} />
        <Environment preset="studio" />
        <CadMesh model={model} sectionEnabled={sectionEnabled} sectionOffset={sectionOffset} />
        <gridHelper args={[6, 24, '#0e7490', '#164e63']} position={[0, -1.0, 0]} />
        <ContactShadows position={[0, -1.0, 0]} opacity={0.42} scale={8} blur={2.2} far={4} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
