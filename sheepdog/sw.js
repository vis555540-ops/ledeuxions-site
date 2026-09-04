// 오프라인용. 파일을 바꾸면 아래 판 번호를 올려야 새 것이 내려간다.
const 판 = '양몰이-v5';
const 파일 = ['./','./index.html','./manifest.json','./아이콘.png','./양_동작.png','./개_동작.png',
  './소리/배경_목장.mp3','./소리/배경_첫화면.mp3','./소리/이김.mp3','./소리/짐.mp3','./소리/들임.mp3','./소리/짖기.mp3','./소리/양.mp3','./소리/누름.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(판).then(c => c.addAll(파일)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== 판).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(판).then(c => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request)));
});
