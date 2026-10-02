// src/AutonomousModelEngine/precision/ProceduralToolkit.ts
// Deterministic procedural-modelling toolkit for ADVIS "precision" educational models.
// Everything here is pure THREE.js (no React) so models can be unit-tested in Node.
//
// Conventions
//  - All builders return NON-INDEXED geometry with `position`, `normal`, `color` only,
//    so any two outputs can be merged safely.
//  - Vertex colours are the material's albedo. Physical material (roughness / metalness)
//    is chosen per component via `geometry.userData.pbr` (see PrecisionMaterial).

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type V3 = [number, number, number];
export type ColorInput = THREE.ColorRepresentation;
export type ColorFn = (p: THREE.Vector3, n: THREE.Vector3) => THREE.Color;
export type Paint = ColorInput | ColorFn;

export interface PBR {
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  /** Subsurface-ish sheen for soft tissue */
  sheen?: number;
  emissive?: ColorInput;
  emissiveIntensity?: number;
}

export interface Xform {
  p?: V3;
  /** Euler XYZ radians */
  r?: V3;
  s?: number | V3;
}

// ---------------------------------------------------------------------------
// Deterministic noise (value noise + fBm) — no Math.random anywhere.
// ---------------------------------------------------------------------------
function hash3(ix: number, iy: number, iz: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1274126177) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100003) / 100003;
}
const fade = (t: number) => t * t * (3 - 2 * t);

export function valueNoise(x: number, y: number, z: number, seed = 1): number {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
  const fx = fade(x - x0), fy = fade(y - y0), fz = fade(z - z0);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(x0 + dx, y0 + dy, z0 + dz, seed);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy),
    l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz
  );
}

export function fbm(x: number, y: number, z: number, seed = 1, oct = 4): number {
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * valueNoise(x * f, y * f, z * f, seed + i * 17);
    norm += a;
    a *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ---------------------------------------------------------------------------
// Geometry hygiene
// ---------------------------------------------------------------------------

/** Force non-indexed, position+normal only, compute normals if missing. */
function normalize(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g.index ? g.toNonIndexed() : g;
  if (out !== g) g.dispose();
  if (out.getAttribute('uv')) out.deleteAttribute('uv');
  if (out.getAttribute('uv1')) out.deleteAttribute('uv1');
  if (!out.getAttribute('normal')) out.computeVertexNormals();
  return out;
}

/** Weld coincident vertices then recompute smooth normals (fixes UV-seam creases on spheres). */
export function smooth(g: THREE.BufferGeometry, tol = 1e-4): THREE.BufferGeometry {
  const src = g.clone();
  src.deleteAttribute('normal');
  if (src.getAttribute('uv')) src.deleteAttribute('uv');
  const w = mergeVertices(src, tol);
  w.computeVertexNormals();
  return w;
}

export function applyXform(g: THREE.BufferGeometry, t: Xform = {}): THREE.BufferGeometry {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.r ?? [0, 0, 0]), 'XYZ'));
  const s = typeof t.s === 'number' ? ([t.s, t.s, t.s] as V3) : t.s ?? ([1, 1, 1] as V3);
  m.compose(new THREE.Vector3(...(t.p ?? [0, 0, 0])), q, new THREE.Vector3(...s));
  g.applyMatrix4(m);
  return g;
}

