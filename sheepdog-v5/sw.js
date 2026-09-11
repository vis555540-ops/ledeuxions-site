// sw.js — 양몰이 v5.0. 파일 바꾸면 판 문자열을 올린다.
const 판 = "양몰이-v5.0b";
const 핵심 = ["./","index.html","manifest.json","자료.js","문구.js","저장.js","소리.js","광고.js","그림.js","규칙_생성기.js","게임.js","화면.js","아이콘.png",
  "양_동작.png","개/보더콜리.png","개/코기.png","개/골든리트리버.png","개/진도견.png","개/삽살개.png","개/저먼셰퍼드.png",
  "소리/누름.mp3","소리/들임.mp3","소리/배경_목장.mp3","소리/배경_첫화면.mp3","소리/양.mp3","소리/이김.mp3","소리/짐.mp3","소리/짖기.mp3","소리/짖기_보더콜리.mp3","소리/짖기_골든리트리버.mp3"];
self.addEventListener("install", e => { e.waitUntil(caches.open(판).then(c => Promise.all(핵심.map(f => c.add(f).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==판).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return; // 광고 등 외부는 건드리지 않음
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const cp=res.clone(); caches.open(판).then(c=>c.put(e.request,cp)); } return res; }).catch(()=>caches.match("index.html"))));
});
