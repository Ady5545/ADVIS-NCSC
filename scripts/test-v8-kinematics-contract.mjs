import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-v8-motion-contract-'));
const bundledModule = join(temporaryDirectory, 'v8-kinematics.cjs');
const EPSILON = 1e-9;
const TDC_Y = -0.325 + 0.108 + 0.32;
const BDC_Y = -0.325 - 0.108 + 0.32;

try {
  await build({
    entryPoints: [resolve('src/scientific/V8Kinematics.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });

  const require = createRequire(import.meta.url);
  const {
    V8_BANK_ANGLE,
    V8_CYLINDER_BANK,
    V8_CYLINDER_Z,
    V8_FIRING_ORDER,
    V8_THROW_PHASES,
    getV8CylinderPosition,
    getV8FiringAngleDeg,
    resolveV8PistonKinematics,
  } = require(bundledModule);

  assert.equal(V8_BANK_ANGLE, Math.PI / 4);
  assert.equal(V8_CYLINDER_Z.length, 4);
  assert.equal(V8_THROW_PHASES.length, 4);
  assert.deepEqual(V8_FIRING_ORDER, [1, 8, 4, 3, 6, 5, 7, 2]);
  assert.equal(new Set(V8_FIRING_ORDER).size, 8, 'The example firing order must contain eight unique cylinders.');

  const bankNumbering = { L: [1, 3, 5, 7], R: [2, 4, 6, 8] };
  const testedTdcAngles = new Set();

  for (let sequenceIndex = 0; sequenceIndex < V8_FIRING_ORDER.length; sequenceIndex += 1) {
    const cylinder = V8_FIRING_ORDER[sequenceIndex];
    const firingAngle = getV8FiringAngleDeg(cylinder);
    assert.equal(firingAngle, sequenceIndex * 90, 'HUD firing events must remain evenly spaced by 90 crank degrees.');

    const position = getV8CylinderPosition(cylinder);
    assert.ok(position, 'Every firing-order cylinder must map to a physical bank and bore.');
    const expectedBank = cylinder % 2 === 1 ? 'L' : 'R';
    assert.equal(V8_CYLINDER_BANK[cylinder], expectedBank);
    assert.deepEqual(bankNumbering[expectedBank].includes(cylinder), true);
    assert.equal(position.side, expectedBank === 'L' ? -1 : 1);
    assert.equal(bankNumbering[expectedBank][position.index], cylinder,
      'Cylinder numbering must map to the matching physical Z-index.');

    const tdcDegrees = firingAngle % 360;
    testedTdcAngles.add(tdcDegrees);
    const tdc = resolveV8PistonKinematics((tdcDegrees * Math.PI) / 180, position.side, position.index);
    assert.ok(Math.abs(tdc.pistonY - TDC_Y) <= EPSILON,
      'Cylinder ' + cylinder + ' should be at TDC when the HUD assigns its firing event (' + firingAngle + '°).');
    assert.ok(Math.abs(tdc.crankX) <= EPSILON,
      'Cylinder ' + cylinder + ' crank throw should be vertically aligned at TDC.');
    assert.ok(Number.isFinite(tdc.rodAngle), 'Connecting-rod angle must remain finite.');

    const bdc = resolveV8PistonKinematics(((tdcDegrees + 180) * Math.PI) / 180, position.side, position.index);
    assert.ok(Math.abs(bdc.pistonY - BDC_Y) <= EPSILON,
      'Cylinder ' + cylinder + ' must reach BDC 180 crank degrees after its TDC.');
    assert.ok(Math.abs(bdc.crankX) <= EPSILON);

    const secondRevolutionTdc = resolveV8PistonKinematics(((tdcDegrees + 360) * Math.PI) / 180, position.side, position.index);
    assert.ok(Math.abs(secondRevolutionTdc.pistonY - TDC_Y) <= EPSILON,
      'Piston geometry repeats after one crank revolution even though the four-stroke cycle spans 720°.');
  }

  assert.deepEqual([...testedTdcAngles].sort((a, b) => a - b), [0, 90, 180, 270]);
  assert.equal(getV8FiringAngleDeg(0), null);
  assert.equal(getV8FiringAngleDeg(9), null);
  assert.equal(getV8CylinderPosition(0), null);
  assert.equal(getV8CylinderPosition(9), null);

  for (let deg = 0; deg <= 720; deg += 15) {
    for (const side of [-1, 1]) {
      for (let index = 0; index < 4; index += 1) {
        const motion = resolveV8PistonKinematics((deg * Math.PI) / 180, side, index);
        for (const [key, value] of Object.entries(motion)) {
          assert.ok(Number.isFinite(value), key + ' must stay finite at ' + deg + '°.');
        }
        assert.ok(motion.pistonY >= BDC_Y - EPSILON && motion.pistonY <= TDC_Y + EPSILON,
          'Slider-crank position must remain within its geometric stroke bounds.');
      }
    }
  }

  assert.ok(Object.values(resolveV8PistonKinematics(Number.NaN, -1, 0)).every(Number.isFinite));
  assert.ok(Object.values(resolveV8PistonKinematics(0, 1, 999)).every(Number.isFinite));

  console.log('V8 motion contract passed: all eight HUD firing events align with rendered piston TDC, 90° event spacing, consistent bank/bore mapping, 180° TDC-to-BDC travel, 360° geometric repetition, and bounded finite motion.');
} catch (error) {
  console.error('V8 motion contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
