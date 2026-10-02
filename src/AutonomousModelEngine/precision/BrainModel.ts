// src/AutonomousModelEngine/precision/BrainModel.ts
// Anatomically structured human brain.
//
// Frame: anterior = +Z (face direction), patient's LEFT = +X, superior = +Y.
// All parts share one brain space with the pivot at the longitudinal fissure / foramen
// magnum, so hemisphere separation and exploded view stay coherent.

import * as THREE from 'three';
import type { ComponentMetadata } from '../../SpatialLibrary';
import {
  V3, PBR, ColorFn, blob, tube, sphere, merge, applyXform,
  fbm, smoothstep, clamp01, finish,
} from './ProceduralToolkit';

const P0: V3 = [0, 0, 0];

export const BRAIN_COMPONENTS: ComponentMetadata[] = [
  {
    id: 'frontal_lobe', name: 'Frontal Lobe',
    description: 'The largest lobe. Houses the prefrontal cortex (planning, judgement, personality), the motor cortex (voluntary movement) and Broca\'s area (speech production, usually left-dominant).',
    position: P0, size: [1.0, 0.6, 0.8], explodedOffset: [0.7, 0.35, 0.95], shape: 'custom', color: '#3b82c4',
    specifications: { 'Key areas': 'Prefrontal cortex, Motor cortex, Broca\'s area', 'Function': 'Planning, voluntary movement, speech, personality', 'Damage effect': 'Impaired judgement, personality change, weakness' },
    engineeringDetails: { material: 'Cerebral cortex (grey matter) over white matter' },
  },
  {
    id: 'parietal_lobe', name: 'Parietal Lobe',
    description: 'Sits behind the frontal lobe across the central sulcus. The somatosensory cortex here maps touch, pressure and body position; it also handles spatial reasoning and navigation.',
    position: P0, size: [0.85, 0.55, 0.6], explodedOffset: [0.65, 0.55, -0.1], shape: 'custom', color: '#1b9e8a',
    specifications: { 'Key area': 'Somatosensory cortex', 'Function': 'Touch, spatial awareness, navigation', 'Landmark': 'Bounded anteriorly by the central sulcus' },
    engineeringDetails: { material: 'Cerebral cortex over white matter' },
  },
  {
    id: 'temporal_lobe', name: 'Temporal Lobe',
    description: 'The lower lateral lobe, below the lateral (Sylvian) fissure. Contains the auditory cortex, Wernicke\'s area (language comprehension) and, deep within it, the hippocampus and amygdala.',
    position: P0, size: [0.9, 0.45, 0.65], explodedOffset: [0.95, -0.35, 0.15], shape: 'custom', color: '#c07a18',
    specifications: { 'Key areas': 'Auditory cortex, Wernicke\'s area', 'Contains': 'Hippocampus, amygdala (deep structures)', 'Function': 'Hearing, language comprehension, memory formation' },
    engineeringDetails: { material: 'Cerebral cortex over white matter' },
  },
  {
    id: 'occipital_lobe', name: 'Occipital Lobe',
    description: 'The smallest lobe, at the very back of the brain, almost entirely devoted to processing visual information from the eyes via the visual cortex.',
    position: P0, size: [0.55, 0.5, 0.45], explodedOffset: [0, 0.2, -0.95], shape: 'custom', color: '#9333c4',
    specifications: { 'Key area': 'Primary visual cortex (V1)', 'Function': 'Vision processing', 'Input': 'Optic radiations from the thalamus' },
    engineeringDetails: { material: 'Cerebral cortex over white matter' },
  },
  {
    id: 'cerebellum', name: 'Cerebellum ("Little Brain")',
    description: 'A densely folded structure tucked under the occipital lobes, behind the brainstem. Despite being ~10% of brain volume it holds over half the brain\'s neurons, fine-tuning movement, posture and balance.',
    position: P0, size: [0.9, 0.5, 0.55], explodedOffset: [0, -0.75, -0.55], shape: 'custom', color: '#7c3aed',
    specifications: { 'Neuron share': '> 50% of all brain neurons', 'Function': 'Motor coordination, balance, posture, motor learning', 'Surface': 'Densely folded folia (finer than cerebral gyri)' },
    engineeringDetails: { material: 'Cerebellar cortex over white matter' },
  },
  {
    id: 'brainstem', name: 'Brainstem (Midbrain, Pons & Medulla)',
    description: 'The stalk connecting brain to spinal cord: midbrain (eye movement, alertness), pons (relay + breathing rhythm) and medulla oblongata (heart rate, breathing, blood pressure — damage here is rapidly fatal).',
    position: P0, size: [0.3, 0.75, 0.3], explodedOffset: [0, -1.05, 0.05], shape: 'custom', color: '#dc2626',
    specifications: { 'Parts': 'Midbrain, Pons, Medulla oblongata', 'Function': 'Autonomic survival control, cranial nerve origins, ascending/descending tracts', 'Critical role': 'Regulates heart rate, breathing, blood pressure' },
    engineeringDetails: { material: 'White matter tracts + nuclei' },
  },
  {
    id: 'corpus_callosum', name: 'Corpus Callosum',
    description: 'A thick C-shaped band of roughly 200 million axons that bridges the two cerebral hemispheres, allowing them to share information and coordinate.',
    position: P0, size: [0.85, 0.2, 0.55], explodedOffset: [0, 0.05, 0.1], shape: 'custom', color: '#e9e4d8',
    specifications: { 'Axon count': '~200 million', 'Function': 'Interhemispheric communication', 'Shape': 'C-shaped (genu, body, splenium)' },
    engineeringDetails: { material: 'Myelinated white matter' },
  },
  {
    id: 'limbic_system', name: 'Limbic System (Hippocampus, Amygdala, Thalamus, Hypothalamus)',
    description: 'A ring of deep structures under the cortex: hippocampus (forms new long-term memories), amygdala (fear/emotional salience), thalamus (sensory relay hub) and hypothalamus (hormones, temperature, hunger, circadian rhythm).',
    position: P0, size: [0.6, 0.35, 0.45], explodedOffset: [0.5, -0.15, -0.15], shape: 'custom', color: '#e0652c',
    specifications: { 'Hippocampus': 'New long-term memory formation', 'Amygdala': 'Fear & emotional salience', 'Thalamus': 'Sensory relay hub', 'Hypothalamus': 'Hormones, temperature, hunger, circadian rhythm' },
    engineeringDetails: { material: 'Deep grey matter nuclei' },
  },
  {
    id: 'ventricular_system', name: 'Ventricular System & CSF',
    description: 'Four interconnected fluid-filled cavities (two lateral ventricles, third and fourth ventricle) that produce and circulate cerebrospinal fluid, cushioning the brain and clearing waste.',
    position: P0, size: [0.5, 0.3, 0.6], explodedOffset: [-0.55, 0.1, 0.0], shape: 'custom', color: '#5ec8e8',
    specifications: { 'CSF volume': '~150 mL (replaced ~4x/day)', 'Chambers': '2 lateral + 3rd + 4th ventricle', 'Function': 'Buoyancy, cushioning, waste clearance' },
    engineeringDetails: { material: 'Ependymal lining + cerebrospinal fluid' },
  },
  {
    id: 'cerebral_arteries', name: 'Cerebral Arterial Supply (Circle of Willis)',
    description: 'The brain consumes ~20% of the body\'s oxygen despite being ~2% of its mass. The Circle of Willis at the base links the anterior, middle and posterior cerebral arteries, providing collateral blood flow if one vessel is blocked.',
    position: P0, size: [1.1, 0.5, 1.0], explodedOffset: [-0.65, -0.55, 0.65], shape: 'custom', color: '#d13b3b',
    specifications: { 'Resting O2 use': '~20% of total body oxygen', 'Main vessels': 'ACA, MCA, PCA (left & right)', 'Collateral hub': 'Circle of Willis' },
    engineeringDetails: { material: 'Cerebral arteries' },
  },
];

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
const CORTEX: PBR = { roughness: 0.58, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.45, sheen: 0.3 };
const DEEP: PBR = { roughness: 0.5, metalness: 0.0, clearcoat: 0.4, clearcoatRoughness: 0.4, sheen: 0.25 };
const WHITE_MATTER: PBR = { roughness: 0.45, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.35 };
const FLUID: PBR = { roughness: 0.15, metalness: 0.0, clearcoat: 0.9, clearcoatRoughness: 0.05 };
const VESSEL: PBR = { roughness: 0.4, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.2 };

