// src/generators/V12UltimateCutaway.tsx
// A.D.V.I.S. 60° V12 — display-grade sectioned engine.
//
// Layout (model space):
//   +Z = front of engine (accessory drive), -Z = flywheel end, crank axis = Z.
//   Each bank is built in its OWN local frame (x across the bank, y along the bore
//   axis, z along the engine) and the bank group is tilted exactly once by +/-30°.
//   Everything inside a bank (liners, pistons, rods, heads, covers) therefore stays
//   perfectly coaxial with its bore.
//
// Kinematics are tied to the app telemetry bus (V12_CYLINDER_OFFSETS / firing order
// 1-12-4-9-2-11-6-7-3-10-5-8): cylinder N reaches firing-TDC when the crank angle
// equals its bus offset, and left/right cylinders of one throw share a crank pin.

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  BANK_ANGLE,
  CRANK_RADIUS,
  CYLINDER_Z,
  EngineMaterial,
  ROD_LENGTH,
} from './MechanicalGenerator';

export interface V12UltimateProps {
  isHovered?: boolean;
  isSelected?: boolean;
  xrayEnabled?: boolean;
  blueprintEnabled?: boolean;
  v12Rpm?: number;
  v12Direction?: number;
  focusedCylinder?: number;
  crankAngleRef?: React.MutableRefObject<number> | null;
  sysTimeRef?: React.MutableRefObject<number> | null;
}

type S = V12UltimateProps;
type Side = 'left' | 'right';
type V3 = [number, number, number];

// ---------------------------------------------------------------------------
// Geometry constants
// ---------------------------------------------------------------------------
const ZS = CYLINDER_Z; // 6 stations, 0.5 pitch
const R = CRANK_RADIUS; // 0.22
const LROD = ROD_LENGTH; // 0.70
const STAGGER = 0.05; // left bank -z, right bank +z : side-by-side rods on one pin
const MAIN_Z = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];

const BORE_R = 0.205; // liner inner radius
const BARREL_R = 0.245; // liner outer radius
const BARREL_Y0 = 0.3;
const DECK_Y = 1.04; // top of barrels
const HEAD_Y0 = 1.09;
const HEAD_H = 0.34;
const HEAD_W = 0.68;
const COVER_H = 0.22;
const HEAD_LEN = 3.14;

const DEG = Math.PI / 180;
// Left-bank firing offsets from the telemetry bus (mod 360): cyl 1..6
const OFF_L = [0, 240, 120, 120, 240, 0].map((d) => d * DEG);
// Crank-pin phase for each throw (crank rotates by -a, so phi = bankAngle + offset)
const THROW_PHASE = OFF_L.map((o) => BANK_ANGLE + o);

const toWorld = (beta: number, x: number, y: number): [number, number] => [
  x * Math.cos(beta) - y * Math.sin(beta),
  x * Math.sin(beta) + y * Math.cos(beta),
];

const C = {
  alu: '#9aa3ab',
  aluLight: '#b9c1c7',
  head: '#5b646c',
  dark: '#2a3036',
  carbon: '#1c2025',
  iron: '#7a828a',
  steel: '#b4bcc3',
  chrome: '#eef2f5',
  red: '#d4172e',
  rubber: '#16191d',
  brass: '#c49a45',
  bronze: '#b79a6c',
  pan: '#68717a',
};

// ---------------------------------------------------------------------------
// Materials: lightweight PBR for the solid view, EngineMaterial for X-ray/blueprint
// ---------------------------------------------------------------------------
type Kind = 'alu' | 'dark' | 'steel' | 'chrome' | 'red' | 'rubber' | 'brass' | 'exhaust' | 'carbon' | 'iron';

const PBR: Record<Kind, { m: number; r: number; e: number }> = {
  alu: { m: 0.55, r: 0.42, e: 1.6 },
  dark: { m: 0.5, r: 0.5, e: 1.4 },
  steel: { m: 0.85, r: 0.3, e: 1.7 },
  chrome: { m: 0.95, r: 0.12, e: 2.0 },
  red: { m: 0.25, r: 0.38, e: 1.2 },
  rubber: { m: 0.0, r: 0.88, e: 0.4 },
  brass: { m: 0.85, r: 0.3, e: 1.6 },
  exhaust: { m: 0.8, r: 0.32, e: 1.7 },
  carbon: { m: 0.35, r: 0.32, e: 1.4 },
  iron: { m: 0.7, r: 0.5, e: 1.4 },
};

const XRAY_TYPE: Record<Kind, React.ComponentProps<typeof EngineMaterial>['materialType']> = {
  alu: 'CAST_ALUMINUM',
  dark: 'CAST_ALUMINUM',
  steel: 'FORGED_STEEL',
  chrome: 'CHROME',
  red: 'WRINKLE_RED',
  rubber: 'RUBBER',
  brass: 'BRASS',
  exhaust: 'EXHAUST_STEEL',
  carbon: 'CARBON_FIBER',
  iron: 'CAST_IRON',
};

