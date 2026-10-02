/* 말해요 · 조이스틱 + 호 띠 (2026-10-02 형이 장인어른 댁에서 그려 보낸 두 번째 그림)
   아래 왼쪽에 조이스틱 동그라미, 그 둘레를 크게 감싸는 「호 모양 띠」(왼쪽 위 → 위 → 오른쪽 → 오른쪽 아래).
   띠의 칸 하나하나가 곧 말이다. 위의 큰 네모 판은 없앴다.

   역할 나누기 (형 15:38 「조이스틱은 말 묶음 → 다른 말 묶음으로 바꿀 수 있게」):
   ① 조이스틱 = 묶음 바꾸기 전용. 손잡이를 밀면(방향 = 묶음) 띠의 말 칸이 즉시 그 묶음 말로 바뀐다.
      엄지로 쓸면 묶음이 차례로 바뀌고 바뀔 때마다 진동 톡. 조이스틱으로는 말하지 않는다.
      조금만 건드린 건(PUSH 미만) 무시 — 실수 줄이기.
   ② 띠 칸 톡 → 바로 말한다 (기다림 0).
   - 설정은 ⚙ 3초 꾹 (장인어른이 실수로 못 바꾸게): 칸 추가/삭제(4~8)·글 고치기·순서·묶음·좌우.
   - 옛 묶음(malhae_joy2)은 지우지 않고 「기본」 묶음 뒤에 이어 붙인다.
   말하기는 페이지의 기존 함수(window.malhaeSpeak)를 그대로 쓴다. */
