// src/AutonomousModelEngine/precision/EyeModel.ts
// Anatomically structured human eye (globe, not orbit/eyelids).
// Frame: +Z = anterior (the direction the eye looks), +Y = superior.

import * as THREE from 'three';
import type { ComponentMetadata } from '../../SpatialLibrary';
import { V3, PBR, ColorFn, lathe, tube, torus, sphere, merge, fbm, smoothstep, finish } from './ProceduralToolkit';

const P0: V3 = [0, 0, 0];

export const EYE_COMPONENTS: ComponentMetadata[] = [
  {
    id: 'sclera', name: 'Sclera',
    description: 'The tough, white, roughly-spherical outer coat covering about 5/6 of the eyeball. Maintains the eye\'s shape and is the attachment point for the six extraocular muscles that move it.',
    position: P0, size: [1.0, 1.0, 1.0], explodedOffset: [0, 0, -0.9], shape: 'custom', color: '#f1f0ea',
    specifications: { 'Coverage': '~5/6 of the globe', 'Function': 'Structural shell, muscle attachment', 'Thickness': '0.3–1 mm' },
    engineeringDetails: { material: 'Dense collagen fiber connective tissue' },
  },
  {
    id: 'cornea', name: 'Cornea',
    description: 'The transparent dome over the front 1/6 of the eye. Avascular (no blood vessels — gets oxygen from tears and air) and provides about two-thirds of the eye\'s total focusing power, more than the lens.',
    position: P0, size: [0.42, 0.42, 0.2], explodedOffset: [0, 0, 0.95], shape: 'custom', color: '#bfe6f5',
    specifications: { 'Refractive power': '~43 dioptres (~2/3 of total)', 'Vascularity': 'None — avascular, nourished by tear film', 'Diameter': '~11.5 mm' },
    engineeringDetails: { material: 'Transparent stratified collagen (stroma)' },
  },
  {
    id: 'iris_pupil', name: 'Iris & Pupil',
    description: 'The coloured, pigmented muscular diaphragm behind the cornea. Its central opening, the pupil, is enlarged by the dilator muscle in dim light and constricted by the sphincter muscle in bright light.',
    position: P0, size: [0.4, 0.4, 0.05], explodedOffset: [0, 0, 0.6], shape: 'custom', color: '#6b4a2a',
    specifications: { 'Function': 'Controls light entry (pupil diameter)', 'Muscles': 'Sphincter (constrict) + Dilator (dilate)', 'Pupil range': '~2–8 mm diameter' },
    engineeringDetails: { material: 'Pigmented smooth muscle + connective tissue' },
  },
  {
    id: 'crystalline_lens', name: 'Crystalline Lens',
    description: 'A flexible, transparent biconvex lens suspended behind the iris by zonule fibers. The ciliary muscle changes its shape to fine-tune focus (accommodation) — the remaining ~1/3 of focusing power.',
    position: P0, size: [0.3, 0.3, 0.18], explodedOffset: [0, 0, 0.3], shape: 'custom', color: '#e6f3fa',
    specifications: { 'Refractive power': '~17–20 dioptres (adjustable)', 'Shape change': 'Via ciliary muscle (accommodation)', 'Note': 'Stiffens with age -> presbyopia' },
    engineeringDetails: { material: 'Transparent crystallin protein fibers' },
  },
  {
    id: 'vitreous_body', name: 'Vitreous Body',
    description: 'A clear, gel-like substance filling the large chamber behind the lens, maintaining the eyeball\'s spherical shape and transmitting light to the retina.',
    position: P0, size: [0.85, 0.85, 0.75], explodedOffset: [0, 0, -0.15], shape: 'custom', color: '#d9ecf5',
    specifications: { 'Volume': '~4 mL (~80% of eye volume)', 'Composition': '~99% water + collagen + hyaluronic acid', 'Function': 'Maintains globe shape, transmits light' },
    engineeringDetails: { material: 'Transparent collagen-hyaluronan gel' },
  },
  {
    id: 'retina_choroid', name: 'Retina & Choroid',
    description: 'The retina is the light-sensing inner lining (~120 million rods for dim-light/peripheral vision, ~6 million cones for colour/detail, densest at the central fovea). The choroid behind it is a dense vascular layer feeding the outer retina.',
    position: P0, size: [0.92, 0.92, 0.85], explodedOffset: [0, 0, -0.65], shape: 'custom', color: '#c2503f',
    specifications: { 'Rods': '~120 million (brightness, peripheral)', 'Cones': '~6 million (colour, central/foveal)', 'Choroid role': 'Blood supply to outer retina', 'Fovea': 'Cone-only region of sharpest vision' },
    engineeringDetails: { material: 'Neural tissue (retina) + dense capillary bed (choroid)' },
  },
  {
    id: 'retinal_vessels', name: 'Retinal Blood Vessels',
    description: 'The central retinal artery and vein branch out across the inner retinal surface from the optic disc — the only place in the body where blood vessels can be seen directly and non-invasively (ophthalmoscopy).',
    position: P0, size: [0.8, 0.8, 0.1], explodedOffset: [0, 0, -0.72], shape: 'custom', color: '#d13b3b',
    specifications: { 'Origin': 'Optic disc (central retinal artery/vein)', 'Clinical note': 'Directly visible via ophthalmoscope', 'Supplies': 'Inner retinal layers (choroid supplies outer layers)' },
    engineeringDetails: { material: 'Retinal microvasculature' },
  },
  {
    id: 'optic_nerve', name: 'Optic Nerve',
    description: 'A bundle of roughly 1.2 million ganglion-cell axons carrying visual signals from the retina to the brain. It exits at the optic disc — the eye\'s one true blind spot, since there are no photoreceptors there.',
    position: P0, size: [0.2, 0.2, 0.55], explodedOffset: [0, 0, -1.25], shape: 'custom', color: '#f0ead8',
    specifications: { 'Axon count': '~1.2 million', 'Exit point': 'Optic disc (the physiological blind spot)', 'Length': '~5 cm (globe to optic chiasm)' },
    engineeringDetails: { material: 'Myelinated axon bundle' },
  },
];

