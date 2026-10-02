/* 말해요 · 긴급 (2026-10-02 형: 「긴급은 아무거나 계속 누르고 있으면 알람 울리게」)
   어디든(말 칸·띠·글쓰기 판·빈 곳·탭) 손가락을 움직이지 않고 2초 누르고 있으면 → 빨간 화면 + 사이렌 + 「도와주세요」.
   - 0.5초 지나면 손가락 자리에 빨간 고리가 차오름 (짧은 톡은 아무것도 안 보임)
   - 15px 넘게 움직이면 취소 (글씨 쓰기·조이스틱 밀기는 안 울림)
   - ⚙(3초 = 설정)과 설정 창 안에서는 안 울림
   - 울리게 한 그 손가락은 밑에 있는 칸을 누른 것으로 치지 않음 (말 안 함)
   - 「멈춤」 한 번 톡 = 끔 */
(function(){
  "use strict";
  const HOLD = 2000, SHOW = 500, SLOP = 15, SAY_EVERY = 4500;
  const css = `
  body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  input,textarea{-webkit-user-select:text;user-select:text}
  #sosRing{position:fixed;z-index:2000;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;pointer-events:none;display:none;
    background:conic-gradient(#ff1744 var(--p,0deg),#ff174433 0);-webkit-mask:radial-gradient(circle,transparent 44px,#000 46px);mask:radial-gradient(circle,transparent 44px,#000 46px)}
  #sosRing.on{display:block}
  #sos{position:fixed;inset:0;z-index:3000;background:#d50000;color:#fff;display:none;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:24px;text-align:center;touch-action:none;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #sos.on{display:flex;animation:sosBlink 1s steps(1) infinite}
  @keyframes sosBlink{50%{background:#7f0000}}
  #sos h1{margin:0;font-size:clamp(48px,15vw,88px);font-weight:900;line-height:1.1;word-break:keep-all}
  #sos button{width:min(86vw,420px);height:min(30vh,200px);border:6px solid #fff;border-radius:28px;background:#fff;color:#b71c1c;font-size:clamp(48px,14vw,80px);font-weight:900}
  #sos button:active{background:#ffcdd2}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const ring = document.createElement("div"); ring.id = "sosRing";
  const ov = document.createElement("div"); ov.id = "sos"; ov.setAttribute("role","alertdialog"); ov.setAttribute("aria-label","긴급");
  ov.innerHTML = '<h1>🚨 도와주세요</h1><button type="button" id="sosStop">멈춤</button>';
  function mount(){ document.body.appendChild(ring); document.body.appendChild(ov); }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  // ── 소리: AudioContext 는 손이 닿을 때 만들고 깨워 둔다 (안드로이드는 손짓 없이 소리 못 냄) ──
  let ac = null, osc = null, gain = null, toneT = null, sayT = null, muteT = null, lock = null;
  function wake(){
    try{
      if(!ac){ const A = window.AudioContext || window.webkitAudioContext; if(A) ac = new A(); }
      if(ac && ac.state !== "running") ac.resume().catch(()=>{});
    }catch(e){}
  }
  function sirenOn(){
    if(!ac) return;
    try{
      gain = ac.createGain(); gain.gain.value = 1;
      const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination); gain.connect(comp);
      osc = ac.createOscillator(); osc.type = "square"; osc.frequency.value = 960; osc.connect(gain); osc.start();
      let hi = true; toneT = setInterval(()=>{ hi = !hi; try{ osc.frequency.setValueAtTime(hi ? 960 : 770, ac.currentTime); }catch(e){} }, 450);
    }catch(e){}
  }
  function sirenOff(){
    clearInterval(toneT); toneT = null;
    try{ osc && osc.stop(); }catch(e){} try{ osc && osc.disconnect(); gain && gain.disconnect(); }catch(e){}
    osc = null; gain = null;
  }
  // 사이렌 잠깐 줄이고 「도와주세요」 → 다시 사이렌
  function sayHelp(){
    try{ if(gain) gain.gain.setValueAtTime(0.08, ac.currentTime); }catch(e){}
    try{ if(typeof window.malhaeSpeak === "function") window.malhaeSpeak("도와주세요");
         else { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance("도와주세요"); u.lang = "ko-KR"; speechSynthesis.speak(u); } }catch(e){}
    clearTimeout(muteT); muteT = setTimeout(()=>{ try{ if(gain) gain.gain.setValueAtTime(1, ac.currentTime); }catch(e){} }, 1800);
  }
  const buzz = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

  let alarm = false, eatUntil = 0;
  function start(){
    if(alarm) return; alarm = true; stopDown = false;
    ov.classList.add("on");
    wake(); sirenOn(); sayHelp();
    sayT = setInterval(()=>{ sayHelp(); buzz([600,300,600,300,600]); if(ac && ac.state !== "running") wake(); }, SAY_EVERY);
    buzz([600,300,600,300,600]);
    try{ navigator.wakeLock && navigator.wakeLock.request("screen").then(l=>{ lock = l; }).catch(()=>{}); }catch(e){}
  }
  function stop(){
    if(!alarm) return; alarm = false; stopDown = false;
    ov.classList.remove("on");
    if(h && h.fired) drop(); eatUntil = 0;
    clearInterval(sayT); clearTimeout(muteT); sirenOff(); buzz(0);
    try{ speechSynthesis.cancel(); }catch(e){}
    try{ lock && lock.release(); }catch(e){} lock = null;
  }
  // 화면이 다시 보이면 깨우기 다시 (안드로이드는 화면 꺼졌다 켜지면 풀림)
  document.addEventListener("visibilitychange", ()=>{ if(alarm && document.visibilityState === "visible"){ wake(); try{ navigator.wakeLock && navigator.wakeLock.request("screen").then(l=>{ lock = l; }).catch(()=>{}); }catch(e){} } });
  // 멈춤: 알람 뒤에 「새로」 멈춤을 누른 손가락만 (울리게 한 손가락이 떼면서 끄지 않게)
  let stopDown = false;
  ov.addEventListener(window.PointerEvent ? "pointerdown" : "touchstart", e=>{ stopDown = !!(e.target.closest && e.target.closest("#sosStop")); }, true);
  ov.addEventListener("click", e=>{ if(stopDown && e.target.closest && e.target.closest("#sosStop")){ stopDown = false; stop(); } });

  // ── 꾹 누르기 지켜보기 ──
  // 터치 기기: 터치 이벤트로 지켜본다 (스크롤·길게 누르기로 pointercancel 이 나도 계속 지켜짐). 마우스: 포인터 이벤트
  const TOUCH = "ontouchstart" in window;
  let h = null; // { x, y, t0, timer, raf, pid, target, tid }
  function skip(el){
    if(alarm) return true;
    if(!el || !el.closest) return false;
    if(el.closest("#joyGear")) return true;                       // ⚙ 3초 = 설정
    const set = document.getElementById("joySet");
    if(set && set.classList.contains("on")) return true;          // 설정 창 열려 있을 때
    return false;
  }
  function begin(x, y, target, pid, tid){
    if(h || skip(target)) return;
    wake();
    h = { x, y, t0: performance.now(), target, pid, tid };
    ring.style.left = x+"px"; ring.style.top = y+"px"; ring.style.setProperty("--p","0deg");
    h.timer = setTimeout(fire, HOLD);
    const tick = ()=>{ if(!h) return; const t = performance.now()-h.t0;
      if(t >= SHOW){ ring.classList.add("on"); ring.style.setProperty("--p", (Math.min(1,(t-SHOW)/(HOLD-SHOW))*360).toFixed(1)+"deg"); }
      h.raf = requestAnimationFrame(tick); };
    h.raf = requestAnimationFrame(tick);
  }
  function drop(){ if(!h) return; clearTimeout(h.timer); cancelAnimationFrame(h.raf); ring.classList.remove("on"); h = null; }
  function moved(x, y){ if(h && !h.fired && Math.hypot(x-h.x, y-h.y) > SLOP) drop(); }
  function end(){
    if(!h) return;
    if(h.fired) eatUntil = performance.now() + 400;   // 뗀 손가락의 click 도 먹는다
    drop();
  }
  function fire(){
    if(!h) return;
    h.fired = true; clearTimeout(h.timer); cancelAnimationFrame(h.raf); ring.classList.remove("on");
    eatUntil = Infinity;
    // 밑에 있던 칸(조이스틱 띠·글쓰기 판)에게 「취소」를 알려서 떼도 말하지 않게
    if(h.pid != null && window.PointerEvent){
      try{ (h.target && h.target.isConnected ? h.target : window).dispatchEvent(new PointerEvent("pointercancel", { pointerId: h.pid, bubbles: true, pointerType: TOUCH ? "touch" : "mouse" })); }catch(e){}
    }
    start();
  }
  // 울리게 한 손가락의 click 은 아무 데도 안 가게 (말 칸이 말하지 않게)
  addEventListener("click", e=>{ if(performance.now() < eatUntil && !(e.target.closest && e.target.closest("#sos"))){ e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  addEventListener("contextmenu", e=>{ if(h) e.preventDefault(); }, true);
  // 손이 한 번이라도 닿으면 소리 깨워 둠 (톡 = 사용자 손짓)
  addEventListener("pointerup", wake, true);
  addEventListener("touchend", wake, true);

  if(window.PointerEvent){
    addEventListener("pointerdown", e=>{
      if(e.pointerType === "touch" && TOUCH){ if(h && h.pid == null && !h.fired) { h.pid = e.pointerId; h.target = e.target; } else lastP = { id: e.pointerId, target: e.target }; return; }
      if(e.button > 0) return;
      begin(e.clientX, e.clientY, e.target, e.pointerId, null);
    }, true);
    // 떼기·움직임은 포인터로도 받는다: 누른 칸이 다시 그려져 문서에서 빠지면 touchend 가 window 까지 안 올라온다
    addEventListener("pointermove", e=>{ if(h && e.pointerId === h.pid) moved(e.clientX, e.clientY); }, true);
    addEventListener("pointerup", e=>{ if(h && e.pointerId === h.pid) end(); }, true);
    // 마우스는 cancel = 끝. 터치는 브라우저가 cancel 해도 터치 이벤트로 계속 지켜본다
    addEventListener("pointercancel", e=>{ if(e.isTrusted && h && h.tid == null && e.pointerId === h.pid && !h.fired) drop(); }, true);
  }
  let lastP = null;
  if(TOUCH){
    addEventListener("touchstart", e=>{
      const t = e.changedTouches[0]; if(!t) return;
      if(e.touches.length > 1){ if(h && !h.fired) drop(); return; }   // 두 손가락 = 안 지킴
      if(h && !h.fired) drop();   // 손가락 하나뿐인데 남아 있는 건 놓친 떼기 → 버리고 새로
      const p = lastP; lastP = null;
      begin(t.clientX, t.clientY, (p && p.target) || e.target, p ? p.id : null, t.identifier);
    }, { capture: true, passive: true });
    const find = e => h && h.tid != null ? [...e.changedTouches].find(t=>t.identifier === h.tid) : null;
    addEventListener("touchmove", e=>{ const t = find(e); if(t) moved(t.clientX, t.clientY); }, { capture: true, passive: true });
    addEventListener("touchend", e=>{ if(find(e)) end(); }, { capture: true, passive: true });
    addEventListener("touchcancel", e=>{ if(find(e)) end(); }, { capture: true, passive: true });
  }
  window.malhaeSOS = { start, stop, on: ()=>alarm };
})();
