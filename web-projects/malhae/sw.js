// 오프라인 캐시 (전기 나가도, 인터넷 없어도 작동 — 병상에서 중요)
// 2026-10-02: 인터넷 되면 늘 새 코드 먼저(network-first), 안 되면 캐시. 옛 캐시는 지운다 (옛 코드가 남아 「안 움직인다」 막기)
const C="malhae-v10";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(["./","./index.html","./manifest.json","./joystick.js"])).catch(()=>{}));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));} return r; })
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("./index.html"))));
});
