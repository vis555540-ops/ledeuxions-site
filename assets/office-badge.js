/* 건축 상담 사무실 단추 — 오른쪽 아래 작은 알약.
   붙이는 법: <script src="/assets/office-badge.js" defer></script>
   팻말(있습니다/외출중/부재중)을 한 번 읽어 불을 켠다. 실패하면 기본 문구.
   × 누르면 그 기기에서 하루 동안 숨김. */
(function () {
  if (window.__lxOfficeBadge) return;
  window.__lxOfficeBadge = 1;

  var KEY = 'lxOfficeBadgeHideUntil';
  try { if (Date.now() < +localStorage.getItem(KEY)) return; } catch (e) {}

  var css =
    '.lxob{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483000;' +
    'display:flex;align-items:center;gap:2px;font:500 14px/1.2 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Noto Sans KR",sans-serif;' +
    '--lxob-bg:rgba(250,249,245,.94);--lxob-ink:#1F1E1B;--lxob-mut:#6B675E;--lxob-rule:#DCD8CE;' +
    'background:var(--lxob-bg);color:var(--lxob-ink);border:1px solid var(--lxob-rule);border-radius:999px;' +
    'box-shadow:0 4px 18px rgba(0,0,0,.12);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
    'transition:transform .25s ease,opacity .25s ease;max-width:calc(100vw - 28px)}' +
    '@media (prefers-color-scheme:dark){.lxob{--lxob-bg:rgba(30,29,24,.94);--lxob-ink:#EDEAE0;--lxob-mut:#9B968A;--lxob-rule:#3A372F;box-shadow:0 4px 18px rgba(0,0,0,.45)}}' +
    '.lxob a{display:flex;align-items:center;gap:8px;min-height:44px;padding:4px 4px 4px 16px;color:inherit;text-decoration:none;border-radius:999px}' +
    '.lxob a:focus-visible,.lxob button:focus-visible{outline:2px solid var(--lxob-mut);outline-offset:2px}' +
    '.lxob-dot{width:8px;height:8px;border-radius:50%;flex:none;display:none}' +
    '.lxob-dot.on{display:block;background:#2E9E5B;box-shadow:0 0 0 3px rgba(46,158,91,.2)}' +
    '.lxob-dot.off{display:block;background:#9A968C}' +
    '.lxob-t{display:flex;flex-direction:column;white-space:nowrap}' +
    '.lxob-s{font-size:12px;font-weight:400;color:var(--lxob-mut);margin-top:2px}' +
    '.lxob-s:empty{display:none}' +
    '.lxob button{flex:none;width:32px;height:32px;margin-right:6px;border:0;border-radius:50%;background:transparent;color:var(--lxob-mut);font-size:18px;line-height:1;cursor:pointer;padding:0}' +
    '.lxob button:hover{background:var(--lxob-rule)}' +
    '.lxob.small{transform:scale(.88);transform-origin:100% 100%;opacity:.9}' +
    '.lxob.small .lxob-s{display:none}' +
    '@media print{.lxob{display:none}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'lxob';
  box.innerHTML =
    '<a href="https://ledeuxions.com/사무실/" aria-label="건축 상담 사무실로 가기">' +
    '<span class="lxob-dot" aria-hidden="true"></span>' +
    '<span class="lxob-t"><span>🏢 건축 상담 사무실</span><span class="lxob-s"></span></span></a>' +
    '<button type="button" aria-label="하루 동안 닫기">×</button>';
  document.body.appendChild(box);

  var dot = box.querySelector('.lxob-dot');
  var sub = box.querySelector('.lxob-s');

  box.querySelector('button').addEventListener('click', function () {
    try { localStorage.setItem(KEY, String(Date.now() + 864e5)); } catch (e) {}
    box.remove();
  });

  // 홈의 「오늘의 양몰이」 알림이 떠 있는 동안은 비켜 있는다 (겹침 방지)
  function yield_() {
    var busy = !!document.getElementById('오늘알림');
    box.style.opacity = busy ? '0' : '';
    box.style.pointerEvents = busy ? 'none' : '';
    box.style.visibility = busy ? 'hidden' : '';
  }
  yield_();
  if (window.MutationObserver) new MutationObserver(yield_).observe(document.body, { childList: true });

  // 스크롤 내리면 살짝 작게, 올리면 원래대로
  var lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (y > 160 && y > lastY + 4) box.classList.add('small');
      else if (y < lastY - 4 || y <= 160) box.classList.remove('small');
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  // 팻말 — 페이지당 한 번, 5초
  try {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 5000);
    fetch('https://ledeuxions-office.vis555540.workers.dev/status', { signal: ctl ? ctl.signal : undefined, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        var p = d && d['팻말'];
        if (p === '있습니다') { dot.className = 'lxob-dot on'; sub.textContent = '지금 상담 가능'; }
        else if (p === '외출중' || p === '부재중') { dot.className = 'lxob-dot off'; sub.textContent = '메모 남기기'; }
      })
      .catch(function () { clearTimeout(timer); });
  } catch (e) {}
})();
