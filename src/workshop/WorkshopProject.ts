/**
 * Safe, versioned visual-design project documents.
 * These documents edit presentation transforms only; they never mutate source catalog geometry.
 */
export const WORKSHOP_SCHEMA_VERSION = 1;
export const WORKSHOP_MAX_HISTORY = 100;

export type Transform3 = [number, number, number];

export interface ComponentTransform {
  position: Transform3;
  rotation: Transform3;
  scale: Transform3;
}

export interface WorkshopSourceModel {
  id: string;
  name: string;
  version?: string;
  components: Array<{ id: string; position: Transform3; rotation?: Transform3; assetScale?: number }>;
}

export interface WorkshopTransformCommand {
  componentId: string;
  before: ComponentTransform | null;
  after: ComponentTransform | null;
  timestamp: string;
}

export interface WorkshopProject {
  schemaVersion: 1;
  id: string;
  title: string;
  sourceModelId: string;
  sourceModelVersion: string;
  createdAt: string;
  updatedAt: string;
  transforms: Record<string, ComponentTransform>;
  history: WorkshopTransformCommand[];
  historyCursor: number;
  notice: string;
}

export type WorkshopResult =
  | { ok: true; project: WorkshopProject }
  | { ok: false; error: string };

export interface WorkshopStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const WORKSHOP_LIMITATIONS =
  'Visual transform project only: source meshes and CAD feature trees are unchanged. These edits do not establish engineering dimensions, assembly constraints, or manufacturing-ready CAD.';

const finiteTriple = (value: unknown): value is Transform3 =>
  Array.isArray(value) && value.length === 3 && value.every((part) => typeof part === 'number' && Number.isFinite(part));

export function cloneTransform(transform: ComponentTransform): ComponentTransform {
  return {
    position: [...transform.position] as Transform3,
    rotation: [...transform.rotation] as Transform3,
    scale: [...transform.scale] as Transform3,
  };
}

export function validateComponentTransform(value: unknown): value is ComponentTransform {
  if (!value || typeof value !== 'object') return false;
  const transform = value as Partial<ComponentTransform>;
  if (!finiteTriple(transform.position) || !finiteTriple(transform.rotation) || !finiteTriple(transform.scale)) return false;
  if (transform.position.some((part) => Math.abs(part) > 1000)) return false;
  if (transform.rotation.some((part) => Math.abs(part) > 100 * Math.PI)) return false;
  if (transform.scale.some((part) => part < 0.01 || part > 100)) return false;
  return true;
}

function applyCommand(project: WorkshopProject, command: WorkshopTransformCommand, side: 'before' | 'after'): WorkshopProject {
  const transforms = { ...project.transforms };
  const target = command[side];
  if (target) transforms[command.componentId] = cloneTransform(target);
  else delete transforms[command.componentId];
  return { ...project, transforms, updatedAt: command.timestamp };
}

export function createProjectCopy(
  source: WorkshopSourceModel,
  options: { id?: string; title?: string; now?: string } = {},
): WorkshopProject {
  const now = options.now || new Date().toISOString();
  const id = options.id || `workshop-${source.id}-${Date.parse(now) || 0}`;
  return {
    schemaVersion: WORKSHOP_SCHEMA_VERSION,
    id,
    title: options.title?.trim() || `My ${source.name} design`,
    sourceModelId: source.id,
    sourceModelVersion: source.version || 'unversioned',
    createdAt: now,
    updatedAt: now,
    transforms: {},
    history: [],
    historyCursor: 0,
    notice: WORKSHOP_LIMITATIONS,
  };
}

export function setComponentTransform(
  project: WorkshopProject,
  componentId: string,
  value: unknown,
  allowedComponentIds: ReadonlySet<string>,
  now = new Date().toISOString(),
): WorkshopResult {
  if (!allowedComponentIds.has(componentId)) return { ok: false, error: 'This component is not part of the source model.' };
  if (!validateComponentTransform(value)) return { ok: false, error: 'Transform is invalid or outside the supported visual-editing range.' };

  const after = cloneTransform(value);
  const current = project.transforms[componentId] ?? null;
  if (current && JSON.stringify(current) === JSON.stringify(after)) return { ok: true, project };

  const command: WorkshopTransformCommand = {
    componentId,
    before: current ? cloneTransform(current) : null,
    after,
    timestamp: now,
  };
  const retainedHistory = project.history.slice(0, project.historyCursor).concat(command).slice(-WORKSHOP_MAX_HISTORY);
  const historyCursor = retainedHistory.length;
  const next = applyCommand({ ...project, history: retainedHistory, historyCursor }, command, 'after');
  return { ok: true, project: { ...next, updatedAt: now } };
}