const OPAQUE_FIBROUS: PBR = { roughness: 0.55, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.2 };
const CLEAR: PBR = { roughness: 0.04, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.02 };
const MUSCLE: PBR = { roughness: 0.5, metalness: 0.0, clearcoat: 0.3, clearcoatRoughness: 0.4 };
const VASCULAR: PBR = { roughness: 0.45, metalness: 0.0, clearcoat: 0.4, clearcoatRoughness: 0.4, sheen: 0.3 };
const VESSEL: PBR = { roughness: 0.4, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.3 };
const NERVE: PBR = { roughness: 0.4, metalness: 0.0, clearcoat: 0.45, clearcoatRoughness: 0.35 };

function fiberColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const v = fbm(p.x * 10, p.y * 10, p.z * 10, seed, 4);
    return b.clone().offsetHSL(0.006 * (v - 0.5), 0.05 * (v - 0.5), 0.1 * (v - 0.5));
  };
}

/** Radial fiber pattern for the iris: alternating light/dark streaks from pupil edge outward. */
function irisColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const ang = Math.atan2(p.y, p.x);
    const radial = Math.sin(ang * 34 + fbm(p.x * 4, p.y * 4, 0, seed, 2) * 3) * 0.5 + 0.5;
    const fine = fbm(p.x * 22, p.y * 22, 0, seed + 7, 3);
    return b.clone().offsetHSL(0, 0.08 * (radial - 0.5), 0.16 * (radial - 0.5) + 0.06 * (fine - 0.5));
  };
}

interface VesselOpts { start: THREE.Vector3; dir: THREE.Vector3; length: number; radius: number; depth: number; maxDepth: number; seed: number; out: THREE.BufferGeometry[]; }
function branchFlat(o: VesselOpts): void {
  const end = o.start.clone().addScaledVector(o.dir, o.length);
  o.out.push(tube([o.start.toArray() as V3, end.toArray() as V3], (t) => o.radius * (1 - 0.2 * t), { radial: 6, segments: 8, paint: '#c23030' }));
  if (o.depth >= o.maxDepth || o.radius < 0.004) return;
  const n = (s: number) => { const h = Math.sin(s * 91.7 + o.depth * 57.3 + o.seed * 13.1) * 43758.5453; return h - Math.floor(h); };
  const normal = o.start.clone().normalize(); // stay roughly on the retinal sphere's tangent plane
  for (let i = 0; i < 2; i++) {
    const turn = (n(i + 1) - 0.5) * 1.6;
    const childDir = o.dir.clone().applyAxisAngle(normal, turn).normalize();
    branchFlat({ start: end, dir: childDir, length: o.length * (0.62 + n(i + 3) * 0.12), radius: o.radius * 0.68, depth: o.depth + 1, maxDepth: o.maxDepth, seed: o.seed, out: o.out });
  }
}

