// HWP 뷰어 — 파일은 이 브라우저 안에서만 연다. 어디에도 보내지 않는다.
// 본 제품은 한컴의 HWP 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다.
// 문서 해석·그리기: rhwp (MIT, © 2025-2026 Edward Kim) — lib/LICENSE-rhwp.txt
import init, { HwpDocument } from './lib/rhwp.js?v=0.8.6';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const pagesEl = $('pages');
const say = (msg, err) => { statusEl.textContent = msg; statusEl.classList.toggle('err', !!err); };

// rhwp 가 줄바꿈을 계산할 때 글자 폭을 물어본다. 화면에 그리는 글꼴과 같은 방식으로 재야 줄이 맞는다.
let mctx = null, lastFont = '';
globalThis.measureTextWidth = (font, text) => {
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  if (font !== lastFont) { mctx.font = font; lastFont = font; }
  return mctx.measureText(text).width;
};

let wasmOk = false;
const ready = init({ module_or_path: new URL('./lib/rhwp_bg.wasm', import.meta.url) })
  .then(() => { wasmOk = true; say('준비됐어요. 파일을 고르세요.'); })
  .catch((e) => { console.error(e); say('뷰어를 불러오지 못했어요. 새로고침 해 주세요.', true); throw e; });

let doc = null, sizes = [], zoom = 1, fitScale = 1, rendered = new Set(), io = null, docName = '';

function friendlyError(e) {
  const m = String(e && (e.message || e)).toLowerCase();
  if (/암호|password|encrypt/.test(m)) return '암호가 걸린 문서라 열 수 없어요.';
  if (/배포|distribut/.test(m)) return '배포용(보호된) 문서라 열 수 없어요.';
  if (/hwp3|버전|version/.test(m)) return '아주 오래된 한글 형식이라 열지 못했어요.';
  return '이 파일은 열지 못했어요. 한글 파일(.hwp, .hwpx)이 맞는지 확인해 주세요.';
}

async function openFile(file) {
  if (!file) return;
  say('여는 중…');
  try { await ready; } catch { return; }
  let next;
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    next = new HwpDocument(buf);
    if (!next.pageCount()) throw new Error('empty');
  } catch (e) {
    console.error(e);
    try { next && next.free(); } catch {}
    if (document.body.classList.contains('viewing')) closeDoc(true);
    say(friendlyError(e), true);
    return;
  }
  if (doc) { try { doc.free(); } catch {} }
  doc = next;
  docName = (file.name || '문서').replace(/\.(hwpx?|hml)$/i, '');
  $('fname').textContent = file.name || '문서';
  if (!document.body.classList.contains('viewing')) {
    document.body.classList.add('viewing');
    try { history.pushState({ v: 1 }, ''); } catch {}
  }
  build();
  window.scrollTo(0, 0);
  say('');
}

function build() {
  const n = doc.pageCount();
  sizes = [];
  for (let i = 0; i < n; i++) {
    let w = 794, h = 1123;
    try { const p = JSON.parse(doc.getPageInfo(i)); w = p.width || w; h = p.height || h; } catch {}
    sizes.push([w, h]);
  }
  rendered = new Set();
  if (io) io.disconnect();
  pagesEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  sizes.forEach(([w, h], i) => {
    const d = document.createElement('div');
    d.className = 'page';
    d.dataset.i = i;
    d.style.setProperty('--pw', w + 'px');
    d.style.setProperty('--ph', h + 'px');
    d.innerHTML = `<div class="ph">${i + 1}쪽</div>`;
    frag.appendChild(d);
  });
  pagesEl.appendChild(frag);
  // 인쇄 용지 크기를 첫 쪽에 맞춘다
  let ps = $('page-size');
  if (!ps) { ps = document.createElement('style'); ps.id = 'page-size'; document.head.appendChild(ps); }
  ps.textContent = `@page{size:${sizes[0][0]}px ${sizes[0][1]}px;margin:0}`;
  zoom = 1;
  layout();
  io = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) renderPage(+en.target.dataset.i);
  }, { rootMargin: '1200px 0px' });
  pagesEl.querySelectorAll('.page').forEach((el) => io.observe(el));
  updatePg();
}

function layout() {
  if (!sizes.length) return;
  const maxW = Math.max(...sizes.map((s) => s[0]));
  const avail = Math.max(200, (pagesEl.clientWidth || window.innerWidth) - 16);
  fitScale = Math.min(1.25, avail / maxW);
  const z = fitScale * zoom;
  pagesEl.querySelectorAll('.page').forEach((el) => {
    const [w, h] = sizes[+el.dataset.i];
    el.style.width = (w * z) + 'px';
    el.style.height = (h * z) + 'px';
  });
  pagesEl.style.alignItems = z * maxW > avail ? 'flex-start' : 'center';
  $('zfit').textContent = Math.round(z * 100) + '%';
}

