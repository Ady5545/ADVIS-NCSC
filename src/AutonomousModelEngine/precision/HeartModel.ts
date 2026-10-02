// src/AutonomousModelEngine/precision/HeartModel.ts
// Anatomically structured human heart.
//
// Frame: anterior = +Z, patient's LEFT = +X (viewer's right when facing the front), superior = +Y.
// All parts are authored in one shared heart space with the pivot at the origin, so the
// cardiac pulsation (which scales each part about its pivot) stays coherent and the
// coronary arteries never detach from the myocardium.
//
// Colour code (educational): red = oxygenated, blue = deoxygenated, gold = conduction tissue,
// pale yellow = epicardial fat.

import * as THREE from 'three';
import type { ComponentMetadata } from '../../SpatialLibrary';
import {
  V3, PBR, ColorFn, blob, tube, torus, sphere, merge, snapToSurface, applyXform,
  fbm, smoothstep, clamp01, finish,
} from './ProceduralToolkit';

// ---------------------------------------------------------------------------
// Static, cheap metadata (safe to import at app start)
// ---------------------------------------------------------------------------
const P0: V3 = [0, 0, 0];

export const HEART_COMPONENTS: ComponentMetadata[] = [
  {
    id: 'left_ventricle', name: 'Left Ventricle',
    description: 'The heart\'s main pump. Its wall is ~3x thicker than the right ventricle because it must drive blood through the whole systemic circulation at ~120 mmHg.',
    position: P0, size: [0.9, 1.4, 0.9], explodedOffset: [0.85, -0.55, 0.15], shape: 'custom', color: '#b02a3c',
    specifications: { 'Wall thickness': '8–12 mm', 'Peak pressure': '~120 mmHg', 'End-diastolic volume': '~120 mL', 'Stroke volume': '~70 mL', 'Ejection fraction': '55–70 %' },
    engineeringDetails: { material: 'Myocardium (cardiac muscle)' },
  },
  {
    id: 'right_ventricle', name: 'Right Ventricle',
    description: 'Wraps around the front of the septum and pumps deoxygenated blood to the lungs through the pulmonary valve at low pressure.',
    position: P0, size: [0.75, 1.2, 0.65], explodedOffset: [-0.55, -0.45, 0.85], shape: 'custom', color: '#5b6fb5',
    specifications: { 'Wall thickness': '3–5 mm', 'Peak pressure': '15–30 mmHg', 'Outflow valve': 'Pulmonary (semilunar)', 'Inflow valve': 'Tricuspid' },
    engineeringDetails: { material: 'Myocardium (cardiac muscle)' },
  },
  {
    id: 'left_atrium', name: 'Left Atrium',
    description: 'Sits at the back of the heart and receives oxygenated blood from four pulmonary veins. Its small ear-shaped pouch is the left atrial appendage.',
    position: P0, size: [0.95, 0.55, 0.6], explodedOffset: [0.45, 0.55, -0.85], shape: 'custom', color: '#c2384a',
    specifications: { 'Inflow': '4 pulmonary veins', 'Outflow valve': 'Mitral (bicuspid)', 'Wall thickness': '2–3 mm', 'Role': 'Reservoir + booster pump' },
    engineeringDetails: { material: 'Atrial myocardium' },
  },
  {
    id: 'right_atrium', name: 'Right Atrium',
    description: 'Receives deoxygenated blood from the superior and inferior vena cavae and contains the sinoatrial node, the heart\'s natural pacemaker.',
    position: P0, size: [0.65, 0.85, 0.6], explodedOffset: [-0.95, 0.25, 0.1], shape: 'custom', color: '#6a7fc0',
    specifications: { 'Inflow': 'SVC, IVC, coronary sinus', 'Outflow valve': 'Tricuspid (3 cusps)', 'Contains': 'SA node, AV node', 'Wall thickness': '2–3 mm' },
    engineeringDetails: { material: 'Atrial myocardium' },
  },
  {
    id: 'aorta', name: 'Aorta (Ascending Arch & Descending)',
    description: 'The body\'s largest artery. The ascending aorta gives off the coronary arteries; the arch gives off the brachiocephalic, left common carotid and left subclavian arteries.',
    position: P0, size: [1.0, 1.9, 0.75], explodedOffset: [0.35, 0.75, -0.25], shape: 'custom', color: '#d13b3b',
    specifications: { 'Ascending diameter': '2.5–3.5 cm', 'Branches from arch': '3', 'Valve': 'Aortic (3 cusps)', 'Carries': 'Oxygenated blood' },
    engineeringDetails: { material: 'Elastic artery (elastin + collagen)' },
  },
  {
    id: 'pulmonary_artery', name: 'Pulmonary Trunk & Arteries',
    description: 'The only arteries in the body that carry deoxygenated blood. The trunk splits into right and left pulmonary arteries that pass behind the aorta to the lungs.',
    position: P0, size: [1.5, 0.6, 0.7], explodedOffset: [0.05, 0.95, 0.55], shape: 'custom', color: '#3f5fc0',
    specifications: { 'Trunk length': '~5 cm', 'Trunk diameter': '2.5–3 cm', 'Mean pressure': '~15 mmHg', 'Carries': 'Deoxygenated blood' },
    engineeringDetails: { material: 'Elastic artery' },
  },
  {
    id: 'vena_cava', name: 'Superior & Inferior Vena Cava',
    description: 'The two great veins returning all systemic venous blood to the right atrium: the SVC from the upper body, the IVC from the lower body.',
    position: P0, size: [0.3, 2.0, 0.3], explodedOffset: [-0.85, 0.15, -0.15], shape: 'custom', color: '#3b56b0',
    specifications: { 'SVC diameter': '~2 cm', 'SVC length': '~7 cm', 'IVC diameter': '~2.3 cm', 'Carries': 'Deoxygenated blood' },
    engineeringDetails: { material: 'Venous wall (thin, low pressure)' },
  },
  {
    id: 'pulmonary_veins', name: 'Pulmonary Veins (x4)',
    description: 'The only veins in the body that carry oxygenated blood. Two from each lung drain into the left atrium.',
    position: P0, size: [1.8, 0.5, 0.3], explodedOffset: [0, 0.2, -1.1], shape: 'custom', color: '#d24a4a',
    specifications: { 'Count': '4 (RSPV, RIPV, LSPV, LIPV)', 'Carries': 'Oxygenated blood', 'Drains into': 'Left atrium' },
    engineeringDetails: { material: 'Venous wall' },
  },
  {
    id: 'coronary_arteries', name: 'Coronary Arteries',
    description: 'The heart\'s own blood supply. LAD runs in the anterior interventricular groove, circumflex wraps the left AV groove, RCA runs in the right AV groove. Most flow occurs in diastole.',
    position: P0, size: [1.4, 1.4, 0.9], explodedOffset: [0, 0.1, 0.6], shape: 'custom', color: '#e8453c',
    specifications: { 'Main branches': 'LAD, LCx, RCA', 'Flow at rest': '~250 mL/min (~5 % of cardiac output)', 'LAD diameter': '3–4 mm', 'Fills mainly during': 'Diastole' },
    engineeringDetails: { material: 'Muscular artery' },
  },
  {
    id: 'heart_valves', name: 'Cardiac Valves',
    description: 'Four one-way valves keep blood moving forward: tricuspid (3 cusps) and mitral (2 cusps) between atria and ventricles; pulmonary and aortic semilunar valves at the outflows.',
    position: P0, size: [1.0, 0.6, 0.7], explodedOffset: [0, 0.35, 0.3], shape: 'custom', color: '#e9d8c4',
    specifications: { 'Atrioventricular': 'Tricuspid, Mitral', 'Semilunar': 'Pulmonary, Aortic', 'Heart sounds': 'S1 (AV close) · S2 (semilunar close)', 'Opens/closes': '~100,000 times per day' },
    engineeringDetails: { material: 'Fibrous connective tissue + endocardium' },
  },
  {
    id: 'conduction_system', name: 'Cardiac Conduction System',
    description: 'Specialised muscle that starts and spreads each beat: SA node → atria → AV node (0.1 s delay) → bundle of His → left/right bundle branches → Purkinje fibres.',
    position: P0, size: [1.0, 1.4, 0.4], explodedOffset: [0.1, -0.1, 0.05], shape: 'custom', color: '#f5c542',
    specifications: { 'SA node rate': '60–100 bpm', 'AV node rate (backup)': '40–60 bpm', 'Purkinje rate (backup)': '20–40 bpm', 'AV nodal delay': '~0.1 s', 'QRS duration': '< 0.12 s' },
    engineeringDetails: { material: 'Specialised cardiomyocytes' },
  },
];

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------
const TISSUE: PBR = { roughness: 0.52, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.38, sheen: 0.4 };
const VESSEL: PBR = { roughness: 0.42, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.2 };
const VALVE: PBR = { roughness: 0.35, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.2 };
const NERVE: PBR = { roughness: 0.3, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.2, emissive: '#f5b820', emissiveIntensity: 0.55 };

