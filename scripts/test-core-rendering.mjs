import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [core, volume, app] = await Promise.all([
  readFile(new URL('../src/HologramCore.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/NebulaVolume.ts', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
]);

const inlineShaders = [...core.matchAll(/fragmentShader:\s*\[([\s\S]*?)\]\.join\("\\n"\)/g)]
  .map((match) => match[1]);
assert.equal(inlineShaders.length, 4, 'All four deployed Core shader programs must remain present.');

for (const [index, shader] of inlineShaders.entries()) {
  assert.doesNotMatch(shader, /precision highp float/,
    `Core shader ${index + 1} must use the precision selected by the active renderer.`);
  const outputIndex = shader.lastIndexOf('gl_FragColor =');
  const conversionIndex = shader.indexOf('#include <colorspace_fragment>');
  assert.ok(outputIndex >= 0, `Core shader ${index + 1} must write a fragment colour.`);
  assert.ok(conversionIndex > outputIndex,
    `Core shader ${index + 1} must convert its final output to the display colour space.`);
}

assert.ok(inlineShaders[0].indexOf('#include <tonemapping_fragment>') > inlineShaders[0].lastIndexOf('gl_FragColor ='),
  'The core surface must keep tone mapping before colour-space conversion.');
assert.doesNotMatch(volume, /precision highp float/,
  'The volumetric shader must not require optional highp fragment precision.');
assert.ok(volume.indexOf('#include <colorspace_fragment>') > volume.lastIndexOf('gl_FragColor ='),
  'The ray-marched nebula volume must convert its final colour to the renderer output space.');

assert.match(app, /dpr=\{\[0\.75, 1\.25\]\}/,
  'Canvas pixel density must be capped to reduce fragment work on high-DPI displays.');
assert.match(app, /<PerformanceMonitor[\s\S]*?onChange=\{\(\{ factor \}\)/,
  'Canvas pixel density must adapt to measured device frame rate.');
assert.match(app, /onFallback=\{\(\) => setDpr\(0\.75\)\}/,
  'A sustained low-performance device must retain a lower-resolution fallback.');
assert.match(app, /gl=\{\{ antialias: true, alpha: true, powerPreference: 'default' \}\}/,
  'Existing antialiasing and alpha transparency must remain, without forcing a high-power GPU.');
assert.match(app, /shadows=\{isSpatial\}/,
  'Shadow maps must only be active for spatial model workspaces.');
assert.match(app, /isSpatial && \([\s\S]*?<EnvironmentErrorBoundary>/,
  'Studio HDR resources must be deferred until a spatial model workspace is active.');
assert.match(app, /<ContactShadows[\s\S]*?resolution=\{1024\}/,
  'Full-quality contact shadows must remain available in spatial model workspaces.');
assert.match(app, /<Bloom[\s\S]*?<Noise/,
  'The deployed bloom and noise visual effects must remain in place.');
assert.match(app, /<HologramCore[\s\S]*?isHome=/,
  'The deployed Nebula Core and its home positioning must remain wired into the app.');

console.log('Nebula Core rendering regression checks passed: renderer-selected shader precision, output colour management, adaptive DPR, deferred Home-only-unused HDR/shadows, and preserved visual/model features.');
