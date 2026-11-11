/* 말해요 · 부르기 (2026-11-11 형: 「글씨 쓰는 거 두드리면 '순남아' 라고 말할 수 있게」)
   - 글씨 칸을 빠르게 두 번 톡톡 = 이름을 부른다 (두 점은 지워서 글씨에 안 남음)
   - 「순남아 🔔」 단추 한 번 톡 = 부른다 (손톱으로 누르기 쉬운 큰 단추)
   - 부르는 이름은 한 곳에서 바꾼다: 주소 끝에 ?name=여보 를 붙여 한 번 열면 이 기기에 저장됨 (?name= 비우면 기본으로)
   한 번 톡·글씨 쓰기·2초 꾹(긴급)은 그대로. */
(function(){
  "use strict";
  const DEFAULT_NAME = "순남아", KEY = "malhae_callname";
  const GAP = 400;      // 두 번째 톡이 첫 톡 뗀 뒤 이 안에 닿아야 함 (ms)
  const TAP_MS = 350;   // 이보다 오래 누르면 톡이 아님
  const NEAR = 80;      // 두 톡 사이 거리 (px) — 손톱이라 넉넉히
  try{
    const q = new URLSearchParams(location.search);
    if(q.has("name")){ const v = (q.get("name")||"").trim(); if(v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); }
  }catch(e){}
  function name(){ try{ return localStorage.getItem(KEY) || DEFAULT_NAME; }catch(e){ return DEFAULT_NAME; } }

  const st = document.createElement("style");
  st.textContent = `
  .callBtn{flex:0 0 auto;border:0;border-radius:14px;background:#FFD23F;color:#2a1f00;font:inherit;font-size:clamp(22px,5.5vw,32px);font-weight:900;padding:0 16px;white-space:nowrap;touch-action:manipulation}
  .callBtn:active{background:#ffb300}
  #callFlash{position:fixed;inset:0;z-index:1500;pointer-events:none;display:none;align-items:center;justify-content:center;background:#FFD23Fdd;color:#2a1f00;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:clamp(56px,18vw,140px);font-weight:900}
  #callFlash.on{display:flex}`;
  document.head.appendChild(st);
  let flash = null, flashT = null;

  function say(){
    const t = name();
    try{
      if(typeof window.malhaeSpeak === "function") window.malhaeSpeak(t);
      else { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "ko-KR"; u.rate = .95; speechSynthesis.speak(u); }
    }catch(e){}
    try{ navigator.vibrate && navigator.vibrate(120); }catch(e){}
    if(!flash){ flash = document.createElement("div"); flash.id = "callFlash"; document.body.appendChild(flash); }
    flash.textContent = "🔔 " + t; flash.classList.add("on");
    clearTimeout(flashT); flashT = setTimeout(()=>flash.classList.remove("on"), 1200);
  }

  // 단추를 before 앞에 붙인다
  function mount(before){
    const b = document.createElement("button"); b.type = "button"; b.className = "callBtn"; b.id = "callBtn";
    b.textContent = name() + " 🔔"; b.addEventListener("click", say);
    before.parentNode.insertBefore(b, before); return b;
  }

  // 글씨 칸에서 획 하나가 끝날 때마다 부른다. 두 번째 톡이면 이름을 부르고 true (→ 칸은 두 점을 지운다)
  let last = null;
  function tap(s){ // {x, y, start, end, len, small}
    const isTap = (s.end - s.start) <= TAP_MS && s.len <= s.small;
    if(!isTap){ last = null; return false; }
    if(last && s.start - last.end <= GAP && Math.hypot(s.x - last.x, s.y - last.y) <= NEAR){ last = null; say(); return true; }
    last = s; return false;
  }
  window.malhaeCall = { name, say, mount, tap };
})();
