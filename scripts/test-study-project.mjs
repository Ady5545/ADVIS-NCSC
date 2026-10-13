import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-study-test-'));
const bundledModule = join(temporaryDirectory, 'study-project.cjs');

try {
  await build({
    entryPoints: [resolve('src/cad/StudyProject.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });
  const require = createRequire(import.meta.url);
  const { DEFAULT_STUDY_PARAMS, isStudyParams, parseStudyProject, createStudyProject } = require(bundledModule);

  assert.equal(isStudyParams(DEFAULT_STUDY_PARAMS), true, 'default study must be valid');
  assert.equal(isStudyParams({ ...DEFAULT_STUDY_PARAMS, sunTeeth: 11 }), false, 'sun tooth minimum must be enforced');
  assert.equal(isStudyParams({ ...DEFAULT_STUDY_PARAMS, planetTeeth: 31 }), false, 'planet tooth maximum must be enforced');
  assert.equal(isStudyParams({ ...DEFAULT_STUDY_PARAMS, moduleMm: Number.NaN }), false, 'non-finite dimensions must be rejected');
  assert.equal(isStudyParams({ ...DEFAULT_STUDY_PARAMS, inputRpm: 10001 }), false, 'RPM upper bound must be enforced');
  assert.equal(isStudyParams({ ...DEFAULT_STUDY_PARAMS, inputTorqueNm: -1 }), false, 'negative torque must be rejected');

  const project = createStudyProject(DEFAULT_STUDY_PARAMS, DEFAULT_STUDY_PARAMS, '2026-10-13T00:00:00.000Z');
  assert.deepEqual(parseStudyProject(JSON.stringify(project)), DEFAULT_STUDY_PARAMS, 'current project export must round-trip');
  assert.deepEqual(parseStudyProject(JSON.stringify({ parameters: DEFAULT_STUDY_PARAMS })), DEFAULT_STUDY_PARAMS, 'legacy export must remain importable');
  assert.equal(parseStudyProject(JSON.stringify({ schemaVersion: 99, parameters: DEFAULT_STUDY_PARAMS })), null, 'unknown project versions must fail closed');
  assert.equal(parseStudyProject(JSON.stringify({ parameters: { ...DEFAULT_STUDY_PARAMS, moduleMm: 0 } })), null, 'out-of-range imports must be rejected');
  assert.equal(parseStudyProject('{invalid json'), null, 'malformed JSON must be rejected');
  assert.equal(parseStudyProject('x'.repeat(1024 * 1024 + 1)), null, 'oversized input must be rejected');

  console.log('Study project tests passed: parameter bounds, safe parsing, version checks, legacy import and round-trip export.');
} catch (error) {
  console.error('Study project tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
