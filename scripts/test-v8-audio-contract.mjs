import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

const temporaryDirectory = await mkdtemp(join(process.cwd(), '.advis-v8-audio-contract-'));
const bundledModule = join(temporaryDirectory, 'v8-audio-math.cjs');

try {
  await build({
    entryPoints: [resolve('src/scientific/V8AudioMath.ts')],
    outfile: bundledModule,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent',
  });

  const require = createRequire(import.meta.url);
  const {
    normalizeV8AudioVolume,
    resolveV8AudioSynthesisProfile,
    shouldRunV8Audio,
  } = require(bundledModule);

  const idle = resolveV8AudioSynthesisProfile(600, 1, 0.28);
  assert.equal(idle.rpm, 600);
  assert.equal(idle.speed, 1);
  assert.equal(idle.crankFrequencyHz, 10);
  assert.equal(idle.primaryFiringHz, 40);
  assert.equal(idle.lowOrderHz, 20);
  assert.equal(idle.secondFiringHarmonicHz, 80);
  assert.equal(idle.upperFiringHarmonicHz, 120);
  assert.equal(idle.mechanicalHz, 160);
  assert.equal(idle.rpmNormalized, 0);
  assert.equal(idle.exhaustFilterHz, 240);
  assert.equal(idle.intakeResonatorHz, 320);
  assert.ok(Math.abs(idle.masterGain - 0.0448) <= 1e-12);

  const midrange = resolveV8AudioSynthesisProfile(3000, 1.5, 0.4);
  assert.equal(midrange.crankFrequencyHz, 75);
  assert.equal(midrange.primaryFiringHz, 300);
  assert.equal(midrange.lowOrderHz, 150);
  assert.equal(midrange.secondFiringHarmonicHz, 600);
  assert.equal(midrange.upperFiringHarmonicHz, 900);
  assert.equal(midrange.mechanicalHz, 1200);
  assert.equal(midrange.rpmNormalized, 0.375);

  const maximum = resolveV8AudioSynthesisProfile(7000, 2, 1);
  assert.equal(maximum.rpmNormalized, 1);
  assert.equal(maximum.crankFrequencyHz, 7000 / 60 * 2);
  assert.ok(maximum.primaryFiringHz > midrange.primaryFiringHz);
  assert.equal(maximum.exhaustFilterHz, 3240);
  assert.equal(maximum.intakeResonatorHz, 1570);
  assert.equal(maximum.intakeResonatorGainDb, 10);
  assert.equal(maximum.mechanicalFilterHz, 4500);
  assert.ok(maximum.masterGain <= 0.38);
  assert.ok(maximum.masterGain >= 0);

  const invalidInputs = [
    resolveV8AudioSynthesisProfile(Number.NaN, 1, 0.5),
    resolveV8AudioSynthesisProfile(Number.POSITIVE_INFINITY, 1, 0.5),
    resolveV8AudioSynthesisProfile(-100, 1, 0.5),
    resolveV8AudioSynthesisProfile(100000, 1, 0.5),
    resolveV8AudioSynthesisProfile(2400, Number.NaN, 0.5),
    resolveV8AudioSynthesisProfile(2400, Number.POSITIVE_INFINITY, 0.5),
    resolveV8AudioSynthesisProfile(2400, 100, Number.POSITIVE_INFINITY),
    resolveV8AudioSynthesisProfile(2400, -100, Number.NaN),
  ];
  for (const profile of invalidInputs) {
    for (const [key, value] of Object.entries(profile)) {
      assert.ok(Number.isFinite(value), 'Profile field ' + key + ' must remain finite.');
    }
    assert.ok(profile.rpm >= 0 && profile.rpm <= 7000);
    assert.ok(profile.speed >= 0.1 && profile.speed <= 2);
    assert.ok(profile.volumeLevel >= 0 && profile.volumeLevel <= 1);
    assert.ok(profile.masterGain >= 0 && profile.masterGain <= 0.38);
  }

  assert.equal(resolveV8AudioSynthesisProfile(Number.NaN).rpm, 0);
  assert.equal(resolveV8AudioSynthesisProfile(600, Number.NaN).speed, 1);
  assert.equal(resolveV8AudioSynthesisProfile(600, 100).speed, 2);
  assert.equal(normalizeV8AudioVolume(-1), 0);
  assert.equal(normalizeV8AudioVolume(2), 1);
  assert.equal(normalizeV8AudioVolume(Number.NaN, 0.42), 0.42);
  assert.equal(normalizeV8AudioVolume(Number.NaN, Number.NaN), 0.28);

  assert.equal(shouldRunV8Audio({ rpm: 600, isPlaying: true, soundEnabled: true }), true);
  assert.equal(shouldRunV8Audio({ rpm: 600, isPlaying: false, soundEnabled: true }), false);
  assert.equal(shouldRunV8Audio({ rpm: 600, isPlaying: true, soundEnabled: false }), false);
  assert.equal(shouldRunV8Audio({ rpm: 0, isPlaying: true, soundEnabled: true }), false);
  assert.equal(shouldRunV8Audio({ rpm: Number.NaN, isPlaying: true, soundEnabled: true }), false);
  assert.equal(shouldRunV8Audio({ rpm: Number.POSITIVE_INFINITY, isPlaying: true, soundEnabled: true }), false);

  const sweep = [0, 600, 1000, 3000, 5000, 7000].map((rpm) =>
    resolveV8AudioSynthesisProfile(rpm, 1, 0.28),
  );
  for (let i = 1; i < sweep.length; i += 1) {
    assert.ok(sweep[i].primaryFiringHz >= sweep[i - 1].primaryFiringHz,
      'Firing frequency must not decrease as RPM increases.');
    assert.ok(sweep[i].exhaustFilterHz >= sweep[i - 1].exhaustFilterHz,
      'Exhaust filter cutoff must not decrease as RPM increases.');
    assert.ok(sweep[i].intakeResonatorHz >= sweep[i - 1].intakeResonatorHz,
      'Intake resonator must not decrease as RPM increases.');
  }

  console.log('V8 audio contract passed: engine-order frequencies, RPM sweep, finite bounds, volume clamping, and mute/pause/zero-RPM gates.');
} catch (error) {
  console.error('V8 audio contract failed:', error);
  process.exitCode = 1;
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