/** Gyri/sulci: a folded cortical ridge pattern via layered fBm, lower frequency than vessels. */
function gyriColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p, n) => {
    const ridge = fbm(p.x * 5.5, p.y * 5.5, p.z * 5.5, seed, 5);
    const fine = fbm(p.x * 14, p.y * 14, p.z * 14, seed + 31, 3);
    const shade = smoothstep(0.38, 0.62, ridge) * 0.6 + smoothstep(0.4, 0.6, fine) * 0.15;
    return b.clone().offsetHSL(0.004 * (shade - 0.4), 0.04 * (shade - 0.4), 0.16 * (shade - 0.45));
  };
}

/** Finer, tighter folia pattern for the cerebellum's densely ridged surface. */
function foliaColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const stripes = Math.sin(p.y * 42 + fbm(p.x * 6, p.z * 6, 0, seed, 3) * 6) * 0.5 + 0.5;
    const fine = fbm(p.x * 20, p.y * 20, p.z * 20, seed + 11, 3);
    return b.clone().offsetHSL(0, 0.05 * (stripes - 0.5), 0.14 * (stripes - 0.5) + 0.06 * (fine - 0.5));
  };
}

// ---------------------------------------------------------------------------
// Lazy geometry builder
// ---------------------------------------------------------------------------
export function buildBrainGeometries(): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};

  // Each cortical lobe is an organic blob shaped to roughly match its real position & silhouette,
  // folded with a ridge-noise gyri/sulci pattern. Pairs (L/R) mirror across X with a small seed
  // offset so left and right aren't identical copies.
  const lobe = (radii: V3, center: V3, rot: V3 | undefined, color: string, seed: number, noiseFreq = 2.2, noiseAmp = 0.05) =>
    blob({ radii, center, rot, noiseAmp, noiseFreq, seed, segW: 64, segH: 48, paint: gyriColor(color, seed) });

  out.frontal_lobe = merge([
    lobe([0.38, 0.34, 0.42], [0.30, 0.18, 0.42], [0.05, 0.1, 0], '#3b82c4', 101),
    lobe([0.38, 0.34, 0.42], [-0.30, 0.18, 0.42], [0.05, -0.1, 0], '#3b82c4', 102),
  ], CORTEX);

  out.parietal_lobe = merge([
    lobe([0.34, 0.30, 0.32], [0.28, 0.30, -0.08], [-0.05, 0.05, 0], '#1b9e8a', 111),
    lobe([0.34, 0.30, 0.32], [-0.28, 0.30, -0.08], [-0.05, -0.05, 0], '#1b9e8a', 112),
  ], CORTEX);

  out.temporal_lobe = merge([
    lobe([0.40, 0.22, 0.32], [0.42, -0.18, 0.08], [0.1, 0, -0.15], '#c07a18', 121, 2.6, 0.045),
    lobe([0.40, 0.22, 0.32], [-0.42, -0.18, 0.08], [0.1, 0, 0.15], '#c07a18', 122, 2.6, 0.045),
  ], CORTEX);

  out.occipital_lobe = merge([
    lobe([0.26, 0.24, 0.22], [0.13, 0.18, -0.46], [0, 0.1, 0], '#9333c4', 131, 2.8, 0.04),
    lobe([0.26, 0.24, 0.22], [-0.13, 0.18, -0.46], [0, -0.1, 0], '#9333c4', 132, 2.8, 0.04),
  ], CORTEX);

  // Cerebellum — tucked low and posterior, finely folded (folia, not gyri).
  out.cerebellum = merge([
    blob({
      radii: [0.42, 0.26, 0.30], center: [0, -0.42, -0.34], rot: [0.05, 0, 0],
      noiseAmp: 0.02, noiseFreq: 5.5, seed: 141, segW: 72, segH: 40,
      paint: foliaColor('#7c3aed', 141),
    }),
  ], CORTEX);

  // Brainstem — midbrain (small), pons (bulge), medulla (tapering to spinal cord).
  const stemProfile: [number, number][] = [
    [0.10, 0.34], [0.115, 0.22], [0.16, 0.12], [0.145, 0.02], [0.10, -0.10], [0.085, -0.22], [0.06, -0.34],
  ];
  out.brainstem = merge([
    finish(new THREE.LatheGeometry(stemProfile.map(([r, y]) => new THREE.Vector2(r, y)), 28), DEEP as any, { p: [0, -0.60, 0.02] }),
  ].map(g => finish(g, (p) => new THREE.Color('#dc2626').offsetHSL(0, 0.04 * (fbm(p.x * 10, p.y * 10, p.z * 10, 151, 3) - 0.5), 0.08 * (fbm(p.x * 10, p.y * 10, p.z * 10, 151, 3) - 0.5)))), DEEP);

  // Corpus callosum — a C-shaped arching band over the ventricles.
  const ccPath: V3[] = [
    [-0.30, 0.18, 0.44], [-0.10, 0.30, 0.38], [0.0, 0.33, 0.10], [0.0, 0.30, -0.18], [-0.08, 0.20, -0.42], [-0.22, 0.10, -0.50],
  ];
  out.corpus_callosum = merge([
    tube(ccPath.map(p => [-p[0], p[1], p[2]] as V3), (t) => 0.05 + 0.03 * Math.sin(t * Math.PI), { radial: 16, paint: '#efe9da' }),
  ], WHITE_MATTER);

  // Limbic system — thalamus (central relay, paired ovoids), hippocampus (curved seahorse tube),
  // amygdala (small almond), hypothalamus (tiny node below thalamus).
  const thalamus = (side: number) => sphere(0.12, '#e0652c', { p: [0.09 * side, 0.0, -0.05], s: [1.1, 0.9, 1.3] }, 28, 20);
  const hippocampus = (side: number) => tube(
    [[0.30 * side, -0.14, 0.30], [0.36 * side, -0.16, 0.05], [0.34 * side, -0.14, -0.20], [0.24 * side, -0.10, -0.34]],
    (t) => 0.05 - 0.02 * t, { radial: 14, paint: '#d9742b' }
  );
  const amygdala = (side: number) => sphere(0.055, '#c9521f', { p: [0.34 * side, -0.08, 0.34] }, 20, 16);
  const hypothalamus = sphere(0.045, '#e8803a', { p: [0, -0.10, -0.02] }, 16, 12);
  out.limbic_system = merge([
    thalamus(1), thalamus(-1), hippocampus(1), hippocampus(-1), amygdala(1), amygdala(-1), hypothalamus,
  ], DEEP);

  // Ventricular system — paired lateral ventricles (curved, crescent-like) + 3rd + 4th ventricle,
  // rendered as smooth glassy fluid-filled cavities.
  const lateralVentricle = (side: number) => tube(
    [[0.07 * side, 0.22, 0.38], [0.13 * side, 0.20, 0.10], [0.14 * side, 0.14, -0.14], [0.10 * side, 0.06, -0.34]],
    (t) => 0.035 + 0.02 * Math.sin(t * Math.PI), { radial: 10, paint: '#5ec8e8' }
  );
  const thirdVentricle = tube([[0, 0.14, 0.02], [0, -0.02, -0.04], [0, -0.14, -0.10]], 0.022, { radial: 8, paint: '#5ec8e8' });
  const fourthVentricle = sphere(0.045, '#5ec8e8', { p: [0, -0.56, -0.10], s: [1.3, 0.7, 1.0] }, 18, 12);
  out.ventricular_system = merge([
    lateralVentricle(1), lateralVentricle(-1), thirdVentricle, fourthVentricle,
  ], FLUID);

  // Cerebral arteries — Circle of Willis at the base plus the three paired cerebral arteries
  // climbing toward frontal/parietal/occipital territory. Purely schematic paths (not surface-
  // snapped — unlike the heart, the brain's lobes aren't yet built as raycast targets here).
  const acaL = tube([[0, -0.30, 0.55], [0.06, -0.05, 0.56], [0.10, 0.28, 0.48]], 0.016, { radial: 10, paint: '#d13b3b' });
  const acaR = tube([[0, -0.30, 0.55], [-0.06, -0.05, 0.56], [-0.10, 0.28, 0.48]], 0.016, { radial: 10, paint: '#d13b3b' });
  const mca = (side: number) => tube(
    [[0.12 * side, -0.32, 0.30], [0.30 * side, -0.14, 0.26], [0.46 * side, 0.08, 0.10], [0.50 * side, 0.24, -0.05]],
    0.020, { radial: 12, paint: '#d13b3b' }
  );
  const pca = (side: number) => tube(
    [[0.10 * side, -0.34, -0.10], [0.22 * side, -0.20, -0.36], [0.18 * side, 0.02, -0.52]],
    0.016, { radial: 10, paint: '#d13b3b' }
  );
  const basilar = tube([[0, -0.58, -0.14], [0, -0.42, -0.14], [0, -0.32, -0.10]], 0.020, { radial: 10, paint: '#d13b3b' });
  const willisRing = tube(
    [[0.12, -0.32, 0.30], [0, -0.30, 0.42], [-0.12, -0.32, 0.30], [-0.10, -0.34, -0.10], [0, -0.34, -0.16], [0.10, -0.34, -0.10]],
    0.013, { radial: 10, closed: true, paint: '#e04444' }
  );
  out.cerebral_arteries = merge([acaL, acaR, mca(1), mca(-1), pca(1), pca(-1), basilar, willisRing], VESSEL);

  return out;
}
