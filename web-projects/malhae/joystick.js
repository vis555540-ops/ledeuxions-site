/* 말해요 · 조이스틱 (2026-10-02 형이 장인어른 댁에서 종이에 그려 보낸 것)
   화면 아래 구석에 동그라미. 엄지로 밀면 그 방향에 정해 둔 말을 한다.
   형 정정(10/02): 「손가락 각도 때문에 그래. 조이스틱은 여러 개 하려 하는 거야」
   → 번호가 왼쪽 위·위·오른쪽·오른쪽 아래에 몰린 건 엄지가 닿는 각도 때문이다.
     선택지는 엄지가 미는 「호」(왼쪽 위 → 위 → 오른쪽 → 오른쪽 아래, 210°) 위에만 고르게 나눈다.
     호 밖(왼쪽 아래 쪽)으로 밀면 아무것도 안 고른다. 오른쪽 아래에 두면 좌우 반전.
   - 기본 4개(머리·침·아니야·오케이, 형 낱말 그대로). 설정에서 추가·삭제·순서 바꾸기, 최대 8개
   - 밀면 그 칸이 밝아지고 말이 미리 뜬다 → 0.3초 머물러야 「고름」(진동) → 손을 떼면 말한다
     (6개 이상이면 칸이 좁으니 0.4초)
   - 가운데로 돌아와서 떼거나, 머물기 전에 떼면 취소
   - 설정은 ⚙ 를 3초 꾹 (장인어른이 실수로 못 바꾸게)
   말하기는 페이지의 기존 함수(window.malhaeSpeak)를 그대로 쓴다. */
