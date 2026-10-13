import type { ObjectMetadata } from '../SpatialLibrary';

type CapabilityReasonKey =
  | 'componentHierarchy' | 'hideIsolate' | 'explosion' | 'glassView' | 'blueprintView'
  | 'sectionPlane' | 'kinematicMotion' | 'numericalSimulation' | 'measurement' | 'lesson'
  | 'editableCopy' | 'undoRedo' | 'gltfExport' | 'cadExport';

export interface ModelCapabilityDescriptor {
  orbit: boolean;
  selection: boolean;
  componentHierarchy: boolean;
  hideIsolate: boolean;
  explosion: boolean;
  glassView: boolean;
  blueprintView: boolean;
  sectionPlane: boolean;
  kinematicMotion: boolean;
  numericalSimulation: boolean;
  measurement: boolean;
  lesson: boolean;
  editableCopy: boolean;
  undoRedo: boolean;
  gltfExport: boolean;
  cadExport: boolean;
  reasonUnavailable: Partial<Record<CapabilityReasonKey, string>>;
}

function hasMeaningfulOffset(offset: unknown): boolean {
  return Array.isArray(offset) && offset.length === 3 &&
    offset.every((value) => typeof value === 'number' && Number.isFinite(value)) &&
    offset.some((value) => Math.abs(value) > 1e-6);
}

/**
 * Capabilities are conservative: animations and file extensions do not prove
 * validated physics, true sectioning, editable CAD, or a particular export path.
 * A model may opt in only through explicit metadata.capabilities booleans.
 */
export function resolveModelCapabilities(model: ObjectMetadata): ModelCapabilityDescriptor {
  const explicit = (model.metadata?.capabilities || {}) as Record<string, unknown>;
  const components = model.components || [];
  const hasHierarchy = components.some((component) =>
    typeof (component as typeof component & { parentId?: unknown }).parentId === 'string' ||
    Array.isArray((component as typeof component & { childrenIds?: unknown }).childrenIds)
  );
  const explosion = Boolean(
    (model.explodedParts && model.explodedParts.length > 0) ||
    components.some((component) => hasMeaningfulOffset(component.explodedOffset))
  );

  const enabled = (key: string, fallback = false) =>
    typeof explicit[key] === 'boolean' ? explicit[key] === true : fallback;

  const sectionPlane = enabled('sectionPlane');
  const kinematicMotion = enabled('kinematicMotion');
  const numericalSimulation = enabled('numericalSimulation');
  const measurement = enabled('measurement');
  const lesson = enabled('lesson');
  const editableCopy = enabled('editableCopy');
  const undoRedo = enabled('undoRedo');
  const gltfExport = enabled('gltfExport');
  const cadExport = enabled('cadExport');

  const reasonUnavailable: ModelCapabilityDescriptor['reasonUnavailable'] = {};
  if (!sectionPlane) reasonUnavailable.sectionPlane = 'No verified section-plane implementation is registered for this model.';
  if (!kinematicMotion) reasonUnavailable.kinematicMotion = 'No model-specific kinematic contract has been declared.';
  if (!numericalSimulation) reasonUnavailable.numericalSimulation = 'No validated numerical simulation contract has been declared.';
  if (!lesson) reasonUnavailable.lesson = 'No reviewed lesson is registered for this model.';
  if (!editableCopy) reasonUnavailable.editableCopy = 'Editable-copy workflow is not enabled for this model yet.';
  if (!undoRedo) reasonUnavailable.undoRedo = 'Project edit history is not enabled for this model yet.';
  if (!gltfExport) reasonUnavailable.gltfExport = 'GLB/glTF export has not been enabled for this model.';
  if (!cadExport) reasonUnavailable.cadExport = 'No validated native CAD export path is registered for this model.';

  return {
    orbit: true,
    selection: components.length > 0,
    componentHierarchy: hasHierarchy,
    hideIsolate: components.length > 0,
    explosion,
    glassView: true,
    blueprintView: true,
    sectionPlane,
    kinematicMotion,
    numericalSimulation,
    measurement,
    lesson,
    editableCopy,
    undoRedo,
    gltfExport,
    cadExport,
    reasonUnavailable,
  };
}
