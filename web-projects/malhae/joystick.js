/* 말해요 · 조이스틱 (2026-10-02 형이 장인어른 댁에서 종이에 그려 보낸 것)
   화면 아래 구석에 동그라미. 엄지로 밀면 그 방향에 정해 둔 말을 한다.
   번호 자리(형 그림): 1=왼쪽 위 · 2=위(조금 오른쪽) · 3=오른쪽 · 4=왼쪽 아래 · 5=아래(조금 오른쪽)
   형이 정한 말: 1=머리 · 2=침 · 3=아니야 · 5=오케이. 4번은 비워 둠(설정에서 채울 수 있음).
   빈 자리는 칸이 없어지고 옆 칸이 그만큼 넓어진다 → 칸이 크면 실수가 준다.
   - 밀면 그 칸이 밝아지고 말이 미리 뜬다
   - 0.3초 머물러야 「고름」(진동) → 손을 떼면 말한다
   - 가운데로 돌아와서 떼거나, 0.3초 전에 떼면 취소
   말하기는 페이지의 기존 함수(window.malhaeSpeak)를 그대로 쓴다. */
(function(){
  "use strict";
  const KEY = "malhae_joy";
  // 2026-10-02 형: 「1번엔 머리, 침, 아니야, 오케이」 — 낱말 그대로 읽는다. 번호 1~5 순서, 4번 빈칸
  const DEFAULT = ["머리", "침", "아니야", "", "오케이"];
  // 번호별 부채꼴 가운데 각도 (위=0°, 시계방향)
  const ANG = [306, 18, 90, 234, 162];
  const R = 70;          // 바탕 원 반지름 (지름 140)
  const KNOB = 26;       // 손잡이 반지름
  const PUSH = 30;       // 이만큼 밀어야 방향으로 본다
  const DWELL = 300;     // 머물러야 하는 시간(ms)
  const BOX = 236;       // 번호 글자까지 들어가는 상자

  function load(){
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){}
    let words = DEFAULT.map((d,i)=> (Array.isArray(s.words) && typeof s.words[i]==="string") ? s.words[i].trim() : d);
    if(!words.some(Boolean)) words = DEFAULT.slice();
    return { words, show: s.show !== false, hand: s.hand === "right" ? "right" : "left" };
  }
  let st = load();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }

  function fallbackSpeak(t){
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t); u.lang="ko-KR"; u.rate=.95;
      const v = speechSynthesis.getVoices().find(v=>/ko/i.test(v.lang)); if(v) u.voice=v;
      speechSynthesis.speak(u);
    }catch(e){}
  }
  function say(t){
    if(typeof window.malhaeSpeak === "function") window.malhaeSpeak(t); else fallbackSpeak(t);
  }
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };
  const short = t => t.length > 6 ? t.slice(0,5) + "…" : t;

  const css = `
  #joy{position:fixed;bottom:calc(6px + env(safe-area-inset-bottom,0px));width:${BOX}px;height:${BOX}px;z-index:900;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joy.L{left:0} #joy.R{right:0}
  #joy svg{position:absolute;left:${BOX/2-R}px;top:${BOX/2-R}px;width:${R*2}px;height:${R*2}px;pointer-events:auto;touch-action:none;border-radius:50%;box-shadow:0 4px 18px #000a}
  #joy .sec{fill:#1b2737;stroke:#3a5272;stroke-width:1.5;transition:fill .08s}
  #joy .sec.hot{fill:#2b5a99} #joy .sec.arm{fill:#e0a400}
  #joy .knob{fill:#e8eef7;stroke:#fff;stroke-width:2;pointer-events:none}
  #joy .lab{position:absolute;transform:translate(-50%,-50%);background:#0e1116e6;border:1.5px solid #3a5272;border-radius:10px;padding:2px 6px;color:#f2f4f7;font-size:12px;font-weight:700;white-space:nowrap;line-height:1.25;text-align:center}
  #joy .lab b{display:block;font-size:16px;color:#8ec5ff}
  #joy .lab.hot{border-color:#5b9bff;background:#20406ee6} #joy .lab.arm{border-color:#ffd24a;background:#5a4300ee}
  #joyPrev{position:fixed;left:12px;right:12px;bottom:calc(${BOX+12}px + env(safe-area-inset-bottom,0px));z-index:903;display:none;text-align:center;font-size:clamp(28px,8vw,42px);font-weight:800;padding:14px;border-radius:18px;background:#20406E;color:#fff;border:3px solid #5b9bff;box-shadow:0 6px 24px #000c}
  #joyPrev.arm{background:#5a4300;border-color:#ffd24a}
  #joyPrev.on{display:block}
  #joyGear{position:fixed;z-index:902;width:46px;height:46px;border-radius:50%;border:2px solid #3a5272;background:#1b2029;color:#c9d3e0;font-size:22px;padding:0;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;overflow:hidden}
  #joyGear.corner{top:calc(8px + env(safe-area-inset-top,0px));right:10px}
  #joyGear.L{left:8px;bottom:calc(${BOX}px + env(safe-area-inset-bottom,0px))}
  #joyGear.R{right:8px;bottom:calc(${BOX}px + env(safe-area-inset-bottom,0px))}
  #joyGear i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#ffd24a var(--p,0deg),transparent 0)}
  #joyGear span{position:relative;width:34px;height:34px;border-radius:50%;background:#1b2029;display:flex;align-items:center;justify-content:center}
  #joyGear.hold i{animation:joyHold ${3}s linear forwards}
  @property --p{syntax:'<angle>';inherits:false;initial-value:0deg}
  @keyframes joyHold{from{--p:0deg}to{--p:360deg}}
  #joySet{position:fixed;inset:0;z-index:950;background:#000b;display:none;align-items:center;justify-content:center;padding:16px}
  #joySet.on{display:flex}
  #joySet .box{background:#1b2029;color:#f2f4f7;border-radius:16px;padding:16px;width:min(420px,100%);max-height:90vh;overflow:auto;font-family:inherit}
  #joySet h2{font-size:18px;margin:0 0 6px}
  #joySet p{font-size:13px;color:#9aa4b2;margin:0 0 10px;line-height:1.5}
  #joySet label{display:flex;align-items:center;gap:8px;margin:8px 0;font-size:15px;font-weight:700}
  #joySet label span{min-width:74px;color:#8ec5ff}
  #joySet input[type=text]{flex:1;min-width:0;font-size:17px;padding:10px;border-radius:10px;border:1.5px solid #3a5272;background:#101722;color:#f2f4f7}
  #joySet .row{display:flex;gap:8px;margin-top:12px}
  #joySet .row button{flex:1;padding:12px;border:0;border-radius:12px;font-size:15px;font-weight:800;background:#2a3340;color:#fff}
  #joySet .row button.on{background:#1565c0}
  #joySet .row button.ok{background:#2e7d32}
  `;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  const where = ["왼쪽 위","위","오른쪽","왼쪽 아래","아래"];
  const NS = "http://www.w3.org/2000/svg";
  const joy = document.createElement("div"); joy.id = "joy";
  const svg = document.createElementNS(NS,"svg"); svg.setAttribute("viewBox",`${-R} ${-R} ${R*2} ${R*2}`);
  svg.setAttribute("role","application"); svg.setAttribute("aria-label","조이스틱: 밀어서 말하기");
  const pt = (deg, r) => { const a = (deg-90)*Math.PI/180; return [r*Math.cos(a), r*Math.sin(a)]; };
  const gSec = document.createElementNS(NS,"g"); svg.appendChild(gSec);
  let secs = [];   // 번호별 path (빈 자리는 null)
  // 쓰는 자리끼리 가운데 각도 사이 중간에서 나눈다 → 빈 자리 몫은 옆 칸이 나눠 갖는다
  function spans(){
    const act = ANG.map((c,i)=>({c,i})).filter(o=>st.words[o.i]);
    act.sort((a,b)=>a.c-b.c);
    const out = {};
    act.forEach((o,k)=>{
      if(act.length === 1){ out[o.i] = [o.c-180, o.c+180]; return; }
      const pv = act[(k-1+act.length)%act.length].c, nx = act[(k+1)%act.length].c;
      const lo = o.c - (((o.c - pv) + 360) % 360)/2, hi = o.c + (((nx - o.c) + 360) % 360)/2;
      out[o.i] = [lo, hi];
    });
    return out;
  }
  function drawSecs(){
    gSec.innerHTML = ""; secs = ANG.map(()=>null);
    const sp = spans();
    Object.keys(sp).forEach(k=>{
      const i = +k, [lo,hi] = sp[i];
      const p = document.createElementNS(NS,"path");
      if(hi - lo >= 359.9){ p.setAttribute("d",`M0 ${-R} A${R} ${R} 0 1 1 0 ${R} A${R} ${R} 0 1 1 0 ${-R} Z`); }
      else { const [x1,y1] = pt(lo,R), [x2,y2] = pt(hi,R);
        p.setAttribute("d",`M0 0 L${x1} ${y1} A${R} ${R} 0 ${hi-lo>180?1:0} 1 ${x2} ${y2} Z`); }
      p.setAttribute("class","sec"); gSec.appendChild(p); secs[i] = p;
      const [x,y] = pt(ANG[i], R*0.74); const t = document.createElementNS(NS,"text");
      t.setAttribute("x",x); t.setAttribute("y",y+5); t.setAttribute("text-anchor","middle");
      t.setAttribute("fill","#9fb7d6"); t.setAttribute("font-size","14"); t.setAttribute("font-weight","800");
      t.style.pointerEvents="none"; t.textContent = i+1; gSec.appendChild(t);
    });
  }
  const knob = document.createElementNS(NS,"circle"); knob.setAttribute("r",KNOB); knob.setAttribute("class","knob");
  svg.appendChild(knob); joy.appendChild(svg);

  const labs = ANG.map((c,i)=>{
    const d = document.createElement("div"); d.className = "lab";
    const [x,y] = pt(c, R+30); d.style.left = (BOX/2+x)+"px"; d.style.top = (BOX/2+y)+"px";
    joy.appendChild(d); return d;
  });
  // 설정 단추: 3초 꾹 눌러야 열린다 (2026-10-02 형 그림 ②: 「3초 누르기(설정변경)」 — 장인어른이 실수로 못 바꾸게)
  // 놓는 자리: <script data-gear="corner"> = 화면 오른쪽 위 / 그 밖 = 조이스틱 위
  const GEAR_MODE = (document.currentScript && document.currentScript.dataset.gear) || "joy";
  const gear = document.createElement("button"); gear.id = "joyGear"; gear.type = "button";
  gear.setAttribute("aria-label","조이스틱 설정 (3초 꾹 누르기)"); gear.title = "3초 꾹 누르면 설정";
  gear.innerHTML = "<i></i><span>⚙</span>";
  const HOLD = 3000;

  const prev = document.createElement("div"); prev.id = "joyPrev";

  const set = document.createElement("div"); set.id = "joySet";
  set.innerHTML = `<div class="box" role="dialog" aria-label="조이스틱 설정">
    <h2>🕹️ 조이스틱 설정</h2>
    <p>밀어서 0.3초 머문 뒤 손을 떼면 말합니다. 가운데로 돌아와서 떼면 취소.<br>칸을 비우면 그 방향은 없어지고 옆 칸이 넓어집니다.</p>
    ${where.map((w,i)=>`<label><span>${i+1} ${w}</span><input type="text" data-i="${i}" maxlength="40"></label>`).join("")}
    <p style="margin-top:12px">조이스틱</p>
    <div class="row"><button type="button" data-v="1">보이기</button><button type="button" data-v="0">숨기기</button></div>
    <p style="margin-top:12px">놓는 자리</p>
    <div class="row"><button type="button" data-h="left">왼손 (왼쪽 아래)</button><button type="button" data-h="right">오른손 (오른쪽 아래)</button></div>
    <div class="row"><button type="button" class="rst">처음 말로</button><button type="button" class="cn">닫기</button><button type="button" class="ok">저장</button></div>
  </div>`;

  let pageOn = true;   // 페이지가 「지금은 조이스틱 화면이 아님」이라 하면 끈다
  function render(){
    const side = st.hand === "right" ? "R" : "L";
    joy.className = side;
    gear.className = GEAR_MODE === "corner" ? "corner" : side;
    labs.forEach((d,i)=>{ d.innerHTML = `<b>${i+1}</b>`; d.appendChild(document.createTextNode(short(st.words[i]))); d.title = st.words[i]; d.style.display = st.words[i] ? "" : "none"; });
    drawSecs();
    const on = st.show && pageOn;
    joy.style.display = on ? "" : "none";
    gear.style.display = pageOn ? "" : "none";
    document.body.classList.toggle("joy-on", on);
  }
  const tell = (name, detail) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch(e){} };

  /* ── 밀기 ── */
  let pid = null, dir = -1, armed = false, timer = null;
  function paint(){
    secs.forEach((p,i)=>{ if(!p) return; p.classList.toggle("hot", i===dir && !armed); p.classList.toggle("arm", i===dir && armed); });
    labs.forEach((d,i)=>{ d.classList.toggle("hot", i===dir && !armed); d.classList.toggle("arm", i===dir && armed); });
    tell("malhaejoy", { dir, armed });   // 페이지의 큰 네모도 같이 밝힌다
    if(dir < 0){ prev.className = ""; return; }
    prev.textContent = (armed ? "손 떼면 말함 · " : "") + st.words[dir];
    prev.className = "on" + (armed ? " arm" : "");
  }
  function setDir(d){
    if(d === dir) return;
    dir = d; armed = false; clearTimeout(timer);
    if(d >= 0) timer = setTimeout(()=>{ armed = true; buzz(25); paint(); }, DWELL);
    paint();
  }
  function move(e){
    const b = svg.getBoundingClientRect();
    let dx = e.clientX - (b.left + b.width/2), dy = e.clientY - (b.top + b.height/2);
    const dist = Math.hypot(dx,dy), lim = R - KNOB*0.6;
    const k = dist > lim ? lim/dist : 1;
    knob.setAttribute("cx", dx*k); knob.setAttribute("cy", dy*k);
    if(dist < PUSH){ setDir(-1); return; }
    const deg = (Math.atan2(dy,dx)*180/Math.PI + 90 + 360) % 360;
    let best = -1, bd = 999;
    ANG.forEach((c,i)=>{ if(!st.words[i]) return; const dd = Math.abs(((deg - c + 540) % 360) - 180); if(dd < bd){ bd = dd; best = i; } });
    setDir(best);
  }
  function end(fire){
    if(fire && dir >= 0 && armed){ const t = st.words[dir]; buzz(60); say(t); }
    pid = null; clearTimeout(timer); dir = -1; armed = false;
    knob.setAttribute("cx",0); knob.setAttribute("cy",0); paint();
  }
  svg.addEventListener("pointerdown", e=>{
    if(pid !== null) return;
    pid = e.pointerId; try { svg.setPointerCapture(pid); } catch(_){}
    e.preventDefault(); move(e);
  });
  svg.addEventListener("pointermove", e=>{ if(e.pointerId === pid){ e.preventDefault(); move(e); } });
  svg.addEventListener("pointerup", e=>{ if(e.pointerId === pid) end(true); });
  svg.addEventListener("pointercancel", e=>{ if(e.pointerId === pid) end(false); });
  svg.addEventListener("contextmenu", e=>e.preventDefault());

  /* ── 설정: 3초 꾹 ── */
  let gTimer = null;
  const gStop = ()=>{ clearTimeout(gTimer); gTimer = null; gear.classList.remove("hold"); };
  gear.addEventListener("pointerdown", e=>{
    e.preventDefault(); gStop();
    try { gear.setPointerCapture(e.pointerId); } catch(_){}
    gear.classList.add("hold");
    gTimer = setTimeout(()=>{ gStop(); buzz(40); openSet(); }, HOLD);
  });
  ["pointerup","pointercancel","lostpointercapture"].forEach(t=>gear.addEventListener(t, gStop));
  gear.addEventListener("contextmenu", e=>e.preventDefault());

  let hand = st.hand, vis = st.show;
  function syncSet(){
    set.querySelectorAll("input[data-i]").forEach(inp=>{ inp.value = st.words[+inp.dataset.i]; });
    set.querySelectorAll("[data-h]").forEach(b=>b.classList.toggle("on", b.dataset.h === hand));
    set.querySelectorAll("[data-v]").forEach(b=>b.classList.toggle("on", (b.dataset.v === "1") === vis));
  }
  function openSet(){ hand = st.hand; vis = st.show; syncSet(); set.classList.add("on"); }
  set.addEventListener("click", e=>{
    const t = e.target;
    if(t === set || t.classList.contains("cn")){ set.classList.remove("on"); return; }
    if(t.dataset && t.dataset.h){ hand = t.dataset.h; syncSetBtns(); }
    if(t.dataset && t.dataset.v){ vis = t.dataset.v === "1"; syncSetBtns(); }
    if(t.classList.contains("rst")) set.querySelectorAll("input[data-i]").forEach(inp=>{ inp.value = DEFAULT[+inp.dataset.i]; });
    if(t.classList.contains("ok")){
      set.querySelectorAll("input[data-i]").forEach(inp=>{ st.words[+inp.dataset.i] = inp.value.trim(); });
      if(!st.words.some(Boolean)) st.words = DEFAULT.slice();
      st.hand = hand; st.show = vis; save(); render(); set.classList.remove("on");
      tell("malhaejoy-words", { words: st.words.slice() });
    }
  });
  function syncSetBtns(){
    set.querySelectorAll("[data-h]").forEach(b=>b.classList.toggle("on", b.dataset.h === hand));
    set.querySelectorAll("[data-v]").forEach(b=>b.classList.toggle("on", (b.dataset.v === "1") === vis));
  }

  function mount(){
    document.body.appendChild(prev); document.body.appendChild(joy);
    document.body.appendChild(gear); document.body.appendChild(set);
    render();
  }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.malhaeJoy = {
    words: ()=>st.words.slice(),
    where: i=>where[i],
    say,
    setPage: on=>{ pageOn = !!on; if(document.body) render(); },
    openSettings: openSet
  };
})();
