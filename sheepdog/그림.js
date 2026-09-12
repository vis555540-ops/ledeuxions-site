// 그림.js — 캔버스 그리기 도우미 + 시트 로더. 파일 없으면 임시 치비를 코드로 그린다.
const 그림 = {
  c:null, 화면:null, 시트:{}, 시트규격:{
    // v4 실제 규격 (맺음 확인서 2026-09-10). 견종별 파일 128×192, 4칸×6줄. 양 160×192, 5칸×6줄. 한 칸 32×32.
    개:  { 폭:32, 높이:32, 줄:{ 가만:[0,2], 걷기:[1,4], 달리기:[2,4], 하품:[3,4], 앉기:[4,2], 짖기:[5,2] } },
    양:  { 폭:32, 높이:32, 줄:{ 가만:[0,2], 걷기:[1,4], 먹기:[2,5], 앉기:[3,2], 잠:[4,2], 놀람:[5,2] } },
    늑대:{ 폭:32, 높이:32, 줄:{ 걷기:[0,4], 도망:[1,2] } },   // 신규 파일. 같은 규격으로 그린다.
    여우:{ 폭:32, 높이:32, 줄:{ 걷기:[0,4], 도망:[1,2] } },
  },
  동작대응: { 서기:"가만", 걷기:"걷기", 앉기:"앉기", 짖기:"짖기", 겁:"놀람", 도망:"도망", 달리기:"달리기", 하품:"하품", 잠:"잠", 먹기:"먹기" },
  시작(canvas) {
    그림.화면 = canvas; 그림.c = canvas.getContext("2d"); 그림.c.imageSmoothingEnabled = false;
    const 불러올 = [["양","양_동작.png"],["늑대","늑대.png"],["여우","여우.png"]];
    견종순서.forEach(k => 불러올.push(["개_"+k, "개/"+k+".png"]));
    불러올.forEach(([키, 경로]) => { const im = new Image(); im.onload=()=>{ 그림.시트[키]=im; }; im.onerror=()=>{}; im.src=경로; });
  },
  // 털색 1·2 = 원본 시트의 색을 HSL 로 돌린 사본. 외곽선(어두운 색)·흰색은 안 건드린다.
  색치환(키, 털색) {
    const 캐시키 = 키+"#"+털색; if (그림.시트[캐시키]) return 그림.시트[캐시키];
    const im = 그림.시트[키]; if (!im || !털색회전[털색]) return im;
    const cv = document.createElement("canvas"); cv.width=im.width; cv.height=im.height; const cx=cv.getContext("2d"); cx.drawImage(im,0,0);
    const d = cx.getImageData(0,0,cv.width,cv.height), p=d.data, r=털색회전[털색];
    for (let i=0;i<p.length;i+=4) {
      if (p[i+3]<10) continue; const R=p[i]/255,G=p[i+1]/255,B=p[i+2]/255, mx=Math.max(R,G,B), mn=Math.min(R,G,B); let h=0,s=0,l=(mx+mn)/2;
      if (l<0.18 || (l>0.92 && mx-mn<0.1)) continue; // 외곽선·흰자 유지
      if (mx!==mn) { const dd=mx-mn; s=l>0.5?dd/(2-mx-mn):dd/(mx+mn); h = mx===R?((G-B)/dd+(G<B?6:0)):mx===G?((B-R)/dd+2):((R-G)/dd+4); h/=6; }
      h=(h+r.h/360+1)%1; s=Math.min(1,s*r.s); l=Math.min(0.95,l*r.l);
      const q=l<0.5?l*(1+s):l+s-l*s, pp=2*l-q, f=(t)=>{ t=(t+1)%1; return t<1/6?pp+(q-pp)*6*t:t<0.5?q:t<2/3?pp+(q-pp)*(2/3-t)*6:pp; };
      p[i]=f(h+1/3)*255; p[i+1]=f(h)*255; p[i+2]=f(h-1/3)*255;
    }
    cx.putImageData(d,0,0); 그림.시트[캐시키]=cv; return cv;
  },
  팔레트:null,
  지우기(색1) { const c=그림.c; c.fillStyle=색1||색.밤하늘; c.fillRect(0,0,폭,높이); },
  네모(x,y,w,h,f,테두리) { const c=그림.c; c.fillStyle=f; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); if (테두리) { c.strokeStyle=테두리; c.lineWidth=1; c.strokeRect(Math.round(x)+0.5,Math.round(y)+0.5,Math.round(w)-1,Math.round(h)-1); } },
  둥근(x,y,w,h,r,f,테두리) { const c=그림.c; c.beginPath(); c.roundRect(Math.round(x)+0.5,Math.round(y)+0.5,w-1,h-1,r); c.fillStyle=f; c.fill(); if (테두리) { c.strokeStyle=테두리; c.lineWidth=1; c.stroke(); } },
  원(x,y,r,f) { const c=그림.c; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=f; c.fill(); },
  글자(t,x,y,크기,f,정렬,굵게) { const c=그림.c; c.font=(굵게?"bold ":"")+(크기||8)+"px 'DungGeunMo','Galmuri','NeoDunggeunmo',monospace"; c.fillStyle=f||색.글; c.textAlign=정렬||"left"; c.textBaseline="top"; c.fillText(t,Math.round(x),Math.round(y)); },
  글자테두리(t,x,y,크기,f,정렬) { const c=그림.c; c.font="bold "+크기+"px 'DungGeunMo','Galmuri','NeoDunggeunmo',monospace"; c.textAlign=정렬||"left"; c.textBaseline="top"; c.lineWidth=3; c.strokeStyle=색.글어둠; c.strokeText(t,Math.round(x),Math.round(y)); c.fillStyle=f; c.fillText(t,Math.round(x),Math.round(y)); },
  버튼(b, 눌림) { // b:{x,y,w,h,글,색,비활성}
    const f = b.비활성 ? "#6a6a7a" : (눌림 ? "#c9a24e" : (b.색||"#e0b04a"));
    그림.둥근(b.x, b.y+2, b.w, b.h, 4, "#5a3a1a"); 그림.둥근(b.x, b.y, b.w, b.h, 4, f, "#5a3a1a");
    그림.글자(b.글, b.x+b.w/2, b.y+(b.h-(b.크기||10))/2, b.크기||10, b.글색||색.글어둠, "center", true);
  },
  판(x,y,w,h) { 그림.둥근(x,y+2,w,h,5,"#3a2a1a"); 그림.둥근(x,y,w,h,5,색.판,색.판테두리); },
  안에(b,x,y) { return x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h; },
  막대(x,y,w,h,비율,f) { 그림.네모(x,y,w,h,"#3a3a44"); 그림.네모(x+1,y+1,Math.max(0,(w-2)*Math.min(1,비율)),h-2,f); },
  별(x,y,크기,켜짐) { const c=그림.c; c.beginPath(); for (let i=0;i<10;i++){ const r=i%2?크기*0.45:크기; const a=-Math.PI/2+i*Math.PI/5; c.lineTo(x+Math.cos(a)*r, y+Math.sin(a)*r); } c.closePath(); c.fillStyle=켜짐?색.별:색.별꺼짐; c.fill(); c.strokeStyle="#5a3a1a"; c.lineWidth=1; c.stroke(); },
  코인아이콘(x,y) { 그림.원(x,y,4,"#a07020"); 그림.원(x,y-0.5,3.5,색.코인); },
  뼈아이콘(x,y) { 그림.네모(x-4,y-1,8,2,색.뼈); 그림.원(x-4,y-1,1.5,색.뼈); 그림.원(x-4,y+1,1.5,색.뼈); 그림.원(x+4,y-1,1.5,색.뼈); 그림.원(x+4,y+1,1.5,색.뼈); },
  달(x,y,r) { 그림.원(x,y,r,색.달); 그림.원(x-r*0.35,y-r*0.2,r*0.15,"#e8d69a"); 그림.원(x+r*0.2,y+r*0.3,r*0.12,"#e8d69a"); },
  // ── 목장 풍경 (2026-09-12 형: 「집이랑 나무랑 풀도 없고」) ─────────────
  언덕(y지평) { // 지평선 뒤로 물러난 두 봉우리. 잔디를 나중에 그려서 아랫도리를 덮는다
    const c=그림.c;
    c.fillStyle="#3d6b28"; c.beginPath(); c.ellipse(38,y지평+18,72,44,0,0,Math.PI*2); c.fill();
    c.fillStyle="#456f2c"; c.beginPath(); c.ellipse(142,y지평+22,66,40,0,0,Math.PI*2); c.fill();
  },
  구름(x,y,w) { // 밤구름. 둥근 구름은 픽셀 그림과 안 어울려서 네모로 쌓는다
    const u=Math.max(2,Math.round(w/9)), C="#28325a";
    그림.네모(x-u*4,y,     u*8,u, C);
    그림.네모(x-u*3,y-u,   u*6,u, C);
    그림.네모(x-u*1,y-u*2, u*3,u, C);
    그림.네모(x-u*5,y+u,   u*7,u, C);
  },
  건초(x,바닥,w) { const c=그림.c; // 건초 더미
    c.fillStyle="#d8b45c"; c.beginPath(); c.ellipse(x,바닥-w*0.32,w*0.5,w*0.34,0,0,Math.PI*2); c.fill();
    c.fillStyle="#c29b45"; c.beginPath(); c.ellipse(x,바닥-w*0.2,w*0.5,w*0.22,0,0,Math.PI*2); c.fill();
    for (let i=0;i<3;i++) 그림.네모(x-w*0.3+i*w*0.3,바닥-w*0.5,1,w*0.4,"#b98f3c");
  },
  나무(x,바닥,크기,종류) { // 종류: "침엽" | "활엽"
    const h=크기, 굵기=Math.max(2,Math.round(크기*0.13));
    그림.네모(x-굵기/2,바닥-h*0.34,굵기,h*0.34,색.나무2);
    const c=그림.c;
    if (종류==="침엽") {
      for (let k=0;k<3;k++){ const w=크기*(0.46-k*0.11), y=바닥-h*0.3-k*h*0.22;
        c.fillStyle=k%2?"#2f5c22":"#3a6d2a"; c.beginPath(); c.moveTo(x,y-h*0.3); c.lineTo(x-w,y); c.lineTo(x+w,y); c.closePath(); c.fill(); }
    } else {
      c.fillStyle="#3a6d2a"; c.beginPath(); c.ellipse(x,바닥-h*0.6,크기*0.42,크기*0.36,0,0,Math.PI*2); c.fill();
      c.fillStyle="#47822f"; c.beginPath(); c.ellipse(x-크기*0.14,바닥-h*0.68,크기*0.26,크기*0.2,0,0,Math.PI*2); c.fill();
    }
  },
  집(x,바닥,w) { // 지붕·문·불 켜진 창. 목장 본채
    const h=w*0.62, 벽y=바닥-h, c=그림.c;
    그림.네모(x,벽y,w,h,"#c9a06a");                       // 벽
    그림.네모(x,바닥-3,w,3,"#a8804f");                     // 그림자 띠
    c.fillStyle="#8c3a2e"; c.beginPath();                   // 지붕
    c.moveTo(x-4,벽y); c.lineTo(x+w/2,벽y-h*0.55); c.lineTo(x+w+4,벽y); c.closePath(); c.fill();
    c.fillStyle="#6f2d24"; c.fillRect(Math.round(x-4),Math.round(벽y),Math.round(w+8),2);
    그림.네모(x+w*0.42,바닥-h*0.46,w*0.2,h*0.46,색.나무2);  // 문
    const 창=(cx,cy,s)=>{ 그림.네모(cx,cy,s,s,"#ffd66b"); 그림.네모(cx,cy+s/2-0.5,s,1,"#c9a04a"); 그림.네모(cx+s/2-0.5,cy,1,s,"#c9a04a"); };
    창(x+w*0.12,벽y+h*0.22,w*0.19); 창(x+w*0.7,벽y+h*0.22,w*0.19);
    그림.네모(x+w*0.16,벽y-h*0.5,w*0.1,h*0.3,"#8c8c8c");    // 굴뚝
  },
  울타리(y,x0,x1,간격) {
    for (let x=x0;x<=x1;x+=간격) 그림.네모(x,y-6,2,8,색.나무);
    그림.네모(x0,y-4,x1-x0,2,색.나무2); 그림.네모(x0,y-1,x1-x0,2,색.나무2);
  },
  풀포기(x,y,크기) { const c=색.잔디2;
    그림.네모(x,y-크기,1,크기,c); 그림.네모(x-2,y-크기*0.6,1,크기*0.6,c); 그림.네모(x+2,y-크기*0.7,1,크기*0.7,c);
  },
  잔디(y0,y1) { 그림.네모(0,y0,폭,y1-y0,색.잔디); for (let i=0;i<60;i++){ const h=(i*2654435761>>>0); const x=h%폭, y=y0+((h>>>8)%(y1-y0)); 그림.네모(x,y,2,1,색.잔디2); } },
  // 시트 그리기. 없으면 임시 치비. (x,y) = 발 아래 기준.
  시트그리기(키, 규격이름, 동작, 프레임시간, x, y, 왼쪽, 팔레트색, 옵션) {
    옵션 = 옵션||{};
    let im = 그림.시트[키]; if (im && 옵션.털색) im = 그림.색치환(키, 옵션.털색);
    const 규격=그림.시트규격[규격이름], c=그림.c, 줄이름 = 그림.동작대응[동작]||동작;
    if (im && 규격 && 규격.줄[줄이름]) {
      const [줄,수] = 규격.줄[줄이름]; const f = Math.floor(프레임시간*6)%수;
      c.save(); c.translate(Math.round(x), Math.round(y)); if (왼쪽) c.scale(-1,1);
      c.drawImage(im, f*규격.폭, 줄*규격.높이, 규격.폭, 규격.높이, -규격.폭/2, -규격.높이, 규격.폭, 규격.높이); c.restore(); return;
    }
    그림.임시치비(규격이름, 동작, 프레임시간, x, y, 왼쪽, 팔레트색, 옵션);
  },
  // 임시 치비: 큰 머리, 볼터치, 검정 외곽선. 발 아래 기준점 (x,y).
  임시치비(종류, 동작, t, x, y, 왼쪽, 몸색, 옵션) {
    const c=그림.c; const 뜀 = (동작==="걷기"||동작==="달리기"||동작==="도망") ? (Math.floor(t*8)%2) : 0; const 앉음 = 동작==="앉기";
    c.save(); c.translate(Math.round(x), Math.round(y)-뜀); if (왼쪽) c.scale(-1,1);
    const 외곽="#1a1a1a";
    if (종류==="양") {
      c.fillStyle=외곽; c.fillRect(-9,-14,18,12); c.fillStyle=몸색; c.fillRect(-8,-13,16,10);
      c.fillStyle="#f4f0e6"; if (몸색===양색표.점박이){ c.fillStyle="#7a6a5a"; c.fillRect(-5,-11,3,3); c.fillRect(2,-8,3,3); }
      c.fillStyle=외곽; c.fillRect(-11,-10,7,7); c.fillStyle="#3a3a40"; c.fillRect(-10,-9,5,5);
      c.fillStyle="#fff"; c.fillRect(-9,-8,2,2); c.fillStyle="#1a1a1a"; c.fillRect(-8,-8,1,1);
      c.fillStyle=외곽; c.fillRect(-6,-2,2,2); c.fillRect(3,-2,2,2);
      if (동작==="놀람") { c.fillStyle="#fff"; c.fillRect(-9,-9,3,3); }
    } else if (종류==="늑대"||종류==="여우") {
      const f = 종류==="여우"?색.여우:색.늑대;
      c.fillStyle=외곽; c.fillRect(-9,-12,20,9); c.fillStyle=f; c.fillRect(-8,-11,18,7);
      c.fillStyle=외곽; c.fillRect(-14,-17,10,10); c.fillStyle=f; c.fillRect(-13,-16,8,8);
      c.fillStyle=외곽; c.fillRect(-13,-20,3,4); c.fillRect(-8,-20,3,4); c.fillStyle=f; c.fillRect(-12,-19,1,2); c.fillRect(-7,-19,1,2);
      c.fillStyle=동작==="도망"?"#fff":"#ff4040"; c.fillRect(-11,-14,2,2);
      c.fillStyle=외곽; c.fillRect(-7,-3,2,3); c.fillRect(5,-3,2,3);
    } else { // 개
      c.fillStyle=외곽; c.fillRect(-7,-10,14,(앉음?9:8)); c.fillStyle=몸색; c.fillRect(-6,-9,12,앉음?8:6);
      c.fillStyle=외곽; c.fillRect(-13,-20,14,13); c.fillStyle=몸색; c.fillRect(-12,-19,12,11);
      c.fillStyle=외곽; c.fillRect(-13,-23,4,5); c.fillRect(-4,-23,4,5); c.fillStyle=몸색; c.fillRect(-12,-22,2,3); c.fillRect(-3,-22,2,3);
      c.fillStyle="#fff"; c.fillRect(-10,-16,3,3); c.fillRect(-5,-16,3,3); c.fillStyle="#1a1a1a"; c.fillRect(-9,-15,2,2); c.fillRect(-4,-15,2,2);
      c.fillStyle="#f08080"; c.fillRect(-12,-12,2,1); c.fillRect(-3,-12,2,1);
      c.fillStyle="#1a1a1a"; c.fillRect(-13,-13,2,2);
      if (동작==="짖기") { c.fillStyle="#1a1a1a"; c.fillRect(-14,-11,4,3); c.fillStyle="#f4f0e6"; c.fillRect(-16,-15,3,1); c.fillRect(-17,-12,2,1); c.fillRect(-16,-9,3,1); }
      c.fillStyle=외곽; c.fillRect(-5,-3,2,3); c.fillRect(3,-3,2,3);
      if (옵션.특별) { c.fillStyle=색.별; c.fillRect(-9,-19,2,2); c.fillRect(-2,-13,1,1); }
    }
    c.restore();
  },
  임시개색: { 보더콜리:"#2b2b2b", 코기:"#e0a458", 골든리트리버:"#e6b85c", 진도견:"#f2e6c8", 삽살개:"#8a7b6a", 저먼셰퍼드:"#4a3a2a" },
  개그리기(개, 동작, t, x, y, 왼쪽) {
    let 몸색 = 그림.임시개색[개.견종]||"#888";
    if (개.털색===1) 몸색 = "#7a4a3a"; if (개.털색===2) 몸색 = "#e8e0d0";
    그림.시트그리기("개_"+개.견종, "개", 동작, t, x, y, 왼쪽, 몸색, { 특별:개.특별, 털색:개.털색 });
  },
  hex(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; },
};
