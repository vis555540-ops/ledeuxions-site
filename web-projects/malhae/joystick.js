/* 말해요 · 조이스틱 (2026-10-02 형이 장인어른 댁에서 종이에 그려 보낸 것)
   화면 아래 구석에 동그라미. 엄지로 밀면 그 방향의 「말 묶음」이 위 큰 네모로 뜬다. 네모를 누르면 말한다.

   형 말(10/02) 세 번:
   ① 「손가락 각도 때문에 그래. 조이스틱은 여러 개 하려 하는 거야」
      → 선택지는 엄지가 미는 「호」(왼쪽 위 → 위 → 오른쪽 → 오른쪽 아래, 210°) 위에만 고르게 나눈다.
        호 밖(왼쪽 아래 쪽)으로 밀면 아무것도 안 바뀐다. 오른쪽 아래에 두면 좌우 반전.
   ② 「엄지 가지고 오른쪽으로 가면 다른 단어 나오게」 → 호를 따라 쓸면 차례로 바뀐다(칸마다 진동 톡).
   ③ 「손가락 방향마다 언어 한 묶음 (성격 엄청 급하셔서 기다리는 거 싫어하셔)」
      → 방향 하나 = 묶음 하나. 미는 즉시 바뀐다(기다림 0). 말은 네모를 누를 때만 한다.
        조이스틱에서 손을 떼도 말하지 않는다 — 실수 방지는 이 구조로 한다.
   - 설정은 ⚙ 를 3초 꾹 (장인어른이 실수로 못 바꾸게). 묶음 최대 8, 묶음 안 말 최대 6.
   - 네모는 페이지가 그린다(이벤트 malhaejoy-group). data-panel="1" 이면 여기서 직접 띄운다(눈으로 쪽).
   말하기는 페이지의 기존 함수(window.malhaeSpeak)를 그대로 쓴다. */
