export type V8BankSide = -1 | 1;
export type V8CylinderBank = 'L' | 'R';

export const V8_BANK_ANGLE = Math.PI / 4;
export const V8_CYLINDER_Z = [-0.78, -0.26, 0.26, 0.78] as const;
export const V8_THROW_PHASES = [0, Math.PI / 2, -Math.PI / 2, Math.PI] as const;
export const V8_FIRING_ORDER = [1, 8, 4, 3, 6, 5, 7, 2] as const;
export const V8_CYLINDER_BANK: Record<number, V8CylinderBank> = {
  1: 'L', 2: 'R', 3: 'L', 4: 'R', 5: 'L', 6: 'R', 7: 'L', 8: 'R',
};

const CRANK_RADIUS = 0.108;
const CONNECTING_ROD_LENGTH = 0.32;
const CRANK_AXIS_OFFSET = -0.325;

/**
 * Align cylinder 1's TDC with the HUD's zero-degree reference, then preserve
 * the 90-degree bank and cross-plane throw relationships for the other cylinders.
 */
const TDC_ALIGNMENT_OFFSET = (3 * Math.PI) / 4;

export interface V8PistonKinematics {
  localThrowAngle: number;
  crankX: number;
  crankY: number;
  verticalRodLength: number;
  pistonY: number;
  rodAngle: number;
}

/** Resolve the representative slider-crank position used by the V8 Three.js renderer. */
export function resolveV8PistonKinematics(
  crankAngleRad: number,
  side: V8BankSide,
  cylinderIndex: number,
): V8PistonKinematics {
  const angle = Number.isFinite(crankAngleRad) ? crankAngleRad : 0;
  const validIndex = Number.isInteger(cylinderIndex) && cylinderIndex >= 0 && cylinderIndex < 4
    ? cylinderIndex
    : 0;
  const localThrowAngle =
    angle + V8_THROW_PHASES[validIndex] + side * V8_BANK_ANGLE + TDC_ALIGNMENT_OFFSET;
  const crankX = CRANK_RADIUS * Math.cos(localThrowAngle);
  const crankY = CRANK_AXIS_OFFSET + CRANK_RADIUS * Math.sin(localThrowAngle);
  const verticalRodLength = Math.sqrt(
    Math.max(0.0001, CONNECTING_ROD_LENGTH ** 2 - crankX ** 2),
  );

  return {
    localThrowAngle,
    crankX,
    crankY,
    verticalRodLength,
    pistonY: crankY + verticalRodLength,
    rodAngle: Math.atan2(crankX, verticalRodLength),
  };
}

/** HUD event angle for the example sequence, in the 0–720° teaching cycle. */
export function getV8FiringAngleDeg(cylinder: number): number | null {
  const index = V8_FIRING_ORDER.indexOf(cylinder as (typeof V8_FIRING_ORDER)[number]);
  return index < 0 ? null : index * 90;
}

/** Bank and bore index represented by a cylinder number in this educational layout. */
export function getV8CylinderPosition(cylinder: number): { side: V8BankSide; index: number } | null {
  if (!Number.isInteger(cylinder) || cylinder < 1 || cylinder > 8) return null;
  const bank = V8_CYLINDER_BANK[cylinder];
  const side: V8BankSide = bank === 'L' ? -1 : 1;
  const bankCylinderNumbers = bank === 'L' ? [1, 3, 5, 7] : [2, 4, 6, 8];
  return { side, index: bankCylinderNumbers.indexOf(cylinder) };
}
