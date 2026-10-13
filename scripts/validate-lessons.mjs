import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-lesson-audit-'));
const lessonModule = join(temporaryDirectory, 'lesson-catalog.cjs');
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

try {
  await Promise.all([
    build({
      entryPoints: [resolve('src/learning/LessonCatalog.ts')],
      outfile: lessonModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/SpatialLibrary.ts')],
      outfile: spatialModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const { LEARNING_LESSONS } = require(lessonModule);
  const { SPATIAL_LIBRARY } = require(spatialModule);

  if (!Array.isArray(LEARNING_LESSONS) || LEARNING_LESSONS.length === 0) {
    fail('Lesson catalog must contain at least one lesson.');
  }

  const lessonIds = new Set();
  for (const lesson of LEARNING_LESSONS || []) {
    const label = lesson?.title || lesson?.id || 'unnamed lesson';
    if (!lesson?.id || typeof lesson.id !== 'string') fail(`[${label}] Missing stable lesson ID.`);
    if (lessonIds.has(lesson.id)) fail(`[${label}] Duplicate lesson ID: ${lesson.id}.`);
    lessonIds.add(lesson.id);

    if (!Number.isInteger(lesson.version) || lesson.version < 1) fail(`[${label}] Version must be a positive integer.`);
    if (!lesson.modelId || !SPATIAL_LIBRARY[lesson.modelId]) fail(`[${label}] References missing spatial model "${lesson.modelId}".`);
    if (!Array.isArray(lesson.learningObjectives) || lesson.learningObjectives.length === 0) fail(`[${label}] Must declare learning objectives.`);
    if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) fail(`[${label}] Must contain steps.`);
    if (!Array.isArray(lesson.limitations) || lesson.limitations.length === 0) warn(`[${label}] No explicit limitations are documented.`);
    if (!Array.isArray(lesson.sourceReferences) || lesson.sourceReferences.length === 0) warn(`[${label}] No external references are attached; authored content must remain labelled draft until reviewed.`);
    if (lesson.authoringStatus === 'EVIDENCE_REVIEWED' && (!lesson.reviewedBy || !lesson.reviewedAt || !lesson.sourceReferences?.length)) {
      fail(`[${label}] Evidence-reviewed status needs reviewer, date and references.`);
    }

    const stepIds = new Set();
    const questionIds = new Set();
    for (const step of lesson.steps || []) {
      if (!step?.id || typeof step.id !== 'string') fail(`[${label}] Step has no stable ID.`);
      if (stepIds.has(step.id)) fail(`[${label}] Duplicate step ID "${step.id}".`);
      stepIds.add(step.id);
      if (!step.title || !step.objective || !step.explanation || !step.learnerTask) {
        fail(`[${label} / ${step.id}] Every step needs a title, objective, explanation and learner task.`);
      }

      const question = step.question;
      if (question) {
        if (!question.id || questionIds.has(question.id)) fail(`[${label} / ${step.id}] Missing or duplicate question ID.`);
        questionIds.add(question.id);
        const choices = Array.isArray(question.choices) ? question.choices : [];
        const choiceIds = new Set(choices.map((choice) => choice.id));
        if (choices.length < 2) fail(`[${label} / ${step.id}] Question needs at least two choices.`);
        if (choiceIds.size !== choices.length) fail(`[${label} / ${step.id}] Question contains duplicate choice IDs.`);
        if (!choiceIds.has(question.correctChoiceId)) fail(`[${label} / ${step.id}] correctChoiceId does not match a choice.`);
        if (!question.explanation) fail(`[${label} / ${step.id}] Question needs explanatory feedback.`);
      }

      const rule = step.completionRule;
      if (!rule?.type) fail(`[${label} / ${step.id}] Missing completion rule.`);
      if (rule?.type === 'SELECT_COMPONENT') {
        const validComponents = new Set((SPATIAL_LIBRARY[lesson.modelId]?.components || []).map((component) => component.id));
        if (!validComponents.has(rule.componentId)) fail(`[${label} / ${step.id}] Completion references missing component "${rule.componentId}".`);
      }
      if (rule?.type === 'ANSWER_QUESTION' && !questionIds.has(rule.questionId)) {
        // A lesson may reference only a question on this same step; later-question references are not supported.
        if (rule.questionId !== question?.id) fail(`[${label} / ${step.id}] Completion references a question that is not present on this step.`);
      }

      const action = step.action;
      if (action?.type === 'SELECT_COMPONENT') {
        const validComponents = new Set((SPATIAL_LIBRARY[lesson.modelId]?.components || []).map((component) => component.id));
        if (!validComponents.has(action.componentId)) fail(`[${label} / ${step.id}] Action references missing component "${action.componentId}".`);
      }
      if (action?.type === 'SET_EXPLOSION' && (!Number.isFinite(action.factor) || action.factor < 0 || action.factor > 1)) {
        fail(`[${label} / ${step.id}] Explosion factor must be between 0 and 1.`);
      }
      if (action?.type === 'SET_RPM' && (!Number.isFinite(action.rpm) || action.rpm < 0)) {
        fail(`[${label} / ${step.id}] RPM action must be finite and non-negative.`);
      }
      if (action?.type === 'SCRUB_CYCLE' && (!Number.isFinite(action.angleDeg) || action.angleDeg < 0 || action.angleDeg > 720)) {
        fail(`[${label} / ${step.id}] Cycle angle must be in the 0-720 degree teaching range.`);
      }
    }
  }

  console.log(`Lesson catalog audit: ${lessonIds.size} lessons checked.`);
  console.log(`Structural errors: ${errors.length}; content-review warnings: ${warnings.length}.`);
  for (const message of warnings) console.warn(`WARN: ${message}`);
  for (const message of errors) console.error(`ERROR: ${message}`);

  if (errors.length > 0) process.exitCode = 1;
  else console.log('Lesson structural checks passed. Warnings indicate content that still needs subject-matter review.');
} catch (error) {
  console.error('Lesson audit could not complete:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
