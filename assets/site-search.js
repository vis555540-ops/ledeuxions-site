/* 사이트 검색창 (2026-11-20)
   - 색인: /assets/search-index.json  (scripts/build-search-index.py 로 sitemap.xml 에서 만든다)
   - 붙이는 법: <form class="ss" data-site-search action="/모아보기/" role="search"> ... </form> 를 두고
     <script src="/assets/site-search.js" defer></script>
   - 입력하는 동안: 사이트 안 페이지를 브라우저에서 바로 찾아 보여준다(밖으로 보내지 않음).
   - Enter·돋보기: 구글 「site:ledeuxions.com 검색어」로 넘어간다(형 요청 2026-11-20).
     목록에서 ↑↓로 고른 게 있으면 그 페이지로 바로 간다.
   - 초성 검색(ㅍㄷㅍ → PDF…가 아니라 한글 제목의 초성), 여러 단어(“pdf 용량”), ↑↓ Enter Esc, '/' 키로 바로 입력. */
(function () {
  'use strict';
  var form = document.querySelector('[data-site-search]');
  if (!form) return;
  var input = form.querySelector('input[type=search]');
  var box = form.querySelector('.ss-results');
  if (!input || !box) return;

  var INDEX_URL = '/assets/search-index.json';
  var MAX = 7;
  var SITE = 'ledeuxions.com';
  function googleUrl(q) { return 'https://www.google.com/search?q=' + encodeURIComponent('site:' + SITE + ' ' + q); }
  var data = null, loading = null, items = [], active = -1;

  // ── 한글 초성 ──
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function chosung(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
      else out += s[i];
    }
    return out;
  }
  function norm(s) { return (s || '').toLowerCase().replace(/\s+/g, ''); }
  var onlyCho = /^[ㄱ-ㅎ]+$/;

  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) {
      loading = fetch(INDEX_URL).then(function (r) { return r.json(); }).then(function (list) {
        data = list.map(function (x) {
          var t = norm(x.t);
          return { x: x, t: t, k: norm(x.k), d: norm(x.d), ct: chosung(t), ck: chosung(norm(x.k)) };
        });
        return data;
      }).catch(function () { loading = null; data = null; return []; });
    }
    return loading;
  }

  function score(e, q) {
    if (onlyCho.test(q)) {
      if (e.ct.indexOf(q) === 0) return 60;
      if (e.ct.indexOf(q) > -1) return 40;
      if (e.ck.indexOf(q) > -1) return 25;
      return 0;
    }
    if (e.t.indexOf(q) === 0) return 100;
    if (e.t.indexOf(q) > -1) return 70;
    if (e.k.indexOf(q) > -1) return 50;
    if (e.d.indexOf(q) > -1) return 20;
    return 0;
  }

  function search(raw) {
    var words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length || !data) return [];
    var whole = norm(raw), res = [];
    for (var i = 0; i < data.length; i++) {
      var e = data[i], total = 0, ok = true;
      for (var w = 0; w < words.length; w++) {
        var s = score(e, words[w]);
        if (!s) { ok = false; break; }
        total += s;
      }
      if (!ok && words.length > 1) { total = score(e, whole); ok = total > 0; }  // “용량줄이기”처럼 붙여 쓴 경우
      if (!ok) continue;
      if (e.x.c === '도구') total += 6;  // 동점이면 도구를 먼저
      total -= Math.min(e.t.length, 60) / 20; // 짧은 제목이 조금 앞
      res.push({ s: total, x: e.x });
    }
    res.sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, MAX).map(function (r) { return r.x; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function mark(text, raw) {
    var t = esc(text);
    raw.split(/\s+/).filter(function (w) { return w && !onlyCho.test(w); }).forEach(function (w) {
      var re = new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      t = t.replace(re, '<mark>$1</mark>');
    });
    return t;
  }

  function render(raw) {
    var q = raw.trim();
    active = -1;
    if (!q) { close(); return; }
    var list = search(q);
    items = list;
    var html = '';
    if (list.length) {
      list.forEach(function (x, i) {
        html += '<li role="option" id="ss-opt-' + i + '" aria-selected="false">' +
          '<a href="' + esc(x.u) + '" tabindex="-1">' +
          '<span class="ss-cat ss-cat-' + esc(x.c) + '">' + esc(x.c) + '</span>' +
          '<span class="ss-txt"><span class="ss-t">' + mark(x.t, q) + '</span>' +
          (x.d ? '<span class="ss-d">' + esc(x.d) + '</span>' : '') + '</span></a></li>';
      });
    } else {
      html = '<li class="ss-empty">사이트 안 바로가기에는 없어요. 구글로 찾아볼게요.</li>';
    }
    html += '<li role="option" id="ss-opt-' + list.length + '" aria-selected="false" class="ss-google">' +
      '<a href="' + esc(googleUrl(q)) + '" tabindex="-1"><span class="ss-cat">구글</span>' +
      '<span class="ss-txt"><span class="ss-t">“' + esc(q) + '” 구글에서 검색</span>' +
      '<span class="ss-d">site:' + SITE + ' 로 이 사이트 안만 찾아요</span></span></a></li>';
    box.innerHTML = html;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function close() {
    box.hidden = true;
    box.innerHTML = '';
    items = [];
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function setActive(i) {
    var opts = box.querySelectorAll('li[role=option]');
    if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach(function (li, n) { li.setAttribute('aria-selected', n === active ? 'true' : 'false'); });
    input.setAttribute('aria-activedescendant', 'ss-opt-' + active);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', function () { load(); if (input.value.trim()) load().then(function () { render(input.value); }); });
  input.addEventListener('input', function () { load().then(function () { render(input.value); }); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Escape') { if (!box.hidden) { e.preventDefault(); close(); } else { input.blur(); } }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    load().then(function () {
      var q = input.value.trim();
      if (!q) { input.focus(); return; }
      var pick = active > -1 ? items[active] : null;   // 마지막 줄(구글)이면 undefined
      location.href = pick ? pick.u : googleUrl(q);
    });
  });
  // 인기 검색어 칩: 누르면 그 말로 검색
  form.querySelectorAll('[data-q]').forEach(function (b) {
    b.addEventListener('click', function () {
      input.value = b.getAttribute('data-q');
      input.focus();
      load().then(function () { render(input.value); });
    });
  });
  document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) &&
        !document.activeElement.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
})();