(function(){
  "use strict";
  const KEY = "malhae_joy";
  const DEFAULT = ["머리", "침", "아니야", "오케이"];
  const MAX = 8;
  // 호: 위=0°, 시계방향 기준. -60°(왼쪽 위) ~ 150°(오른쪽 아래)
  const ARC_FROM = -60, ARC_TO = 150;
  const R = 70;          // 바탕 원 반지름 (지름 140)
  const KNOB = 26;       // 손잡이 반지름
  const PUSH = 30;       // 이만큼 밀어야 방향으로 본다
  const BOX = 236;       // 번호 글자까지 들어가는 상자
  const HOLD = 3000;     // 설정 열기 꾹 누르기

  function clean(a){
    return (Array.isArray(a) ? a : []).filter(w=>typeof w==="string" && w.trim()).map(w=>w.trim()).slice(0,MAX);
  }
  function load(){
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){}
    let words = clean(s.words); if(!words.length) words = DEFAULT.slice();
    return { words, show: s.show !== false, hand: s.hand === "right" ? "right" : "left" };
  }
  let st = load();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  const dwell = () => st.words.length >= 6 ? 400 : 300;
  const mirror = () => st.hand === "right";

  // k번째 칸의 [시작, 끝, 가운데] 각도 (화면 기준, 반전 반영)
  function slot(k){
    const n = st.words.length, w = (ARC_TO - ARC_FROM) / n;
    let a = ARC_FROM + k*w, b = a + w;
    if(mirror()){ const t = -b; b = -a; a = t; }
    return [a, b, (a+b)/2];
  }

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
  const esc = t => String(t).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  const css = `
  #joy{position:fixed;bottom:calc(6px + env(safe-area-inset-bottom,0px));width:${BOX}px;height:${BOX}px;z-index:900;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joy.L{left:0} #joy.R{right:0}
  #joy svg{position:absolute;left:${BOX/2-R}px;top:${BOX/2-R}px;width:${R*2}px;height:${R*2}px;pointer-events:auto;touch-action:none;border-radius:50%;box-shadow:0 4px 18px #000a}
  #joy .dead{fill:#0d1117;stroke:#3a5272;stroke-width:1.5}
  #joy .sec{fill:#1b2737;stroke:#3a5272;stroke-width:1.5;transition:fill .08s}
  #joy .sec.hot{fill:#2b5a99} #joy .sec.arm{fill:#e0a400}
  #joy .knob{fill:#e8eef7;stroke:#fff;stroke-width:2;pointer-events:none}
  #joy .lab{position:absolute;transform:translate(-50%,-50%);background:#0e1116e6;border:1.5px solid #3a5272;border-radius:10px;padding:2px 6px;color:#f2f4f7;font-size:12px;font-weight:700;white-space:nowrap;line-height:1.25;text-align:center}
  #joy .lab b{display:block;font-size:16px;color:#8ec5ff}
  #joy.many .lab{font-size:10px;padding:1px 4px} #joy.many .lab b{font-size:13px}
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
  #joyGear.hold i{animation:joyHold ${HOLD/1000}s linear forwards}
  @property --p{syntax:'<angle>';inherits:false;initial-value:0deg}
  @keyframes joyHold{from{--p:0deg}to{--p:360deg}}
  #joySet{position:fixed;inset:0;z-index:950;background:#000b;display:none;align-items:center;justify-content:center;padding:16px}
  #joySet.on{display:flex}
  #joySet .box{background:#1b2029;color:#f2f4f7;border-radius:16px;padding:16px;width:min(420px,100%);max-height:92vh;overflow:auto;font-family:inherit}
  #joySet h2{font-size:18px;margin:0 0 6px}
  #joySet p{font-size:13px;color:#9aa4b2;margin:0 0 10px;line-height:1.5}
  #joySet .it{display:flex;align-items:center;gap:6px;margin:6px 0}
  #joySet .it b{min-width:22px;color:#8ec5ff;font-size:16px;text-align:center}
  #joySet .it input{flex:1;min-width:0;font-size:17px;padding:9px;border-radius:10px;border:1.5px solid #3a5272;background:#101722;color:#f2f4f7}
  #joySet .it button{width:38px;height:40px;border:0;border-radius:10px;background:#2a3340;color:#fff;font-size:16px;font-weight:800;flex:none}
  #joySet .it button:disabled{opacity:.3}
  #joySet .it button.x{background:#5a2226}
  #joySet .row{display:flex;gap:8px;margin-top:12px}
  #joySet .row button{flex:1;padding:12px;border:0;border-radius:12px;font-size:15px;font-weight:800;background:#2a3340;color:#fff}
  #joySet .row button.on{background:#1565c0}
  #joySet .row button.ok{background:#2e7d32}
  #joySet .row button:disabled{opacity:.35}
  `;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  const NS = "http://www.w3.org/2000/svg";
  const joy = document.createElement("div"); joy.id = "joy";
  const svg = document.createElementNS(NS,"svg"); svg.setAttribute("viewBox",`${-R} ${-R} ${R*2} ${R*2}`);
  svg.setAttribute("role","application"); svg.setAttribute("aria-label","조이스틱: 밀어서 말하기");
  const pt = (deg, r) => { const a = (deg-90)*Math.PI/180; return [r*Math.cos(a), r*Math.sin(a)]; };
  const wedge = (lo, hi) => { const [x1,y1] = pt(lo,R), [x2,y2] = pt(hi,R);
    return `M0 0 L${x1} ${y1} A${R} ${R} 0 ${hi-lo>180?1:0} 1 ${x2} ${y2} Z`; };
  const gSec = document.createElementNS(NS,"g"); svg.appendChild(gSec);
  const knob = document.createElementNS(NS,"circle"); knob.setAttribute("r",KNOB); knob.setAttribute("class","knob");
  svg.appendChild(knob); joy.appendChild(svg);
  let secs = [], labs = [];

  function drawJoy(){
    gSec.innerHTML = ""; secs = []; labs.forEach(d=>d.remove()); labs = [];
    // 호 밖 = 고르지 않는 자리 (어둡게)
    const dead = document.createElementNS(NS,"path"); dead.setAttribute("class","dead");
    dead.setAttribute("d", mirror() ? wedge(-ARC_FROM, 360-ARC_TO) : wedge(ARC_TO, ARC_FROM+360));
    gSec.appendChild(dead);
    const many = st.words.length >= 6;
    joy.classList.toggle("many", many);
    st.words.forEach((w,k)=>{
      const [lo,hi,c] = slot(k);
      const p = document.createElementNS(NS,"path"); p.setAttribute("d", wedge(lo,hi)); p.setAttribute("class","sec");
      gSec.appendChild(p); secs.push(p);
      const [x,y] = pt(c, R*0.74); const t = document.createElementNS(NS,"text");
      t.setAttribute("x",x); t.setAttribute("y",y+5); t.setAttribute("text-anchor","middle");
      t.setAttribute("fill","#9fb7d6"); t.setAttribute("font-size", many ? "12" : "14"); t.setAttribute("font-weight","800");
      t.style.pointerEvents="none"; t.textContent = k+1; gSec.appendChild(t);
      const d = document.createElement("div"); d.className = "lab"; d.title = w;
      const [lx,ly] = pt(c, R + (many ? 26 : 30)); d.style.left = (BOX/2+lx)+"px"; d.style.top = (BOX/2+ly)+"px";
      const cut = many ? 3 : 5;
      d.innerHTML = `<b>${k+1}</b>`; d.appendChild(document.createTextNode(w.length > cut+1 ? w.slice(0,cut)+"…" : w));
      joy.appendChild(d); labs.push(d);
    });
  }

  // 설정 단추: 3초 꾹 눌러야 열린다 (형 그림 ②: 「3초 누르기(설정변경)」)
  // 놓는 자리: <script data-gear="corner"> = 화면 오른쪽 위 / 그 밖 = 조이스틱 위
  const GEAR_MODE = (document.currentScript && document.currentScript.dataset.gear) || "joy";
  const gear = document.createElement("button"); gear.id = "joyGear"; gear.type = "button";
  gear.setAttribute("aria-label","조이스틱 설정 (3초 꾹 누르기)"); gear.title = "3초 꾹 누르면 설정";
  gear.innerHTML = "<i></i><span>⚙</span>";

  const prev = document.createElement("div"); prev.id = "joyPrev";
  const set = document.createElement("div"); set.id = "joySet";

  let pageOn = true;   // 페이지가 「지금은 조이스틱 화면이 아님」이라 하면 끈다
  function render(){
    const side = st.hand === "right" ? "R" : "L";
    joy.className = side;
    gear.className = GEAR_MODE === "corner" ? "corner" : side;
    drawJoy();
    const on = st.show && pageOn;
    joy.style.display = on ? "" : "none";
    gear.style.display = pageOn ? "" : "none";
    document.body.classList.toggle("joy-on", on);
  }
  const tell = (name, detail) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch(e){} };

  /* ── 밀기 ── */
  let pid = null, dir = -1, armed = false, timer = null;
  function paint(){
    secs.forEach((p,i)=>{ p.classList.toggle("hot", i===dir && !armed); p.classList.toggle("arm", i===dir && armed); });
    labs.forEach((d,i)=>{ d.classList.toggle("hot", i===dir && !armed); d.classList.toggle("arm", i===dir && armed); });
    tell("malhaejoy", { dir, armed });   // 페이지의 큰 네모도 같이 밝힌다
    if(dir < 0){ prev.className = ""; return; }
    prev.textContent = (armed ? "손 떼면 말함 · " : "") + st.words[dir];
    prev.className = "on" + (armed ? " arm" : "");
  }
  function setDir(d){
    if(d === dir) return;
    dir = d; armed = false; clearTimeout(timer);
    if(d >= 0) buzz(10);   // 호를 따라 쓸면 칸 바뀔 때마다 톡 (형: 「엄지로 오른쪽으로 가면 다른 단어」)
    if(d >= 0) timer = setTimeout(()=>{ armed = true; buzz(25); paint(); }, dwell());
    paint();
  }
  function pick(deg){   // deg: 위=0, 시계방향, -180~180
    const n = st.words.length, w = (ARC_TO - ARC_FROM) / n;
    const a = mirror() ? -deg : deg;
    if(a < ARC_FROM || a >= ARC_TO) return -1;      // 호 밖 = 안 고름
    return Math.min(n-1, Math.floor((a - ARC_FROM) / w));
  }
  function move(e){
    const b = svg.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width/2), dy = e.clientY - (b.top + b.height/2);
    const dist = Math.hypot(dx,dy), lim = R - KNOB*0.6;
    const k = dist > lim ? lim/dist : 1;
    knob.setAttribute("cx", dx*k); knob.setAttribute("cy", dy*k);
    if(dist < PUSH){ setDir(-1); return; }
    let deg = Math.atan2(dy,dx)*180/Math.PI + 90; if(deg > 180) deg -= 360;
    setDir(pick(deg));
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

  let draft = [], hand = st.hand, vis = st.show;
  function readDraft(){ set.querySelectorAll(".it input").forEach((inp,i)=>{ draft[i] = inp.value; }); }
  function drawSet(){
    const n = draft.length;
    set.innerHTML = `<div class="box" role="dialog" aria-label="조이스틱 설정">
      <h2>🕹️ 조이스틱 설정</h2>
      <p>엄지가 미는 쪽(왼쪽 위 → 위 → 오른쪽 → 오른쪽 아래)을 개수만큼 고르게 나눕니다. 1번이 왼쪽 위부터.<br>
      밀어서 ${n>=6?"0.4":"0.3"}초 머문 뒤 떼면 말하고, 가운데로 돌아와 떼면 취소. 최대 ${MAX}개.</p>
      ${draft.map((w,i)=>`<div class="it"><b>${i+1}</b><input type="text" maxlength="40" value="${esc(w)}">
        <button type="button" data-up="${i}" ${i===0?"disabled":""} aria-label="위로">▲</button>
        <button type="button" data-dn="${i}" ${i===n-1?"disabled":""} aria-label="아래로">▼</button>
        <button type="button" class="x" data-del="${i}" ${n<=1?"disabled":""} aria-label="지우기">✕</button></div>`).join("")}
      <div class="row"><button type="button" class="add" ${n>=MAX?"disabled":""}>＋ 말 추가 (${n}/${MAX})</button></div>
      <p style="margin-top:14px">조이스틱</p>
      <div class="row"><button type="button" data-v="1" class="${vis?"on":""}">보이기</button><button type="button" data-v="0" class="${vis?"":"on"}">숨기기</button></div>
      <p style="margin-top:12px">놓는 자리</p>
      <div class="row"><button type="button" data-h="left" class="${hand==="left"?"on":""}">왼쪽 아래</button><button type="button" data-h="right" class="${hand==="right"?"on":""}">오른쪽 아래 (좌우 반전)</button></div>
      <div class="row"><button type="button" class="rst">처음 말로</button><button type="button" class="cn">닫기</button><button type="button" class="ok">저장</button></div>
    </div>`;
  }
  function openSet(){ draft = st.words.slice(); hand = st.hand; vis = st.show; drawSet(); set.classList.add("on"); }
  set.addEventListener("click", e=>{
    const t = e.target.closest ? (e.target.closest("button") || e.target) : e.target;
    if(t === set || t.classList.contains("cn")){ set.classList.remove("on"); return; }
    if(t.tagName !== "BUTTON") return;
    readDraft();
    const d = t.dataset;
    if(d.up){ const i=+d.up; [draft[i-1],draft[i]] = [draft[i],draft[i-1]]; }
    else if(d.dn){ const i=+d.dn; [draft[i+1],draft[i]] = [draft[i],draft[i+1]]; }
    else if(d.del){ if(draft.length > 1) draft.splice(+d.del,1); }
    else if(t.classList.contains("add")){ if(draft.length < MAX) draft.push(""); }
    else if(d.h){ hand = d.h; }
    else if(d.v){ vis = d.v === "1"; }
    else if(t.classList.contains("rst")){ draft = DEFAULT.slice(); }
    else if(t.classList.contains("ok")){
      const w = clean(draft); st.words = w.length ? w : DEFAULT.slice();
      st.hand = hand; st.show = vis; save(); render(); set.classList.remove("on");
      tell("malhaejoy-words", { words: st.words.slice() });
      return;
    }
    drawSet();
    if(t.classList.contains("add")){ const ins = set.querySelectorAll(".it input"); ins[ins.length-1].focus(); }
  });

  function mount(){
    document.body.appendChild(prev); document.body.appendChild(joy);
    document.body.appendChild(gear); document.body.appendChild(set);
    render();
  }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.malhaeJoy = {
    words: ()=>st.words.slice(),
    slot: k=>slot(k)[2],
    say,
    setPage: on=>{ pageOn = !!on; if(document.body) render(); },
    openSettings: openSet
  };
})();
