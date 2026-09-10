import { useState, useEffect } from 'react';

export type CylinderStroke = 'INTAKE' | 'COMPRESSION' | 'POWER' | 'EXHAUST';

export interface CylinderTelemetry {
  cylinderIndex: number; // 1 to 12
  bank: 'L' | 'R';
  firingOffsetDeg: number; // Offset in 720° cycle
  cycleAngleDeg: number; // 0 to 720° for this cylinder
  stroke: CylinderStroke;
  isFiring: boolean;
  pistonPositionMm: number; // 0 (TDC) to 76.4 (BDC)
  pistonVelocityMs: number; // m/s
  pistonAccelerationG: number; // G-force
  cylinderPressureBar: number;
  intakeLiftMm: number;
  exhaustLiftMm: number;
}

export interface EngineKinematicsSnapshot {
  crankAngleDeg: number; // 0 to 720°
  rpm: number;
  kinematicSpeed: number;
  isPlaying: boolean;
  focusedCylinder: number; // 1 to 12
  cylinders: CylinderTelemetry[];
  // Summary for the focused cylinder:
  focusedTelemetry: CylinderTelemetry;
  // Global engine metrics:
  totalTorqueNm: number;
  brakePowerHp: number;
  meanPistonSpeedMs: number;
  timestamp: number;
}

// 60° V12 Firing Order and Bank Allocation
export const V12_FIRING_ORDER = [1, 12, 4, 9, 2, 11, 6, 7, 3, 10, 5, 8];

// Bank 1 (Left): 1, 2, 3, 4, 5, 6
// Bank 2 (Right): 7, 8, 9, 10, 11, 12
export const V12_BANK_MAP: Record<number, 'L' | 'R'> = {
  1: 'L', 2: 'L', 3: 'L', 4: 'L', 5: 'L', 6: 'L',
  7: 'R', 8: 'R', 9: 'R', 10: 'R', 11: 'R', 12: 'R'
};

// Even 60° firing separation (720° / 12 = 60°)
export const V12_CYLINDER_OFFSETS: Record<number, number> = {
  1: 0,
  12: 60,
  4: 120,
  9: 180,
  2: 240,
  11: 300,
  6: 360,
  7: 420,
  3: 480,
  10: 540,
  5: 600,
  8: 660
};

// Engine Geometry Constants
const BORE_MM = 95.0;
const STROKE_MM = 76.4;
const CRANK_RADIUS_M = (STROKE_MM / 2) / 1000; // 0.0382 m
const ROD_LENGTH_M = 0.145; // 145 mm
const LAMBDA = CRANK_RADIUS_M / ROD_LENGTH_M; // ~0.2634
const COMPRESSION_RATIO = 11.8;
const MAX_VALVE_LIFT_MM = 11.2;

// Closed-form slider-crank kinematics
export function computePistonKinematics(angleRad: number, omegaRadS: number): {
  positionMm: number;
  velocityMs: number;
  accelerationG: number;
} {
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const sin2A = Math.sin(2 * angleRad);
  const cos2A = Math.cos(2 * angleRad);

  // Stroke position x from TDC: x = r(1 - cosθ) + L(1 - sqrt(1 - λ²sin²θ))
  const underRadical = Math.max(0.001, 1 - LAMBDA * LAMBDA * sinA * sinA);
  const sqrtTerm = Math.sqrt(underRadical);
  const dispM = CRANK_RADIUS_M * (1 - cosA) + ROD_LENGTH_M * (1 - sqrtTerm);
  const positionMm = dispM * 1000;

  // Velocity v = r*ω * (sinθ + (λ*sin2θ)/(2*sqrtTerm))
  const velocityMs = CRANK_RADIUS_M * omegaRadS * (sinA + (LAMBDA * sin2A) / (2 * sqrtTerm));

  // Acceleration a = r*ω² * (cosθ + λ*(cos2θ + λ²sin⁴θ)/(sqrtTerm³))
  const lambdaSq = LAMBDA * LAMBDA;
  const sin4A = Math.pow(sinA, 4);
  const accelTerm = cosA + (LAMBDA * (cos2A + lambdaSq * sin4A)) / Math.pow(underRadical, 1.5);
  const accelerationMs2 = CRANK_RADIUS_M * omegaRadS * omegaRadS * accelTerm;
  const accelerationG = accelerationMs2 / 9.80665;

  return { positionMm, velocityMs, accelerationG };
}

