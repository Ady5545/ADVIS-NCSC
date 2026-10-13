import type { ObjectMetadata, ComponentMetadata } from '../SpatialLibrary';

export type TransformTuple = [number, number, number];

export interface ComponentTransform {
  position: TransformTuple;
  rotation: TransformTuple;
  scale: TransformTuple;
}

export interface WorkshopCommand {
  id: string;
  componentId: string;
  before: ComponentTransform;
  after: ComponentTransform;
  createdAt: string;
}

export interface WorkshopProject {
  schemaVersion: 1;
  id: string;
  name: string;
  sourceModelId: string;
  sourceModelVersion: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  /** Transform-only derivative. It never mutates SPATIAL_LIBRARY or source assets. */
  componentTransforms: Record<string, ComponentTransform>;
  /** Command history is a reversible presentation/mesh-transform history, not a CAD feature tree. */
  commands: WorkshopCommand[];
  cursor: number;
  annotations: Record<string, string>;
}

export interface WorkshopImportResult {
  ok: boolean;
  project?: WorkshopProject;
  error?: string;
}

export function canonicalComponentTransform(component: ComponentMetadata): ComponentTransform {
  return {
    position: [...component.position] as TransformTuple,
    rotation: [...(component.rotation || [0, 0, 0])] as TransformTuple,
    scale: [1, 1, 1],
  };
}

export function cloneTransform(transform: ComponentTransform): ComponentTransform {
  return {
    position: [...transform.position] as TransformTuple,
    rotation: [...transform.rotation] as TransformTuple,
    scale: [...transform.scale] as TransformTuple,
  };
}

export function createWorkshopProject(
  object: ObjectMetadata,
  name?: string,
  initialTransforms: Record<string, ComponentTransform> = {},
  now = new Date().toISOString(),
): WorkshopProject {
  const componentTransforms: Record<string, ComponentTransform> = {};
  for (const component of object.components || []) {
    componentTransforms[component.id] = cloneTransform(
      initialTransforms[component.id] || canonicalComponentTransform(component),
    );
  }
  return {
    schemaVersion: 1,
    id: createWorkshopId(),
    name: (name || `${object.name} — My copy`).trim().slice(0, 120),
    sourceModelId: object.id,
    sourceModelVersion: object.modelVersion || 'unversioned-catalog-entry',
    createdAt: now,
    updatedAt: now,
    revision: 1,
    componentTransforms,
    commands: [],
    cursor: 0,
    annotations: {},
  };
}

function createWorkshopId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `wrk_${crypto.randomUUID()}`;
    }
  } catch {
    // Private browsing contexts may expose a restricted crypto implementation.
  }
  return `wrk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