// 여러 쪽의 SVG 가 한 화면에 있으니 id 가 겹치지 않게 쪽 번호를 붙인다
function scopeIds(svg, i) {
  const p = `p${i}_`;
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${p}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${p}${id})`)
    .replace(/(xlink:href|href)="#([^"]+)"/g, (_, a, id) => `${a}="#${p}${id}"`);
}

function renderPage(i) {
  if (rendered.has(i) || !doc) return;
  rendered.add(i);
  const el = pagesEl.children[i];
  try {
    el.innerHTML = scopeIds(doc.renderPageSvg(i), i);
    const svg = el.querySelector('svg');
    if (svg) { svg.removeAttribute('width'); svg.removeAttribute('height'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); }
  } catch (e) {
    console.error('page', i, e);
    el.innerHTML = `<div class="perr">${i + 1}쪽을 그리지 못했어요.</div>`;
  }
}

function renderAll() { for (let i = 0; i < sizes.length; i++) renderPage(i); }

function currentPage() {
  const mid = window.innerHeight * 0.35;
  const els = pagesEl.children;
  for (let i = 0; i < els.length; i++) {
    const r = els[i].getBoundingClientRect();
    if (r.bottom > mid) return i;
  }
  return els.length - 1;
}
function updatePg() {
  if (!sizes.length) return;
  const c = currentPage();
  $('pg').textContent = `${c + 1} / ${sizes.length}`;
  $('prev').disabled = c <= 0;
  $('next').disabled = c >= sizes.length - 1;
}
function goPage(i) {
  i = Math.max(0, Math.min(sizes.length - 1, i));
  const el = pagesEl.children[i];
  const barH = document.querySelector('.bar').offsetHeight;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - barH - 8, behavior: 'smooth' });
}
function setZoom(z) {
  const c = currentPage();
  zoom = Math.max(0.3, Math.min(4, z));
  layout();
  goPage(c);
}

function closeDoc(silent) {
  if (io) io.disconnect();
  pagesEl.innerHTML = '';
  sizes = [];
  if (doc) { try { doc.free(); } catch {} doc = null; }
  document.body.classList.remove('viewing');
  $('file').value = '';
  if (!silent) say(wasmOk ? '준비됐어요. 파일을 고르세요.' : '뷰어 준비 중…');
}

// ── 이벤트 ──
$('file').addEventListener('change', (e) => openFile(e.target.files[0]));
const drop = $('drop');
['dragenter', 'dragover'].forEach((t) => window.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => window.addEventListener(t, (e) => { e.preventDefault(); if (t === 'drop' || e.target === document.documentElement) drop.classList.remove('over'); }));
window.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) openFile(f); });

$('prev').onclick = () => goPage(currentPage() - 1);
$('next').onclick = () => goPage(currentPage() + 1);
$('zin').onclick = () => setZoom(zoom * 1.25);
$('zout').onclick = () => setZoom(zoom / 1.25);
$('zfit').onclick = () => setZoom(1);
$('close').onclick = () => { if (history.state && history.state.v) history.back(); else closeDoc(); };
window.addEventListener('popstate', () => { if (document.body.classList.contains('viewing')) closeDoc(); });

let ticking = false;
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; updatePg(); }); } }, { passive: true });
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); updatePg(); }, 150); });

const origTitle = document.title;
window.addEventListener('beforeprint', () => { renderAll(); if (docName) document.title = docName; });
window.addEventListener('afterprint', () => { document.title = origTitle; });
$('print').onclick = () => {
  const b = $('print'); const keep = b.innerHTML; b.disabled = true; b.textContent = '준비 중…';
  setTimeout(() => {
    renderAll();
    b.disabled = false; b.innerHTML = keep;
    window.print();
  }, 30);
};
document.addEventListener('keydown', (e) => {
  if (!doc || e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') goPage(currentPage() + 1);
  else if (e.key === 'ArrowLeft') goPage(currentPage() - 1);
});

// 설치된 앱(PWA)에서 「연결 프로그램」으로 열었을 때
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(async (params) => {
    if (params.files && params.files.length) openFile(await params.files[0].getFile());
  });
}

// 안드로이드 「공유」로 받은 파일 — 서비스워커가 잠깐 기기 안 캐시에 넣어둔 것을 꺼낸다
if (new URLSearchParams(location.search).has('shared') && 'caches' in window) {
  (async () => {
    try {
      const c = await caches.open('hwp-share');
      const r = await c.match('shared-file');
      if (r) {
        const name = decodeURIComponent(r.headers.get('X-File-Name') || 'shared.hwp');
        const blob = await r.blob();
        await c.delete('shared-file');
        openFile(new File([blob], name));
      } else say('공유받은 파일을 찾지 못했어요. 파일을 직접 골라 주세요.', true);
    } catch (e) { console.error(e); }
    try { history.replaceState(null, '', location.pathname); } catch {}
  })();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