// Valve lift calculation (0 to 720° cycle)
export function computeValveLifts(cycleDeg: number): {
  intakeLiftMm: number;
  exhaustLiftMm: number;
} {
  let intakeLiftMm = 0;
  let exhaustLiftMm = 0;

  // Intake valve: Opens at 350° (10° BTDC), closes at 200° (20° ABDC)
  // Total duration: 210°
  let intakeDeg = cycleDeg;
  if (intakeDeg > 350) intakeDeg -= 720;
  if (intakeDeg >= -10 && intakeDeg <= 200) {
    const progress = (intakeDeg + 10) / 210; // 0 to 1
    intakeLiftMm = Math.sin(progress * Math.PI) * MAX_VALVE_LIFT_MM;
  }

  // Exhaust valve: Opens at 510° (30° BBDC), closes at 735° / 15° (15° ATDC)
  let exhaustDeg = cycleDeg;
  if (exhaustDeg < 500) exhaustDeg += 720;
  if (exhaustDeg >= 510 && exhaustDeg <= 735) {
    const progress = (exhaustDeg - 510) / 225; // 0 to 1
    exhaustLiftMm = Math.sin(progress * Math.PI) * MAX_VALVE_LIFT_MM;
  }

  return {
    intakeLiftMm: Math.max(0, intakeLiftMm),
    exhaustLiftMm: Math.max(0, exhaustLiftMm)
  };
}

// Thermodynamic Pressure Calculation (bar)
export function computeCylinderPressure(cycleDeg: number): {
  pressureBar: number;
  stroke: CylinderStroke;
  isFiring: boolean;
} {
  let stroke: CylinderStroke = 'INTAKE';
  let pressureBar = 1.0;
  let isFiring = false;

  if (cycleDeg < 180) {
    stroke = 'INTAKE';
    // Slight depression then recovers to atmospheric
    pressureBar = 0.95 + 0.05 * Math.sin((cycleDeg / 180) * Math.PI);
  } else if (cycleDeg < 360) {
    stroke = 'COMPRESSION';
    // Isentropic compression: P = P0 * (V_max / V)^gamma
    const compProgress = (cycleDeg - 180) / 180;
    pressureBar = 1.0 + (Math.pow(COMPRESSION_RATIO, 1.35) - 1.0) * Math.pow(compProgress, 2.2);
    // Spark fires ~14° BTDC (346° to 360°)
    if (cycleDeg >= 346 && cycleDeg <= 360) {
      isFiring = true;
    }
  } else if (cycleDeg < 540) {
    stroke = 'POWER';
    const expProgress = (cycleDeg - 360) / 180;
    if (expProgress < 0.12) {
      // Deflagration peak pressure spike up to ~74 bar
      isFiring = true;
      const peakProg = expProgress / 0.12;
      pressureBar = 24.0 + 50.0 * Math.sin(peakProg * (Math.PI / 2));
    } else {
      // Polytropic expansion work
      const tailProg = (expProgress - 0.12) / 0.88;
      pressureBar = 74.0 * Math.pow(1 - tailProg * 0.82, 3.0);
    }
  } else {
    stroke = 'EXHAUST';
    const exhProgress = (cycleDeg - 540) / 180;
    pressureBar = Math.max(1.1, 4.0 * Math.exp(-exhProgress * 4.0) + 1.15);
  }

  return { pressureBar, stroke, isFiring };
}

class EngineKinematicsBusClass {
  private snapshot: EngineKinematicsSnapshot;
  private listeners: Set<(snap: EngineKinematicsSnapshot) => void> = new Set();
  private lastEmitTime = 0;

  constructor() {
    this.snapshot = this.computeSnapshot(0, 600, 1.0, true, 1);
  }

  public getSnapshot(): EngineKinematicsSnapshot {
    return this.snapshot;
  }

