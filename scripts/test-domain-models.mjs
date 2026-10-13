import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-domain-test-'));
const analyticalModule = join(temporaryDirectory, 'analytical-models.cjs');
const domainModule = join(temporaryDirectory, 'domain-modules.cjs');
const lessonModule = join(temporaryDirectory, 'lesson-catalog.cjs');
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');

try {
  await Promise.all([
    build({ entryPoints: [resolve('src/domains/AnalyticalModels.ts')], outfile: analyticalModule, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/domains/DomainLearningModules.ts')], outfile: domainModule, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/learning/LessonCatalog.ts')], outfile: lessonModule, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/SpatialLibrary.ts')], outfile: spatialModule, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent' }),
  ]);

  const require = createRequire(import.meta.url);
  const math = require(analyticalModule);
  const { DOMAIN_LEARNING_MODULES } = require(domainModule);
  const { LEARNING_LESSONS } = require(lessonModule);
  const { SPATIAL_LIBRARY } = require(spatialModule);

  const ohms = math.calculateOhmsLaw(12, 2);
  assert.equal(ohms.resistanceOhm, 6);
  assert.equal(ohms.powerW, 24);
  assert.equal(ohms.status, 'ANALYTICAL_EDUCATIONAL_APPROXIMATION');
  assert.throws(() => math.calculateOhmsLaw(12, 0), RangeError);

  const beam = math.calculateCantileverBeam({
    lengthM: 2, widthM: 0.1, heightM: 0.2, youngsModulusPa: 200e9, endLoadN: 100,
  });
  assert.ok(Math.abs(beam.tipDeflectionM - 2e-5) < 1e-10);
  assert.ok(Math.abs(beam.maxBendingStressPa - 300000) < 1e-3);
  assert.throws(() => math.calculateCantileverBeam({
    lengthM: 2, widthM: 0, heightM: 0.2, youngsModulusPa: 200e9, endLoadN: 100,
  }), RangeError);

  const flow = math.calculateContinuityBernoulli({
    area1M2: 0.01, area2M2: 0.005, velocity1Mps: 2, pressure1Pa: 200000, densityKgM3: 1000,
  });
  assert.equal(flow.velocity2Mps, 4);
  assert.equal(flow.pressure2Pa, 194000);
  assert.throws(() => math.calculateContinuityBernoulli({
    area1M2: 1, area2M2: 0.00001, velocity1Mps: 100, pressure1Pa: 1, densityKgM3: 1000,
  }), RangeError);

  const flight = math.calculateMachAndDynamicPressure(100, 340, 1.225);
  assert.ok(Math.abs(flight.mach - (100 / 340)) < 1e-12);
  assert.equal(flight.dynamicPressurePa, 6125);
  const linkage = math.calculatePlanarTwoLinkKinematics(1, 1, 0, Math.PI / 2);
  assert.ok(Math.abs(linkage.endXMetres - 1) < 1e-12);
  assert.ok(Math.abs(linkage.endYMetres - 1) < 1e-12);
  assert.throws(() => math.calculatePlanarTwoLinkKinematics(1, 1, 99, 0), RangeError);

  assert.equal(DOMAIN_LEARNING_MODULES.length, 7);
  const moduleIds = new Set();
  for (const module of DOMAIN_LEARNING_MODULES) {
    assert.ok(!moduleIds.has(module.id), `duplicate domain module ${module.id}`);
    moduleIds.add(module.id);
    assert.ok(SPATIAL_LIBRARY[module.modelId], `missing catalog model ${module.modelId}`);
    assert.ok(LEARNING_LESSONS.some((lesson) => lesson.id === module.lessonId), `missing lesson ${module.lessonId}`);
    assert.equal(module.publicationStatus, 'EDUCATIONAL_DRAFT', 'modules without expert review must remain draft');
    assert.ok(module.limitations.length > 0, `${module.id} must declare limitations`);
    assert.ok(!/BENCHMARK_VALIDATED|CERTIFIED|CLINICAL_GRADE/i.test(module.validationLevel), `${module.id} must not overclaim validation`);
  }

  console.log('Domain checks passed: Ohm’s law, cantilever beam, ideal continuity/Bernoulli, Mach/dynamic pressure, planar forward kinematics, and 7 draft domain manifests.');
} catch (error) {
  console.error('Domain model tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
