import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-capability-matrix-'));
const catalogModule = join(temporaryDirectory, 'spatial-library.cjs');
const matrixModule = join(temporaryDirectory, 'capability-matrix.cjs');
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

try {
  await Promise.all([
    build({ entryPoints: [resolve('src/SpatialLibrary.ts')], outfile: catalogModule, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/models/ModelCapabilityMatrix.ts')], outfile: matrixModule, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
  ]);
  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(catalogModule);
  const { resolveModelCapabilityMatrix, ALL_MODEL_CAPABILITIES } = require(matrixModule);
  const rows = resolveModelCapabilityMatrix(SPATIAL_LIBRARY);
  if (rows.length !== Object.keys(SPATIAL_LIBRARY).length) fail('Every catalog entry must have exactly one capability-matrix row.');
  const ids = new Set();
  let undeclared = 0;
  let declaredSupported = 0;

  for (const row of rows) {
    if (ids.has(row.modelId)) fail('Duplicate capability row for model ID: ' + row.modelId);
    ids.add(row.modelId);
    if (!SPATIAL_LIBRARY[row.modelId]) fail('Capability matrix references missing model: ' + row.modelId);
    for (const capability of ALL_MODEL_CAPABILITIES) {
      const state = row.capabilities[capability];
      if (!['SUPPORTED', 'NOT_SUPPORTED', 'NOT_DECLARED'].includes(state)) {
        fail('[' + row.modelId + '] Invalid capability state for ' + capability + ': ' + state);
      }
      if (state === 'NOT_DECLARED') undeclared += 1;
      if (state === 'SUPPORTED') declaredSupported += 1;
    }
    for (const warning of row.warnings) fail('[' + row.modelId + '] ' + warning);
    if (row.dimensionsStatus === 'VALIDATED' && !SPATIAL_LIBRARY[row.modelId].evidence?.reviewer) {
      warn('[' + row.modelId + '] Dimensional status is VALIDATED but no evidence reviewer is recorded.');
    }
  }
  console.log('Capability matrix: ' + rows.length + ' models × ' + ALL_MODEL_CAPABILITIES.length + ' capabilities.');
  console.log('Declared supported capability cells: ' + declaredSupported + '; not declared: ' + undeclared + '.');
  console.log('Structural errors: ' + errors.length + '; review warnings: ' + warnings.length + '.');
  for (const message of warnings) console.warn('WARN: ' + message);
  for (const message of errors) console.error('ERROR: ' + message);
  if (errors.length > 0) process.exitCode = 1;
  else console.log('Capability matrix contract passed; undeclared controls remain explicitly unknown rather than guessed.');
} catch (error) {
  console.error('Capability matrix validation failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
