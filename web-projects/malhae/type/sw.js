// 오프라인 캐시 — 인터넷이 끊겨도 말은 할 수 있어야 한다
const C = "malhae-type-v1";
self.addEventListener("install", e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./manifest.json"])));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match("./index.html"))));
});
