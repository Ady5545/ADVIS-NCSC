export type WorkspaceSpatialMode = 'INSPECTION' | 'SHOWCASE' | 'EXPLODED' | 'DEMO';
export type WorkspaceLodTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
export type WorkspaceChemistryMode = 'LESSON' | 'CANONICAL' | null;

/**
 * A saved workspace is a UI/session snapshot, not a model or geometry export.
 * It records navigation and presentation controls so the learner can resume the
 * same context without mutating the shared model catalogue.
 */
export interface WorkspaceSnapshotData {
  currentView: string;
  currentSpatialObject: string | string[] | null;
  selectedComponentId: string | null;
  spatialMode: WorkspaceSpatialMode;
  isExploded: boolean;
  isPresentationMode: boolean;
  presentationStep: number;
  explodedFactor: number;
  xrayEnabled: boolean;
  blueprintEnabled: boolean;
  showLabels: boolean;
  measurementMode: boolean;
  isEngineeringMode: boolean;
  showInnovationLab: boolean;
  isKinematicPlaying: boolean;
  kinematicSpeed: number;
  kinematicTimeOffset: number;
  v12Rpm: number;
  v12Direction: number;
  v8Rpm: number;
  isV8KinematicPlaying: boolean;
  v8KinematicSpeed: number;
  v8KinematicTimeOffset: number;
  v8CrankAngleDeg: number;
  isMagnifierFocused: boolean;
  lodTier: WorkspaceLodTier;
  focusedCylinder: number;
  chargeFlowEnabled: boolean;
  vectorsEnabled: boolean;
  soundEnabled: boolean;
  themeColor: string;
  speechRate: number;
  hologramIntensity: number;
  lessonRunnerOpen: boolean;
  lessonRunnerId: string | null;
  chemistryFormula: string | null;
  chemistrySessionMode: WorkspaceChemistryMode;
}

export interface SavedWorkspace extends WorkspaceSnapshotData {
  id: string;
  name: string;
  savedAt: number;
}

const STORAGE_KEY = 'advis_unified_workspace_sessions_v1';
const SCHEMA_VERSION = 1;
const MAX_SAVED_WORKSPACES = 12;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const finiteNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const numberValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numberValue));
};

const safeString = (value: unknown, fallback: string | null = null, maxLength = 180): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, maxLength) : fallback;

const safeBool = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

function normalizeSpatialObject(value: unknown): string | string[] | null {
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 180);
  if (Array.isArray(value)) {
    const ids = value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0).map(id => id.trim().slice(0, 180)).slice(0, 4);
    return ids.length ? ids : null;
  }
  return null;
}

