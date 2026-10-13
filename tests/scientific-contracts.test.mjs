import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

function loadTypeScriptModule(relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  const source = readFileSync(absolutePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: absolutePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = createRequire(absolutePath);
  const execute = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled);
  execute(module.exports, localRequire, module, absolutePath, path.dirname(absolutePath));
  return module.exports;
}

const transform = loadTypeScriptModule('src/scientific/TransformResolver.ts');
const hierarchy = loadTypeScriptModule('src/scientific/AssemblyHierarchy.ts');
const cad = loadTypeScriptModule('src/cad/CadCertification.ts');

test('explosion is a normalized, deterministic interpolation from assembled to exploded', () => {
  const input = {
    base: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] },
    explosionOffset: [0, 4, -2],
    explosionFactor: 0,
  };
  assert.deepEqual(transform.resolveComponentTransform(input).position, [1, 2, 3]);
  assert.deepEqual(
    transform.resolveComponentTransform({ ...input, explosionFactor: 0.5 }).position,
    [1, 4, 2]
  );
  assert.deepEqual(
    transform.resolveComponentTransform({ ...input, explosionFactor: 1 }).position,
    [1, 6, 1]
  );
  assert.equal(transform.clampExplosionFactor(-4), 0);
  assert.equal(transform.clampExplosionFactor(9), 1);
  assert.equal(transform.clampExplosionFactor(Number.NaN), 0);
});

test('transform resolution composes edits and motion without mutating the canonical transform', () => {
  const base = { position: [1, 0, 0], rotation: [0, 0, 0], scale: [2, 2, 2] };
  const resolved = transform.resolveComponentTransform({
    base,
    editDelta: { position: [0.5, 0, 0], scale: [0.5, 1, 1] },
    kinematicDelta: { position: [0, 2, 0], rotation: [0, 0, 0.2] },
    explosionOffset: [3, 0, 0],
    explosionFactor: 0.25,
  });
  assert.deepEqual(resolved.position, [2.25, 2, 0]);
  assert.deepEqual(resolved.rotation, [0, 0, 0.2]);
  assert.deepEqual(resolved.scale, [1, 2, 2]);
  assert.deepEqual(base, { position: [1, 0, 0], rotation: [0, 0, 0], scale: [2, 2, 2] });
});

test('legacy flat component catalogs remain valid top-level trees', () => {
  const components = [
    { id: 'block', name: 'Block' },
    { id: 'crank', name: 'Crankshaft' },
  ];
  const result = hierarchy.buildComponentHierarchy(components);
  assert.equal(result.roots.length, 2);
  assert.equal(result.issues.length, 0);
});

test('hierarchy helper recognizes parent-child relationships and reports bad references', () => {
  const result = hierarchy.buildComponentHierarchy([
    { id: 'engine', name: 'Engine', childrenIds: ['block', 'missing'] },
    { id: 'block', name: 'Block', parentId: 'engine' },
  ]);
  assert.equal(result.roots.length, 1);
  assert.equal(result.roots[0].children[0].component.id, 'block');
  assert.ok(result.issues.some((issue) => issue.code === 'MISSING_CHILD'));
});

test('a STEP file path alone never claims CAD validation passed', () => {
  const evidence = cad.assessCadEvidence({
    id: 'sample-engine',
    name: 'Sample engine',
    category: 'Mechanical Engineering',
    assetPath: 'models/sample.step',
    cadAssetPath: 'models/sample.step',
    metadata: {},
  });
  assert.equal(evidence.status, 'SOURCE_CAD_PRESENT_AWAITING_VALIDATION');
  assert.equal(evidence.exactBRepEvidence, false);
  assert.equal(evidence.occtValidated, false);
  assert.equal(evidence.topologyValidated, false);
  assert.equal(evidence.metricsValidated, false);
  assert.equal(evidence.assemblyStructureValidated, false);
  assert.equal(cad.hasRequiredCadValidationEvidence(evidence), false);
});

test('CAD validation is only reported for passed records matching source hash and revision', () => {
  const checks = [
    'CAD_PARSE',
    'TOPOLOGY',
    'METRICS',
    'ASSEMBLY_STRUCTURE',
    'DIMENSIONAL_DEFINITION',
    'REVISION_CONTROL',
  ];
  const validationRecords = checks.map((check) => ({
    check,
    result: 'PASSED',
    tool: 'Example validator',
    toolVersion: '1.2.3',
    runAt: '2026-10-13T00:00:00.000Z',
    sourceHash: 'sha256:abc123',
    modelRevision: 'rev-1',
    reviewer: 'engineering-review',
  }));
  const evidence = cad.assessCadEvidence({
    id: 'sample-engine',
    name: 'Sample engine',
    category: 'Mechanical Engineering',
    assetPath: 'models/sample.step',
    cadAssetPath: 'models/sample.step',
    metadata: { cadSourceHash: 'sha256:abc123', modelRevision: 'rev-1', cadValidationRecords: validationRecords },
  });
  assert.equal(evidence.status, 'CAD_VALIDATION_RECORDED');
  assert.equal(cad.hasRequiredCadValidationEvidence(evidence), true);

  const stale = cad.assessCadEvidence({
    id: 'sample-engine',
    name: 'Sample engine',
    category: 'Mechanical Engineering',
    assetPath: 'models/sample.step',
    cadAssetPath: 'models/sample.step',
    metadata: { cadSourceHash: 'sha256:changed', modelRevision: 'rev-1', cadValidationRecords: validationRecords },
  });
  assert.equal(stale.status, 'SOURCE_CAD_PRESENT_AWAITING_VALIDATION');
  assert.equal(cad.hasRequiredCadValidationEvidence(stale), false);
});