(function(){
  "use strict";
  const KEY = "malhae_joy3", OLD = "malhae_joy2";
  const MINW = 4, MAXW = 8, MAXG = 8;
  // 형이 준 말 — 첫 칸 「침」 (형 그림 그대로)
  const FIRST = { name: "기본", words: ["침", "머리", "아니야", "오케이", "사람 불러주세요", "물"] };
  const OLD_DEFAULT = [
    { name: "머리", words: ["머리", "머리 아파", "머리 긁어줘", "머리 올려줘", "베개"] },
    { name: "침",   words: ["침", "침 닦아줘", "석션", "입안 닦아줘", "물"] },
    { name: "대답", words: ["아니야", "오케이", "응", "잠깐"] },
    { name: "사람", words: ["사람 불러주세요", "여보", "와봐", "고마워"] }
  ];

  // ── 그림 좌표 (설계 상자 390×452, 화면에 맞춰 줄이고 늘림). 각도: 위=0°, 시계방향 ──
  const VW = 390, VH = 452;
  const CX = 150, CY = 240;       // 조이스틱 가운데
  const RB = 92, RK = 36;         // 바탕 원, 손잡이
  const RI = 120, RO = 232;       // 띠 안쪽·바깥 반지름
  const A0 = -40, A1 = 128;       // 말 칸들이 놓이는 호
  const G0 = -40, G1 = 150;       // 조이스틱: 이 호 안을 묶음 수만큼 나눔 (방향 = 묶음)
  const PUSH = 46;                // 이만큼 밀어야 묶음이 바뀐다 (바탕 원 반지름의 반)
  const HOLD = 3000;
  const ME = document.currentScript;
  const GEAR_MODE = (ME && ME.dataset.gear) || "joy";

  const copy = g => g.map(x=>({ name: x.name, words: x.words.slice() }));
  function clean(gs){
    return (Array.isArray(gs) ? gs : []).map(g=>{
      const words = (g && Array.isArray(g.words) ? g.words : []).filter(w=>typeof w==="string" && w.trim()).map(w=>w.trim()).slice(0,MAXW);
      let name = g && typeof g.name==="string" ? g.name.trim() : "";
      if(!name) name = words[0] || "";
      return { name, words };
    }).filter(g=>g.words.length).slice(0,MAXG);
  }
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch(e){ return null; } };
  function load(){
    const s = read(KEY);
    if(s){
      const groups = clean(s.groups);
      if(groups.length){
        const cur = Number.isInteger(s.cur) && s.cur >= 0 && s.cur < groups.length ? s.cur : 0;
        return { groups, cur, show: s.show !== false, hand: s.hand === "right" ? "right" : "left" };
      }
    }
    // 처음: 「기본」 + 예전 묶음 이어 쓰기
    const o = read(OLD) || {};
    const old = clean(o.groups);
    return { groups: [copy([FIRST])[0], ...(old.length ? old : copy(OLD_DEFAULT))].slice(0,MAXG), cur: 0,
             show: o.show !== false, hand: o.hand === "right" ? "right" : "left" };
  }
  let st = load();
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(st)); } catch(e){} }
  const mirror = () => st.hand === "right";

  function fallbackSpeak(t){
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t); u.lang="ko-KR"; u.rate=.95;
      const v = speechSynthesis.getVoices().find(v=>/ko/i.test(v.lang)); if(v) u.voice=v;
      speechSynthesis.speak(u);
    }catch(e){}
  }
  const tell = (name, detail) => { try { window.dispatchEvent(new CustomEvent(name, { detail })); } catch(e){} };
  function say(t){
    if(typeof window.malhaeSpeak === "function") window.malhaeSpeak(t); else fallbackSpeak(t);
    tell("malhaejoy-said", { text: t });
  }
  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };
  const esc = t => String(t).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  // 각도 → 점 (반전 반영)
  const P = (deg, r) => { const a = (mirror() ? -deg : deg); const t = (a-90)*Math.PI/180;
    return [CX2() + r*Math.cos(t), CY + r*Math.sin(t)]; };
  const CX2 = () => mirror() ? VW - CX : CX;
  function ring(lo, hi, ri, ro){
    const [a,b] = P(lo,ro), [c,d] = P(hi,ro), [e,f] = P(hi,ri), [g,h] = P(lo,ri);
    const big = hi-lo > 180 ? 1 : 0, sw = mirror() ? 0 : 1;
    return `M${a} ${b} A${ro} ${ro} 0 ${big} ${sw} ${c} ${d} L${e} ${f} A${ri} ${ri} 0 ${big} ${1-sw} ${g} ${h} Z`;
  }
  const wedge = (lo, hi, r) => { const [a,b] = P(lo,r), [c,d] = P(hi,r);
    return `M${CX2()} ${CY} L${a} ${b} A${r} ${r} 0 ${hi-lo>180?1:0} ${mirror()?0:1} ${c} ${d} Z`; };

  // 칸 안에 글자를 가장 크게 (줄 나누기 시도해서 고름)
  function fit(text, w, h, maxF){
    const words = text.split(/\s+/).filter(Boolean);
    let best = { f: 0, s: 0, lines: [text] };
    const total = text.replace(/\s/g,"").length;
    for(let m = total; m >= 1; m--){
      const lines = []; let cur = "", broke = false;
      words.forEach(wd=>{
        while(wd.length > m){ broke = true; if(cur){ lines.push(cur); cur=""; } lines.push(wd.slice(0,m)); wd = wd.slice(m); }
        if(!cur) cur = wd; else if((cur+" "+wd).replace(/\s/g,"").length <= m) cur += " "+wd; else { lines.push(cur); cur = wd; }
      });
      if(cur) lines.push(cur);
      const wide = Math.max(...lines.map(l=>l.replace(/\s/g,"").length + (l.split(" ").length-1)*0.3));
      const f = Math.min(maxF, w/wide, h/(lines.length*1.15));
      const score = broke ? f*0.55 : f;   // 낱말 가운데서 끊는 건 되도록 피함 (아니/야 X)
      if(score > best.s + 0.5) best = { f, lines, s: score };
    }
    return best;
  }

  const css = `
  #joy{position:fixed;bottom:env(safe-area-inset-bottom,0px);left:0;right:0;margin:0 auto;z-index:900;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joy,#joy svg{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  #joy svg{display:block;width:100%;height:100%;overflow:visible}
  #joy .hit{pointer-events:auto;touch-action:none;cursor:pointer}
  #joy .cell{fill:#1d2a3c;stroke:#0e1116;stroke-width:4}
  #joy .cell.on{fill:#f5c518}
  #joy .cell.done{fill:#2e9d4a}
  #joy .ct{fill:#fff;font-weight:900;pointer-events:none}
  #joy .ct.on{fill:#111}
  #joy .gn{fill:#8ec5ff;font-weight:900;pointer-events:none}
  #joy .gn2{fill:#cfe2ff;font-weight:800;pointer-events:none}
  #joy .sn{fill:#9fb7d6;font-weight:900;pointer-events:none}
  #joy .kt{fill:#1b2a3c;font-weight:900;pointer-events:none}
  #joy .base{fill:#111821;stroke:#5b7fae;stroke-width:3}
  #joy .sec{fill:#1d2a3c;stroke:#3a5272;stroke-width:1.5;pointer-events:none}
  #joy .sec.on{fill:#5b9bff}
  #joy .dead{fill:#0b0e13;pointer-events:none}
  #joy .knob{fill:#e8eef7;stroke:#fff;stroke-width:3;pointer-events:none;filter:drop-shadow(0 3px 4px #000c)}
  #joyGear{position:fixed;z-index:902;width:46px;height:46px;border-radius:50%;border:2px solid #3a5272;background:#1b2029;color:#c9d3e0;font-size:22px;padding:0;display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;overflow:hidden}
  #joyGear.corner{top:calc(8px + env(safe-area-inset-top,0px));right:10px}
  #joyGear.L{right:6px;bottom:calc(6px + env(safe-area-inset-bottom,0px))}
  #joyGear.R{left:6px;bottom:calc(6px + env(safe-area-inset-bottom,0px))}
  #joyGear i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#ffd24a var(--p,0deg),transparent 0)}
  #joyGear span{position:relative;width:34px;height:34px;border-radius:50%;background:#1b2029;display:flex;align-items:center;justify-content:center}
  #joyGear.hold i{animation:joyHold ${HOLD/1000}s linear forwards}
  @property --p{syntax:'<angle>';inherits:false;initial-value:0deg}
  @keyframes joyHold{from{--p:0deg}to{--p:360deg}}
  body.joy-on{padding-bottom:var(--joyH,0px)}
  html:has(body.joy-on),body.joy-on{overflow:hidden;overscroll-behavior:none;position:fixed;inset:0;width:100%}
  #joySet{position:fixed;inset:0;z-index:950;background:#000b;display:none;align-items:center;justify-content:center;padding:12px}
  #joySet.on{display:flex}
  #joySet .box{background:#1b2029;color:#f2f4f7;border-radius:16px;padding:14px;width:min(440px,100%);max-height:94vh;overflow:auto;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
  #joySet h2{font-size:18px;margin:0 0 6px}
  #joySet p{font-size:13px;color:#9aa4b2;margin:0 0 10px;line-height:1.5}
  #joySet .tabs{display:flex;gap:6px;flex-wrap:wrap}
  #joySet .tabs button{padding:8px 12px;border:2px solid transparent;border-radius:999px;background:#2a3340;color:#fff;font-size:15px;font-weight:800}
  #joySet .tabs button.on{border-color:#5b9bff;background:#12233a;color:#8ec5ff}
  #joySet .w{display:flex;align-items:center;gap:6px;margin:6px 0}
  #joySet .w b{min-width:22px;color:#8ec5ff;font-size:16px;text-align:center}
  #joySet input{font:inherit;font-size:17px;padding:9px;border-radius:10px;border:1.5px solid #3a5272;background:#101722;color:#f2f4f7;flex:1;min-width:0;font-weight:700}
  #joySet .w button{width:38px;height:40px;border:0;border-radius:10px;background:#2a3340;color:#fff;font-size:15px;font-weight:800;flex:none}
  #joySet .w button:disabled{opacity:.3}
  #joySet .w button.x{background:#5a2226}
  #joySet .row{display:flex;gap:8px;margin-top:12px}
  #joySet .row button{flex:1;padding:12px;border:0;border-radius:12px;font-size:15px;font-weight:800;background:#2a3340;color:#fff}
  #joySet .row button.on{background:#1565c0}
  #joySet .row button.ok{background:#2e7d32}
  #joySet .row button.x{background:#5a2226}
  #joySet .row button:disabled{opacity:.35}
  `;
  const style = document.createElement("style"); style.textContent = css; document.head.appendChild(style);

  const NS = "http://www.w3.org/2000/svg";
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag);
    for(const k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; };
  const joy = document.createElement("div"); joy.id = "joy";
  const svg = mk("svg", { viewBox: `0 0 ${VW} ${VH}`, role: "application", "aria-label": "조이스틱과 말 칸" });
  joy.appendChild(svg);
  let cells = [], texts = [], secs = [], knob = null, kTxt = null;

  function cellAng(k){ const n = words().length, w = (A1-A0)/n; return [A0+k*w, A0+(k+1)*w]; }
  function grpAng(k){ const n = st.groups.length, w = (G1-G0)/n; return [G0+k*w, G0+(k+1)*w]; }
  const words = () => st.groups[st.cur].words;

  // 띠(말 칸)만 다시 그리기 — 묶음 바뀔 때마다
  const gBand = mk("g", {}, svg), gJoy = mk("g", {}, svg);
  function drawBand(){
    gBand.innerHTML = ""; cells = []; texts = [];
    words().forEach((w,k)=>{
      const [lo,hi] = cellAng(k);
      const p = mk("path", { d: ring(lo,hi,RI,RO), class: "cell hit", "data-k": k, role: "button", "aria-label": w }, gBand);
      p.addEventListener("pointerdown", cellDown);
      cells.push(p);
      const mid = (lo+hi)/2, rm = (RI+RO)/2 + 6;
      const [x,y] = P(mid, rm);
      const chord = 2*rm*Math.sin((hi-lo)/2*Math.PI/180);
      const fz = fit(w, Math.min(chord, RO-RI) - 10, RO-RI-30, 42);
      const t = mk("text", { x, y: y - (fz.lines.length-1)*fz.f*1.15/2 + fz.f*0.36, "text-anchor": "middle", class: "ct", "font-size": fz.f.toFixed(1) }, gBand);
      fz.lines.forEach((l,i)=>{ const s = mk("tspan", { x, dy: i ? (fz.f*1.15).toFixed(1) : 0 }, t); s.textContent = l; });
      texts.push(t);
    });
    // 띠 끝: 지금 묶음 이름 (크게)
    const [x,y] = P(141, (RI+RO)/2+4);
    const a = mk("text", { x, y: y-8, "text-anchor": "middle", class: "gn", "font-size": 30 }, gBand); a.textContent = st.cur+1;
    const b = mk("text", { x, y: y+18, "text-anchor": "middle", class: "gn2", "font-size": 17 }, gBand);
    b.textContent = st.groups[st.cur].name.length > 4 ? st.groups[st.cur].name.slice(0,4) : st.groups[st.cur].name;
  }
  // 조이스틱: 바탕을 묶음 수만큼 나눔 (방향 = 묶음)
  function drawJoy(){
    gJoy.innerHTML = ""; secs = [];
    mk("circle", { cx: CX2(), cy: CY, r: RB, class: "base" }, gJoy);
    mk("path", { d: wedge(G1, G0+360, RB-3), class: "dead" }, gJoy);
    st.groups.forEach((g,k)=>{
      const [lo,hi] = grpAng(k);
      secs.push(mk("path", { d: wedge(lo,hi,RB-3), class: "sec" }, gJoy));
      const [x,y] = P((lo+hi)/2, RB-17);
      const t = mk("text", { x, y: y+6, "text-anchor": "middle", class: "sn", "font-size": 16 }, gJoy); t.textContent = k+1;
    });
    knob = mk("circle", { cx: CX2(), cy: CY, r: RK, class: "knob" }, gJoy);
    kTxt = mk("text", { x: CX2(), y: CY+10, "text-anchor": "middle", class: "kt", "font-size": 28 }, gJoy);
    const grab = mk("circle", { cx: CX2(), cy: CY, r: RB, fill: "transparent", class: "hit" }, gJoy);
    grab.addEventListener("pointerdown", joyDown);
    paintJoy();
  }
  function paintJoy(){
    secs.forEach((s,i)=>s.classList.toggle("on", i===st.cur));
    if(kTxt) kTxt.textContent = st.cur+1;
  }
  function draw(){ drawBand(); drawJoy(); }

  function lit(k){ cells.forEach((c,i)=>{ c.classList.toggle("on", i===k); texts[i].classList.toggle("on", i===k); }); }
  function fire(k){
    if(k < 0 || !cells[k]) return;
    say(words()[k]); buzz(25);
    const c = cells[k]; c.classList.add("done");
    setTimeout(()=>c.classList.remove("done"), 220);
  }
  function setGroup(k){
    if(k < 0 || k === st.cur) return;
    st.cur = k; save(); buzz(15);
    drawBand(); paintJoy();
    tell("malhaejoy-group", { cur: k });
  }

  function local(e){
    const b = svg.getBoundingClientRect(), s = b.width / VW;
    return [(e.clientX - b.left)/s, (e.clientY - b.top)/s];
  }
  function angleOf(x, y){
    let deg = Math.atan2(y-CY, x-CX2())*180/Math.PI + 90; if(deg > 180) deg -= 360;
    return mirror() ? -deg : deg;
  }
  const inArc = (a, lo, hi, n) => a >= lo && a < hi ? Math.min(n-1, Math.floor((a-lo)/((hi-lo)/n))) : -1;

  /* ① 조이스틱 = 묶음 바꾸기 전용. 미는 즉시 띠가 그 묶음 말로. 말은 안 한다 (형 15:38) */
  let pid = null, mode = null, tapK = -1;
  function joyMove(e){
    const [x,y] = local(e), dx = x-CX2(), dy = y-CY, dist = Math.hypot(dx,dy), lim = RB-RK*0.4;
    const k = dist > lim ? lim/dist : 1;
    knob.setAttribute("cx", CX2()+dx*k); knob.setAttribute("cy", CY+dy*k);
    kTxt.setAttribute("x", CX2()+dx*k); kTxt.setAttribute("y", CY+dy*k+10);
    if(dist < PUSH) return;                                     // 짧게 건드린 건 무시
    setGroup(inArc(angleOf(x,y), G0, G1, st.groups.length));   // 쓸면 차례로 바뀜 (칸마다 진동)
  }
  function joyDown(e){
    if(pid !== null) return;
    pid = e.pointerId; mode = "joy"; try { svg.setPointerCapture(pid); } catch(_){}
    if(e.cancelable !== false) e.preventDefault(); joyMove(e);
  }
  /* ② 띠 칸 톡 = 바로 말함. 누르면 밝아지고, 뗄 때 그 칸 위면 말함 */
  function cellAt(e){
    const [x,y] = local(e), r = Math.hypot(x-CX2(), y-CY);
    if(r < RI-6 || r > RO+10) return -1;
    return inArc(angleOf(x,y), A0, A1, words().length);
  }
  function cellDown(e){
    if(pid !== null) return;
    pid = e.pointerId; mode = "tap"; try { svg.setPointerCapture(pid); } catch(_){}
    e.preventDefault(); e.stopPropagation();
    tapK = +e.currentTarget.dataset.k; lit(tapK);
  }
  function onMove(e){
    if(e.pointerId !== pid) return; if(e.cancelable) e.preventDefault();
    if(mode === "joy") joyMove(e);
    else { const k = cellAt(e); if(k !== tapK){ tapK = k; lit(k); } }
  }
  function finish(e, ok){
    if(e.pointerId !== pid) return;
    const k = tapK, m = mode; pid = null; mode = null; tapK = -1;
    if(knob){ knob.setAttribute("cx", CX2()); knob.setAttribute("cy", CY); kTxt.setAttribute("x", CX2()); kTxt.setAttribute("y", CY+10); }
    lit(-1);
    if(ok && m === "tap") fire(k);
  }
  // 실기기(갤럭시·삼성 인터넷) 대비: 손가락이 그림 밖으로 나가도 놓치지 않게 window 에서 받는다
  if(window.PointerEvent){
    addEventListener("pointermove", onMove, { passive: false });
    addEventListener("pointerup", e=>finish(e, true));
    addEventListener("pointercancel", e=>finish(e, false));
  } else {
    // 포인터 이벤트가 없는 옛 브라우저: 터치로 대신
    const fake = (t, el, ev) => ({ pointerId: "t"+t.identifier, clientX: t.clientX, clientY: t.clientY, currentTarget: el,
      cancelable: true, preventDefault: ()=>ev.preventDefault(), stopPropagation: ()=>{} });
    svg.addEventListener("touchstart", ev=>{
      const t = ev.changedTouches[0], el = ev.target.closest ? ev.target.closest(".hit") : null; if(!el) return;
      ev.preventDefault();
      if(el.classList.contains("cell")) cellDown(fake(t, el, ev)); else joyDown(fake(t, el, ev));
    }, { passive: false });
    addEventListener("touchmove", ev=>{ [...ev.changedTouches].forEach(t=>onMove(fake(t, null, ev))); }, { passive: false });
    addEventListener("touchend", ev=>{ [...ev.changedTouches].forEach(t=>finish(fake(t, null, ev), true)); });
    addEventListener("touchcancel", ev=>{ [...ev.changedTouches].forEach(t=>finish(fake(t, null, ev), false)); });
  }
  // 브라우저가 끌기를 스크롤·뒤로가기 몸짓으로 가로채지 못하게
  svg.addEventListener("touchstart", ev=>{ if(ev.target.closest && ev.target.closest(".hit")) ev.preventDefault(); }, { passive: false });
  svg.addEventListener("touchmove", ev=>{ if(pid !== null || (ev.target.closest && ev.target.closest(".hit"))) ev.preventDefault(); }, { passive: false });
  svg.addEventListener("contextmenu", e=>e.preventDefault());

  /* ── 설정: ⚙ 3초 꾹 ── */
  const gear = document.createElement("button"); gear.id = "joyGear"; gear.type = "button";
  gear.setAttribute("aria-label","조이스틱 설정 (3초 꾹 누르기)"); gear.title = "3초 꾹 누르면 설정";
  gear.innerHTML = "<i></i><span>⚙</span>";
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

  const set = document.createElement("div"); set.id = "joySet";
  let draft = [], dg = 0, hand = st.hand, vis = st.show;
  function readDraft(){
    const g = draft[dg]; if(!g) return;
    const nm = set.querySelector("input.gn"); if(nm) g.name = nm.value;
    g.words = [...set.querySelectorAll("input.wd")].map(i=>i.value);
  }
  function drawSet(){
    const g = draft[dg], n = g.words.length, G = draft.length;
    set.innerHTML = `<div class="box" role="dialog" aria-label="조이스틱 설정">
      <h2>🕹️ 말 칸 고치기</h2>
      <p>띠의 칸 = 말 하나. 위에서부터 왼쪽 위 → 오른쪽 아래 순서. 칸은 ${MINW}~${MAXW}개.<br>
      조이스틱을 밀면 묶음이 바뀌고(방향 = 묶음), 칸을 톡 누르면 말합니다.</p>
      <div class="tabs">${draft.map((x,i)=>`<button type="button" data-g="${i}" class="${i===dg?"on":""}">${i+1}. ${esc(x.name||"(이름)")}</button>`).join("")}</div>
      <div class="w"><b>묶음</b><input class="gn" type="text" maxlength="20" placeholder="묶음 이름" value="${esc(g.name)}"></div>
      ${g.words.map((w,i)=>`<div class="w"><b>${i+1}</b><input class="wd" type="text" maxlength="30" placeholder="말" value="${esc(w)}">
        <button type="button" data-up="${i}" ${i===0?"disabled":""} aria-label="앞으로">▲</button>
        <button type="button" data-dn="${i}" ${i===n-1?"disabled":""} aria-label="뒤로">▼</button>
        <button type="button" class="x" data-del="${i}" ${n<=MINW?"disabled":""} aria-label="칸 지우기">✕</button></div>`).join("")}
      <div class="row"><button type="button" class="add" ${n>=MAXW?"disabled":""}>＋ 칸 추가 (${n}/${MAXW})</button></div>
      <div class="row"><button type="button" class="gadd" ${G>=MAXG?"disabled":""}>＋ 묶음 추가</button><button type="button" class="gdel x" ${G<=1?"disabled":""}>이 묶음 지우기</button></div>
      <p style="margin-top:14px">조이스틱</p>
      <div class="row"><button type="button" data-v="1" class="${vis?"on":""}">보이기</button><button type="button" data-v="0" class="${vis?"":"on"}">숨기기</button></div>
      <p style="margin-top:12px">놓는 자리</p>
      <div class="row"><button type="button" data-h="left" class="${hand==="left"?"on":""}">왼손 (왼쪽 아래)</button><button type="button" data-h="right" class="${hand==="right"?"on":""}">오른손 (좌우 반전)</button></div>
      <p style="margin-top:12px">🚨 아무 데나 손가락을 움직이지 않고 2초 누르고 있으면 긴급 알람이 울립니다. 「멈춤」을 누르면 꺼집니다.</p>
      <div class="row"><button type="button" class="rst">처음대로</button><button type="button" class="cn">닫기</button><button type="button" class="ok">저장</button></div>
    </div>`;
  }
  function openSet(){ draft = copy(st.groups); dg = st.cur; hand = st.hand; vis = st.show; drawSet(); set.classList.add("on"); }
  set.addEventListener("click", e=>{
    const t = e.target.closest ? (e.target.closest("button") || e.target) : e.target;
    if(t === set || t.classList.contains("cn")){ set.classList.remove("on"); return; }
    if(t.tagName !== "BUTTON") return;
    readDraft();
    const d = t.dataset, W = draft[dg].words;
    if(d.g){ dg = +d.g; }
    else if(d.up){ const i=+d.up; [W[i-1],W[i]] = [W[i],W[i-1]]; }
    else if(d.dn){ const i=+d.dn; [W[i+1],W[i]] = [W[i],W[i+1]]; }
    else if(d.del){ if(W.length > MINW) W.splice(+d.del,1); }
    else if(t.classList.contains("add")){ if(W.length < MAXW) W.push(""); }
    else if(t.classList.contains("gadd")){ if(draft.length < MAXG){ draft.push({ name:"", words:["","","",""] }); dg = draft.length-1; } }
    else if(t.classList.contains("gdel")){ if(draft.length > 1){ draft.splice(dg,1); dg = Math.min(dg, draft.length-1); } }
    else if(d.h){ hand = d.h; }
    else if(d.v){ vis = d.v === "1"; }
    else if(t.classList.contains("rst")){ draft = [copy([FIRST])[0], ...copy(OLD_DEFAULT)]; dg = 0; }
    else if(t.classList.contains("ok")){
      const g = clean(draft); st.groups = g.length ? g : [copy([FIRST])[0]];
      st.cur = Math.min(dg, st.groups.length-1);
      st.hand = hand; st.show = vis; save(); render(); set.classList.remove("on");
      tell("malhaejoy-group", { cur: st.cur });
      return;
    }
    drawSet();
    if(t.classList.contains("add")){ const ins = set.querySelectorAll("input.wd"); ins[ins.length-1].focus(); }
  });

  // 화면 크기에 맞추기: 폭에 꽉, 높이는 화면의 60%까지
  function size(){
    const s = Math.min(innerWidth / VW, innerHeight*0.6 / VH);
    joy.style.width = (VW*s)+"px"; joy.style.height = (VH*s)+"px";
    document.body.style.setProperty("--joyH", (VH*s+4)+"px");
  }
  let pageOn = true;
  function render(){
    gear.className = GEAR_MODE === "corner" ? "corner" : (mirror() ? "R" : "L");
    draw(); size();
    const on = st.show && pageOn;
    joy.style.display = on ? "" : "none";
    gear.style.display = pageOn ? "" : "none";
    document.body.classList.toggle("joy-on", on);
  }
  function mount(){
    document.body.appendChild(joy); document.body.appendChild(gear); document.body.appendChild(set);
    render(); addEventListener("resize", size);
  }
  if(document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.malhaeJoy = {
    groups: ()=>copy(st.groups),
    cur: ()=>st.cur,
    group: ()=>({ n: st.cur, count: st.groups.length, name: st.groups[st.cur].name, words: st.groups[st.cur].words.slice() }),
    say,
    setPage: on=>{ pageOn = !!on; if(document.body) render(); },
    openSettings: openSet
  };
})();
