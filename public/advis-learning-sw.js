/* A.D.V.I.S. learning-shell cache: no telemetry, account data, or API responses are stored. */
'use strict';

const CACHE_PREFIX = 'advis-learning-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const MAX_CACHED_ASSETS = 180;
const NO_CACHE_PATHS = [
  /\/api\//i,
  /\/health\/?$/i,
  /\.(?:glb|gltf|step|stp|brep|brp|mp4|webm|mp3|wav|ogg)$/i,
];

function isCacheableAsset(url) {
  if (NO_CACHE_PATHS.some((pattern) => pattern.test(url.pathname))) return false;
  return /\.(?:js|mjs|css|html|json|svg|png|jpe?g|webp|ico|woff2?|ttf|wasm)$/i.test(url.pathname);
}

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHED_ASSETS) return;
  const excess = keys.length - MAX_CACHED_ASSETS;
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const root = self.registration.scope;
    try {
      const response = await fetch(root, { cache: 'reload' });
      if (response.ok) await cache.put(root, response.clone());
    } catch {
      // The worker still activates if network is unavailable during installation.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NO_CACHE_PATHS.some((pattern) => pattern.test(url.pathname))) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(self.registration.scope, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) ||
          (await cache.match(self.registration.scope)) ||
          new Response(
            '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>A.D.V.I.S. offline</title><main style="font:16px system-ui;max-width:40rem;margin:10vh auto;padding:1rem"><h1>A.D.V.I.S. is offline</h1><p>The cached application shell may still load. AI answers and uncached assets need a network connection. Reconnect and reload to restore all features.</p></main></html>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
      }
    })());
    return;
  }

  if (!isCacheableAsset(url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const network = fetch(request).then(async (response) => {
      if (response.ok && response.type === 'basic') {
        try {
          await cache.put(request, response.clone());
          await trimCache(cache);
        } catch {
          // Quota/storage failures do not prevent the network response.
        }
      }
      return response;
    }).catch(() => null);
    if (cached) {
      // Refresh in the background, but prefer the cached shell asset offline.
      void network;
      return cached;
    }
    const response = await network;
    return response || new Response('This learning asset is not cached. Reconnect and retry.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
