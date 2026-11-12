import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [core, app] = await Promise.all([
  readFile(new URL('../src/HologramCore.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
]);

const shaderSources = [
  ['nebula', core.match(/const nebulaFragmentShader = `([\s\S]*?)`;/)?.[1]],
  ['atmosphere', core.match(/const atmosphereFragmentShader = `([\s\S]*?)`;/)?.[1]],
  ['gas ribbon', core.match(/const gasRibbonFragmentShader = `([\s\S]*?)`;/)?.[1]],
];

for (const [name, shader] of shaderSources) {
  assert.ok(shader, `The ${name} fragment shader must exist.`);
  const outputIndex = shader.lastIndexOf('gl_FragColor =');
  const conversionIndex = shader.indexOf('#include <colorspace_fragment>');
  assert.ok(outputIndex >= 0, `The ${name} shader must write a fragment color.`);
  assert.ok(
    conversionIndex > outputIndex,
    `The ${name} shader must convert its final linear output to the renderer color space.`,
  );
}

assert.match(core, /for \(int octave = 0; octave < 3; octave\+\+\)/,
  'The approved three-octave volumetric nebula detail must remain intact.');
assert.equal((core.match(/side: THREE\.DoubleSide/g) || []).length, 3,
  'Nebula, atmosphere, and gas ribbon materials must preserve their approved transparent two-sided rendering.');
assert.match(core, /ribbon\.geometry\.dispose\(\)/,
  'Ribbon GPU geometry must be disposed when the Core unmounts.');

assert.match(app, /dpr=\{\[0\.78, 1\.3\]\}/,
  'The canvas must cap high-DPI rendering and retain a low-resolution fallback.');
assert.match(app, /<PerformanceMonitor[\s\S]*?onChange=\{\(\{ factor \}\)/,
  'Canvas pixel density must adapt to measured frame rate.');
assert.match(app, /gl=\{\{ antialias: true, powerPreference: 'default' \}\}/,
  'Existing antialiasing should remain enabled while allowing battery-aware browser GPU selection.');
assert.match(app, /shadows=\{isSpatial\}/,
  'Expensive shadow maps must only be active for spatial workspaces.');
assert.match(app, /isSpatial && \([\s\S]*?<EnvironmentErrorBoundary>/,
  'Studio HDR must load only when a spatial workspace is active.');
assert.match(app, /resolution=\{1024\}/,
  'Existing high-quality spatial contact shadows must remain intact.');
assert.match(app, /<EffectComposer>/,
  'The existing multisampled post-processing pipeline must remain intact.');
assert.match(app, /<Bloom[\s\S]*?<ChromaticAberration[\s\S]*?<Noise/,
  'Bloom, chromatic aberration, and noise features must remain present.');

console.log('Core rendering regression checks passed: output color-space conversion, preserved three-octave nebula detail and transparent shells, adaptive DPR, deferred home-screen model lighting/shadows, and retained antialiasing, MSAA, and visual effects.');
