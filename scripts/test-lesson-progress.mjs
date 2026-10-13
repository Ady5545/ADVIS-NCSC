import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-lesson-progress-test-'));
const bundledModule = join(temporaryDirectory, 'lesson-progress.cjs');
const storage = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  },
};

try {
  await build({
    entryPoints: [resolve('src/learning/LessonProgress.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });
  const require = createRequire(import.meta.url);
  const { loadLessonProgress, saveLessonProgress, clearLessonProgress } = require(bundledModule);

  const initial = {
    lessonId: 'v8-four-stroke-explorer',
    lessonVersion: 1,
    currentStepIndex: 2,
    completedStepIds: ['orientation', 'identify-block', 'orientation'],
    answersByQuestionId: { 'question-1': 'choice-a' },
    updatedAt: 'old-timestamp',
  };
  assert.equal(saveLessonProgress(initial), true, 'progress should save to available local storage');

  // Reload semantics: read through the module again after the write, as a fresh page load would.
  const restored = loadLessonProgress(initial.lessonId, initial.lessonVersion);
  assert.ok(restored, 'saved lesson progress should resume');
  assert.equal(restored.currentStepIndex, 2);
  assert.deepEqual(restored.completedStepIds, ['orientation', 'identify-block'], 'duplicate completion IDs should be removed');
  assert.deepEqual(restored.answersByQuestionId, { 'question-1': 'choice-a' });
  assert.notEqual(restored.updatedAt, 'old-timestamp', 'save timestamp should be refreshed');

  assert.equal(loadLessonProgress(initial.lessonId, 2), null, 'a different lesson version must not reuse stale progress');
  assert.equal(saveLessonProgress({ ...initial, currentStepIndex: -5 }), true, 'invalid step index should be normalized');
  assert.equal(loadLessonProgress(initial.lessonId, 1).currentStepIndex, 0, 'negative step index should clamp to zero');

  const storeKey = 'advis-ncsc.lesson-progress.v1';
  storage.set(storeKey, '{malformed');
  assert.equal(loadLessonProgress(initial.lessonId, 1), null, 'malformed storage must fail safely');

  storage.set(storeKey, JSON.stringify({ 'v8-four-stroke-explorer@1': { ...initial, lessonId: 'different-lesson' } }));
  assert.equal(loadLessonProgress(initial.lessonId, 1), null, 'mismatched lesson IDs must be rejected');

  storage.clear();
  saveLessonProgress(initial);
  assert.equal(clearLessonProgress(initial.lessonId, 1), true, 'progress should be clearable');
  assert.equal(loadLessonProgress(initial.lessonId, 1), null, 'cleared progress should not resume');

  console.log('Lesson progress tests passed: resume persistence, version isolation, deduplication, clamping, malformed data and clear.');
} catch (error) {
  console.error('Lesson progress tests failed:', error);
  process.exitCode = 1;
} finally {
  delete globalThis.window;
  await rm(temporaryDirectory, { recursive: true, force: true });
}
