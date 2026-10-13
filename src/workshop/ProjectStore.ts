import type { ObjectMetadata } from '../SpatialLibrary';
import {
  canonicalTransformsForModel,
  normalizeTransform,
  summarizeEditableProject,
  type EditableModelProject,
  type EditableProjectSummary,
  type WorkshopComponentTransform,
} from './ProjectSchema';

const STORAGE_KEY = 'advis-ncsc.editable-projects.v1';
const MAX_PROJECTS = 100;
const MAX_NOTES_LENGTH = 20000;

export interface ProjectSeedState {
  componentTransforms?: Record<string, WorkshopComponentTransform>;
  hiddenComponentIds?: string[];
  selectedComponentId?: string | null;
  isolatedComponentId?: string | null;
  explodedFactor?: number;
  viewMode?: EditableModelProject['viewMode'];
  simulationParameters?: Record<string, number>;
  notes?: string;
}

function newProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `advis-${crypto.randomUUID()}`;
  }
  return `advis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sanitizeTransformMap(input: unknown, canonical: Record<string, WorkshopComponentTransform>) {
  const output = { ...canonical };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return output;
  for (const [id, value] of Object.entries(input)) {
    const normalized = normalizeTransform(value);
    if (normalized) output[id] = normalized;
  }
  return output;
}

export function createEditableProject(
  model: ObjectMetadata,
  name?: string,
  seed: ProjectSeedState = {},
): EditableModelProject {
  const now = new Date().toISOString();
  const canonical = canonicalTransformsForModel(model);
  const componentTransforms = sanitizeTransformMap(seed.componentTransforms, canonical);
  return {
    schemaVersion: 1,
    id: newProjectId(),
    name: (name || `${model.name} — My Copy`).slice(0, 160),
    sourceModelId: model.id,
    sourceModelName: model.name,
    sourceModelVersion: model.modelVersion || 'unversioned-source',
    sourceModelKind: model.modelKind,
    sourceEvidence: model.evidence ? clone(model.evidence) : undefined,
    createdAt: now,
    updatedAt: now,
    componentTransforms,
    hiddenComponentIds: [...new Set((seed.hiddenComponentIds || []).filter((id) => typeof id === 'string'))],
    selectedComponentId: seed.selectedComponentId || null,
    isolatedComponentId: seed.isolatedComponentId || null,
    explodedFactor: Math.max(0, Math.min(1, Number.isFinite(seed.explodedFactor) ? seed.explodedFactor as number : 0)),
    viewMode: seed.viewMode || 'SOLID',
    simulationParameters: Object.fromEntries(
      Object.entries(seed.simulationParameters || {}).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)),
    ),
    constraints: [],
    annotations: [],
    notes: (seed.notes || '').slice(0, MAX_NOTES_LENGTH),
    limitations: [
      'This is an editable transform-level copy; it does not edit an underlying CAD feature tree.',
      'Component transforms are visual edits and do not make the source model or its simulation more scientifically validated.',
      'Assembly constraints are stored only when explicitly authored; no constraint solver is implied by this project format.',
    ],
  };
}

function isProject(value: unknown): value is EditableModelProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const project = value as Partial<EditableModelProject>;
  if (project.schemaVersion !== 1) return false;
  if (typeof project.id !== 'string' || !project.id || typeof project.name !== 'string') return false;
  if (typeof project.sourceModelId !== 'string' || !project.sourceModelId) return false;
  if (!project.componentTransforms || typeof project.componentTransforms !== 'object' || Array.isArray(project.componentTransforms)) return false;
  if (!Array.isArray(project.hiddenComponentIds) || !Array.isArray(project.constraints) || !Array.isArray(project.annotations)) return false;
  if (typeof project.createdAt !== 'string' || typeof project.updatedAt !== 'string') return false;
  if (typeof project.explodedFactor !== 'number' || !Number.isFinite(project.explodedFactor)) return false;
  return true;
}

function readProjects(): EditableModelProject[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isProject).map((project) => clone(project)).slice(0, MAX_PROJECTS);
  } catch {
    return [];
  }
}

function writeProjects(projects: EditableModelProject[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_PROJECTS)));
    return true;
  } catch {
    return false;
  }
}

export function listEditableProjects(): EditableProjectSummary[] {
  return readProjects()
    .map(summarizeEditableProject)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadEditableProject(projectId: string): EditableModelProject | null {
  return readProjects().find((project) => project.id === projectId) || null;
}

export function saveEditableProject(project: EditableModelProject): boolean {
  if (!isProject(project)) return false;
  const projects = readProjects();
  const normalized: EditableModelProject = {
    ...clone(project),
    name: project.name.trim().slice(0, 160) || 'Untitled learning project',
    explodedFactor: Math.max(0, Math.min(1, project.explodedFactor)),
    notes: (project.notes || '').slice(0, MAX_NOTES_LENGTH),
    updatedAt: new Date().toISOString(),
  };
  const index = projects.findIndex((item) => item.id === project.id);
  if (index >= 0) projects[index] = normalized;
  else projects.unshift(normalized);
  return writeProjects(projects);
}

export function deleteEditableProject(projectId: string): boolean {
  return writeProjects(readProjects().filter((project) => project.id !== projectId));
}

export function exportEditableProjectJson(project: EditableModelProject): string {
  return JSON.stringify({
    format: 'advis-ncsc-editable-project',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    project,
  }, null, 2);
}

export function importEditableProjectJson(json: string): EditableModelProject | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const envelope = parsed as { format?: string; formatVersion?: number; project?: unknown };
    if (envelope.format !== 'advis-ncsc-editable-project' || envelope.formatVersion !== 1 || !isProject(envelope.project)) return null;
    const imported = clone(envelope.project);
    imported.id = newProjectId();
    imported.name = `${imported.name} — Imported`.slice(0, 160);
    imported.createdAt = new Date().toISOString();
    imported.updatedAt = imported.createdAt;
    imported.componentTransforms = sanitizeTransformMap(imported.componentTransforms, {});
    return imported;
  } catch {
    return null;
  }
}
