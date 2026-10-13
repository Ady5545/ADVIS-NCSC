import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-simulation-test-'));
const bundledModule = join(temporaryDirectory, 'simulation-engine.cjs');

try {
  await build({
    entryPoints: [resolve('src/scientific/SimulationEngine.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: false,
    logLevel: 'silent',
  });
  const require = createRequire(import.meta.url);
  const { SimulationEngine } = require(bundledModule);

  const model = {
    id: 'simulation-contract-test',
    name: 'Deterministic Simulation Test',
    scientificTitle: 'Test fixture only',
    domain: 'PHYSICS',
    description: 'Synthetic unit-test model; no real-world physical claim.',
    subsystems: [],
    components: {},
    relationships: [],
    diagrams: [],
    simulation: {
      variables: {
        crankAngle: { id: 'crankAngle', name: 'Crank angle', unit: 'deg', defaultValue: 0, min: 0, max: 720, isDynamic: true, description: 'Test angle' },
        output: { id: 'output', name: 'Output', unit: 'unit', defaultValue: 0, isDynamic: true, description: 'Mirrors test parameter' },
      },
      parameters: { rpm: 600 },
      parameterDefinitions: { rpm: { name: 'RPM', unit: 'rpm', min: 100, max: 5000, description: 'Unit-test control' } },
      cycleLengthDeg: 720,
      maxStepSeconds: 0.1,
      fixedTimeStepSeconds: 0.01,
      cyclePhases: [
        { id: 'a', name: 'Phase A', startVal: 0, endVal: 180, description: 'Test', color: '#111111' },
        { id: 'b', name: 'Phase B', startVal: 180, endVal: 360, description: 'Test', color: '#222222' },
        { id: 'c', name: 'Phase C', startVal: 360, endVal: 540, description: 'Test', color: '#333333' },
        { id: 'd', name: 'Phase D', startVal: 540, endVal: 720, description: 'Test', color: '#444444' },
      ],
      stepFunction: (current, dt, parameters) => ({
        ...current,
        crankAngle: ((current.crankAngle + dt * parameters.rpm * 6) % 720 + 720) % 720,
        output: parameters.rpm,
      }),
    },
  };

  const engine = new SimulationEngine(model);
  assert.equal(engine.getIsRunning(), false, 'new simulation must begin paused');
  assert.equal(engine.getVariable('crankAngle'), 0, 'initial state must use defaults');
  assert.equal(engine.step(0.01), true, 'manual step should be supported while paused');
  assert.equal(engine.getVariable('crankAngle'), 36, 'manual step must advance deterministic fixture state');

  assert.equal(engine.setParameter('rpm', 9000), true, 'known finite parameter should be accepted and clamped');
  assert.equal(engine.getParameter('rpm'), 5000, 'parameter ranges must be enforced');
  assert.equal(engine.getVariable('output'), 5000, 'dependent outputs should be reevaluated when an input changes');
  assert.equal(engine.setParameter('rpm', Number.NaN), false, 'non-finite parameter must be rejected');
  assert.match(engine.getLastError() || '', /finite number/i);

  assert.equal(engine.scrubToAngle(810), true, 'scrub should accept a finite cycle angle');
  assert.equal(engine.getVariable('crankAngle'), 90, 'scrub should wrap around the declared 720 degree cycle');
  assert.equal(engine.getCurrentCyclePhase()?.id, 'a', 'cycle phase should follow the scrubbed angle');

  assert.equal(engine.setVariable('crankAngle', 250), true, 'known variable should be accepted');
  assert.equal(engine.getCurrentCyclePhase()?.id, 'b', 'phase should be recalculated after variable changes');
  assert.equal(engine.step(Number.NaN), false, 'invalid timestep must be rejected');

  let notifications = 0;
  const unsubscribe = engine.subscribe(() => notifications += 1);
  assert.ok(notifications >= 1, 'subscriber should receive an initial state snapshot');
  engine.step(0.01);
  assert.ok(notifications >= 2, 'subscriber should be notified after state updates');
  unsubscribe();

  assert.equal(engine.setSpeedMultiplier(99), 10, 'simulation speed must be clamped');
  assert.equal(engine.setSpeedMultiplier(Number.POSITIVE_INFINITY), 10, 'non-finite speed must not replace current speed');

  let nextFrameId = 0;
  const frames = new Map();
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = (callback) => {
    const id = ++nextFrameId;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => { frames.delete(id); };

  assert.equal(engine.start(), true, 'simulation should start when requestAnimationFrame is available');
  assert.equal(engine.getIsRunning(), true);
  engine.pause();
  assert.equal(engine.getIsRunning(), false, 'pause must update state and cancel the frame');
  assert.equal(frames.size, 0, 'pause must cancel scheduled animation work');
  globalThis.requestAnimationFrame = previousRequest;
  globalThis.cancelAnimationFrame = previousCancel;

  engine.reset();
  assert.equal(engine.getVariable('crankAngle'), 0, 'reset should restore variable defaults');
  assert.equal(engine.getParameter('rpm'), 600, 'reset should restore parameter defaults');
  engine.dispose();
  assert.equal(engine.start(), false, 'disposed simulation must not restart');

  console.log('Simulation contract tests passed: pause/start, stepping, bounds, scrub/wrap, phase, subscriptions, reset and dispose.');
} catch (error) {
  console.error('Simulation contract tests failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
