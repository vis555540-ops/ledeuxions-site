// 오프라인 캐시 (전기 나가도, 인터넷 없어도 작동 — 병상에서 중요)
const C="malhae-v1";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","./index.html","./manifest.json"])));self.skipWaiting();});
self.addEventListener("activate",e=>self.clients.claim());
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match("./index.html"))));});
