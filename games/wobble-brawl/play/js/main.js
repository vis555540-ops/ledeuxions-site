/* Boot, loop, input, UI flow, progression. */
(function () {
  'use strict';
  var G = window.G, W = G.W, H = G.H, Save = G.save, Sdk = G.sdk, A = G.audio;
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d'), S = 1;
  var state = 'menu', M = null, last = 0, nextDemo = false, demoIdx = 0, lastMap = '', curMode = 'cpu';
  var trial = { skin: null, hat: null }, shopTab = 'skins', resInfo = null, touchOn = false;
  var Q = (function () { var o = {}; location.search.replace(/[?&]([^=&]+)=?([^&]*)/g, function (_, k, v) { o[k] = v; }); return o; })();
  var dbg = G.debug = { auto: !!Q.autotest, speed: +Q.speed || 1, log: [], errors: [] };
  var DAILY = [{ k: 'd_win', n: 2, s: 'win' }, { k: 'd_out', n: 3, s: 'outs' }, { k: 'd_hits', n: 40, s: 'hits' }, { k: 'd_throw', n: 5, s: 'throws' }, { k: 'd_hard', n: 1, s: 'hard' }, { k: 'd_item', n: 6, s: 'items' }, { k: 'd_round', n: 5, s: 'rounds' }];
  var DAILY_REWARD = 60, WIN_COINS = [20, 30, 45];

  /* ---------- layout ---------- */
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight, w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.setProperty('--u', (w / W) + 'px');
    var dpr = Math.min(window.devicePixelRatio || 1, 2), pw = Math.min(1920, Math.max(320, Math.round(w * dpr)));
    if (cv.width !== pw) { cv.width = pw; cv.height = Math.round(pw * 9 / 16); }
    S = cv.width / W;
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize);

  /* ---------- input ---------- */
  function mkDev() { return { l: false, r: false, u: false, d: false, ax: 0, p: { jump: false, atk: false, kick: false, grab: false } }; }
  var dev = { kb1: mkDev(), kb2: mkDev(), touch: mkDev() };
  var KEYS = {
    KeyA: ['kb1', 'l'], KeyD: ['kb1', 'r'], KeyW: ['kb1', 'u'], KeyS: ['kb1', 'd'], KeyF: ['kb1', 'atk'], KeyG: ['kb1', 'kick'], KeyH: ['kb1', 'grab'], Space: ['kb1', 'u'],
    ArrowLeft: ['kb2', 'l'], ArrowRight: ['kb2', 'r'], ArrowUp: ['kb2', 'u'], ArrowDown: ['kb2', 'd'], KeyJ: ['kb2', 'atk'], KeyK: ['kb2', 'kick'], KeyL: ['kb2', 'grab']
  };
  function clearInput() { for (var k in dev) { var d = dev[k]; d.l = d.r = d.u = d.d = false; d.ax = 0; d.p.jump = d.p.atk = d.p.kick = d.p.grab = false; } }
  window.addEventListener('keydown', function (e) {
    var m = KEYS[e.code];
    if (m || e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Enter') { if (state !== 'menu' || m) e.preventDefault(); }
    A.unlock();
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (state === 'play') pause(); else if (state === 'pause') resume(); else if (state === 'shop') closeShop(); return; }
    if (e.code === 'Enter') { if (state === 'result' && resInfo && resInfo.shown) $('bRematch').click(); else if (state === 'menu') $('bPlay').click(); return; }
    if (!m) return;
    if (touchOn && state === 'play') setTouch(false);
    var d = dev[m[0]], f = m[1];
    if (M && M.cfg.tut && M.phase === 'intro' && M.pt > 0.6) M.skipTut = true;
    if (f === 'atk' || f === 'grab' || f === 'kick') d.p[f] = true; else { if (f === 'u' && !d.u) d.p.jump = true; d[f] = true; }
  });
  window.addEventListener('keyup', function (e) { var m = KEYS[e.code]; if (!m) return; var f = m[1]; if (f === 'l' || f === 'r' || f === 'u' || f === 'd') { if (e.code === 'Space' && dev.kb1.u && false) return; dev[m[0]][f] = false; } });
  G.readInput = function (f) {
    var inp = f.inp, mx = 0, up = false, down = false;
    for (var i = 0; i < f.src.length; i++) {
      var d = dev[f.src[i]]; mx += (d.r ? 1 : 0) - (d.l ? 1 : 0) + d.ax; up = up || d.u; down = down || d.d;
      if (d.p.jump) { f.buf.jump = 0.14; d.p.jump = false; } if (d.p.atk) { f.buf.atk = 0.14; d.p.atk = false; }
      if (d.p.kick) { f.buf.kick = 0.14; d.p.kick = false; } if (d.p.grab) { f.buf.grab = 0.14; d.p.grab = false; }
    }
    inp.mx = mx > 0.3 ? 1 : mx < -0.3 ? -1 : 0; inp.up = up; inp.down = down;
  };
  /* touch controls */
  function setTouch(on) { touchOn = on; $('touch').classList.toggle('on', on && state === 'play'); }
  (function () {
    var stick = $('stick'), base = $('stickBase'), knob = $('stickKnob'), sid = null, ox = 0, oy = 0, T = dev.touch;
    function mv(e) { var r = base.getBoundingClientRect(), rad = r.width / 2, dx = (e.clientX - ox) / rad, dy = (e.clientY - oy) / rad, l = Math.sqrt(dx * dx + dy * dy); if (l > 1) { dx /= l; dy /= l; } T.ax = Math.abs(dx) > 0.28 ? (dx > 0 ? 1 : -1) : 0; T.d = dy > 0.55; knob.style.transform = 'translate(' + (dx * rad * 0.6) + 'px,' + (dy * rad * 0.6) + 'px)'; }
    stick.addEventListener('pointerdown', function (e) { if (sid !== null) return; sid = e.pointerId; try { stick.setPointerCapture(sid); } catch (x) { } var r = base.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; mv(e); e.preventDefault(); });
    stick.addEventListener('pointermove', function (e) { if (e.pointerId === sid) mv(e); });
    function end(e) { if (e.pointerId !== sid) return; sid = null; T.ax = 0; T.d = false; knob.style.transform = ''; }
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    function tb(id, fn, upfn) { var el = $(id); el.addEventListener('pointerdown', function (e) { e.preventDefault(); A.unlock(); el.classList.add('dn'); fn(); }); function up() { el.classList.remove('dn'); if (upfn) upfn(); } el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); }
    tb('tJump', function () { T.p.jump = true; T.u = true; }, function () { T.u = false; });
    tb('tHit', function () { T.p.atk = true; }); tb('tKick', function () { T.p.kick = true; }); tb('tGrab', function () { T.p.grab = true; });
    window.addEventListener('pointerdown', function (e) { A.unlock(); if (M && M.cfg.tut && M.phase === 'intro' && M.pt > 0.6) M.skipTut = true; if (e.pointerType === 'touch' && !touchOn) setTouch(true); }, true);
    document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  })();

  /* ---------- save helpers ---------- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function ensureDaily() {
    var d = Save.data.daily, t = today();
    if (d.date !== t) { var n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000); Save.data.daily = { date: t, id: n % DAILY.length, prog: 0, done: false }; }
  }
  function applyOpts() { var o = Save.data.opts; A.music = !!o.music; A.sfxOn = !!o.sfx; if (o.lang === 'en' || o.lang === 'ko') G.lang = o.lang; }

  /* ---------- UI refresh ---------- */
  function show(id, on) { $(id).classList.toggle('on', on); }
  function click(id, fn) { $(id).addEventListener('click', function (e) { A.unlock(); A.sfx('click', true); fn(e); }); }
  function refreshMenu() {
    var d = Save.data; G.applyI18n();
    $('coins').textContent = d.coins; $('coins2').textContent = d.coins; $('streak').textContent = d.streak + (d.best ? '  (' + G.t('best') + ' ' + d.best + ')' : '');
    ['bMusic', 'bMusic2'].forEach(function (id) { $(id).textContent = G.t('music') + ' ' + G.t(d.opts.music ? 'on' : 'off'); $(id).classList.toggle('off', !d.opts.music); });
    ['bSfx', 'bSfx2'].forEach(function (id) { $(id).textContent = G.t('sfx') + ' ' + G.t(d.opts.sfx ? 'on' : 'off'); $(id).classList.toggle('off', !d.opts.sfx); });
    $('bLang').textContent = G.lang === 'ko' ? 'English' : '한국어';
    var bs = $('diff').children; for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('pri', +bs[i].getAttribute('data-lvl') === d.lvl);
    ensureDaily(); var dd = d.daily, def = DAILY[dd.id];
    $('dailyTxt').textContent = G.t(def.k, def.n); $('dailyBar').style.width = Math.min(100, dd.prog / def.n * 100) + '%';
    $('dailySub').innerHTML = dd.done ? G.t('claim') : (Math.min(dd.prog, def.n) + ' / ' + def.n + ' &nbsp;·&nbsp; ' + G.t('reward') + ' <span class="coin s"></span> ' + DAILY_REWARD);
    var mp = $('maps'); mp.innerHTML = '';
    ['random'].concat(G.maps.order).forEach(function (id) {
      var b = document.createElement('button'); b.className = 'btn sm' + (d.map === id ? ' pri' : ''); b.textContent = id === 'random' ? G.t('random') : G.t(G.maps.defs[id].name);
      b.addEventListener('click', function () { A.unlock(); A.sfx('click', true); d.map = id; Save.commit(); refreshMenu(); }); mp.appendChild(b);
    });
    $('tHit').textContent = G.lang === 'ko' ? '펀치' : 'HIT'; $('tKick').textContent = G.lang === 'ko' ? '킥' : 'KICK'; $('tGrab').textContent = G.lang === 'ko' ? '잡기' : 'GRAB'; $('tJump').textContent = G.lang === 'ko' ? '점프' : 'JUMP';
    $('b2p').style.display = (window.matchMedia && window.matchMedia('(pointer:coarse)').matches && !window.matchMedia('(any-pointer:fine)').matches) ? 'none' : '';
    $('pauseHelp').innerHTML = touchOn ? G.t('ctlTouch') : (G.t('ctl1') + '<br>' + G.t('ctl2'));
  }

  /* ---------- shop ---------- */
  var previews = [];
  function buildShop() {
    var d = Save.data, grid = $('grid'), list = shopTab === 'skins' ? G.SKINS : G.HATS, own = shopTab === 'skins' ? d.skins : d.hats, key = shopTab === 'skins' ? 'skin' : 'hat';
    grid.innerHTML = ''; previews = [];
    $('tabSkins').classList.toggle('pri', shopTab === 'skins'); $('tabHats').classList.toggle('pri', shopTab === 'hats'); $('coins2').textContent = d.coins;
    list.forEach(function (it) {
      var el = document.createElement('div'), owned = own.indexOf(it.id) >= 0, eq = d[key] === it.id, trying = trial[key] === it.id;
      el.className = 'item' + (eq ? ' sel' : '');
      var c = document.createElement('canvas'); c.width = 180; c.height = 195; el.appendChild(c);
      previews.push({ cv: c, skin: key === 'skin' ? it.id : (trial.skin || d.skin), hat: key === 'hat' ? it.id : (trial.hat || d.hat) });
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = G.t((key === 'skin' ? 's_' : 'h_') + it.id); el.appendChild(nm);
      var acts = document.createElement('div'); acts.className = 'acts'; el.appendChild(acts);
      function btn(html, cls, fn) { var b = document.createElement('button'); b.className = 'btn sm ' + cls; b.innerHTML = html; b.addEventListener('click', function () { A.unlock(); fn(); }); acts.appendChild(b); return b; }
      if (owned) {
        if (eq) btn(G.t('equipped'), 'off', function () { });
        else btn(G.t('equip'), 'pri', function () { d[key] = it.id; trial[key] = null; Save.commit(); A.sfx('click', true); buildShop(); });
      } else {
        btn('<span class="coin s"></span>' + it.cost, d.coins >= it.cost ? 'pri' : '', function () {
          if (d.coins < it.cost) { A.sfx('deny', true); var ch = $('coinChip2'); ch.classList.remove('shake'); void ch.offsetWidth; ch.classList.add('shake'); return; }
          d.coins -= it.cost; own.push(it.id); d[key] = it.id; trial[key] = null; Save.commit(); A.sfx('coin', true); buildShop();
        });
        if (trying) { var tg = document.createElement('div'); tg.className = 'tag'; tg.textContent = G.t('trying'); el.appendChild(tg); }
        else if (Sdk.canReward()) btn(G.t('tryad'), 'green', function () { Sdk.rewarded(function (ok) { if (ok) { trial[key] = it.id; A.sfx('coin', true); buildShop(); } }); });
      }
      grid.appendChild(el);
    });
  }
  function openShop() { state = 'shop'; show('menu', false); show('shop', true); buildShop(); }
  function closeShop() { state = 'menu'; show('shop', false); show('menu', true); refreshMenu(); }

  /* ---------- match flow ---------- */
  function pickMap() {
    var d = Save.data; if (d.map !== 'random') return d.map;
    if (!d.played && !lastMap) return 'roof';
    var o = G.maps.order, id; do { id = o[(Math.random() * o.length) | 0]; } while (id === lastMap); return id;
  }
  function rndOf(list, not) { var x; do { x = list[(Math.random() * list.length) | 0].id; } while (x === not); return x; }
  function startDemo() {
    var id = G.maps.order[demoIdx++ % G.maps.order.length];
    M = G.M = G.newMatch({ mode: 'demo', map: id, pxScale: S * 1.25, p: [{ name: '', skin: trial.skin || Save.data.skin, hat: trial.hat || Save.data.hat, ai: 1 }, { name: '', skin: rndOf(G.SKINS, Save.data.skin), hat: rndOf(G.HATS, ''), ai: 1 }] });
    A.demo = true; A.intensity = 0;
  }
  function startMatch(mode) {
    var d = Save.data; curMode = mode; clearInput(); A.unlock();
    var map = pickMap(); lastMap = map;
    var mySkin = trial.skin || d.skin, myHat = trial.hat || d.hat, p0, p1;
    if (mode === 'cpu') {
      p0 = { name: G.t('you'), skin: mySkin, hat: myHat, src: ['kb1', 'kb2', 'touch'], human: true };
      p1 = { name: G.t('cpu'), skin: rndOf(G.SKINS, mySkin), hat: rndOf(G.HATS, 'none'), ai: d.lvl };
      if (dbg.auto || Q.bot) { p0.ai = dbg.lvl0 != null ? dbg.lvl0 : (Q.bot ? 2 : 1); p0.src = []; p0.noMercy = true; }
    } else {
      p0 = { name: G.t('p1'), skin: mySkin, hat: myHat, src: ['kb1'], human: true };
      p1 = { name: G.t('p2'), skin: mySkin === 'blue' ? 'red' : 'blue', hat: myHat === 'cap' ? 'band' : 'cap', src: ['kb2'], human: true };
    }
    var mercy = mode === 'cpu' && d.played < 2 && d.lvl < 2 && !dbg.auto, first = !(d.seenHint > 0) && !dbg.auto;
    M = G.M = G.newMatch({ mode: mode, map: map, pxScale: S * 1.25, lvl: d.lvl, p: [p0, p1], mercy: mercy || !!Q.mercy, tut: first || !!Q.tut, touch: touchOn,
      cpuDmg: [0.5, 0.7, 1][d.lvl] * (mercy ? 0.75 : 1), plDmg: [1.2, 1.05, 1][d.lvl], cpuKb: [0.55, 0.7, 1][d.lvl] * (mercy ? 0.85 : 1), plKb: [1.15, 1.1, 1][d.lvl] });
    if ((d.seenHint || 0) < 3) { M.hint = touchOn ? [G.t('ctlTouch')] : mode === 'cpu' ? [G.t('ctl1p')] : [G.t('ctl1'), G.t('ctl2')]; d.seenHint = (d.seenHint || 0) + 1; Save.commit(); }
    A.demo = false; A.intensity = 1; state = 'play'; resInfo = null;
    show('menu', false); show('result', false); show('pause', false); show('shop', false);
    $('btnPause').style.display = 'block'; $('touch').classList.toggle('on', touchOn);
  }
  function toMenu() {
    Sdk.gameplayStop(); state = 'menu'; show('result', false); show('pause', false); show('menu', true);
    $('btnPause').style.display = 'none'; $('touch').classList.remove('on'); startDemo(); refreshMenu();
  }
  function pause() { if (state !== 'play') return; state = 'pause'; Sdk.gameplayStop(); refreshMenu(); show('pause', true); }
  function resume() { if (state !== 'pause') return; state = 'play'; show('pause', false); clearInput(); last = 0; if (M && M.phase === 'fight') Sdk.gameplayStart(); }

  G.gameEvent = function (name, m) {
    if (m.demo) { if (name === 'end') nextDemo = true; return; }
    if (name === 'fight') Sdk.gameplayStart();
    else if (name === 'ko') {
      if ((m.koKind === 'ko' || m.koKind === 'out') && (m.mode === '2p' || m.roundWinner === 0)) Sdk.happytime();
    } else if (name === 'end') finishMatch(m);
  };
  function finishMatch(m) {
    var d = Save.data, cpu = m.mode === 'cpu', win = m.winner === 0, coins, bonus = 0, st = m.stats[0];
    Sdk.gameplayStop(); state = 'result'; $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
    ensureDaily(); var dd = d.daily, def = DAILY[dd.id], dailyJust = false;
    if (cpu) {
      d.played++;
      if (win) { d.wins++; d.streak++; if (d.streak > d.best) d.best = d.streak; coins = WIN_COINS[m.cfg.lvl] || 20; bonus = Math.min(d.streak - 1, 5) * 4; } else { d.streak = 0; coins = 5; }
      if (!dd.done && !dbg.auto) {
        var add = def.s === 'win' ? (win ? 1 : 0) : def.s === 'hard' ? (win && m.cfg.lvl === 2 ? 1 : 0) : st[def.s];
        dd.prog += add; if (dd.prog >= def.n) { dd.done = true; dailyJust = true; }
      }
    } else { coins = 5; d.played++; }
    var total = coins + bonus + (dailyJust ? DAILY_REWARD : 0);
    d.coins += total; trial.skin = trial.hat = null; Save.commit();
    resInfo = { coins: total, base: coins + bonus, doubled: false, shown: false, win: win, cpu: cpu };
    dbg.log.push({ map: m.map.id, lvl: m.cfg.lvl, winner: m.winner, score: m.score.slice(), stats: m.stats, draws: m.draws });
    setTimeout(function () {
      if (state !== 'result' || G.M !== m) return;
      $('resTitle').textContent = cpu ? G.t(win ? 'youwin' : 'youlose') : G.t('wins', m.f[m.winner].name);
      $('resTitle').style.color = (cpu && !win) ? '#c9cbe0' : '#ffd23f';
      $('score').textContent = m.score[0] + ' - ' + m.score[1];
      $('resCoins').textContent = '+' + total + (bonus ? '  (' + G.t('streakBonus') + ' +' + bonus + ')' : '');
      $('resStreakLine').style.display = cpu ? '' : 'none'; $('resStreak').textContent = d.streak + '  /  ' + G.t('best') + ' ' + d.best;
      $('resDailyLine').style.display = cpu ? '' : 'none'; $('resDailyTxt').textContent = G.t(def.k, def.n);
      $('resDaily').innerHTML = dd.done ? (dailyJust ? G.t('done') + ' +' + DAILY_REWARD : G.t('claim')) : Math.min(dd.prog, def.n) + ' / ' + def.n;
      $('bDouble').style.display = Sdk.canReward() ? '' : 'none'; $('bDouble').disabled = false;
      $('bDouble').innerHTML = G.t('doublead') + ' &nbsp;<span class="coin s"></span> +' + total;
      $('bRematch').textContent = G.t(Save.data.map === 'random' ? 'next' : 'rematch');
      show('result', true); resInfo.shown = true; A.sfx(cpu && !win ? 'lose' : 'win', true);
      if (!cpu || win) G.fxConfetti(m, 640, 200, 40);
      if (dbg.auto) setTimeout(function () { if (state === 'result') { if (dbg.onNext) dbg.onNext(); startMatch('cpu'); } }, 300);
    }, dbg.auto ? 100 : 900);
  }

  /* ---------- loop ---------- */
  function frame(ts) {
    requestAnimationFrame(frame);
    var now = ts / 1000, dt = last ? Math.min(0.05, now - last) : 1 / 60; last = now;
    if (dt <= 0) return;
    A.tick();
    if (nextDemo) { nextDemo = false; if (state === 'menu' || state === 'shop') startDemo(); }
    if (!M) return;
    try {
      if (state !== 'pause' && !Sdk.adPlaying) { for (var i = 0; i < dbg.speed; i++) G.stepMatch(M, dbg.speed > 1 ? 1 / 60 : dt); }
      G.render(ctx, M, S, now);
    } catch (e) { dbg.errors.push(String(e && e.stack || e)); if (dbg.errors.length < 4) console.error(e); }
    if (state === 'shop') for (var k = 0; k < previews.length; k++) G.drawPreview(previews[k].cv, previews[k].skin, previews[k].hat, now);
  }

  /* ---------- boot ---------- */
  function boot() {
    Save.loadLocal(); applyOpts(); ensureDaily(); resize(); refreshMenu();
    click('bPlay', function () { startMatch('cpu'); });
    click('b2p', function () { startMatch('2p'); });
    click('bShop', openShop); click('bShopBack', closeShop);
    click('tabSkins', function () { shopTab = 'skins'; buildShop(); }); click('tabHats', function () { shopTab = 'hats'; buildShop(); });
    var bs = $('diff').children; for (var i = 0; i < bs.length; i++) (function (b) { b.addEventListener('click', function () { A.unlock(); A.sfx('click', true); Save.data.lvl = +b.getAttribute('data-lvl'); Save.commit(); refreshMenu(); }); })(bs[i]);
    function tgl(k) { return function () { Save.data.opts[k] = !Save.data.opts[k]; applyOpts(); Save.commit(); refreshMenu(); }; }
    click('bMusic', tgl('music')); click('bMusic2', tgl('music')); click('bSfx', tgl('sfx')); click('bSfx2', tgl('sfx'));
    click('bLang', function () { G.lang = G.lang === 'ko' ? 'en' : 'ko'; Save.data.opts.lang = G.lang; Save.commit(); refreshMenu(); });
    click('btnPause', pause); click('bResume', resume);
    click('bQuit', function () { if (curMode === 'cpu' && M && !M.ended) { Save.data.streak = 0; Save.commit(); } toMenu(); });
    click('bRematch', function () { var md = curMode; show('result', false); Sdk.midgame(function () { startMatch(md); }); });
    click('bResMenu', toMenu);
    click('bDouble', function () {
      if (!resInfo || resInfo.doubled) return; $('bDouble').disabled = true;
      Sdk.rewarded(function (ok) { if (ok && resInfo && !resInfo.doubled) { resInfo.doubled = true; Save.data.coins += resInfo.coins; Save.commit(); $('resCoins').textContent = '+' + (resInfo.coins * 2); A.sfx('coin', true); $('bDouble').style.display = 'none'; } else $('bDouble').disabled = false; });
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { if (state === 'play' && !dbg.auto) pause(); A.suspend(); } else { A.resume(); last = 0; } });
    window.addEventListener('blur', function () { if (state === 'play' && !dbg.auto) pause(); clearInput(); });
    startDemo();
    requestAnimationFrame(frame);
    Sdk.init().then(function () {
      Sdk.loadingStart();
      if (Save.loadSdk()) { applyOpts(); if (state === 'menu') refreshMenu(); }
      Sdk.loadingStop();
      if (state === 'menu') refreshMenu();
    });
    if (dbg.auto) { if (Q.lvl) Save.data.lvl = +Q.lvl; if (Q.map) Save.data.map = Q.map; if (Q.lvl0) dbg.lvl0 = +Q.lvl0; startMatch('cpu'); }
  }
  window.addEventListener('error', function (e) { dbg.errors.push(String(e.message)); });
  boot();
})();
