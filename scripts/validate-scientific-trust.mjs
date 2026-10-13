import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-scientific-trust-'));
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');
const registryModule = join(temporaryDirectory, 'scientific-registry.cjs');
const lessonModule = join(temporaryDirectory, 'lesson-catalog.cjs');

try {
  await Promise.all([
    build({
      entryPoints: [resolve('src/SpatialLibrary.ts')],
      outfile: spatialModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/scientific/ScientificModelRegistry.ts')],
      outfile: registryModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/learning/LessonCatalog.ts')],
      outfile: lessonModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(spatialModule);
  const { ScientificModelRegistry } = require(registryModule);
  const { LEARNING_LESSONS } = require(lessonModule);
  const errors = [];
  const fail = (message) => errors.push(message);

  for (const id of ['v8_engine_scientific', 'v8_engine', 'v12_engine']) {
    const model = SPATIAL_LIBRARY[id];
    if (!model) {
      fail(`[catalog:${id}] Model is missing.`);
      continue;
    }
    if (!model.evidence) fail(`[catalog:${id}] Missing evidence metadata.`);
    if (model.evidence?.dimensionsStatus !== 'UNSPECIFIED') {
      fail(`[catalog:${id}] Unverified procedural geometry must keep dimensionsStatus UNSPECIFIED.`);
    }
    if (!Array.isArray(model.evidence?.limitations) || model.evidence.limitations.length === 0) {
      fail(`[catalog:${id}] Educational model must declare limitations.`);
    }
    if (model.capabilities?.validatedSimulation === true) {
      fail(`[catalog:${id}] Must not advertise validated simulation without a verified benchmark record.`);
    }
    if (model.capabilities?.exportStep === true && model.modelKind !== 'CAD_BREP_ASSEMBLY') {
      fail(`[catalog:${id}] STEP export cannot be advertised for a procedural visual model.`);
    }
  }

  const v8Scientific = SPATIAL_LIBRARY.v8_engine_scientific;
  if (v8Scientific?.evidence?.simulationStatus !== 'KINEMATIC') {
    fail('[catalog:v8_engine_scientific] Simulation status must distinguish kinematics from thermodynamic validation.');
  }
  if (v8Scientific?.capabilities?.validatedSimulation !== false) {
    fail('[catalog:v8_engine_scientific] Validated simulation must be explicitly disabled.');
  }

  const v8Lesson = LEARNING_LESSONS.find((lesson) => lesson.modelId === 'v8_engine');
  if (!v8Lesson) {
    fail('[catalog:v8_engine] guidedLessons must not be enabled without a lesson matching the model ID.');
  } else if (SPATIAL_LIBRARY.v8_engine?.capabilities?.guidedLessons !== true) {
    fail('[catalog:v8_engine] guidedLessons should reflect the existing authored V8 lesson.');
  }

  const v12 = SPATIAL_LIBRARY.v12_engine;
  if (v12) {
    const serializedV12 = JSON.stringify({
      metadata: v12.metadata,
      educationalInformation: v12.educationalInformation,
      components: v12.components,
    });
    const unsupportedExactClaims = [
      /6[.,]5\s*(?:L|liters?)/i,
      /6,498\s*cc/i,
      /770\s*HP/i,
      /8,500\s*RPM/i,
      /Ti-6Al-4V/i,
      /4340\s*(?:chromoly|alloy)/i,
      /A356-T6/i,
      /±0\.01\s*mm/i,
      /1,200\s*CFM/i,
    ];
    for (const pattern of unsupportedExactClaims) {
      if (pattern.test(serializedV12)) {
        fail(`[catalog:v12_engine] Unsupported exact claim remains: ${pattern}`);
      }
    }
    for (const component of v12.components || []) {
      if (component.engineeringDetails && !component.engineeringDetails.evidenceStatus) {
        fail(`[catalog:v12_engine] Component "${component.id}" exposes engineering details without an evidence status.`);
      }
    }
  }

  const scientificModels = ScientificModelRegistry.getAllModels();
  if (!Array.isArray(scientificModels) || scientificModels.length === 0) {
    fail('ScientificModelRegistry must register at least one model.');
  }

  for (const model of scientificModels || []) {
    const validation = model.simulation?.validation;
    if (!validation) {
      fail(`[science:${model.id}] Missing simulation validation level, assumptions, and limitations.`);
      continue;
    }
    if (!validation.assumptions?.length || !validation.limitations?.length) {
      fail(`[science:${model.id}] Simulation validation must state assumptions and limitations.`);
    }
    if (validation.level === 'BENCHMARK_VALIDATED' &&
        (!validation.referenceCases?.length || !validation.reviewedBy || !validation.reviewedAt)) {
      fail(`[science:${model.id}] BENCHMARK_VALIDATED requires reference cases, reviewer, and review date.`);
    }

    const parameterIds = Object.keys(model.simulation?.parameters || {});
    for (const parameterId of parameterIds) {
      if (!model.simulation?.parameterDefinitions?.[parameterId]) {
        fail(`[science:${model.id}] Parameter "${parameterId}" needs units/range/description metadata.`);
      }
    }

    for (const [variableId, variable] of Object.entries(model.simulation?.variables || {})) {
      if (!variable.unit || !Number.isFinite(variable.defaultValue)) {
        fail(`[science:${model.id}] Variable "${variableId}" needs a unit and finite default value.`);
      }
      if (variable.min !== undefined && variable.max !== undefined && variable.min > variable.max) {
        fail(`[science:${model.id}] Variable "${variableId}" has an inverted range.`);
      }
    }
  }

  const fourStroke = ScientificModelRegistry.getModel('v8_engine_scientific');
  const indicator = fourStroke?.simulation?.variables?.cylinderPressure;
  if (!indicator || indicator.unit !== 'relative index' || !/illustrative/i.test(indicator.name) ||
      !/not a physical cylinder-pressure prediction/i.test(indicator.description)) {
    fail('[science:v8_engine_scientific] Cycle indicator must not be presented as measured or predicted pressure in bar.');
  }
  if (fourStroke && Object.values(fourStroke.components).some((component) => Object.keys(component.scientificProperties || {}).length > 0)) {
    fail('[science:v8_engine_scientific] Unreferenced component-level engineering specifications must remain unpublished until evidenced.');
  }
  if (fourStroke) {
    const defaults = Object.fromEntries(Object.values(fourStroke.simulation.variables).map((variable) => [variable.id, variable.defaultValue]));
    const parameters = fourStroke.simulation.parameters;
    const lowThrottle = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 0 }, 0, { ...parameters, throttle: 0 });
    const highThrottle = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 0 }, 0, { ...parameters, throttle: 100 });
    if (lowThrottle.cylinderPressure === highThrottle.cylinderPressure) {
      fail('[science:v8_engine_scientific] Throttle input is advertised but does not affect the illustrative cycle indicator.');
    }
    const slow = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 0 }, 0.01, { ...parameters, rpm: 60 });
    const fast = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 0 }, 0.01, { ...parameters, rpm: 120 });
    if (slow.crankAngle === fast.crankAngle) {
      fail('[science:v8_engine_scientific] RPM input must affect the kinematic cycle rate.');
    }
    const standardSpark = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 346 }, 0, { ...parameters, sparkAdvance: 14 });
    const advancedSpark = fourStroke.simulation.stepFunction({ ...defaults, crankAngle: 346 }, 0, { ...parameters, sparkAdvance: 24 });
    if (standardSpark.sparkFiring === advancedSpark.sparkFiring) {
      fail('[science:v8_engine_scientific] Spark-phase input is advertised but does not affect the spark marker.');
    }
  }

  const anatomy = ScientificModelRegistry.getModel('human_anatomy_scientific');
  if (anatomy?.simulation?.validation?.level !== 'PRESENTATION_ANIMATION') {
    fail('[science:human_anatomy_scientific] Illustrative cardiovascular waveforms must not be advertised as a validated clinical simulation.');
  }
  if (!/not a measurement or clinically validated prediction/i.test(anatomy?.simulation?.variables?.bloodPressure?.description || '')) {
    fail('[science:human_anatomy_scientific] The pressure indicator needs a visible non-clinical limitation in its variable description.');
  }
  if (anatomy) {
    const defaults = Object.fromEntries(Object.values(anatomy.simulation.variables).map((variable) => [variable.id, variable.defaultValue]));
    const parameters = anatomy.simulation.parameters;
    const smallStroke = anatomy.simulation.stepFunction({ ...defaults, cardiacCycleProgress: 250 }, 0, { ...parameters, strokeVolume: 20 });
    const largeStroke = anatomy.simulation.stepFunction({ ...defaults, cardiacCycleProgress: 250 }, 0, { ...parameters, strokeVolume: 80 });
    if (smallStroke.leftVentricularVolume === largeStroke.leftVentricularVolume) {
      fail('[science:human_anatomy_scientific] Stroke-volume input is advertised but does not affect the illustrative volume curve.');
    }
  }

  if (errors.length) {
    console.error('Scientific trust validation failed:');
    for (const error of errors) console.error(` - ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Scientific trust validation passed: ${Object.keys(SPATIAL_LIBRARY).length} catalog models checked for core evidence contracts; ${scientificModels.length} registered scientific models checked; ${LEARNING_LESSONS.length} authored lessons loaded.`);
  }
} catch (error) {
  console.error('Scientific trust validation failed to execute:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
