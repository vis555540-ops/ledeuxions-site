/* 흐물 피구 — boot, layout (landscape + portrait), input (keyboard + touch), loop, screens, save, online rooms, debug hook (window.__wd). */
(function () {
  'use strict';
  // ★ online room server (Cloudflare Worker "wobble-dodge-rooms", source in ../server). Change only this line to move it.
  var ROOM_SERVER = 'wss://wobble-dodge-rooms.vis555540.workers.dev';
  var G = window.G, A = G.audio, DT = G.DT, W = G.W, H = G.H, NETM = G.net;
  G.ROOM_SERVER = ROOM_SERVER;
  function $(id) { return document.getElementById(id); }
  var cv = $('cv'), ctx = cv.getContext('2d');
  var state = 'menu', M = null, sel = 0, touchOn = false, acc = 0, last = 0, resT = 0;
  var NET = null, ovl = false, netView = null, hostTries = 0, gAcc = 0;   // NET: null | 'host' | 'guest'
  var V = { SW: 1280, k: 1, camX: 0, touch: false, port: false };
  var WD = window.__wd = { auto: false, speed: 1, errors: [], log: [] };

  /* ---------- save ---------- */
  var KEY = 'wobbledodge_v1', save = { beaten: 0, mute: false, lang: null, played: 0, n: 5, easy: false, keys: null, picks: [] };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); for (var k in o) save[k] = o[k]; } } catch (e) { }
  if (G.TEAM_SIZES.indexOf(save.n) < 0) save.n = 5;
  function commit() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  if (save.lang === 'ko' || save.lang === 'en') G.lang = save.lang;
  A.muted = !!save.mute;

  /* ---------- layout ---------- */
  // right-thumb cluster: [id, size, angle(deg, 180 = left of THROW, 90 = above), radius] in units of u
  var CLUSTER = [['tThrow', 0.26, 0, 0], ['tGrab', 0.19, 184, 0.3], ['tJump', 0.19, 96, 0.3]], TBTN = ['tThrow', 'tGrab', 'tJump'];
  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight, port = vh > vw * 1.05, w, h, l, t;
    V.port = port;
    if (!port) { V.SW = 1280; w = Math.min(vw, vh * 16 / 9); h = w * 9 / 16; l = (vw - w) / 2; t = (vh - h) / 2; }
    else { V.SW = 680; w = vw; h = w * 720 / 680; if (h > vh * 0.6) { h = vh * 0.6; w = h * 680 / 720; } l = (vw - w) / 2; t = 0; }
    cv.style.left = l + 'px'; cv.style.top = t + 'px'; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var dpr = Math.min(window.devicePixelRatio || 1, 2), pw = Math.min(1920, Math.max(320, Math.round(w * dpr)));
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
    if (state === 'pick') pickLayout();
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
  var keys = {}, press = { catchP: false, jumpP: false, thrP: false }, tch = { mx: 0, mz: 0, thr: false };
  var KM = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd',
    KeyJ: 'thr', KeyZ: 'thr', KeyK: 'cat', KeyX: 'cat', Space: 'jmp', KeyC: 'jmp' };
  window.addEventListener('keydown', function (e) {
    A.unlock();
    if (e.target && e.target.tagName === 'INPUT') { if (e.code === 'Enter' || e.code === 'NumpadEnter') { var bj = $('bJoinGo'); if (bj) bj.click(); } return; }
    if (state === 'pick') { pickKey(e); return; }
    var a = KM[e.code];
    if (a && state === 'play') e.preventDefault();
    if (e.code === 'KeyH' && !e.repeat) { save.keys = !keysOn(); commit(); keyGuide(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play' && !ovl) pause(); else if (state === 'pause' || ovl) resume(); return; }
    if (e.code === 'Enter') { if (state === 'menu') $('bPlay').click(); else if (state === 'result' && !NET) ($('bNext').style.display !== 'none' ? $('bNext') : $('bRetry')).click(); return; }
    if (!a || e.repeat) return;
    if (touchOn) setTouch(false);
    keys[a] = true;
    if (a === 'cat') press.catchP = true; if (a === 'jmp') press.jumpP = true; if (a === 'thr') press.thrP = true;
  });
  window.addEventListener('keyup', function (e) { var a = KM[e.code]; if (a) keys[a] = false; });
  window.addEventListener('blur', function () { keys = {}; tch.thr = false; });
  function readInput() {
    var mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + tch.mx, mz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + tch.mz;
    // thrP: a THROW tap shorter than one frame still counts as one held step (then the release throws)
    return { mx: Math.max(-1, Math.min(1, mx)), mz: Math.max(-1, Math.min(1, mz)), throwHeld: !!keys.thr || tch.thr || press.thrP, catchP: press.catchP, jumpP: press.jumpP };
  }
  function clearPress() { press.catchP = press.jumpP = press.thrP = false; }
  function setTouch(on) { touchOn = on; V.touch = on; $('touch').classList.toggle('on', on && (state === 'play' || state === 'pause')); if (on) TBTN.forEach(function (id) { fitBtn($(id)); }); keyGuide(); }
  function keysOn() { return save.keys != null ? !!save.keys : save.played <= 3; }
  function keyGuide() { var on = state === 'play' && !touchOn && keysOn() && !!M; $('keys').style.display = on ? 'block' : 'none'; if (on) $('keys').innerHTML = esc(G.t('hintK')) + ' <span>(' + esc(G.t('keyHelp')) + ')</span>'; }
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
    tb('tGrab', function () { press.catchP = true; }); tb('tJump', function () { press.jumpP = true; });
    window.addEventListener('pointerdown', function (e) { A.unlock(); if (e.pointerType === 'touch' && !touchOn) setTouch(true); }, true);
    document.addEventListener('contextmenu', function (e) { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
  })();
  if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) setTouch(true);

  /* ---------- screens ---------- */
  function show(id) { ['menu', 'result', 'pause', 'net', 'pick'].forEach(function (s) { $(s).classList.toggle('on', s === id); }); $('tops').style.display = (id === 'menu' || id === 'pause' || id === 'net' || id === 'pick') ? 'flex' : 'none'; if (id !== null) $('keys').style.display = 'none'; }
  function ruleLabel() { return save.easy ? G.t('ruleEasy') : G.t('ruleAm'); }
  function sizeLabel() { return G.t('teamSize') + ': ' + G.t('vs', save.n, save.n); }
  function refreshMenu() {
    G.applyI18n();
    $('bLang').textContent = G.t('lang'); $('bMute').textContent = G.t('sound') + ': ' + (A.muted ? G.t('off') : G.t('on'));
    $('bSize').textContent = sizeLabel(); $('bRule').textContent = ruleLabel(); $('bRule').classList.toggle('green', !!save.easy);
    var lad = $('ladder'); lad.innerHTML = '';
    sel = Math.min(sel, save.beaten);
    G.TEAMS.forEach(function (tm, i) {
      var el = document.createElement('button'), lock = i > save.beaten, done = i < save.beaten;
      el.className = 'team' + (lock ? ' lock' : '') + (done ? ' done' : '') + (i === sel ? ' sel' : '');
      el.innerHTML = '<span class="n">' + (i + 1) + '</span><span>' + G.t(tm.key) + '</span><span class="dots">' + tm.skins.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><span class="st">' + (lock ? G.t('locked') : done ? G.t('beaten') : G.t('next')) + '</span>';
      if (!lock) el.onclick = function () { sel = i; A.unlock(); G.sfx('click'); refreshMenu(); };
      lad.appendChild(el);
    });
    $('help').innerHTML = G.t(save.easy ? 'helpEasy' : 'help') + '<br><span style="color:#ffd23f">' + (touchOn ? G.t('hintT') : G.t('hintK') + '<br>' + G.t('keyHelp')) + '</span>' + (save.beaten >= 5 ? '<br><b>' + G.t('champion') + '</b> ' + G.t('allClear') : '');
    if (state === 'net' && netView) netView();
    if (state === 'pick') pickRefresh();
  }
  function enterPlay() { state = 'play'; ovl = false; show(null); $('btnPause').style.display = 'block'; setTouch(touchOn); acc = 0; resT = 0; gAcc = 0; V.camX = 0; layout(); keyGuide(); }
  function start(lvl, chars) {   // chars: [myTeam, foeTeam] character ids (missing ones are random)
    A.unlock(); sel = lvl;
    M = G.M = G.newMatch({ lvl: lvl, auto: WD.auto, hint: save.played < 3, n: save.n, chars: chars, easy: save.easy });
    save.played++; commit();
    enterPlay();
  }
  var vsChars = null;
  function startVersus(chars) {   // host: a fresh online match (host = left team)
    A.unlock(); if (chars) vsChars = chars;
    M = G.M = G.newMatch({ lvl: 0, versus: true, hint: false, n: save.n, chars: vsChars, easy: save.easy }); M.myTeam = 0;
    NETM.rec = true; NETM.lastBan = null; NETM.evq = [];
    enterPlay();
  }
  function leaveNet() { if (NET) { NETM.rec = false; NETM.close(); } NET = null; ovl = false; }
  function toMenu() { leaveNet(); state = 'menu'; M = G.M = null; netView = null; show('menu'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on'); A.intensity = 0; refreshMenu(); }
  function pause() {
    if (state !== 'play') return;
    $('pauseHelp').innerHTML = touchOn ? G.t('hintT') : G.t('hintK');
    if (NET) { ovl = true; show('pause'); return; }   // online: the game keeps running underneath
    state = 'pause'; refreshMenu(); show('pause');
  }
  function resume() { if (ovl) { ovl = false; show(null); keyGuide(); return; } if (state !== 'pause') return; state = 'play'; show(null); last = performance.now(); keyGuide(); }
  function result() {
    state = 'result'; ovl = false; $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    if (NET) {
      var my = M.myTeam || 0, w = M.winner === my;
      var dr = M.winner < 0; $('resTitle').textContent = dr ? G.t('draw') : w ? G.t('vsWin') : G.t('vsLose'); $('resTitle').style.color = dr ? '#fff' : w ? '#8ef0a8' : '#ff9d5c';
      $('resSub').innerHTML = G.t('pHost') + ' ' + M.score[0] + ' : ' + M.score[1] + ' ' + G.t('pGuest') + (NET === 'guest' ? '<br>' + G.t('waitHost') : '');
      $('bNext').style.display = 'none'; $('bRetry').style.display = NET === 'host' ? '' : 'none'; $('bRetry').textContent = G.t('rematch');
      show('result'); G.sfx(w || dr ? 'win' : 'lose'); return;
    }
    $('bRetry').style.display = ''; $('bRetry').textContent = G.t('retry');
    var won = M.winner === 0, tn = G.t(M.team.key), unlocked = false;
    if (won && M.lvl === save.beaten && save.beaten < 5) { save.beaten++; unlocked = save.beaten < 5; commit(); }
    $('resTitle').textContent = won ? G.t('win') : M.winner < 0 ? G.t('draw') : G.t('lose');
    $('resTitle').style.color = won ? '#8ef0a8' : M.winner < 0 ? '#fff' : '#ff9d5c';
    $('resSub').innerHTML = (won ? G.t('winSub', tn) : G.t('loseSub', tn)) + '<br>' + M.score[0] + ' : ' + M.score[1] + (unlocked ? '<br><b style="color:#ffd23f">' + G.t('unlocked') + '</b>' : '') + (won && save.beaten >= 5 && M.lvl === 4 ? '<br><b style="color:#ffd23f">' + G.t('champion') + '</b> ' + G.t('allClear') : '');
    $('bNext').style.display = won && M.lvl < 4 ? '' : 'none';
    show('result'); G.sfx(won ? 'win' : 'lose');
  }
  $('bPlay').onclick = function () { A.unlock(); G.sfx('click'); openPick('single', save.n, sel); };
  $('bNext').onclick = function () { openPick('single', save.n, Math.min(4, M.lvl + 1)); };
  $('bRetry').onclick = function () { if (NET === 'host') startVersus(); else if (!NET) openPick('single', save.n, M.lvl); };
  $('bRule').onclick = function () { A.unlock(); G.sfx('click'); save.easy = !save.easy; commit(); refreshMenu(); };
  $('bResMenu').onclick = toMenu; $('bQuit').onclick = toMenu; $('bResume').onclick = resume; $('btnPause').onclick = function () { A.unlock(); pause(); };
  $('bLang').onclick = function () { G.lang = G.lang === 'ko' ? 'en' : 'ko'; save.lang = G.lang; commit(); refreshMenu(); layout(); };
  $('bMute').onclick = function () { A.unlock(); A.setMute(!A.muted); save.mute = A.muted; commit(); refreshMenu(); };
  $('bSize').onclick = function () { A.unlock(); G.sfx('click'); var l = G.TEAM_SIZES; save.n = l[(l.indexOf(save.n) + 1) % l.length]; commit(); refreshMenu(); };
  $('bOnline').onclick = function () { A.unlock(); G.sfx('click'); netChoose(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (!NET) pause(); A.suspend(); } else A.resume(); });

  /* ---------- online: screens ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function netPanel(title, body, btns) {   // btns: [[id, i18nKey, cls, fn]]
    state = 'net'; show('net'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    $('netTitle').textContent = title; $('netBody').innerHTML = body;
    var row = $('netBtns'); row.innerHTML = '';
    btns.forEach(function (b) { var e = document.createElement('button'); e.className = 'btn ' + (b[2] || ''); e.id = b[0]; e.textContent = G.t(b[1]); e.onclick = function () { A.unlock(); G.sfx('click'); b[3](); }; row.appendChild(e); });
  }
  function netChoose() {
    leaveNet(); M = G.M = null;
    netView = function () { netPanel(G.t('online'), '<div class="help">' + esc(G.t('youHost')) + '<br>' + esc(G.t('youGuest')) + '<br>' + esc(sizeLabel()) + '</div>',
      [['bMk', 'mkRoom', 'pri', hostRoom], ['bJn', 'joinRoom', 'blue', function () { joinView(''); }], ['bNb', 'back', '', toMenu]]); };
    netView();
  }
  function netMsg(key) {
    leaveNet(); M = G.M = null; A.intensity = 0;
    netView = function () { netPanel(G.t('online'), '<div class="help netmsg" id="netMsg">' + esc(G.t(key)) + '</div>', [['bNm', 'menu', 'pri', toMenu]]); };
    netView(); WD.log.push('netMsg:' + key);
  }
  function roomLink(code) { return location.origin + location.pathname + '?room=' + code; }
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
    else if (m.t === 'pk' && state === 'pick' && PK.mode !== 'single') { PK.foeReady = !!m.r; if (PK.mode === 'host') PK.foePicks = cleanPicks(m.c, PK.n); pickRefresh(); hostMaybeGo(); }
    else if (m.t === 'go' && NET === 'guest' && state === 'pick') { PK.ready = true; startCountdown(cleanPicks(m.b, PK.n), cleanPicks(m.a, PK.n)); }
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

  function setPassLabel(hold, full) {
    var e = $('tGrab'), t = hold ? G.t('tPass') : G.t('tGrab'); if (e.textContent !== t) { e.textContent = t; if (touchOn) fitBtn(e); }
    e.classList.toggle('pass', !!hold); $('tThrow').classList.toggle('full', !!full); $('tJump').classList.toggle('full', !!full);
  }

  /* ---------- character select (KOF-style grid, all original characters) ---------- */
  var PK = { mode: 'single', n: 5, lvl: 0, picks: [], cur: 0, ready: false, foeReady: false, foePicks: null, cd: 0, teams: null, easy: false, cols: 6, cells: [] };
  function cleanPicks(a, n) { var o = []; (Array.isArray(a) ? a : []).forEach(function (c) { c = c | 0; if (c >= 0 && c < G.CHARS.length && o.indexOf(c) < 0 && o.length < n) o.push(c); }); return o; }
  function openPick(mode, n, lvl) {
    A.unlock(); state = 'pick'; show('pick'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    PK.mode = mode; PK.n = n; PK.lvl = lvl; PK.ready = false; PK.foeReady = false; PK.foePicks = null; PK.cd = 0; PK.teams = null;
    if (mode !== 'guest') PK.easy = save.easy;
    PK.picks = cleanPicks(save.picks, n); PK.cur = PK.picks.length ? PK.picks[PK.picks.length - 1] : 0;
    var g = $('pkGrid'); if (!g.children.length) {
      G.CHARS.forEach(function (C, i) {
        var e = document.createElement('button'); e.className = 'pkCell'; e.dataset.i = i; e.innerHTML = '<canvas></canvas><span class="nm"></span><span class="no"></span>';
        e.onclick = function () { A.unlock(); PK.cur = i; togglePick(i); };
        e.onpointerenter = function (ev) { if (ev.pointerType === 'mouse') { PK.cur = i; pickRefresh(); } };
        g.appendChild(e);
      });
    }
    $('pkCd').classList.remove('on');
    pickLayout(); pickRefresh(); WD.log.push('pick:' + mode);
  }
  function togglePick(i) {
    if (PK.ready) return;
    var k = PK.picks.indexOf(i);
    if (k >= 0) { PK.picks.splice(k, 1); G.sfx('poof'); }
    else if (PK.picks.length < PK.n) { PK.picks.push(i); G.sfx('catch'); }
    else { G.sfx('bounce'); }
    save.picks = PK.picks.slice(); commit(); pickRefresh();
  }
  function pickReady() {
    if (PK.ready) return;
    PK.ready = true; G.sfx('ready');
    var mine = G.randomChars(PK.n, PK.picks); PK.picks = mine;
    if (PK.mode === 'single') { startCountdown(mine, G.randomChars(PK.n)); return; }
    NETM.send({ t: 'pk', c: mine, r: 1 });
    pickRefresh(); hostMaybeGo();
  }
  function hostMaybeGo() {
    if (PK.mode !== 'host' || !PK.ready || !PK.foeReady || PK.cd) return;
    var a = PK.picks, b = G.randomChars(PK.n, PK.foePicks);
    NETM.send({ t: 'go', a: a, b: b }); startCountdown(a, b);
  }
  var CD_T = 2.5;
  function startCountdown(mine, foe) {
    PK.teams = [mine, foe]; PK.cd = performance.now(); $('pkCd').classList.add('on'); pickLayout(); G.sfx('beep'); WD.log.push('countdown');
  }
  function countdownDone() {
    $('pkCd').classList.remove('on'); var T2 = PK.teams; PK.cd = 0;
    if (PK.mode === 'single') start(PK.lvl, T2);
    else if (PK.mode === 'host') startVersus(T2);
    else if (NETM.gotSnap) { M = G.M = NETM.guestView(performance.now()); enterPlay(); }
    else { PK.cd = -1; }   // guest: wait for the host's first snapshot
  }
  function pickKey(e) {
    var c = e.code, n = G.CHARS.length, cols = PK.cols;
    if (c === 'Escape') { pickBack(); return; }
    if (PK.cd) return;
    var mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -cols, KeyW: -cols, ArrowDown: cols, KeyS: cols }[c];
    if (mv) { e.preventDefault(); PK.cur = (PK.cur + mv + n) % n; G.sfx('click'); pickRefresh(); return; }
    if (e.repeat) return;
    if (c === 'Enter' || c === 'KeyJ' || c === 'NumpadEnter') { e.preventDefault(); if (PK.picks.length >= PK.n && PK.picks.indexOf(PK.cur) < 0) pickReady(); else togglePick(PK.cur); }
    else if (c === 'KeyK' || c === 'Backspace') { e.preventDefault(); if (!PK.ready && PK.picks.length) { PK.picks.pop(); save.picks = PK.picks.slice(); commit(); G.sfx('poof'); pickRefresh(); } }
    else if (c === 'Space') { e.preventDefault(); pickReady(); }
  }
  function pickBack() { if (PK.mode === 'single') toMenu(); else netChoose(); }
  function bar(v) { var s = ''; for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= v ? 'on' : '') + '"></i>'; return s; }
  function pickRefresh() {
    if (state !== 'pick') return;
    var C = G.CHARS[PK.cur], i;
    $('pkTitle').textContent = G.t('pickTitle');
    $('pkRule').textContent = PK.easy ? G.t('ruleEasy') : G.t('ruleAm');
    $('pkName').textContent = G.t('ch' + PK.cur);
    $('pkStats').innerHTML = [['stPow', C.st[0]], ['stSpd', C.st[1]], ['stCat', C.st[2]]].map(function (r) { return '<div class="st"><b>' + esc(G.t(r[0])) + '</b><span class="bar">' + bar(r[1]) + '</span></div>'; }).join('');
    $('pkSp').innerHTML = '<b>' + esc(G.t('special')) + '</b> ' + esc(G.t('sp_' + C.sp)) + '<br><small>' + esc(G.t('ss_' + C.sp)) + '</small>';
    for (i = 0; i < PK.cells.length; i++) { var e = PK.cells[i], k = PK.picks.indexOf(i); e.classList.toggle('cur', i === PK.cur); e.classList.toggle('sel', k >= 0); e.querySelector('.no').textContent = k >= 0 ? k + 1 : ''; e.querySelector('.nm').textContent = G.t('ch' + i); }
    $('pkMine').textContent = G.t('pickMine', PK.picks.length, PK.n);
    $('pkFoe').textContent = PK.mode === 'single' ? '' : PK.ready && !PK.foeReady ? G.t('waitFoe') : PK.foeReady ? G.t('foeReady') : G.t('foePick');
    $('pkRnd').textContent = G.t('pickRandom'); $('pkUndo').textContent = G.t('pickUndo'); $('pkGo').textContent = G.t('pickReady'); $('pkBack').textContent = G.t('pickBack');
    $('pkGo').disabled = PK.ready; $('pkRnd').disabled = PK.ready; $('pkUndo').disabled = PK.ready || !PK.picks.length;
    $('pkGo').classList.toggle('pulse', PK.picks.length >= PK.n && !PK.ready);
    $('pkHint').textContent = touchOn ? G.t('pickHint') : G.t('pickHint') + '  ·  ' + G.t('pickHintK');
  }
  function sizeCv(cv) { var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d)); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return d; }
  function pickLayout() {
    var port = window.innerHeight > window.innerWidth * 1.05; PK.cols = port ? 4 : 6;
    $('pick').classList.toggle('port', port);
    PK.cells = Array.prototype.slice.call(document.querySelectorAll('.pkCell'));
    var sl = $('pkSlots'); if (sl.children.length !== PK.n) { sl.innerHTML = ''; for (var i = 0; i < PK.n; i++) { var c = document.createElement('canvas'); c.className = 'slot'; sl.appendChild(c); } }
  }
  var MYUNI = '#2a7fd4', FOEUNI = '#e8692b';
  function cell(c, w, h, ch, now, uni, cheer, flip) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
    G.drawChar(c, ch, w / 2, h * 0.94, h * 0.78, now, uni, cheer, flip);
  }
  function drawPick(now) {
    var i, cv, c, d;
    for (i = 0; i < PK.cells.length; i++) { cv = PK.cells[i].firstChild; d = sizeCv(cv); c = cv.getContext('2d'); cell(c, cv.width, cv.height, i, now + i * 0.37, MYUNI, PK.picks.indexOf(i) >= 0 && ((now * 2 + i) | 0) % 4 === 0); }
    cv = $('pkCv'); sizeCv(cv); c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    var g = c.createRadialGradient(cv.width / 2, cv.height * 0.7, 4, cv.width / 2, cv.height * 0.7, cv.width * 0.6); g.addColorStop(0, G.CHARS[PK.cur].skin); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.35; c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height); c.globalAlpha = 1;
    G.drawChar(c, PK.cur, cv.width / 2, cv.height * 0.95, cv.height * 0.8, now, MYUNI, PK.picks.indexOf(PK.cur) >= 0);
    var sl = $('pkSlots').children;
    for (i = 0; i < sl.length; i++) { cv = sl[i]; sizeCv(cv); c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      if (i < PK.picks.length) cell(c, cv.width, cv.height, PK.picks[i], now + i, MYUNI, PK.ready);
      else { c.fillStyle = 'rgba(255,255,255,0.35)'; c.font = '900 ' + Math.round(cv.height * 0.5) + 'px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', cv.width / 2, cv.height / 2); } }
    if (PK.cd) drawCountdown(now);
  }
  function drawCountdown(now) {
    var cv = $('cdCv'); sizeCv(cv); var c = cv.getContext('2d'), w = cv.width, h = cv.height, T2 = PK.teams, port = h > w * 1.05;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#120f26'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(63,169,255,0.25)'; c.beginPath(); if (port) { c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * 0.42); c.lineTo(0, h * 0.52); } else { c.moveTo(0, 0); c.lineTo(w * 0.55, 0); c.lineTo(w * 0.45, h); c.lineTo(0, h); } c.fill();
    c.fillStyle = 'rgba(255,90,79,0.25)'; c.beginPath(); if (port) { c.moveTo(0, h * 0.52); c.lineTo(w, h * 0.42); c.lineTo(w, h); c.lineTo(0, h); } else { c.moveTo(w * 0.55, 0); c.lineTo(w, 0); c.lineTo(w, h); c.lineTo(w * 0.45, h); } c.fill();
    var t = PK.cd > 0 ? (performance.now() - PK.cd) / 1000 : CD_T;
    function row(list, x0, x1, y, uni, flip) { var n = list.length, step = (x1 - x0) / n, ph = Math.min(step * 1.5, port ? h * 0.2 : h * 0.34); for (var i = 0; i < n; i++) { var lt = clamp01((t - i * 0.08) / 0.25); if (lt <= 0) continue; G.drawChar(c, list[i], x0 + step * (i + 0.5) + (flip ? 1 : -1) * (1 - lt) * w * 0.3, y, ph, now + i, uni, t > 1, flip); } }
    if (port) { row(T2[0], w * 0.04, w * 0.96, h * 0.36, MYUNI, false); row(T2[1], w * 0.04, w * 0.96, h * 0.86, FOEUNI, true); }
    else { row(T2[0], w * 0.02, w * 0.46, h * 0.82, MYUNI, false); row(T2[1], w * 0.54, w * 0.98, h * 0.82, FOEUNI, true); }
    var fs = Math.min(w, h) * 0.07;
    function txt(s, x, y, size, col) { c.font = 'italic 900 ' + Math.round(size) + 'px ' + G.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = '#1b1b2f'; c.lineWidth = size * 0.22; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); }
    var myName = PK.mode === 'single' ? G.t('my') : PK.mode === 'host' ? G.t('pHost') : G.t('pGuest'), foeName = PK.mode === 'single' ? G.t(G.TEAMS[PK.lvl].key) : PK.mode === 'host' ? G.t('pGuest') : G.t('pHost');
    if (port) { txt(myName, w / 2, h * 0.08, fs * 0.8, '#6ecbff'); txt(foeName, w / 2, h * 0.58, fs * 0.8, '#ff9d5c'); }
    else { txt(myName, w * 0.25, h * 0.12, fs * 0.8, '#6ecbff'); txt(foeName, w * 0.75, h * 0.12, fs * 0.8, '#ff9d5c'); }
    var cy = port ? h * 0.47 : h * 0.38, big, k;
    if (t < 1.0) { big = G.t('cdReady'); k = clamp01(t / 0.2); }
    else if (t < CD_T) { var q = Math.floor((t - 1.0) / 0.5); big = String(3 - q); k = clamp01(((t - 1.0) % 0.5) / 0.15); }
    else { big = PK.mode === 'guest' && PK.cd === -1 ? G.t('connecting') : G.t('cdFight'); k = 1; }
    txt('VS', w / 2, cy - fs * 1.6, fs * 0.9, '#fff');
    txt(big, w / 2, cy, fs * 2.1 * (0.6 + 0.4 * k), '#ffd23f');
    if (PK.cd > 0 && t >= CD_T) countdownDone();
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  $('pkGo').onclick = function () { A.unlock(); pickReady(); };
  $('pkRnd').onclick = function () { A.unlock(); if (PK.ready) return; PK.picks = G.randomChars(PK.n); save.picks = PK.picks.slice(); commit(); G.sfx('click'); pickRefresh(); };
  $('pkUndo').onclick = function () { A.unlock(); if (PK.ready || !PK.picks.length) return; PK.picks.pop(); save.picks = PK.picks.slice(); commit(); G.sfx('poof'); pickRefresh(); };
  $('pkBack').onclick = function () { A.unlock(); G.sfx('click'); pickBack(); };

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
    try {
      var now = performance.now();
      if (NET === 'guest' && (state === 'play' || state === 'result') && NETM.gotSnap) guestFrame(dt, now);
      else if (state === 'play' && M) {
        var my = M.myTeam || 0;
        if (M.hitstop > 0) { M.hitstop -= dt; if (M.shake > 0) M.shake *= 0.92; }
        else {
          var scale = M.slow > 0 ? 0.3 : M.nearSlow ? 0.4 : 1; if (M.slow > 0) M.slow -= dt;
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
        if (M.state === 'over') { resT += dt; if (resT > 0.4 || WD.speed > 1) result(); }
        // portrait camera follows the ball
        if (V.port) { var tx = Math.max(0, Math.min(W - V.SW, M.ball.x - V.SW / 2)); V.camX += (tx - V.camX) * Math.min(1, dt * 4); } else V.camX = 0;
      }
      if (NET === 'host' && M && (state === 'play' || state === 'result')) NETM.hostSend(M, now);
      if (NET && (state === 'play' || state === 'result' || state === 'pick') && NETM.timedOut(now)) netMsg('lost');
      if (state === 'pick') drawPick(ts / 1000);
      G.render(ctx, state === 'menu' || state === 'net' || state === 'pick' ? null : M, ts / 1000, V);
      A.tick();
    } catch (e) { WD.errors.push(String(e && e.stack || e)); if (WD.errors.length > 20) WD.errors.shift(); }
  }

  /* ---------- debug hook ---------- */
  WD.start = function (lvl, auto, n, chars) { WD.auto = !!auto; if (n) save.n = n; start(lvl || 0, chars); return true; };
  WD.fire = function (id) { return !!(M && M.state === 'play' && G.fire(M, id)); };
  WD.pick = function () { return { screen: state, mode: PK.mode, n: PK.n, picks: PK.picks.slice(), ready: PK.ready, foeReady: PK.foeReady, cd: PK.cd, teams: PK.teams, cols: PK.cols, easy: PK.easy }; };
  WD.chars = function () { return M ? [0, 1].map(function (t) { return M.bodies.filter(function (b) { return b.team === t; }).map(function (b) { return b.ch; }); }) : null; };
  WD.setEasy = function (v) { save.easy = !!v; commit(); refreshMenu(); };
  WD.keysShown = function () { return $('keys').style.display === 'block'; };
  WD.skipIntro = function () { if (M && M.state === 'intro' && !NET) M.st = 9; if (M && NET === 'host' && M.state === 'intro') M.st = 9; };
  WD.state = function () { return M ? { screen: state, net: NET, state: M.state, round: M.round, score: M.score.slice(), counts: G.counts(M), time: M.time, spFired: M.spFired, winner: M.winner, meter: M.meter.slice(), ball: M.ball.st, ballTeam: M.ball.team, ballX: Math.round(M.ball.x), holder: M.ball.holder ? M.ball.holder.id : -1, ctrl: M.ctrl, ctrl2: M.ctrl2, n: M.bodies.length / 2, errors: WD.errors.length } : { screen: state, net: NET, errors: WD.errors.length }; };
  WD.give = function (team) { if (!M || NET === 'guest') return false; return G.giveTo(M, team ? M.ctrl2 : M.ctrl); };
  WD.net = function () { return { role: NET, code: NETM.code, open: NETM.open, stats: NETM.stats, lag: NETM.lagMs(), screen: state, msg: ($('netMsg') || {}).textContent || '' }; };
  WD.specials = G.SPECIALS;
  WD.toMenu = toMenu;
  WD.size = function (n) { save.n = n; commit(); refreshMenu(); };

  layout(); refreshMenu(); show('menu');
  // ?room=1234 in the link -> join straight away
  var qm = /[?&]room=(\d{4})(?:&|$)/.exec(location.search);
  if (qm) { try { history.replaceState(null, '', location.pathname); } catch (e) { } joinRoom(qm[1]); }
  requestAnimationFrame(frame);
})();
