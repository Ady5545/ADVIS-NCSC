export type Vector3Tuple = [number, number, number];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

/**
 * Resolve a component's local progress from the global assembly explosion factor.
 * A stage is the global factor at which that part begins to leave its assembled location.
 * Stage 0 preserves linear behavior for legacy models. Stage 1 is deliberately disallowed
 * by the caller so every component has reached its complete offset when factor = 1.
 */
export function resolveStagedExplosionProgress(factor: number, stage = 0): number {
  const normalizedFactor = clamp(factor, 0, 1);
  const normalizedStage = clamp(stage, 0, 0.95);
  if (normalizedStage <= 0) return normalizedFactor;
  if (normalizedFactor <= normalizedStage) return 0;
  return clamp((normalizedFactor - normalizedStage) / (1 - normalizedStage), 0, 1);
}

/** Pure component transform helper for tests and any future non-Three renderer. */
export function resolveExplodedPosition(
  base: Vector3Tuple,
  offset: Vector3Tuple,
  factor: number,
  stage = 0,
): Vector3Tuple {
  const progress = resolveStagedExplosionProgress(factor, stage);
  return [
    base[0] + offset[0] * progress,
    base[1] + offset[1] * progress,
    base[2] + offset[2] * progress,
  ];
}
