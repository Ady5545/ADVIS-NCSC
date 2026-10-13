import type { ModelCapability, ObjectMetadata } from '../SpatialLibrary';

export type ModelCapabilityState = 'SUPPORTED' | 'NOT_SUPPORTED' | 'NOT_DECLARED';

export interface ModelCapabilityMatrixRow {
  modelId: string;
  modelName: string;
  modelKind: string;
  dimensionsStatus: string;
  simulationStatus: string;
  capabilities: Record<ModelCapability, ModelCapabilityState>;
  warnings: string[];
}

export const ALL_MODEL_CAPABILITIES: ModelCapability[] = [
  'inspect',
  'componentHierarchy',
  'hideShow',
  'isolate',
  'explode',
  'transparency',
  'blueprint',
  'sectionPlane',
  'measure',
  'kinematics',
  'validatedSimulation',
  'parameterEditing',
  'guidedLessons',
  'saveProject',
  'exportGlb',
  'exportStep',
  'deepZoom',
  'interiorGeometry',
];

export function resolveModelCapabilityMatrix(
  catalog: Record<string, ObjectMetadata>,
): ModelCapabilityMatrixRow[] {
  return Object.entries(catalog).map(([catalogId, object]) => {
    const capabilities = {} as Record<ModelCapability, ModelCapabilityState>;
    for (const key of ALL_MODEL_CAPABILITIES) {
      const value = object.capabilities?.[key];
      capabilities[key] = value === true
        ? 'SUPPORTED'
        : value === false
          ? 'NOT_SUPPORTED'
          : 'NOT_DECLARED';
    }
    const warnings: string[] = [];
    if (object.capabilities?.validatedSimulation === true &&
        object.evidence?.simulationStatus !== 'BENCHMARK_VALIDATED') {
      warnings.push('Validated simulation is advertised without benchmark-validation metadata.');
    }
    if (object.capabilities?.exportStep === true &&
        object.evidence?.geometryAuthority !== 'SOURCE_CAD') {
      warnings.push('STEP export is advertised without a source-CAD geometry declaration.');
    }
    if (object.capabilities?.sectionPlane === true &&
        object.capabilities?.interiorGeometry === false) {
      warnings.push('Section plane is enabled but the model explicitly declares no interior geometry; review whether clipping is only a presentation plane.');
    }
    if (catalogId !== object.id) {
      warnings.push('Catalog key does not match the stable model ID.');
    }
    return {
      modelId: object.id,
      modelName: object.name,
      modelKind: object.modelKind || 'NOT_DECLARED',
      dimensionsStatus: object.evidence?.dimensionsStatus || 'NOT_DECLARED',
      simulationStatus: object.evidence?.simulationStatus || 'NOT_DECLARED',
      capabilities,
      warnings,
    };
  }).sort((a, b) => a.modelName.localeCompare(b.modelName));
}
