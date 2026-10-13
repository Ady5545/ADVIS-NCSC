import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-explosion-test-'));
const bundledModule = join(temporaryDirectory, 'explosion-math.cjs');

try {
  await build({
    entryPoints: [resolve('src/models/assemblies/ExplosionMath.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });
  const require = createRequire(import.meta.url);
  const { resolveStagedExplosionProgress, resolveExplodedPosition } = require(bundledModule);

  assert.equal(resolveStagedExplosionProgress(0), 0, 'assembled state should have no separation');
  assert.equal(resolveStagedExplosionProgress(1), 1, 'fully exploded state must reach the complete offset');
  assert.equal(resolveStagedExplosionProgress(0.5, 0), 0.5, 'legacy stage zero retains linear behavior');
  assert.equal(resolveStagedExplosionProgress(0.25, 0.5), 0, 'a part must stay assembled before its stage');
  assert.equal(resolveStagedExplosionProgress(0.75, 0.5), 0.5, 'a part should move gradually after its stage');
  assert.equal(resolveStagedExplosionProgress(1, 0.95), 1, 'all valid stages must finish at factor one');
  assert.equal(resolveStagedExplosionProgress(Number.NaN, 0.2), 0, 'invalid factors fail closed to assembled');
  assert.equal(resolveStagedExplosionProgress(0.5, 4), 0, 'out-of-range stage should clamp to the minimum valid threshold');

  assert.deepEqual(
    resolveExplodedPosition([1, 2, 3], [10, -4, 2], 0),
    [1, 2, 3],
    'factor zero must return the exact canonical position',
  );
  assert.deepEqual(
    resolveExplodedPosition([1, 2, 3], [10, -4, 2], 1),
    [11, -2, 5],
    'factor one must return the exact configured exploded position',
  );
  assert.deepEqual(
    resolveExplodedPosition([1, 2, 3], [10, -4, 2], 0.75, 0.5),
    [6, 0, 4],
    'staged positions should be deterministic and linearly interpolated after stage',
  );

  console.log('Explosion contract tests passed: assembled/exploded endpoints, staged progress, invalid input clamping and deterministic transforms.');
} catch (error) {
  console.error('Explosion contract tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
