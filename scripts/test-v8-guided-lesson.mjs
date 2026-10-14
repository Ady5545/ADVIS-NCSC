import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-v8-lesson-contract-'));
const lessonModule = join(temporaryDirectory, 'lesson-catalog.cjs');
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');

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
  const lesson = LEARNING_LESSONS.find((item) => item.id === 'v8-four-stroke-explorer');

  assert.ok(lesson, 'The V8 four-stroke guided lesson must be present.');
  assert.equal(lesson.version, 2, 'Updated lesson content must invalidate stale progress from version 1.');
  assert.equal(lesson.modelId, 'v8_engine');
  assert.equal(lesson.authoringStatus, 'EDUCATIONAL_DRAFT',
    'The lesson must remain a draft until qualified subject-matter review.');
  assert.equal(SPATIAL_LIBRARY[lesson.modelId]?.id, 'v8_engine',
    'The lesson must target the canonical V8 catalog model.');
  assert.ok(lesson.estimatedMinutes >= 10,
    'The lesson estimate must reflect the added end-of-lesson assessment.');
  assert.ok(lesson.limitations.some((item) => /not an exact OEM|not.*validated/i.test(item)),
    'The lesson must carry an explicit model-limits statement.');
  assert.ok(lesson.learningObjectives.some((item) => /720 crank degrees/i.test(item)),
    'The lesson must teach the full 720-degree four-stroke cycle.');

  const stepIds = lesson.steps.map((step) => step.id);
  assert.equal(new Set(stepIds).size, stepIds.length, 'Lesson step IDs must remain unique.');
  assert.equal(lesson.steps.at(-1)?.id, 'reassemble', 'The lesson should end by restoring the assembly.');
  assert.equal(lesson.steps.at(-1)?.action?.type, 'RESET_VIEW',
    'The final step must offer a reset to the canonical presentation.');

  const assessments = lesson.steps.filter((step) => step.id.startsWith('assessment-'));
  assert.equal(assessments.length, 3, 'The lesson must finish with a short three-question assessment.');
  const assessmentTopics = assessments.map((step) => step.id);
  assert.deepEqual(assessmentTopics, [
    'assessment-four-strokes',
    'assessment-valve-phases',
    'assessment-model-limits',
  ]);

  const questionIds = new Set();
  for (const step of assessments) {
    const question = step.question;
    assert.ok(question, '[' + step.id + '] assessment step needs a question.');
    assert.equal(step.completionRule.type, 'ANSWER_QUESTION',
      '[' + step.id + '] progression must depend on a correct answer.');
    assert.equal(step.completionRule.questionId, question.id,
      '[' + step.id + '] completion rule must reference its own question.');
    assert.ok(!questionIds.has(question.id), 'Assessment question IDs must be unique.');
    questionIds.add(question.id);
    assert.ok(question.choices.length >= 3, '[' + step.id + '] needs at least three answer choices.');
    const choiceIds = question.choices.map((choice) => choice.id);
    assert.equal(new Set(choiceIds).size, choiceIds.length, '[' + step.id + '] choice IDs must be unique.');
    assert.ok(choiceIds.includes(question.correctChoiceId),
      '[' + step.id + '] correctChoiceId must match a visible choice.');
    assert.ok(question.explanation.length > 20,
      '[' + step.id + '] feedback must explain why the correct answer is correct.');
    assert.ok(question.hint && question.hint.length > 10,
      '[' + step.id + '] needs a meaningful hint for retrying.');
  }

  assert.match(assessments[0].question.prompt, /order of the four strokes/i);
  assert.match(assessments[1].question.prompt, /exhaust stroke/i);
  assert.match(assessments[2].question.prompt, /visualization and synthesized sound/i);
  assert.ok(assessments[2].question.choices.find((choice) => choice.id === assessments[2].question.correctChoiceId)
    .text.includes('not validated engine performance'));

  // Ensure the final in-product action really restores the active engine simulation,
  // rather than merely marking the lesson complete or hiding the exploded parts.
  const appSource = await readFile(resolve('src/App.tsx'), 'utf8');
  const resetStart = appSource.indexOf("case 'RESET_VIEW':");
  const resetEnd = appSource.indexOf("default: {", resetStart);
  assert.ok(resetStart >= 0 && resetEnd > resetStart,
    'The lesson action router must retain a RESET_VIEW branch.');
  const resetBranch = appSource.slice(resetStart, resetEnd);
  for (const requiredReset of [
    'setIsExploded(false)',
    'setExplodedFactor(0)',
    "setSpatialMode('INSPECTION')",
    'setSelectedComponentId(null)',
    'setHoveredComponentId(null)',
    'setHiddenComponentIds([])',
    'setXrayEnabled(false)',
    'setBlueprintEnabled(false)',
    'setV8Rpm(600)',
    'setIsV8KinematicPlaying(true)',
    'setV8KinematicSpeed(1)',
    'setV8KinematicTimeOffset(0)',
    'setV8CrankAngleDeg(0)',
    'setV12Rpm(600)',
    'setIsKinematicPlaying(true)',
    'setKinematicSpeed(1)',
    'setKinematicTimeOffset(0)',
  ]) {
    assert.ok(resetBranch.includes(requiredReset),
      'RESET_VIEW must restore the required baseline state: ' + requiredReset);
  }
  assert.ok(!resetBranch.includes('setV8SoundEnabled('),
    'Restoring a lesson should respect the learner’s sound-mute preference.');

  console.log('V8 guided lesson contract passed: versioned progress reset, three answer-gated assessment questions, 720-degree learning objective, explicit model limitations, and reassembly reset.');
} catch (error) {
  console.error('V8 guided lesson contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
