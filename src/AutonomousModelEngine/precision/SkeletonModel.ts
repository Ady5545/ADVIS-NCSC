// src/AutonomousModelEngine/precision/SkeletonModel.ts
// Anatomically structured human skeleton (representative subset of the 206 bones,
// built with real long-bone profiles, a real spinal curve, and curved ribs).
// Frame: anterior = +Z, patient's LEFT = +X, superior = +Y. Standing pose, feet near Y=0.

import * as THREE from 'three';
import type { ComponentMetadata } from '../../SpatialLibrary';
import { V3, PBR, ColorFn, blob, lathe, tube, merge, fbm, applyXform } from './ProceduralToolkit';

const P0: V3 = [0, 0, 0];

export const SKELETON_COMPONENTS: ComponentMetadata[] = [
  {
    id: 'skull', name: 'Skull (Cranium & Mandible)',
    description: 'The cranium (8 fused bones) forms a rigid vault protecting the brain; the mandible — the only mobile skull bone — forms the lower jaw, hinged at the temporomandibular joint.',
    position: P0, size: [0.42, 0.5, 0.45], explodedOffset: [0, 0.55, 0.3], shape: 'custom', color: '#f1ede0',
    specifications: { 'Cranial bones': '8 (fused via sutures)', 'Facial bones': '14', 'Only mobile bone': 'Mandible (jaw)', 'Protects': 'Brain + major sense organs' },
    engineeringDetails: { material: 'Compact bone over cancellous bone' },
  },
  {
    id: 'vertebral_column', name: 'Vertebral Column (33 Vertebrae)',
    description: 'A real S-curve, not a straight rod: cervical lordosis (neck, curves forward) → thoracic kyphosis (upper back, curves backward) → lumbar lordosis (lower back, forward again) → fused sacrum and coccyx — this curve is what lets the spine absorb shock efficiently.',
    position: P0, size: [0.25, 1.75, 0.3], explodedOffset: [0, 0.3, -0.55], shape: 'custom', color: '#e9e4d4',
    specifications: { 'Cervical': '7 vertebrae (C1 Atlas, C2 Axis...)', 'Thoracic': '12 vertebrae (rib attachment)', 'Lumbar': '5 vertebrae (largest, weight-bearing)', 'Sacrum + Coccyx': '5 + 4 fused vertebrae', 'Curve': 'Double-S (lordosis/kyphosis/lordosis)' },
    engineeringDetails: { material: 'Vertebral bone + intervertebral fibrocartilage discs' },
  },
  {
    id: 'ribcage', name: 'Thoracic Cage (Ribs & Sternum)',
    description: '12 pairs of curved ribs sweep from the thoracic vertebrae around to the front; the top 7 pairs (true ribs) attach directly to the sternum by costal cartilage, pairs 8–10 (false ribs) attach indirectly, and pairs 11–12 (floating ribs) attach to nothing in front.',
    position: P0, size: [0.75, 0.85, 0.6], explodedOffset: [0, 0.35, 0.75], shape: 'custom', color: '#e4dfcc',
    specifications: { 'True ribs (1–7)': 'Attach directly to sternum', 'False ribs (8–10)': 'Attach via shared cartilage', 'Floating ribs (11–12)': 'No anterior attachment', 'Function': 'Protects heart & lungs, aids breathing' },
    engineeringDetails: { material: 'Curved compact bone + costal cartilage' },
  },
  {
    id: 'pelvis', name: 'Pelvic Girdle',
    description: 'A basin formed by the fused ilium, ischium and pubis on each side, joined at the sacrum behind and the pubic symphysis in front. Transfers upper-body weight to the legs and anchors major hip and core muscles.',
    position: P0, size: [0.65, 0.4, 0.5], explodedOffset: [0, -0.55, 0], shape: 'custom', color: '#ece6d6',
    specifications: { 'Fused bones per side': 'Ilium, Ischium, Pubis', 'Joins to spine at': 'Sacroiliac joint', 'Function': 'Weight transfer to legs, muscle anchor, protects pelvic organs' },
    engineeringDetails: { material: 'Dense cancellous + compact bone' },
  },
  {
    id: 'upper_limb_bones', name: 'Upper Limb Bones (Humerus, Radius, Ulna)',
    description: 'The humerus (upper arm) has a ball-shaped head for the shoulder joint; the radius and ulna (forearm) sit side by side and rotate around each other to pronate/supinate the hand.',
    position: P0, size: [0.3, 1.1, 0.3], explodedOffset: [0.95, -0.05, 0.15], shape: 'custom', color: '#f1ede0',
    specifications: { 'Humerus': 'Ball-and-socket at shoulder, hinge at elbow', 'Radius + Ulna': 'Rotate around each other (pronation/supination)', 'Joint count shown': '2 (shoulder, elbow)' },
    engineeringDetails: { material: 'Long bone: compact shaft, spongy epiphyses' },
  },
  {
    id: 'lower_limb_bones', name: 'Lower Limb Bones (Femur, Tibia, Fibula)',
    description: 'The femur is the longest, strongest bone in the body, able to bear many times body weight. The tibia (shin) carries nearly all lower-leg load; the slender fibula mainly provides muscle attachment and ankle stability.',
    position: P0, size: [0.32, 1.55, 0.32], explodedOffset: [0.3, -1.3, -0.1], shape: 'custom', color: '#f1ede0',
    specifications: { 'Femur': 'Longest & strongest bone in the body', 'Tibia': 'Primary weight-bearing lower-leg bone', 'Fibula': 'Slender, muscle attachment + ankle stability', 'Joint count shown': '2 (hip/knee articulation, knee/ankle)' },
    engineeringDetails: { material: 'Long bone: compact shaft, spongy epiphyses' },
  },
];

