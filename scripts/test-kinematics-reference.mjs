import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-kinematics-test-'));
const modelModule = join(temporaryDirectory, 'four-stroke-model.cjs');

try {
  await build({
    entryPoints: [resolve('src/scientific/FourStrokeEngineModel.ts')],
    outfile: modelModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });
  const require = createRequire(import.meta.url);
  const { FourStrokeEngineModel } = require(modelModule);
  const simulation = FourStrokeEngineModel.simulation;
  const defaultState = Object.fromEntries(Object.values(simulation.variables).map((variable) => [variable.id, variable.defaultValue]));
  const defaultParameters = simulation.parameters;
  const step = (angle, dt, parameters = defaultParameters) =>
    simulation.stepFunction({ ...defaultState, crankAngle: angle }, dt, { ...defaultParameters, ...parameters });

  assert.equal(simulation.validation.level, 'KINEMATIC');
  assert.ok(simulation.validation.assumptions.length > 0);
  assert.ok(simulation.validation.limitations.length > 0);
  assert.equal(simulation.variables.cylinderPressure.unit, 'relative index');
  assert.match(simulation.variables.cylinderPressure.description, /not a physical cylinder-pressure prediction/i);

  for (const angle of [0, 90, 180, 270, 360, 450, 540, 630]) {
    const state = step(angle, 0);
    assert.ok(Number.isFinite(state.crankAngle));
    assert.ok(state.crankAngle >= 0 && state.crankAngle < 720);
    assert.ok(Math.abs(state.pistonHeight_cyl1) <= 0.4400001, 'piston 1 must remain within crank-throw displacement');
    assert.ok(Math.abs(state.pistonHeight_cyl2) <= 0.4400001, 'piston 2 must remain within crank-throw displacement');
    assert.ok(state.intakeValveLift >= 0 && state.intakeValveLift <= 11.2);
    assert.ok(state.exhaustValveLift >= 0 && state.exhaustValveLift <= 11.2);
  }

  assert.equal(step(720, 0).crankAngle, 0, '720 degree phase must wrap to the cycle origin');
  assert.equal(step(0, 0).crankAngle, 0, 'zero time must not advance the cycle');
  assert.equal(step(0, 0.1, { rpm: 600 }).crankAngle, 360, '600 rpm should advance 360 crank degrees in 0.1 seconds');
  assert.equal(step(0, 0.1, { rpm: 1200 }).crankAngle, 0, '1200 rpm should complete a full 720 degree cycle in 0.1 seconds');
  assert.ok(step(0, 0, { throttle: 0 }).cylinderPressure < step(0, 0, { throttle: 100 }).cylinderPressure,
    'throttle changes only the relative teaching indicator');
  assert.notEqual(step(346, 0, { sparkAdvance: 14 }).sparkFiring, step(346, 0, { sparkAdvance: 24 }).sparkFiring,
    'spark timing must move with its illustrative parameter');
  assert.equal(step(180, 0).crankAngle, 180);
  assert.equal(step(360, 0).crankAngle, 360);
  assert.equal(step(540, 0).crankAngle, 540);

  console.log('Kinematic reference tests passed: cycle wrapping, RPM conversion, bounded slider-crank motion, valve-lift limits, and honest indicator semantics.');
} catch (error) {
  console.error('Kinematic reference tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
