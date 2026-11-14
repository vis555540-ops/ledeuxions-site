// 이사.js — 옛 앱(TWA·크롬 저장) → 새 앱(v4, 앱 안 저장)으로 진행 옮기기. 2026-11-14 형 결정.
//   옛 쪽(크롬·옛 앱): 「이사 코드 받기」 → 저장을 api.ledeuxions.com 에 맡기고 6글자 코드를 보여 준다.
//   새 쪽(v4 앱): 처음 켤 때 저장이 비어 있으면 「이사 오셨나요?」 → 코드 넣으면 그대로, 아니면 뼈다귀 보상.
//   모두에게 업데이트 감사 선물 🦴50 (설치마다 한 번). 이사 없이 시작하면 뽑기 5번 몫 🦴50 더.
//   저장 형태는 저장.js 의 「양몰이_v5」 그대로. 개인정보 없음(게임 저장만).
const 이사 = {
  주소: (() => { try { const m = /[?&]moveapi=([^&]+)/.exec(location.search); if (m) return decodeURIComponent(m[1]) + "/sheepdog/move"; } catch (e) {} return "https://api.ledeuxions.com/sheepdog/move"; })(),
  마감: "2027-03-01",            // 이 날 뒤로는 자동으로 묻지 않는다 (메뉴만)
  감사선물: 50,
  보상: 50,                      // 뽑기 5번 = 뽑기비용(10) × 5
  // index.html 이 저장.불러오기() 하기 전에 이 파일이 읽힌다 → 그때 저장이 비었는지 본다
  빈저장: (() => { try { return !localStorage.getItem("양몰이_v5") && !localStorage.getItem("양몰이"); } catch (e) { return false; } })(),
  // 새 앱인가 — Capacitor 안. 시험용 주소 ?newapp=1
  새앱: (() => { try { if (/[?&]newapp=1/.test(location.search)) return true; return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); } catch (e) { return false; } })(),
  설치(){ try { return JSON.parse(localStorage.getItem("양몰이_이사") || "{}") || {}; } catch (e) { return {}; } },
  설치쓰기(v){ try { localStorage.setItem("양몰이_이사", JSON.stringify(v)); } catch (e) {} },
  기간(){ return 저장.오늘() < 이사.마감; },
  // 제목 화면 메뉴에 보일까
  메뉴보임(){ if (!이사.기간()) return false; if (!이사.새앱) return true; return !이사.설치().이사옴; },
  메뉴글(){ return 이사.새앱 ? "📦 이사 코드 넣기" : "📦 새 앱으로 이사"; },
  메뉴(){ 이사.새앱 ? 이사.넣기창(false) : 이사.받기창(); },

  // index.html 에서 저장.불러오기() 바로 뒤에 부른다
  시작(){
    try {
      const 남은말 = sessionStorage.getItem("양몰이_이사_알림");
      if (남은말) { sessionStorage.removeItem("양몰이_이사_알림"); 이사.확인창(JSON.parse(남은말)); return; }
    } catch (e) {}
    if (이사.새앱) {
      // 처음 켤 때 비어 있었으면 기억해 둔다 — 묻는 창에서 고르기 전에 앱을 꺼도 다음에 다시 묻게
      const 설 = 이사.설치();
      if (이사.빈저장 && !설.빈시작) { 설.빈시작 = 1; 이사.설치쓰기(설); }
      if (설.빈시작 && !설.물음 && 이사.기간()) { 이사.넣기창(true); return; }
      return;
    }
    // 옛 쪽 — 주소에 ?이사=1 (새 앱이 크롬으로 보낼 때) 이면 바로 받기 창
    try { if (decodeURIComponent(location.search).includes("이사=1")) { 이사.받기창(); return; } } catch (e) {}
    // 한 번만, 진행이 있는 사람에게만, 폰(옛 앱·안드로이드)에서만 살짝
    const d = 저장.자료; let 본 = null; try { 본 = localStorage.getItem("양몰이_이사안내"); } catch (e) {}
    const 진행 = d && (d.최고탄 > 0 || d.개.length > 1);
    const 폰 = (typeof 폰앱판 === "function" && 폰앱판() >= 1) || /^android-app:/.test(document.referrer || "") || /Android/i.test(navigator.userAgent);
    if (!본 && 진행 && 폰 && 이사.기간()) { try { localStorage.setItem("양몰이_이사안내", 저장.오늘()); } catch (e) {} 이사.받기창(true); }
  },

  개이름들(save){ return (save.개 || []).map(g => { let 견 = g.견종; try { 견 = 글(g.견종); } catch (e) {} return g.이름 ? g.이름 + "(" + 견 + ")" : 견; }); },

  // ── 옛 쪽: 이사 코드 받기
  받기창(살짝){
    const 창 = 이사.창();
    창.안.innerHTML = `<div class="이사-제목">📦 새 앱으로 이사 준비</div>
      <p>양몰이 앱이 새 판으로 바뀌어요. 새 앱은 저장 자리가 달라서,<br><b>이사 코드</b>를 받아 두면 강아지랑 진행이 그대로 와요.</p>
      <button class="이사-큰" data-k="받기">이사 코드 받기</button>
      <button class="이사-작" data-k="닫기">${살짝 ? "나중에 (제목 화면 📦 메뉴)" : "닫기"}</button>`;
    창.안.onclick = async (e) => {
      const k = e.target && e.target.dataset && e.target.dataset.k; if (!k) return;
      if (k === "닫기") return 창.닫기();
      if (k === "복사") { 이사.복사(창.안.querySelector(".이사-코드").textContent); e.target.textContent = "복사됨 ✓"; return; }
      if (k !== "받기") return;
      e.target.disabled = true; e.target.textContent = "맡기는 중…";
      try {
        저장.하기();
        const r = await fetch(이사.주소, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ save: 저장.자료 }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.code) throw new Error(j.error || r.status);
        try { localStorage.setItem("양몰이_이사코드", JSON.stringify({ 코드: j.code, 날: 저장.오늘() })); } catch (e2) {}
        창.안.innerHTML = `<div class="이사-제목">📦 이사 코드</div>
          <div class="이사-코드">${j.code}</div>
          <button class="이사-큰" data-k="복사">코드 복사</button>
          <p>새 앱 첫 화면에서 이 코드를 넣으면<br><b>강아지랑 진행이 그대로 와요.</b> 🐕</p>
          <p class="이사-흐림">옮길 강아지: ${이사.개이름들(저장.자료).join(", ")}<br>코드는 30일 동안 써요. 코드 받은 뒤에 한 놀이는 안 옮겨지니, 새 앱 받기 바로 전에 받는 게 좋아요. 다시 받아도 돼요.</p>
          <button class="이사-작" data-k="닫기">닫기</button>`;
      } catch (err) {
        e.target.disabled = false; e.target.textContent = "다시 해 보기";
        const p = 창.안.querySelector(".이사-오류") || 창.안.appendChild(Object.assign(document.createElement("p"), { className: "이사-오류" }));
        p.textContent = "인터넷이 안 되거나 잠깐 막혔어요. 조금 뒤에 다시 눌러 주세요.";
      }
    };
  },

  // ── 새 쪽: 이사 코드 넣기. 처음이면(첫 켬) 「처음 시작」 도 있다
  넣기창(처음){
    const 창 = 이사.창();
    창.안.innerHTML = `<div class="이사-제목">${처음 ? "🐑 옛날 양몰이에서 이사 오셨나요?" : "📦 이사 코드 넣기"}</div>
      <p>옛 앱(또는 크롬)에서 받은 <b>이사 코드 6글자</b>를 넣으면 강아지랑 진행이 그대로 와요.</p>
      ${처음 ? "" : `<p class="이사-오류">지금 진행은 옮겨 온 것으로 바뀌어요.</p>`}
      <input class="이사-칸" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="예: K7M2QX">
      <button class="이사-큰" data-k="넣기">이사 코드 넣기</button>
      <p class="이사-흐림">코드가 없으면: 크롬에서 <b>ledeuxions.com/sheepdog</b> 을 열고 「📦 새 앱으로 이사」 를 누르세요.</p>
      <button class="이사-작" data-k="크롬">크롬에서 옛 진행 열기</button>
      <button class="이사-작" data-k="${처음 ? "처음" : "닫기"}">${처음 ? "처음 시작 (🦴" + (이사.감사선물 + 이사.보상) + " 선물)" : "닫기"}</button>`;
    const 칸 = 창.안.querySelector(".이사-칸");
    칸.addEventListener("input", () => { 칸.value = 칸.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    칸.addEventListener("keydown", e => { if (e.key === "Enter") 창.안.querySelector('[data-k="넣기"]').click(); });
    창.안.onclick = async (e) => {
      const k = e.target && e.target.dataset && e.target.dataset.k; if (!k) return;
      if (k === "닫기") return 창.닫기();
      if (k === "크롬") { try { location.href = "https://ledeuxions.com/sheepdog/?%EC%9D%B4%EC%82%AC=1"; } catch (e2) {} return; }
      if (k === "처음") { 창.닫기(); 이사.처음시작(); return; }
      if (k !== "넣기") return;
      const 코드 = 칸.value.trim().toUpperCase();
      const 오류 = (말) => { const p = 창.안.querySelector(".이사-알림") || 칸.insertAdjacentElement("afterend", Object.assign(document.createElement("p"), { className: "이사-오류 이사-알림" })); p.textContent = 말; };
      if (!/^[A-Z0-9]{6}$/.test(코드)) return 오류("코드는 6글자예요.");
      e.target.disabled = true; e.target.textContent = "가져오는 중…";
      try {
        const r = await fetch(이사.주소 + "/" + 코드);
        const j = await r.json().catch(() => ({}));
        if (r.status === 404) throw new Error("코드를 못 찾았어요. 글자를 다시 봐 주세요.");
        if (r.status === 410) throw new Error("이미 쓴 코드예요. 옛 앱에서 새로 받아 주세요.");
        if (!r.ok || !j.save || !Array.isArray(j.save.개) || !j.save.개.length) throw new Error("코드를 열 수 없어요. 조금 뒤에 다시 해 주세요.");
        이사.옮기기(j.save, 코드);
      } catch (err) {
        e.target.disabled = false; e.target.textContent = "이사 코드 넣기";
        오류(err && err.message && !/fetch|network/i.test(err.message) ? err.message : "인터넷이 안 되나 봐요. 연결하고 다시 눌러 주세요.");
      }
    };
  },

  // 받은 저장을 그대로 넣고 다시 켠다. 감사 선물은 설치마다 한 번
  옮기기(save, 코드){
    const 설 = 이사.설치(); let 선물 = 0;
    if (!설.옮김선물) { 선물 = 이사.감사선물; save.뼈다귀 = (save.뼈다귀 | 0) + 선물; 설.옮김선물 = 1; }
    save.처음 = save.처음 || {}; save.처음.이사옴 = 코드;
    설.물음 = 1; 설.이사옴 = 코드; 설.선물 = 1; 이사.설치쓰기(설);
    try { localStorage.setItem("양몰이_v5", JSON.stringify(save)); } catch (e) {}
    const 말 = { 종류: "옮김", 개: 이사.개이름들(save), 선물 };
    try { sessionStorage.setItem("양몰이_이사_알림", JSON.stringify(말)); location.reload(); }
    catch (e) { 저장.불러오기(); 이사.확인창(말); }
  },

  처음시작(){
    const 설 = 이사.설치(); 설.물음 = 1;
    let 선물 = 0;
    if (!설.선물) { 선물 = 이사.감사선물 + 이사.보상; 저장.자료.뼈다귀 += 선물; 설.선물 = 1; 저장.하기(); }
    이사.설치쓰기(설);
    if (선물) 이사.확인창({ 종류: "처음", 선물 });
  },

  확인창(말){
    const 창 = 이사.창();
    창.안.innerHTML = 말.종류 === "옮김"
      ? `<div class="이사-제목">강아지 확인됨 🐕</div>
         <p><b>${(말.개 || []).join(", ")}</b><br>이사 끝! 진행이 그대로 왔어요.</p>
         ${말.선물 ? `<p>🎁 업데이트 감사 선물<br><b>뼈다귀 🦴${말.선물}</b></p>` : ""}
         <button class="이사-큰" data-k="닫기">좋아요</button>`
      : `<div class="이사-제목">🎁 업데이트 감사 선물</div>
         <p>뼈다귀 <b>🦴${말.선물}</b> 드려요.<br>뽑기로 새 친구를 데려와요! 🐕</p>
         <p class="이사-흐림">옛 진행 코드가 생기면 제목 화면 「📦 이사 코드 넣기」 에서 넣을 수 있어요.</p>
         <button class="이사-큰" data-k="닫기">좋아요</button>`;
    창.안.onclick = (e) => { if (e.target && e.target.dataset && e.target.dataset.k === "닫기") 창.닫기(); };
  },

  복사(t){
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).catch(() => 이사.복사옛(t)); return; } } catch (e) {}
    이사.복사옛(t);
  },
  복사옛(t){ try { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); } catch (e) {} },

  // 화면 위에 얹는 진짜 HTML 창 (캔버스 밖이라 폰 키보드·복사가 된다)
  창(){
    이사.닫기();
    if (!document.getElementById("이사-꾸밈")) {
      const st = document.createElement("style"); st.id = "이사-꾸밈";
      st.textContent = `#이사-막 { position:fixed; inset:0; z-index:50; background:rgba(10,14,28,0.72); display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box; }
        #이사-막 .이사-판 { width:100%; max-width:340px; max-height:92vh; overflow:auto; background:#fdf6e4; color:#3a2a1a; border:4px solid #7a5230; border-radius:10px; padding:18px 16px; box-sizing:border-box; text-align:center;
          font-family:'DungGeunMo','Galmuri',system-ui,sans-serif; -webkit-user-select:text; user-select:text; touch-action:auto; }
        #이사-막 .이사-제목 { font-size:19px; font-weight:bold; margin-bottom:10px; }
        #이사-막 p { font-size:14px; line-height:1.55; margin:10px 0; }
        #이사-막 .이사-흐림 { font-size:12px; color:#7a6a58; }
        #이사-막 .이사-오류 { font-size:13px; color:#b03a2e; }
        #이사-막 .이사-코드 { font-size:40px; letter-spacing:6px; font-weight:bold; margin:12px 0; padding:10px 0; background:#fff; border:2px dashed #7a5230; border-radius:8px; font-family:ui-monospace,Menlo,monospace; }
        #이사-막 .이사-칸 { width:100%; font-size:28px; letter-spacing:5px; text-align:center; padding:8px; box-sizing:border-box; border:3px solid #7a5230; border-radius:8px; background:#fff; color:#3a2a1a; font-family:ui-monospace,Menlo,monospace; text-transform:uppercase; }
        #이사-막 button { display:block; width:100%; margin:8px 0 0; font:inherit; cursor:pointer; border-radius:8px; }
        #이사-막 .이사-큰 { font-size:17px; padding:12px; background:#f0d070; border:3px solid #7a5230; color:#3a2a1a; font-weight:bold; }
        #이사-막 .이사-큰:disabled { opacity:0.6; }
        #이사-막 .이사-작 { font-size:13px; padding:8px; background:transparent; border:2px solid #c8b898; color:#5a4a38; }`;
      document.head.appendChild(st);
    }
    const 막 = document.createElement("div"); 막.id = "이사-막";
    const 안 = document.createElement("div"); 안.className = "이사-판"; 막.appendChild(안);
    // 캔버스 쪽으로 손짓이 새지 않게
    ["pointerdown", "pointerup", "touchstart", "touchend"].forEach(t => 막.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(막);
    return { 안, 닫기: 이사.닫기 };
  },
  닫기(){ const m = document.getElementById("이사-막"); if (m) m.remove(); },
};
