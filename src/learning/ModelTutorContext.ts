import type { ObjectMetadata } from '../SpatialLibrary';
import type { ScientificSystemModel, ScientificValidationLevel } from '../scientific/ScientificSchema';

export type EvidenceKind = 'SOURCE_BACKED' | 'MODEL_DERIVED' | 'ILLUSTRATIVE' | 'UNKNOWN';

export interface TutorEvidenceItem {
  id: string;
  label: string;
  kind: EvidenceKind;
  detail: string;
  sourceUrl?: string;
  applicability?: 'EXACT_MODEL' | 'RELATED_MODEL' | 'GENERAL_PRINCIPLE' | 'ILLUSTRATIVE';
}

export interface ModelTutorContext {
  modelId: string;
  modelName: string;
  modelVersion: string;
  domain: string;
  selectedComponentId: string | null;
  selectedComponentName: string | null;
  selectedComponentPurpose: string | null;
  relationships: Array<{ componentId: string; name: string; relationship: string; description: string }>;
  parameters: Array<{ id: string; name: string; unit: string; value: number; description: string }>;
  evidence: TutorEvidenceItem[];
  simulationLevel: ScientificValidationLevel | 'NONE';
  limitations: string[];
  safeActions: Array<'SELECT_COMPONENT' | 'SET_EXPLOSION' | 'SET_VIEW_MODE' | 'FOCUS_COMPONENT' | 'OPEN_LESSON'>;
}

export type TutorSuggestedAction =
  | { type: 'SELECT_COMPONENT'; componentId: string }
  | { type: 'FOCUS_COMPONENT'; componentId: string }
  | { type: 'SET_EXPLOSION'; factor: number }
  | { type: 'SET_VIEW_MODE'; mode: 'SOLID' | 'GLASS' | 'BLUEPRINT' }
  | { type: 'OPEN_LESSON'; lessonId: string };

export interface TutorActionValidation {
  accepted: TutorSuggestedAction[];
  rejected: Array<{ action: unknown; reason: string }>;
}

export function buildModelTutorContext(
  object: ObjectMetadata,
  selectedComponentId: string | null,
  options: {
    scientificModel?: ScientificSystemModel | null;
    scientificVariables?: Record<string, number>;
    scientificParameters?: Record<string, number>;
  } = {},
): ModelTutorContext {
  const component = object.components.find((entry) => entry.id === selectedComponentId) || null;
  const evidence: TutorEvidenceItem[] = [];
  const references = object.evidence?.references || [];
  for (const [index, reference] of references.entries()) {
    evidence.push({
      id: `model-reference-${index + 1}`,
      label: reference.label,
      kind: reference.url ? 'SOURCE_BACKED' : 'UNKNOWN',
      detail: reference.citation || reference.label,
      ...(reference.url ? { sourceUrl: reference.url } : {}),
      ...(reference.applicability ? { applicability: reference.applicability } : {}),
    });
  }
  if (object.description) {
    evidence.push({
      id: 'model-description',
      label: 'Catalog description',
      kind: object.modelKind === 'SOURCED_VISUAL_ASSET' && references.some((r) => r.url) ? 'SOURCE_BACKED' : 'ILLUSTRATIVE',
      detail: object.description,
    });
  }
  if (component) {
    evidence.push({
      id: `component-${component.id}`,
      label: component.name,
      kind: component.engineeringDetails?.evidenceStatus ? 'ILLUSTRATIVE' : 'UNKNOWN',
      detail: component.description,
    });
  }
  const scientific = options.scientificModel;
  if (scientific) {
    evidence.push({
      id: 'simulation-assumptions',
      label: 'Simulation assumptions and limitations',
      kind: 'ILLUSTRATIVE',
      detail: [
        `Validation level: ${scientific.simulation.validation?.level || 'not specified'}.`,
        ...(scientific.simulation.validation?.assumptions || []),
        ...(scientific.simulation.validation?.limitations || []),
      ].join(' '),
    });
  }
  const relationshipComponents = component && scientific
    ? scientific.relationships
      .filter((relationship) => relationship.sourceId === component.id || relationship.targetId === component.id)
      .map((relationship) => {
        const otherId = relationship.sourceId === component.id ? relationship.targetId : relationship.sourceId;
        const other = scientific.components[otherId];
        return {
          componentId: otherId,
          name: other?.name || otherId,
          relationship: relationship.type,
          description: relationship.description,
        };
      })
    : [];
  const parameters = scientific
    ? Object.entries(scientific.simulation.parameters).map(([id, value]) => ({
        id,
        name: scientific.simulation.parameterDefinitions?.[id]?.name || id,
        unit: scientific.simulation.parameterDefinitions?.[id]?.unit || 'unit unspecified',
        value,
        description: scientific.simulation.parameterDefinitions?.[id]?.description || 'No parameter description is recorded.',
      }))
    : [];
  const limitations = [
    ...(object.evidence?.limitations || []),
    ...(object.educationalInformation?.specifications ? ['Specifications are only source-backed when a specific evidence link and applicability are recorded.'] : []),
    ...(scientific?.simulation.validation?.limitations || []),
  ];
  if (!references.some((reference) => reference.url)) limitations.push('No source URL is recorded for this model in the catalog; do not invent exact specifications.');
  return {
    modelId: object.id,
    modelName: object.name,
    modelVersion: object.modelVersion || 'unversioned',
    domain: object.category,
    selectedComponentId: component?.id || null,
    selectedComponentName: component?.name || null,
    selectedComponentPurpose: component?.description || null,
    relationships: relationshipComponents,
    parameters,
    evidence,
    simulationLevel: scientific?.simulation.validation?.level || object.evidence?.simulationStatus || 'NONE',
    limitations: [...new Set(limitations)],
    safeActions: ['SELECT_COMPONENT', 'SET_EXPLOSION', 'SET_VIEW_MODE', 'FOCUS_COMPONENT', 'OPEN_LESSON'],
  };
}

