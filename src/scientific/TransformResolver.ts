export type Vector3Tuple = [number, number, number];

export interface Transform3D {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
}

/**
 * Translation/rotation values in editDelta and kinematicDelta are additive
 * deltas expressed in the model's shared coordinate frame. This small resolver
 * intentionally does not claim to solve arbitrary CAD mates or rigid-body
 * constraints; those need a domain-specific solver.
 */
export interface ResolveComponentTransformInput {
  base: Transform3D;
  editDelta?: Partial<Transform3D>;
  kinematicDelta?: Partial<Transform3D>;
  explosionOffset?: Vector3Tuple;
  explosionFactor?: number;
  presentationOffset?: Vector3Tuple;
}

const ZERO: Vector3Tuple = [0, 0, 0];
const ONE: Vector3Tuple = [1, 1, 1];

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function tupleOr(value: Vector3Tuple | undefined, fallback: Vector3Tuple): Vector3Tuple {
  if (!Array.isArray(value) || value.length !== 3) return [...fallback] as Vector3Tuple;
  return [
    finiteOr(value[0], fallback[0]),
    finiteOr(value[1], fallback[1]),
    finiteOr(value[2], fallback[2]),
  ];
}

function add(a: Vector3Tuple, b: Vector3Tuple, c: Vector3Tuple = ZERO): Vector3Tuple {
  return [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]];
}

function multiply(a: Vector3Tuple, b: Vector3Tuple): Vector3Tuple {
  return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
}

export function clampExplosionFactor(factor: number | undefined): number {
  if (typeof factor !== 'number' || !Number.isFinite(factor)) return 0;
  return Math.max(0, Math.min(1, factor));
}

/**
 * The only supported composition order for this contract is:
 * base -> edit delta -> model kinematic delta -> explosion -> presentation.
 * Selection/highlight should be rendered as an effect and must not change this
 * engineering transform.
 */
export function resolveComponentTransform(input: ResolveComponentTransformInput): Transform3D {
  const basePosition = tupleOr(input.base.position, ZERO);
  const baseRotation = tupleOr(input.base.rotation, ZERO);
  const baseScale = tupleOr(input.base.scale, ONE);
  const editPosition = tupleOr(input.editDelta?.position, ZERO);
  const editRotation = tupleOr(input.editDelta?.rotation, ZERO);
  const editScale = tupleOr(input.editDelta?.scale, ONE);
  const motionPosition = tupleOr(input.kinematicDelta?.position, ZERO);
  const motionRotation = tupleOr(input.kinematicDelta?.rotation, ZERO);
  const explosionOffset = tupleOr(input.explosionOffset, ZERO);
  const presentationOffset = tupleOr(input.presentationOffset, ZERO);
  const factor = clampExplosionFactor(input.explosionFactor);
  const exploded = explosionOffset.map((value) => value * factor) as Vector3Tuple;

  return {
    position: add(add(add(basePosition, editPosition), motionPosition), add(exploded, presentationOffset)),
    rotation: add(add(baseRotation, editRotation), motionRotation),
    scale: multiply(baseScale, editScale),
  };
}

export function interpolateExplosionFactor(current: number, target: number, alpha: number): number {
  const from = clampExplosionFactor(current);
  const to = clampExplosionFactor(target);
  const amount = Math.max(0, Math.min(1, finiteOr(alpha, 0)));
  return from + (to - from) * amount;
}
