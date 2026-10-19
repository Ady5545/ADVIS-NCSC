import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const viteCli = resolve(process.cwd(), 'node_modules/vite/bin/vite.js');

const host = '127.0.0.1';
const port = 4179;
const origin = `http://${host}:${port}`;
const serverOutput = [];
const server = spawn(process.execPath, [
  viteCli, 'preview',
  '--host', host,
  '--port', String(port),
  '--strictPort',
], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: 'true', VERCEL: '1' } });
server.stdout.on('data', (chunk) => serverOutput.push(String(chunk)));
server.stderr.on('data', (chunk) => serverOutput.push(String(chunk)));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchWithTimeout(url, timeoutMs = 1800) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'error' });
  } finally {
    clearTimeout(timeout);
  }
}

try {
  let response;
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Vite preview exited early with code ${server.exitCode}.`);
    try {
      response = await fetchWithTimeout(origin);
      if (response.ok) break;
      lastError = new Error(`Preview returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await wait(200);
  }
  assert.ok(response?.ok, `Production-like preview did not become ready: ${lastError?.message || 'no response'}. Server output: ${serverOutput.join('').slice(-1200)}`);
  assert.match(response.headers.get('content-type') || '', /text\/html/i, 'Root response must be HTML');
  const html = await response.text();
  assert.match(html, /<div[^>]+id=["']root["']/i, 'Root app mount node must be present');
  assert.match(html, /<title>[^<]+<\/title>/i, 'Document title must exist');

  const assets = [...html.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)]
    .map((match) => match[1])
    .filter((asset) => asset.startsWith('/') && !asset.startsWith('//') && !asset.startsWith('/#'))
    .filter((asset) => /\.(?:js|css|woff2?|svg|png|webp|glb|gltf)(?:\?|$)/i.test(asset));
  assert.ok(assets.length > 0, 'Built HTML should reference at least one local app asset');
  const uniqueAssets = [...new Set(assets)];
  for (const asset of uniqueAssets) {
    const assetResponse = await fetchWithTimeout(new URL(asset, origin).href);
    assert.equal(assetResponse.status, 200, `Local asset ${asset} should be served by the production preview`);
    const bytes = await assetResponse.arrayBuffer();
    assert.ok(bytes.byteLength > 0, `Local asset ${asset} must not be empty`);
  }

  console.log(`Production-like HTTP smoke test passed: root document, app mount point, title and ${uniqueAssets.length} local assets returned successfully.`);
  console.log('Limitation: this HTTP test does not launch a browser, create WebGL, or verify user interactions.');
} catch (error) {
  console.error('Production-like HTTP smoke test failed:', error);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => server.once('exit', resolve)), wait(1500)]);
  if (server.exitCode === null) server.kill('SIGKILL');
}
