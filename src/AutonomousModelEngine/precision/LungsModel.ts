// src/AutonomousModelEngine/precision/LungsModel.ts
// Anatomically structured human lungs with a real recursively-branching bronchial tree.
//
// Frame: anterior = +Z, patient's LEFT = +X, superior = +Y.

import * as THREE from 'three';
import type { ComponentMetadata } from '../../SpatialLibrary';
import { V3, PBR, ColorFn, blob, tube, cyl, torus, merge, fbm, smoothstep, applyXform } from './ProceduralToolkit';

const P0: V3 = [0, 0, 0];

export const LUNGS_COMPONENTS: ComponentMetadata[] = [
  {
    id: 'right_lung', name: 'Right Lung (3 Lobes)',
    description: 'The larger, heavier lung — wider and shorter than the left because the liver pushes its diaphragm surface up. Divided by the oblique and horizontal fissures into superior, middle and inferior lobes.',
    position: P0, size: [0.7, 1.3, 0.75], explodedOffset: [0.95, 0.05, 0.1], shape: 'custom', color: '#e8738a',
    specifications: { 'Lobes': '3 (Superior, Middle, Inferior)', 'Fissures': 'Oblique + Horizontal', 'Volume share': '~55% of total lung volume' },
    engineeringDetails: { material: 'Alveolar lung parenchyma + visceral pleura' },
  },
  {
    id: 'left_lung', name: 'Left Lung (2 Lobes)',
    description: 'Smaller than the right lung, with a concave cardiac notch on its medial surface that accommodates the apex of the heart. Divided by the oblique fissure into superior and inferior lobes only.',
    position: P0, size: [0.62, 1.25, 0.72], explodedOffset: [-0.95, 0.0, 0.1], shape: 'custom', color: '#e8738a',
    specifications: { 'Lobes': '2 (Superior, Inferior)', 'Distinct feature': 'Cardiac notch (for the heart apex)', 'Volume share': '~45% of total lung volume' },
    engineeringDetails: { material: 'Alveolar lung parenchyma + visceral pleura' },
  },
  {
    id: 'trachea', name: 'Trachea',
    description: 'The windpipe: a ~11 cm cartilaginous tube held open by 16–20 C-shaped (not full-ring) cartilage rings, the open back wall faced by the oesophagus. Splits at the carina into left and right primary bronchi.',
    position: P0, size: [0.18, 0.7, 0.18], explodedOffset: [0, 1.05, 0.15], shape: 'custom', color: '#6fc6e8',
    specifications: { 'Length': '~11 cm', 'Diameter': '~2 cm', 'Cartilage rings': '16–20 C-shaped rings', 'Branches at': 'The carina (~T4/T5 level)' },
    engineeringDetails: { material: 'Hyaline cartilage rings + smooth muscle (trachealis)' },
  },
  {
    id: 'bronchial_tree', name: 'Bronchial Tree',
    description: 'The airway keeps dividing roughly 23 times from trachea to alveoli — primary bronchi, secondary (lobar) bronchi, tertiary (segmental) bronchi, then ever-finer bronchioles — like an inverted, hollow tree.',
    position: P0, size: [1.3, 1.1, 1.0], explodedOffset: [0, -0.1, 0.5], shape: 'custom', color: '#5fb8de',
    specifications: { 'Generations to alveoli': '~23', 'Right primary bronchus': 'Wider, shorter, more vertical (why food/objects lodge there more often)', 'Cartilage': 'Present in bronchi, absent in terminal bronchioles' },
    engineeringDetails: { material: 'Cartilage (large airways) tapering to smooth muscle (bronchioles)' },
  },
  {
    id: 'pulmonary_vessels_lung', name: 'Pulmonary Arteries & Veins',
    description: 'A separate low-pressure vascular tree runs alongside the airways: pulmonary arteries carry deoxygenated blood in to be oxygenated, pulmonary veins carry oxygenated blood back out to the left atrium.',
    position: P0, size: [1.2, 1.0, 0.9], explodedOffset: [0.35, 0.4, -0.55], shape: 'custom', color: '#c23a4a',
    specifications: { 'Pulmonary artery pressure': '~15 mmHg (vs ~100 mmHg systemic)', 'Function': 'Only circuit where arteries carry deoxygenated blood', 'Capillary bed': 'Wraps every alveolus for gas exchange' },
    engineeringDetails: { material: 'Low-pressure vascular wall' },
  },
  {
    id: 'alveolar_tissue', name: 'Alveolar Gas-Exchange Tissue',
    description: 'At the finest branches, ~300 million grape-like alveoli give the lungs a combined internal surface area close to a tennis court — the actual site of all oxygen/CO₂ exchange with blood.',
    position: P0, size: [0.9, 1.0, 0.8], explodedOffset: [-0.3, -0.75, -0.35], shape: 'custom', color: '#f0b8c2',
    specifications: { 'Alveoli count': '~300 million', 'Surface area': '~70 m² (roughly a tennis court)', 'Diffusion distance': '< 1 micron (alveolus to capillary)' },
    engineeringDetails: { material: 'Simple squamous epithelium + surfactant lining' },
  },
];

