import type { ObjectMetadata } from '../SpatialLibrary';
import {
  canonicalComponentTransform,
  cloneTransform,
  createWorkshopProject,
} from './WorkshopSchema';
import type { ComponentTransform, TransformTuple, WorkshopCommand, WorkshopProject } from './WorkshopSchema';

export const WORKSHOP_STORAGE_KEY = 'advis-ncsc.workshop-projects.v1';
export const MAX_WORKSHOP_PROJECTS = 24;
export const MAX_WORKSHOP_HISTORY = 100;
export const MAX_WORKSHOP_IMPORT_CHARS = 2 * 1024 * 1024;

type Catalog = Record<string, ObjectMetadata>;

function canUseStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function safeFiniteTuple(value: unknown, minimum: number, maximum: number): value is TransformTuple {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((part) => typeof part === 'number' && Number.isFinite(part) && part >= minimum && part <= maximum);
}

export function sanitizeComponentTransform(value: unknown): ComponentTransform | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ComponentTransform>;
  if (!safeFiniteTuple(candidate.position, -10000, 10000)) return null;
  if (!safeFiniteTuple(candidate.rotation, -10000, 10000)) return null;
  if (!safeFiniteTuple(candidate.scale, 0.0001, 100)) return null;
  return {
    position: [...candidate.position] as TransformTuple,
    rotation: [...candidate.rotation] as TransformTuple,
    scale: [...candidate.scale] as TransformTuple,
  };
}

export function validateWorkshopProject(value: unknown, catalog: Catalog): value is WorkshopProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const project = value as Partial<WorkshopProject>;
  if (project.schemaVersion !== 1 ||
      typeof project.id !== 'string' || !project.id.trim() || project.id.length > 180 ||
      typeof project.name !== 'string' || !project.name.trim() || project.name.length > 120 ||
      typeof project.sourceModelId !== 'string' || !catalog[project.sourceModelId] ||
      typeof project.sourceModelVersion !== 'string' || project.sourceModelVersion.length > 120 ||
      typeof project.createdAt !== 'string' || Number.isNaN(Date.parse(project.createdAt)) ||
      typeof project.updatedAt !== 'string' || Number.isNaN(Date.parse(project.updatedAt)) ||
      !Number.isInteger(project.revision) || (project.revision || 0) < 1 ||
      !project.componentTransforms || typeof project.componentTransforms !== 'object' || Array.isArray(project.componentTransforms) ||
      !Array.isArray(project.commands) || project.commands.length > MAX_WORKSHOP_HISTORY ||
      !Number.isInteger(project.cursor) || (project.cursor || 0) < 0 || (project.cursor || 0) > project.commands.length ||
      !project.annotations || typeof project.annotations !== 'object' || Array.isArray(project.annotations)) {
    return false;
  }

  const model = catalog[project.sourceModelId];
  const ids = new Set((model.components || []).map((component) => component.id));
  const transformEntries = Object.entries(project.componentTransforms);
  if (transformEntries.length > ids.size) return false;
  for (const [componentId, transform] of transformEntries) {
    if (!ids.has(componentId) || !sanitizeComponentTransform(transform)) return false;
  }
  for (const [key, annotation] of Object.entries(project.annotations)) {
    if (!ids.has(key) || typeof annotation !== 'string' || annotation.length > 4000) return false;
  }
  for (const command of project.commands) {
    if (!command || typeof command.id !== 'string' || !command.id ||
        !ids.has(command.componentId) ||
        typeof command.createdAt !== 'string' || Number.isNaN(Date.parse(command.createdAt)) ||
        !sanitizeComponentTransform(command.before) ||
        !sanitizeComponentTransform(command.after)) {
      return false;
    }
  }
  return true;
}

function cloneProject(project: WorkshopProject): WorkshopProject {
  return JSON.parse(JSON.stringify(project)) as WorkshopProject;
}

