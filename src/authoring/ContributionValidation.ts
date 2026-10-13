import type { ObjectMetadata } from '../SpatialLibrary';
import type { LearningLesson } from '../learning/LessonSchema';

export type SubmissionKind = 'MODEL' | 'LESSON';
export type ReviewStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';

export interface ContributionReview {
  id: string;
  kind: SubmissionKind;
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  status: ReviewStatus;
  license: string;
  attribution: string;
  changeNotes: string;
  reviewer?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  payloadId: string;
}

export interface ContributionValidationIssue {
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
}

const urlPattern = /^https:\/\//i;
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateModelSubmission(model: ObjectMetadata): ContributionValidationIssue[] {
  const issues: ContributionValidationIssue[] = [];
  if (!nonEmpty(model.id) || !/^[a-z0-9][a-z0-9._-]*$/.test(model.id)) {
    issues.push({ severity: 'ERROR', code: 'MODEL_ID', message: 'Model ID must be a stable lowercase identifier using letters, numbers, dots, underscores or hyphens.' });
  }
  if (!nonEmpty(model.name) || !nonEmpty(model.category) || !nonEmpty(model.description)) {
    issues.push({ severity: 'ERROR', code: 'MODEL_METADATA', message: 'Model name, domain/category and description are required.' });
  }
  if (!nonEmpty(model.evidence?.license)) {
    issues.push({ severity: 'ERROR', code: 'LICENSE', message: 'A license must be recorded before contribution review.' });
  }
  if (!nonEmpty(model.evidence?.attribution) && model.evidence?.license !== 'CC0-1.0' && model.evidence?.license !== 'CC-BY-4.0') {
    issues.push({ severity: 'WARNING', code: 'ATTRIBUTION', message: 'Add creator/source attribution; a license label alone may not be sufficient.' });
  }
  if (!model.evidence?.references?.length) {
    issues.push({ severity: 'WARNING', code: 'REFERENCES', message: 'No source references are attached; scientific claims must stay illustrative or unknown.' });
  }
  if (!Array.isArray(model.components) || model.components.length === 0) {
    issues.push({ severity: 'ERROR', code: 'COMPONENTS', message: 'A contributed model must define at least one component.' });
  } else {
    const ids = new Set<string>();
    for (const component of model.components) {
      if (!nonEmpty(component.id) || ids.has(component.id)) {
        issues.push({ severity: 'ERROR', code: 'COMPONENT_ID', message: `Component ID "${component?.id || '(missing)'}" is missing or duplicated.` });
      }
      if (component?.id) ids.add(component.id);
      if (component?.parentId && !model.components.some((candidate) => candidate.id === component.parentId)) {
        issues.push({ severity: 'ERROR', code: 'PARENT_REFERENCE', message: `Component "${component.id}" references missing parent "${component.parentId}".` });
      }
      for (const connectionId of component?.connectionIds || []) {
        if (!model.components.some((candidate) => candidate.id === connectionId)) {
          issues.push({ severity: 'ERROR', code: 'CONNECTION_REFERENCE', message: `Component "${component.id}" references missing connection "${connectionId}".` });
        }
      }
      if (component?.assetPath && !component.assetPath.startsWith('/') && !component.assetPath.startsWith('procedural/') && !urlPattern.test(component.assetPath)) {
        issues.push({ severity: 'WARNING', code: 'ASSET_PATH', message: `Asset path for "${component.id}" is not a recognized app-relative or HTTPS path.` });
      }
    }
  }
  if (model.capabilities?.validatedSimulation === true &&
      model.evidence?.simulationStatus !== 'BENCHMARK_VALIDATED') {
    issues.push({ severity: 'ERROR', code: 'SIMULATION_CLAIM', message: 'A validated simulation capability requires benchmark-validation evidence.' });
  }
  if (model.capabilities?.exportStep === true && model.modelKind !== 'CAD_BREP_ASSEMBLY') {
    issues.push({ severity: 'ERROR', code: 'STEP_EXPORT_CLAIM', message: 'STEP export may only be declared when a validated CAD/B-rep path exists.' });
  }
  return issues;
}

export function validateLessonSubmission(
  lesson: LearningLesson,
  availableModelIds: ReadonlySet<string>,
): ContributionValidationIssue[] {
  const issues: ContributionValidationIssue[] = [];
  if (!nonEmpty(lesson.id) || !/^[a-z0-9][a-z0-9-]*$/.test(lesson.id)) {
    issues.push({ severity: 'ERROR', code: 'LESSON_ID', message: 'Lesson ID must be a stable lowercase kebab-case identifier.' });
  }
  if (!Number.isInteger(lesson.version) || lesson.version < 1) {
    issues.push({ severity: 'ERROR', code: 'LESSON_VERSION', message: 'Lesson version must be a positive integer.' });
  }
  if (!availableModelIds.has(lesson.modelId)) {
    issues.push({ severity: 'ERROR', code: 'LESSON_MODEL', message: `Lesson model "${lesson.modelId}" is not registered.` });
  }
  if (!lesson.learningObjectives?.length || !lesson.steps?.length) {
    issues.push({ severity: 'ERROR', code: 'LEARNING_CONTENT', message: 'At least one learning objective and one lesson step are required.' });
  }
  if (!lesson.sourceReferences?.length) {
    issues.push({ severity: 'WARNING', code: 'LESSON_SOURCES', message: 'Attach teaching references or explicitly label the lesson as illustrative/draft.' });
  }
  if (lesson.authoringStatus === 'EVIDENCE_REVIEWED' &&
      (!nonEmpty(lesson.reviewedBy) || !nonEmpty(lesson.reviewedAt) || !lesson.sourceReferences.some((reference) => nonEmpty(reference.url)))) {
    issues.push({ severity: 'ERROR', code: 'REVIEW_EVIDENCE', message: 'Evidence-reviewed lessons require a reviewer, date and at least one source URL.' });
  }
  const stepIds = new Set<string>();
  for (const step of lesson.steps || []) {
    if (!nonEmpty(step.id) || stepIds.has(step.id)) {
      issues.push({ severity: 'ERROR', code: 'STEP_ID', message: `Step ID "${step?.id || '(missing)'}" is missing or duplicated.` });
    }
    if (step?.id) stepIds.add(step.id);
    if (step?.completionRule?.type === 'SELECT_COMPONENT' && !step.completionRule.componentId) {
      issues.push({ severity: 'ERROR', code: 'STEP_TARGET', message: `Step "${step.id}" has an empty component target.` });
    }
    if (step?.question) {
      const choices = step.question.choices || [];
      const choiceIds = new Set(choices.map((choice) => choice.id));
      if (choices.length < 2 || choiceIds.size !== choices.length || !choiceIds.has(step.question.correctChoiceId)) {
        issues.push({ severity: 'ERROR', code: 'QUESTION_CHOICES', message: `Question "${step.question.id}" has invalid choices or correctChoiceId.` });
      }
    }
  }
  return issues;
}

export function canPublishContribution(
  status: ReviewStatus,
  issues: ContributionValidationIssue[],
  reviewer: string | undefined,
  reviewedAt: string | undefined,
): boolean {
  return status === 'APPROVED' &&
    Boolean(reviewer?.trim()) &&
    Boolean(reviewedAt && !Number.isNaN(Date.parse(reviewedAt))) &&
    !issues.some((issue) => issue.severity === 'ERROR');
}