const PARENCHYMA: PBR = { roughness: 0.62, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.5, sheen: 0.35 };
const AIRWAY: PBR = { roughness: 0.4, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.3 };
const VESSEL: PBR = { roughness: 0.42, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.2 };
const ALVEOLI: PBR = { roughness: 0.7, metalness: 0.0, clearcoat: 0.15, clearcoatRoughness: 0.6, sheen: 0.5 };

function spongyColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    // Two-scale noise: broad lobulation + fine alveolar stipple
    const broad = fbm(p.x * 2.6, p.y * 2.6, p.z * 2.6, seed, 4);
    const fine = fbm(p.x * 16, p.y * 16, p.z * 16, seed + 23, 3);
    return b.clone().offsetHSL(0.006 * (broad - 0.5), 0.08 * (broad - 0.5), 0.14 * (broad - 0.5) + 0.05 * (fine - 0.5));
  };
}

interface BranchOpts {
  start: THREE.Vector3;
  dir: THREE.Vector3;
  length: number;
  radius: number;
  depth: number;
  maxDepth: number;
  seed: number;
  paint: ColorInputLike;
  out: THREE.BufferGeometry[];
}
type ColorInputLike = string;

/** Recursive binary branching airway/vessel tree — deterministic (seeded), no Math.random. */
function branch(o: BranchOpts): void {
  const end = o.start.clone().addScaledVector(o.dir, o.length);
  o.out.push(tube([o.start.toArray() as V3, end.toArray() as V3], (t) => o.radius * (1 - 0.15 * t), {
    radial: Math.max(6, 16 - o.depth * 2), segments: 10, caps: o.depth === o.maxDepth, paint: o.paint,
  }));
  if (o.depth >= o.maxDepth || o.radius < 0.006) return;

  const n = (seed: number) => {
    const h = Math.sin(seed * 127.1 + o.depth * 311.7 + o.seed * 74.3) * 43758.5453;
    return h - Math.floor(h);
  };
  // Two children, splayed by a deterministic pseudo-random angle, biased to spread outward.
  const up = Math.abs(o.dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const perp1 = new THREE.Vector3().crossVectors(o.dir, up).normalize();
  const perp2 = new THREE.Vector3().crossVectors(o.dir, perp1).normalize();
  for (let i = 0; i < 2; i++) {
    const a = 0.38 + n(i * 2 + 1) * 0.22; // splay angle
    const roll = n(i * 2 + 2) * Math.PI * 2;
    const spread = perp1.clone().multiplyScalar(Math.cos(roll)).addScaledVector(perp2, Math.sin(roll));
    const childDir = o.dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(spread, Math.sin(a)).normalize();
    branch({
      start: end,
      dir: childDir,
      length: o.length * (0.72 + n(i * 3 + 5) * 0.08),
      radius: o.radius * 0.72,
      depth: o.depth + 1,
      maxDepth: o.maxDepth,
      seed: o.seed,
      paint: o.paint,
      out: o.out,
    });
  }
}

export function buildLungsGeometries(): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};

  // ---- Lung lobes: lobulated organic blobs, pyramid-ish (apex up, base on diaphragm) ----------
  const lungBlob = (center: V3, radii: V3, rot: V3, seed: number, notch: boolean) =>
    blob({
      radii, center, rot, noiseAmp: 0.045, noiseFreq: 2.1, seed, segW: 60, segH: 48,
      taper: (y) => 1 - 0.18 * smoothstep(0.5, 1, y), // narrows slightly toward the apex
      shape: notch ? (d) => (d.x < -0.1 && d.y > -0.2 && d.z > 0.1 ? 0.62 : 1) : undefined,
      paint: spongyColor('#e8738a', seed),
    });

  out.right_lung = merge([
    lungBlob([0.55, 0.15, -0.05], [0.42, 0.62, 0.38], [0.02, 0, -0.04], 201, false),
  ], PARENCHYMA);
  out.left_lung = merge([
    lungBlob([-0.55, 0.12, -0.05], [0.38, 0.60, 0.36], [0.02, 0, 0.05], 202, true),
  ], PARENCHYMA);

  // ---- Trachea: lathed profile with subtle ridges standing in for cartilage rings -------------
  const trCurve: V3[] = [[0, 0.95, 0.15], [0, 0.78, 0.14], [0, 0.60, 0.13]];
  const trachea = tube(trCurve, 0.085, { radial: 24, paint: '#6fc6e8' });
  const rings: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const y = 0.95 - i * 0.044;
    rings.push(torus(0.088, 0.008, '#4fa8cc', { p: [0, y, 0.15] }, 8, 20));
  }
  out.trachea = merge([trachea, ...rings], AIRWAY);

  // ---- Bronchial tree: real recursive branching from the carina into each lung -----------------
  const airwaySegs: THREE.BufferGeometry[] = [];
  const carina = new THREE.Vector3(0, 0.58, 0.14);
  branch({ start: carina, dir: new THREE.Vector3(0.55, -0.35, -0.1).normalize(), length: 0.30, radius: 0.052, depth: 0, maxDepth: 6, seed: 11, paint: '#5fb8de', out: airwaySegs });
  branch({ start: carina, dir: new THREE.Vector3(-0.50, -0.38, -0.1).normalize(), length: 0.28, radius: 0.048, depth: 0, maxDepth: 6, seed: 23, paint: '#5fb8de', out: airwaySegs });
  out.bronchial_tree = merge(airwaySegs, AIRWAY);

  // ---- Pulmonary vessels: a second branching tree (vessels, not airways), colour-coded ---------
  const vesselSegs: THREE.BufferGeometry[] = [];
  const hilumR = new THREE.Vector3(0.18, 0.28, -0.02);
  const hilumL = new THREE.Vector3(-0.16, 0.26, -0.02);
  branch({ start: hilumR, dir: new THREE.Vector3(0.6, -0.3, -0.25).normalize(), length: 0.26, radius: 0.034, depth: 0, maxDepth: 5, seed: 41, paint: '#3f5fc0', out: vesselSegs }); // artery (deoxy, in)
  branch({ start: hilumR, dir: new THREE.Vector3(0.45, -0.1, 0.3).normalize(), length: 0.24, radius: 0.030, depth: 0, maxDepth: 5, seed: 43, paint: '#d14a4a', out: vesselSegs }); // vein (oxy, out)
  branch({ start: hilumL, dir: new THREE.Vector3(-0.55, -0.32, -0.22).normalize(), length: 0.24, radius: 0.030, depth: 0, maxDepth: 5, seed: 47, paint: '#3f5fc0', out: vesselSegs });
  branch({ start: hilumL, dir: new THREE.Vector3(-0.42, -0.12, 0.3).normalize(), length: 0.22, radius: 0.028, depth: 0, maxDepth: 5, seed: 49, paint: '#d14a4a', out: vesselSegs });
  out.pulmonary_vessels_lung = merge(vesselSegs, VESSEL);

  // ---- Alveolar tissue: dense cluster of tiny bumpy spheres at the periphery, grape-like --------
  const alv: THREE.BufferGeometry[] = [];
  const clusterAt = (c: V3, n: number, seed: number) => {
    for (let i = 0; i < n; i++) {
      const h = (i * 2654435761) ^ (seed * 374761393);
      const rx = ((h & 0xff) / 255 - 0.5) * 0.5;
      const ry = (((h >>> 8) & 0xff) / 255 - 0.5) * 0.5;
      const rz = (((h >>> 16) & 0xff) / 255 - 0.5) * 0.5;
      const r = 0.022 + (((h >>> 24) & 0xff) / 255) * 0.016;
      alv.push(applyXform(
        new THREE.SphereGeometry(r, 8, 6).translate(c[0] + rx, c[1] + ry, c[2] + rz) as unknown as THREE.BufferGeometry,
        {}
      ));
    }
  };
  // Build alveolar clusters at several terminal-ish positions around each lung's periphery
  const clusterCenters: V3[] = [
    [0.75, -0.15, -0.15], [0.68, 0.25, -0.25], [0.45, -0.35, -0.3], [0.78, -0.02, 0.2],
    [-0.75, -0.18, -0.12], [-0.65, 0.22, -0.22], [-0.42, -0.35, -0.28],
  ];
  clusterCenters.forEach((c, i) => clusterAt(c, 26, 61 + i));
  const merged = merge(alv);
  merged.computeVertexNormals();
  out.alveolar_tissue = merge([
    merged,
  ].map((g) => {
    // paint after merge since the raw spheres above have no color attr yet
    const geo = g;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const base = new THREE.Color('#f0b8c2');
    for (let i = 0; i < pos.count; i++) {
      const v = fbm(pos.getX(i) * 8, pos.getY(i) * 8, pos.getZ(i) * 8, 71, 3);
      const c = base.clone().offsetHSL(0, 0.05 * (v - 0.5), 0.12 * (v - 0.5));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }), ALVEOLI);

  return out;
}
