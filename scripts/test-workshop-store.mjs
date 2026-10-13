import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-workshop-test-'));
const workshopModule = join(temporaryDirectory, 'workshop-store.cjs');
const catalogModule = join(temporaryDirectory, 'spatial-library.cjs');

try {
  await Promise.all([
    build({
      entryPoints: [resolve('src/workshop/WorkshopStore.ts')],
      outfile: workshopModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
    build({
      entryPoints: [resolve('src/SpatialLibrary.ts')],
      outfile: catalogModule,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      packages: 'external',
      logLevel: 'silent',
    }),
  ]);

  const require = createRequire(import.meta.url);
  const store = require(workshopModule);
  const { SPATIAL_LIBRARY } = require(catalogModule);
  const source = SPATIAL_LIBRARY.v8_engine;
  const component = source.components[0];
  assert.ok(source && component, 'V8 source and a component must be available');

  const project = store.createWorkshopProjectFromSource(source);
  assert.equal(project.sourceModelId, source.id);
  assert.equal(store.validateWorkshopProject(project, SPATIAL_LIBRARY), true);
  const originalPosition = [...component.position];

  const start = project.componentTransforms[component.id];
  const moved = { ...start, position: [start.position[0] + 0.25, start.position[1], start.position[2]] };
  const edited = store.applyWorkshopTransform(project, source, component.id, moved);
  assert.equal(edited.componentTransforms[component.id].position[0], start.position[0] + 0.25);
  assert.equal(edited.commands.length, 1);
  assert.equal(edited.cursor, 1);
  assert.deepEqual(component.position, originalPosition, 'Editing a copy must not mutate catalog metadata');

  const undone = store.undoWorkshopProject(edited);
  assert.deepEqual(undone.componentTransforms[component.id], start, 'Undo must restore the exact prior transform');
  assert.equal(undone.cursor, 0);
  const redone = store.redoWorkshopProject(undone);
  assert.deepEqual(redone.componentTransforms[component.id], moved, 'Redo must restore the exact edited transform');

  const rejectedZeroScale = store.applyWorkshopTransform(redone, source, component.id, {
    ...moved,
    scale: [0, 1, 1],
  });
  assert.equal(rejectedZeroScale, redone, 'Zero scale must be rejected rather than corrupting a saved copy');

  const unknownComponent = store.applyWorkshopTransform(redone, source, '__not_a_real_component__', moved);
  assert.equal(unknownComponent, redone, 'Unknown component IDs must be rejected');

  const reset = store.resetWorkshopProjectToSource(redone, source);
  assert.equal(reset.commands.length, 0);
  assert.equal(reset.cursor, 0);
  assert.deepEqual(reset.componentTransforms[component.id], start, 'Reset-to-source must restore exact canonical transforms');

  const serialized = store.exportWorkshopProject(redone);
  const imported = store.importWorkshopProject(serialized, SPATIAL_LIBRARY, source.id);
  assert.equal(imported.ok, true);
  if (imported.ok) assert.deepEqual(imported.project.componentTransforms, redone.componentTransforms);
  assert.equal(store.importWorkshopProject('{invalid', SPATIAL_LIBRARY, source.id).ok, false);
  assert.equal(store.importWorkshopProject(serialized, SPATIAL_LIBRARY, 'v12_engine').ok, false, 'Cross-model import must be rejected');
  assert.equal(store.importWorkshopProject('x'.repeat(store.MAX_WORKSHOP_IMPORT_CHARS + 1), SPATIAL_LIBRARY).ok, false, 'Oversized imports must be rejected');
  assert.equal(store.saveWorkshopProject(redone, SPATIAL_LIBRARY), false, 'Node without browser storage must fail safely');

  console.log('Workshop tests passed: immutable source, safe transform validation, undo/redo, reset-to-source, JSON round-trip and import bounds.');
} catch (error) {
  console.error('Workshop tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
