export interface OhmsLawResult {
  voltageV: number;
  currentA: number;
  resistanceOhm: number;
  powerW: number;
  status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION';
  assumptions: string[];
}

export function calculateOhmsLaw(voltageV: number, currentA: number): OhmsLawResult {
  if (!Number.isFinite(voltageV) || voltageV < 0 || voltageV > 100000) {
    throw new RangeError('Voltage must be a finite value between 0 and 100,000 V.');
  }
  if (!Number.isFinite(currentA) || currentA <= 0 || currentA > 100000) {
    throw new RangeError('Current must be finite, greater than zero, and no more than 100,000 A.');
  }
  const resistanceOhm = voltageV / currentA;
  const powerW = voltageV * currentA;
  return {
    voltageV,
    currentA,
    resistanceOhm,
    powerW,
    status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    assumptions: [
      'Uses V = I R and P = V I for a lumped element.',
      'Treats inputs as steady-state values; it does not model temperature, parasitics, or circuit transients.',
      'Does not model or validate a physical circuit board or connected hardware.',
    ],
  };
}

export interface CantileverBeamInput {
  lengthM: number;
  widthM: number;
  heightM: number;
  youngsModulusPa: number;
  endLoadN: number;
}

export interface CantileverBeamResult {
  secondMomentOfAreaM4: number;
  tipDeflectionM: number;
  maxBendingStressPa: number;
  status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION';
  assumptions: string[];
}

export function calculateCantileverBeam(input: CantileverBeamInput): CantileverBeamResult {
  const { lengthM, widthM, heightM, youngsModulusPa, endLoadN } = input;
  if (![lengthM, widthM, heightM, youngsModulusPa, endLoadN].every(Number.isFinite)) {
    throw new RangeError('Beam inputs must all be finite numbers.');
  }
  if (lengthM <= 0 || lengthM > 100 ||
      widthM <= 0 || widthM > 10 ||
      heightM <= 0 || heightM > 10 ||
      youngsModulusPa <= 0 || youngsModulusPa > 2e12 ||
      endLoadN < 0 || endLoadN > 1e9) {
    throw new RangeError('Beam inputs are outside the supported educational calculation range.');
  }
  const secondMomentOfAreaM4 = widthM * Math.pow(heightM, 3) / 12;
  const tipDeflectionM = (endLoadN * Math.pow(lengthM, 3)) /
    (3 * youngsModulusPa * secondMomentOfAreaM4);
  const maxBendingStressPa = (endLoadN * lengthM * (heightM / 2)) / secondMomentOfAreaM4;
  if (![secondMomentOfAreaM4, tipDeflectionM, maxBendingStressPa].every(Number.isFinite)) {
    throw new RangeError('Beam calculation overflowed the supported numeric range.');
  }
  return {
    secondMomentOfAreaM4,
    tipDeflectionM,
    maxBendingStressPa,
    status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    assumptions: [
      'Straight prismatic rectangular cantilever with a point load at its free end.',
      'Linear elastic, homogeneous material; small deflection Euler–Bernoulli beam theory.',
      'No stress concentrations, shear deflection, buckling, fatigue, nonlinear behavior, or finite-element analysis.',
      'Results are not a design approval and do not validate the materials or dimensions of any catalog model.',
    ],
  };
}

export interface BernoulliInput {
  area1M2: number;
  area2M2: number;
  velocity1Mps: number;
  pressure1Pa: number;
  densityKgM3: number;
}

export interface BernoulliResult {
  velocity2Mps: number;
  pressure2Pa: number;
  status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION';
  assumptions: string[];
}

