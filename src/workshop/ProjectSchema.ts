import type { ModelCapability, ModelEvidenceMetadata, ObjectMetadata } from '../SpatialLibrary';

export interface WorkshopComponentTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface AssemblyConstraintDefinition {
  id: string;
  type: 'FIXED' | 'HINGE' | 'SLIDER' | 'CONCENTRIC' | 'PARALLEL' | 'PERPENDICULAR';
  componentAId: string;
  componentBId: string;
  enabled: boolean;
  parameters?: Record<string, number>;
  note?: string;
}

export interface EditableModelProject {
  schemaVersion: 1;
  id: string;
  name: string;
  sourceModelId: string;
  sourceModelName: string;
  sourceModelVersion: string;
  sourceModelKind?: ObjectMetadata['modelKind'];
  sourceEvidence?: ModelEvidenceMetadata;
  createdAt: string;
  updatedAt: string;
  /** All edits are stored in this project document, never in SPATIAL_LIBRARY. */
  componentTransforms: Record<string, WorkshopComponentTransform>;
  hiddenComponentIds: string[];
  selectedComponentId: string | null;
  isolatedComponentId: string | null;
  explodedFactor: number;
  viewMode: 'SOLID' | 'GLASS' | 'BLUEPRINT';
  simulationParameters: Record<string, number>;
  constraints: AssemblyConstraintDefinition[];
  annotations: Array<{ id: string; text: string; componentId?: string; createdAt: string }>;
  notes: string;
  limitations: string[];
}

export interface EditableProjectSummary {
  id: string;
  name: string;
  sourceModelId: string;
  sourceModelName: string;
  sourceModelVersion: string;
  updatedAt: string;
}

export interface ProjectTransformCommand {
  id: string;
  componentId: string;
  before: WorkshopComponentTransform;
  after: WorkshopComponentTransform;
  committedAt: string;
}

export function canonicalTransformsForModel(model: ObjectMetadata): Record<string, WorkshopComponentTransform> {
  const transforms: Record<string, WorkshopComponentTransform> = {};
  for (const component of model.components || []) {
    transforms[component.id] = {
      position: [...component.position] as [number, number, number],
      rotation: [...(component.rotation || [0, 0, 0])] as [number, number, number],
      scale: [1, 1, 1],
    };
  }
  return transforms;
}

export function normalizeTransform(value: unknown): WorkshopComponentTransform | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<WorkshopComponentTransform>;
  const validTriple = (triple: unknown): triple is [number, number, number] =>
    Array.isArray(triple) && triple.length === 3 &&
    triple.every((entry) => typeof entry === 'number' && Number.isFinite(entry));
  if (!validTriple(candidate.position) || !validTriple(candidate.rotation) || !validTriple(candidate.scale)) return null;
  if (candidate.scale.some((entry) => entry <= 0 || entry > 1000)) return null;
  return {
    position: [...candidate.position],
    rotation: [...candidate.rotation],
    scale: [...candidate.scale],
  };
}

export function summarizeEditableProject(project: EditableModelProject): EditableProjectSummary {
  return {
    id: project.id,
    name: project.name,
    sourceModelId: project.sourceModelId,
    sourceModelName: project.sourceModelName,
    sourceModelVersion: project.sourceModelVersion,
    updatedAt: project.updatedAt,
  };
}
