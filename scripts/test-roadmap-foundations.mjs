import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const directory = await mkdtemp(join(process.cwd(), '.advis-roadmap-foundations-'));
const modules = {
  workshop: join(directory, 'workshop.cjs'),
  tutor: join(directory, 'tutor.cjs'),
  offline: join(directory, 'offline-pack.cjs'),
  authoring: join(directory, 'authoring.cjs'),
  preferences: join(directory, 'preferences.cjs'),
};
try {
  await Promise.all([
    build({ entryPoints: [resolve('src/workshop/WorkshopProject.ts')], outfile: modules.workshop, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/learning/ModelTutorContext.ts')], outfile: modules.tutor, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/learning/OfflineLearningPack.ts')], outfile: modules.offline, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/authoring/ContributionValidation.ts')], outfile: modules.authoring, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/accessibility/QualityProfiles.ts')], outfile: modules.preferences, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
  ]);
  const require = createRequire(import.meta.url);
  const workshop = require(modules.workshop);
  const preferences = require(modules.preferences);
  const tutor = require(modules.tutor);
  const source = { id: 'test-model', name: 'Test Model', version: '1.0', components: [{ id: 'part-a', position: [0, 0, 0], rotation: [0, 0, 0] }] };
  let project = workshop.createProjectCopy(source, { id: 'test-project', now: '2026-01-01T00:00:00.000Z' });
  const allowed = new Set(['part-a']);
  const edited = workshop.setComponentTransform(project, 'part-a', { position: [1, 2, 3], rotation: [0.1, 0, 0], scale: [1, 1, 1] }, allowed, '2026-01-01T00:00:01.000Z');
  assert.equal(edited.ok, true);
  project = edited.project;
  assert.deepEqual(project.transforms['part-a'].position, [1, 2, 3]);
  assert.equal(workshop.canUndoWorkshopProject(project), true);
  project = workshop.undoWorkshopProject(project);
  assert.equal(project.transforms['part-a'], undefined);
  project = workshop.redoWorkshopProject(project);
  assert.deepEqual(project.transforms['part-a'].position, [1, 2, 3]);
  assert.equal(workshop.setComponentTransform(project, 'not-in-model', { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, allowed).ok, false);
  assert.equal(workshop.setComponentTransform(project, 'part-a', { position: [0, 0, 0], rotation: [0, 0, 0], scale: [0, 0, 0] }, allowed).ok, false);
  const restored = workshop.parseWorkshopProject(workshop.serializeWorkshopProject(project), source);
  assert.equal(restored.ok, true);
  assert.equal(workshop.parseWorkshopProject(workshop.serializeWorkshopProject(project), { ...source, version: '2.0' }).ok, false);

  const storageMap = new Map();
  const storage = { getItem: key => storageMap.get(key) ?? null, setItem: (key, value) => storageMap.set(key, value) };
  assert.equal(workshop.saveWorkshopProject(storage, project), true);
  assert.equal(workshop.loadWorkshopProject(storage, source)?.id, 'test-project');

  const prefs = preferences.loadAccessibilityPreferences(null, true);
  assert.equal(prefs.quality, 'BALANCED');
  assert.equal(prefs.reducedMotion, true);
  assert.equal(preferences.resolveQualityPreset('INVALID'), 'BALANCED');
  assert.equal(preferences.QUALITY_PROFILES.LOW.bloom, false);
  assert.equal(preferences.QUALITY_PROFILES.ULTRA.detailLevel, 'ULTRA');

  const builtContext = {
    modelId: 'test-model', modelName: 'Test Model', modelVersion: '1.0', domain: 'Engineering',
    selectedComponentId: 'part-a', selectedComponentName: 'Part A', selectedComponentPurpose: 'Illustrative part.',
    relationships: [], parameters: [], evidence: [{ id: 'component-part-a', label: 'Part A', kind: 'ILLUSTRATIVE', detail: 'Illustrative part.' }],
    simulationLevel: 'NONE', limitations: ['No source evidence recorded.'],
    safeActions: ['SELECT_COMPONENT', 'SET_EXPLOSION', 'SET_VIEW_MODE', 'FOCUS_COMPONENT', 'OPEN_LESSON'],
  };
  const actions = tutor.validateTutorSuggestedActions([
    { type: 'SELECT_COMPONENT', componentId: 'part-a' },
    { type: 'SET_EXPLOSION', factor: 0.5 },
    { type: 'SET_EXPLOSION', factor: 5 },
    { type: 'EXECUTE_CODE', code: 'danger' },
    { type: 'OPEN_LESSON', lessonId: 'not-allowed' },
  ], builtContext, new Set(['lesson-ok']));
  assert.equal(actions.accepted.length, 2);
  assert.equal(actions.rejected.length, 3);

  const authoring = require(modules.authoring);
  assert.equal(authoring.canPublishContribution('APPROVED', [], 'reviewer', '2026-01-01T00:00:00.000Z'), true);
  assert.equal(authoring.canPublishContribution('SUBMITTED', [], undefined, undefined), false);
  console.log('Roadmap foundations passed: immutable-source project edits, undo/redo, project validation/persistence, tutor action allowlist, quality preference fallbacks, and authoring publication gates.');
} catch (error) {
  console.error('Roadmap foundations failed:', error);
  process.exitCode = 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
