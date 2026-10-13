export type StudyParams = {
  sunTeeth: number;
  planetTeeth: number;
  moduleMm: number;
  inputRpm: number;
  inputTorqueNm: number;
};

export const DEFAULT_STUDY_PARAMS: StudyParams = {
  sunTeeth: 24,
  planetTeeth: 18,
  moduleMm: 2.0,
  inputRpm: 3000,
  inputTorqueNm: 150,
};

export const STUDY_STORAGE_KEY = 'advis-ncsc.innovation-study.v1';

export function isStudyParams(value: unknown): value is StudyParams {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return Number.isInteger(item.sunTeeth) && Number(item.sunTeeth) >= 12 && Number(item.sunTeeth) <= 40 &&
    Number.isInteger(item.planetTeeth) && Number(item.planetTeeth) >= 8 && Number(item.planetTeeth) <= 30 &&
    typeof item.moduleMm === 'number' && Number.isFinite(item.moduleMm) && item.moduleMm >= 0.5 && item.moduleMm <= 5 &&
    typeof item.inputRpm === 'number' && Number.isFinite(item.inputRpm) && item.inputRpm >= 100 && item.inputRpm <= 10000 &&
    typeof item.inputTorqueNm === 'number' && Number.isFinite(item.inputTorqueNm) && item.inputTorqueNm >= 10 && item.inputTorqueNm <= 1000;
}

/** Accept only bounded, versioned project data; legacy study exports remain importable. */
export function parseStudyProject(raw: string): StudyParams | null {
  if (raw.length > 1024 * 1024) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const project = parsed as { schemaVersion?: unknown; version?: unknown; parameters?: unknown };
    if (project.schemaVersion !== undefined && project.schemaVersion !== 1) return null;
    if (project.version !== undefined && project.version !== 1) return null;
    return isStudyParams(project.parameters) ? { ...project.parameters } : null;
  } catch {
    return null;
  }
}

export function createStudyProject(parameters: StudyParams, baseline: StudyParams, savedAt = new Date().toISOString()) {
  return {
    schemaVersion: 1 as const,
    study: 'Planetary Gearset Innovation Study',
    savedAt,
    parameters: { ...parameters },
    baseline: { ...baseline },
    note: 'Educational design study only; not a certified manufacturing drawing or safety assessment.',
  };
}