function normalizeSnapshot(raw: unknown): WorkspaceSnapshotData | null {
  if (!isRecord(raw)) return null;
  const currentView = safeString(raw.currentView, 'home', 80) || 'home';
  const spatialModeValues: WorkspaceSpatialMode[] = ['INSPECTION', 'SHOWCASE', 'EXPLODED', 'DEMO'];
  const lodValues: WorkspaceLodTier[] = ['LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
  const spatialMode = spatialModeValues.includes(raw.spatialMode as WorkspaceSpatialMode)
    ? raw.spatialMode as WorkspaceSpatialMode
    : 'INSPECTION';
  const lodTier = lodValues.includes(raw.lodTier as WorkspaceLodTier)
    ? raw.lodTier as WorkspaceLodTier
    : 'HIGH';
  const chemistrySessionMode: WorkspaceChemistryMode =
    raw.chemistrySessionMode === 'LESSON' || raw.chemistrySessionMode === 'CANONICAL'
      ? raw.chemistrySessionMode
      : null;

  return {
    currentView,
    currentSpatialObject: normalizeSpatialObject(raw.currentSpatialObject),
    selectedComponentId: safeString(raw.selectedComponentId),
    spatialMode,
    isExploded: safeBool(raw.isExploded),
    isPresentationMode: safeBool(raw.isPresentationMode),
    presentationStep: Math.round(finiteNumber(raw.presentationStep, 0, 0, 1000)),
    explodedFactor: finiteNumber(raw.explodedFactor, 0, 0, 1),
    xrayEnabled: safeBool(raw.xrayEnabled),
    blueprintEnabled: safeBool(raw.blueprintEnabled),
    showLabels: safeBool(raw.showLabels),
    measurementMode: safeBool(raw.measurementMode),
    isEngineeringMode: safeBool(raw.isEngineeringMode),
    showInnovationLab: safeBool(raw.showInnovationLab),
    isKinematicPlaying: safeBool(raw.isKinematicPlaying, true),
    kinematicSpeed: finiteNumber(raw.kinematicSpeed, 1, 0.05, 8),
    kinematicTimeOffset: finiteNumber(raw.kinematicTimeOffset, 0, -100000, 100000),
    v12Rpm: finiteNumber(raw.v12Rpm, 600, 0, 30000),
    v12Direction: raw.v12Direction === -1 ? -1 : 1,
    v8Rpm: finiteNumber(raw.v8Rpm, 600, 0, 30000),
    isV8KinematicPlaying: safeBool(raw.isV8KinematicPlaying, true),
    v8KinematicSpeed: finiteNumber(raw.v8KinematicSpeed, 1, 0.05, 8),
    v8KinematicTimeOffset: finiteNumber(raw.v8KinematicTimeOffset, 0, -100000, 100000),
    v8CrankAngleDeg: finiteNumber(raw.v8CrankAngleDeg, 0, -100000, 100000),
    isMagnifierFocused: safeBool(raw.isMagnifierFocused),
    lodTier,
    focusedCylinder: Math.round(finiteNumber(raw.focusedCylinder, 1, 1, 32)),
    chargeFlowEnabled: safeBool(raw.chargeFlowEnabled, true),
    vectorsEnabled: safeBool(raw.vectorsEnabled),
    soundEnabled: safeBool(raw.soundEnabled, true),
    themeColor: /^#[0-9a-f]{6}$/i.test(typeof raw.themeColor === 'string' ? raw.themeColor : '')
      ? raw.themeColor as string
      : '#e20246',
    speechRate: finiteNumber(raw.speechRate, 1.05, 0.5, 2),
    hologramIntensity: finiteNumber(raw.hologramIntensity, 1, 0.1, 1.5),
    lessonRunnerOpen: safeBool(raw.lessonRunnerOpen),
    lessonRunnerId: safeString(raw.lessonRunnerId),
    chemistryFormula: safeString(raw.chemistryFormula, null, 40),
    chemistrySessionMode,
  };
}

function getWindowStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readSavedWorkspaces(): SavedWorkspace[] {
  const storage = getWindowStorage();
  if (!storage) return [];

  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isRecord)
      .map((entry): SavedWorkspace | null => {
        if (entry.schemaVersion !== SCHEMA_VERSION) return null;
        const id = safeString(entry.id, null, 120);
        const name = safeString(entry.name, null, 80);
        const savedAt = finiteNumber(entry.savedAt, 0, 0, Number.MAX_SAFE_INTEGER);
        const snapshot = normalizeSnapshot(entry.snapshot);
        if (!id || !name || !snapshot) return null;
        return { ...snapshot, id, name, savedAt };
      })
      .filter((entry): entry is SavedWorkspace => entry !== null)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_SAVED_WORKSPACES);
  } catch {
    return [];
  }
}

export function saveWorkspace(name: string, snapshot: WorkspaceSnapshotData): {
  ok: boolean;
  workspaces: SavedWorkspace[];
  saved?: SavedWorkspace;
} {
  const storage = getWindowStorage();
  if (!storage) return { ok: false, workspaces: readSavedWorkspaces() };

  const safeName = name.trim().slice(0, 80);
  if (!safeName) return { ok: false, workspaces: readSavedWorkspaces() };

  try {
    const normalized = normalizeSnapshot(snapshot);
    if (!normalized) return { ok: false, workspaces: readSavedWorkspaces() };
    const id = typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved: SavedWorkspace = {
      ...normalized,
      id,
      name: safeName,
      savedAt: Date.now(),
    };
    const next = [saved, ...readSavedWorkspaces()].slice(0, MAX_SAVED_WORKSPACES);
    storage.setItem(STORAGE_KEY, JSON.stringify(next.map((entry) => ({
      id: entry.id,
      name: entry.name,
      savedAt: entry.savedAt,
      schemaVersion: SCHEMA_VERSION,
      snapshot: normalizeSnapshot(entry),
    }))));
    return { ok: true, workspaces: next, saved };
  } catch {
    return { ok: false, workspaces: readSavedWorkspaces() };
  }
}

export function deleteWorkspace(id: string): SavedWorkspace[] {
  const storage = getWindowStorage();
  if (!storage) return [];
  try {
    const next = readSavedWorkspaces().filter((entry) => entry.id !== id);
    storage.setItem(STORAGE_KEY, JSON.stringify(next.map((entry) => ({
      id: entry.id,
      name: entry.name,
      savedAt: entry.savedAt,
      schemaVersion: SCHEMA_VERSION,
      snapshot: normalizeSnapshot(entry),
    }))));
    return next;
  } catch {
    return readSavedWorkspaces();
  }
}
