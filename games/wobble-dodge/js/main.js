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
  var KEY = 'wobbledodge_v1', save = { beaten: 0, mute: false, lang: null, played: 0, n: 5 };
  try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); for (var k in o) save[k] = o[k]; } } catch (e) { }
  if (G.TEAM_SIZES.indexOf(save.n) < 0) save.n = 5;
  function commit() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  if (save.lang === 'ko' || save.lang === 'en') G.lang = save.lang;
  A.muted = !!save.mute;

  /* ---------- layout ---------- */
  // right-thumb cluster: [id, size, angle(deg, 180 = left of THROW, 90 = above), radius] in units of u
  var CLUSTER = [['tThrow', 0.22, 0, 0], ['tCatch', 0.15, 186, 0.27], ['tPass', 0.12, 150, 0.265], ['tSp', 0.12, 119, 0.265], ['tJump', 0.145, 88, 0.27]];
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
    var lift = port ? Math.max(0, (TH - 0.52 * u) * 0.35) : 0, cx0 = 0.17, cy0 = 0.17, minR = 1e9;
    CLUSTER.forEach(function (c) {
      var e = $(c[0]), s = c[1], a = c[2] * Math.PI / 180, cR = cx0 - c[3] * Math.cos(a), cB = cy0 + c[3] * Math.sin(a), px = s * u;
      e.style.width = e.style.height = px + 'px'; e.style.right = ((cR - s / 2) * u + edge) + 'px'; e.style.bottom = ((cB - s / 2) * u + edge + lift) + 'px';
      fitBtn(e, px);
      minR = Math.min(minR, (cR - s / 2) * u + edge);
      e.dataset.left = TW - ((cR + s / 2) * u + edge);
    });
    var clusterW = (cx0 + 0.27 + 0.075) * u + edge;   // from the right edge to the left side of CATCH
    var st = $('stick'); st.style.left = '0px'; st.style.bottom = '0px'; st.style.width = Math.max(120, Math.min(TW * 0.5, TW - clusterW - 16)) + 'px'; st.style.height = (TH * (port ? 1 : 0.75)) + 'px';
    var sb = $('stickBase'), bs = Math.min(0.32 * u, parseFloat(st.style.width) * 0.8, 170); sb.style.width = sb.style.height = bs + 'px'; stickHome();
    var bp = $('btnPause'); if (port) { bp.style.top = (h + 10) + 'px'; bp.style.right = 'auto'; bp.style.left = (vw / 2 - 22) + 'px'; } else { bp.style.top = (t + h * 86 / 720) + 'px'; bp.style.left = (l + w / 2 - 22) + 'px'; bp.style.right = 'auto'; }
  }
  function fitBtn(e, px) {   // largest font (<= 24% of the button) whose label fits inside the circle
    px = px || e.offsetWidth; var fs = Math.round(px * 0.24); e.style.fontSize = fs + 'px';
    if (!e.offsetWidth) return;
    while (fs > 7 && e.scrollWidth > e.clientWidth * 0.86) { fs--; e.style.fontSize = fs + 'px'; }
  }
  function stickHome() { var st = $('stick'), sb = $('stickBase'), s = parseFloat(sb.style.width) || 120; sb.style.left = (parseFloat(st.style.width) * 0.5 - s / 2) + 'px'; sb.style.top = (parseFloat(st.style.height) * (V.port ? 0.5 : 0.62) - s / 2) + 'px'; }
  window.addEventListener('resize', layout); window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });

  /* ---------- input ---------- */
  var keys = {}, press = { catchP: false, jumpP: false, passP: false, spP: false }, tch = { mx: 0, mz: 0, thr: false };
  var KM = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd',
    KeyJ: 'thr', KeyZ: 'thr', KeyK: 'cat', KeyX: 'cat', Space: 'jmp', KeyL: 'jmp', KeyC: 'jmp', KeyI: 'pas', KeyV: 'pas', KeyO: 'sp', KeyB: 'sp', KeyE: 'sp' };
  window.addEventListener('keydown', function (e) {
    A.unlock();
    if (e.target && e.target.tagName === 'INPUT') { if (e.code === 'Enter' || e.code === 'NumpadEnter') { var bj = $('bJoinGo'); if (bj) bj.click(); } return; }
    var a = KM[e.code];
    if (a && state === 'play') e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play' && !ovl) pause(); else if (state === 'pause' || ovl) resume(); return; }
    if (e.code === 'Enter') { if (state === 'menu') $('bPlay').click(); else if (state === 'result' && !NET) ($('bNext').style.display !== 'none' ? $('bNext') : $('bRetry')).click(); return; }
    if (!a || e.repeat) return;
    if (touchOn) setTouch(false);
    keys[a] = true;
    if (a === 'cat') press.catchP = true; if (a === 'jmp') press.jumpP = true; if (a === 'pas') press.passP = true; if (a === 'sp') press.spP = true;
  });
  window.addEventListener('keyup', function (e) { var a = KM[e.code]; if (a) keys[a] = false; });
  window.addEventListener('blur', function () { keys = {}; tch.thr = false; });
  function readInput() {
    var mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + tch.mx, mz = (keys.d ? 1 : 0) - (keys.u ? 1 : 0) + tch.mz;
    return { mx: Math.max(-1, Math.min(1, mx)), mz: Math.max(-1, Math.min(1, mz)), throwHeld: !!keys.thr || tch.thr, catchP: press.catchP, jumpP: press.jumpP, passP: press.passP, spP: press.spP };
  }
  function clearPress() { press.catchP = press.jumpP = press.passP = press.spP = false; }
  function setTouch(on) { touchOn = on; V.touch = on; $('touch').classList.toggle('on', on && (state === 'play' || state === 'pause')); if (on) ['tThrow', 'tCatch', 'tJump', 'tPass', 'tSp'].forEach(function (id) { fitBtn($(id)); }); }
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
    tb('tThrow', function () { tch.thr = true; }, function () { tch.thr = false; });
    tb('tCatch', function () { press.catchP = true; }); tb('tJump', function () { press.jumpP = true; });
    tb('tPass', function () { press.passP = true; }); tb('tSp', function () { press.spP = true; });
    window.addEventListener('pointerdown', function (e) { A.unlock(); if (e.pointerType === 'touch' && !touchOn) setTouch(true); }, true);
    document.addEventListener('contextmenu', function (e) { if (!(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
  })();
  if (window.matchMedia && window.matchMedia('(pointer:coarse)').matches) setTouch(true);

  /* ---------- screens ---------- */
  function show(id) { ['menu', 'result', 'pause', 'net'].forEach(function (s) { $(s).classList.toggle('on', s === id); }); $('tops').style.display = (id === 'menu' || id === 'pause' || id === 'net') ? 'flex' : 'none'; }
  function sizeLabel() { return G.t('teamSize') + ': ' + G.t('vs', save.n, save.n); }
  function refreshMenu() {
    G.applyI18n();
    $('bLang').textContent = G.t('lang'); $('bMute').textContent = G.t('sound') + ': ' + (A.muted ? G.t('off') : G.t('on'));
    $('bSize').textContent = sizeLabel();
    var lad = $('ladder'); lad.innerHTML = '';
    sel = Math.min(sel, save.beaten);
    G.TEAMS.forEach(function (tm, i) {
      var el = document.createElement('button'), lock = i > save.beaten, done = i < save.beaten;
      el.className = 'team' + (lock ? ' lock' : '') + (done ? ' done' : '') + (i === sel ? ' sel' : '');
      el.innerHTML = '<span class="n">' + (i + 1) + '</span><span>' + G.t(tm.key) + '</span><span class="dots">' + tm.skins.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span><span class="st">' + (lock ? G.t('locked') : done ? G.t('beaten') : G.t('next')) + '</span>';
      if (!lock) el.onclick = function () { sel = i; A.unlock(); G.sfx('click'); refreshMenu(); };
      lad.appendChild(el);
    });
    $('help').innerHTML = G.t('help') + '<br><span style="color:#ffd23f">' + (touchOn ? G.t('hintT') : G.t('hintK')) + '</span>' + (save.beaten >= 5 ? '<br><b>' + G.t('champion') + '</b> ' + G.t('allClear') : '');
    if (state === 'net' && netView) netView();
  }
  function enterPlay() { state = 'play'; ovl = false; show(null); $('btnPause').style.display = 'block'; setTouch(touchOn); acc = 0; resT = 0; gAcc = 0; V.camX = 0; layout(); }
  function start(lvl) {
    A.unlock(); sel = lvl;
    M = G.M = G.newMatch({ lvl: lvl, auto: WD.auto, hint: save.played < 3, n: save.n });
    save.played++; commit();
    enterPlay();
  }
  function startVersus() {   // host: a fresh online match (host = left team)
    A.unlock();
    M = G.M = G.newMatch({ lvl: 0, versus: true, hint: false, n: save.n }); M.myTeam = 0;
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
  function resume() { if (ovl) { ovl = false; show(null); return; } if (state !== 'pause') return; state = 'play'; show(null); last = performance.now(); }
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
  $('bPlay').onclick = function () { start(sel); };
  $('bNext').onclick = function () { start(Math.min(4, M.lvl + 1)); };
  $('bRetry').onclick = function () { if (NET === 'host') startVersus(); else if (!NET) start(M.lvl); };
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
    else if (m.t === 'peer_joined' && NET === 'host') startVersus();
    else if (m.t === 'first_snap' && NET === 'guest') { M = G.M = NETM.guestView(performance.now()); enterPlay(); }
    else if (m.t === 'err') {
      if (m.e === 'taken' && NET === 'host' && ++hostTries < 6) { NETM.close(true); tryHost(); }
      else if (NET === 'guest') { var c = NETM.code; NET = null; NETM.close(); joinView(c, m.e === 'full' ? 'full' : 'noroom'); }
      else netMsg('netErr');
    }
    else if (m.t === 'peer_left') netMsg(NET === 'host' ? 'peerLeft' : 'hostLeft');
    else if (m.t === 'closed') { if (m.code === 4000) return; netMsg(!m.opened ? 'netErr' : m.code === 4001 ? 'hostLeft' : 'lost'); }
    else if (m.t === 'neterr') netMsg('netErr');
  }

  function setPassLabel(hold) { var e = $('tPass'), t = hold ? G.t('tPass') : G.t('tSwitch'); if (e.textContent !== t) { e.textContent = t; if (touchOn) fitBtn(e); } }

  /* ---------- loop ---------- */
  function guestFrame(dt, now) {
    NETM.guestSend(readInput(), now); clearPress();
    var Vw = M = G.M = NETM.guestView(now);
    gAcc += dt; var n = 0; while (gAcc >= DT && n < 12) { G.stepFx(Vw); gAcc -= DT; n++; } if (n >= 12) gAcc = 0;
    if (state === 'play') {
      $('tSp').classList.toggle('full', Vw.meter[1] >= 1);
      setPassLabel(Vw.ctrl >= 0 && Vw.bodies[Vw.ctrl] && Vw.bodies[Vw.ctrl].hold);
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
            if (n === 0) { clearPress(); inp.catchP = inp.jumpP = inp.passP = inp.spP = false; if (inp2) NETM.afterStep(); }
            acc -= DT; n++; if (M.state === 'over') break;
          }
          if (n >= cap) acc = 0;
        }
        if (M.shake > 0) M.shake = Math.max(0, M.shake - dt * 45); if (M.flash > 0) M.flash -= dt;
        $('tSp').classList.toggle('full', M.meter[my] >= 1);
        setPassLabel(M.ctrl >= 0 && M.bodies[M.ctrl].hold);
        if (M.state === 'over') { resT += dt; if (resT > 0.4 || WD.speed > 1) result(); }
        // portrait camera follows the ball
        if (V.port) { var tx = Math.max(0, Math.min(W - V.SW, M.ball.x - V.SW / 2)); V.camX += (tx - V.camX) * Math.min(1, dt * 4); } else V.camX = 0;
      }
      if (NET === 'host' && M && (state === 'play' || state === 'result')) NETM.hostSend(M, now);
      if (NET && (state === 'play' || state === 'result') && NETM.timedOut(now)) netMsg('lost');
      G.render(ctx, state === 'menu' || state === 'net' ? null : M, ts / 1000, V);
      A.tick();
    } catch (e) { WD.errors.push(String(e && e.stack || e)); if (WD.errors.length > 20) WD.errors.shift(); }
  }

  /* ---------- debug hook ---------- */
  WD.start = function (lvl, auto, n) { WD.auto = !!auto; if (n) save.n = n; start(lvl || 0); return true; };
  WD.fire = function (id) { return !!(M && M.state === 'play' && G.fire(M, id)); };
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