export function validateTutorSuggestedActions(
  proposed: unknown,
  context: ModelTutorContext,
  allowedLessonIds: ReadonlySet<string> = new Set(),
): TutorActionValidation {
  const actions = Array.isArray(proposed) ? proposed : [proposed];
  const accepted: TutorSuggestedAction[] = [];
  const rejected: TutorActionValidation['rejected'] = [];
  const componentIds = new Set(context.evidence.filter((item) => item.id.startsWith('component-')).map((item) => item.id.slice('component-'.length)));
  for (const action of actions) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) {
      rejected.push({ action, reason: 'Action must be a structured object.' });
      continue;
    }
    const candidate = action as Record<string, unknown>;
    switch (candidate.type) {
      case 'SELECT_COMPONENT':
      case 'FOCUS_COMPONENT':
        if (typeof candidate.componentId !== 'string' || !componentIds.has(candidate.componentId)) {
          rejected.push({ action, reason: 'Component is not part of the currently selected component context.' });
        } else accepted.push({ type: candidate.type, componentId: candidate.componentId });
        break;
      case 'SET_EXPLOSION':
        if (typeof candidate.factor !== 'number' || !Number.isFinite(candidate.factor) || candidate.factor < 0 || candidate.factor > 1) {
          rejected.push({ action, reason: 'Explosion factor must be a finite number from 0 to 1.' });
        } else accepted.push({ type: 'SET_EXPLOSION', factor: candidate.factor });
        break;
      case 'SET_VIEW_MODE':
        if (candidate.mode !== 'SOLID' && candidate.mode !== 'GLASS' && candidate.mode !== 'BLUEPRINT') {
          rejected.push({ action, reason: 'View mode is not supported.' });
        } else accepted.push({ type: 'SET_VIEW_MODE', mode: candidate.mode });
        break;
      case 'OPEN_LESSON':
        if (typeof candidate.lessonId !== 'string' || !allowedLessonIds.has(candidate.lessonId)) {
          rejected.push({ action, reason: 'Lesson is not in the validated lesson allowlist.' });
        } else accepted.push({ type: 'OPEN_LESSON', lessonId: candidate.lessonId });
        break;
      default:
        rejected.push({ action, reason: 'Action type is not on the reversible UI allowlist.' });
    }
  }
  return { accepted, rejected };
}

export function buildOfflineTutorFallback(context: ModelTutorContext, userQuestion: string): string {
  const question = userQuestion.trim();
  const selection = context.selectedComponentName
    ? `Selected component: ${context.selectedComponentName}. ${context.selectedComponentPurpose || ''}`
    : `Current model: ${context.modelName}.`;
  const evidenceText = context.evidence.length
    ? context.evidence.slice(0, 4).map((item) => `[${item.kind}] ${item.label}: ${item.detail}`).join('\n')
    : 'No model evidence is recorded.';
  const limitText = context.limitations.slice(0, 4).map((item) => `- ${item}`).join('\n');
  return [
    `Offline learning fallback for: ${question || 'model overview'}`,
    selection,
    'Evidence available in this session:',
    evidenceText,
    'Important limitations:',
    limitText || '- No specific limitations were recorded; treat unsourced specifications as unknown.',
    'This fallback uses catalog context only; it does not perform web retrieval or claim to be a source-verified answer.',
  ].join('\n');
}