  public computeSnapshot(
    crankAngleDeg: number,
    rpm: number,
    kinematicSpeed: number,
    isPlaying: boolean,
    focusedCylinder: number
  ): EngineKinematicsSnapshot {
    const normCrank = ((crankAngleDeg % 720) + 720) % 720;
    const omega = ((rpm * Math.PI * 2) / 60) * kinematicSpeed;

    const cylinders: CylinderTelemetry[] = [];
    let totalTorqueNm = 0;

    for (let c = 1; c <= 12; c++) {
      const offset = V12_CYLINDER_OFFSETS[c] || 0;
      const cylAngleDeg = ((normCrank - offset) % 720 + 720) % 720;
      const cylAngleRad = (cylAngleDeg * Math.PI) / 180;

      const { positionMm, velocityMs, accelerationG } = computePistonKinematics(cylAngleRad, omega);
      const { intakeLiftMm, exhaustLiftMm } = computeValveLifts(cylAngleDeg);
      const { pressureBar, stroke, isFiring } = computeCylinderPressure(cylAngleDeg);

      // Piston force & indicated torque contribution
      const pistonAreaM2 = (Math.PI * Math.pow(BORE_MM / 2000, 2));
      const gasForceN = (pressureBar - 1.0) * 100000 * pistonAreaM2;
      const tangRad = Math.sin(cylAngleRad) + (LAMBDA * Math.sin(2 * cylAngleRad)) / (2 * Math.sqrt(Math.max(0.001, 1 - LAMBDA * LAMBDA * Math.sin(cylAngleRad) * Math.sin(cylAngleRad))));
      const torqueContribution = Math.max(0, gasForceN * CRANK_RADIUS_M * tangRad);
      totalTorqueNm += torqueContribution;

      const isEngineActive = isPlaying && rpm > 0;

      cylinders.push({
        cylinderIndex: c,
        bank: V12_BANK_MAP[c] || 'L',
        firingOffsetDeg: offset,
        cycleAngleDeg: cylAngleDeg,
        stroke,
        isFiring: isEngineActive ? isFiring : false,
        pistonPositionMm: positionMm,
        pistonVelocityMs: isEngineActive ? velocityMs : 0,
        pistonAccelerationG: isEngineActive ? accelerationG : 0,
        cylinderPressureBar: isEngineActive ? pressureBar : 1.013,
        intakeLiftMm,
        exhaustLiftMm
      });
    }

    const focusedTelemetry = cylinders.find(c => c.cylinderIndex === focusedCylinder) || cylinders[0];
    const isEngineActive = isPlaying && rpm > 0;
    const meanPistonSpeedMs = isEngineActive ? (2 * STROKE_MM * rpm) / (60 * 1000) : 0;
    const brakePowerHp = isEngineActive ? (totalTorqueNm * omega) / 745.7 : 0;

    return {
      crankAngleDeg: normCrank,
      rpm,
      kinematicSpeed,
      isPlaying,
      focusedCylinder,
      cylinders,
      focusedTelemetry,
      totalTorqueNm: isEngineActive ? Math.max(20, Math.min(850, totalTorqueNm * 0.45)) : 0, // Scaled continuous torque
      brakePowerHp: isEngineActive ? Math.max(5, Math.min(780, brakePowerHp * 0.45)) : 0,
      meanPistonSpeedMs,
      timestamp: Date.now()
    };
  }

  public update(
    crankAngleDeg: number,
    rpm: number,
    kinematicSpeed: number,
    isPlaying: boolean,
    focusedCylinder: number
  ) {
    this.snapshot = this.computeSnapshot(crankAngleDeg, rpm, kinematicSpeed, isPlaying, focusedCylinder);

    // Throttle React listeners to ~30-40fps while keeping bus snapshot 60fps for direct canvas/animation consumers
    const now = performance.now();
    if (now - this.lastEmitTime > 24) {
      this.lastEmitTime = now;
      for (const listener of this.listeners) {
        listener(this.snapshot);
      }
    }
  }

  public subscribe(listener: (snap: EngineKinematicsSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const EngineKinematicsBus = new EngineKinematicsBusClass();

// React hook to access real-time engine telemetry
export function useEngineTelemetry(): EngineKinematicsSnapshot {
  const [telemetry, setTelemetry] = useState<EngineKinematicsSnapshot>(() => EngineKinematicsBus.getSnapshot());

  useEffect(() => {
    return EngineKinematicsBus.subscribe(snap => {
      setTelemetry(snap);
    });
  }, []);

  return telemetry;
}
