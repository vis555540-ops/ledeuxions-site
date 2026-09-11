// 소리.js — 소리/*.mp3 (v4 이름 그대로). 없으면 WebAudio 임시음.
// v4 파일: 누름 들임 배경_목장 배경_첫화면 양 이김 짐 짖기 짖기_보더콜리 짖기_골든리트리버
// 새 파일(친구 I): 호루라기 늑대 코인 뼈다귀 뽑기 별
const 소리 = {
  ctx:null, 캐시:{}, 배경:null, 배경이름:"",
  켜기() { if (!소리.ctx) { try { 소리.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } if (소리.ctx && 소리.ctx.state==="suspended") 소리.ctx.resume(); },
  파일(이름) {
    if (소리.캐시[이름] !== undefined) return 소리.캐시[이름];
    const a = new Audio("소리/"+이름+".mp3"); a.preload="auto";
    a.addEventListener("error", ()=>{ 소리.캐시[이름]=null; });
    소리.캐시[이름] = a; return a;
  },
  재생(이름, 견종) {
    if (!저장.자료 || !저장.자료.설정.효과음) return;
    let 파일이름 = 이름;
    if (이름==="짖기" && 견종) { const f=소리.파일("짖기_"+견종); if (f) { try { const c=f.cloneNode(); c.volume=0.8; c.play().catch(()=>소리.짖기합성(견종)); return; } catch(e){} } 소리.짖기합성(견종); return; }
    const a = 소리.파일(파일이름);
    if (a) { try { const c=a.cloneNode(); c.volume=0.8; c.play().catch(()=>소리.임시(이름,견종)); } catch(e){ 소리.임시(이름,견종); } }
    else 소리.임시(이름,견종);
  },
  짖기합성(견종) { const [f1,f2]=견종표[견종].짖음; 소리.삑(f1,0.07,"square"); setTimeout(()=>소리.삑(f2,0.09,"square"),70); },
  삑(f,d,t,올림) {
    소리.켜기(); const c=소리.ctx; if (!c) return;
    const o=c.createOscillator(), g=c.createGain(); o.type=t; o.frequency.value=f;
    if (올림) o.frequency.linearRampToValueAtTime(f*올림, c.currentTime+d);
    g.gain.value=0.15; g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+d);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+d);
  },
  임시(이름, 견종) {
    const 표 = { 양:[330,0.15,"triangle"], 들임:[660,0.08,"square",1.5], 별:[880,0.12,"sine",1.5],
      누름:[440,0.04,"square"], 해금:[523,0.3,"sine",1.5], 짐:[150,0.3,"sawtooth",0.5], 호루라기:[1500,0.2,"sine"],
      늑대:[110,0.3,"sawtooth"], 코인:[988,0.06,"square"], 뼈다귀:[740,0.1,"triangle"], 뽑기:[600,0.25,"sine",1.3], 이김:[784,0.2,"sine",1.5] };
    const [f,d,t,r] = 표[이름]||[440,0.05,"square"]; 소리.삑(f,d,t,r);
  },
  배경음(이름) { // "첫화면" | "목장"
    if (소리.배경이름===이름) return; 소리.배경음_끔(); 소리.배경이름=이름;
    if (!저장.자료.설정.배경음) return;
    const a = new Audio("소리/배경_"+이름+".mp3"); a.loop=true; a.volume=0.4;
    a.addEventListener("error", ()=>{ 소리.배경=null; });
    a.play().catch(()=>{}); 소리.배경=a;
  },
  배경음_끔() { if (소리.배경) { 소리.배경.pause(); 소리.배경=null; } 소리.배경이름=""; },
  배경음_멈춤() { if (소리.배경) 소리.배경.pause(); },
  배경음_재개() { if (소리.배경 && 저장.자료.설정.배경음) 소리.배경.play().catch(()=>{}); },
  진동(ms) { if (저장.자료 && 저장.자료.설정.진동 && navigator.vibrate) navigator.vibrate(ms); },
};