const BONE: PBR = { roughness: 0.6, metalness: 0.0, clearcoat: 0.2, clearcoatRoughness: 0.55, sheen: 0.15 };
const CARTILAGE: PBR = { roughness: 0.35, metalness: 0.0, clearcoat: 0.55, clearcoatRoughness: 0.3 };

function boneColor(base: string, seed: number): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const v = fbm(p.x * 9, p.y * 9, p.z * 9, seed, 4);
    return b.clone().offsetHSL(0.004 * (v - 0.5), 0.03 * (v - 0.5), 0.07 * (v - 0.5));
  };
}

/** A real long-bone silhouette: bulbous proximal epiphysis, narrow shaft, bulbous distal epiphysis. */
function longBoneProfile(len: number, headR: number, shaftR: number, footR: number): [number, number][] {
  return [
    [0, 0], [headR * 0.9, len * 0.02], [headR, len * 0.07], [headR * 0.75, len * 0.14],
    [shaftR * 1.15, len * 0.22], [shaftR, len * 0.5], [shaftR * 1.1, len * 0.78],
    [footR * 0.8, len * 0.86], [footR, len * 0.93], [footR * 0.85, len * 0.98], [0, len],
  ];
}

function longBone(center: V3, rot: V3, len: number, headR: number, shaftR: number, footR: number, seed: number, color: string): THREE.BufferGeometry {
  return lathe(longBoneProfile(len, headR, shaftR, footR), boneColor(color, seed), { p: center, r: rot }, 20);
}

