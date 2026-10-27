// 한판퍼즐 서비스워커 — 코드는 「새것 먼저」, 없으면 캐시(오프라인).
// 🚨 고치면 판 번호를 올리고 index.html 의 ?v= 도 같이 올릴 것.
const 판 = 'hanpan-v4';
const 파일 = ['./', 'index.html', 'ads.js?v=4', 'app.js?v=4', 'puzzles.js?v=4', 'manifest.json', 'icon-192.png', 'icon-512.png', 'privacy/'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(판).then(c => c.addAll(파일)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== 판).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(판).then(c => c.put(req, cp)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