const FAT = new THREE.Color('#e3c777');

/** Myocardium colour with epicardial fat over the base and along grooves. */
function myocardium(base: string, seed: number, fatAmount = 1): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const v = fbm(p.x * 7, p.y * 7, p.z * 7, seed, 4);
    const c = b.clone().offsetHSL(0.008 * (v - 0.5), 0.10 * (v - 0.5), 0.10 * (v - 0.5));
    const fatMask = smoothstep(0.02, 0.42, p.y) * smoothstep(0.42, 0.66, fbm(p.x * 4 + 3, p.y * 4, p.z * 4, seed + 9, 3));
    return c.lerp(FAT, clamp01(fatMask * 0.75 * fatAmount));
  };
}

function vesselColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const v = fbm(p.x * 10, p.y * 10, p.z * 10, seed, 3);
    return b.clone().offsetHSL(0, 0.05 * (v - 0.5), 0.06 * (v - 0.5));
  };
}

const apexTaper = (y: number) => 1 - 0.62 * smoothstep(0.15, -0.95, y);

// ---------------------------------------------------------------------------
// Lazy geometry builder
// ---------------------------------------------------------------------------
export function buildHeartGeometries(): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};

  // ---- Ventricles ----------------------------------------------------------
  const lvBody = blob({
    radii: [0.44, 0.72, 0.42], center: [0.30, -0.30, -0.08], rot: [0.0, 0.0, 0.42],
    taper: apexTaper, noiseAmp: 0.018, noiseFreq: 2.4, seed: 3, paint: myocardium('#b02a3c', 3),
  });
  const rvBody = blob({
    radii: [0.37, 0.62, 0.30], center: [-0.17, -0.20, 0.25], rot: [0.0, 0.0, 0.30],
    taper: apexTaper, noiseAmp: 0.02, noiseFreq: 2.6, seed: 5, paint: myocardium('#5b6fb5', 5),
  });

  // ---- Atria ---------------------------------------------------------------
  const raBody = blob({
    radii: [0.31, 0.42, 0.31], center: [-0.57, 0.16, 0.0], rot: [0, 0, -0.08],
    noiseAmp: 0.03, noiseFreq: 2.5, seed: 7, paint: myocardium('#6a7fc0', 7, 0.5),
  });
  const raAuricle = blob({
    radii: [0.17, 0.19, 0.11], center: [-0.36, 0.50, 0.28], rot: [0.2, 0.3, 0.8],
    noiseAmp: 0.05, noiseFreq: 4.5, seed: 8, paint: myocardium('#6a7fc0', 8, 0.5),
    segW: 40, segH: 30,
  });
  const laBody = blob({
    radii: [0.50, 0.27, 0.30], center: [0.22, 0.40, -0.36], rot: [0, 0, 0.05],
    noiseAmp: 0.025, noiseFreq: 2.5, seed: 11, paint: myocardium('#c2384a', 11, 0.5),
  });
  const laAuricle = blob({
    radii: [0.13, 0.19, 0.10], center: [0.55, 0.38, 0.13], rot: [0.3, 0.0, -0.6],
    noiseAmp: 0.06, noiseFreq: 4.0, seed: 12, paint: myocardium('#c2384a', 12, 0.5),
    segW: 40, segH: 30,
  });

  out.left_ventricle = merge([lvBody], TISSUE);
  out.right_ventricle = merge([rvBody], TISSUE);
  out.right_atrium = merge([raBody, raAuricle], TISSUE);
  out.left_atrium = merge([laBody, laAuricle], TISSUE);

  // ---- Aorta ---------------------------------------------------------------
  const aortaPath: V3[] = [
    [-0.04, 0.26, 0.0], [-0.05, 0.58, -0.02], [-0.02, 0.92, -0.05], [0.20, 1.14, -0.14],
    [0.50, 1.06, -0.30], [0.74, 0.80, -0.46], [0.84, 0.38, -0.56], [0.86, -0.10, -0.60], [0.86, -0.60, -0.62],
  ];
  const aortaR = (t: number) => 0.135 - 0.03 * smoothstep(0, 0.45, t) - 0.008 * smoothstep(0.45, 1, t);
  const aortaMain = tube(aortaPath, aortaR, { radial: 28, segments: 140, paint: vesselColor('#d13b3b', 21) });
  const sinuses = sphere(0.165, vesselColor('#d84444', 22), { p: [-0.04, 0.30, 0.0], s: [1, 0.9, 1] }, 40, 28);
  const brachio = tube([[0.15, 1.10, -0.07], [0.10, 1.26, -0.07], [0.02, 1.42, -0.08]], 0.056, { paint: vesselColor('#cf3a3a', 23) });
  const carotid = tube([[0.27, 1.12, -0.13], [0.28, 1.28, -0.14], [0.30, 1.44, -0.15]], 0.046, { paint: vesselColor('#cf3a3a', 24) });
  const subclav = tube([[0.40, 1.09, -0.22], [0.50, 1.24, -0.22], [0.68, 1.36, -0.22]], 0.046, { paint: vesselColor('#cf3a3a', 25) });
  out.aorta = merge([aortaMain, sinuses, brachio, carotid, subclav], VESSEL);

  // ---- Pulmonary trunk & arteries -----------------------------------------
  const trunk = tube([[0.04, 0.34, 0.30], [0.14, 0.60, 0.22], [0.22, 0.80, 0.08], [0.22, 0.90, -0.08]], (t) => 0.125 - 0.01 * t, { radial: 28, paint: vesselColor('#3f5fc0', 31), flare: 0.25 });
  const rpa = tube([[0.22, 0.90, -0.08], [0.08, 0.86, -0.22], [-0.25, 0.82, -0.30], [-0.70, 0.76, -0.34]], (t) => 0.10 - 0.03 * t, { paint: vesselColor('#3f5fc0', 32) });
  const lpa = tube([[0.22, 0.90, -0.08], [0.44, 0.88, -0.20], [0.76, 0.76, -0.32]], (t) => 0.10 - 0.025 * t, { paint: vesselColor('#3f5fc0', 33) });
  out.pulmonary_artery = merge([trunk, rpa, lpa], VESSEL);

  // ---- Vena cavae ----------------------------------------------------------
  const svc = tube([[-0.50, 1.18, -0.05], [-0.50, 0.80, -0.04], [-0.50, 0.44, 0.0]], 0.088, { radial: 24, paint: vesselColor('#3b56b0', 41), flare: 0.2 });
  const ivc = tube([[-0.47, -0.18, -0.05], [-0.50, -0.55, -0.08], [-0.52, -0.90, -0.10]], 0.105, { radial: 24, paint: vesselColor('#334ea8', 42), flare: 0.15 });
  out.vena_cava = merge([svc, ivc], VESSEL);

  // ---- Pulmonary veins -----------------------------------------------------
  const pv = (pts: V3[], seed: number) => tube(pts, 0.052, { paint: vesselColor('#d24a4a', seed), flare: 0.3 });
  out.pulmonary_veins = merge([
    pv([[-0.85, 0.66, -0.44], [-0.45, 0.54, -0.42], [-0.12, 0.46, -0.38]], 51),
    pv([[-0.90, 0.32, -0.52], [-0.48, 0.32, -0.44], [-0.12, 0.36, -0.36]], 52),
    pv([[1.05, 0.64, -0.30], [0.75, 0.54, -0.30], [0.52, 0.46, -0.32]], 53),
    pv([[1.08, 0.30, -0.44], [0.78, 0.34, -0.40], [0.52, 0.34, -0.35]], 54),
  ], VESSEL);

  // ---- Coronary arteries (snapped onto the real myocardium surface) --------
  const hits = [lvBody, rvBody, raBody, laBody];
  const centre: V3 = [0.02, -0.05, -0.05];
  const LAD = snapToSurface([[0.14, 0.32, 0.42], [0.15, 0.05, 0.52], [0.18, -0.25, 0.50], [0.25, -0.58, 0.40], [0.33, -0.88, 0.26]], hits, centre, 0.012);
  const RCA = snapToSurface([[-0.14, 0.32, 0.40], [-0.32, 0.24, 0.46], [-0.46, 0.02, 0.42], [-0.62, -0.20, 0.30], [-0.64, -0.42, 0.06], [-0.52, -0.55, -0.20], [-0.30, -0.60, -0.36]], hits, centre, 0.012);
  const LCX = snapToSurface([[0.30, 0.40, 0.24], [0.52, 0.30, 0.10], [0.70, 0.12, -0.06], [0.74, -0.10, -0.26], [0.62, -0.30, -0.42]], hits, centre, 0.012);
  const coronaryPaint = vesselColor('#ee4a3f', 61);
  const lmain = tube([[-0.04, 0.34, 0.14], [0.12, 0.38, 0.28], LAD[0].toArray() as V3], 0.03, { paint: coronaryPaint });
  const rmain = tube([[-0.04, 0.30, 0.16], [-0.10, 0.34, 0.30], RCA[0].toArray() as V3], 0.028, { paint: coronaryPaint });
  const cor = (pts: THREE.Vector3[], r0: number, r1: number) =>
    tube(pts, (t) => r0 + (r1 - r0) * t, { radial: 12, segments: 90, paint: coronaryPaint });
  const diag = snapToSurface([[0.20, 0.0, 0.52], [0.36, -0.06, 0.48], [0.50, -0.14, 0.38]], hits, centre, 0.010);
  out.coronary_arteries = merge([
    lmain, rmain, cor(LAD, 0.026, 0.012), cor(RCA, 0.026, 0.012), cor(LCX, 0.024, 0.012), cor(diag, 0.014, 0.008),
  ], { ...VESSEL, roughness: 0.32 });

  // ---- Valves --------------------------------------------------------------
  out.heart_valves = buildValves();

  // ---- Conduction system ---------------------------------------------------
  out.conduction_system = buildConduction();

  return out;
}

