/* 언더독 피구 — team select (KOF-style) + VS screen. Loaded late like story.js (never part of the first load).
   Still screen: static face icons from ONE sprite sheet, only the cursor frame moves. Motion only on events, as short clips:
   hover swap (XV: old portrait gone at once, ~200 ms gap, new one slides in 140 ms; LITE = XIII instant cut),
   pick (white flash 50 ms + 6 px shake 120 ms + thud, face flies to its slot 250 ms), intro clip (0.3 s squash, 0.15 s pop + sound, typed line, hold, no loop),
   VS (sides slide 0.3 s, VS punch 0.1 s, hold, 133 ms fade = 2.1 s, tap/key skips). transform/opacity only, no rAF loop. */
(function () {
  'use strict';
  var G = window.G;
  var IDS = ['curly', 'tootboss', 'clucky', 'bigbelly', 'twinny', 'snoozy', 'spinny', 'ziggy', 'peekaboo', 'flippy', 'sniffles', 'boingo',
    'zappy', 'swooshy', 'scarfy', 'hulky', 'grampy', 'twinkle', 'blazey', 'meowy', 'cooly', 'buzzy', 'puffy', 'goggly', 'goldboss', 'hero', 'dex'];   // 24 = gold boss (in the grid); 25,26 = the story kids (not in the grid)
  G.addStr({
    en: {
      cp0: 'Party time! Let\'s bounce!', cp1: 'Make way! The Boss is here!', cp2: 'Bawk! Can\'t catch me!', cp3: 'Belly power... BOOM!', cp4: 'Which ball is real? Hehe!', cp5: 'Zzz... I\'ll catch it all...',
      cp6: 'Round and round, here it comes!', cp7: 'Zig! Zag! Try to follow me!', cp8: 'Peekaboo! Where\'s the ball?', cp9: 'Attack, attack! Whoosh!', cp10: 'Ah... ah... ACHOO!', cp11: 'Boing! I\'ll save my friends!',
      cp12: 'Zap! Fast as lightning!', cp13: 'My ball... bends.', cp14: 'Swish. Hit and gone.', cp15: 'Got it! Not letting go!', cp16: 'Ho ho! Catch this wobbly one.', cp17: 'Sparkle cheer, let\'s go!',
      cp18: 'Fired up! Flame shot!', cp19: 'Meow! Jump and snatch!', cp20: 'Stay cool... boomerang.', cp21: 'Buzz buzz! Pass it on!', cp22: 'Puff puff... nice and slow.', cp23: 'You jumped? Gotcha!', cp24: 'I fall down. I get up.', cp25: 'Okay, okay... I\'m in.', lazyArt: '(the artist got lazy)', pkFixed: 'Story: you play the kid. Pick the rest.',
      pickHintP: 'Tap to look · tap again to pick · empty slots are random', tapAgain: 'Tap again to pick {0}!', vsSkip: 'tap to skip'
    },
    ko: {
      cp0: '파티 시작이다~ 뽀글뽀글!', cp1: '비켜라! 대장 나가신다!', cp2: '꼬꼬! 못 잡지롱~', cp3: '배꼽 힘으로... 쾅!', cp4: '진짜 공은 어느 쪽~?', cp5: '음냐... 다 잡을게...',
      cp6: '빙글빙글~ 돌아온다!', cp7: '지그재그! 따라와 봐!', cp8: '까꿍! 공이 안 보이지?', cp9: '공격 또 공격! 휘리릭!', cp10: '에... 에... 에취!', cp11: '통통! 친구 살리러 간다!',
      cp12: '찌릿! 번개처럼 피한다!', cp13: '내 공은... 휘어진다.', cp14: '슉. 치고 빠진다.', cp15: '꽉 잡았다! 안 놔!', cp16: '허허, 흔들흔들 받아 보거라.', cp17: '반짝반짝 응원 출동!',
      cp18: '활활! 불꽃 슛이다!', cp19: '냐옹~ 점프해서 낚아챈다!', cp20: '멋있게... 부메랑.', cp21: '윙윙~ 패스 패스!', cp22: '뭉게뭉게~ 천천히 가자.', cp23: '점프했지? 딱 걸렸어!', cp24: '넘어져도, 다시 일어나.', cp25: '알았어, 알았어... 나도 낄게.', lazyArt: '(그리는 사람이 귀찮았대)', pkFixed: '스토리: 주인공은 너야. 나머지를 골라.',
      pickHintP: '눌러서 보기 · 한 번 더 누르면 넣기 · 빈 자리는 랜덤', tapAgain: '{0}: 한 번 더 누르면 넣어요!', vsSkip: '누르면 넘기기'
    }
  });

  var CSS = [
    '#pick{background:radial-gradient(ellipse at 50% 18%,#2b2d6a 0%,#17132f 62%,#0d0b1e 100%);padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}',
    '#pkWrap{width:min(1180px,100%);height:100%;display:flex;flex-direction:column;gap:8px;min-height:0}',
    '#pkTop{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-right:190px;min-height:40px}',
    '#pkTitle{margin:0;font-size:clamp(22px,3.4vw,36px);font-style:italic;color:#ffd23f}',
    '#pkHead{display:flex;align-items:center;gap:10px;min-width:0}',
    '#pkChars{font-size:12px;color:#c9cbe0;white-space:nowrap}',
    '#pkOpts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}#pkOpts .btn{height:34px;font-size:14px;padding:0 10px;box-shadow:0 3px 0 #1b1b2f}',
    '#pkOpts .btn.st{background:#2b2d52;color:#c9cbe0;border-width:2px;box-shadow:none;cursor:default}',
    '#pkFoe{font-size:14px;color:#9be7ff}',
    '#pkMain{flex:1;display:flex;gap:12px;min-height:0}',
    '#pkPrev{position:relative;flex:0 0 29%;min-width:0;display:flex;flex-direction:column;gap:6px}',
    '#pkArt{position:relative;flex:1;min-height:0;border:3px solid #1b1b2f;border-radius:18px;overflow:hidden;background:linear-gradient(180deg,#24224a,#1a1838);box-shadow:0 5px 0 #1b1b2f}',
    '#pkArt:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(-55deg,rgba(255,255,255,.035) 0 14px,transparent 14px 28px)}',
    '#pkGlow{position:absolute;inset:0}',
    '#pkImgBox{position:absolute;left:0;right:0;top:3%;bottom:0;transform-origin:50% 100%}',
    '#pkImgBox img{width:100%;height:100%;object-fit:contain;object-position:50% 100%;display:block}',
    '#pkImgBox img.br{animation:pkBr 1.2s steps(1) infinite;transform-origin:50% 100%}',
    '@keyframes pkBr{0%{transform:none}50%{transform:translateY(-.8%) scale(1.012)}}',
    '#pkArt.lock img{filter:brightness(0);opacity:.8}#pkArt.lock img.br{animation:none}',
    '#pkLk{position:absolute;left:0;right:0;top:34%;text-align:center;font-size:clamp(34px,6vw,64px);color:#ffd23f;display:none;-webkit-text-stroke:.08em #1b1b2f;paint-order:stroke fill}#pkArt.lock #pkLk{display:block}',
    '#pkBand{position:absolute;left:-8px;right:-8px;bottom:10px;background:#1b1b2f;border-top:3px solid #ffd23f;transform:skewX(-14deg);padding:3px 18px 4px}',
    '#pkName{display:block;transform:skewX(14deg);font-size:clamp(18px,2.5vw,30px);font-style:italic;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#pkSay{position:absolute;left:5%;right:5%;top:10px;z-index:3;background:#fff;color:#1b1b2f;border:3px solid #1b1b2f;border-radius:14px;padding:6px 10px;font-size:clamp(13px,1.5vw,17px);text-align:center;line-height:1.25;box-shadow:0 4px 0 #1b1b2f;visibility:hidden;min-height:1.9em}',
    '#pkSay.on{visibility:visible}',
    '#pkInfo{display:flex;flex-direction:column;gap:4px}',
    '#pkStats .st{display:flex;align-items:center;gap:8px;font-size:13px}#pkStats b{width:4.2em;color:#c9cbe0;text-align:right;flex:none}',
    '.bar{display:flex;gap:3px}.bar i{width:16px;height:10px;border-radius:3px;background:#4a4e69;border:1.5px solid #1b1b2f;display:block}.bar i.on{background:#ffd23f}',
    '#pkStats .goal{font-size:13px;color:#ffd23f;line-height:1.3;text-align:center}#pkStats .pgb{margin:4px auto 0;max-width:220px}',
    '#pkAdBox{margin-top:6px;text-align:center}#pkAd{height:34px;font-size:14px;padding:0 12px;box-shadow:0 3px 0 #1b1b2f;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#pkAd[disabled]{opacity:.7;cursor:default}',
    '#pkAdBox small{display:block;margin-top:3px;font-size:11px;color:#c9cbe0;font-weight:700;word-break:keep-all}#pkAdBox .cap{font-size:13px;color:#9be7ff;font-weight:700}',
    '#pick.port #pkAdBox{margin-top:3px}#pick.port #pkAd{height:30px;font-size:12px;padding:0 8px}#pick.port #pkAdBox small{font-size:10px}',
    '#pkSp{font-size:13px;color:#fff;line-height:1.3;text-align:center}#pkSp b{color:#ff9ecb}#pkSp small{color:#c9cbe0;font-weight:700}#pkSp small.ps{color:#9be7ff}#pkSp small.lazy{display:block;margin-top:1px;color:#8d8fb0;font-size:10.5px;font-weight:700;font-style:italic;opacity:.85}',
    '#pkGridBox{flex:1;min-width:0;display:flex;align-items:center;justify-content:center}',
    '#pkGrid{position:relative;display:grid;gap:6px}',
    '.fc{display:block;background-repeat:no-repeat;background-size:600% 500%}',
    '.pkCell{position:relative;font:inherit;color:#fff;padding:0;background:linear-gradient(180deg,#3d4078,#2b2d52);border:3px solid #1b1b2f;border-radius:12px;box-shadow:0 3px 0 #1b1b2f;cursor:pointer;overflow:hidden}',
    '.pkCell .fc{position:absolute;left:calc(50% - var(--fc)/2);top:var(--ft);width:var(--fc);height:var(--fc)}',
    '.pkCell .nm{position:absolute;left:0;right:0;bottom:2px;font-size:11px;color:#fff;-webkit-text-stroke:3px #1b1b2f;paint-order:stroke fill;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:var(--nm)}',
    '.pkCell .no{position:absolute;right:3px;top:3px;min-width:20px;height:20px;border-radius:10px;background:#ffd23f;color:#1b1b2f;font-size:13px;line-height:17px;border:2px solid #1b1b2f;display:none}',
    '.pkCell .nw{position:absolute;left:3px;top:3px;padding:0 5px;height:18px;border-radius:9px;background:#ff5a4f;color:#fff;font-size:11px;font-weight:900;line-height:16px;border:2px solid #1b1b2f;letter-spacing:.3px;z-index:2}',
    '@keyframes nwpls{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}.pkCell .nw{animation:nwpls 1s ease-in-out infinite}',
    '.pkCell.sel{border-color:#ffd23f;background:linear-gradient(180deg,#5c6cc4,#3f4a8a)}.pkCell.sel .no{display:block}',
    '.pkCell.lock{background:#1d1f3c;cursor:default}.pkCell.lock .fc{filter:brightness(0);opacity:.62}',
    '.pkCell .lk{position:absolute;left:0;right:0;top:calc(var(--ft) + var(--fc)*.3);text-align:center;font-size:calc(var(--fc)*.3);line-height:1;color:#ffd23f;display:none;-webkit-text-stroke:3px #1b1b2f;paint-order:stroke fill}.pkCell.lock .lk{display:block}',
    '.pkCell .pg{position:absolute;left:12%;right:12%;bottom:calc(var(--nmh) + 3px);height:6px;border-radius:3px;background:#0d0b1e;display:none;overflow:hidden}.pkCell .pg i{display:block;height:100%;background:#ffd23f}',
    '.pkCell .fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}',
    '#pkCur{position:absolute;left:0;top:0;border:3px solid #fff;border-radius:13px;box-shadow:0 0 0 3px #ffd23f,0 0 16px 2px rgba(255,210,63,.55);pointer-events:none;z-index:2;transition:transform 60ms linear}',
    '#pkCur:after{content:"1P";position:absolute;left:-6px;top:-13px;background:#ffd23f;color:#1b1b2f;font-size:11px;line-height:14px;padding:0 5px;border-radius:6px;border:2px solid #1b1b2f}',
    '#pick.lite #pkCur{transition:none}',
    '#pkFoeBox{margin-top:8px;flex:0 0 13%;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;background:linear-gradient(180deg,#3d2140,#24152e);border:3px solid #1b1b2f;border-radius:18px;box-shadow:0 5px 0 #1b1b2f;padding:8px 6px;text-align:center}',
    '#pkFoeT{font-size:12px;color:#ff9d5c;font-style:italic}#pkFoeName{font-size:14px;color:#fff;line-height:1.15}',
    '#pkFoeList{flex:1;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;min-height:0}',
    '#pkFoeList .fc,#pkFoeList .q{width:var(--ff);height:var(--ff);border:3px solid #1b1b2f;border-radius:10px;background-color:#2a1d3a;transform:scaleX(-1)}',
    '#pkFoeList .q{transform:none;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.35);font-size:calc(var(--ff)*.45);border-style:dashed;border-color:#5a4060}',
    '#pkBottom{display:flex;gap:10px;align-items:center}',
    '#pkMine{font-size:15px;color:#6ecbff;white-space:nowrap}',
    '#pkSlots{display:flex;gap:6px;flex:1;min-width:0}',
    '#pkSlots .slot{position:relative;width:var(--sl);height:var(--sl);flex:none;border:3px dashed #4a4e7a;border-radius:12px;background:rgba(0,0,0,.2)}',
    '#pkSlots .slot b{position:absolute;left:0;right:0;top:50%;margin-top:-.6em;text-align:center;font-size:calc(var(--sl)*.36);line-height:1.2;color:#4a4e7a;font-style:italic}',
    '#pkSlots .slot .fc{position:absolute;left:5%;top:5%;width:90%;height:90%;visibility:hidden}',
    '#pkSlots .slot.on{border:3px solid #1b1b2f;background:linear-gradient(180deg,#5c6cc4,#3f4a8a);box-shadow:0 3px 0 #1b1b2f}',
    '#pkSlots .slot.on .fc{visibility:visible}#pkSlots .slot.on.wait .fc{visibility:hidden}#pkSlots .slot.fix{cursor:pointer;border-color:#ffd23f;background:linear-gradient(180deg,#c43a35,#7a1f2a)}#pkSlots .slot.fix b{color:#fff}',
    '#pkSlots .slot.on b{top:auto;bottom:-3px;left:3px;right:auto;margin:0;font-size:12px;color:#ffd23f;-webkit-text-stroke:3px #1b1b2f;paint-order:stroke fill;z-index:1}',
    '#pkBtns{display:flex;gap:8px;justify-content:flex-end}#pkBtns .btn{height:46px}',
    '#pkGo{font-size:22px;font-style:italic;min-width:120px}',
    '#pkGo.pulse{animation:glow .5s ease-in-out 3 alternate}',
    '#pkHint{font-size:12px;font-weight:700;color:#c9cbe0;text-align:center;min-height:1.2em}',
    '#pick.port #pkTop{min-height:36px;gap:6px}#pick.port #pkHead{flex:1 1 100%;padding-right:var(--tw)}#pick.port #pkTitle{font-size:min(20px,4.6vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '#pick.port #pkHead{min-height:44px}#pick.port #pkOpts{flex:1 1 100%;min-width:0;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:6px}',
    '#pick.port #pkOpts .btn{width:100%;min-width:0;padding:0 4px;font-size:12px;height:34px;overflow:hidden;white-space:normal;line-height:1.05;word-break:keep-all}',
    '#pkArt #pkHat{position:absolute;right:4px;top:4px;z-index:4;height:28px;min-width:32px;padding:0 4px;font-size:14px;border-width:2px;box-shadow:0 2px 0 #1b1b2f}',
    '#pkSp .cmd{display:block;margin:3px 0 1px;font-size:12.5px;color:#ffd23f;font-weight:800}#pkSp .cmd b{color:#ffd23f}#pkSp .cmd kbd{font:inherit;color:#fff;background:#3a3c5a;border:1px solid #ffd23f;border-radius:6px;padding:0 5px;white-space:nowrap}',
    '#pick.port #pkInfo{overflow:hidden}@media (max-height:700px){#pick.port #pkSp small,#pick.port #pkSp br{display:none}}',
    '#pick.port #pkBand{bottom:4px;padding:2px 12px}#pick.port #pkName{font-size:17px}',
    '#pick.port #pkMain{flex-direction:column;gap:8px}',
    '#pick.port #pkPrev{flex:1 1 auto;flex-direction:row;align-items:stretch;min-height:80px}',
    '#pick.port #pkHint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px}',
    '#pick.port #pkArt{flex:none;aspect-ratio:1;height:100%}',
    '#pick.port #pkInfo{flex:1;min-width:0;justify-content:center}',
    '#pick.port #pkSay{left:auto;right:0;width:calc(100% - var(--aw) - 10px);top:0}',
    '#pick.port #pkGridBox{flex:none}#pick.port #pkFoeBox{display:none}',
    '#pick.port #pkBottom{flex-wrap:wrap;gap:8px}#pick.port #pkMine{display:none}#pick.port #pkSlots{flex:1 1 100%;justify-content:center}',
    '#pick.port #pkBtns{width:100%}#pick.port #pkBtns .btn{flex:1 1 0;min-width:0;padding:0 4px;font-size:15px;overflow:hidden}#pick.port #pkGo{font-size:19px;min-width:0;flex-grow:1.4}',
    '#pick.port #pkStats .st{font-size:12px}#pick.port #pkSp{font-size:12px}#pick.port .bar i{width:13px}',
    '@media (max-width:760px){#pkBtns .btn{padding:0 9px;font-size:15px}#pkGo{min-width:0;font-size:18px}#pick:not(.port) #pkMine{display:none}#pkBtns{gap:6px}}',
    '@media (max-height:460px){#pkHint{display:none}#pkTop{min-height:30px}#pkTitle{font-size:22px}#pkBtns .btn{height:40px}#pkStats .st{font-size:11px}#pkSp{font-size:11px}#pkSp .ps{display:none}.bar i{width:12px;height:8px}#pkWrap{gap:5px}}',
    /* VS */
    '#pkVsScr{position:absolute;inset:0;z-index:5;display:none;overflow:hidden;background:#0d0b1e;cursor:pointer}#pkVsScr.on{display:block}',
    '.vsSide{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}',
    '.vsSide.L{left:0;top:0;bottom:0;width:56%;background:linear-gradient(160deg,#2b6fd0,#152a66 70%);clip-path:polygon(0 0,100% 0,82% 100%,0 100%);padding-right:8%}',
    '.vsSide.R{right:0;top:0;bottom:0;width:56%;background:linear-gradient(200deg,#d0452b,#661a2a 70%);clip-path:polygon(18% 0,100% 0,100% 100%,0 100%);padding-left:8%}',
    '#pick.port .vsSide.L{width:auto;right:0;bottom:auto;height:54%;clip-path:polygon(0 0,100% 0,100% 82%,0 100%);padding:0 0 9% 0}',
    '#pick.port .vsSide.R{width:auto;left:0;top:auto;height:54%;clip-path:polygon(0 18%,100% 0,100% 100%,0 100%);padding:9% 0 0 0}',
    '.vsCap{width:var(--cap);height:var(--cap);position:relative}.vsCap img,.vsCap .fc{width:100%;height:100%;object-fit:contain;display:block}',
    '.vsSide.R .vsCap img,.vsSide.R .vsCap .fc,.vsSide.R .vsRow .fc{transform:scaleX(-1)}',
    '.vsRow{display:flex;gap:6px;justify-content:center}.vsRow .fc{width:var(--vf);height:var(--vf);border:3px solid #1b1b2f;border-radius:10px;background-color:rgba(0,0,0,.25)}',
    '#vsMidBox{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}',
    '#vsMid{font-size:clamp(64px,13vmin,150px);font-style:italic;color:#ffd23f;-webkit-text-stroke:.1em #1b1b2f;paint-order:stroke fill;text-shadow:0 6px 0 #1b1b2f;margin-top:-6vh}',
    '#pick.port #vsMid{margin-top:-2vh}',
    '#vsBand{position:absolute;left:0;right:0;bottom:7%;display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;background:#1b1b2f;border-top:3px solid #ffd23f;border-bottom:3px solid #ffd23f;padding:6px 14px;font-size:clamp(16px,2.6vw,28px);font-style:italic;text-transform:uppercase;white-space:nowrap}',
    '#vsBand span{overflow:hidden;text-overflow:ellipsis}#vsNmL{text-align:right;color:#6ecbff}#vsNmR{color:#ff9d5c}#vsBand b{color:#fff}',
    '#pick.port #vsBand{bottom:4%;font-size:15px;gap:8px;padding:5px 8px}#pick.port #vsMsg{bottom:.6%}',
    '#vsMsg{position:absolute;left:0;right:0;bottom:1.5%;text-align:center;font-size:12px;color:rgba(255,255,255,.55);font-weight:700}',
    '#vsFade{position:absolute;inset:0;background:#0d0b1e;opacity:0;pointer-events:none}'
  ].join('\n');

  var HTML = '<div id="pkWrap">' +
    '<div id="pkTop"><div id="pkHead"><h2 class="ink" id="pkTitle"></h2><span id="pkChars"></span><span id="pkFoe"></span></div>' +
      '<div id="pkOpts"><button class="btn sm blue" id="pkSize" style="display:none"></button><button class="btn sm" id="pkRule"></button><button class="btn sm pink" id="pkVs" style="display:none"></button><button class="btn sm" id="pkHat" style="display:none"></button></div></div>' +
    '<div id="pkMain">' +
      '<div id="pkPrev"><div id="pkArt"><div id="pkGlow"></div><div id="pkImgBox"></div><div id="pkLk"></div><div id="pkBand"><span class="ink" id="pkName"></span></div></div>' +
        '<div id="pkInfo"><div id="pkStats"></div><div id="pkSp"></div></div><div id="pkSay"></div></div>' +
      '<div id="pkGridBox"><div id="pkGrid"><div id="pkCur"></div></div></div>' +
      '<div id="pkFoeBox"><div id="pkFoeT"></div><div id="pkFoeName"></div><div id="pkFoeList"></div></div>' +
    '</div>' +
    '<div id="pkBottom"><span id="pkMine"></span><div id="pkSlots"></div>' +
      '<div id="pkBtns"><button class="btn sm" id="pkBack"></button><button class="btn" id="pkRnd"></button><button class="btn pink" id="pkUndo"></button><button class="btn pri" id="pkGo"></button></div></div>' +
    '<div id="pkHint"></div>' +
  '</div>' +
  '<div id="pkVsScr"><div class="vsSide L" id="vsL"></div><div class="vsSide R" id="vsR"></div><div id="vsMidBox"><div id="vsMid">VS</div></div>' +
    '<div id="vsBand"><span id="vsNmL"></span><b>VS</b><span id="vsNmR"></span></div><div id="vsMsg"></div><div id="vsFade"></div></div>';

  G.pickInit = function (X) {
    var PK = X.PK, VQ = X.VQ || '', DIR = 'art_game/faces/';
    var SHEET = DIR + 'faces_96.png' + VQ;
    function $(id) { return document.getElementById(id); }
    function now() { return performance.now(); }
    var log = G.pickLog = [];
    function fx(k, i) { log.push({ k: k, t: now(), i: i }); if (log.length > 80) log.shift(); }
    var rm = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    function reduced() { return !!(rm && rm.matches); }
    function lite() { return !!G.lite || G.qDown >= 2; }
    function can(el) { return !!(el && el.animate); }
    function anim(el, kf, o) { if (!can(el)) return null; try { return el.animate(kf, o); } catch (e) { return null; } }
    function pos(i) { return 'background-image:url(' + SHEET + ');background-position:' + (i % 6) * 20 + '% ' + ((i / 6) | 0) * 25 + '%'; }
    function face(i, cls) { return '<i class="fc' + (cls ? ' ' + cls : '') + '" style="' + pos(i) + '"></i>'; }

    // build once
    var st = document.createElement('style'); st.id = 'pkCss'; st.textContent = CSS; document.head.appendChild(st);
    var root = $('pick'); root.innerHTML = HTML;
    var grid = $('pkGrid'), cur = $('pkCur');
    G.CHARS.slice(0, G.NROSTER).forEach(function (C, i) {
      var e = document.createElement('button'); e.className = 'pkCell'; e.dataset.i = i;
      e.innerHTML = face(i) + '<span class="lk"></span><span class="pg"><i></i></span><span class="nm"></span><span class="no"></span>' + (G.CHARS[i] && G.CHARS[i].isNew ? '<span class="nw">' + G.t('charsNew') + '</span>' : '') + '<span class="fl"></span>';
      e.addEventListener('pointerdown', function (ev) { lastPtr = ev.pointerType || 'mouse'; });
      e.onclick = function () { X.A.unlock(); cellTap(i); };
      e.onpointerenter = function (ev) { if (ev.pointerType === 'mouse') setCur(i); };
      grid.appendChild(e);
    });
    PK.cells = Array.prototype.slice.call(grid.querySelectorAll('.pkCell'));
    var lastPtr = 'mouse';

    /* ---------- big portraits: loaded only when needed, kept as decoded <img> elements ---------- */
    var IMG = {};
    function img(i) {
      var o = IMG[i]; if (o) return o;
      var im = new Image(); im.alt = ''; im.decoding = 'async'; im.draggable = false;
      o = IMG[i] = { el: im, ok: false, cb: [] };
      im.onload = function () { o.ok = true; var c = o.cb; o.cb = []; c.forEach(function (f) { f(); }); };
      im.onerror = function () { o.ok = true; var c = o.cb; o.cb = []; c.forEach(function (f) { f(); }); };
      im.src = DIR + 'p/' + IDS[i] + '.png' + VQ;
      return o;
    }
    function ready(i, f) { var o = img(i); if (o.ok) f(); else o.cb.push(f); }
    var SW = { want: -1, shown: -1, t: 0, a: null, after: null };
    function portrait(i, instant) {
      if (SW.want === i) return;
      SW.want = i; clearTimeout(SW.t); if (SW.a) { SW.a.cancel(); SW.a = null; }
      var box = $('pkImgBox'); stopClip(); img(i);
      box.style.opacity = '0'; SW.shown = -1; fx('clear', i);   // old portrait gone at once (1 frame)
      function put() {
        if (SW.want !== i) return;
        var o = IMG[i]; o.el.className = lite() || reduced() ? '' : 'br'; box.replaceChildren ? box.replaceChildren(o.el) : (box.innerHTML = '', box.appendChild(o.el));
        $('pkGlow').style.background = 'radial-gradient(circle at 50% 78%,' + G.CHARS[i].skin + '88 0,' + G.CHARS[i].skin + '22 45%,transparent 72%)';
        box.style.opacity = ''; SW.shown = i; fx('in', i);
        if (!instant && !lite() && !reduced()) {
          SW.a = anim(box, [{ transform: 'translateX(-7%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 140, easing: 'cubic-bezier(.2,.8,.3,1)' });
          if (SW.a) SW.a.onfinish = function () { SW.a = null; fx('settled', i); }; else fx('settled', i);
        } else fx('settled', i);
        if (SW.after) { var f = SW.after; SW.after = null; f(); }
      }
      if (instant || lite() || reduced()) ready(i, put);   // XIII-style cut
      else SW.t = setTimeout(function () { ready(i, put); }, 200);   // XV: ~200 ms empty, then slide in
    }

    /* ---------- the intro clip on pick: anticipation 0.3 s -> pop 0.15 s + sound -> typed catchphrase, hold, stop ---------- */
    var CL = { a: null, t: [] };
    function stopClip() { if (CL.a) { CL.a.cancel(); CL.a = null; } CL.t.forEach(clearTimeout); CL.t = []; var s = $('pkSay'); if (s) { s.classList.remove('on'); s.textContent = ''; } }
    function clip(i) {
      if (SW.shown !== i) { SW.after = function () { clip(i); }; return; }
      stopClip(); fx('clip', i);
      if (!reduced()) CL.a = anim($('pkImgBox'), [
        { transform: 'none', offset: 0 },
        { transform: 'translateY(4%) scale(1.04,.92)', offset: 0.5, easing: 'cubic-bezier(.2,1.4,.5,1)' },
        { transform: 'translateY(-5%) scale(1.07)', offset: 0.75 },
        { transform: 'none', offset: 1 }], { duration: 600, easing: 'ease-out' });
      CL.t.push(setTimeout(function () { G.sfx('sp_' + G.CHARS[i].sp); }, 300));
      CL.t.push(setTimeout(function () { say(G.t('cp' + i)); }, 460));
    }
    function say(txt) {
      var s = $('pkSay'), k = 0; s.textContent = ''; s.classList.add('on'); fx('say');
      (function type() { if (!s.classList.contains('on')) return; k++; s.textContent = txt.slice(0, k); if (k < txt.length) CL.t.push(setTimeout(type, 38)); else CL.t.push(setTimeout(function () { s.classList.remove('on'); fx('sayEnd'); }, 1500)); })();
    }

    /* ---------- open / layout ---------- */
    function open(mode, n, lvl) {
      X.A.unlock(); X.Sdk.gameplayStop(); X.setState('pick'); X.show('pick'); $('btnPause').style.display = 'none'; $('touch').classList.remove('on');
      vsStop(); vfReset(); $('pkVsScr').classList.remove('on');
      PK.mode = mode; PK.n = n; PK.lvl = lvl; PK.ready = false; PK.foeReady = false; PK.foePicks = null; PK.cd = 0; PK.teams = null;
      if (mode !== 'guest') PK.easy = X.save().easy;
      PK.fix = X.fixed ? X.fixed(mode).slice(0, n) : [];   // story: the kid (+ Dex from chapter 2) take the first slots
      PK.picks = X.cleanPicks(X.save().picks, cap()); if (mode === 'single' || mode === 'free') PK.picks = PK.picks.filter(X.unlocked);
      PK.cur = PK.fix.length ? PK.fix[0] : PK.picks.length ? PK.picks[PK.picks.length - 1] : 0;
      rollFoe(); PEND = {}; SW.want = -1;
      layout(); refresh(); layout(); portrait(PK.cur, true); X.log('pick:' + mode);
      if (PK.foe && PK.foe.length) img(PK.foe[0]);   // the two captains for the VS screen
      if (PK.fix.length) img(PK.fix[0]); else if (PK.picks.length) img(PK.picks[0]);
    }
    function cap() { return PK.n - (PK.fix ? PK.fix.length : 0); }   // free slots for picks
    function rollFoe() {
      var S = X.story();
      PK.foe = PK.mode === 'single' || PK.mode === 'free' ? G.randomChars(PK.n, PK.lvl === G.LADDER - 1 && S && X.STORY ? [S.BOSS.ch] : null) : null;
    }
    function port() { return window.innerHeight > window.innerWidth * 1.05; }
    function layout() {
      var P = port(); PK.cols = P ? 4 : 6; var rows = Math.ceil(G.NROSTER / PK.cols), gap = 6;
      root.classList.toggle('port', P); root.classList.toggle('lite', lite());
      var tp = $('tops'), tw = (tp && tp.offsetWidth ? tp.offsetWidth + 14 : 70); root.style.setProperty('--tw', tw + 'px'); $('pkTop').style.paddingRight = P ? '0px' : tw + 'px';   // keep clear of the ⚙ button
      var hb = $('pkHat'), hp = P ? $('pkArt') : $('pkOpts'); if (hb.parentNode !== hp) hp.appendChild(hb);
      var sl = $('pkSlots'); if (sl.children.length !== PK.n) { sl.innerHTML = ''; for (var i = 0; i < PK.n; i++) { var c = document.createElement('div'); c.className = 'slot'; c.innerHTML = '<b>' + (i + 1) + '</b><i class="fc"></i>'; c.onclick = slotTap.bind(null, i); sl.appendChild(c); } }
      // slot size first (bottom bar), then the grid gets what is left
      var W = $('pkWrap').clientWidth, slW = P ? W : W - $('pkBtns').offsetWidth - $('pkMine').offsetWidth - 30;
      var s = Math.max(28, Math.min(P ? 58 : 60, Math.floor((slW - (PK.n - 1) * 6) / PK.n))); if (window.innerHeight < 460) s = Math.min(s, 46);
      root.style.setProperty('--sl', s + 'px');
      var main = $('pkMain'), mw = main.clientWidth, mh = main.clientHeight, cw, ch;
      if (P) {
        cw = Math.floor((mw - gap * (PK.cols - 1)) / PK.cols);
        ch = Math.floor((mh - 8 - 190 - gap * (rows - 1)) / rows); ch = Math.max(56, Math.min(ch, cw, 76));
        if ((mh - 8 - rows * ch - gap * (rows - 1)) < 96) ch = Math.max(56, Math.floor((mh - 8 - 96 - gap * (rows - 1)) / rows));
        if ((mh - 8 - rows * ch - gap * (rows - 1)) < 80) ch = Math.max(40, Math.floor((mh - 8 - 80 - gap * (rows - 1)) / rows));   // short phones (360x640): smaller faces, never under the buttons
        var ah = mh - 8 - rows * ch - gap * (rows - 1); root.style.setProperty('--aw', Math.max(0, ah) + 'px');
      } else {
        var gw = mw - main.children[0].offsetWidth - $('pkFoeBox').offsetWidth - 24;
        ch = Math.floor((mh - gap * (rows - 1)) / rows); cw = Math.floor((gw - gap * (PK.cols - 1)) / PK.cols);
        ch = Math.min(ch, Math.round(cw * 1.1)); cw = Math.min(cw, Math.round(ch * 1.25));
        var fb = $('pkFoeBox'), ff = Math.floor(Math.min(fb.clientWidth - 24, (fb.clientHeight - 74 - 6 * (PK.n - 1)) / PK.n, 76)); root.style.setProperty('--ff', Math.max(24, ff) + 'px');
      }
      grid.style.gridTemplateColumns = 'repeat(' + PK.cols + ',' + cw + 'px)'; grid.style.gridAutoRows = ch + 'px';
      var names = !P && ch >= 84, nmh = names ? 15 : 0, fc = Math.floor(Math.min(cw - 10, ch - 8 - nmh));
      grid.style.setProperty('--fc', fc + 'px'); grid.style.setProperty('--ft', Math.max(2, Math.floor((ch - 6 - nmh - fc) / 2)) + 'px');
      grid.style.setProperty('--nm', names ? 'block' : 'none'); grid.style.setProperty('--nmh', nmh + 'px');
      cur.style.width = (cw + 6) + 'px'; cur.style.height = (ch + 6) + 'px';
      moveCur(true);
    }
    function slotTap(k) { var f = PK.fix && PK.fix[k]; if (f == null || PK.ready || PK.cd) return; X.A.unlock(); G.sfx('click'); setCur(f); hint(G.t('pkFixed')); }
    function moveCur(snap) {
      var e = PK.cells[PK.cur]; cur.style.visibility = e ? '' : 'hidden'; if (!e) return;
      if (snap) { cur.style.transition = 'none'; }
      cur.style.transform = 'translate(' + (e.offsetLeft - 3) + 'px,' + (e.offsetTop - 3) + 'px)';
      if (snap) { void cur.offsetWidth; cur.style.transition = ''; }
    }

    /* ---------- state -> DOM (event driven, never per frame) ---------- */
    function locked(i) { return i < G.NROSTER && (PK.mode === 'single' || PK.mode === 'free') && !X.unlocked(i); }
    function bar(v) { var s = ''; for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= v ? 'on' : '') + '"></i>'; return s; }
    var PEND = {};
    function preview() {
      var i = PK.cur, C = G.CHARS[i], lk = locked(i), gl = lk ? X.goalText(i) : null, esc = X.esc;
      $('pkName').textContent = lk && gl && gl.hidden ? G.t('u_secret') : G.t('ch' + i);
      $('pkArt').classList.toggle('lock', lk); $('pkLk').textContent = lk && gl && gl.hidden ? '?' : '🔒';
      if (lk) {
        $('pkStats').innerHTML = '<div class="goal">🔒 ' + esc(gl ? gl.txt : '?') + '</div>' + (gl && gl.bar ? '<div class="pgb"><i style="width:' + (100 * gl.s.frac).toFixed(0) + '%"></i></div>' : '') + adBox(i);
        $('pkSp').innerHTML = gl && gl.hidden ? '' : '<small>▶ ' + esc(G.t('ps' + i)) + '</small>';
      } else {
        $('pkStats').innerHTML = [['stPow', C.st[0]], ['stSpd', C.st[1]], ['stCat', C.st[2]]].map(function (r) { return '<div class="st"><b>' + esc(G.t(r[0])) + '</b><span class="bar">' + bar(r[1]) + '</span></div>'; }).join('');
        $('pkSp').innerHTML = '<b>' + esc(G.t('special')) + '</b> ' + esc(G.t('sp_' + C.sp)) + '<br><small>' + esc(G.t('ss_' + C.sp)) + '</small>' + (C.cmd ? '<span class="cmd"><b>' + esc(G.t('cmd')) + '</b> <kbd>' + esc(G.cmdArrows(C.cmd, 0)) + ' + ' + esc(G.t('cmdThr')) + '</kbd> ' + esc(G.t(C.cmd)) + '</span>' : '') + '<small class="ps">▶ ' + esc(G.t('ps' + i)) + '</small>' + (i < G.NROSTER ? '<small class="lazy">' + esc(G.t('lazyArt')) + '</small>' : '');
      }
    }
    /* ---------- rewarded-ad unlock: a second way in for a locked, visible player (not secret / chained ??? players, never the story kids).
       Only where the CrazyGames SDK can show ads; on our site / local there is no button at all. One click = one ad; reward only when it finished. */
    var MT = G.meta, AD = { busy: false };
    function adShown(i) { return locked(i) && X.Sdk.rewardedOk && X.Sdk.rewardedOk() && MT.adCan(X.save(), i); }
    function adBox(i) {
      if (!adShown(i)) return '';
      var sv = X.save(), left = MT.adLeft(sv, X.now()), n = MT.adCount(sv, i), esc = X.esc;
      if (left <= 0 && !AD.busy) return '<div id="pkAdBox"><div class="cap">' + esc(G.t('adCap')) + '</div></div>';
      return '<div id="pkAdBox"><button class="btn sm green" id="pkAd"' + (AD.busy ? ' disabled' : '') + '>' + esc(AD.busy ? G.t('adWait') : G.t('adBtn', n, MT.AD_NEED)) + '</button>' +
        '<small>' + esc(G.t('adSub', left, MT.AD_NEED)) + '</small></div>';
    }
    function adGo() {
      var i = PK.cur, sv = X.save();
      if (AD.busy || PK.ready || PK.cd || !adShown(i)) return;
      if (MT.adLeft(sv, X.now()) <= 0) { hint(G.t('adCap')); preview(); return; }
      AD.busy = true; stopClip(); X.log('adReq:' + i); preview();
      X.Sdk.rewarded(function (r) {
        AD.busy = false; X.log('adRes:' + i + ':' + r);
        if (r === 'done') {
          var ev = MT.adWatched(X.save(), i, X.now());
          if (ev) {
            X.commit();
            if (ev.length) { if (X.getState() === 'pick') refresh(); X.reveal(ev); return; }   // third ad: the usual one-at-a-time TA-DA! pop-up
            hint(G.t('adGot', MT.adCount(X.save(), i), MT.AD_NEED)); G.sfx('click');
          }
        } else if (r === 'fail') hint(G.t('adNone'));   // no fill / error: friendly line, nothing given
        if (X.getState() === 'pick') refresh();
      });
    }
    $('pkStats').addEventListener('click', function (e) { if (e.target && e.target.id === 'pkAd') { e.stopPropagation(); X.A.unlock(); adGo(); } });

    function slots() {
      var sl = $('pkSlots').children;
      var nf = PK.fix ? PK.fix.length : 0;
      for (var k = 0; k < sl.length; k++) {
        var e = sl[k], c = k < nf ? PK.fix[k] : PK.picks[k - nf], on = c != null;
        e.classList.toggle('on', on); e.classList.toggle('fix', k < nf); e.classList.toggle('wait', on && k >= nf && PEND[k] === c);
        if (on && e.dataset.c !== String(c)) { e.dataset.c = c; e.lastChild.setAttribute('style', pos(c)); }
        if (!on) e.dataset.c = '';
      }
    }
    function foePanel() {
      var sg = PK.mode === 'single' || PK.mode === 'free', tm = sg ? G.teamOf(PK.lvl) : null, list = sg ? PK.foe : PK.mode === 'host' && PK.foeReady ? PK.foePicks : null, h = '';
      $('pkFoeT').textContent = G.t('foeTeam');
      $('pkFoeName').textContent = sg ? X.teamName(PK.lvl) : PK.foeReady ? G.t('foeReady') : G.t('foePick');
      for (var k = 0; k < PK.n; k++) h += list && list[k] != null ? face(list[k]) : '<span class="q">?</span>';
      var fl = $('pkFoeList'); if (fl.dataset.h !== h) { fl.innerHTML = h; fl.dataset.h = h; }
      $('pkFoeBox').style.borderColor = tm && tm.uni ? '#1b1b2f' : '';
    }
    function refresh() {
      if (X.getState() !== 'pick') return;
      var i, sg = PK.mode === 'single' || PK.mode === 'free';
      $('pkTitle').textContent = PK.mode === 'free' ? G.t('freeBtn') : G.t('pickTitle');
      // options live here now (not on the main menu): players, rules, rival, hat. Online: the host set them before the room, shown only.
      var fr = PK.mode === 'free', sv = X.save(), lvMax = Math.min(sv.beaten, G.LADDER - 1), vsOn = fr || (PK.mode === 'single' && lvMax > 0);
      $('pkSize').style.display = sg ? '' : 'none'; $('pkVs').style.display = vsOn ? '' : 'none';
      $('pkSize').textContent = G.t('vs', PK.n, PK.n) + ' ▸'; $('pkSize').title = G.t('teamSize');
      if (vsOn) $('pkVs').textContent = 'VS ' + X.teamName(PK.lvl) + ' ▸';
      var rb = $('pkRule'); rb.textContent = X.ruleShort(PK.easy) + (sg ? ' ▸' : ''); rb.classList.toggle('st', !sg); rb.classList.toggle('green', sg && !!PK.easy); rb.title = PK.easy ? G.t('ruleEasy') : G.t('ruleAm');
      var hOn = sg && sv.hats && sv.hats.length > 0; $('pkHat').style.display = hOn ? '' : 'none';
      if (hOn) { var hl = G.t('hatShort', X.hatName(sv.hat)); $('pkHat').textContent = port() ? '🎩' : hl + ' (' + sv.hats.length + '/' + G.meta.HATS.length + ') ▸'; $('pkHat').title = hl; }
      $('pkChars').textContent = sg ? G.t('charsN', sv.unl.length, G.NROSTER) + (sv.sto && sv.sto.badge ? ' \uD83C\uDFC5' : '') : '';
      preview();
      for (i = 0; i < PK.cells.length; i++) {
        var e = PK.cells[i], k = PK.picks.indexOf(i), L = locked(i), gi = L ? X.goalText(i) : null;
        e.classList.toggle('cur', i === PK.cur); e.classList.toggle('lock', L); e.classList.toggle('sel', k >= 0); e.querySelector('.no').textContent = k >= 0 ? k + 1 + PK.fix.length : '';
        e.querySelector('.nm').textContent = gi && gi.hidden ? G.t('u_secret') : G.t('ch' + i);
        var hid = L && gi && gi.hidden; e.querySelector('.lk').textContent = hid ? '?' : '🔒';
        var pg = e.querySelector('.pg'); pg.style.display = gi && gi.bar ? 'block' : 'none'; if (gi && gi.bar) pg.firstChild.style.width = (100 * gi.s.frac).toFixed(0) + '%';
        e.title = gi ? gi.txt : '';
        e.setAttribute('aria-label', (gi && gi.hidden ? G.t('u_secret') : G.t('ch' + i)) + (L ? ' 🔒' : ''));
      }
      slots(); foePanel();
      $('pkMine').textContent = G.t('pickMine', PK.picks.length + PK.fix.length, PK.n);
      $('pkFoe').textContent = sg ? '' : PK.ready && !PK.foeReady ? G.t('waitFoe') : PK.foeReady ? G.t('foeReady') : G.t('foePick');
      $('pkRnd').textContent = G.t('pickRandom'); $('pkUndo').textContent = G.t('pickUndo'); $('pkGo').textContent = G.t('pickReady'); $('pkBack').textContent = G.t('pickBack');
      $('pkGo').disabled = PK.ready; $('pkRnd').disabled = PK.ready; $('pkUndo').disabled = PK.ready || !PK.picks.length;
      var full = PK.picks.length >= cap() && !PK.ready, go = $('pkGo'); if (full !== go.classList.contains('pulse')) go.classList.toggle('pulse', full);
      if (!(PK.hintT && now() - PK.hintT < 2500)) $('pkHint').textContent = X.touchOn() ? G.t(port() ? 'pickHintP' : 'pickHint') : G.t('pickHint') + '  ·  ' + G.t('pickHintK');
      moveCur(false);
    }
    function setCur(i) {
      if (i === PK.cur || PK.cd) return;
      PK.cur = i; preview(); for (var k = 0; k < PK.cells.length; k++) PK.cells[k].classList.toggle('cur', k === i);
      moveCur(false); portrait(i, false); fx('cur', i);
    }
    // portrait phone (no hover): first tap = look, the same tap again = pick
    function cellTap(i) {
      if (PK.ready || PK.cd) return;
      if (port() && lastPtr !== 'mouse' && i !== PK.cur) { setCur(i); G.sfx('click'); hint(G.t('tapAgain', locked(i) && (X.goalText(i) || {}).hidden ? G.t('u_secret') : G.t('ch' + i))); return; }
      setCur(i); togglePick(i);
    }
    function hint(t) { $('pkHint').textContent = t; PK.hintT = now(); }

    /* ---------- pick / remove ---------- */
    function togglePick(i) {
      if (PK.ready || i >= G.NROSTER) return;
      if (locked(i)) { G.sfx('bounce'); var gl = X.goalText(i); hint(G.t('lockHow', gl ? gl.txt : '?')); shake(PK.cells[i], 4); refresh(); return; }
      var k = PK.picks.indexOf(i);
      if (k >= 0) { PK.picks.splice(k, 1); G.sfx('poof'); PEND = {}; stopClip(); }
      else if (PK.picks.length < cap()) { PK.picks.push(i); confirm(i, PK.picks.length - 1 + PK.fix.length); PK.hintT = 0; }
      else { G.sfx('bounce'); shake($('pkSlots'), 4); }
      X.save().picks = PK.picks.slice(); X.commit(); refresh();
    }
    function shake(el, px) { if (reduced()) return; anim(el, [{ transform: 'none' }, { transform: 'translateX(' + px + 'px)' }, { transform: 'translateX(' + (-px) + 'px)' }, { transform: 'translateX(' + (px * 0.6) + 'px)' }, { transform: 'none' }], { duration: 120 }); }
    // pick confirm (~0.4 s): white flash 50 ms + 6 px shake 120 ms + thud -> the face flies to its slot (250 ms) -> slot pop
    function confirm(i, k) {
      var cell = PK.cells[i]; G.sfx('thud'); fx('pick', i);
      if (!reduced()) { anim(cell.querySelector('.fl'), [{ opacity: 1 }, { opacity: 1, offset: 0.99 }, { opacity: 0 }], { duration: 50 }); shake(cell, 6); }
      clip(i);
      var slot = $('pkSlots').children[k]; if (!slot || reduced() || !can(cell)) { fx('land', i); return; }
      PEND[k] = i;
      setTimeout(function () {
        var a = cell.querySelector('.fc').getBoundingClientRect(), b = slot.getBoundingClientRect(), f = document.createElement('i');
        var bs = b.width * 0.9, bx = b.left + b.width * 0.05, by = b.top + b.height * 0.05;
        f.className = 'fc'; f.setAttribute('style', pos(i) + ';position:fixed;left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;z-index:30;pointer-events:none;transform-origin:0 0');
        document.body.appendChild(f);
        var dx = bx - a.left, dy = by - a.top, sc = bs / Math.max(1, a.width);
        var fl = anim(f, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - 40) + 'px) scale(' + (1 + sc) / 2 + ')', offset: 0.5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')' }], { duration: 250, easing: 'cubic-bezier(.45,0,.7,1)', fill: 'forwards' });
        function land() {
          if (f.parentNode) f.parentNode.removeChild(f);
          if (PEND[k] === i) delete PEND[k];
          slots(); fx('land', i);
          if (PK.picks[k] === i) anim(slot, [{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 100, easing: 'ease-out' });
        }
        if (fl) fl.onfinish = land; else land();
      }, 60);
    }
    function undo() { if (PK.ready || !PK.picks.length) return; PK.picks.pop(); PEND = {}; stopClip(); X.save().picks = PK.picks.slice(); X.commit(); G.sfx('poof'); refresh(); }
    function random() {
      if (PK.ready) return; stopClip();
      PK.picks = PK.mode === 'single' ? X.myTeam(cap(), []).filter(X.unlocked) : G.randomChars(PK.n); PEND = {}; if (PK.picks.length) img(PK.picks[0]);
      X.save().picks = PK.picks.slice(); X.commit(); G.sfx('thud'); refresh();
      if (!reduced()) Array.prototype.forEach.call($('pkSlots').children, function (s, k) { if (k < PK.picks.length) anim(s, [{ transform: 'scale(1.18)' }, { transform: 'none' }], { duration: 100, delay: k * 40, easing: 'ease-out', fill: 'backwards' }); });
    }
    function readyGo() {
      if (PK.ready) return;
      PK.ready = true; G.sfx('ready'); stopClip();
      var sg = PK.mode === 'single' || PK.mode === 'free';
      var mine = sg ? PK.fix.concat(X.myTeam(cap(), PK.picks)) : G.randomChars(PK.n, PK.picks); PK.picks = mine.slice(PK.fix.length);
      if (PK.mode === 'free') { vs(mine, PK.foe); return; }
      if (PK.mode === 'single') { if (X.storyNeed(PK.lvl)) { X.play(PK.lvl, [mine, PK.foe]); return; } vs(mine, PK.foe); return; }
      X.send({ t: 'pk', c: mine, r: 1 });
      refresh(); hostMaybeGo();
    }
    function hostMaybeGo() {
      if (PK.mode !== 'host' || !PK.ready || !PK.foeReady || PK.cd) return;
      var a = PK.picks, b = G.randomChars(PK.n, PK.foePicks);
      X.send({ t: 'go', a: a, b: b }); vs(a, b);
    }

    /* ---------- VS screen: 2.1 s (slide 0.3 s, VS punch 0.1 s, hold, 133 ms fade), tap/key skips (not online) ---------- */
    var VT = [], vsSkippable = false, VF = null;
    function vsStop() { VT.forEach(clearTimeout); VT = []; }
    function vfReset() { if (VF) { VF.cancel(); VF = null; } $('vsFade').style.opacity = '0'; }
    function vsSide(el, list, mine) {
      var P = port(), w = root.clientWidth, h = root.clientHeight, n = list.length, cap, vf;
      if (P) { cap = Math.min(w * 0.42, h * 0.27); vf = Math.min((w * 0.92 - 6 * (n - 2)) / Math.max(1, n - 1), h * 0.09, 72); }
      else { cap = Math.min(w * 0.3, h * 0.42); vf = Math.min((w * 0.4 - 6 * (n - 2)) / Math.max(1, n - 1), h * 0.15, 96); }
      el.style.setProperty('--cap', Math.round(cap) + 'px'); el.style.setProperty('--vf', Math.round(vf) + 'px');
      var c = list[0], h2 = '<div class="vsCap">' + face(c) + '</div><div class="vsRow">';
      for (var k = 1; k < n; k++) h2 += face(list[k]); el.innerHTML = h2 + '</div>';
      var cap = el.firstChild; ready(c, function () { if (!cap.isConnected || !IMG[c].el.naturalWidth) return; var im = new Image(); im.alt = ''; im.src = IMG[c].el.src; cap.replaceChildren ? cap.replaceChildren(im) : (cap.innerHTML = '', cap.appendChild(im)); });
    }
    function vs(mine, foe) {
      PK.teams = [mine, foe]; PK.cd = now(); vsStop(); stopClip(); X.log('countdown'); fx('vs');
      var sg = PK.mode === 'single' || PK.mode === 'free';
      vsSkippable = sg;
      $('vsNmL').textContent = sg ? G.t('my') : PK.mode === 'host' ? G.t('pHost') : G.t('pGuest');
      $('vsNmR').textContent = sg ? X.teamName(PK.lvl) : PK.mode === 'host' ? G.t('pGuest') : G.t('pHost');
      vsSide($('vsL'), mine, true); vsSide($('vsR'), foe, false);
      $('vsMsg').textContent = sg ? G.t('vsSkip') : ''; vfReset();
      var scr = $('pkVsScr'), P = port(); scr.classList.add('on'); G.sfx('beep');
      var mid = $('vsMid'), band = $('vsBand'); mid.style.opacity = '0'; band.style.opacity = '0';
      if (!reduced()) {
        anim($('vsL'), [{ transform: P ? 'translateY(-60%)' : 'translateX(-60%)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)' });
        anim($('vsR'), [{ transform: P ? 'translateY(60%)' : 'translateX(60%)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1)' });
      }
      VT.push(setTimeout(function () {   // VS punch
        mid.style.opacity = ''; band.style.opacity = ''; G.sfx('thud'); fx('vsPunch');
        if (!reduced()) anim(mid, [{ transform: 'scale(1.4)' }, { transform: 'none' }], { duration: 100, easing: 'ease-out' });
      }, 300));
      VT.push(setTimeout(vsOut, 1967));
    }
    function vsOut() {
      vsStop(); fx('vsOut');
      VF = anim($('vsFade'), [{ opacity: 0 }, { opacity: 1 }], { duration: 133, fill: 'forwards' });
      VT.push(setTimeout(vsDone, 133));
    }
    function vsSkip() { if (PK.cd > 0 && vsSkippable && VT.length) { fx('vsSkip'); vsOut(); } }
    function vsDone() {
      vsStop(); if (X.getState() !== 'pick' || !(PK.cd > 0)) return;
      var T2 = PK.teams; PK.cd = 0; fx('vsDone');
      if (PK.mode === 'single') X.start(PK.lvl, T2);
      else if (PK.mode === 'free') X.start(PK.lvl, T2, { free: 1, n: PK.n });
      else if (PK.mode === 'host') X.startVersus(T2);
      else if (!X.guestGo()) { PK.cd = -1; vfReset(); $('vsMsg').textContent = G.t('connecting'); }   // guest: wait for the host's first snapshot
      if (X.getState() !== 'pick') $('pkVsScr').classList.remove('on');
    }
    $('pkVsScr').addEventListener('pointerdown', function (e) { e.preventDefault(); vsSkip(); });

    /* ---------- keys + buttons ---------- */
    function key(e) {
      var c = e.code, n = G.NROSTER, cols = PK.cols;
      if (c === 'Escape') { back(); return; }
      if (PK.cd) { if (!e.repeat) { e.preventDefault(); vsSkip(); } return; }
      var mv = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1, ArrowUp: -cols, KeyW: -cols, ArrowDown: cols, KeyS: cols }[c];
      if (mv) { e.preventDefault(); setCur(PK.cur >= n ? 0 : (PK.cur + mv + n) % n); G.sfx('click'); return; }
      if (e.repeat) return;
      if (c === 'Enter' || c === 'KeyJ' || c === 'NumpadEnter') { e.preventDefault(); if (PK.picks.length >= cap() && PK.picks.indexOf(PK.cur) < 0 && !locked(PK.cur)) readyGo(); else togglePick(PK.cur); }
      else if (c === 'KeyK' || c === 'Backspace') { e.preventDefault(); undo(); }
      else if (c === 'Space') { e.preventDefault(); readyGo(); }
    }
    function back() { vsStop(); stopClip(); $('pkVsScr').classList.remove('on'); PK.cd = 0; if (PK.mode === 'single' || PK.mode === 'free') X.toMenu(); else X.netChoose(); }
    $('pkGo').onclick = function () { X.A.unlock(); readyGo(); };
    $('pkRnd').onclick = function () { X.A.unlock(); random(); };
    $('pkUndo').onclick = function () { X.A.unlock(); undo(); };
    $('pkBack').onclick = function () { X.A.unlock(); G.sfx('click'); back(); };
    // free play: 1-7 a side, any rival. Story: 3/5/7 (the saved team size), the next team or any team already beaten.
    $('pkSize').onclick = function () {
      X.A.unlock(); G.sfx('click'); if (PK.ready || PK.cd) return; var sv = X.save();
      if (PK.mode === 'free') { PK.n = PK.n % 7 + 1; sv.free.n = PK.n; } else { var l = G.TEAM_SIZES; PK.n = sv.n = l[(l.indexOf(sv.n) + 1) % l.length]; }
      PK.fix = X.fixed ? X.fixed(PK.mode).slice(0, PK.n) : []; PK.picks = PK.picks.slice(0, cap()); X.commit(); rollFoe(); layout(); refresh();
    };
    $('pkVs').onclick = function () {
      X.A.unlock(); G.sfx('click'); if (PK.ready || PK.cd) return; var sv = X.save();
      if (PK.mode === 'free') { PK.lvl = (PK.lvl + 1) % G.LADDER; sv.free.lvl = PK.lvl; } else PK.lvl = (PK.lvl + 1) % (Math.min(sv.beaten, G.LADDER - 1) + 1);
      X.commit(); rollFoe(); refresh();
    };
    $('pkRule').onclick = function () { if (PK.mode !== 'single' && PK.mode !== 'free') return; X.A.unlock(); G.sfx('click'); if (PK.ready || PK.cd) return; var sv = X.save(); sv.easy = !sv.easy; PK.easy = sv.easy; X.commit(); refresh(); };
    $('pkHat').onclick = function () {
      X.A.unlock(); G.sfx('click'); if (PK.ready || PK.cd) return; var sv = X.save();
      var l = [''].concat(G.meta.HATS.map(function (h) { return h.id; }).filter(function (h) { return sv.hats.indexOf(h) >= 0; })); sv.hat = l[(l.indexOf(sv.hat) + 1) % l.length]; X.commit(); refresh(); if (port()) hint(G.t('hatShort', X.hatName(sv.hat)));
    };

    // warm the sheet while idle (44 KB, one request for all 24 icons)
    (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(function () { var s = new Image(); s.src = SHEET; });

    return { open: open, refresh: refresh, layout: function () { if (X.getState() === 'pick') layout(); }, key: key, hostMaybeGo: hostMaybeGo, vs: vs, back: back };
  };
})();
