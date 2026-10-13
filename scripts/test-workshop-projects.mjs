import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-workshop-test-'));
const schemaBundle = join(temporaryDirectory, 'project-schema.cjs');
const historyBundle = join(temporaryDirectory, 'project-history.cjs');
const storeBundle = join(temporaryDirectory, 'project-store.cjs');

const model = {
  id: 'workshop-fixture',
  name: 'Workshop Fixture',
  path: '/fixture',
  modelStatus: 'AVAILABLE',
  category: 'Test',
  description: 'Synthetic fixture for workshop tests.',
  modelVersion: '1.2.3',
  modelKind: 'PROCEDURAL_EDUCATIONAL_MODEL',
  unitSystem: 'UNSPECIFIED',
  components: [
    { id: 'base', name: 'Base', description: 'Base part', position: [0, 0, 0], rotation: [0, 0, 0], size: [1, 1, 1], explodedOffset: [1, 0, 0], shape: 'box' },
    { id: 'arm', name: 'Arm', description: 'Arm part', position: [1, 0, 0], rotation: [0, 0, 0], size: [1, 1, 1], explodedOffset: [0, 1, 0], shape: 'box' },
  ],
  defaultScale: 1,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

try {
  await Promise.all([
    build({ entryPoints: [resolve('src/workshop/ProjectSchema.ts')], outfile: schemaBundle, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/workshop/ProjectHistory.ts')], outfile: historyBundle, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
    build({ entryPoints: [resolve('src/workshop/ProjectStore.ts')], outfile: storeBundle, bundle: true, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent' }),
  ]);
  const require = createRequire(import.meta.url);
  const schema = require(schemaBundle);
  const historyTools = require(historyBundle);
  const store = require(storeBundle);

  const canonical = schema.canonicalTransformsForModel(model);
  assert.deepEqual(canonical.base.position, [0, 0, 0]);
  const originalBefore = clone(model.components);
  const project = store.createEditableProject(model, 'Test Copy', { componentTransforms: canonical });
  project.componentTransforms.base.position[0] = 5;
  assert.deepEqual(model.components, originalBefore, 'editing a copy must never mutate the canonical catalog object');
  assert.equal(project.sourceModelId, model.id);
  assert.equal(project.sourceModelVersion, model.modelVersion);
  assert.equal(project.schemaVersion, 1);

  assert.equal(schema.normalizeTransform({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }).scale[0], 1);
  assert.equal(schema.normalizeTransform({ position: [0, Number.NaN, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }), null);
  assert.equal(schema.normalizeTransform({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [0, 1, 1] }), null);

  let history = historyTools.createProjectHistory(3);
  const before = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  const after = { position: [2, 3, 4], rotation: [0.1, 0.2, 0.3], scale: [1, 1, 1] };
  history = historyTools.recordTransformCommand(history, { id: 'command-1', componentId: 'base', before, after, committedAt: new Date(0).toISOString() });
  assert.equal(history.undoStack.length, 1);
  let liveTransforms = { base: after, arm: canonical.arm };
  const undone = historyTools.undoTransformCommand(history, liveTransforms);
  assert.deepEqual(undone.transforms.base, before, 'undo must restore the exact before transform');
  assert.equal(undone.history.undoStack.length, 0);
  assert.equal(undone.history.redoStack.length, 1);
  const redone = historyTools.redoTransformCommand(undone.history, undone.transforms);
  assert.deepEqual(redone.transforms.base, after, 'redo must restore the exact after transform');
  assert.equal(redone.history.redoStack.length, 0);
  assert.equal(historyTools.undoTransformCommand(historyTools.createProjectHistory(), liveTransforms).command, null);

  const memory = new Map();
  globalThis.window = {
    localStorage: {
      getItem(key) { return memory.has(key) ? memory.get(key) : null; },
      setItem(key, value) { memory.set(key, String(value)); },
      removeItem(key) { memory.delete(key); },
    },
  };

  project.componentTransforms.base.position[0] = 5;
  assert.equal(store.saveEditableProject(project), true, 'local save should succeed with available storage');
  const loaded = store.loadEditableProject(project.id);
  assert.equal(loaded.name, 'Test Copy');
  assert.equal(loaded.componentTransforms.base.position[0], 5);
  assert.equal(store.listEditableProjects().some((item) => item.id === project.id), true);

  const exported = store.exportEditableProjectJson(project);
  const imported = store.importEditableProjectJson(exported);
  assert.ok(imported);
  assert.notEqual(imported.id, project.id, 'import must create a new project identity instead of overwriting the original');
  assert.match(imported.name, /Imported/);
  assert.equal(imported.componentTransforms.base.position[0], 5);
  assert.equal(store.importEditableProjectJson('{bad json'), null);
  assert.equal(store.importEditableProjectJson(JSON.stringify({ format: 'other', formatVersion: 1, project })), null);

  assert.equal(store.saveEditableProject(imported), true);
  assert.equal(store.listEditableProjects().length, 2);
  assert.equal(store.deleteEditableProject(project.id), true);
  assert.equal(store.loadEditableProject(project.id), null);
  assert.equal(store.listEditableProjects().length, 1);

  console.log('Workshop tests passed: immutable source, transform validation, undo/redo, local persistence, project export/import identity and deletion.');
} catch (error) {
  console.error('Workshop project/history tests failed:', error);
  process.exitCode = 1;
} finally {
  delete globalThis.window;
  await rm(temporaryDirectory, { recursive: true, force: true });
}
