// sw.js — 양몰이 v5.0. 파일 바꾸면 판 문자열을 올린다.
const 판 = "양몰이-v5.17";
const 핵심 = ["./","index.html","manifest.json","자료.js","문구.js","저장.js","소리.js","광고.js","그림.js","규칙_생성기.js","게임.js","화면.js","아이콘.png",
  "양_동작.png","늑대.png","여우.png","개/보더콜리.png","개/코기.png","개/골든리트리버.png","개/진도견.png","개/삽살개.png","개/저먼셰퍼드.png",
  "소리/누름.mp3","소리/들임.mp3","소리/배경_목장.mp3","소리/배경_첫화면.mp3","소리/양.mp3","소리/이김.mp3","소리/짐.mp3","소리/짖기.mp3","소리/짖기_보더콜리.mp3","소리/짖기_골든리트리버.mp3"];
self.addEventListener("install", e => { e.waitUntil(caches.open(판).then(c => Promise.all(핵심.map(f => c.add(f).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==판).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
// 🚨 2026-09-13: 코드는 「새것 먼저」, 그림·소리는 「캐시 먼저」.
//   전에는 전부 캐시 먼저라 고친 코드가 폰에 안 내려갔다. 형 크롬에서 아무것도 안 바뀌었다.
//   그리고 .js 를 못 받았을 때 index.html 을 대신 내주고 있었다. 그러면 브라우저가
//   HTML 을 자바스크립트로 읽어서 화면이 통째로 빈다. 이제 문서 요청에만 그렇게 한다.
const 코드인가 = (p) => /\.(html|js|json)$/.test(p) || p.endsWith("/");
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url); if (u.origin !== location.origin) return; // 광고 등 외부는 건드리지 않음
  const 문서 = e.request.mode === "navigate";
  const 담기 = (res) => { if (res && res.ok && res.status === 200) { const cp = res.clone(); caches.open(판).then(c => c.put(e.request, cp)); } return res; };
  if (문서 || 코드인가(u.pathname)) {
    e.respondWith(fetch(e.request).then(담기).catch(() => caches.match(e.request).then(r => r || (문서 ? caches.match("index.html") : Response.error()))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(담기).catch(() => Response.error())));
  }
});