function Mat({
  s,
  color,
  kind = 'alu',
  focus = false,
  side,
}: {
  s: S;
  color: string;
  kind?: Kind;
  focus?: boolean;
  side?: THREE.Side;
}) {
  if (s.blueprintEnabled || s.xrayEnabled) {
    return (
      <EngineMaterial
        isHovered={s.isHovered}
        isSelected={s.isSelected}
        isCylinderFocused={focus}
        xrayEnabled={s.xrayEnabled}
        blueprintEnabled={s.blueprintEnabled}
        baseColor={color}
        materialType={XRAY_TYPE[kind]}
      />
    );
  }
  const p = PBR[kind];
  const emissive = focus ? '#06b6d4' : s.isSelected ? '#0284c7' : s.isHovered ? '#0ea5e9' : '#000000';
  const ei = focus ? 0.45 : s.isSelected ? 0.25 : s.isHovered ? 0.1 : 0;
  return (
    <meshStandardMaterial
      color={color}
      metalness={p.m}
      roughness={p.r}
      envMapIntensity={p.e}
      emissive={emissive}
      emissiveIntensity={ei}
      side={side ?? THREE.FrontSide}
    />
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function Bolts({
  s,
  pts,
  r = 0.016,
  h = 0.02,
  axis = 'y',
  color = C.steel,
}: {
  s: S;
  pts: V3[];
  r?: number;
  h?: number;
  axis?: 'x' | 'y' | 'z';
  color?: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    pts.forEach((p, i) => {
      o.position.set(p[0], p[1], p[2]);
      o.rotation.set(axis === 'z' ? Math.PI / 2 : 0, 0, axis === 'x' ? Math.PI / 2 : 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [pts, axis]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} frustumCulled={false}>
      <cylinderGeometry args={[r, r, h, 6]} />
      <Mat s={s} color={color} kind="steel" />
    </instancedMesh>
  );
}

function Cyl({
  s,
  r,
  h,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  color = C.alu,
  kind = 'alu',
  seg = 40,
  r2,
  focus,
}: {
  s: S;
  r: number;
  h: number;
  pos?: V3;
  rot?: V3;
  color?: string;
  kind?: Kind;
  seg?: number;
  r2?: number;
  focus?: boolean;
}) {
  return (
    <mesh position={pos} rotation={rot}>
      <cylinderGeometry args={[r, r2 ?? r, h, seg]} />
      <Mat s={s} color={color} kind={kind} focus={focus} />
    </mesh>
  );
}

function Box({
  s,
  size,
  pos = [0, 0, 0],
  rot = [0, 0, 0],
  color = C.alu,
  kind = 'alu',
  radius = 0.02,
  focus,
}: {
  s: S;
  size: V3;
  pos?: V3;
  rot?: V3;
  color?: string;
  kind?: Kind;
  radius?: number;
  focus?: boolean;
}) {
  return (
    <RoundedBox args={size} radius={radius} smoothness={3} position={pos} rotation={rot}>
      <Mat s={s} color={color} kind={kind} focus={focus} />
    </RoundedBox>
  );
}

// ---------------------------------------------------------------------------
// Piston + connecting rod (lives in the bank-local frame -> no extra rotation)
// ---------------------------------------------------------------------------
const ROD_BOLTS: V3[] = [
  [0.082, -LROD / 2 - 0.09, 0],
  [-0.082, -LROD / 2 - 0.09, 0],
];

function PistonRod({ s, side, idx }: { s: S; side: Side; idx: number }) {
  const piston = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);
  const beta = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const phi = THROW_PHASE[idx];
  const number = side === 'left' ? idx + 1 : idx + 7;
  const focused = (s.focusedCylinder ?? 0) === number;

  useFrame(({ clock }) => {
    const rpm = s.v12Rpm ?? 600;
    const a = s.crankAngleRef
      ? s.crankAngleRef.current
      : clock.elapsedTime * (rpm / 60) * Math.PI * 2 * 0.12 * (s.v12Direction === -1 ? -1 : 1);
    const delta = -a + phi - beta; // crank-pin angle relative to the bore axis
    const sn = Math.sin(delta);
    const cs = Math.cos(delta);
    const sPin = R * cs + Math.sqrt(Math.max(0.01, LROD * LROD - R * R * sn * sn));
    if (piston.current) piston.current.position.y = sPin;
    if (rod.current) {
      rod.current.position.set((-R * sn) / 2, (R * cs + sPin) / 2, 0);
      rod.current.rotation.z = -Math.asin(Math.max(-1, Math.min(1, (R * sn) / LROD)));
    }
  });

  const pistonColor = focused ? '#e6fbff' : '#c9d0d6';
  return (
    <group position={[0, 0, ZS[idx]]}>
      <group ref={piston} position={[0, 0.7, 0]}>
        {/* crown + body */}
        <Cyl s={s} r={0.193} h={0.27} pos={[0, -0.035, 0]} color={pistonColor} kind="steel" seg={48} focus={focused} />
        <Cyl s={s} r={0.186} h={0.014} pos={[0, 0.101, 0]} color="#e3e8ec" kind="chrome" seg={48} />
        {/* dark ring pack */}
        {[0.072, 0.038, 0.004].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.194, 0.0075, 8, 48]} />
            <Mat s={s} color="#2b3036" kind="dark" />
          </mesh>
        ))}
        {/* skirt coating */}
        <Cyl s={s} r={0.1945} h={0.1} pos={[0, -0.12, 0]} color="#7f8890" kind="iron" seg={48} />
        {/* wrist pin */}
        <Cyl s={s} r={0.034} h={0.3} rot={[Math.PI / 2, 0, 0]} pos={[0, -0.01, 0]} color="#d2d8dd" kind="chrome" seg={20} />
      </group>

      <group ref={rod} position={[0, 0.5, 0]}>
        {/* I-beam */}
        <Box s={s} size={[0.075, 0.46, 0.026]} color={focused ? '#bfefff' : '#8c959d'} kind="steel" radius={0.008} />
        <Box s={s} size={[0.016, 0.46, 0.07]} pos={[0.036, 0, 0]} color="#a3acb4" kind="steel" radius={0.006} />
        <Box s={s} size={[0.016, 0.46, 0.07]} pos={[-0.036, 0, 0]} color="#a3acb4" kind="steel" radius={0.006} />
        {/* big end (on the crank pin) and small end (on the wrist pin) */}
        <Cyl s={s} r={0.108} h={0.07} pos={[0, -LROD / 2, 0]} rot={[Math.PI / 2, 0, 0]} color="#9aa3ab" kind="steel" seg={36} />
        <Cyl s={s} r={0.07} h={0.072} pos={[0, -LROD / 2, 0]} rot={[Math.PI / 2, 0, 0]} color={C.brass} kind="brass" seg={28} />
        <Cyl s={s} r={0.055} h={0.07} pos={[0, LROD / 2, 0]} rot={[Math.PI / 2, 0, 0]} color="#a8b0b7" kind="steel" seg={28} />
        <Bolts s={s} pts={ROD_BOLTS} r={0.013} h={0.04} color="#2b3036" />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// One cylinder bank (liners, block, head, cam cover, port flanges, injectors)
// ---------------------------------------------------------------------------
function Bank({ s, side }: { s: S; side: Side }) {
  const sign = side === 'left' ? -1 : 1;
  const beta = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const zOff = side === 'left' ? -STAGGER : STAGGER;
  const focus = s.focusedCylinder ?? 0;

  // The cutaway window faces outboard (away from the valley).
  const thetaStart = (side === 'left' ? 345 : 165) * DEG;
  const thetaLen = 210 * DEG;
  const edges = [thetaStart, thetaStart + thetaLen];

  const barrelH = DECK_Y - BARREL_Y0;
  const barrelY = BARREL_Y0 + barrelH / 2;
  const coverY = HEAD_Y0 + HEAD_H + COVER_H / 2;
  const coverTop = HEAD_Y0 + HEAD_H + COVER_H;

  const headBolts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    MAIN_Z.forEach((z) => {
      out.push([0.305, HEAD_Y0 + HEAD_H + 0.012, z]);
      out.push([-0.305, HEAD_Y0 + HEAD_H + 0.012, z]);
    });
    return out;
  }, []);
  const coverBolts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    for (let i = 0; i < 13; i++) {
      const z = -1.5 + i * 0.25;
      out.push([0.235, coverTop + 0.008, z]);
      out.push([-0.235, coverTop + 0.008, z]);
    }
    return out;
  }, [coverTop]);
  const flangeBolts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    ZS.forEach((z) => {
      [-0.07, 0.07].forEach((dy) => {
        out.push([sign * 0.375, 1.26 + dy, z - 0.085]);
        out.push([sign * 0.375, 1.26 + dy, z + 0.085]);
      });
    });
    return out;
  }, [sign]);

  const webZs = useMemo(
    () => [...ZS.slice(0, -1).map((z, i) => (z + ZS[i + 1]) / 2), ZS[0] - 0.275, ZS[5] + 0.275],
    []
  );

  return (
    <group position={[0, 0, zOff]} rotation={[0, 0, beta]}>
      {/* ---- cylinder barrels (sectioned open on the outboard side) ---- */}
      {ZS.map((z, i) => {
        const number = side === 'left' ? i + 1 : i + 7;
        const f = focus === number;
        return (
          <group key={i} position={[0, barrelY, z]}>
            <mesh>
              <cylinderGeometry args={[BARREL_R, BARREL_R, barrelH, 56, 1, true, thetaStart, thetaLen]} />
              <Mat s={s} color="#8d959c" kind="iron" side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[BORE_R, BORE_R, barrelH, 56, 1, true, thetaStart, thetaLen]} />
              <Mat s={s} color={f ? '#6fd8ee' : '#b3bbc2'} kind="steel" focus={f} side={THREE.DoubleSide} />
            </mesh>
            {/* painted section edges */}
            {edges.map((th, k) => (
              <mesh
                key={k}
                position={[((BARREL_R + BORE_R) / 2) * Math.sin(th), 0, ((BARREL_R + BORE_R) / 2) * Math.cos(th)]}
                rotation={[0, th - Math.PI / 2, 0]}
              >
                <boxGeometry args={[BARREL_R - BORE_R + 0.004, barrelH, 0.012]} />
                <Mat s={s} color={C.red} kind="red" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* webs between barrels = the block "pillars" */}
      {webZs.map((z, i) => (
        <group key={i}>
          <Box s={s} size={[0.56, barrelH, 0.07]} pos={[0, barrelY, z]} color={C.alu} radius={0.012} />
          <Box
            s={s}
            size={[0.02, barrelH - 0.02, 0.071]}
            pos={[sign * 0.272, barrelY, z]}
            color={C.red}
            kind="red"
            radius={0.004}
          />
        </group>
      ))}

      {/* deck plate */}
      <Box s={s} size={[0.58, 0.05, 3.12]} pos={[0, DECK_Y + 0.025, 0]} color="#79828a" radius={0.012} />

      {/* ---- cylinder head ---- */}
      <Box s={s} size={[HEAD_W, HEAD_H, HEAD_LEN]} pos={[0, HEAD_Y0 + HEAD_H / 2, 0]} color={C.head} radius={0.03} />
      {ZS.map((z, i) => (
        <group key={i}>
          <Box s={s} size={[0.02, 0.26, 0.05]} pos={[sign * 0.345, HEAD_Y0 + 0.18, z + 0.2]} color="#6b747c" radius={0.006} />
          <Box s={s} size={[0.02, 0.26, 0.05]} pos={[sign * 0.345, HEAD_Y0 + 0.18, z - 0.2]} color="#6b747c" radius={0.006} />
          {/* exhaust port flange (outboard) */}
          <Box s={s} size={[0.035, 0.19, 0.24]} pos={[sign * 0.36, 1.26, z]} color="#4a525a" radius={0.012} />
          {/* intake port flange (inboard) */}
          <Box s={s} size={[0.035, 0.19, 0.24]} pos={[-sign * 0.36, 1.26, z]} color="#4a525a" radius={0.012} />
        </group>
      ))}
      <Bolts s={s} pts={flangeBolts} r={0.012} h={0.025} axis="x" />
      <Bolts s={s} pts={headBolts} r={0.017} h={0.022} />

      {/* ---- cam cover ---- */}
      <Box s={s} size={[0.58, COVER_H, 3.1]} pos={[0, coverY, 0]} color={C.red} kind="red" radius={0.05} />
      {/* polished spine */}
      <Box s={s} size={[0.17, 0.028, 3.0]} pos={[0, coverTop + 0.006, 0]} color={C.aluLight} kind="chrome" radius={0.012} />
      {/* spark-plug wells */}
      {ZS.map((z, i) => (
        <group key={i} position={[0, coverTop + 0.04, z]}>
          <Cyl s={s} r={0.062} h={0.085} color="#222830" kind="dark" seg={28} />
          <mesh position={[0, 0.046, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.062, 0.011, 10, 30]} />
            <Mat s={s} color={C.chrome} kind="chrome" />
          </mesh>
          <Cyl s={s} r={0.026} h={0.03} pos={[0, 0.052, 0]} color="#0d0f12" kind="rubber" seg={16} />
        </group>
      ))}
      <Bolts s={s} pts={coverBolts} r={0.013} h={0.016} />

      {/* chain / drive covers on the front, end plate on the rear */}
      <Box s={s} size={[0.66, 0.36, 0.08]} pos={[0, 1.27, 1.61]} color="#4c555d" radius={0.03} />
      <Box s={s} size={[0.58, 0.22, 0.09]} pos={[0, 1.54, 1.61]} color={C.red} kind="red" radius={0.04} />
      <Box s={s} size={[0.66, 0.36, 0.04]} pos={[0, 1.27, -1.59]} color="#4c555d" radius={0.02} />

      {/* ---- fuel rail + injectors on the inboard face ---- */}
      <mesh position={[-sign * 0.43, 1.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.0, 16]} />
        <Mat s={s} color={C.aluLight} kind="chrome" />
      </mesh>
      {ZS.map((z, i) => (
        <group key={i}>
          <Cyl s={s} r={0.016} h={0.12} pos={[-sign * 0.43, 1.18, z]} color={C.brass} kind="brass" seg={14} />
          <Cyl s={s} r={0.026} h={0.03} pos={[-sign * 0.43, 1.255, z]} color="#14171a" kind="rubber" seg={14} />
        </group>
      ))}

      {/* ---- pistons + rods ---- */}
      {ZS.map((_, i) => (
        <PistonRod key={i} s={s} side={side} idx={i} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Crankshaft (+ flywheel at the rear, vibration damper at the front)
// ---------------------------------------------------------------------------
function Crankshaft({ s }: { s: S }) {
  const ref = useRef<THREE.Group>(null);

  const counterweight = useMemo(() => {
    const sh = new THREE.Shape();
    const r = 0.3;
    const c = -Math.PI / 2;
    const half = 64 * DEG;
    sh.moveTo(0, 0);
    sh.lineTo(r * Math.cos(c - half), r * Math.sin(c - half));
    sh.absarc(0, 0, r, c - half, c + half, false);
    sh.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false });
    g.translate(0, 0, -0.025);
    return g;
  }, []);

  const flywheelTeeth = useMemo(() => Array.from({ length: 60 }, (_, i) => (i / 60) * Math.PI * 2), []);
  const flywheelBolts = useMemo<V3[]>(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return [Math.cos(a) * 0.3, Math.sin(a) * 0.3, -0.09] as V3;
      }),
    []
  );
  const damperBolts = useMemo<V3[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.09] as V3;
      }),
    []
  );

  useFrame(({ clock }) => {
    const rpm = s.v12Rpm ?? 600;
    const a = s.crankAngleRef
      ? s.crankAngleRef.current
      : clock.elapsedTime * (rpm / 60) * Math.PI * 2 * 0.12 * (s.v12Direction === -1 ? -1 : 1);
    if (ref.current) ref.current.rotation.z = -a;
  });

  return (
    <group ref={ref}>
      {/* main axis */}
      <Cyl s={s} r={0.1} h={3.75} rot={[Math.PI / 2, 0, 0]} pos={[0, 0, 0.1]} color="#aab3ba" kind="steel" seg={36} />

      {/* main journals */}
      {MAIN_Z.map((z) => (
        <Cyl key={z} s={s} r={0.112} h={0.12} rot={[Math.PI / 2, 0, 0]} pos={[0, 0, z]} color="#d3d9de" kind="chrome" seg={36} />
      ))}

      {/* throws */}
      {ZS.map((z, i) => {
        const phi = THROW_PHASE[i];
        const pin: V3 = [-R * Math.sin(phi), R * Math.cos(phi), z];
        return (
          <group key={i}>
            {[-0.125, 0.125].map((dz) => (
              <group key={dz} position={[0, 0, z + dz]} rotation={[0, 0, phi]}>
                <Cyl s={s} r={0.13} h={0.05} rot={[Math.PI / 2, 0, 0]} color="#6f7881" kind="steel" seg={32} />
                <Cyl s={s} r={0.105} h={0.05} pos={[0, R, 0]} rot={[Math.PI / 2, 0, 0]} color="#6f7881" kind="steel" seg={28} />
                <Box s={s} size={[0.2, R, 0.05]} pos={[0, R / 2, 0]} color="#6f7881" kind="steel" radius={0.01} />
                <mesh geometry={counterweight}>
                  <Mat s={s} color="#59626b" kind="steel" />
                </mesh>
              </group>
            ))}
            {/* crank pin (rods ride on it) */}
            <Cyl s={s} r={0.07} h={0.3} pos={pin} rot={[Math.PI / 2, 0, 0]} color="#e3e8ec" kind="chrome" seg={28} />
          </group>
        );
      })}

      {/* ---- flywheel + ring gear (rear) ---- */}
      <group position={[0, 0, -1.96]}>
        <Cyl s={s} r={0.5} h={0.12} rot={[Math.PI / 2, 0, 0]} color="#3b434a" kind="steel" seg={64} />
        <Cyl s={s} r={0.38} h={0.14} pos={[0, 0, -0.012]} rot={[Math.PI / 2, 0, 0]} color="#b5bdc4" kind="chrome" seg={64} />
        <Cyl s={s} r={0.17} h={0.17} rot={[Math.PI / 2, 0, 0]} color="#69727b" kind="steel" seg={32} />
        {flywheelTeeth.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.525, Math.sin(a) * 0.525, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.045, 0.026, 0.12]} />
            <Mat s={s} color="#8e979f" kind="steel" />
          </mesh>
        ))}
        <Bolts s={s} pts={flywheelBolts} r={0.017} h={0.03} axis="z" />
      </group>

      {/* ---- front: damper + hub ---- */}
      <group position={[0, 0, 2.0]}>
        <Cyl s={s} r={0.25} h={0.13} rot={[Math.PI / 2, 0, 0]} color="#2a3036" kind="dark" seg={56} />
        <Cyl s={s} r={0.2} h={0.15} rot={[Math.PI / 2, 0, 0]} pos={[0, 0, 0.01]} color="#c1c8ce" kind="chrome" seg={56} />
        <mesh>
          <torusGeometry args={[0.236, 0.02, 10, 56]} />
          <Mat s={s} color={C.rubber} kind="rubber" />
        </mesh>
        <Cyl s={s} r={0.07} h={0.2} rot={[Math.PI / 2, 0, 0]} pos={[0, 0, 0.05]} color="#d9dfe3" kind="chrome" seg={6} />
        <Bolts s={s} pts={damperBolts} r={0.014} h={0.025} axis="z" />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Crankcase: 7 main-bearing bulkheads + rails, so the crank & rods stay visible
