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

assert.match(core, /for \(int octave = 0; octave < 2; octave\+\+\)/,
  'Procedural cloud noise should use the lower-cost multi-scale sampling path.');
assert.match(core, /side: THREE\.FrontSide/,
  'The transparent spherical shells should avoid rendering their hidden back faces.');
assert.match(core, /ribbon\.geometry\.dispose\(\)/,
  'Ribbon GPU geometry must be disposed when the Core unmounts.');

assert.match(app, /dpr=\{\[0\.78, 1\.3\]\}/,
  'The canvas must cap high-DPI rendering and retain a low-resolution fallback.');
assert.match(app, /<PerformanceMonitor[\s\S]*?onChange=\{\(\{ factor \}\)/,
  'Canvas pixel density must adapt to measured frame rate.');
assert.match(app, /gl=\{\{ antialias: false \}\}/,
  'Redundant default framebuffer antialiasing must be disabled.');
assert.match(app, /shadows=\{isSpatial\}/,
  'Expensive shadow maps must only be active for spatial workspaces.');
assert.match(app, /isSpatial && \([\s\S]*?<EnvironmentErrorBoundary>/,
  'Studio HDR must load only when a spatial workspace is active.');
assert.match(app, /resolution=\{512\}/,
  'Active spatial contact shadows should use the reduced, still detailed resolution.');
assert.match(app, /<EffectComposer multisampling=\{0\}>/,
  'The post-processing pipeline must not allocate an additional MSAA buffer.');
assert.match(app, /<Bloom[\s\S]*?<ChromaticAberration[\s\S]*?<Noise/,
  'Bloom, chromatic aberration, and noise features must remain present.');

console.log('Core rendering regression checks passed: output color-space conversion, portable shader cost, adaptive DPR, conditional model lighting, reduced shadow/MSAA overhead, and retained visual effects.');
