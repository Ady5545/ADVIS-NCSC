import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import { tmpdir } from 'node:os';

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'advis-catalog-audit-'));
const bundledModule = join(temporaryDirectory, 'spatial-library.cjs');
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }
function isFiniteTriple(value) {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((part) => typeof part === 'number' && Number.isFinite(part));
}

try {
  await build({
    entryPoints: [resolve('src/SpatialLibrary.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: false,
    logLevel: 'silent',
  });

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY, getCadCertificationForObject } = require(bundledModule);
  const modelEntries = Object.entries(SPATIAL_LIBRARY);

  if (modelEntries.length === 0) fail('SpatialLibrary is empty.');

  for (const [catalogKey, model] of modelEntries) {
    const modelLabel = String(model?.name || catalogKey);

    if (!model || typeof model !== 'object') {
      fail(`[${catalogKey}] Model metadata is not an object.`);
      continue;
    }
    if (!model.id || typeof model.id !== 'string') fail(`[${modelLabel}] Missing stable model id.`);
    if (model.id !== catalogKey) fail(`[${catalogKey}] Catalog key does not match model.id (${model.id}).`);
    if (!model.name || !model.category || !model.description) fail(`[${modelLabel}] Missing name, category, or description.`);
    if (!Array.isArray(model.components)) {
      fail(`[${modelLabel}] components must be an array.`);
      continue;
    }

    const ids = new Set();
    const validIds = new Set();
    for (const [index, component] of model.components.entries()) {
      const label = component?.name || `component #${index}`;
      if (!component || typeof component !== 'object') {
        fail(`[${modelLabel}] ${label} is not an object.`);
        continue;
      }
      if (!component.id || typeof component.id !== 'string') fail(`[${modelLabel}] ${label} has no stable id.`);
      else {
        if (ids.has(component.id)) fail(`[${modelLabel}] Duplicate component id: ${component.id}.`);
        ids.add(component.id);
        validIds.add(component.id);
      }
      if (!component.name || !component.description) fail(`[${modelLabel}] Component ${component.id || label} needs a name and description.`);
      if (!isFiniteTriple(component.position)) fail(`[${modelLabel}] ${component.id || label} has an invalid position; expected three finite numbers.`);
      if (!isFiniteTriple(component.size) || component.size.some((value) => value < 0)) {
        fail(`[${modelLabel}] ${component.id || label} has invalid size metadata.`);
      }
      if (!isFiniteTriple(component.explodedOffset)) {
        fail(`[${modelLabel}] ${component.id || label} has an invalid explodedOffset; expected three finite numbers.`);
      }
      if (component.cadAssetPath && !/\.(step|stp|brep|brp)$/i.test(component.cadAssetPath)) {
        warn(`[${modelLabel}] ${component.id} has a CAD path with an unexpected extension; inspect its source metadata.`);
      }
    }

    for (const componentId of model.explodedParts || []) {
      if (!validIds.has(componentId)) warn(`[${modelLabel}] explodedParts references missing component id ${componentId}.`);
    }

    const evidence = getCadCertificationForObject(catalogKey);
    if (evidence?.status === 'SOURCE_CAD_VERIFIED') {
      const validationRecord = evidence.validationRecord;
      if (!validationRecord?.sourceHash || !validationRecord?.reportPath || !validationRecord?.validator) {
        fail(`[${modelLabel}] Claims source CAD is verified without a reviewable validation record.`);
      }
    }
    if (evidence?.status === 'SOURCE_CAD_AVAILABLE_AWAITING_VALIDATION') {
      if (evidence.occtValidated || evidence.topologyValidated || evidence.metricsValidated || evidence.assemblyStructureValidated) {
        fail(`[${modelLabel}] Unvalidated CAD source must not advertise successful validation flags.`);
      }
    }
  }

  console.log(`Model catalog audit: ${modelEntries.length} models checked.`);
  console.log(`Structural errors: ${errors.length}; warnings: ${warnings.length}.`);
  for (const message of warnings) console.warn(`WARN: ${message}`);
  for (const message of errors) console.error(`ERROR: ${message}`);

  if (errors.length > 0) process.exitCode = 1;
  else console.log('Catalog structural checks passed. Warnings require review but do not silently change model metadata.');
} catch (error) {
  console.error('Catalog audit could not complete:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