export function buildEyeGeometries(): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};

  // ---- Globe shells (sclera / cornea / vitreous / retina-choroid) as one shared lathed profile,
  // so the cornea bulges smoothly out of the sclera instead of being a separate floating cap. ----
  const scleraProfile: [number, number][] = [
    [0, 0.5], [0.35, 0.46], [0.48, 0.3], [0.5, 0], [0.47, -0.25], [0.3, -0.44], [0, -0.48],
  ];
  out.sclera = merge([lathe(scleraProfile, fiberColor('#f1f0ea', 301), { r: [Math.PI / 2, 0, 0] })], OPAQUE_FIBROUS);

  // Cornea: a shallower, higher-curvature dome grafted onto the front (+Z) pole, slightly proud
  // of the sclera's own curvature there (the real cornea has a tighter radius than the sclera).
  const corneaProfile: [number, number][] = [[0, 0.21], [0.12, 0.205], [0.21, 0.17], [0.25, 0.08], [0.25, 0]];
  const corneaColor: ColorFn = (p) => new THREE.Color('#d9f0fa').offsetHSL(0, 0, 0.04 * (fbm(p.x * 6, p.y * 6, p.z * 6, 302, 2) - 0.5));
  out.cornea = merge([
    lathe(corneaProfile, corneaColor, { p: [0, 0, 0.30], r: [Math.PI / 2, 0, 0] }),
  ], CLEAR);

  out.iris_pupil = merge([
    (() => {
      // RingGeometry is already flat in the XY plane with its normal along +Z, which is exactly
      // the iris orientation we want (facing the pupil down the optical axis) — no rotation needed.
      const ring = new THREE.RingGeometry(0.06, 0.2, 48, 4);
      ring.translate(0, 0, 0.28);
      return finish(ring, irisColor('#6b4a2a', 311));
    })(),
  ], MUSCLE);
  out.iris_pupil.userData.doubleSided = true;

  const lensProfile: [number, number][] = [[0, 0.09], [0.1, 0.07], [0.15, 0], [0.1, -0.07], [0, -0.09]];
  out.crystalline_lens = merge([
    lathe(lensProfile, '#e6f3fa', { p: [0, 0, 0.20], r: [Math.PI / 2, 0, 0] }, 28),
  ], CLEAR);

  const vitreousProfile: [number, number][] = [
    [0, 0.42], [0.3, 0.38], [0.42, 0.22], [0.44, -0.05], [0.4, -0.3], [0.22, -0.4], [0, -0.42],
  ];
  out.vitreous_body = merge([
    lathe(vitreousProfile, '#d9ecf5', { r: [Math.PI / 2, 0, 0] }),
  ], CLEAR);

  // Retina + choroid as a thin double-shell just inside the sclera, covering the back ~5/6 only
  // (it stops short of the ciliary body near the front, forming the ora serrata edge).
  const retinaProfile: [number, number][] = [
    [0, -0.47], [0.3, -0.43], [0.47, -0.24], [0.49, -0.02], [0.47, 0.18], [0.36, 0.33], [0.22, 0.40],
  ];
  out.retina_choroid = merge([
    lathe(retinaProfile, fiberColor('#c2503f', 321), { r: [Math.PI / 2, 0, 0] }),
  ], VASCULAR);

  // Optic disc + retinal vessels branching across the inner retinal surface from the disc.
  const vesselSegs: THREE.BufferGeometry[] = [];
  const disc = new THREE.Vector3(0, 0.08, -0.47);
  const tangent1 = new THREE.Vector3(1, 0, 0.17).normalize();
  const tangent2 = new THREE.Vector3(-1, 0.3, 0.1).normalize();
  const tangent3 = new THREE.Vector3(0.2, -1, 0.1).normalize();
  const tangent4 = new THREE.Vector3(-0.3, -0.9, 0.15).normalize();
  branchFlat({ start: disc, dir: tangent1, length: 0.16, radius: 0.016, depth: 0, maxDepth: 4, seed: 51, out: vesselSegs });
  branchFlat({ start: disc, dir: tangent2, length: 0.15, radius: 0.015, depth: 0, maxDepth: 4, seed: 53, out: vesselSegs });
  branchFlat({ start: disc, dir: tangent3, length: 0.17, radius: 0.016, depth: 0, maxDepth: 4, seed: 57, out: vesselSegs });
  branchFlat({ start: disc, dir: tangent4, length: 0.15, radius: 0.015, depth: 0, maxDepth: 4, seed: 59, out: vesselSegs });
  vesselSegs.push(torus(0.045, 0.012, '#e8dcc8', { p: [0, 0.08, -0.465] }, 8, 16)); // optic disc rim
  out.retinal_vessels = merge(vesselSegs, VESSEL);

  // Optic nerve: a bundle of axon-fascicle tubes twisted slightly, exiting the back of the globe.
  const nerveBundle: THREE.BufferGeometry[] = [];
  const nerveCount = 14;
  for (let i = 0; i < nerveCount; i++) {
    const a = (i / nerveCount) * Math.PI * 2;
    const r = 0.05 + (i % 3) * 0.006;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    nerveBundle.push(tube([
      [x * 0.3, y * 0.3, -0.47], [x * 0.7, y * 0.7, -0.65], [x, y, -0.95],
    ], 0.012, { radial: 8, paint: fiberColor('#f0ead8', 71 + i) }));
  }
  out.optic_nerve = merge([
    ...nerveBundle,
    tube([[0, 0, -0.47], [0, 0, -0.95]], 0.075, { radial: 16, paint: '#efe6d2' }), // sheath
  ], NERVE);

  return out;
}
