/* 언더독 피구 (Underdog Dodgeball; was 흐물 피구 / Wobble Dodgeball) — boot, layout (landscape + portrait), input (keyboard + touch), loop, screens, save, online rooms, debug hook (window.__wd). */
(function () {
  'use strict';
  // ★ online room server (Cloudflare Worker "wobble-dodge-rooms", source in ../server). Change only this line to move it.
  var ROOM_SERVER = 'wss://wobble-dodge-rooms.vis555540.workers.dev';
  var G = window.G, A = G.audio, DT = G.DT, W = G.W, H = G.H, NETM = G.net, Sdk = G.sdk, Save = G.save, MT = G.meta, S = G.story || null;
  var STORY = !/[?&]nostory/.test(location.search);   // ?nostory: the old flow (used by the older tests)
  // story.js (comics, announcer, training) is not needed for the first match: it loads after the first tap so first play stays as fast as before
  var VQ = ((/\?v=[^&#]*/.exec((document.currentScript && document.currentScript.src) || '') || [''])[0]), storyReq = false;
  function loadStory() {
    if (S || storyReq) return; storyReq = true;
    var sc = document.createElement('script'); sc.src = 'js/story.js' + VQ; sc.async = true;
    sc.onload = function () { S = G.story; WD.log.push('storyLoaded'); if (state === 'menu') refreshMenu(); };
    sc.onerror = function () { storyReq = false; };
    document.head.appendChild(sc); loadPick();
  }
  // the team select screen (js/pick.js + face art) is not needed for the first match either: it loads together with story.js
  var PU = null, pickReq = false, pickQ = null;
  function loadPick() {
    if (PU || pickReq) return; pickReq = true;
    var sc = document.createElement('script'); sc.src = 'js/pick.js' + VQ; sc.async = true;
    sc.onload = function () { PU = G.pickInit(PICKAPI); WD.log.push('pickLoaded'); if (pickQ) { var q = pickQ; pickQ = null; PU.open(q[0], q[1], q[2]); } };
    sc.onerror = function () { pickReq = false; };
    document.head.appendChild(sc);
  }
  G.ROOM_SERVER = ROOM_SERVER;
  function $(id) { return document.getElementById(id); }
  var cv = $('cv'), ctx = cv.getContext('2d');
  var state = 'menu', M = null, sel = 0, touchOn = false, acc = 0, last = 0, resT = 0;
  var NET = null, ovl = false, netView = null, hostTries = 0, gAcc = 0;   // NET: null | 'host' | 'guest'
  var V = { SW: 1280, k: 1, camX: 0, touch: false, port: false };
  var WD = window.__wd = { auto: false, speed: 1, errors: [], log: [] };

  /* ---------- save ---------- */
  // G.save (sdk.js): CrazyGames data module when there, else localStorage. Same key as the site version.
  Save.loadLocal(); var save = Save.data;
  function commit() { Save.data = save; Save.commit(); }
  function applySave() { if (save.lang === 'ko' || save.lang === 'en') G.lang = save.lang; A.muted = !!save.mute; G.lite = !!save.lite; }
  applySave();
  var bootEv = MT.login(save, MT.now()); MT.ensureDaily(save, MT.now()); commit();   // login streak + daily gift (none on the very first day)

  /* ---------- layout ---------- */
  // right-thumb cluster: [id, size, angle(deg, 180 = left of THROW, 90 = above), radius] in units of u
  var CLUSTER = [['tThrow', 0.26, 0, 0], ['tGrab', 0.19, 184, 0.3], ['tJump', 0.19, 96, 0.3]], TBTN = ['tThrow', 'tGrab', 'tJump'];
  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight, port = vh > vw * 1.05, w, h, l, t;
    V.port = port;
    if (!port) { V.SW = 1280; w = Math.min(vw, vh * 16 / 9); h = w * 9 / 16; l = (vw - w) / 2; t = (vh - h) / 2; }
    else { V.SW = 680; w = vw; h = w * 720 / 680; if (h > vh * 0.6) { h = vh * 0.6; w = h * 680 / 720; } l = (vw - w) / 2; t = 0; }
    cv.style.left = l + 'px'; cv.style.top = t + 'px'; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var dpr = G.lite ? 1 : Math.min(window.devicePixelRatio || 1, 2); if (G.qDown >= 1) dpr = Math.min(dpr, 1); if (G.qDown >= 3) dpr = 0.75;
    var pw = Math.min(1920, Math.max(320, Math.round(w * dpr)));
    if (cv.width !== pw) { cv.width = pw; cv.height = Math.round(pw * h / w); }
    V.k = cv.width / V.SW;
    $('pad').classList.toggle('on', port);
    // touch layer: landscape = whole screen (uses the letterbox margins), portrait = the pad under the court
    var tc = $('touch'), u, TW, TH, edge;
    if (!port) { TW = vw; TH = vh; tc.style.left = '0px'; tc.style.top = '0px'; u = Math.max(340, Math.min(vh * 0.85, 520, vw * 0.42)); edge = 10; }
    else { TW = vw; TH = vh - h; tc.style.left = '0px'; tc.style.top = h + 'px'; u = Math.min(TH * 1.15, vw * 1.05); edge = 8; }
    tc.style.width = TW + 'px'; tc.style.height = TH + 'px';
    var lift = port ? Math.max(0, (TH - 0.6 * u) * 0.35) : 0, cx0 = 0.17, cy0 = 0.15, minR = 1e9, maxL = 0;
    CLUSTER.forEach(function (c) {
      var e = $(c[0]), s = c[1], a = c[2] * Math.PI / 180, cR = cx0 - c[3] * Math.cos(a), cB = cy0 + c[3] * Math.sin(a), px = s * u;
      e.style.width = e.style.height = px + 'px'; e.style.right = ((cR - s / 2) * u + edge) + 'px'; e.style.bottom = ((cB - s / 2) * u + edge + lift) + 'px';
      fitBtn(e, px);
      minR = Math.min(minR, (cR - s / 2) * u + edge);
      e.dataset.left = TW - ((cR + s / 2) * u + edge); maxL = Math.max(maxL, (cR + s / 2) * u + edge);
    });
    var clusterW = maxL;   // from the right edge to the left side of the leftmost button
    var st = $('stick'); st.style.left = '0px'; st.style.bottom = '0px'; st.style.width = Math.max(120, Math.min(TW * 0.5, TW - clusterW - 16)) + 'px'; st.style.height = (TH * (port ? 1 : 0.75)) + 'px';
    var sb = $('stickBase'), bs = Math.min(0.32 * u, parseFloat(st.style.width) * 0.8, 170); sb.style.width = sb.style.height = bs + 'px'; stickHome();
    var kg = $('keys'); kg.style.left = (l + 8) + 'px'; kg.style.top = (port ? h + 8 : t + h - 34) + 'px'; kg.style.maxWidth = (w - 16) + 'px';
    if (state === 'pick' && PU) PU.layout();
    var bp = $('btnPause'); if (port) { bp.style.top = (h + 10) + 'px'; bp.style.right = 'auto'; bp.style.left = (vw / 2 - 22) + 'px'; } else { bp.style.top = (t + h * 86 / 720) + 'px'; bp.style.left = (l + w / 2 - 22) + 'px'; bp.style.right = 'auto'; }
  }
  function fitBtn(e, px) {   // largest font (<= 24% of the button) whose label fits inside the circle
    px = px || e.offsetWidth; var fs = Math.round(px * 0.24); e.style.fontSize = fs + 'px';
    if (!e.offsetWidth) return;
    var rg = document.createRange(); rg.selectNodeContents(e);
    while (fs > 9 && rg.getBoundingClientRect().width > e.clientWidth * 0.8) { fs--; e.style.fontSize = fs + 'px'; }
  }
  function stickHome() { var st = $('stick'), sb = $('stickBase'), s = parseFloat(sb.style.width) || 120; sb.style.left = (parseFloat(st.style.width) * 0.5 - s / 2) + 'px'; sb.style.top = (parseFloat(st.style.height) * (V.port ? 0.5 : 0.62) - s / 2) + 'px'; }
  window.addEventListener('resize', layout); window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });

  /* ---------- input ---------- */
  // three actions: thr = THROW (hold, release), cat = CATCH/PASS, jmp = JUMP. Special = jump + throw with a full meter.
  var keys = {}, press = { catchP: false, jumpP: false, thrP: false }, tch = { mx: 0, mz: 0, thr: false, cat: false }, scHold = 0;
  var KM = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd',
    KeyJ: 'thr', KeyZ: 'thr', KeyK: 'cat', KeyX: 'cat', Space: 'jmp', KeyC: 'jmp' };
  function guideGo() { if (M && M.waitInput && state === 'play') { M.waitInput = false; A.unlock(); Sdk.gameplayStart(); WD.log.push('guideGo'); setTimeout(loadStory, 2000); } }
  window.addEventListener('keydown', function (e) {
    A.unlock(); if (state === 'play' && M && M.waitInput && !e.repeat && e.code !== 'Escape' && e.code !== 'KeyP') guideGo();
    if (e.target && e.target.tagName === 'INPUT') { if (e.code === 'Enter' || e.code === 'NumpadEnter') { var bj = $('bJoinGo'); if (bj) bj.click(); } return; }
    if (popOpen()) { if (!e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape' || e.code === 'KeyJ')) { e.preventDefault(); popNext(); } return; }
    if (setIsOpen()) { if (!navKey(e) && e.code === 'Escape') setOpen(false); return; }
    if (state === 'opening') { if (!e.repeat) { e.preventDefault(); S.openingKey(e.code); } return; }
    if (state === 'comic') { if (!e.repeat) { e.preventDefault(); if (e.code === 'Escape') S.comicClose(); else if (/^(Enter|Space|KeyJ|KeyK|NumpadEnter|ArrowRight)$/.test(e.code)) S.comicTap(); } return; }
    if (state === 'train' && e.code === 'Escape') { S.endTrain(); return; }
    if (state === 'menu' && /^Key[A-Z]$/.test(e.code)) { typed = (typed + e.code.slice(3)).slice(-8); if (/(WOBBLE|UNDERDOG)$/.test(typed)) { typed = ''; secretFound(); } }
    if (state === 'pick') { if (PU) PU.key(e); return; }
    if (state === 'menu' && navKey(e)) return;
    var a = KM[e.code];
    if (a && state === 'play') e.preventDefault();
    if (e.code === 'KeyH' && !e.repeat) { save.keys = !keysOn(); commit(); keyGuide(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play' && !ovl) pause(); else if (state === 'pause' || ovl) resume(); return; }
    if (e.code === 'Enter') { if (state === 'result' && !NET) ($('bNext').style.display !== 'none' ? $('bNext') : $('bRetry')).click(); return; }
    if (!a || e.repeat) return;
    if (touchOn) setTouch(false);
    keys[a] = true;
    if (a === 'cat') press.catchP = true; if (a === 'jmp') press.jumpP = true; if (a === 'thr') press.thrP = true;
  });
  window.addEventListener('keyup', function (e) { var a = KM[e.code]; if (a) keys[a] = false; });
  window.addEventListener('blur', function () { keys = {}; tch.thr = false; tch.cat = false; });
  function readInput() {
    var mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + tch.mx, mz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + tch.mz;
    // thrP: a THROW tap shorter than one frame still counts as one held step (then the release throws)
    return { mx: Math.max(-1, Math.min(1, mx)), mz: Math.max(-1, Math.min(1, mz)), throwHeld: !!keys.thr || tch.thr || press.thrP, catchP: press.catchP, jumpP: press.jumpP };
  }
  function clearPress() { press.catchP = press.jumpP = press.thrP = false; }
  function setTouch(on) { touchOn = on; V.touch = on; $('touch').classList.toggle('on', on && (state === 'play' || state === 'pause' || state === 'train')); if (on) TBTN.forEach(function (id) { fitBtn($(id)); }); keyGuide(); }
  function keysOn() { return save.keys != null ? !!save.keys : save.played <= 3; }
  function keyGuide() { var on = state === 'play' && !touchOn && keysOn() && !!M && !M.guide; $('keys').style.display = on ? 'block' : 'none'; V.keys = on; if (on) $('keys').innerHTML = esc(G.t('hintK')) + ' <span>(' + esc(G.t('keyHelp')) + ')</span>'; }
  (function () {
    var stick = $('stick'), base = $('stickBase'), knob = $('stickKnob'), sid = null, ox = 0, oy = 0;
    function mv(e) { var r = base.getBoundingClientRect(), rad = r.width / 2, dx = (e.clientX - ox) / rad, dy = (e.clientY - oy) / rad, l = Math.sqrt(dx * dx + dy * dy); if (l > 1) { dx /= l; dy /= l; }
      tch.mx = Math.abs(dx) > 0.22 ? dx : 0; tch.mz = Math.abs(dy) > 0.22 ? dy : 0; knob.style.transform = 'translate(' + (dx * rad * 0.62) + 'px,' + (dy * rad * 0.62) + 'px)'; }
    stick.addEventListener('pointerdown', function (e) {
      if (sid !== null) return; sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (x) { }
      var sr = stick.getBoundingClientRect(), s = base.offsetWidth; base.style.left = (e.clientX - sr.left - s / 2) + 'px'; base.style.top = (e.clientY - sr.top - s / 2) + 'px';
      ox = e.clientX; oy = e.clientY; mv(e); e.preventDefault();
    });
    stick.addEventListener('pointermove', function (e) { if (e.pointerId === sid) mv(e); });
    function end(e) { if (e.pointerId !== sid) return; sid = null; tch.mx = tch.mz = 0; knob.style.transform = ''; stickHome(); }
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    function tb(id, fn, upfn) { var el = $(id); el.addEventListener('pointerdown', function (e) { e.preventDefault(); A.unlock(); el.classList.add('dn'); try { el.setPointerCapture(e.pointerId); } catch (x) { } fn(); }); function up() { el.classList.remove('dn'); if (upfn) upfn(); } el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); }
    tb('tThrow', function () { tch.thr = true; press.thrP = true; }, function () { tch.thr = false; });
    tb('tGrab', function () { press.catchP = true; tch.cat = true; }, function () { tch.cat = false; }); tb('tJump', function () { press.jumpP = true; });
    window.addEventListener('pointerdown', function (e) { if (kbd) { kbd = false; menuFocus(); } A.unlock(); if (e.pointerType === 'touch' && !touchOn) setTouch(true); if (!(e.target && e.target.id === 'btnPause')) guideGo(); }, true);
    document.addEventListener('contextmenu', function (e) { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
  })();
  if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) setTouch(true);

  /* ---------- screens ---------- */
  function show(id) { setOpen(false); if (id === 'menu') mi = 0; ['menu', 'result', 'pause', 'net', 'pick'].forEach(function (s) { $(s).classList.toggle('on', s === id); }); $('tops').style.display = (id === 'menu' || id === 'pause' || id === 'net' || id === 'pick') ? 'flex' : 'none'; if (id !== null) { $('keys').style.display = 'none'; V.keys = false; } if (id !== 'menu') $('gift').classList.remove('on'); }
  function sizeLabel() { return G.t('teamSize') + ': ' + G.t('vs', save.n, save.n); }
  function teamName(lvl) { var tm = G.teamOf(lvl); return G.t(tm.key) + (tm.star ? ' ★' : ''); }
  function dailyText(c) { return G.t('d_' + c.id, c.k); }
  function hatName(h) { return h ? G.t('h_' + h) : G.t('hatOwn'); }
  // the story button goes on with the story: the next ladder team (team select first), the final chapter, or the title defence
  function storyNext() { return STORY && save.sto.end ? 'defend' : storyOn() && save.beaten >= G.LADDER ? 'final' : 'ladder'; }
  function storyGo() {
    var k = storyNext(); WD.log.push('story:' + k);
    if (k === 'defend') playDefend(); else if (k === 'final') storyFinale();
    else { sel = Math.min(save.beaten, G.LADDER - 1); openPick('single', save.n, sel); }
  }
  function refreshMenu() {
    G.applyI18n();
    // quiet status line: level, streak, today's challenge
    var L = MT.level(save.xp), c = MT.ensureDaily(save, MT.now());
    $('mLv').textContent = G.t('lv', L.lvl); $('mXpFill').style.width = (100 * L.cur / L.need).toFixed(1) + '%'; $('mXpFill').parentNode.title = L.cur + ' / ' + L.need + ' XP';
    $('mStreak').textContent = '🔥 ' + G.t('streakN', Math.max(1, save.login.streak));
    $('mDaily').innerHTML = '<b>' + esc(G.t('daily')) + '</b> ' + esc(dailyText(c)) + (save.daily.done ? ' <span class="ok">✓</span>' : ' <span class="xp">+150 XP</span>');
    var k = storyNext(), nl = Math.min(save.beaten, G.LADDER - 1);
    $('mNext').textContent = k === 'defend' && S ? G.t('dfBtn', save.sto.season + 1, save.sto.dl + 1) : k === 'final' ? G.t('stLast') : G.t('mNextFoe', teamName(nl), nl + 1, G.LADDER);
    refreshSet();
    menuFocus();
    if (state === 'net' && netView) netView();
    if (state === 'pick' && PU) PU.refresh();
  }
  /* ---------- settings (⚙ top right): language, sound, light mode, opening replay ---------- */
  function setIsOpen() { return $('set').classList.contains('on'); }
  function setOpen(on) { var el = $('set'); if (!el || on === setIsOpen()) return; el.classList.toggle('on', on); si = 0; if (on) { refreshSet(); WD.log.push('settings'); } menuFocus(); }
  function refreshSet() {
    $('bLang').textContent = '🌐 ' + G.t('lang'); $('bMute').textContent = G.t('sound') + ': ' + (A.muted ? G.t('off') : G.t('on'));
    $('bLite').textContent = G.t('lite') + ': ' + (save.lite ? G.t('on') : G.t('off'));
    var opOn = state === 'menu' && storyOn() && !!S.playOpening && !!save.firstDone; $('bOpening').style.display = opOn ? '' : 'none'; if (opOn) $('bOpening').textContent = G.t('opBtn');
    $('bSetX').textContent = G.t('close');
  }
  // keyboard on the menu / settings: arrows (or WASD) move a white ring, Enter / Space / J press it. ① STORY is the default.
  var mi = 0, si = 0, kbd = false;
  function navList() { var l = setIsOpen() ? ['bLang', 'bMute', 'bLite', 'bOpening', 'bSetX'] : ['bPlay', 'bFree', 'bOnline', 'bSet']; return l.map($).filter(function (e) { return e && e.offsetParent !== null; }); }
  function menuFocus() {
    var l = navList(), o = setIsOpen(), i = o ? si : mi; i = Math.max(0, Math.min(i, l.length - 1));
    var on = o ? kbd : state === 'menu' && (kbd || !touchOn);   // settings: ring only when opened / used by keys
    Array.prototype.forEach.call(document.querySelectorAll('.btn.kf'), function (e) { e.classList.remove('kf'); });
    if (on && l[i]) l[i].classList.add('kf');
  }
  function navKey(e) {
    var c = e.code, l = navList(), o = setIsOpen(), d = { ArrowUp: -1, KeyW: -1, ArrowLeft: -1, ArrowDown: 1, KeyS: 1, ArrowRight: 1 }[c];
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();   // only the ring decides what Enter presses
    if (c === 'Escape') { e.preventDefault(); kbd = true; if (!e.repeat) { G.sfx('click'); setOpen(!o); } return true; }
    if (d) { e.preventDefault(); kbd = true; if (o) si = (si + d + l.length) % l.length; else mi = (mi + d + l.length) % l.length; G.sfx('click'); menuFocus(); return true; }
    if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space' || c === 'KeyJ') { e.preventDefault(); if (e.repeat) return true; var b = l[Math.max(0, Math.min(o ? si : mi, l.length - 1))]; if (b) b.click(); return true; }
    return false;
  }
  var shot = null, slowT = 0, slowN = 0, slowL = 0, slowS = 0, slowV = 0;
  // auto quality all match long: 1 = 1px/CSS px, 2 = LITE (saved), 3 = 0.75px/CSS px
  G.qDown = 0;
  function quality(dt) {
    if (state !== 'play' || WD.speed > 1 || G.qDown >= 3) { slowN = 0; return; }
    if (slowN++ < 30) { slowT = slowL = slowS = slowV = 0; return; }
    slowT++; if (dt > 0.025) slowL++; else if (dt < 0.022) slowS++; if (dt > 0.045) slowV++;
    if (slowT < 120) return;
    if ((slowL > 18 && slowS > 12) || slowV > 24) {   // stutter or <22 fps (steady 30 Hz is ok)
      G.qDown = G.lite ? 3 : G.qDown === 0 && (window.devicePixelRatio || 1) <= 1 ? 2 : G.qDown + 1;
      if (G.qDown === 2) { save.lite = 1; commit(); applySave(); WD.log.push('autoLite'); }
      layout(); WD.log.push('q' + G.qDown);
    }
    slowN = 0;
  }
  function enterPlay() { shot = null; state = 'play'; ovl = false; show(null); $('btnPause').style.display = 'block'; setTouch(touchOn); acc = 0; resT = 0; gAcc = 0; V.camX = 0; layout(); keyGuide(); if (!(M && M.waitInput)) Sdk.gameplayStart(); scHold = 0; if (S && !NET) S.matchStart(M); }
  // my team for a quick start: saved picks that are unlocked, then random unlocked, then (bigger teams than the roster) borrowed ones
  function unlocked(i) { return save.unl.indexOf(i) >= 0; }
  function myTeam(n, keep) {
    var out = cleanPicks(keep || save.picks, n).filter(unlocked), pool = save.unl.filter(function (c) { return out.indexOf(c) < 0; });
    while (out.length < n && pool.length) out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    return G.randomChars(n, out);
  }
  function start(lvl, chars, o) {   // chars: [myTeam, foeTeam] character ids (missing ones are random); o.defend = title-defence match
    A.unlock(); sel = lvl; o = o || {};
    if (lvl === G.LADDER - 1 && !o.free && S && STORY && chars) chars = [chars[0], chars[1] && chars[1][0] === S.BOSS.ch ? chars[1] : [S.BOSS.ch]];   // the final: the ringleader captains the developer's team
    M = G.M = G.newMatch({ lvl: lvl, auto: WD.auto, hint: save.played < 3, n: o.n || save.n, chars: chars, easy: save.easy, hat: save.hat || null, superCatch: !!save.sto.sc, defend: !!o.defend, free: !!o.free, boss: lvl === G.LADDER - 1 && !o.defend && !o.free, boost: o.defend ? 0.45 * Math.max(1, save.sto.season) : 0 });
    save.played++; commit();
    enterPlay();
  }
  // first visit: straight into a short guided 3 vs 3 (one round, weak rivals, hints in context, waits for the first touch/key)
  function startGuide() {
    sel = 0; var mine = [0].concat(myTeam(2, [0]).filter(function (c) { return c !== 0; })).slice(0, 2);   // 2 vs 2 tutorial: throw, catch, pass, special in context
    M = G.M = G.newMatch({ lvl: 0, n: 2, guide: true, waitInput: true, need: 1, roundT: 75, chars: [mine, null], easy: false });
    save.played++; commit(); WD.log.push('guide');
    enterPlay();
  }
  /* ---------- story flow: comics before matches, the 1 vs 1 with the old friend, ending, title defence ---------- */
  function storyOn() { return STORY && !!S && !NET; }
  function seen(id) { return save.sto.seen.indexOf(',' + id + ',') >= 0; }
  function markSeen(id) { if (seen(id)) return; var x = save.sto.seen || ','; if (x[0] !== ',') x = ',' + x; save.sto.seen = x + id + ','; commit(); }
  function storyNeed(lvl) { if (!storyOn()) return null; if (!seen('rival')) return 'rival'; if (!seen('friend')) return 'friend'; if (!seen('coach')) return 'coach'; var id = S.INTRO[lvl]; return id && !seen(id) ? id : null; }
  function storyScreen(on, train) { $('story').classList.toggle('on', on); $('story').classList.toggle('tr', !!train); $('stSkip').textContent = train ? G.t('trEnd') : G.t('stSkip'); }
  // a comic over everything; one tap = next panel, SKIP = all of it. Seen comics never show again (replays go straight in)
  function comic(id, then) {
    Sdk.gameplayStop(); state = 'comic'; show(null); $('btnPause').style.display = 'none'; $('touch').classList.remove('on'); markSeen(id); WD.log.push('comic:' + id);
    storyScreen(true, false);
    S.openComic(id, function () { storyScreen(false); then(); });
  }
  // the opening video (story.js makes the <video> only now; nothing in the first load). Game sound off while it plays, CrazyGames gameplay stopped.
  var OPSRC = 'media/opening.mp4' + VQ;
  function opening(then) {
    if (!S || !S.playOpening) return then();
    Sdk.gameplayStop(); state = 'opening'; show(null); $('btnPause').style.display = 'none'; $('touch').classList.remove('on'); $('keys').style.display = 'none';
    var prevExt = !!A.extMute; A.setExternalMute(true); WD.log.push('opening');
    S.playOpening(OPSRC, { muted: A.muted || prevExt }, function (how) { A.setExternalMute(prevExt); WD.log.push('openingEnd:' + how); then(); });
  }
  // every single-player match goes through here: story beats first, then the match
  function play(lvl, chars, o) {
    var need = o && o.defend ? null : storyNeed(lvl);
    if (!need) return start(lvl, chars, o);
    if (need === 'rival') { if (!seen('pro')) opening(function () { comic('pro', startRival); }); else startRival(); return; }   // chapter 1: opening video, then the comic
    comic(need, function () { play(lvl, chars, o); });
  }
  // the must-win 1 vs 1 against the old friend: easier after every loss, and after 3 losses the story moves on anyway
  function startRival() {
    A.unlock(); var f = save.sto.fails, L = Math.max(-2.8, -1.1 - 0.6 * f);
    M = G.M = G.newMatch({ lvl: 0, n: 1, need: 1, roundT: 60, chars: [[S.HERO], [S.DEX]], tm: { key: 'rvName', skins: ['#ff9d5c'], hats: ['cap'], uni: '#e8692b', L: L }, story: 'rival', easy: false, hat: save.hat || null, auto: WD.auto });
    save.played++; commit(); WD.log.push('rival:' + f);
    enterPlay();
  }
  // the final chapter: you play Vance's team against the grown-up hero
  function storyFinale() { if (!seen('pov')) comic('pov', startPov); else startPov(); }
  function startPov() {
    A.unlock(); var F = S.FINAL;
    M = G.M = G.newMatch({ lvl: G.LADDER - 1, n: F.n, need: 2, chars: [F.myChars, F.foeChars], tm: { key: 'foePov', skins: ['#3fa9ff'], hats: ['cap'], uni: '#2a7fd4', L: F.foeL }, story: 'pov', auto: WD.auto });
    M.myTm = { key: 'myPov', uni: S.BOSS.uni, skins: ['#c9a227'] };
    save.played++; commit(); WD.log.push('pov:' + save.sto.sf); enterPlay();
  }
  function storyEnd(then) { save.sto.end = 1; save.sto.season = Math.max(1, save.sto.season); commit(); comic('end', function () { comic('credits', then); }); }
  function playDefend() { var l = Math.max(0, Math.min(G.LADDER - 1, save.sto.dl)); start(l, [myTeam(save.n), null], { defend: 1 }); }
  // the optional training montage (from the result screen after some wins)
  function startTrain() {
    A.unlock(); Sdk.gameplayStart(); state = 'train'; show(null); $('btnPause').style.display = 'none'; storyScreen(true, true); setTouch(touchOn); WD.log.push('train');
    M = null; var ch = (save.picks && save.picks.length && unlocked(save.picks[0])) ? save.picks[0] : 0;
    S.startTrain(ch, function (r) {
      Sdk.gameplayStop(); storyScreen(false); $('touch').classList.remove('on');
      var before = MT.level(save.xp); save.xp += r.xp; save.sto.train++; var after = MT.level(save.xp), ev = [];
      if (after.lvl > before.lvl) ev.push({ k: 'lvl', from: before.lvl, to: after.lvl }); MT.hatCheck(save, ev); commit();
      WD.lastTrain = r; M = G.M = lastM; state = 'result'; show('result'); $('bTrain').style.display = 'none';
      reveal([{ k: 'xp', xp: r.xp, r: r }].concat(ev), null);
    });
  }
  var lastM = null;
  var vsChars = null;
  function startVersus(chars) {   // host: a fresh online match (host = left team)
    A.unlock(); if (chars) vsChars = chars;
    M = G.M = G.newMatch({ lvl: 0, versus: true, hint: false, n: save.n, chars: vsChars, easy: save.easy }); M.myTeam = 0;
    NETM.rec = true; NETM.lastBan = null; NETM.evq = [];
    enterPlay();
  }
  function leaveNet() { if (NET) { NETM.rec = false; NETM.close(); } NET = null; ovl = false; }
  function toMenu() { Sdk.gameplayStop(); leaveNet(); state = 'menu'; M = G.M = null; netView = null; show('menu'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on'); A.intensity = 0; refreshMenu(); if (giftQ.length) { showGift(giftQ); giftQ = []; } }
  function pause() {
    if (state !== 'play') return;
    $('pauseHelp').innerHTML = touchOn ? G.t('hintT') : G.t('hintK');
    Sdk.gameplayStop();
    if (NET) { ovl = true; show('pause'); return; }   // online: the game keeps running underneath
    state = 'pause'; refreshMenu(); show('pause');
  }
  function resume() { if (ovl) { ovl = false; show(null); keyGuide(); Sdk.gameplayStart(); return; } if (state !== 'pause') return; state = 'play'; show(null); last = performance.now(); keyGuide(); if (!(M && M.waitInput)) Sdk.gameplayStart(); }

  /* ---------- result: rewards, unlocks, "come back tomorrow" ---------- */
  var adGate = { n: 0, t: performance.now() }, adBusy = false, resCards = [], giftQ = [];
  function result() {
    Sdk.gameplayStop();
    state = 'result'; ovl = false; $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    resCards = []; ['resXp', 'resUnl', 'resDaily', 'resTease'].forEach(function (id) { $(id).innerHTML = ''; $(id).style.display = 'none'; });
    if (NET) {
      var my = M.myTeam || 0, w = M.winner === my;
      var dr = M.winner < 0; $('resTitle').textContent = dr ? G.t('draw') : w ? G.t('vsWin') : G.t('vsLose'); $('resTitle').style.color = dr ? '#fff' : w ? '#8ef0a8' : '#ff9d5c';
      $('resSub').innerHTML = G.t('pHost') + ' ' + M.score[0] + ' : ' + M.score[1] + ' ' + G.t('pGuest') + (NET === 'guest' ? '<br>' + G.t('waitHost') : '');
      $('bNext').style.display = 'none'; $('bTeam').style.display = 'none'; $('bShare').style.display = 'none'; $('bRetry').style.display = NET === 'host' ? '' : 'none'; $('bRetry').textContent = G.t('rematch');
      show('result'); G.sfx(w || dr ? 'win' : 'lose'); return;
    }
    $('bRetry').style.display = ''; $('bRetry').textContent = G.t('rematch'); $('bTeam').style.display = '';
    var rival = M.story === 'rival', pov = M.story === 'pov', free = !!M.free, defend = !!M.defend, extra = [], coachTxt = null, ending = false, coachWho = 'coachSays';
    var won = M.winner === 0, draw = M.winner < 0, tn = rival ? G.t('rvName') : pov ? G.t('foePov') : teamName(M.lvl), firstBeat = false, guide = !!M.guide;
    if (won && !M.story && !free && !defend && M.lvl === save.beaten && save.beaten < G.LADDER) { save.beaten++; firstBeat = true; }
    var finalWon = storyOn() && won && !M.story && !free && !defend && M.lvl === G.LADDER - 1 && !save.sto.end;
    if (storyOn()) {
      if (rival) {
        if (won || ++save.sto.fails >= 3) { if (!won) coachTxt = G.t('rlGive'); markSeen('rival'); if (!save.sto.sc) { save.sto.sc = 1; extra.push({ k: 'skill' }); } }
        else coachTxt = S.coachLine('rival');
      } else if (pov) {
        if (won) { ending = true; save.sto.season = Math.max(1, save.sto.season); if (!save.sto.badge) { save.sto.badge = 1; extra.push({ k: 'badge' }); } extra.push({ k: 'defOpen' }); }
        else { save.sto.sf++; coachTxt = S.coachLine('pov'); coachWho = 'povSays'; }
      } else if (!won && !guide && !free) coachTxt = S.coachLine();
      if (defend && won) { save.sto.dl++; if (save.sto.dl >= G.LADDER) { save.sto.season++; save.sto.dl = 0; extra.push({ k: 'title', s: save.sto.season + 1 }); } }
    }
    var now = MT.now(), ev = MT.login(save, now);   // the day may have changed while playing
    var st = { won: won, draw: draw, lvl: M.lvl, firstBeat: firstBeat, hit: M.me.hit, cat: M.me.cat, sp: M.me.sp, spKO: M.me.spKO, leftMax: M.me.leftMax, flaw: M.me.flaw, n: M.n, guide: guide || rival,
      outs: M.me.outs, hurt: M.me.hurt, rev: M.me.rev, ban: M.me.ban, flipAir: M.me.flipAir, airCat: M.me.airCat, mpCatch: M.me.mpCatch, passBest: M.me.passBest, chars: (M.chars && M.chars[0] || []).slice() };
    var r = MT.reward(save, st, now); ev = ev.concat(r.ev);
    // personal records: most catches / hits in a match, longest win streak
    var rc = save.rec, newRec = [];
    if (st.cat > rc.cat && st.cat >= 2) { rc.cat = st.cat; newRec.push(G.t('recCat', st.cat)); }
    if (st.hit > rc.hit && st.hit >= 2) { rc.hit = st.hit; newRec.push(G.t('recHit', st.hit)); }
    rc.cur = won ? rc.cur + 1 : 0; if (rc.cur > rc.streak && rc.cur >= 2) { rc.streak = rc.cur; newRec.push(G.t('recStreak', rc.cur)); }
    if (guide) { save.firstDone = 1; if (storyOn() && !seen('pro') && S.prefetchOpening) S.prefetchOpening(OPSRC); }   // warm up the opening while the player reads the rewards
    commit(); adGate.n++;
    WD.lastReward = { st: st, xp: r.xp, ev: ev.map(function (e) { return e.k + (e.ch != null ? ':' + e.ch : e.hat ? ':' + e.hat : e.to ? ':' + e.to : ''); }), daily: r.daily, dailyNow: r.dailyNow };
    if (firstBeat || r.dailyNow || extra.some(function (x) { return x.k === 'skill' || x.k === 'badge'; })) Sdk.happytime();   // big moments only: a new team beaten, today's challenge done
    $('resTitle').textContent = won ? G.t('win') : draw ? G.t('draw') : G.t('lose');
    $('resTitle').style.color = won ? '#8ef0a8' : draw ? '#fff' : '#ff9d5c';
    var champ = won && firstBeat && (save.beaten === 5 || save.beaten === G.LADDER);
    $('resSub').innerHTML = (won ? G.t('winSub', tn) : G.t('loseSub', tn)) + ' ' + M.score[0] + ' : ' + M.score[1] + (firstBeat && save.beaten < G.LADDER && !champ ? '<br><b style="color:#ffd23f">' + G.t('unlocked') + '</b>' : '') + (champ ? '<br><b style="color:#ffd23f">' + G.t('champion') + '</b> ' + G.t(save.beaten >= G.LADDER ? 'allClear' : 'tier2') : '');
    var postgame = storyOn() && (save.sto.end || ending) && won && (defend || pov);
    $('bNext').style.display = (won && M.lvl < G.LADDER - 1 && !M.story && !free) || (rival && seen('rival')) || finalWon || postgame ? '' : 'none';
    $('bNext').textContent = postgame ? G.t('dfBtn', save.sto.season + 1, save.sto.dl + 1) : finalWon ? G.t('stLast') : rival ? G.t('stNext') : G.t('nextTeam');
    if (rival || pov) { $('bTeam').style.display = 'none'; if (rival && seen('rival') || pov && won) $('bRetry').style.display = 'none'; }
    $('bSkipEnd').style.display = pov && !won && save.sto.sf >= S.FINAL.skipAfter ? '' : 'none'; $('bSkipEnd').textContent = G.t('povOk');
    $('bTrain').style.display = storyOn() && won && !M.story && !free && (defend ? save.sto.dl % 3 === 0 : M.lvl % 2 === 1) ? '' : 'none'; $('bTrain').textContent = G.t('trBtn');
    var rc2 = $('resCoach'); rc2.style.display = coachTxt ? 'flex' : 'none';
    if (coachTxt) { rc2.innerHTML = '<canvas></canvas><div><b>' + esc(G.t(coachWho)) + '</b> ' + esc(coachTxt) + '</div>'; resCards.push({ cv: rc2.firstChild, ch: pov ? S.BOSS.ch : S.COACH, hat: pov ? S.BOSS.hat : 'cap', sil: false }); WD.log.push('coach'); }
    lastM = M;
    var items = newRec.map(function (t) { return { k: 'rec', txt: t }; }).concat(extra);
    function showRes() {
      state = 'result'; show('result'); G.sfx(won ? 'win' : 'lose');
      rewards(r, ev, items);
      $('bShare').style.display = shot ? '' : 'none';
      if (won) cheerFx();
    }
    if (ending) storyEnd(showRes); else showRes();
  }
  function card(cls, title, sub, ch, hat, delay, quiet) {
    var e = document.createElement('div'); e.className = 'card ' + cls; e.style.animationDelay = delay + 's';
    e.innerHTML = (ch != null || hat ? '<canvas></canvas>' : '') + '<div><b>' + esc(title) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    $('resUnl').appendChild(e); $('resUnl').style.display = 'flex';
    if (ch != null || hat) resCards.push({ cv: e.firstChild, ch: ch == null ? 0 : ch, hat: hat || null, sil: false });
    if (!quiet) setTimeout(function () { if (state === 'result') G.sfx(cls === 'gold' ? 'revive' : 'ready'); }, delay * 1000);
  }
  function rewards(r, ev, more) {
    var box = $('resXp'); box.style.display = 'block';
    box.innerHTML = '<div class="lvrow"><span class="lv" id="rLv"></span><div class="xpbar"><i id="rXpFill"></i></div><span class="gain" id="rXp">+0 XP</span></div><div class="parts">' +
      r.parts.map(function (p) { return '<span>' + esc(G.t(p[0])) + ' +' + p[1] + '</span>'; }).join('') + '</div>';
    var fill = $('rXpFill'), lv = $('rLv'), b = r.before, a = r.after;
    lv.textContent = G.t('lv', b.lvl); fill.style.transition = 'none'; fill.style.width = (100 * b.cur / b.need) + '%';
    var t0 = performance.now(), dur = 900;
    (function count() { var k = Math.min(1, (performance.now() - t0) / dur); if ($('rXp')) $('rXp').textContent = '+' + Math.round(r.xp * k) + ' XP'; if (k < 1 && state === 'result') requestAnimationFrame(count); })();
    setTimeout(function () {
      fill.style.transition = 'width .7s ease-out';
      if (a.lvl > b.lvl) { fill.style.width = '100%'; setTimeout(function () { lv.textContent = G.t('lv', a.lvl); lv.classList.add('up'); fill.style.transition = 'none'; fill.style.width = '0%'; G.sfx('revive'); setTimeout(function () { fill.style.transition = 'width .5s ease-out'; fill.style.width = (100 * a.cur / a.need) + '%'; }, 30); }, 750); }
      else fill.style.width = (100 * a.cur / a.need) + '%';
    }, 120);
    // then every reward one at a time (TA-DA! + tap), and only at the end the daily line + the next goal
    var q = ev.concat(more || []);
    var me = M;
    setTimeout(function () {
      if (state !== 'result' || M !== me) return;
      reveal(q, function () { if (state !== 'result' || M !== me) return; restAfter(r); });
    }, 850);
  }
  function restAfter(r) {
    if (!r.dailyNow) {
      var c = r.daily, dd = $('resDaily'); dd.style.display = 'block';
      dd.innerHTML = '<b>' + esc(G.t('daily')) + '</b> ' + esc(dailyText(c)) + (save.daily.done ? ' <span class="ok">\u2713</span>' : ' <span class="xp">+150 XP</span>');
    }
    tease(r); WD.log.push('revealDone');
  }
  function tease(r) {
    var now = MT.now(), tm = MT.tomorrow(save, now), h = Math.max(1, Math.ceil(tm.ms / 3600000)), nl = MT.nextLocked(save), box = $('resTease'), dg = MT.daysToGift(save);
    var lines = [], g = nl >= 0 ? goalText(nl) : null;
    if (dg > 0) lines.push('🎁 ' + G.t('teaseDays', dg));
    lines.push(G.t('teaseDaily', dailyText(tm.challenge)));
    lines.push('🔥 ' + G.t('teaseStreak', tm.streak));
    box.innerHTML = (nl >= 0 ? '<canvas id="teaseCv"></canvas>' : '') + '<div>' + (g ? '<b class="nx" id="resNext">' + esc(G.t('nextUnl', g.txt)) + '</b>' + (g.bar ? '<span class="pgb"><i style="width:' + (100 * g.s.frac).toFixed(0) + '%"></i></span>' : '') : '') + '<b>' + esc(G.t('tease', h)) + '</b>' + lines.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') + '</div>';
    box.style.display = 'flex';
    if (nl >= 0) resCards.push({ cv: $('teaseCv'), ch: nl, hat: null, sil: true });
  }
  // share the deciding moment: Web Share with the image when the device can, else download the PNG (no external links)
  function shareShot() {
    if (!shot) return; var name = 'underdog-dodgeball.png';
    function dl() { var a = document.createElement('a'); a.href = shot; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    try {
      var bin = atob(shot.split(',')[1]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      var f = new File([u], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: G.t('title1') + ' ' + G.t('title2') }).catch(function () { }); return; }
    } catch (e) { }
    dl();
  }
  function cheerFx() { if (M) M.bodies.forEach(function (b) { if (b.team === 0 && b.mode === 'stand') b.cheer = true; }); }
  function drawCards(now) {
    for (var i = 0; i < resCards.length; i++) {
      var o = resCards[i], cv = o.cv; if (!cv || !cv.isConnected) continue; sizeCv(cv); var c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      G.drawChar(c, o.ch, cv.width / 2, cv.height * 0.96, cv.height * 0.84, now + i, MYUNI, !o.sil, false, o.hat);
      if (o.sil) { c.globalCompositeOperation = 'source-in'; c.fillStyle = '#1b1b2f'; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#ffd23f'; c.font = '900 ' + Math.round(cv.height * 0.4) + 'px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', cv.width / 2, cv.height * 0.45); }
    }
  }
  // a locked player's goal for the UI: hidden goals (chain not open yet / secret) only show a vague line
  function goalText(ch) {
    var s = MT.status(save, ch); if (!s) return null;
    var u = s.u, key = u.v === 'wins' && u.n === 1 ? 'u_wins1' : 'u_' + u.v;
    if (s.open) return { txt: G.t(key, u.n, u.n), s: s };
    if (s.chained) return { txt: G.t('u_req', G.t('ch' + u.req)), s: s, hidden: true };
    if (s.secret) return { txt: G.t('s_' + u.v), s: s, hidden: true };
    return { txt: G.t(key, s.cur, s.n), s: s, bar: u.n > 1 };
  }
  WD.goalText = goalText;
  // the big reveal pop-up: one reward at a time with a TA-DA! fanfare; tap / OK / Enter for the next one, then done()
  // items: {k:'char',ch} {k:'hat',hat} {k:'lvl',to} {k:'daily',c} {k:'streak',n,xp} {k:'rec',txt} {k:'skill'} {k:'title',s} {k:'defOpen'} {k:'xp',xp,r}
  var popQ = [], popCh = -1, revDone = null;
  function reveal(items, done) {
    items.forEach(function (it) { if (it.k === 'char' && (popQ.some(function (o) { return o.k === 'char' && o.ch === it.ch; }) || popCh === it.ch)) return; popQ.push(it); });
    if (done) { var d0 = revDone; revDone = d0 ? function () { d0(); done(); } : done; }
    if (popCh < 0) popNext();
  }
  function unlPop(list) { reveal(list.map(function (c) { return { k: 'char', ch: c }; })); }
  function popNext() {
    var box = $('unlPop');
    if (!popQ.length) { var was = popCh; popCh = -1; box.classList.remove('on'); var d = revDone; revDone = null; if (d) d(); return; }
    var it = popQ.shift(), ch = 0, hat = null, cheer = true, tag = G.t('babam'), name = '', sp = '', sty = '', quote = '', how = '';
    popCh = it.k === 'char' ? it.ch : 100;
    if (it.k === 'char') {
      ch = it.ch; var C = G.CHARS[ch], g = goalText(ch); tag += ' ' + G.t('unlTitle'); name = G.t('ch' + ch);
      sp = '<b>' + esc(G.t('special')) + '</b> ' + esc(G.t('sp_' + C.sp)) + ' <small>' + esc(G.t('ss_' + C.sp)) + '</small>'; sty = '▶ ' + G.t('ps' + ch);
      quote = S ? S.recruit(ch) : ''; how = g ? G.t('unlHow', g.txt) : ''; WD.log.push('unlPop:' + ch);
      if (state === 'result') card('gold', G.t('newChar'), G.t('ch' + ch) + ' · ' + G.t('sp_' + C.sp), ch, null, 0, true);
    } else if (it.k === 'hat') { hat = it.hat; tag += ' ' + G.t('newHat'); name = G.t('h_' + it.hat); if (state === 'result') card('gold', G.t('newHat'), name, 0, hat, 0, true); }
    else if (it.k === 'skill') { tag += ' ' + G.t('skTag'); name = G.t('skName'); sp = esc(G.t('skDesc')); quote = G.t('skQuote'); if (state === 'result') card('gold', G.t('skTag'), name, 0, null, 0, true); }
    else if (it.k === 'lvl') { name = G.t('lvUp', it.to); if (state === 'result') card('blue', name, null, null, null, 0, true); }
    else if (it.k === 'daily') { name = G.t('dailyDone'); sp = esc(dailyText(it.c)) + ' · +150 XP'; if (state === 'result') card('green', name, dailyText(it.c) + ' · +150 XP', null, null, 0, true); }
    else if (it.k === 'streak') { name = G.t('streakDay', it.n); sp = '+' + it.xp + ' XP'; if (state === 'result') card('blue', name, '+' + it.xp + ' XP', null, null, 0, true); }
    else if (it.k === 'rec') { name = G.t('newRec'); sp = esc(it.txt); if (state === 'result') card('blue', name, it.txt, null, null, 0, true); }
    else if (it.k === 'title') { name = G.t('dfTitle'); sp = esc(G.t('dfSub', it.s)); hat = 'goldcrown'; if (state === 'result') card('gold', name, G.t('dfSub', it.s), 0, hat, 0, true); }
    else if (it.k === 'badge') { tag = G.t('babam') + ' ' + G.t('bdTag'); name = G.t('bdName'); sp = esc(G.t('bdSub')); hat = 'goldcrown'; ch = S.BOSS.ch; if (state === 'result') card('gold', G.t('bdTag'), name, ch, hat, 0, true); }
    else if (it.k === 'defOpen') { name = G.t('dfOpen'); sp = esc(G.t('dfOpenSub')); hat = 'goldcrown'; }
    else if (it.k === 'xp') { name = G.t('trDone') + ' +' + it.xp + ' XP'; sp = esc(G.t('trSub', it.r.dodged, it.r.hits)); if (state === 'result') card('green', G.t('trXp') + ' +' + it.xp + ' XP', G.t('trSub', it.r.dodged, it.r.hits), null, null, 0, true); }
    $('upTag').textContent = tag; $('upName').textContent = name; $('upSp').innerHTML = sp; $('upStyle').textContent = sty; $('upStyle').style.display = sty ? '' : 'none';
    $('upQuote').textContent = quote; $('upQuote').style.display = quote ? '' : 'none'; $('upHow').textContent = how;
    $('bUpOk').textContent = G.t('unlOk');
    var pb = $('upPanel'); pb.style.animation = 'none'; void pb.offsetWidth; pb.style.animation = '';
    resCards = resCards.filter(function (o) { return o.cv !== $('upCv'); }); resCards.push({ cv: $('upCv'), ch: ch, hat: hat, sil: false });
    box.classList.add('on'); G.sfx('babam'); WD.log.push('reveal:' + it.k);
  }
  function popOpen() { return popCh >= 0; }
  WD.popOpen = function () { return popCh; };
  $('bUpOk').onclick = function (e) { e.stopPropagation(); A.unlock(); G.sfx('click'); popNext(); };
  $('unlPop').onclick = function () { popNext(); };
  // secret: tap the title 5 times quickly, or type UNDERDOG (or the old WOBBLE) on the menu
  var tickle = [], typed = '';
  function secretFound() {
    var ev = MT.secretCode(save); if (!ev.length) return; commit(); refreshMenu(); G.sfx('special'); WD.log.push('secret');
    unlPop(ev.filter(function (e) { return e.k === 'char'; }).map(function (e) { return e.ch; }));
  }
  $('logo').addEventListener('click', function () {
    if (state !== 'menu') return; var t = performance.now(); tickle = tickle.filter(function (x) { return t - x < 2500; }); tickle.push(t);
    $('logo').classList.remove('wig'); void $('logo').offsetWidth; $('logo').classList.add('wig');
    if (tickle.length >= 5) { tickle = []; secretFound(); }
  });
  WD.secret = secretFound;
  // welcome-back gifts (login streak / daily gift) shown over the menu
  function showGift(ev) {
    var items = ev.filter(function (e) { return e.k === 'streak' || e.k === 'char' || e.k === 'hat'; });
    if (!items.length) return;
    WD.log.push('gift'); setTimeout(function () { reveal(items); }, 300);
  }
  // between matches: a midgame ad only after 2 finished matches and 2.5 min since the last one (never before or inside the first match)
  function between(fn) {
    if (NET || adBusy) { if (!adBusy) fn(); return; }
    var now = performance.now();
    if (Sdk.ok && Sdk.adsOk && adGate.n >= 2 && now - adGate.t > (WD.adGapMs != null ? WD.adGapMs : 150000)) {
      adBusy = true; adGate.n = 0; adGate.t = now; WD.log.push('midgame');
      Sdk.midgame(function () { adGate.t = performance.now(); adBusy = false; if (state === 'result') fn(); });
    } else fn();
  }
  function nextLvl() { return Math.min(G.LADDER - 1, M ? (M.story === 'rival' ? save.beaten : M.lvl + 1) : save.beaten); }
  $('bPlay').onclick = function () { A.unlock(); G.sfx('click'); storyGo(); };
  $('bNext').onclick = function () {
    if (storyOn() && M && M.winner === 0 && !M.story && !M.free && !M.defend && M.lvl === G.LADDER - 1 && !save.sto.end) { between(storyFinale); return; }
    if (storyOn() && save.sto.end && M && M.winner === 0 && (M.defend || M.story === 'pov')) { between(playDefend); return; }
    var l = nextLvl(); between(function () { play(l, [myTeam(save.n), null]); });
  };
  $('bRetry').onclick = function () {
    if (NET === 'host') startVersus();
    else if (!NET) {
      if (M.story === 'rival') { between(function () { play(save.beaten, [myTeam(save.n), null]); }); return; }
      if (M.story === 'pov') { between(startPov); return; }
      if (M.free) { var fm = M; between(function () { start(fm.lvl, [myTeam(fm.n, WD.chars()[0]), null], { free: 1, n: fm.n }); }); return; }
      var l = M.lvl, mine = WD.chars() ? WD.chars()[0] : null, df = M.defend; between(function () { if (df) start(l, [myTeam(save.n, mine), null], { defend: 1 }); else play(l, [myTeam(save.n, mine), null]); });
    }
  };
  $('bTrain').onclick = function () { A.unlock(); G.sfx('click'); startTrain(); };
  $('bSkipEnd').onclick = function () { A.unlock(); G.sfx('click'); WD.log.push('skipEnd'); storyEnd(function () { toMenu(); reveal([{ k: 'defOpen' }]); }); };
  $('bOpening').onclick = function () { A.unlock(); G.sfx('click'); if (storyOn() && state === 'menu') { setOpen(false); opening(toMenu); } };
  $('bSet').onclick = function () { A.unlock(); G.sfx('click'); setOpen(!setIsOpen()); };
  $('bSetX').onclick = function () { A.unlock(); G.sfx('click'); setOpen(false); };
  $('set').addEventListener('click', function (e) { if (e.target === $('set')) setOpen(false); });   // tap outside the panel = close
  $('bFree').onclick = function () { A.unlock(); G.sfx('click'); openPick('free', save.free.n, save.free.lvl); };
  $('stSkip').onclick = function (e) { e.stopPropagation(); A.unlock(); if (state === 'train') S.endTrain(); else S.comicClose(); };
  $('cmCv').addEventListener('pointerdown', function (e) { e.preventDefault(); A.unlock(); S.comicTap(); });
  $('bTeam').onclick = function () { if (M && M.free) { var fm = M; between(function () { openPick('free', fm.n, fm.lvl); }); return; } var l = M && M.winner === 0 ? nextLvl() : M ? M.lvl : sel; between(function () { openPick('single', save.n, l); }); };
  $('bLite').onclick = function () { A.unlock(); G.sfx('click'); save.lite = save.lite ? 0 : 1; commit(); applySave(); layout(); refreshMenu(); WD.log.push('lite:' + save.lite); };
  $('bShare').onclick = function () { A.unlock(); shareShot(); };
  $('bGiftOk').onclick = function () { A.unlock(); G.sfx('click'); $('gift').classList.remove('on'); };
  $('bResMenu').onclick = toMenu; $('bQuit').onclick = toMenu; $('bResume').onclick = resume; $('btnPause').onclick = function () { A.unlock(); pause(); };
  $('bLang').onclick = function () { G.lang = G.lang === 'ko' ? 'en' : 'ko'; save.lang = G.lang; commit(); refreshMenu(); layout(); };
  $('bMute').onclick = function () { A.unlock(); A.setMute(!A.muted); save.mute = A.muted; commit(); refreshMenu(); };
  $('bOnline').onclick = function () { A.unlock(); G.sfx('click'); netChoose(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (!NET) pause(); A.suspend(); } else A.resume(); });

  /* ---------- online: screens ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function netPanel(title, body, btns) {   // btns: [[id, i18nKey, cls, fn]]
    Sdk.gameplayStop(); state = 'net'; show('net'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    $('netTitle').textContent = title; $('netBody').innerHTML = body;
    var row = $('netBtns'); row.innerHTML = '';
    btns.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn ' + (b[2] || ''); e.id = b[0]; e.textContent = G.t(b[1]); e.onclick = function () { A.unlock(); G.sfx('click'); b[3](); }; row.appendChild(e); });
  }
  function netChoose() {
    leaveNet(); M = G.M = null;
    netView = function () { netPanel(G.t('online'), '<div class="help">' + esc(G.t('youHost')) + '<br>' + esc(G.t('youGuest')) + '</div>' +
      '<div class="row"><button class="btn sm" id="bNs">' + esc(sizeLabel()) + ' ▸</button><button class="btn sm' + (save.easy ? ' green' : '') + '" id="bNr">' + esc(save.easy ? G.t('ruleSEasy') : G.t('ruleSAm')) + ' ▸</button></div>',
      [['bMk', 'mkRoom', 'pri', hostRoom], ['bJn', 'joinRoom', 'blue', function () { joinView(''); }], ['bNb', 'back', '', toMenu]]);
      $('bNs').onclick = function () { A.unlock(); G.sfx('click'); var l = G.TEAM_SIZES; save.n = l[(l.indexOf(save.n) + 1) % l.length]; commit(); netView(); };
      $('bNr').onclick = function () { A.unlock(); G.sfx('click'); save.easy = !save.easy; commit(); netView(); }; };
    netView();
  }
  function netMsg(key) {
    leaveNet(); M = G.M = null; A.intensity = 0;
    netView = function () { netPanel(G.t('online'), '<div class="help netmsg" id="netMsg">' + esc(G.t(key)) + '</div>', [['bNm', 'menu', 'pri', toMenu]]); };
    netView(); WD.log.push('netMsg:' + key);
  }
  // on CrazyGames the invite link must come from the SDK (no raw links to the game files)
  function roomLink(code) { return Sdk.inviteLink({ room: code }) || location.origin + location.pathname + '?room=' + code; }
  function hostRoom() {
    hostTries = 0; tryHost();
  }
  function tryHost() {
    var code = ('000' + ((Math.random() * 10000) | 0)).slice(-4);
    NET = 'host';
    netView = function () { netPanel(G.t('online'), '<div class="help">' + esc(G.t('connecting')) + '</div>', [['bNc', 'cancel', '', netChoose]]); }; netView();
    NETM.connect('host', code, onNet);
  }
  function hostWaitView() {
    var code = NETM.code, link = roomLink(code);
    netView = function () {
      netPanel(G.t('roomCode'), '<div class="code ink" id="roomCode">' + code + '</div><div class="help">' + esc(G.t('shareHint')) + '<br>' + esc(sizeLabel()) + '</div>' +
        '<input class="link" id="roomLink" readonly value="' + esc(link) + '"><div class="help" id="shareMsg"></div><div class="help wait">' + esc(G.t('waitFriend')) + '</div>',
        [['bShare', 'share', 'green', function () { shareLink(code, link); }], ['bNc', 'cancel', '', netChoose]]);
    };
    netView();
  }
  function shareLink(code, link) {
    function copied() { $('shareMsg').textContent = G.t('copied'); }
    function fallback() { var i = $('roomLink'); try { i.focus(); i.select(); i.setSelectionRange(0, 999); if (document.execCommand('copy')) copied(); } catch (e) { } }
    if (navigator.share) { navigator.share({ title: G.t('title1') + ' ' + G.t('title2'), text: G.t('shareText', code), url: link }).catch(function () { }); return; }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(link).then(copied, fallback); else fallback();
  }
  function joinView(code, errKey) {
    leaveNet();
    netView = function () {
      netPanel(G.t('joinRoom'), '<div class="help">' + esc(G.t('codeHint')) + '</div><input class="codein" id="codeIn" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" value="' + esc(code || '') + '">' +
        '<div class="help err" id="joinErr">' + (errKey ? esc(G.t(errKey)) : '') + '</div>',
        [['bJoinGo', 'join', 'pri', function () { var c = ($('codeIn').value || '').replace(/\D/g, ''); if (c.length === 4) joinRoom(c); else $('joinErr').textContent = G.t('codeHint'); }], ['bNb', 'back', '', netChoose]]);
      var ci = $('codeIn'); ci.oninput = function () { ci.value = ci.value.replace(/\D/g, '').slice(0, 4); };
      setTimeout(function () { try { ci.focus(); } catch (e) { } }, 50);
    };
    netView();
  }
  function joinRoom(code) {
    NET = 'guest';
    netView = function () { netPanel(G.t('joinRoom'), '<div class="help">' + esc(G.t('joining', code)) + '</div>', [['bNc', 'cancel', '', netChoose]]); }; netView();
    NETM.connect('guest', code, onNet);
  }
  function onNet(m) {
    if (!NET) return;
    WD.log.push('net:' + m.t + (m.e ? ':' + m.e : '')); if (WD.log.length > 60) WD.log.shift();
    if (m.t === 'waiting' && NET === 'host') hostWaitView();
    else if (m.t === 'peer_joined' && NET === 'host') { NETM.send({ t: 'cfg', n: save.n, easy: save.easy ? 1 : 0 }); openPick('host', save.n, 0); }
    else if (m.t === 'cfg' && NET === 'guest') { var cn = G.TEAM_SIZES.indexOf(m.n) >= 0 ? m.n : 5; PK.easy = !!m.easy; openPick('guest', cn, 0); }
    else if (m.t === 'pk' && state === 'pick' && PK.mode !== 'single') { PK.foeReady = !!m.r; if (PK.mode === 'host') PK.foePicks = cleanPicks(m.c, PK.n); if (PU) { PU.refresh(); PU.hostMaybeGo(); } }
    else if (m.t === 'go' && NET === 'guest' && state === 'pick') { PK.ready = true; if (PU) PU.vs(cleanPicks(m.b, PK.n), cleanPicks(m.a, PK.n)); }
    else if (m.t === 'first_snap' && NET === 'guest') { if (!(state === 'pick' && PK.cd > 0)) { M = G.M = NETM.guestView(performance.now()); enterPlay(); } }
    else if (m.t === 'err') {
      if (m.e === 'taken' && NET === 'host' && ++hostTries < 6) { NETM.close(true); tryHost(); }
      else if (NET === 'guest') { var c = NETM.code; NET = null; NETM.close(); joinView(c, m.e === 'full' ? 'full' : 'noroom'); }
      else netMsg('netErr');
    }
    else if (m.t === 'peer_left') netMsg(NET === 'host' ? 'peerLeft' : 'hostLeft');
    else if (m.t === 'closed') { if (m.code === 4000) return; netMsg(!m.opened ? 'netErr' : m.code === 4001 ? 'hostLeft' : 'lost'); }
    else if (m.t === 'neterr') netMsg('netErr');
  }

  // guided match: the button to press now pulses
  var gTip = null;
  function guideButtons() {
    var k = G.guideTip(M, touchOn); if (k === gTip) return; gTip = k;
    $('tThrow').classList.toggle('guide', k === 'gThrowT' || k === 'gSpT'); $('tGrab').classList.toggle('guide', k === 'gCatchT' || k === 'gPassT'); $('tJump').classList.toggle('guide', k === 'gSpT');
    if (k) WD.log.push('tip:' + k);
  }
  function setPassLabel(hold, full) {
    var e = $('tGrab'), t = hold ? G.t('tPass') : G.t('tGrab'); if (e.textContent !== t) { e.textContent = t; if (touchOn) fitBtn(e); }
    e.classList.toggle('pass', !!hold); $('tThrow').classList.toggle('full', !!full); $('tJump').classList.toggle('full', !!full);
  }

  /* ---------- character select: the screen itself is js/pick.js (KOF-style grid + VS), loaded late; the state stays here for the online code ---------- */
  var PK = { mode: 'single', n: 5, lvl: 0, picks: [], cur: 0, ready: false, foeReady: false, foePicks: null, foe: null, cd: 0, teams: null, easy: false, cols: 6, cells: [] };
  function cleanPicks(a, n) { var o = []; (Array.isArray(a) ? a : []).forEach(function (c) { c = c | 0; if (c >= 0 && c < G.CHARS.length && o.indexOf(c) < 0 && o.length < n) o.push(c); }); return o; }
  function openPick(mode, n, lvl) { if (PU) return PU.open(mode, n, lvl); pickQ = [mode, n, lvl]; loadStory(); loadPick(); }
  var PICKAPI = { PK: PK, VQ: VQ, A: A, Sdk: Sdk, STORY: STORY, save: function () { return save; }, commit: commit, unlocked: unlocked, myTeam: myTeam, cleanPicks: cleanPicks, goalText: goalText, teamName: teamName, esc: esc, hatName: hatName, ruleShort: function (e) { return e ? G.t('ruleSEasy') : G.t('ruleSAm'); },
    show: show, setState: function (s) { state = s; }, getState: function () { return state; }, story: function () { return S; }, touchOn: function () { return touchOn; }, log: function (s) { WD.log.push(s); },
    start: start, play: play, storyNeed: storyNeed, startVersus: startVersus, toMenu: toMenu, netChoose: netChoose, send: function (m) { NETM.send(m); },
    guestGo: function () { if (!NETM.gotSnap) return false; M = G.M = NETM.guestView(performance.now()); enterPlay(); return true; } };
  function sizeCv(cv) { var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return d; }
  var MYUNI = '#2a7fd4';

  /* ---------- loop ---------- */
  function guestFrame(dt, now) {
    NETM.guestSend(readInput(), now); clearPress();
    var Vw = M = G.M = NETM.guestView(now);
    gAcc += dt; var n = 0; while (gAcc >= DT && n < 12) { G.stepFx(Vw); gAcc -= DT; n++; } if (n >= 12) gAcc = 0;
    if (state === 'play') {
      setPassLabel(Vw.ctrl >= 0 && Vw.bodies[Vw.ctrl] && Vw.bodies[Vw.ctrl].hold, Vw.meter[1] >= 1);
      if (Vw.state === 'over') { resT += dt; if (resT > 0.4) result(); } else resT = 0;
    } else if (state === 'result' && Vw.state !== 'over') enterPlay();   // host started a rematch
    if (V.port) { var tx = Math.max(0, Math.min(W - V.SW, Vw.ball.x - V.SW / 2)); V.camX += (tx - V.camX) * Math.min(1, dt * 4); } else V.camX = 0;
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    quality(dt);
    try {
      var now = performance.now();
      if (NET === 'guest' && (state === 'play' || state === 'result') && NETM.gotSnap) guestFrame(dt, now);
      else if (state === 'play' && M && !Sdk.adPlaying) {
        var my = M.myTeam || 0;
        if (M.hitstop > 0) { M.hitstop -= dt; if (M.shake > 0) M.shake *= 0.92; }
        else {
          var scale = M.slow > 0 ? 0.3 : M.nearSlow ? 0.4 : M.guideSlow ? 0.45 : 1; if (M.slow > 0) M.slow -= dt;
          acc += dt * scale * WD.speed; var n = 0, inp = readInput(), cap = 12 * WD.speed, inp2 = NET === 'host' ? NETM.gin : null;
          while (acc >= DT && n < cap) {
            G.step(M, inp, inp2);
            if (n === 0) { clearPress(); inp.catchP = inp.jumpP = false; inp.throwHeld = !!keys.thr || tch.thr; if (inp2) NETM.afterStep(); }
            acc -= DT; n++; if (M.state === 'over') break;
          }
          if (n >= cap) acc = 0;
        }
        if (M.shake > 0) M.shake = Math.max(0, M.shake - dt * 45); if (M.flash > 0) M.flash -= dt;
        setPassLabel(M.ctrl >= 0 && M.bodies[M.ctrl].hold, M.meter[my] >= 1);
        if (M.guide) guideButtons();
        if (M.state === 'ko' && !shot && M.st > 0.15 && M.roundWin >= 0 && M.score[M.roundWin] + 1 >= M.need) { try { shot = cv.toDataURL('image/png'); } catch (e) { shot = null; } }
        if (M.state === 'over') { resT += dt; if (resT > 0.4 || WD.speed > 1) result(); }
        // portrait camera follows the ball
        if (V.port) { var tx = Math.max(0, Math.min(W - V.SW, M.ball.x - V.SW / 2)); V.camX += (tx - V.camX) * Math.min(1, dt * 4); } else V.camX = 0;
      }
      if (NET === 'host' && M && (state === 'play' || state === 'result')) NETM.hostSend(M, now);
      if (NET && (state === 'play' || state === 'result' || state === 'pick') && NETM.timedOut(now)) netMsg('lost');
      if (state === 'comic') { var cc = $('cmCv'); sizeCv(cc); S.drawComic(cc.getContext('2d'), cc.width, cc.height, now / 1000); }
      if (state === 'train') { S.trainStep(dt * WD.speed, readInput(), V.SW); clearPress(); }
      // SUPER CATCH: hold CATCH for 1 s (once per match)
      if (state === 'play' && M && M.scOk && !M.scUsed && M.state === 'play' && !NET) { if (keys.cat || tch.cat) { scHold += dt / 1; if (scHold >= 1) { G.superCatch(M); scHold = 0; } } else scHold = 0; } else scHold = 0;
      if (resCards.length && (state === 'result' || state === 'menu')) drawCards(ts / 1000);
      if (state !== 'pick') G.render(ctx, state === 'menu' || state === 'net' || state === 'train' || state === 'comic' ? null : M, ts / 1000, V);   // the pick screen is opaque and still: no canvas work under it
      if (state === 'train') S.drawTrain(ctx, ts / 1000, V);
      else if (S && M && !NET && (state === 'play' || state === 'pause')) S.overlay(ctx, M, ts / 1000, V, scHold);
      A.tick();
    } catch (e) { WD.errors.push(String(e && e.stack || e)); if (WD.errors.length > 20) WD.errors.shift(); }
  }

  /* ---------- debug hook ---------- */
  WD.start = function (lvl, auto, n, chars) { WD.auto = !!auto; if (n) save.n = n; start(lvl || 0, chars); return true; };
  WD.fire = function (id) { return !!(M && M.state === 'play' && G.fire(M, id)); };
  WD.pick = function () { return { screen: state, mode: PK.mode, n: PK.n, picks: PK.picks.slice(), cur: PK.cur, ready: PK.ready, foeReady: PK.foeReady, cd: PK.cd, teams: PK.teams, cols: PK.cols, easy: PK.easy }; };
  WD.chars = function () { return M ? [0, 1].map(function (t) { return M.bodies.filter(function (b) { return b.team === t; }).map(function (b) { return b.ch; }); }) : null; };
  WD.setEasy = function (v) { save.easy = !!v; commit(); refreshMenu(); };
  WD.keysShown = function () { return $('keys').style.display === 'block'; };
  WD.skipIntro = function () { if (M && M.state === 'intro' && !NET) M.st = 9; if (M && NET === 'host' && M.state === 'intro') M.st = 9; };
  WD.state = function () { return M ? { screen: state, net: NET, state: M.state, round: M.round, score: M.score.slice(), counts: G.counts(M), time: M.time, spFired: M.spFired, winner: M.winner, meter: M.meter.slice(), ball: M.ball.st, ballTeam: M.ball.team, ballX: Math.round(M.ball.x), holder: M.ball.holder ? M.ball.holder.id : -1, ctrl: M.ctrl, ctrl2: M.ctrl2, n: M.bodies.length / 2, errors: WD.errors.length } : { screen: state, net: NET, errors: WD.errors.length }; };
  WD.give = function (team) { if (!M || NET === 'guest') return false; return G.giveTo(M, team ? M.ctrl2 : M.ctrl); };
  WD.net = function () { return { role: NET, code: NETM.code, open: NETM.open, stats: NETM.stats, lag: NETM.lagMs(), screen: state, msg: ($('netMsg') || {}).textContent || '' }; };
  WD.specials = G.SPECIALS;
  WD.toMenu = toMenu; WD.openPick = function () { openPick('single', save.n, sel); };
  WD.size = function (n) { save.n = n; commit(); refreshMenu(); };

  WD.save = function () { return save; };
  WD.meta = MT; WD.sdk = Sdk;
  WD.setNow = function (ms) { G.fakeNow = ms; };
  WD.relogin = function () { var ev = MT.login(save, MT.now()); MT.ensureDaily(save, MT.now()); commit(); if (state === 'menu') { refreshMenu(); if (ev.length) showGift(ev); } return ev; };
  WD.guide = function () { return M && M.guide ? { wait: !!M.waitInput, thr: M.guide.thr, cat: M.guide.cat, slowN: M.guide.slowN, spGiven: M.guide.spGiven, me: M.me, tip: G.guideTip(M, touchOn) } : null; };
  WD.startGuide = startGuide;
  WD.story = { on: storyOn, seen: function () { return save.sto.seen; }, sto: function () { return save.sto; }, comic: function () { return S ? S.comicState() : null; }, tap: function () { S.comicTap(); }, skip: function () { S.comicClose(); },
    play: function (l) { play(l == null ? save.beaten : l, [myTeam(save.n), null]); }, rival: startRival, finale: storyFinale, pov: startPov, free: function () { $('bFree').click(); }, defend: playDefend, train: startTrain, trainState: function () { return S ? S.trainState() : null; }, endTrain: function () { S.endTrain(); },
    ann: function () { return M && M.ann ? M.ann.txt : null; }, annLog: function () { return S ? S.log || (S.log = []) : []; }, superCatch: function () { return M ? G.superCatch(M) : false; }, sc: function () { return M ? { ok: M.scOk, used: M.scUsed, t: M.sc } : null; },
    reveal: function () { return { open: popCh, q: popQ.length, tag: $('upTag').textContent, name: $('upName').textContent, quote: $('upQuote').textContent }; } };
  WD.roomLink = roomLink;
  WD.opening = function () { return S && S.openingState ? S.openingState() : null; };

  layout(); refreshMenu(); show('menu');
  // ?room=1234 in the link -> join straight away
  var qm = /[?&]room=(\d{4})(?:&|$)/.exec(location.search);
  if (qm) { try { history.replaceState(null, '', location.pathname); } catch (e) { } joinRoom(qm[1]); }
  else if (!save.firstDone && !/[?&]menu/.test(location.search)) startGuide();   // first visit: land in gameplay (story.js loads after the first tap)
  else if (bootEv.length) showGift(bootEv);
  if (!(M && M.guide)) loadStory();   // returning players: load the story right away
  requestAnimationFrame(frame);
  Sdk.onReady = function () {
    Sdk.loadingStart();
    if (Save.loadSdk()) {
      save = Save.data; applySave(); var ev = MT.login(save, MT.now()); MT.ensureDaily(save, MT.now()); commit();
      if (save.firstDone && M && M.guide && M.waitInput) toMenu();   // returning player on a new device: no tutorial
      else if (state === 'menu') refreshMenu();
      if (ev.length) { if (state === 'menu') showGift(ev); else giftQ = ev; }
    }
    Sdk.loadingStop(); Sdk.syncPlaying();
    var ir = Sdk.inviteParam('room'); if (ir && /^\d{4}$/.test(ir) && !NET) joinRoom(ir);
  };
  Sdk.onLateAd = function () { if (state === 'play') pause(); };
  Sdk.init();
})();