// ---------------------------------------------------------------------------
function Crankcase({ s }: { s: S }) {
  const plate = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.58, -0.34);
    sh.lineTo(0.58, -0.34);
    sh.lineTo(0.7, -0.08);
    sh.lineTo(0.62, 0.2);
    sh.lineTo(0.0, 0.5);
    sh.lineTo(-0.62, 0.2);
    sh.lineTo(-0.7, -0.08);
    sh.lineTo(-0.58, -0.34);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.15, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    g.translate(0, 0, -0.05);
    return g;
  }, []);

  const capBolts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    MAIN_Z.forEach((z) => {
      [-0.22, 0.22].forEach((x) => out.push([x, -0.22, z + 0.07]));
      [-0.5, 0.5].forEach((x) => out.push([x, -0.2, z + 0.07]));
      [-0.62, 0.62].forEach((x) => out.push([x, 0.02, z + 0.07]));
    });
    return out;
  }, []);

  return (
    <group>
      {MAIN_Z.map((z) => (
        <group key={z}>
          <mesh geometry={plate} position={[0, 0, z]}>
            <Mat s={s} color="#8a939b" kind="alu" />
          </mesh>
          {/* bearing cap */}
          <Box s={s} size={[0.44, 0.13, 0.14]} pos={[0, -0.17, z]} color="#566069" kind="steel" radius={0.02} />
          <mesh position={[0, 0, z]}>
            <torusGeometry args={[0.152, 0.012, 10, 40]} />
            <Mat s={s} color={C.brass} kind="brass" />
          </mesh>
          {/* red paint on the bulkhead rim */}
          <Box s={s} size={[1.3, 0.02, 0.102]} pos={[0, -0.34, z]} color={C.red} kind="red" radius={0.004} />
        </group>
      ))}
      <Bolts s={s} pts={capBolts} r={0.017} h={0.02} axis="z" />

      {/* long rails tie the bulkheads together */}
      {[-1, 1].map((sg) => (
        <group key={sg}>
          <Box s={s} size={[0.07, 0.07, 3.1]} pos={[sg * 0.66, -0.31, 0]} color="#5b646c" radius={0.015} />
          <Box s={s} size={[0.05, 0.05, 3.1]} pos={[sg * 0.69, -0.07, 0]} color="#7c858d" radius={0.012} />
        </group>
      ))}

      {/* engine mount feet */}
      {[-1, 1].map((sg) =>
        [-1.0, 1.0].map((z) => (
          <Box key={`${sg}${z}`} s={s} size={[0.22, 0.09, 0.3]} pos={[sg * 0.78, -0.1, z]} color="#4a525a" radius={0.02} />
        ))
      )}
    </group>
  );
}