/** Annulus ring + cusps oriented along `normal`. */
function valve(center: V3, normal: V3, R: number, cusps: 2 | 3, seed: number): THREE.BufferGeometry {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...normal).normalize());
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  const xf = { p: center, r: [e.x, e.y, e.z] as V3 };
  const parts: THREE.BufferGeometry[] = [];
  parts.push(torus(R, R * 0.13, '#efe3cf', { r: [Math.PI / 2, 0, 0] }, 10, 44));
  const span = (Math.PI * 2) / cusps;
  for (let i = 0; i < cusps; i++) {
    // each cusp: shallow spherical shell hanging below the annulus, gap between cusps = commissure
    const g = new THREE.SphereGeometry(R * 1.02, 18, 10, i * span + 0.09, span - 0.18, 0.0, Math.PI * 0.42);
    const cg = finish(g, (p) => {
      const t = fbm(p.x * 9, p.y * 9, p.z * 9, seed + i, 3);
      return new THREE.Color('#e4cfb2').lerp(new THREE.Color('#f3e6d2'), t);
    }, { s: [1, 0.55, 1], p: [0, -R * 0.15, 0] });
    parts.push(cg);
  }
  return applyXform(merge(parts), xf);
}

function buildValves(): THREE.BufferGeometry {
  const g = merge([
    valve([-0.04, 0.30, 0.0], [0.05, 1, -0.02], 0.13, 3, 71),   // aortic
    valve([0.05, 0.36, 0.30], [0.35, 0.9, 0.2], 0.125, 3, 72),  // pulmonary
    valve([-0.30, 0.02, 0.14], [0.2, 0.6, 0.9], 0.17, 3, 73),   // tricuspid
    valve([0.20, 0.06, -0.10], [0.1, 0.8, 0.5], 0.16, 2, 74),   // mitral
  ], VALVE);
  g.userData.doubleSided = true;
  return g;
}

