// 저장.js — localStorage 한 키. 값 바뀔 때마다 저장하기().
const 저장 = {
  키: "양몰이_v5",
  자료: null,
  기본() {
    return {
      판, 코인:0, 뼈다귀:0, 별:[], 최고탄:0, 돌아온양:0,
      개:[ 저장.새개("보더콜리", 0) ], 선택개:"보더콜리_0",
      출석:{ 연속:0, 마지막:"" }, 광고:{ 날:"", 횟수:0 }, 교배:{ 완료시각:0 },
      인트로봄:false, 언어:(navigator.language||"ko").startsWith("ko")?"ko":"en",
      설정:{ 효과음:true, 배경음:true, 진동:true }, 뽑기횟수:0, 마지막접속:0, 미션:{ 날:"", 진행:[0,0,0], 받음:[false,false,false] },
    };
  },
  새개(견종, 털색) {
    return { 아이디:견종+"_"+털색, 이름:"", 견종, 털색, 특별:null, 레벨:1, 경험:0, 기분:50,
             놀이:{ 날:"", 쓰다듬기:0, 공:0 }, 마당:false };
  },
  불러오기() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(저장.키)); } catch(e) {}
    if (!d) d = 저장.마이그레이션_v4() || 저장.기본();
    const 기본 = 저장.기본();
    for (const k in 기본) if (d[k] === undefined) d[k] = 기본[k];
    if (!d.개.length) d.개 = 기본.개;
    if (!d.개.find(x=>x.아이디===d.선택개)) d.선택개 = d.개[0].아이디;
    d.개.forEach(x => { if (x.마당 === undefined) x.마당 = false; });
    if (!d.개.some(x=>x.마당)) d.개[0].마당 = true;
    저장.자료 = d; 저장.하루갱신(); 저장.미션갱신(); 저장.오프라인코인 = 저장.오프라인계산(); d.마지막접속 = Date.now(); 저장.하기();
  },
  // v4: localStorage['양몰이'] = {탄, 별(객체), 소리, 개('보더콜리')}  — 맺음 사실확인서 2026-09-10
  마이그레이션_v4() {
    let v=null; try { v = JSON.parse(localStorage.getItem("양몰이")); } catch(e) {}
    if (!v || typeof v !== "object") return null;
    const d = 저장.기본();
    const 최고 = Math.max(0, (v.탄|0) - 1);
    d.별 = [];
    const 별v = v.별 || {};
    const 키들 = Array.isArray(별v) ? 별v.map((x,i)=>[i+1,x]) : Object.entries(별v);
    for (const [k,val] of 키들) { const n=parseInt(k)||0; if (n>0) { while (d.별.length<n) d.별.push(0); d.별[n-1]=Math.min(3, val|0); } }
    d.최고탄 = Math.max(최고, d.별.filter(x=>x>0).length);
    d.설정.효과음 = v.소리 !== false; d.설정.배경음 = v.소리 !== false;
    견종순서.forEach(k => { if (d.최고탄 >= v4여는탄[k] && !d.개.find(x=>x.견종===k)) d.개.push(저장.새개(k,0)); });
    if (typeof v.개 === "string" && 견종표[v.개]) { if (!d.개.find(x=>x.견종===v.개)) d.개.push(저장.새개(v.개,0)); d.선택개 = v.개+"_0"; }
    d.인트로봄 = true;
    return d;
  },
  오프라인코인:0,
  오프라인계산() {
    const d=저장.자료; if (!d.마지막접속) return 0;
    const 시간 = Math.min(오프라인코인_최대시간, (Date.now()-d.마지막접속)/3600000); if (시간 < 0.25) return 0;
    const 마리 = d.개.filter(x=>x.마당).length; return Math.floor(시간 * 오프라인코인_시간당 * Math.max(1,마리) / 2);
  },
  미션갱신() {
    const d=저장.자료, 오늘=저장.오늘();
    if (!d.미션 || d.미션.날 !== 오늘) d.미션 = { 날:오늘, 진행:[0,0,0], 받음:[false,false,false] };
  },
  미션진행(i, n) { 저장.미션갱신(); 저장.자료.미션.진행[i] += (n||1); 저장.하기(); },
  하기() { try { localStorage.setItem(저장.키, JSON.stringify(저장.자료)); } catch(e) {} },
  초기화() { localStorage.removeItem(저장.키); 저장.불러오기(); },
  오늘() { const t=new Date(); return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0"); },
  하루갱신() {
    const d = 저장.자료, 오늘 = 저장.오늘();
    d.개.forEach(개 => { if (개.놀이.날 !== 오늘) { 개.놀이 = { 날:오늘, 쓰다듬기:0, 공:0 }; 개.기분 = Math.max(0, 개.기분 - 20); } });
    if (d.광고.날 !== 오늘) d.광고 = { 날:오늘, 횟수:0 };
  },
  출석확인() { // 오늘 안 받았으면 일차 반환, 받았으면 0
    const d = 저장.자료, 오늘 = 저장.오늘();
    if (d.출석.마지막 === 오늘) return 0;
    const 어제 = new Date(); 어제.setDate(어제.getDate()-1);
    const 어제문 = 어제.getFullYear()+"-"+String(어제.getMonth()+1).padStart(2,"0")+"-"+String(어제.getDate()).padStart(2,"0");
    const 연속 = d.출석.마지막 === 어제문 ? d.출석.연속 + 1 : 1;
    return ((연속 - 1) % 7) + 1;
  },
  출석받기() {
    const d = 저장.자료, 일차 = 저장.출석확인(); if (!일차) return null;
    const 어제 = new Date(); 어제.setDate(어제.getDate()-1);
    const 어제문 = 어제.getFullYear()+"-"+String(어제.getMonth()+1).padStart(2,"0")+"-"+String(어제.getDate()).padStart(2,"0");
    d.출석.연속 = d.출석.마지막 === 어제문 ? d.출석.연속 + 1 : 1; d.출석.마지막 = 저장.오늘();
    const 보상 = 일차 === 7 ? { 코인:50, 뼈다귀:3 } : { 코인:20, 뼈다귀:0 };
    d.코인 += 보상.코인; d.뼈다귀 += 보상.뼈다귀; 저장.하기(); return { 일차, ...보상 };
  },
  개찾기(id) { return 저장.자료.개.find(x=>x.아이디===id); },
  선택개() { return 저장.개찾기(저장.자료.선택개) || 저장.자료.개[0]; },
  별설정(탄, n) { const d=저장.자료; while (d.별.length < 탄) d.별.push(0); d.별[탄-1] = Math.max(d.별[탄-1], n); d.최고탄 = Math.max(d.최고탄, 탄); 저장.하기(); },
  별합() { return 저장.자료.별.reduce((a,b)=>a+b,0); },
};