export function applyWorkshopTransform(
  project: WorkshopProject,
  object: ObjectMetadata,
  componentId: string,
  candidate: unknown,
  now = new Date().toISOString(),
): WorkshopProject {
  const component = object.components.find((item) => item.id === componentId);
  const after = sanitizeComponentTransform(candidate);
  if (!component || project.sourceModelId !== object.id || !after) return project;

  const current = project.componentTransforms[componentId] || canonicalComponentTransform(component);
  const before = cloneTransform(current);
  if (JSON.stringify(before) === JSON.stringify(after)) return project;

  let commands = project.commands.slice(0, project.cursor);
  commands.push({
    id: `cmd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    componentId,
    before,
    after: cloneTransform(after),
    createdAt: now,
  });
  if (commands.length > MAX_WORKSHOP_HISTORY) commands = commands.slice(-MAX_WORKSHOP_HISTORY);
  const next: WorkshopProject = {
    ...project,
    updatedAt: now,
    revision: project.revision + 1,
    componentTransforms: { ...project.componentTransforms, [componentId]: cloneTransform(after) },
    commands,
    cursor: commands.length,
  };
  return next;
}

export function undoWorkshopProject(project: WorkshopProject, now = new Date().toISOString()): WorkshopProject {
  if (project.cursor <= 0) return project;
  const command = project.commands[project.cursor - 1];
  return {
    ...project,
    updatedAt: now,
    revision: project.revision + 1,
    componentTransforms: { ...project.componentTransforms, [command.componentId]: cloneTransform(command.before) },
    cursor: project.cursor - 1,
  };
}

export function redoWorkshopProject(project: WorkshopProject, now = new Date().toISOString()): WorkshopProject {
  if (project.cursor >= project.commands.length) return project;
  const command = project.commands[project.cursor];
  return {
    ...project,
    updatedAt: now,
    revision: project.revision + 1,
    componentTransforms: { ...project.componentTransforms, [command.componentId]: cloneTransform(command.after) },
    cursor: project.cursor + 1,
  };
}

export function resetWorkshopProjectToSource(
  project: WorkshopProject,
  object: ObjectMetadata,
  now = new Date().toISOString(),
): WorkshopProject {
  if (project.sourceModelId !== object.id) return project;
  const transforms: Record<string, ComponentTransform> = {};
  for (const component of object.components || []) {
    transforms[component.id] = canonicalComponentTransform(component);
  }
  return {
    ...project,
    updatedAt: now,
    revision: project.revision + 1,
    componentTransforms: transforms,
    commands: [],
    cursor: 0,
    annotations: {},
  };
}

function readStore(catalog: Catalog): WorkshopProject[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(WORKSHOP_STORAGE_KEY);
    if (!raw || raw.length > MAX_WORKSHOP_IMPORT_CHARS * MAX_WORKSHOP_PROJECTS) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is WorkshopProject => validateWorkshopProject(item, catalog)).slice(0, MAX_WORKSHOP_PROJECTS);
  } catch {
    return [];
  }
}

/** Saves projects on the current device only; no account or remote sync is involved. */
export function saveWorkshopProject(project: WorkshopProject, catalog: Catalog): boolean {
  if (!canUseStorage() || !validateWorkshopProject(project, catalog)) return false;
  try {
    const projects = readStore(catalog).filter((candidate) => candidate.id !== project.id);
    projects.unshift(cloneProject(project));
    window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(projects.slice(0, MAX_WORKSHOP_PROJECTS)));
    return true;
  } catch {
    return false;
  }
}

export function loadWorkshopProjects(catalog: Catalog): WorkshopProject[] {
  return readStore(catalog);
}

export function deleteWorkshopProject(projectId: string, catalog: Catalog): boolean {
  if (!canUseStorage()) return false;
  try {
    const projects = readStore(catalog).filter((project) => project.id !== projectId);
    window.localStorage.setItem(WORKSHOP_STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function exportWorkshopProject(project: WorkshopProject): string {
  return JSON.stringify(project, null, 2);
}

export function importWorkshopProject(
  content: string,
  catalog: Catalog,
  requiredModelId?: string,
): { ok: true; project: WorkshopProject } | { ok: false; error: string } {
  if (content.length > MAX_WORKSHOP_IMPORT_CHARS) {
    return { ok: false, error: 'Project file exceeds the 2 MB import limit.' };
  }
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  if (!validateWorkshopProject(value, catalog)) {
    return { ok: false, error: 'Project schema or component references are invalid. The catalog model was not changed.' };
  }
  if (requiredModelId && value.sourceModelId !== requiredModelId) {
    return { ok: false, error: 'This project belongs to a different source model.' };
  }
  return { ok: true, project: cloneProject(value) };
}

export function createWorkshopProjectFromSource(
  object: ObjectMetadata,
  initialTransforms: Record<string, ComponentTransform> = {},
): WorkshopProject {
  const validTransforms: Record<string, ComponentTransform> = {};
  for (const component of object.components || []) {
    validTransforms[component.id] = sanitizeComponentTransform(initialTransforms[component.id]) || canonicalComponentTransform(component);
  }
  return createWorkshopProject(object, undefined, validTransforms);
}