function buildConduction(): THREE.BufferGeometry {
  const gold = '#f7c948';
  const hot = '#ffe27a';
  const parts: THREE.BufferGeometry[] = [];
  // SA node (crescent at SVC–RA junction) and AV node
  parts.push(sphere(0.05, hot, { p: [-0.44, 0.56, 0.06], s: [1.5, 0.7, 0.7], r: [0, 0, -0.7] }, 24, 16));
  parts.push(sphere(0.045, hot, { p: [-0.06, 0.06, 0.0], s: [1.3, 0.8, 1] }, 24, 16));
  // Internodal pathway SA -> AV
  parts.push(tube([[-0.44, 0.56, 0.06], [-0.55, 0.32, 0.02], [-0.42, 0.10, 0.02], [-0.10, 0.07, 0.0]], 0.011, { radial: 10, paint: gold }));
  // Bachmann's bundle toward LA
  parts.push(tube([[-0.44, 0.56, 0.06], [-0.10, 0.62, -0.06], [0.20, 0.56, -0.18]], 0.010, { radial: 10, paint: gold }));
  // Bundle of His
  parts.push(tube([[-0.06, 0.06, 0.0], [0.0, 0.0, 0.0], [0.05, -0.08, 0.02]], 0.016, { radial: 12, paint: hot }));
  // Left bundle branch down the septum to apex, then Purkinje fan
  const lbb: V3[] = [[0.05, -0.08, 0.02], [0.10, -0.36, 0.05], [0.18, -0.68, 0.08], [0.33, -0.98, 0.04]];
  parts.push(tube(lbb, 0.013, { radial: 10, paint: gold }));
  const rbb: V3[] = [[0.04, -0.08, 0.05], [0.02, -0.34, 0.20], [-0.02, -0.62, 0.30], [0.10, -0.90, 0.24]];
  parts.push(tube(rbb, 0.012, { radial: 10, paint: gold }));
  // Purkinje network: fine branches off the apical ends
  const fan = (from: V3, dirs: V3[]) => dirs.forEach((d, i) =>
    parts.push(tube([from, [from[0] + d[0] * 0.5, from[1] + d[1] * 0.5, from[2] + d[2] * 0.5], [from[0] + d[0], from[1] + d[1], from[2] + d[2]]], 0.006, { radial: 8, segments: 24, paint: hot })));
  fan([0.18, -0.68, 0.08], [[0.22, 0.12, 0.10], [0.25, -0.08, -0.05], [0.10, 0.22, 0.14], [0.32, 0.22, -0.02]]);
  fan([0.33, -0.98, 0.04], [[0.22, 0.26, 0.05], [-0.10, 0.28, 0.12], [0.06, 0.34, -0.08]]);
  fan([-0.02, -0.62, 0.30], [[-0.20, 0.14, 0.02], [0.20, 0.10, 0.06], [0.0, 0.26, 0.04]]);
  fan([0.10, -0.90, 0.24], [[-0.14, 0.24, 0.02], [0.12, 0.26, 0.03]]);
  return merge(parts, NERVE);
}