/** Paint a geometry with a flat colour or a per-vertex function. */
export function paint(g: THREE.BufferGeometry, how: Paint): THREE.BufferGeometry {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const nor = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const col = new Float32Array(pos.count * 3);
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  const flat = typeof how === 'function' ? null : new THREE.Color(how as ColorInput);
  for (let i = 0; i < pos.count; i++) {
    let c: THREE.Color;
    if (flat) c = flat;
    else {
      p.fromBufferAttribute(pos, i);
      if (nor) n.fromBufferAttribute(nor, i); else n.set(0, 1, 0);
      c = (how as ColorFn)(p, n);
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Finalise a raw THREE geometry into a toolkit-compliant one. */
export function finish(g: THREE.BufferGeometry, how: Paint = '#888888', t?: Xform): THREE.BufferGeometry {
  let out = normalize(g);
  // applyMatrix4 transforms normals with the inverse-transpose, so smooth shading survives non-uniform scale
  if (t) applyXform(out, t);
  return paint(out, how);
}

export function merge(list: THREE.BufferGeometry[], pbr?: PBR): THREE.BufferGeometry {
  if (list.length === 0) return new THREE.BufferGeometry();
  const fixed = list.map(g => {
    const n = normalize(g);
    if (!n.getAttribute('color')) paint(n, '#888888');
    return n;
  });
  const out = mergeGeometries(fixed, false);
  if (!out) throw new Error('ProceduralToolkit.merge: incompatible attributes');
  fixed.forEach(g => g.dispose());
  out.computeBoundingBox();
  out.computeBoundingSphere();
  if (pbr) out.userData.pbr = pbr;
  return out;
}

/** Translate geometry so that `pivot` becomes the origin. */
export function recenter(g: THREE.BufferGeometry, pivot: V3): THREE.BufferGeometry {
  g.translate(-pivot[0], -pivot[1], -pivot[2]);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
export function box(w: number, h: number, d: number, how: Paint, t?: Xform): THREE.BufferGeometry {
  return finish(new THREE.BoxGeometry(w, h, d), how, t);
}

export function rbox(w: number, h: number, d: number, r: number, how: Paint, t?: Xform, seg = 3): THREE.BufferGeometry {
  const rad = Math.min(r, Math.min(w, h, d) / 2 - 1e-5);
  return finish(new RoundedBoxGeometry(w, h, d, seg, rad), how, t);
}

/** Cylinder along Y (like THREE). radialSeg defaults high enough to look round. */
export function cyl(rTop: number, rBot: number, h: number, how: Paint, t?: Xform, radialSeg = 32, open = false): THREE.BufferGeometry {
  return finish(new THREE.CylinderGeometry(rTop, rBot, h, radialSeg, 1, open), how, t);
}

export function sphere(r: number, how: Paint, t?: Xform, w = 32, h = 20): THREE.BufferGeometry {
  return finish(smooth(new THREE.SphereGeometry(r, w, h)), how, t);
}

export function torus(R: number, r: number, how: Paint, t?: Xform, radial = 12, tubular = 40): THREE.BufferGeometry {
  return finish(new THREE.TorusGeometry(R, r, radial, tubular), how, t);
}

export function lathe(profile: [number, number][], how: Paint, t?: Xform, seg = 40): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return finish(smooth(new THREE.LatheGeometry(pts, seg)), how, t);
}

export function extrude(shape: THREE.Shape, depth: number, how: Paint, t?: Xform, bevel = 0, curveSegments = 24): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments,
  });
  // extrude goes along +Z from 0; centre it on Z
  g.translate(0, 0, -depth / 2);
  return finish(g, how, t);
}

// ---------------------------------------------------------------------------
// Organic surfaces
// ---------------------------------------------------------------------------
export interface BlobOpts {
  radii: V3;
  center?: V3;
  /** Euler XYZ radians applied after shaping */
  rot?: V3;
  /** Radial scale of the XZ cross-section as a function of normalised height y∈[-1,1] */
  taper?: (y: number) => number;
  /** Extra local shaping of the radius per unit direction */
  shape?: (d: THREE.Vector3) => number;
  noiseAmp?: number;
  noiseFreq?: number;
  seed?: number;
  segW?: number;
  segH?: number;
  paint?: Paint;
}

/** Organic ellipsoid with taper + deterministic fBm surface undulation. */
export function blob(o: BlobOpts): THREE.BufferGeometry {
  const base = new THREE.SphereGeometry(1, o.segW ?? 72, o.segH ?? 56);
  const pos = base.getAttribute('position') as THREE.BufferAttribute;
  const d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const tp = o.taper ? o.taper(d.y) : 1;
    let k = 1;
    if (o.noiseAmp) {
      const f = o.noiseFreq ?? 2.2;
      k += o.noiseAmp * (fbm(d.x * f + 7, d.y * f + 3, d.z * f + 11, o.seed ?? 1, 4) - 0.5) * 2;
    }
    if (o.shape) k *= o.shape(d);
    pos.setXYZ(i, d.x * o.radii[0] * tp * k, d.y * o.radii[1] * k, d.z * o.radii[2] * tp * k);
  }
  let g: THREE.BufferGeometry = smooth(base);
  if (o.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...o.rot, 'XYZ')));
  if (o.center) g.translate(...o.center);
  g.computeVertexNormals();
  return finish(g, o.paint ?? '#aa4444');
}

