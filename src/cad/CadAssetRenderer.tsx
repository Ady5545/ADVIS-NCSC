import React, { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CadModelData } from './CadTypes';
import { importCadFile } from './CadKernelService';

const modelCache = new Map<string, Promise<CadModelData>>();

function loadCadUrl(url: string, linearDeflection: number): Promise<CadModelData> {
  const cacheKey = `${url}::${linearDeflection}`;
  const cached = modelCache.get(cacheKey);
  if (cached) return cached;

  const pending = fetch(url, { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`CAD asset request failed (${response.status}) for ${url}`);
      }
      const blob = await response.blob();
      const extension = url.split('?')[0].split('.').pop() || 'step';
      const file = new File([blob], `asset.${extension}`, { type: blob.type || 'application/octet-stream' });
      return importCadFile(file, undefined, {
        linearDeflection,
        angularDeflection: 0.22,
      });
    });

  modelCache.set(cacheKey, pending);
  return pending;
}

function getLinearDeflection(lodTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA', magnifier: boolean) {
  if (magnifier || lodTier === 'ULTRA') return 0.01;
  if (lodTier === 'HIGH') return 0.03;
  if (lodTier === 'MEDIUM') return 0.06;
  return 0.12;
}

export function CadAssetRenderer({
  url,
  scale = 1,
  xrayEnabled = false,
  blueprintEnabled = false,
  isHovered = false,
  isSelected = false,
  isHighlighted = false,
  lodTier = 'HIGH',
  magnifier = false,
}: {
  url: string;
  scale?: number;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  lodTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  magnifier?: boolean;
}) {
  const [model, setModel] = useState<CadModelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const linearDeflection = getLinearDeflection(lodTier, magnifier);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadCadUrl(url, linearDeflection)
      .then((data) => {
        if (!cancelled) setModel(data);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'CAD asset failed to load.');
      });

    return () => {
      cancelled = true;
    };
  }, [url, linearDeflection]);

  const geometry = useMemo(() => {
    if (!model) return null;

    const next = new THREE.BufferGeometry();
    next.setAttribute('position', new THREE.BufferAttribute(model.mesh.positions, 3));
    next.setAttribute('normal', new THREE.BufferAttribute(model.mesh.normals, 3));
    next.setIndex(new THREE.BufferAttribute(model.mesh.indices, 1));
    next.computeBoundingBox();
    next.computeBoundingSphere();

    const center = next.boundingBox?.getCenter(new THREE.Vector3()) || new THREE.Vector3();
    next.translate(-center.x, -center.y, -center.z);
    return next;
  }, [model]);

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (error) {
    return (
      <Html center>
        <div className="px-3 py-2 rounded-lg bg-rose-950/90 border border-rose-400/50 text-rose-200 text-[10px] font-mono whitespace-nowrap">
          CAD LOAD ERROR: {error}
        </div>
      </Html>
    );
  }

  if (!geometry) {
    return (
      <Html center>
        <div className="px-3 py-2 rounded-lg bg-slate-950/90 border border-cyan-400/30 text-cyan-200 text-[10px] font-mono animate-pulse">
          LOADING EXACT B-REP SURFACE…
        </div>
      </Html>
    );
  }

  return (
    <group scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#9ca3af"
          metalness={0.72}
          roughness={0.22}
          transparent={xrayEnabled}
          opacity={xrayEnabled ? 0.25 : 1}
          depthWrite={!xrayEnabled}
          wireframe={blueprintEnabled}
          emissive={isHighlighted || isSelected ? '#164e63' : '#000000'}
          emissiveIntensity={isHovered ? 0.34 : isSelected ? 0.22 : isHighlighted ? 0.16 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {blueprintEnabled && (
        <lineSegments geometry={new THREE.EdgesGeometry(geometry, 18)}>
          <lineBasicMaterial color="#22d3ee" transparent opacity={0.72} />
        </lineSegments>
      )}

      {magnifier && (
        <Html distanceFactor={9} position={[0, 1.2, 0]} center zIndexRange={[90, 0]}>
          <div className="px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-200 text-[9px] font-mono font-bold tracking-wider pointer-events-none shadow-[0_0_18px_rgba(34,211,238,0.25)]">
            ULTRA B-REP SURFACE
          </div>
        </Html>
      )}
    </group>
  );
}