export function buildSkeletonGeometries(): Record<string, THREE.BufferGeometry> {
  const out: Record<string, THREE.BufferGeometry> = {};

  // ---- Skull: cranium blob (slightly flattened at the base, domed at top/back) + mandible -----
  const cranium = blob({
    radii: [0.17, 0.19, 0.20], center: [0, 1.72, 0.02], rot: [0, 0, 0],
    taper: (y) => 1 - 0.3 * Math.max(0, -y), noiseAmp: 0.012, noiseFreq: 3, seed: 401, segW: 56, segH: 44,
    paint: boneColor('#f1ede0', 401),
  });
  const mandibleProfile: V3[] = [[-0.11, 1.52, 0.10], [-0.09, 1.49, 0.14], [0, 1.47, 0.16], [0.09, 1.49, 0.14], [0.11, 1.52, 0.10]];
  const mandible = tube(mandibleProfile, 0.025, { radial: 10, paint: boneColor('#f1ede0', 402) });
  out.skull = merge([cranium, mandible], BONE);

  // ---- Vertebral column: real S-curve spline, a stacked small box-ish vertebra at each level ---
  const spinePts: V3[] = [
    [0, 0.98, -0.02], [0, 1.10, -0.04], [0, 1.22, -0.05], [0, 1.34, -0.03], // lumbar lordosis (forward)
    [0, 1.46, 0.01], [0, 1.58, 0.05], [0, 1.68, 0.06], [0, 1.76, 0.03],     // thoracic kyphosis (back)
    [0, 1.82, -0.02], [0, 1.88, -0.06], [0, 1.94, -0.04],                   // cervical lordosis (forward)
  ];
  const spineCurve = new THREE.CatmullRomCurve3(spinePts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const vertCount = 24; // visually representative of the 24 free vertebrae (C1-L5)
  const vertebrae: THREE.BufferGeometry[] = [];
  for (let i = 0; i < vertCount; i++) {
    const t = i / (vertCount - 1);
    const c = spineCurve.getPointAt(t);
    const isLumbar = t < 0.3, isCervical = t > 0.82;
    const rx = isLumbar ? 0.075 : isCervical ? 0.04 : 0.055;
    const ry = 0.028;
    const rz = isLumbar ? 0.065 : isCervical ? 0.04 : 0.05;
    vertebrae.push(blob({ radii: [rx, ry, rz], center: c.toArray() as V3, noiseAmp: 0.04, noiseFreq: 6, seed: 410 + i, segW: 20, segH: 16, paint: boneColor('#e9e4d4', 410 + i) }));
  }
  // Sacrum + coccyx as one fused tapering lathed mass below the lumbar end.
  const sacrum = lathe([[0, 0], [0.07, -0.02], [0.065, -0.1], [0.045, -0.18], [0.015, -0.24], [0, -0.26]], boneColor('#e4ddc8', 450), { p: [0, 0.98, -0.04] });
  out.vertebral_column = merge([...vertebrae, sacrum], BONE);

  // ---- Ribcage: sternum (flat lathed plate) + 12 pairs of curved ribs sweeping from spine ------
  const sternum = lathe([[0, 0.20], [0.035, 0.17], [0.045, 0.02], [0.03, -0.1], [0.018, -0.16], [0, -0.18]], boneColor('#e4dfcc', 460), { p: [0, 1.42, 0.22] });
  const ribArc = (level: number, side: number, lengthScale: number, floating: boolean) => {
    const yBase = 1.78 - level * 0.055;
    const backZ = -0.03;
    const pts: V3[] = [
      [0.02 * side, yBase, backZ],
      [0.18 * side * lengthScale, yBase - 0.01, backZ + 0.18 * lengthScale],
      [0.30 * side * lengthScale, yBase - 0.04, backZ + 0.34 * lengthScale],
      floating
        ? [0.34 * side * lengthScale, yBase - 0.07, backZ + 0.40 * lengthScale]
        : [0.26 * side * lengthScale, yBase - 0.06, 0.22],
    ];
    return tube(pts, 0.012, { radial: 8, segments: 24, paint: boneColor('#e4dfcc', 470 + level * 2 + (side > 0 ? 0 : 1)) });
  };
  const ribs: THREE.BufferGeometry[] = [];
  for (let level = 0; level < 12; level++) {
    const floating = level >= 10; // ribs 11-12
    const lenScale = 0.55 + Math.sin((level / 11) * Math.PI) * 0.55; // shorter at top & bottom, widest mid-chest
    ribs.push(ribArc(level, 1, lenScale, floating));
    ribs.push(ribArc(level, -1, lenScale, floating));
  }
  out.ribcage = merge([sternum, ...ribs], BONE);

  // ---- Pelvis: paired ilium wings (blob) + pubic arch (tube bridging front) ----------------------
  const iliumWing = (side: number) => blob({
    radii: [0.14, 0.17, 0.13], center: [0.16 * side, 0.92, -0.01], rot: [0.1, 0, 0.35 * side],
    taper: (y) => 1 + 0.25 * Math.max(0, y), noiseAmp: 0.02, noiseFreq: 3.5, seed: 480 + side, segW: 36, segH: 28,
    paint: boneColor('#ece6d6', 480 + side),
  });
  const ischiumPubis = (side: number) => tube(
    [[0.14 * side, 0.92, -0.01], [0.10 * side, 0.80, 0.08], [0.04 * side, 0.76, 0.14], [0, 0.78, 0.15]],
    0.035, { radial: 10, paint: boneColor('#ece6d6', 485 + side) }
  );
  out.pelvis = merge([iliumWing(1), iliumWing(-1), ischiumPubis(1), ischiumPubis(-1)], BONE);

  // ---- Upper limb: humerus + radius + ulna, shown on the right side (mirrors to left in UI) -----
  const humerus = longBone([0.42, 1.44, 0], [0, 0, Math.PI], 0.62, 0.052, 0.022, 0.044, 501, '#f1ede0');
  const radius = longBone([0.40, 0.80, 0.02], [0, 0, Math.PI], 0.5, 0.022, 0.014, 0.026, 502, '#f1ede0');
  const ulna = longBone([0.44, 0.80, -0.02], [0, 0, Math.PI], 0.52, 0.026, 0.015, 0.02, 503, '#f1ede0');
  out.upper_limb_bones = merge([humerus, radius, ulna], BONE);

  // ---- Lower limb: femur (hip->knee) + tibia/fibula (knee->ankle), shown on the right side ------
  // Hip joint ~0.88, knee ~0.42, ankle ~0.02 -- proportioned so the leg actually reaches the floor.
  const femur = longBone([0.18, 0.88, 0], [0, 0, Math.PI], 0.46, 0.06, 0.026, 0.055, 511, '#f1ede0');
  const tibia = longBone([0.18, 0.42, 0.01], [0, 0, Math.PI], 0.40, 0.045, 0.022, 0.032, 512, '#f1ede0');
  const fibula = longBone([0.24, 0.42, -0.02], [0, 0, Math.PI], 0.38, 0.016, 0.011, 0.018, 513, '#f1ede0');
  out.lower_limb_bones = merge([femur, tibia, fibula], BONE);

  return out;
}
