import type { ObjectMetadata, ModelCapability } from '../SpatialLibrary';

export type CapabilityStatus = 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';

export interface CapabilityRow {
  id: string;
  name: string;
  domain: string;
  modelStatus: ObjectMetadata['modelStatus'];
  componentCount: number;
  geometrySource: string;
  dimensionsStatus: string;
  simulationStatus: string;
  hasLesson: boolean;
  capabilities: Record<ModelCapability, CapabilityStatus>;
  platform: {
    componentSelection: CapabilityStatus;
    componentInspector: CapabilityStatus;
    visualTransformCopy: CapabilityStatus;
    localProjectSave: CapabilityStatus;
    jsonProjectImportExport: CapabilityStatus;
  };
  limitations: string[];
}

const capabilityKeys: ModelCapability[] = [
  'inspect', 'componentHierarchy', 'hideShow', 'isolate', 'explode', 'transparency',
  'blueprint', 'sectionPlane', 'measure', 'kinematics', 'validatedSimulation',
  'parameterEditing', 'guidedLessons', 'saveProject', 'exportGlb', 'exportStep',
  'deepZoom', 'interiorGeometry',
];

function declaredCapability(model: ObjectMetadata, capability: ModelCapability): CapabilityStatus {
  const value = model.capabilities?.[capability];
  return value === true ? 'SUPPORTED' : value === false ? 'UNSUPPORTED' : 'UNKNOWN';
}

export function buildModelCapabilityMatrix(
  catalog: Record<string, ObjectMetadata>,
  lessons: ReadonlyArray<{ modelId: string }>,
): CapabilityRow[] {
  const lessonModelIds = new Set(lessons.map((lesson) => lesson.modelId));
  return Object.entries(catalog).map(([catalogKey, model]) => {
    const componentCount = Array.isArray(model.components) ? model.components.length : 0;
    const componentState: CapabilityStatus = componentCount > 0 ? 'SUPPORTED' : 'UNSUPPORTED';
    const available = model.modelStatus === 'AVAILABLE';
    const geometrySource = model.evidence?.geometryAuthority ||
      (model.modelKind === 'SOURCED_VISUAL_ASSET' ? 'SOURCED_VISUAL' :
        model.modelKind === 'CAD_BREP_ASSEMBLY' ? 'CAD_BREP' :
          model.modelKind === 'SCIENTIFIC_CONCEPT_MODEL' ? 'SCIENTIFIC_APPROXIMATION' :
            model.modelKind === 'SCHEMATIC' ? 'SCHEMATIC' : model.modelKind === 'PROCEDURAL_EDUCATIONAL_MODEL' ? 'PROCEDURAL' : 'UNSPECIFIED');
    const capabilities = Object.fromEntries(
      capabilityKeys.map((key) => [key, declaredCapability(model, key)]),
    ) as Record<ModelCapability, CapabilityStatus>;
    const limitations = [...new Set([
      ...(model.evidence?.limitations || []),
      ...(model.educationalInformation?.specifications
        ? ['Catalog specifications are only authoritative when matching source evidence is recorded.']
        : []),
      ...(geometrySource === 'PROCEDURAL' || geometrySource === 'SCIENTIFIC_APPROXIMATION'
        ? ['Visual/procedural geometry does not establish manufacturing-grade CAD.']
        : []),
      ...(model.capabilities?.validatedSimulation === true && model.evidence?.simulationStatus !== 'BENCHMARK_VALIDATED'
        ? ['A validated-simulation capability is declared without benchmark validation metadata.']
        : []),
    ])];

    return {
      id: model.id || catalogKey,
      name: model.name || catalogKey,
      domain: model.category || 'Unspecified domain',
      modelStatus: model.modelStatus,
      componentCount,
      geometrySource,
      dimensionsStatus: model.evidence?.dimensionsStatus || 'UNSPECIFIED',
      simulationStatus: model.evidence?.simulationStatus || 'NOT_DECLARED',
      hasLesson: lessonModelIds.has(model.id),
      capabilities,
      platform: {
        componentSelection: componentState,
        componentInspector: componentState,
        // These are visual document operations, not CAD feature-tree editing.
        visualTransformCopy: componentState,
        localProjectSave: componentState,
        jsonProjectImportExport: componentState,
      },
      limitations,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export interface CapabilityMatrixIssue {
  severity: 'ERROR' | 'WARNING';
  modelId: string;
  code: string;
  message: string;
}

export function validateModelCapabilityMatrix(
  catalog: Record<string, ObjectMetadata>,
  lessons: ReadonlyArray<{ modelId: string }>,
): CapabilityMatrixIssue[] {
  const issues: CapabilityMatrixIssue[] = [];
  const lessonModelIds = new Set(lessons.map((lesson) => lesson.modelId));
  for (const [catalogKey, model] of Object.entries(catalog)) {
    const id = model?.id || catalogKey;
    if (catalogKey !== id) {
      issues.push({ severity: 'ERROR', modelId: id, code: 'CATALOG_ID_MISMATCH', message: `Catalog key "${catalogKey}" differs from model ID "${id}".` });
    }
    if (!Array.isArray(model?.components)) {
      issues.push({ severity: 'ERROR', modelId: id, code: 'COMPONENTS_MISSING', message: 'Model components must be an array.' });
      continue;
    }
    const ids = new Set<string>();
    for (const component of model.components) {
      if (!component?.id || ids.has(component.id)) {
        issues.push({ severity: 'ERROR', modelId: id, code: 'COMPONENT_ID', message: `Component ID "${component?.id || '(missing)'}" is missing or duplicated.` });
      }
      if (component?.id) ids.add(component.id);
      for (const link of component?.connectionIds || []) {
        if (!model.components.some((candidate) => candidate.id === link)) {
          issues.push({ severity: 'ERROR', modelId: id, code: 'MISSING_CONNECTION', message: `Component "${component.id}" references missing connection "${link}".` });
        }
      }
    }
    if (model.capabilities?.validatedSimulation === true && model.evidence?.simulationStatus !== 'BENCHMARK_VALIDATED') {
      issues.push({ severity: 'ERROR', modelId: id, code: 'UNSUPPORTED_VALIDATION_CLAIM', message: 'Validated simulation requires benchmark validation metadata.' });
    }
    if (model.capabilities?.exportStep === true && model.modelKind !== 'CAD_BREP_ASSEMBLY') {
      issues.push({ severity: 'ERROR', modelId: id, code: 'UNSUPPORTED_STEP_EXPORT', message: 'STEP export requires a CAD/B-rep model kind.' });
    }
    if (model.modelStatus === 'AVAILABLE' && model.components.length === 0) {
      issues.push({ severity: 'WARNING', modelId: id, code: 'EMPTY_AVAILABLE_MODEL', message: 'An available catalog model has no inspectable components.' });
    }
    if (model.capabilities?.guidedLessons === true && !lessonModelIds.has(id)) {
      issues.push({ severity: 'ERROR', modelId: id, code: 'LESSON_CAPABILITY_MISMATCH', message: 'guidedLessons is enabled but no authored lesson references this model ID.' });
    }
  }

  for (const lessonModelId of lessonModelIds) {
    if (!catalog[lessonModelId]) {
      issues.push({ severity: 'ERROR', modelId: lessonModelId, code: 'LESSON_MODEL_MISSING', message: 'An authored lesson references a model missing from the catalog.' });
    }
  }
  return issues;
}
