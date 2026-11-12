import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-turbocharger-contract-'));
const spatialModule = join(temporaryDirectory, 'spatial-library.cjs');

try {
  await build({
    entryPoints: [resolve('src/SpatialLibrary.ts')],
    outfile: spatialModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });

  const require = createRequire(import.meta.url);
  const { SPATIAL_LIBRARY } = require(spatialModule);
  const model = SPATIAL_LIBRARY.turbocharger;
  assert.ok(model, 'turbocharger must be registered in SPATIAL_LIBRARY');
  assert.equal(model.id, 'turbocharger');
  assert.equal(model.modelKind, 'PROCEDURAL_EDUCATIONAL_MODEL');
  assert.equal(model.evidence?.geometryAuthority, 'PROCEDURAL');
  assert.equal(model.evidence?.simulationStatus, 'PRESENTATION_ANIMATION');
  assert.equal(model.capabilities?.validatedSimulation, false);
  assert.equal(model.capabilities?.exportStep, false);
  assert.ok(model.evidence?.limitations?.length >= 3, 'procedural limits must be explicit');

  const components = model.components || [];
  const ids = components.map((component) => component.id);
  const idSet = new Set(ids);
  assert.ok(components.length >= 16, 'detailed assembly should expose at least 16 components');
  assert.equal(idSet.size, ids.length, 'component IDs must be unique');

  for (const component of components) {
    assert.ok(component.name && component.description, component.id + ' needs a name and description');
    assert.equal(component.position.length, 3, component.id + ' needs a 3D position');
    assert.equal(component.size.length, 3, component.id + ' needs a 3D size');
    assert.equal(component.explodedOffset.length, 3, component.id + ' needs an exploded offset');
    assert.ok(component.subsystemId, component.id + ' needs a subsystem');
  }

  for (const partId of model.explodedParts || []) {
    assert.ok(idSet.has(partId), 'explodedParts contains unknown ID: ' + partId);
  }
  for (const [pathName, pathIds] of Object.entries(model.educationalInformation?.functionalPaths || {})) {
    assert.ok(pathIds.length >= 2, pathName + ' should describe a connected functional path');
    for (const partId of pathIds) {
      assert.ok(idSet.has(partId), pathName + ' references unknown component: ' + partId);
    }
  }

  const renderer = await readFile(resolve('src/generators/TurboPrecision.tsx'), 'utf8');
  const scene = await readFile(resolve('src/SpatialObjectEngine.tsx'), 'utf8');
  for (const id of ids) {
    assert.ok(renderer.includes(`case '${id}':`) || renderer.includes(`case \"${id}\":`), 'renderer is missing a component case for ' + id);
  }
  assert.match(renderer, /makeSweptBladeGeometry/, 'curved rotor blade generator is required');
  assert.match(renderer, /areaGrowth/, 'volute cross-section must expand along its scroll');
  assert.match(renderer, /computeFrenetFrames/, 'volute geometry must use a stable swept frame');
  assert.match(renderer, /isKinematicPlaying/, 'rotor animation must honor ADVIS playback state');
  assert.match(renderer, /kinematicSpeed/, 'rotor animation must honor ADVIS playback speed');
  assert.match(scene, /renderTurboPrecisionComponent\(objectId, id, \{[\s\S]{0,180}isKinematicPlaying,[\s\S]{0,100}kinematicSpeed/s, 'ADVIS must pass playback state to turbo geometry');

  console.log('Turbocharger contract passed: ' + components.length + ' unique components, ' + Object.keys(model.educationalInformation?.functionalPaths || {}).length + ' connected paths, complete renderer dispatch, expanding volutes, swept blades, and synchronised playback wiring.');
} catch (error) {
  console.error('Turbocharger contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