export interface TubeOpts {
  radial?: number;
  segments?: number;
  caps?: boolean;
  paint?: Paint;
  closed?: boolean;
  /** If true also flares the ends slightly (vessel ostia) */
  flare?: number;
}

/**
 * Variable-radius tube along a Catmull-Rom spline with rotation-minimising frames.
 * `radius` is either a constant or a function of arc parameter t∈[0,1].
 */
export function tube(points: V3[] | THREE.Vector3[], radius: number | ((t: number) => number), o: TubeOpts = {}): THREE.BufferGeometry {
  const pts = points.map(p => (p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(...p)));
  const curve = new THREE.CatmullRomCurve3(pts, !!o.closed, 'centripetal');
  const segs = o.segments ?? Math.max(24, pts.length * 14);
  const radial = o.radial ?? 20;
  const frames = curve.computeFrenetFrames(segs, !!o.closed);
  const R = typeof radius === 'number' ? () => radius : radius;
  const positions: number[] = [];
  const normals: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    curve.getPointAt(t, P);
    let r = R(t);
    if (o.flare) {
      const e = Math.min(t, 1 - t);
      r *= 1 + o.flare * (1 - smoothstep(0, 0.12, e));
    }
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      dir.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      positions.push(P.x + dir.x * r, P.y + dir.y * r, P.z + dir.z * r);
      normals.push(dir.x, dir.y, dir.z);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * row + j, b = (i + 1) * row + j, c = (i + 1) * row + j + 1, d = i * row + j + 1;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setIndex(idx);
  const parts: THREE.BufferGeometry[] = [finish(g, o.paint ?? '#cc4444')];

  if (o.caps !== false && !o.closed) {
    for (const end of [0, 1]) {
      const t = end;
      const c = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).multiplyScalar(end === 0 ? -1 : 1);
      const r = R(t) * (o.flare ? 1 + o.flare : 1);
      const cap = new THREE.CircleGeometry(r, radial);
      // orient circle (normal +Z) to `tan`
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      cap.applyQuaternion(q);
      cap.translate(c.x, c.y, c.z);
      parts.push(finish(cap, o.paint ?? '#cc4444'));
    }
  }
  return parts.length === 1 ? parts[0] : merge(parts);
}

/**
 * Project guide points onto the surface of `targets` by casting rays inward from outside,
 * along the direction away from `center`. Returns points lifted along the surface normal.
 * This is how thin structures (coronary arteries, cables) are guaranteed to hug a surface.
 */
export function snapToSurface(
  guides: V3[],
  targets: THREE.BufferGeometry[],
  center: V3,
  lift = 0.0
): THREE.Vector3[] {
  const meshes = targets.map(g => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    m.updateMatrixWorld(true);
    return m;
  });
  const rc = new THREE.Raycaster();
  const c = new THREE.Vector3(...center);
  const out: THREE.Vector3[] = [];
  for (const gp of guides) {
    const p = new THREE.Vector3(...gp);
    const dir = p.clone().sub(c).normalize();
    const origin = c.clone().addScaledVector(dir, 6);
    rc.set(origin, dir.clone().negate());
    rc.far = 12;
    const hits = rc.intersectObjects(meshes, false);
    if (hits.length) {
      const h = hits[0];
      const n = h.face ? h.face.normal.clone() : dir.clone();
      out.push(h.point.clone().addScaledVector(n, lift));
    } else {
      out.push(p);
    }
  }
  return out;
}

/** Stable helper: instanced copies of a geometry merged into one (for pin rows, capacitor arrays…). */
export function repeat(g: THREE.BufferGeometry, transforms: Xform[]): THREE.BufferGeometry {
  return merge(transforms.map(t => applyXform(g.clone(), t)));
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------
export const mixColor = (a: ColorInput, b: ColorInput, t: number) =>
  new THREE.Color(a).lerp(new THREE.Color(b), clamp01(t));

/** Adds gentle brightness / hue jitter so flat albedo never looks CG-flat. */
export function jitter(base: ColorInput, amount = 0.05, freq = 8, seed = 1): ColorFn {
  const b = new THREE.Color(base);
  return (p) => {
    const v = fbm(p.x * freq, p.y * freq, p.z * freq, seed, 3) - 0.5;
    return b.clone().offsetHSL(0.006 * v, 0.06 * v, amount * v);
  };
}