export function calculateContinuityBernoulli(input: BernoulliInput): BernoulliResult {
  const { area1M2, area2M2, velocity1Mps, pressure1Pa, densityKgM3 } = input;
  if (![area1M2, area2M2, velocity1Mps, pressure1Pa, densityKgM3].every(Number.isFinite)) {
    throw new RangeError('Fluid inputs must all be finite numbers.');
  }
  if (area1M2 <= 0 || area1M2 > 1e6 ||
      area2M2 <= 0 || area2M2 > 1e6 ||
      velocity1Mps < 0 || velocity1Mps > 10000 ||
      pressure1Pa < 0 || pressure1Pa > 1e12 ||
      densityKgM3 <= 0 || densityKgM3 > 100000) {
    throw new RangeError('Fluid inputs are outside the supported educational calculation range.');
  }
  const velocity2Mps = velocity1Mps * area1M2 / area2M2;
  const pressure2Pa = pressure1Pa + 0.5 * densityKgM3 * (velocity1Mps ** 2 - velocity2Mps ** 2);
  if (!Number.isFinite(velocity2Mps) || !Number.isFinite(pressure2Pa) || pressure2Pa < 0) {
    throw new RangeError('The simplified result is outside its valid pressure range; check inputs and assumptions.');
  }
  return {
    velocity2Mps,
    pressure2Pa,
    status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    assumptions: [
      'Steady incompressible flow through a single streamtube.',
      'Same elevation at both locations; no pump work, friction, or other head losses between points.',
      'Not CFD and not a prediction of the internal flow in the catalog hydraulic pump.',
    ],
  };
}

export interface DynamicPressureResult {
  mach: number;
  dynamicPressurePa: number;
  status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION';
  assumptions: string[];
}

export function calculateMachAndDynamicPressure(
  speedMps: number,
  speedOfSoundMps: number,
  densityKgM3: number,
): DynamicPressureResult {
  if (![speedMps, speedOfSoundMps, densityKgM3].every(Number.isFinite) ||
      speedMps < 0 || speedMps > 20000 ||
      speedOfSoundMps <= 0 || speedOfSoundMps > 20000 ||
      densityKgM3 < 0 || densityKgM3 > 1000) {
    throw new RangeError('Aerospace inputs are outside the supported finite numeric range.');
  }
  return {
    mach: speedMps / speedOfSoundMps,
    dynamicPressurePa: 0.5 * densityKgM3 * speedMps * speedMps,
    status: 'ANALYTICAL_EDUCATIONAL_APPROXIMATION',
    assumptions: [
      'Mach uses the supplied local speed of sound; no atmospheric model is inferred.',
      'Dynamic pressure uses q = 0.5 rho v².',
      'No aerodynamic coefficient, compressible-flow solver, CFD, flight safety assessment, or vehicle performance prediction is performed.',
    ],
  };
}

export interface PlanarLinkageResult {
  endXMetres: number;
  endYMetres: number;
  status: 'KINEMATIC_EDUCATIONAL_APPROXIMATION';
  assumptions: string[];
}

export function calculatePlanarTwoLinkKinematics(
  link1M: number,
  link2M: number,
  joint1Rad: number,
  joint2Rad: number,
): PlanarLinkageResult {
  if (![link1M, link2M, joint1Rad, joint2Rad].every(Number.isFinite) ||
      link1M <= 0 || link1M > 100 ||
      link2M <= 0 || link2M > 100 ||
      Math.abs(joint1Rad) > 2 * Math.PI ||
      Math.abs(joint2Rad) > 2 * Math.PI) {
    throw new RangeError('Link lengths must be positive and joint angles must be within ±2π radians.');
  }
  return {
    endXMetres: link1M * Math.cos(joint1Rad) + link2M * Math.cos(joint1Rad + joint2Rad),
    endYMetres: link1M * Math.sin(joint1Rad) + link2M * Math.sin(joint1Rad + joint2Rad),
    status: 'KINEMATIC_EDUCATIONAL_APPROXIMATION',
    assumptions: [
      'Planar two-link rigid mechanism with angles measured in radians.',
      'No joint dynamics, motor torque, backlash, collisions, structural compliance, or hardware calibration is included.',
      'This result does not certify the real hardware geometry or safe motion limits.',
    ],
  };
}
