import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temp = await mkdtemp(join(process.cwd(), '.advis-accessibility-authoring-'));
const modules = {
  spatial: join(temp, 'spatial-library.cjs'),
  lessons: join(temp, 'lesson-catalog.cjs'),
  preferences: join(temp, 'quality-profiles.cjs'),
  authoring: join(temp, 'contribution-validation.cjs'),
  tutor: join(temp, 'model-tutor-context.cjs'),
  offline: join(temp, 'offline-learning-pack.cjs'),
  capabilities: join(temp, 'capability-matrix.cjs'),
};

async function bundle(entryPoint, outfile) {
  await build({
    entryPoints: [resolve(entryPoint)],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: false,
    logLevel: 'silent',
  });
}

try {
  await Promise.all([
    bundle('src/SpatialLibrary.ts', modules.spatial),
    bundle('src/learning/LessonCatalog.ts', modules.lessons),
    bundle('src/accessibility/QualityProfiles.ts', modules.preferences),
    bundle('src/authoring/ContributionValidation.ts', modules.authoring),
    bundle('src/learning/ModelTutorContext.ts', modules.tutor),
    bundle('src/learning/OfflineLearningPack.ts', modules.offline),
    bundle('src/models/ModelCapabilityMatrix.ts', modules.capabilities),
  ]);

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(modules.spatial);
  const { LEARNING_LESSONS } = require(modules.lessons);
  const preferences = require(modules.preferences);
  const authoring = require(modules.authoring);
  const tutor = require(modules.tutor);
  const offline = require(modules.offline);
  const capabilities = require(modules.capabilities);

  // Quality profiles: invalid inputs fail back to Balanced, settings are validated and persisted.
  assert.deepEqual(
    Object.keys(preferences.QUALITY_PROFILES).sort(),
    ['BALANCED', 'HIGH', 'LOW', 'ULTRA'],
  );
  assert.equal(preferences.resolveQualityPreset('GPU-UNLOCK'), 'BALANCED');
  assert.equal(preferences.QUALITY_PROFILES.LOW.postProcessing, false);
  assert.equal(preferences.QUALITY_PROFILES.LOW.shadows, false);
  assert.equal(preferences.QUALITY_PROFILES.ULTRA.pixelRatio, 2);

  const storageValues = new Map();
  const storage = {
    getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
    setItem(key, value) { storageValues.set(key, String(value)); },
  };
  const defaults = preferences.loadAccessibilityPreferences(null, true);
  assert.equal(defaults.reducedMotion, true);
  assert.equal(defaults.cameraFeaturesEnabled, false, 'camera-related preferences must default to opt-in');
  const currentPreferences = {
    ...preferences.DEFAULT_ACCESSIBILITY_PREFERENCES,
    quality: 'LOW',
    reducedMotion: true,
    audioEnabled: false,
    captionsEnabled: true,
  };
  assert.equal(preferences.saveAccessibilityPreferences(storage, currentPreferences), true);
  assert.equal(preferences.loadAccessibilityPreferences(storage, false).quality, 'LOW');
  assert.equal(preferences.loadAccessibilityPreferences(storage, false).reducedMotion, true);

  // Model capability matrix covers every model and never promotes unspecified capability to supported.
  const matrix = capabilities.buildModelCapabilityMatrix(SPATIAL_LIBRARY, LEARNING_LESSONS);
  assert.equal(matrix.length, Object.keys(SPATIAL_LIBRARY).length);
  assert.ok(matrix.every((row) => row.id && row.name && row.capabilities));
  const v8Row = matrix.find((row) => row.id === 'v8_engine');
  assert.ok(v8Row);
  assert.equal(v8Row.capabilities.validatedSimulation, 'UNSUPPORTED');
  assert.equal(v8Row.capabilities.exportStep, 'UNSUPPORTED');
  assert.ok(
    matrix.every((row) => Object.values(row.capabilities).every((value) => ['SUPPORTED', 'UNSUPPORTED', 'UNKNOWN'].includes(value))),
  );
  const matrixErrors = capabilities.validateModelCapabilityMatrix(SPATIAL_LIBRARY, LEARNING_LESSONS).filter((issue) => issue.severity === 'ERROR');
  assert.deepEqual(matrixErrors, [], 'model, lesson, connection and declared capability contracts should be internally consistent');

  // Contribution validation is local and conservative: source/license gaps are surfaced before review.
  const sourceModel = SPATIAL_LIBRARY.v8_engine;
  const validCandidate = {
    ...sourceModel,
    evidence: {
      ...(sourceModel.evidence || {}),
      license: 'CC0-1.0',
      attribution: 'Original educational model authored for this project',
    },
  };
  const modelIssues = authoring.validateModelSubmission(validCandidate);
  assert.equal(modelIssues.some((issue) => issue.severity === 'ERROR'), false, 'a model with stable IDs, components and declared license should clear structural errors');
  const invalidCandidate = {
    ...validCandidate,
    components: [{ ...validCandidate.components[0], id: 'bad id', parentId: 'missing-parent' }, ...validCandidate.components.slice(1)],
  };
  const invalidIssues = authoring.validateModelSubmission(invalidCandidate);
  assert.ok(invalidIssues.some((issue) => issue.code === 'MODEL_ID' || issue.code === 'COMPONENT_ID' || issue.code === 'PARENT_REFERENCE'));

  const modelIds = new Set(Object.keys(SPATIAL_LIBRARY));
  const selectedLesson = LEARNING_LESSONS.find((item) => item.modelId === 'v12_engine') || LEARNING_LESSONS.find((item) => item.modelId === 'v8_engine');
  assert.ok(selectedLesson, 'there must be at least one reviewed-domain lesson attached to a registered model');
  const lessonIssues = authoring.validateLessonSubmission(selectedLesson, modelIds);
  assert.equal(lessonIssues.some((issue) => issue.severity === 'ERROR'), false, 'existing draft lesson should pass structural contribution checks');
  assert.equal(authoring.canPublishContribution('SUBMITTED', [], undefined, undefined), false);
  assert.equal(authoring.canPublishContribution('APPROVED', [], 'reviewer', '2026-01-01T00:00:00.000Z'), true);

  // Model-aware tutor context distinguishes source-backed, unknown and illustrative facts.
  const tutorContext = tutor.buildModelTutorContext(sourceModel, 'v8_crankshaft');
  assert.equal(tutorContext.modelId, 'v8_engine');
  assert.equal(tutorContext.selectedComponentId, 'v8_crankshaft');
  assert.ok(tutorContext.evidence.some((item) => item.id === 'component-v8_crankshaft'));
  assert.ok(Array.isArray(tutorContext.limitations) && tutorContext.limitations.length > 0);
  const actionResult = tutor.validateTutorSuggestedActions([
    { type: 'SET_EXPLOSION', factor: 0.7 },
    { type: 'FOCUS_COMPONENT', componentId: 'v8_crankshaft' },
    { type: 'EXECUTE_CODE', code: 'arbitrary code' },
    { type: 'OPEN_LESSON', lessonId: 'not-in-catalog' },
  ], tutorContext, new Set(LEARNING_LESSONS.map((item) => item.id)));
  assert.equal(actionResult.accepted.length, 2);
  assert.equal(actionResult.rejected.length, 2);

  // Offline workbook includes text and assessment controls but explicitly excludes interactive model claims.
  const pack = offline.createOfflineLearningPack(selectedLesson, SPATIAL_LIBRARY[selectedLesson.modelId], '2026-01-01T00:00:00.000Z');
  assert.equal(offline.validateOfflineLearningPack(JSON.parse(offline.serializeOfflineLearningPack(pack))), true);
  assert.equal(pack.modelSummary.availableOffline, 'LESSON_TEXT_AND_ASSESSMENT_ONLY');
  const html = offline.createOfflineLearningHtml(pack);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /data-question/);
  assert.match(html, /does not include the interactive 3D mesh/i);
  assert.doesNotMatch(html, /<script\s+src=/i, 'offline workbook must not load external JavaScript');
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet/i, 'offline workbook must not require remote stylesheets');
  const maliciousLesson = { ...selectedLesson, title: '<script>alert("unsafe")</script>' };
  const maliciousPack = offline.createOfflineLearningPack(maliciousLesson, SPATIAL_LIBRARY[maliciousLesson.modelId]);
  const maliciousHtml = offline.createOfflineLearningHtml(maliciousPack);
  assert.ok(maliciousHtml.includes('&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt;'));
  assert.ok(!maliciousHtml.includes('<script>alert("unsafe")</script>'));

  console.log('Accessibility/authoring contracts passed: quality profiles and saved preferences, conservative capability matrix, contribution validation, typed model tutor context, safe action allowlist, and offline workbook escaping/limits.');
} catch (error) {
  console.error('Accessibility and authoring contract tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temp, { recursive: true, force: true });
}