(function(){
  "use strict";
  const KEY = "malhae_joy2";
  const MAXG = 8, MAXW = 6;
  // 형이 준 낱말(머리·침·아니야·오케이)을 묶음 첫머리에. 나머지는 형이 나중에 바꾼다
  const DEFAULT = [
    { name: "머리", words: ["머리", "머리 아파", "머리 긁어줘", "머리 올려줘", "베개"] },
    { name: "침",   words: ["침", "침 닦아줘", "석션", "입안 닦아줘", "물"] },
    { name: "대답", words: ["아니야", "오케이", "응", "잠깐"] },
    { name: "사람", words: ["사람 불러주세요", "여보", "와봐", "고마워"] }
  ];
  // 호: 위=0°, 시계방향 기준. -60°(왼쪽 위) ~ 150°(오른쪽 아래)
  const ARC_FROM = -60, ARC_TO = 150;
  const R = 70;          // 바탕 원 반지름 (지름 140)
  const KNOB = 26;       // 손잡이 반지름
  const PUSH = 26;       // 이만큼 밀어야 방향으로 본다
  const BOX = 236;       // 번호 글자까지 들어가는 상자
  const HOLD = 3000;     // 설정 열기 꾹 누르기
  const ME = document.currentScript;
  const GEAR_MODE = (ME && ME.dataset.gear) || "joy";
  const OWN_PANEL = !!(ME && ME.dataset.panel);

  const copy = g => g.map(x=>({ name: x.name, words: x.words.slice() }));
  function clean(gs){
    return (Array.isArray(gs) ? gs : []).map(g=>{
      const words = (g && Array.isArray(g.words) ? g.words : []).filter(w=>typeof w==="string" && w.trim()).map(w=>w.trim()).slice(0,MAXW);
      let name = g && typeof g.name==="string" ? g.name.trim() : "";
      if(!name) name = words[0] || "";
      return { name, words };
    }).filter(g=>g.words.length).slice(0,MAXG);
  }
  function load(){
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch(e){}
    let groups = clean(s.groups); if(!groups.length) groups = copy(DEFAULT);
    const cur = Number.isInteger(s.cur) && s.cur >= 0 && s.cur < groups.length ? s.cur : 0;
    return { groups, cur, show: s.show !== false, hand: s.hand === "right" ? "right" : "left" };
  }
  let st = load();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  const mirror = () => st.hand === "right";

  // k번째 칸의 [시작, 끝, 가운데] 각도 (화면 기준, 반전 반영)
  function slot(k){
    const n = st.groups.length, w = (ARC_TO - ARC_FROM) / n;
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
  const cut = (t, n) => t.length > n+1 ? t.slice(0,n)+"…" : t;

  const css = `
  #joy{position:fixed;bottom:calc(6px + env(safe-area-inset-bottom,0px));width:${BOX}px;height:${BOX}px;z-index:900;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joy.L{left:0} #joy.R{right:0}
  #joy svg{position:absolute;left:${BOX/2-R}px;top:${BOX/2-R}px;width:${R*2}px;height:${R*2}px;pointer-events:auto;touch-action:none;border-radius:50%;box-shadow:0 4px 18px #000a}
  #joy .dead{fill:#0d1117;stroke:#3a5272;stroke-width:1.5}
  #joy .sec{fill:#1b2737;stroke:#3a5272;stroke-width:1.5}
  #joy .sec.on{fill:#2b5a99}
  #joy .knob{fill:#e8eef7;stroke:#fff;stroke-width:2;pointer-events:none}
  #joy .lab{position:absolute;transform:translate(-50%,-50%);background:#0e1116e6;border:1.5px solid #3a5272;border-radius:10px;padding:2px 6px;color:#f2f4f7;font-size:12px;font-weight:700;white-space:nowrap;line-height:1.25;text-align:center}
  #joy .lab b{display:block;font-size:16px;color:#8ec5ff}
  #joy.many .lab{font-size:10px;padding:1px 4px} #joy.many .lab b{font-size:13px}
  #joy .lab.on{border-color:#5b9bff;background:#20406eee}
  #joyGear{position:fixed;z-index:902;width:46px;height:46px;border-radius:50%;border:2px solid #3a5272;background:#1b2029;color:#c9d3e0;font-size:22px;padding:0;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;overflow:hidden}
  #joyGear.corner{top:calc(8px + env(safe-area-inset-top,0px));right:10px}
  /* 조이스틱 반대편 옆 (네모 판을 안 가리게) */
  #joyGear.L{right:10px;bottom:calc(${BOX/2-23}px + env(safe-area-inset-bottom,0px))}
  #joyGear.R{left:10px;bottom:calc(${BOX/2-23}px + env(safe-area-inset-bottom,0px))}
  #joyGear i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#ffd24a var(--p,0deg),transparent 0)}
  #joyGear span{position:relative;width:34px;height:34px;border-radius:50%;background:#1b2029;display:flex;align-items:center;justify-content:center}
  #joyGear.hold i{animation:joyHold ${HOLD/1000}s linear forwards}
  @property --p{syntax:'<angle>';inherits:false;initial-value:0deg}
  @keyframes joyHold{from{--p:0deg}to{--p:360deg}}
  #joyPanel{position:fixed;left:8px;right:8px;bottom:calc(${BOX+6}px + env(safe-area-inset-bottom,0px));z-index:901;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;border-radius:16px;background:#0e1116f2;border:1.5px solid #3a5272;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joyPanel .t{grid-column:1/-1;color:#8ec5ff;font-size:14px;font-weight:800}
  #joyPanel button{min-height:56px;border:2px solid transparent;border-radius:12px;background:#1b2029;color:#f2f4f7;font-size:20px;font-weight:800;padding:6px}
  .joyFlash{background:#2e7d32 !important;border-color:#7ee08a !important}
  #joySet{position:fixed;inset:0;z-index:950;background:#000b;display:none;align-items:center;justify-content:center;padding:12px}
  #joySet.on{display:flex}
  #joySet .box{background:#1b2029;color:#f2f4f7;border-radius:16px;padding:14px;width:min(440px,100%);max-height:94vh;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joySet h2{font-size:18px;margin:0 0 6px}
  #joySet p{font-size:13px;color:#9aa4b2;margin:0 0 10px;line-height:1.5}
  #joySet .g{border:1.5px solid #3a5272;border-radius:12px;padding:8px;margin:8px 0}
  #joySet .gh{display:flex;align-items:center;gap:6px}
  #joySet .gh b{min-width:22px;color:#8ec5ff;font-size:16px;text-align:center}
  #joySet input,#joySet textarea{font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1.5px solid #3a5272;background:#101722;color:#f2f4f7}
  #joySet .gh input{flex:1;min-width:0;font-weight:800}
  #joySet textarea{width:100%;margin-top:6px;resize:vertical;line-height:1.45}
  #joySet .gh button{width:36px;height:38px;border:0;border-radius:10px;background:#2a3340;color:#fff;font-size:15px;font-weight:800;flex:none}
  #joySet .gh button:disabled{opacity:.3}
  #joySet .gh button.x{background:#5a2226}
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
  svg.setAttribute("role","application"); svg.setAttribute("aria-label","조이스틱: 밀어서 말 묶음 고르기");
  const pt = (deg, r) => { const a = (deg-90)*Math.PI/180; return [r*Math.cos(a), r*Math.sin(a)]; };
  const wedge = (lo, hi) => { const [x1,y1] = pt(lo,R), [x2,y2] = pt(hi,R);
    return `M0 0 L${x1} ${y1} A${R} ${R} 0 ${hi-lo>180?1:0} 1 ${x2} ${y2} Z`; };
  const gSec = document.createElementNS(NS,"g"); svg.appendChild(gSec);
  const knob = document.createElementNS(NS,"circle"); knob.setAttribute("r",KNOB); knob.setAttribute("class","knob");
  svg.appendChild(knob); joy.appendChild(svg);
  let secs = [], labs = [];

  function drawJoy(){
    gSec.innerHTML = ""; secs = []; labs.forEach(d=>d.remove()); labs = [];
    // 호 밖 = 아무것도 안 바뀌는 자리 (어둡게)
    const dead = document.createElementNS(NS,"path"); dead.setAttribute("class","dead");
    dead.setAttribute("d", mirror() ? wedge(-ARC_FROM, 360-ARC_TO) : wedge(ARC_TO, ARC_FROM+360));
    gSec.appendChild(dead);
    const many = st.groups.length >= 6;
    joy.classList.toggle("many", many);
    st.groups.forEach((g,k)=>{
      const [lo,hi,c] = slot(k);
      const p = document.createElementNS(NS,"path"); p.setAttribute("d", wedge(lo,hi)); p.setAttribute("class","sec");
      gSec.appendChild(p); secs.push(p);
      const [x,y] = pt(c, R*0.74); const t = document.createElementNS(NS,"text");
      t.setAttribute("x",x); t.setAttribute("y",y+5); t.setAttribute("text-anchor","middle");
      t.setAttribute("fill","#9fb7d6"); t.setAttribute("font-size", many ? "12" : "14"); t.setAttribute("font-weight","800");
      t.style.pointerEvents="none"; t.textContent = k+1; gSec.appendChild(t);
      const d = document.createElement("div"); d.className = "lab"; d.title = g.name;
      const [lx,ly] = pt(c, R + (many ? 26 : 30)); d.style.left = (BOX/2+lx)+"px"; d.style.top = (BOX/2+ly)+"px";
      d.innerHTML = `<b>${k+1}</b>`; d.appendChild(document.createTextNode(cut(g.name, many ? 3 : 5)));
      joy.appendChild(d); labs.push(d);
    });
    paint();
  }
  function paint(){
    secs.forEach((p,i)=>p.classList.toggle("on", i===st.cur));
    labs.forEach((d,i)=>d.classList.toggle("on", i===st.cur));
  }

  // 설정 단추: 3초 꾹 눌러야 열린다 (형 그림 ②: 「3초 누르기(설정변경)」)
  const gear = document.createElement("button"); gear.id = "joyGear"; gear.type = "button";
  gear.setAttribute("aria-label","조이스틱 설정 (3초 꾹 누르기)"); gear.title = "3초 꾹 누르면 설정";
  gear.innerHTML = "<i></i><span>⚙</span>";
  const set = document.createElement("div"); set.id = "joySet";
  const panel = document.createElement("div"); panel.id = "joyPanel";

  // 네모 하나 누르면 바로 말한다 (기다림 없음, 짧게 초록으로 반짝)
  function tapWord(btn, w){
    say(w); buzz(15);
    btn.classList.add("joyFlash"); setTimeout(()=>btn.classList.remove("joyFlash"), 160);
  }
  function drawPanel(){
    if(!OWN_PANEL) return;
    const g = st.groups[st.cur];
    panel.innerHTML = `<div class="t">${st.cur+1} · ${esc(g.name)}</div>`;
    g.words.forEach(w=>{ const b = document.createElement("button"); b.type="button"; b.textContent = w;
      b.addEventListener("click", ()=>tapWord(b, w)); panel.appendChild(b); });
  }

  let pageOn = true;   // 페이지가 「지금은 조이스틱 화면이 아님」이라 하면 끈다
  const tell = (name, detail) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch(e){} };
  function render(){
    const side = st.hand === "right" ? "R" : "L";
    joy.className = side;
    gear.className = GEAR_MODE === "corner" ? "corner" : side;
    drawJoy(); drawPanel();
    const on = st.show && pageOn;
    joy.style.display = on ? "" : "none";
    panel.style.display = on && OWN_PANEL ? "" : "none";
    gear.style.display = pageOn ? "" : "none";
    document.body.classList.toggle("joy-on", on);
  }
  function setGroup(k){
    if(k < 0 || k === st.cur) return;
    st.cur = k; save(); buzz(10);
    paint(); drawPanel();
    tell("malhaejoy-group", { cur: k });
  }

  /* ── 밀기: 호 위로 미는 즉시 묶음이 바뀐다. 손 떼도 말하지 않는다 ── */
  let pid = null;
  function pick(deg){   // deg: 위=0, 시계방향, -180~180
    const n = st.groups.length, w = (ARC_TO - ARC_FROM) / n;
    const a = mirror() ? -deg : deg;
    if(a < ARC_FROM || a >= ARC_TO) return -1;      // 호 밖 = 안 바뀜
    return Math.min(n-1, Math.floor((a - ARC_FROM) / w));
  }
  function move(e){
    const b = svg.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width/2), dy = e.clientY - (b.top + b.height/2);
    const dist = Math.hypot(dx,dy), lim = R - KNOB*0.6;
    const k = dist > lim ? lim/dist : 1;
    knob.setAttribute("cx", dx*k); knob.setAttribute("cy", dy*k);
    if(dist < PUSH) return;
    let deg = Math.atan2(dy,dx)*180/Math.PI + 90; if(deg > 180) deg -= 360;
    setGroup(pick(deg));
  }
  function end(){ pid = null; knob.setAttribute("cx",0); knob.setAttribute("cy",0); }
  svg.addEventListener("pointerdown", e=>{
    if(pid !== null) return;
    pid = e.pointerId; try { svg.setPointerCapture(pid); } catch(_){}
    e.preventDefault(); move(e);
  });
  svg.addEventListener("pointermove", e=>{ if(e.pointerId === pid){ e.preventDefault(); move(e); } });
  svg.addEventListener("pointerup", e=>{ if(e.pointerId === pid) end(); });
  svg.addEventListener("pointercancel", e=>{ if(e.pointerId === pid) end(); });
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
  function readDraft(){
    set.querySelectorAll(".g").forEach((el,i)=>{
      draft[i] = { name: el.querySelector("input").value, words: el.querySelector("textarea").value.split("\n") };
    });
  }
  function drawSet(){
    const n = draft.length;
    set.innerHTML = `<div class="box" role="dialog" aria-label="조이스틱 설정">
      <h2>🕹️ 조이스틱 설정</h2>
      <p>방향 하나 = 말 묶음 하나. 엄지가 미는 쪽(왼쪽 위 → 오른쪽 아래)을 묶음 수만큼 나눕니다.<br>
      밀면 바로 위 네모가 그 묶음으로 바뀌고, 네모를 누르면 말합니다. 묶음 최대 ${MAXG}개, 묶음 안 말은 <b>한 줄에 하나</b>, 최대 ${MAXW}개.</p>
      ${draft.map((g,i)=>`<div class="g"><div class="gh"><b>${i+1}</b><input type="text" maxlength="20" placeholder="묶음 이름" value="${esc(g.name)}">
        <button type="button" data-up="${i}" ${i===0?"disabled":""} aria-label="위로">▲</button>
        <button type="button" data-dn="${i}" ${i===n-1?"disabled":""} aria-label="아래로">▼</button>
        <button type="button" class="x" data-del="${i}" ${n<=1?"disabled":""} aria-label="묶음 지우기">✕</button></div>
        <textarea rows="${Math.max(3, Math.min(MAXW, g.words.length))}" placeholder="한 줄에 말 하나">${esc(g.words.join("\n"))}</textarea></div>`).join("")}
      <div class="row"><button type="button" class="add" ${n>=MAXG?"disabled":""}>＋ 묶음 추가 (${n}/${MAXG})</button></div>
      <p style="margin-top:14px">조이스틱</p>
      <div class="row"><button type="button" data-v="1" class="${vis?"on":""}">보이기</button><button type="button" data-v="0" class="${vis?"":"on"}">숨기기</button></div>
      <p style="margin-top:12px">놓는 자리</p>
      <div class="row"><button type="button" data-h="left" class="${hand==="left"?"on":""}">왼쪽 아래</button><button type="button" data-h="right" class="${hand==="right"?"on":""}">오른쪽 아래 (좌우 반전)</button></div>
      <div class="row"><button type="button" class="rst">처음대로</button><button type="button" class="cn">닫기</button><button type="button" class="ok">저장</button></div>
    </div>`;
  }
  function openSet(){ draft = copy(st.groups); hand = st.hand; vis = st.show; drawSet(); set.classList.add("on"); }
  set.addEventListener("click", e=>{
    const t = e.target.closest ? (e.target.closest("button") || e.target) : e.target;
    if(t === set || t.classList.contains("cn")){ set.classList.remove("on"); return; }
    if(t.tagName !== "BUTTON") return;
    readDraft();
    const d = t.dataset;
    if(d.up){ const i=+d.up; [draft[i-1],draft[i]] = [draft[i],draft[i-1]]; }
    else if(d.dn){ const i=+d.dn; [draft[i+1],draft[i]] = [draft[i],draft[i+1]]; }
    else if(d.del){ if(draft.length > 1) draft.splice(+d.del,1); }
    else if(t.classList.contains("add")){ if(draft.length < MAXG) draft.push({ name:"", words:[] }); }
    else if(d.h){ hand = d.h; }
    else if(d.v){ vis = d.v === "1"; }
    else if(t.classList.contains("rst")){ draft = copy(DEFAULT); }
    else if(t.classList.contains("ok")){
      const g = clean(draft); st.groups = g.length ? g : copy(DEFAULT);
      if(st.cur >= st.groups.length) st.cur = 0;
      st.hand = hand; st.show = vis; save(); render(); set.classList.remove("on");
      tell("malhaejoy-group", { cur: st.cur });
      return;
    }
    drawSet();
    if(t.classList.contains("add")){ const ins = set.querySelectorAll(".g input"); ins[ins.length-1].focus(); }
  });

  function mount(){
    document.body.appendChild(joy); document.body.appendChild(gear);
    if(OWN_PANEL) document.body.appendChild(panel);
    document.body.appendChild(set);
    render();
  }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.malhaeJoy = {
    groups: ()=>copy(st.groups),
    cur: ()=>st.cur,
    group: ()=>({ n: st.cur, name: st.groups[st.cur].name, words: st.groups[st.cur].words.slice() }),
    tapWord,
    say,
    setPage: on=>{ pageOn = !!on; if(document.body) render(); },
    openSettings: openSet
  };
})();