function OilPan({ s }: { s: S }) {
  const bolts = useMemo<V3[]>(() => {
    const out: V3[] = [];
    for (let i = 0; i < 17; i++) {
      const z = -1.6 + i * 0.2;
      out.push([-0.6, -0.37, z]);
      out.push([0.6, -0.37, z]);
    }
    return out;
  }, []);
  const ribZs = useMemo(() => Array.from({ length: 16 }, (_, i) => -1.5 + i * 0.2), []);
  return (
    <group>
      <Box s={s} size={[1.3, 0.05, 3.34]} pos={[0, -0.395, 0]} color="#59626b" radius={0.015} />
      <Box s={s} size={[1.16, 0.36, 3.26]} pos={[0, -0.6, 0]} color={C.pan} radius={0.07} />
      <Box s={s} size={[0.72, 0.2, 1.5]} pos={[0, -0.84, 0.2]} color="#555e67" radius={0.05} />
      {ribZs.map((z) => (
        <group key={z}>
          <Box s={s} size={[0.03, 0.28, 0.06]} pos={[0.595, -0.6, z]} color="#7b848c" radius={0.008} />
          <Box s={s} size={[0.03, 0.28, 0.06]} pos={[-0.595, -0.6, z]} color="#7b848c" radius={0.008} />
        </group>
      ))}
      <Bolts s={s} pts={bolts} r={0.016} h={0.02} />
      <Cyl s={s} r={0.04} h={0.04} pos={[0, -0.96, 0.5]} color="#cfd6db" kind="steel" seg={6} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Intake: 12 runners rising from the heads into a twin-throttle plenum
// ---------------------------------------------------------------------------
function Intake({ s }: { s: S }) {
  const runners = useMemo(() => {
    const list: { geo: THREE.TubeGeometry; ring: V3; ringRot: number }[] = [];
    (['left', 'right'] as Side[]).forEach((side) => {
      const sign = side === 'left' ? -1 : 1;
      const beta = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
      const zOff = side === 'left' ? -STAGGER : STAGGER;
      const [px, py] = toWorld(beta, -sign * 0.38, 1.26);
      ZS.forEach((z) => {
        const zz = z + zOff;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px, py, zz),
          new THREE.Vector3(px - sign * 0.07, py + 0.1, zz),
          new THREE.Vector3(px - sign * 0.17, py + 0.2, zz),
          new THREE.Vector3(sign * 0.2, 1.5, zz),
        ]);
        list.push({
          geo: new THREE.TubeGeometry(curve, 28, 0.062, 16, false),
          ring: [px, py, zz],
          ringRot: beta,
        });
      });
    });
    return list;
  }, []);

  return (
    <group>
      {runners.map((r, i) => (
        <group key={i}>
          <mesh geometry={r.geo}>
            <Mat s={s} color="#2a3037" kind="carbon" />
          </mesh>
        </group>
      ))}

      {/* plenum */}
      <Box s={s} size={[0.5, 0.3, 3.0]} pos={[0, 1.58, 0]} color="#252a30" kind="carbon" radius={0.09} />
      <Box s={s} size={[0.28, 0.03, 2.84]} pos={[0, 1.745, 0]} color={C.aluLight} kind="chrome" radius={0.012} />
      {Array.from({ length: 13 }, (_, i) => -1.5 + i * 0.25).map((z) => (
        <Box key={z} s={s} size={[0.52, 0.02, 0.025]} pos={[0, 1.735, z]} color="#3b424a" radius={0.006} />
      ))}
      {/* valley floor so the V reads as a deep trough rather than an open gap */}
      <Box s={s} size={[0.46, 0.08, 3.08]} pos={[0, 0.78, 0]} color="#323940" radius={0.03} />

      {/* twin throttle bodies on the front of the plenum */}
      {[-0.11, 0.11].map((x) => (
        <group key={x} position={[x, 1.58, 1.62]}>
          <Cyl s={s} r={0.105} h={0.26} rot={[Math.PI / 2, 0, 0]} color="#7d868e" kind="alu" seg={36} />
          <Cyl s={s} r={0.085} h={0.28} rot={[Math.PI / 2, 0, 0]} color="#090b0d" kind="rubber" seg={32} />
          <mesh position={[0, 0, 0.1]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.078, 0.078, 0.01, 28]} />
            <Mat s={s} color={C.brass} kind="brass" />
          </mesh>
          <mesh position={[0, 0, 0.14]}>
            <torusGeometry args={[0.108, 0.014, 10, 32]} />
            <Mat s={s} color={C.chrome} kind="chrome" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Exhaust: six primaries per bank, merged 3-into-1 into four collector downpipes
// ---------------------------------------------------------------------------
function Exhaust({ s, side }: { s: S; side: Side }) {
  const sign = side === 'left' ? -1 : 1;
  const beta = side === 'left' ? BANK_ANGLE : -BANK_ANGLE;
  const zOff = side === 'left' ? -STAGGER : STAGGER;

  const data = useMemo(() => {
    const [px, py] = toWorld(beta, sign * 0.4, 1.26);
    const dir = toWorld(beta, sign, 0); // outward normal of the port face
    const groups = [
      { idx: [0, 1, 2], zc: -0.75 + zOff },
      { idx: [3, 4, 5], zc: 0.75 + zOff },
    ];
    const tubes: THREE.TubeGeometry[] = [];
    groups.forEach(({ idx, zc }) => {
      idx.forEach((i) => {
        const z = ZS[i] + zOff;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(px, py, z),
          new THREE.Vector3(px + dir[0] * 0.12, py + dir[1] * 0.12, z),
          new THREE.Vector3(sign * 1.1, 0.7, z + (zc - z) * 0.2),
          new THREE.Vector3(sign * 1.2, 0.5, z + (zc - z) * 0.62),
          new THREE.Vector3(sign * 1.19, 0.36, zc + (z - zc) * 0.12),
        ]);
        tubes.push(new THREE.TubeGeometry(curve, 40, 0.036, 12, false));
      });
    });
    return { tubes, groups };
  }, [beta, sign, zOff]);

  const EX = '#b9a07a';
  return (
    <group>
      {data.tubes.map((g, i) => (
        <mesh key={i} geometry={g}>
          <Mat s={s} color={EX} kind="exhaust" />
        </mesh>
      ))}
      {data.groups.map(({ zc }, i) => (
        <group key={i} position={[sign * 1.19, 0, zc]}>
          {/* collector cone */}
          <Cyl s={s} r={0.13} r2={0.085} h={0.2} pos={[0, 0.3, 0]} color={EX} kind="exhaust" seg={32} />
          {/* downpipe */}
          <Cyl s={s} r={0.085} h={0.26} pos={[0, 0.07, 0]} color="#a58c68" kind="exhaust" seg={32} />
          {/* flange */}
          <Cyl s={s} r={0.125} h={0.035} pos={[0, -0.075, 0]} color="#9aa3ab" kind="steel" seg={32} />
          <Cyl s={s} r={0.07} h={0.04} pos={[0, -0.075, 0]} color="#0b0d10" kind="rubber" seg={24} />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Front accessory drive: cover plate, serpentine belt, pulleys, alternator, pump
// ---------------------------------------------------------------------------
function convexHull(points: [number, number][]) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  pts.forEach((p) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  });
  const upper: [number, number][] = [];
  [...pts].reverse().forEach((p) => {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  });
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

const PULLEYS: { p: [number, number]; r: number }[] = [
  { p: [0, 0], r: 0.22 }, // crank
  { p: [0.62, 0.36], r: 0.15 }, // alternator
  { p: [-0.55, 0.42], r: 0.13 }, // power-steering
  { p: [-0.6, -0.22], r: 0.11 }, // tensioner
  { p: [0.52, -0.24], r: 0.16 }, // water pump
];

function FrontEnd({ s }: { s: S }) {
  const cover = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.62, -0.38);
    sh.lineTo(0.62, -0.38);
    sh.lineTo(0.74, -0.08);
    sh.lineTo(0.66, 0.24);
    sh.lineTo(0.0, 0.56);
    sh.lineTo(-0.66, 0.24);
    sh.lineTo(-0.74, -0.08);
    sh.lineTo(-0.62, -0.38);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
    });
    g.translate(0, 0, -0.05);
    return g;
  }, []);

  const belt = useMemo(() => {
    const ring = (grow: number) => {
      const q: [number, number][] = [];
      PULLEYS.forEach(({ p, r }) => {
        for (let i = 0; i < 36; i++) {
          const a = (i / 36) * Math.PI * 2;
          q.push([p[0] + Math.cos(a) * (r + grow), p[1] + Math.sin(a) * (r + grow)]);
        }
      });
      return convexHull(q);
    };
    const outer = new THREE.Shape(ring(0.014).map((p) => new THREE.Vector2(p[0], p[1])));
    outer.holes.push(new THREE.Path(ring(-0.004).map((p) => new THREE.Vector2(p[0], p[1]))));
    const g = new THREE.ExtrudeGeometry(outer, { depth: 0.07, bevelEnabled: false });
    g.translate(0, 0, -0.035);
    return g;
  }, []);

  return (
    <group>
      {/* front timing cover */}
      <mesh geometry={cover} position={[0, 0, 1.78]}>
        <Mat s={s} color="#59626b" kind="alu" />
      </mesh>
      <Box s={s} size={[0.5, 0.5, 0.06]} pos={[0, -0.02, 1.86]} color="#6a737b" radius={0.04} />

      {/* water pump housing + alternator + PS pump bodies */}
      <Cyl s={s} r={0.18} h={0.16} rot={[Math.PI / 2, 0, 0]} pos={[0.52, -0.24, 1.88]} color="#7d868e" kind="alu" seg={32} />
      <Cyl s={s} r={0.13} h={0.24} rot={[Math.PI / 2, 0, 0]} pos={[0.62, 0.36, 1.9]} color="#2f363d" kind="dark" seg={32} />
      <Cyl s={s} r={0.1} h={0.2} rot={[Math.PI / 2, 0, 0]} pos={[-0.55, 0.42, 1.88]} color="#394149" kind="dark" seg={28} />

      {/* pulleys */}
      {PULLEYS.slice(1).map(({ p, r }, i) => (
        <group key={i} position={[p[0], p[1], 1.98]}>
          <Cyl s={s} r={r} h={0.1} rot={[Math.PI / 2, 0, 0]} color="#78818a" kind="steel" seg={40} />
          <Cyl s={s} r={r * 0.34} h={0.13} rot={[Math.PI / 2, 0, 0]} color={C.chrome} kind="chrome" seg={6} />
        </group>
      ))}

      {/* serpentine belt */}
      <mesh geometry={belt} position={[0, 0, 1.98]}>
        <Mat s={s} color="#0e1114" kind="rubber" />
      </mesh>

      {/* bellhousing flange at the rear */}
      <mesh geometry={cover} position={[0, 0, -1.74]}>
        <Mat s={s} color="#4d565e" kind="alu" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------
export function V12UltimateCutaway(state: V12UltimateProps) {
  return (
    <group rotation={[0.13, -1.02, 0.04]} position={[0, -0.35, 0]}>
      <Crankcase s={state} />
      <OilPan s={state} />
      <Bank s={state} side="left" />
      <Bank s={state} side="right" />
      <Intake s={state} />
      <Exhaust s={state} side="left" />
      <Exhaust s={state} side="right" />
      <Crankshaft s={state} />
      <FrontEnd s={state} />
    </group>
  );
}