export function resetComponentTransform(
  project: WorkshopProject,
  componentId: string,
  allowedComponentIds: ReadonlySet<string>,
  now = new Date().toISOString(),
): WorkshopResult {
  if (!allowedComponentIds.has(componentId)) return { ok: false, error: 'This component is not part of the source model.' };
  const current = project.transforms[componentId];
  if (!current) return { ok: true, project };
  const command: WorkshopTransformCommand = {
    componentId,
    before: cloneTransform(current),
    after: null,
    timestamp: now,
  };
  const history = project.history.slice(0, project.historyCursor).concat(command).slice(-WORKSHOP_MAX_HISTORY);
  const next = applyCommand({ ...project, history, historyCursor: history.length }, command, 'after');
  return { ok: true, project: { ...next, updatedAt: now } };
}

export function undoWorkshopProject(project: WorkshopProject): WorkshopProject {
  if (project.historyCursor <= 0) return project;
  const command = project.history[project.historyCursor - 1];
  const next = applyCommand(project, command, 'before');
  return { ...next, historyCursor: project.historyCursor - 1 };
}

export function redoWorkshopProject(project: WorkshopProject): WorkshopProject {
  if (project.historyCursor >= project.history.length) return project;
  const command = project.history[project.historyCursor];
  const next = applyCommand(project, command, 'after');
  return { ...next, historyCursor: project.historyCursor + 1 };
}

export function canUndoWorkshopProject(project: WorkshopProject): boolean {
  return project.historyCursor > 0;
}

export function canRedoWorkshopProject(project: WorkshopProject): boolean {
  return project.historyCursor < project.history.length;
}

export function validateWorkshopProject(
  value: unknown,
  source: Pick<WorkshopSourceModel, 'id' | 'version' | 'components'>,
): WorkshopResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Project data must be a JSON object.' };
  }
  const input = value as Partial<WorkshopProject>;
  if (input.schemaVersion !== WORKSHOP_SCHEMA_VERSION) {
    return { ok: false, error: 'This project schema version is not supported.' };
  }
  if (!input.id || typeof input.id !== 'string' || !input.title || typeof input.title !== 'string') {
    return { ok: false, error: 'Project ID and title are required.' };
  }
  if (input.sourceModelId !== source.id) return { ok: false, error: 'This project belongs to a different source model.' };
  if (input.sourceModelVersion !== (source.version || 'unversioned')) {
    return { ok: false, error: 'The source model revision differs; review before importing this project.' };
  }
  if (!input.transforms || typeof input.transforms !== 'object' || Array.isArray(input.transforms)) {
    return { ok: false, error: 'Project transforms are missing or malformed.' };
  }
  const allowed = new Set(source.components.map((component) => component.id));
  const transforms: Record<string, ComponentTransform> = {};
  for (const [componentId, transform] of Object.entries(input.transforms)) {
    if (!allowed.has(componentId)) return { ok: false, error: `Unknown component ID in project: ${componentId}.` };
    if (!validateComponentTransform(transform)) return { ok: false, error: `Invalid transform for component ${componentId}.` };
    transforms[componentId] = cloneTransform(transform);
  }
  const createdAt = typeof input.createdAt === 'string' && !Number.isNaN(Date.parse(input.createdAt)) ? input.createdAt : new Date(0).toISOString();
  const updatedAt = typeof input.updatedAt === 'string' && !Number.isNaN(Date.parse(input.updatedAt)) ? input.updatedAt : createdAt;
  return {
    ok: true,
    project: {
      schemaVersion: WORKSHOP_SCHEMA_VERSION,
      id: input.id,
      title: input.title.trim().slice(0, 120) || 'Imported design',
      sourceModelId: source.id,
      sourceModelVersion: source.version || 'unversioned',
      createdAt,
      updatedAt,
      transforms,
      history: [],
      historyCursor: 0,
      notice: WORKSHOP_LIMITATIONS,
    },
  };
}

export function serializeWorkshopProject(project: WorkshopProject): string {
  return JSON.stringify({
    ...project,
    history: project.history,
    notice: WORKSHOP_LIMITATIONS,
  }, null, 2);
}

export function parseWorkshopProject(
  raw: string,
  source: Pick<WorkshopSourceModel, 'id' | 'version' | 'components'>,
): WorkshopResult {
  try {
    return validateWorkshopProject(JSON.parse(raw) as unknown, source);
  } catch {
    return { ok: false, error: 'Project file is not valid JSON.' };
  }
}

export function workshopStorageKey(modelId: string): string {
  return `advis-ncsc.workshop.v1.${encodeURIComponent(modelId)}`;
}

export function saveWorkshopProject(storage: WorkshopStorage, project: WorkshopProject): boolean {
  try {
    storage.setItem(workshopStorageKey(project.sourceModelId), serializeWorkshopProject(project));
    return true;
  } catch {
    return false;
  }
}

export function loadWorkshopProject(
  storage: WorkshopStorage,
  source: Pick<WorkshopSourceModel, 'id' | 'version' | 'components'>,
): WorkshopProject | null {
  try {
    const raw = storage.getItem(workshopStorageKey(source.id));
    if (!raw) return null;
    const result = parseWorkshopProject(raw, source);
    return result.ok ? result.project : null;
  } catch {
    return null;
  }
}
