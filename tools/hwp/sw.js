// HWP 뷰어 서비스워커 — 오프라인 열기 + 안드로이드 공유로 받은 파일 넘겨주기
// 파일은 기기 안 캐시에만 잠깐 두고, 화면이 꺼내면 바로 지운다. 서버로 보내지 않는다.
const V = 'hwp-v1';
const CORE = ['./', 'app.js?v=1', 'lib/rhwp.js?v=0.8.6', 'lib/rhwp_bg.wasm', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('hwp-v') && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope);

  // 공유 대상(share_target) — POST 로 온 파일을 기기 안 캐시에 두고 화면으로 넘긴다
  if (e.request.method === 'POST' && url.pathname === scope.pathname + 'share') {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData();
        const f = fd.getAll('file').find((x) => x && x.name) || fd.get('file');
        if (f) {
          const c = await caches.open('hwp-share');
          await c.put('shared-file', new Response(f, { headers: { 'X-File-Name': encodeURIComponent(f.name || 'shared.hwp') } }));
        }
      } catch (err) {}
      return Response.redirect(scope.pathname + '?shared=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET' || !url.pathname.startsWith(scope.pathname)) return;

  // 첫 화면: 새것 먼저, 안 되면 캐시
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => {
      const cp = r.clone(); caches.open(V).then((c) => c.put('./', cp)); return r;
    }).catch(() => caches.match('./', { ignoreSearch: true })));
    return;
  }
  // 나머지: 캐시 먼저 (판번호 ?v= 로 바꾼다)
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(e.request, cp)); }
    return r;
  })));
});
