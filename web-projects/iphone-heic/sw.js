/* HEIC Converter — service worker
 * 1) offline: precache core files, cache-first for everything under /web-projects/iphone-heic/
 * 2) share_target: intercept POST /web-projects/iphone-heic/share-target, stash files, redirect to app
 */
const VERSION = 'heic-v1';
const CACHE = `heic-cache-${VERSION}`;
const SHARE_CACHE = 'heic-shared-files';        // temporary store for shared files
const SCOPE = '/web-projects/iphone-heic/';
const SHARE_ACTION = SCOPE + 'share-target';

// Everything the app needs to boot with no network.
// Add css/js/font files here if index.html references others.
const CORE = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
  SCOPE + 'vendor/heic2any.min.js',
  SCOPE + 'vendor/jszip.min.js',
  SCOPE + 'icons/icon-192.png',
  SCOPE + 'icons/icon-512.png',
  SCOPE + 'icons/icon-192-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('heic-cache-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // --- share_target: POST from the Android share sheet ---
  if (e.request.method === 'POST' && url.pathname === SHARE_ACTION) {
    e.respondWith(handleShare(e.request));
    return;
  }

  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE)) return;

  // cache-first, then network (and store), then offline fallback to index
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match(SCOPE + 'index.html');
        return Response.error();
      });
    })
  );
});

// Store each shared file as a cached Response, then redirect the client to the app
// with ?share=1 so index.html knows to pull them out.
async function handleShare(request) {
  try {
    const form = await request.formData();
    const files = form.getAll('files').filter((f) => f && f.size > 0);
    const cache = await caches.open(SHARE_CACHE);
    // clear leftovers from a previous share
    for (const k of await cache.keys()) await cache.delete(k);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const headers = new Headers({
        'Content-Type': f.type || 'image/heic',
        'X-File-Name': encodeURIComponent(f.name || `shared-${i}.heic`)
      });
      await cache.put(`${SCOPE}shared/${i}`, new Response(f, { headers }));
    }
    return Response.redirect(`${SCOPE}?share=${files.length}`, 303);
  } catch (err) {
    return Response.redirect(`${SCOPE}?share=error`, 303);
  }
}

// Client asks for the shared files; we hand back Blobs and wipe the store.
self.addEventListener('message', async (e) => {
  if (!e.data || e.data.type !== 'GET_SHARED_FILES') return;
  const cache = await caches.open(SHARE_CACHE);
  const keys = await cache.keys();
  const files = [];
  for (const k of keys) {
    const res = await cache.match(k);
    const blob = await res.blob();
    const name = decodeURIComponent(res.headers.get('X-File-Name') || 'shared.heic');
    files.push(new File([blob], name, { type: blob.type || 'image/heic' }));
    await cache.delete(k);
  }
  e.source.postMessage({ type: 'SHARED_FILES', files });
});
