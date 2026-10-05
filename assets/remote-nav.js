/* LeDeuxions — 리모컨 바로가기 (remote-control navigation)
   어디서나 왼쪽에 따라다니는 작은 리모컨. 데스크톱은 왼쪽에 가느다란 레일(마우스 올리면 펼쳐짐),
   폰(≤768px)은 왼쪽 아래 둥근 단추를 누르면 리모컨이 올라온다.
   붙이는 법:  <script src="/assets/remote-nav.js" defer></script>
   - 기존 헤더/메뉴는 그대로 둔다. 이건 "추가" 내비게이션.
   - 오른쪽 아래 사무실 알약(office-badge), 가운데 아래 오늘 알림과 자리가 겹치지 않게 왼쪽을 쓴다. */
(function () {
  if (window.__lxRemoteNav) return;
  window.__lxRemoteNav = 1;

  // ── 갈 곳들 (홈 Index 에서 고른 주요 방들) ──────────────────────────
  var LINKS = [
    { href: '/',             icon: '🏠', label: '홈' },
    { href: '/글/',          icon: '✍️', label: '글·칼럼' },
    { href: '/web-projects/', icon: '🛠', label: '도구' },
    { href: '/work/',        icon: '🖼', label: '작품' },
    { href: '/games/',       icon: '🎮', label: '게임' },
    { href: '/history/',     icon: '📖', label: '이야기' },
    { href: '/사무실/',       icon: '🏢', label: '사무실' },
    { href: '/오늘/',         icon: '🐑', label: '양몰이' },
    { href: '/모아보기/',     icon: '🗂', label: '모아보기' },
    { href: '/contact/',     icon: '✉️', label: '연락' }
  ];

  // ── 지금 어느 방인지 (버튼 하나에 현재 표시) ─────────────────────────
  var here = '/';
  try { here = decodeURIComponent(location.pathname).replace(/index\.html?$/, ''); } catch (e) {}
  if (here === '') here = '/';
  function isCurrent(href) {
    if (href === '/') return here === '/';
    return here === href || here.indexOf(href) === 0;
  }

  // ── 스타일 (페이지 CSS 와 섞이지 않게 전부 .lxrn 아래로) ──────────────
  var css =
    '.lxrn{--lxrn-body:#201f1d;--lxrn-body2:#2c2a26;--lxrn-ink:#ece9e4;--lxrn-mut:#a9a498;' +
      '--lxrn-gold:#b68235;--lxrn-gold2:#e1ad66;--lxrn-rule:rgba(236,233,228,.14);--lxrn-key:#34312c;' +
      '--lxrn-key-h:#45413a;--lxrn-lcd:#1a2b22;--lxrn-lcd-ink:#7fe0a6;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;' +
      '-webkit-font-smoothing:antialiased}' +
    // ── 데스크톱: 왼쪽 가운데 고정 레일 ──
    '.lxrn-body{position:fixed;left:12px;top:50%;transform:translateY(-50%);z-index:2147482400;' +
      'display:flex;flex-direction:column;gap:7px;width:56px;max-height:calc(100vh - 24px);overflow:hidden;' +
      'padding:12px 8px;box-sizing:border-box;' +
      'background:linear-gradient(180deg,var(--lxrn-body2),var(--lxrn-body));color:var(--lxrn-ink);' +
      'border:1px solid var(--lxrn-rule);border-radius:20px;' +
      'box-shadow:0 10px 34px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.05);' +
      'transition:width .26s cubic-bezier(.2,.8,.25,1);will-change:width}' +
    '.lxrn-body:hover,.lxrn-body:focus-within{width:216px;overflow-y:auto}' +
    // 리모컨 윗부분 "화면" (LCD)
    '.lxrn-screen{display:flex;align-items:center;gap:7px;height:30px;flex:none;margin:0 1px 4px;padding:0 10px;' +
      'background:var(--lxrn-lcd);border-radius:9px;border:1px solid rgba(127,224,166,.18);' +
      'font:600 10.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;' +
      'color:var(--lxrn-lcd-ink);overflow:hidden;white-space:nowrap}' +
    '.lxrn-led{width:7px;height:7px;border-radius:50%;flex:none;background:var(--lxrn-gold2);' +
      'box-shadow:0 0 6px var(--lxrn-gold2);animation:lxrn-blink 2.6s ease-in-out infinite}' +
    '@keyframes lxrn-blink{0%,100%{opacity:1}50%{opacity:.35}}' +
    '.lxrn-screen .lxrn-cap{opacity:0;transition:opacity .2s}' +
    '.lxrn-body:hover .lxrn-screen .lxrn-cap,.lxrn-body:focus-within .lxrn-screen .lxrn-cap{opacity:1}' +
    // 버튼(키캡)
    '.lxrn-key{display:flex;align-items:center;gap:12px;min-height:40px;padding:5px;border-radius:12px;' +
      'color:var(--lxrn-ink);text-decoration:none;background:transparent;border:1px solid transparent;' +
      'transition:background .18s,border-color .18s}' +
    '.lxrn-key:hover{background:var(--lxrn-key-h)}' +
    '.lxrn-key:focus-visible{outline:2px solid var(--lxrn-gold2);outline-offset:2px}' +
    '.lxrn-ico{flex:none;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;' +
      'font-size:18px;background:var(--lxrn-key);box-shadow:inset 0 -2px 0 rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.06)}' +
    '.lxrn-lbl{font-size:13.5px;font-weight:500;white-space:nowrap;opacity:0;transition:opacity .2s;letter-spacing:.01em}' +
    '.lxrn-body:hover .lxrn-lbl,.lxrn-body:focus-within .lxrn-lbl{opacity:1}' +
    // 현재 방
    '.lxrn-key[aria-current="page"]{background:color-mix(in srgb,var(--lxrn-gold) 26%,transparent)}' +
    '.lxrn-key[aria-current="page"] .lxrn-ico{background:var(--lxrn-gold);box-shadow:inset 0 -2px 0 rgba(0,0,0,.3)}' +
    '.lxrn-key[aria-current="page"] .lxrn-lbl{color:var(--lxrn-gold2);font-weight:600}' +
    // 폰 단추(FAB) — 데스크톱에선 숨김
    '.lxrn-fab{display:none}' +
    // 가는 스크롤바
    '.lxrn-body::-webkit-scrollbar{width:0}' +
    // ── 폰 (≤768px) ──
    '@media (max-width:768px){' +
      '.lxrn-fab{display:flex;align-items:center;justify-content:center;position:fixed;' +
        'left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));z-index:2147482401;' +
        'width:54px;height:54px;border:1px solid var(--lxrn-rule);border-radius:17px;cursor:pointer;' +
        'background:linear-gradient(180deg,var(--lxrn-body2),var(--lxrn-body));color:var(--lxrn-ink);font-size:22px;' +
        'box-shadow:0 8px 24px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.06);padding:0}' +
      '.lxrn-fab:focus-visible{outline:2px solid var(--lxrn-gold2);outline-offset:2px}' +
      '.lxrn-body{left:max(14px,env(safe-area-inset-left));top:auto;transform:translateY(12px);' +
        'bottom:calc(max(14px,env(safe-area-inset-bottom)) + 64px);width:min(248px,calc(100vw - 28px));' +
        'max-height:min(70vh,440px);overflow-y:auto;opacity:0;pointer-events:none;' +
        'transition:opacity .22s,transform .22s cubic-bezier(.2,.8,.25,1)}' +
      '.lxrn-body .lxrn-lbl,.lxrn-body .lxrn-screen .lxrn-cap{opacity:1}' +
      '.lxrn[data-open="true"] .lxrn-body{opacity:1;transform:translateY(0);pointer-events:auto}' +
      '.lxrn[data-open="true"] .lxrn-fab{background:var(--lxrn-gold);color:#201f1d}' +
    '}' +
    // 밝은 화면에서도 테두리가 보이게 / 인쇄 숨김
    '@media (prefers-color-scheme:light){.lxrn-body,.lxrn-fab{border-color:rgba(32,31,29,.18)}}' +
    '@media print{.lxrn{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.lxrn-body,.lxrn-led{transition:none;animation:none}}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ── 마크업 ──────────────────────────────────────────────────────────
  var root = document.createElement('div');
  root.className = 'lxrn';
  root.setAttribute('data-open', 'false');

  // 받침에 맞춰 로/으로 고르기 (스크린리더용 라벨)
  function josaRo(word) {
    var ch = word.charCodeAt(word.length - 1) - 0xAC00;
    if (ch < 0 || ch > 11171) return '(으)로';
    var jong = ch % 28;            // 받침 없음=0, ㄹ=8
    return (jong === 0 || jong === 8) ? '로' : '으로';
  }

  var keys = LINKS.map(function (l) {
    var cur = isCurrent(l.href) ? ' aria-current="page"' : '';
    return '<a class="lxrn-key" href="' + l.href + '"' + cur +
           ' aria-label="' + l.label + josaRo(l.label) + ' 가기">' +
           '<span class="lxrn-ico" aria-hidden="true">' + l.icon + '</span>' +
           '<span class="lxrn-lbl">' + l.label + '</span></a>';
  }).join('');

  root.innerHTML =
    '<button type="button" class="lxrn-fab" aria-label="바로가기 리모컨 열기" aria-expanded="false" aria-controls="lxrn-body">📺</button>' +
    '<nav id="lxrn-body" class="lxrn-body" aria-label="바로가기 리모컨">' +
      '<div class="lxrn-screen" aria-hidden="true"><span class="lxrn-led"></span><span class="lxrn-cap">LEDEUX · 바로가기</span></div>' +
      keys +
    '</nav>';
  document.body.appendChild(root);

  // ── 폰: 단추로 열고 닫기 ────────────────────────────────────────────
  var fab = root.querySelector('.lxrn-fab');
  function setOpen(open) {
    root.setAttribute('data-open', open ? 'true' : 'false');
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  fab.addEventListener('click', function () {
    setOpen(root.getAttribute('data-open') !== 'true');
  });
  // 바깥을 누르면 닫기 (폰에서만 열려 있을 때)
  document.addEventListener('click', function (e) {
    if (root.getAttribute('data-open') === 'true' && !root.contains(e.target)) setOpen(false);
  });
  // Esc 로 닫기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.getAttribute('data-open') === 'true') { setOpen(false); fab.focus(); }
  });
  // 링크를 누르면 닫기 (페이지 이동 전 상태 정리)
  root.querySelectorAll('.lxrn-key').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
})();
