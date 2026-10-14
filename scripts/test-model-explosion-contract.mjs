import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-model-explosion-contract-'));
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');
const explosionModule = join(temporaryDirectory, 'explosion-math.cjs');
const REQUIRED_MODEL_IDS = ['v8_engine', 'v12_engine', 'esp32'];
const FACTORS = [0, 0.125, 0.25, 0.5, 0.75, 1];

function isFiniteTriple(value) {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((part) => typeof part === 'number' && Number.isFinite(part));
}

function isZeroVector(value) {
  return value.every((part) => part === 0);
}

function assertVectorClose(actual, expected, message) {
  assert.ok(
    isFiniteTriple(actual) &&
      isFiniteTriple(expected) &&
      actual.every((part, index) => Math.abs(part - expected[index]) <= 1e-9),
    message + ': expected ' + JSON.stringify(expected) + ', received ' + JSON.stringify(actual),
  );
}

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
      entryPoints: [resolve('src/models/assemblies/ExplosionMath.ts')],
      outfile: explosionModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(spatialModule);
  const { resolveStagedExplosionProgress, resolveExplodedPosition } = require(explosionModule);

  for (const requiredId of REQUIRED_MODEL_IDS) {
    assert.ok(SPATIAL_LIBRARY[requiredId], 'Required regression model "' + requiredId + '" must exist.');
    assert.ok(Array.isArray(SPATIAL_LIBRARY[requiredId].explodedParts) &&
      SPATIAL_LIBRARY[requiredId].explodedParts.length > 0,
    'Required regression model "' + requiredId + '" must declare explodedParts.');
  }

  const modelsToCheck = Object.entries(SPATIAL_LIBRARY)
    .filter(([, model]) => Array.isArray(model.explodedParts) && model.explodedParts.length > 0);
  assert.ok(modelsToCheck.length > 0, 'The catalog must contain at least one exploded-part manifest.');

  for (const [modelId, model] of modelsToCheck) {
    assert.ok(model, '[' + modelId + '] model must exist in the canonical catalog.');
    assert.ok(Array.isArray(model.components) && model.components.length > 0,
      '[' + modelId + '] model must contain components.');

    const componentById = new Map();
    for (const component of model.components) {
      assert.ok(component && typeof component.id === 'string' && component.id.trim(),
        '[' + modelId + '] every component must have a stable ID.');
      assert.ok(!componentById.has(component.id),
        '[' + modelId + '] duplicate component ID: ' + component.id);
      componentById.set(component.id, component);
    }

    const explodedParts = model.explodedParts;
    assert.ok(Array.isArray(explodedParts) && explodedParts.length > 0,
      '[' + modelId + '] must declare its exploded-part manifest.');
    assert.equal(new Set(explodedParts).size, explodedParts.length,
      '[' + modelId + '] explodedParts must not contain duplicate IDs.');

    for (const componentId of explodedParts) {
      const component = componentById.get(componentId);
      assert.ok(component,
        '[' + modelId + '] explodedParts references missing component ID "' + componentId + '".');
      assert.ok(isFiniteTriple(component.position),
        '[' + modelId + '/' + componentId + '] assembled position must be a finite 3D vector.');
      assert.ok(isFiniteTriple(component.explodedOffset),
        '[' + modelId + '/' + componentId + '] explodedOffset must be a finite 3D vector.');
      assert.ok(
        component.explosionStage === undefined ||
          (Number.isFinite(component.explosionStage) &&
            component.explosionStage >= 0 &&
            component.explosionStage <= 0.95),
        '[' + modelId + '/' + componentId + '] explosionStage must be between 0 and 0.95.',
      );
      assert.ok(!isZeroVector(component.explodedOffset),
        '[' + modelId + '/' + componentId + '] declared exploded parts must have a non-zero offset.');

      const stage = component.explosionStage ?? 0;
      const originalComponent = JSON.stringify(component);
      const assembledPosition = resolveExplodedPosition(component.position, component.explodedOffset, 0, stage);
      assert.deepEqual(assembledPosition, component.position,
        '[' + modelId + '/' + componentId + '] factor 0 must preserve canonical position.');

      const expectedExplodedPosition = component.position.map(
        (part, index) => part + component.explodedOffset[index],
      );
      const explodedPosition = resolveExplodedPosition(component.position, component.explodedOffset, 1, stage);
      assertVectorClose(explodedPosition, expectedExplodedPosition,
        '[' + modelId + '/' + componentId + '] factor 1 must apply the complete offset.');

      assert.equal(resolveStagedExplosionProgress(stage, stage), 0,
        '[' + modelId + '/' + componentId + '] a staged part must not move at its stage boundary.');
      assert.equal(resolveStagedExplosionProgress(1, stage), 1,
        '[' + modelId + '/' + componentId + '] every valid stage must complete at factor 1.');

      let priorProgress = -1;
      for (const factor of FACTORS) {
        const progress = resolveStagedExplosionProgress(factor, stage);
        assert.ok(Number.isFinite(progress) && progress >= 0 && progress <= 1,
          '[' + modelId + '/' + componentId + '] progress must remain finite and bounded.');
        assert.ok(progress >= priorProgress,
          '[' + modelId + '/' + componentId + '] explosion progress must never move backwards.');
        priorProgress = progress;
      }

      assert.equal(JSON.stringify(component), originalComponent,
        '[' + modelId + '/' + componentId + '] resolving transforms must not mutate catalog metadata.');
    }

    console.log('PASS ' + modelId + ': ' + componentById.size +
      ' components, ' + explodedParts.length + ' valid exploded parts.');
  }

  console.log('Model explosion contract passed for ' + modelsToCheck.length + ' catalog models (including V8, V12, and ESP32): stable IDs, complete manifest references, staged progress, assembled/exploded endpoints, and immutable source metadata.');
} catch (error) {
  console.error('Model explosion contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
