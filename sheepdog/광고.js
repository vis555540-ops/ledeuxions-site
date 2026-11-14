// 광고.js — 광고·결제 훅. 승인 전에는 광고_준비됨() 이 false.
// H5 Games Ads 승인 후: index.html 에 adsbygoogle 태그 넣고 광고.준비됨=true, 광고_재생/전면_재생 안만 교체.
// ── 진짜 광고 (v5.59) — Google H5 Games Ads (Ad Placement API: adBreak/adConfig).
// 🚨 H5 Games Ads 는 애드센스에서 따로 「신청→승인」 받아야 쓰는 상품(베타). 승인 전엔 승인됨=false 로 둔다.
//    승인 메일 오면 승인됨=true 로 바꾸고 sw.js·index.html 판만 올리면 끝.
// 🚨 앱(TWA)은 Play 대상연령 6~12세 → 가족 정책상 인증 SDK 광고만 됨. 크롬 TWA 안 애드센스는 그게 아님 → 앱에선 끔(앱에서도=false).
// ?adtest=1 이면 승인 없이도 시험 광고(data-adbreak-test="on")로 켠다. 결제 X·수익 X.
const 광고_설정 = {
  게시자: "ca-pub-2824624880449066",
  승인됨: false,      // ← H5 Games Ads 승인 뒤 true
  앱에서도: false,    // ← 앱(TWA)에서도 낼지. 가족 정책 풀리기 전엔 false
  전면_간격판: 3,     // 전면광고: 깬 판 3개마다 한 번
  전면_간격초: 180,   // 그리고 3분 이상 띄워서
  전면_첫판: 3,       // 1·2탄 다음에는 절대 안 냄
  앱광고: true,       // ★ v5.60 진짜 앱(v4, AdMob) 안 광고 스위치. false 면 앱에서도 광고 0 (바꾸면 앱 다시 빌드)
};
// ★ v5.60 진짜 앱(Capacitor, versionCode 4+) 안이면 웹 광고 대신 AdMob(가족 정책 인증 SDK)을 쓴다.
//   아이디는 admob_ids.json 한 곳(앱 꾸러미에만 들어감). 아이 대상 표시·G 등급·맞춤광고 X(npa).
const 앱네이티브 = (() => { try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); } catch (e) { return false; } })();
const 광고 = {
  준비됨: false,      // adConfig onReady 가 불려야 true. 광고 막힘·오프라인이면 끝까지 false
  결제준비됨: false,
  보는중: false,
  자리: { 뼈다귀:"bone", 뽑기:"gacha_more", 이어하기:"revive", 두배:"double", 전면:"interstitial" },
  시험: (() => { try { return new URLSearchParams(location.search).get("adtest") === "1"; } catch (e) { return false; } })(),
  앱안: (() => { try {
    if ((document.referrer || "").startsWith("android-app://")) sessionStorage.setItem("양몰이_앱", "1");
    return sessionStorage.getItem("양몰이_앱") === "1" || matchMedia("(display-mode: standalone)").matches && /Android/.test(navigator.userAgent) && (document.referrer||"").startsWith("android-app://");
  } catch (e) { return false; } })(),
  켜기() {
    if (광고._켬) return; 광고._켬 = true;
    if (앱네이티브) { if (광고_설정.앱광고) 광고.앱_켜기(); return; }
    const 켬 = 광고.시험 || (광고_설정.승인됨 && (!광고.앱안 || 광고_설정.앱에서도));
    if (!켬) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
      const s = document.createElement("script");
      s.async = true; s.crossOrigin = "anonymous";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + 광고_설정.게시자;
      s.setAttribute("data-ad-client", 광고_설정.게시자);
      s.setAttribute("data-ad-frequency-hint", 광고_설정.전면_간격초 + "s");
      s.setAttribute("data-tag-for-child-directed-treatment", "1");   // 아이도 하는 게임 → 맞춤광고 X
      if (광고.시험) s.setAttribute("data-adbreak-test", "on");
      s.onerror = () => { 광고.준비됨 = false; };                     // 광고 차단기·오프라인 → 조용히 끔
      document.head.appendChild(s);
      window.adConfig({ preloadAdBreaks: "on", sound: "on", onReady: () => { 광고.준비됨 = true; } });
    } catch (e) { 광고.준비됨 = false; }
  },
  준비됨확인() { return 광고.준비됨 && (앱네이티브 || typeof window.adBreak === "function"); },
  // ── AdMob (앱 안) ──
  앱: null, 앱아이디: null,
  async 앱_켜기() {
    try {
      const A = Capacitor.Plugins && Capacitor.Plugins.AdMob; if (!A) return;
      const r = await fetch("admob_ids.json", { cache: "no-store" }); const id = await r.json();
      await A.initialize({ initializeForTesting: !!id.test, tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: "General" });
      광고.앱 = A; 광고.앱아이디 = id; 광고.준비됨 = true;
    } catch (e) { 광고.준비됨 = false; }
  },
  _앱옵션(종류) { const id = 광고.앱아이디; return { adId: id[종류], isTesting: !!id.test, npa: true }; },
  // 전체화면 광고 하나를 띄우고 닫힐 때까지 기다린다. 보상형은 끝까지 봐서 Reward 가 왔을 때만 true.
  async _앱띄우기(보상형) {
    const A = 광고.앱, ev = 보상형
      ? { 상: "onRewardedVideoAdReward", 닫: "onRewardedVideoAdDismissed", 실: "onRewardedVideoAdFailedToShow" }
      : { 닫: "interstitialAdDismissed", 실: "interstitialAdFailedToShow" };
    try { 보상형 ? await A.prepareRewardVideoAd(광고._앱옵션("rewarded")) : await A.prepareInterstitial(광고._앱옵션("interstitial")); }
    catch (e) { 광고.마지막상태 = "notReady"; return false; }
    const hs = []; let 봄 = false, 끝 = false, 타 = 0, 풀기;
    const 결과 = new Promise(r => 풀기 = r);
    const 마침 = (v, 상태) => { if (끝) return; 끝 = true; clearTimeout(타); 광고.마지막상태 = 상태; hs.forEach(h => { try { h.remove(); } catch (e) {} });
      try { 소리.배경음_재개(); } catch (e) {} 풀기(v); };
    if (ev.상) hs.push(await A.addListener(ev.상, () => { 봄 = true; }));
    hs.push(await A.addListener(ev.닫, () => 마침(보상형 ? 봄 : true, 보상형 ? (봄 ? "viewed" : "dismissed") : "viewed")));
    hs.push(await A.addListener(ev.실, () => 마침(false, "other")));
    타 = setTimeout(() => 마침(false, "other"), 180000);
    try { 소리.배경음_멈춤(); } catch (e) {}
    (보상형 ? A.showRewardVideoAd() : A.showInterstitial()).catch(() => 마침(false, "other"));
    return 결과;
  },
  // 보상형. 끝까지 봤을 때(adViewed)만 true. 광고가 없으면(beforeReward 안 불림) false.
  재생(자리) {
    광고.마지막상태 = "notReady";
    if (!광고.준비됨확인()) return Promise.resolve(false);
    if (앱네이티브) return 광고._앱띄우기(true);
    return new Promise(res => {
      let 봄 = false, 끝 = false;
      const 마침 = v => { if (끝) return; 끝 = true; clearTimeout(타); res(v); };
      const 타 = setTimeout(() => 마침(false), 90000);
      try {
        window.adBreak({ type: "reward", name: 자리,
          beforeReward: (show) => show(),            // 사용자가 방금 누른 버튼에서만 여기 옴
          beforeAd: () => { try { 소리.배경음_멈춤(); } catch (e) {} },
          afterAd: () => { try { 소리.배경음_재개(); } catch (e) {} },
          adViewed: () => { 봄 = true; },
          adDismissed: () => { 봄 = false; },
          adBreakDone: (p) => { 광고.마지막상태 = (p && p.breakStatus) || "other"; 마침(봄 && 광고.마지막상태 === "viewed"); },
        });
      } catch (e) { 마침(false); }
    });
  },
  // 전면(next). 판과 판 사이에서만 부른다. 끝나면(나왔든 안 나왔든) resolve.
  전면(이름) {
    if (!광고.준비됨확인()) return Promise.resolve(false);
    if (앱네이티브) return 광고._앱띄우기(false);
    return new Promise(res => {
      let 끝 = false; const 마침 = v => { if (끝) return; 끝 = true; clearTimeout(타); res(v); };
      const 타 = setTimeout(() => 마침(false), 30000);
      try {
        window.adBreak({ type: "next", name: 이름,
          beforeAd: () => { try { 소리.배경음_멈춤(); } catch (e) {} },
          afterAd: () => { try { 소리.배경음_재개(); } catch (e) {} },
          adBreakDone: (p) => 마침(!!p && p.breakStatus === "viewed"),
        });
      } catch (e) { 마침(false); }
    });
  },
  광고없음알림() { try { 알림(글안전("광고_없음", "지금은 광고가 없어요")); } catch (e) {} },
  // 자리별 함수. 게임 코드는 이것만 부른다.
  async 뼈다귀() {
    const d = 저장.자료; 저장.하루갱신();
    if (!광고.준비됨확인()) return { 됨:false, 이유:"준비중" };
    if (d.광고.횟수 >= 광고_하루상한) return { 됨:false, 이유:"다봄" };
    const ok = await 광고.재생(광고.자리.뼈다귀);
    if (ok) { d.광고.횟수++; d.뼈다귀 += 1; 저장.하기(); }
    return { 됨:ok, 이유:ok?"":"취소" };
  },
  // ★ v5.57 뽑기 「광고 보고 한 번 더」. 하루 광고_뽑기상한(3)번. 선택일 뿐, 전면광고 없음.
  async 뽑기한번더() {
    const d = 저장.자료; 저장.하루갱신();
    if ((d.광고.뽑기||0) >= 광고_뽑기상한) return { 됨:false, 이유:"다봄" };
    let 받음 = false;
    await showRewardedAd(() => { 받음 = true; }, 광고.자리.뽑기);
    if (받음) { d.광고.뽑기 = (d.광고.뽑기||0) + 1; 저장.하기(); }
    return { 됨:받음, 이유:받음?"":"취소" };
  },
  async 이어하기() { return 광고.준비됨확인() ? 광고.재생(광고.자리.이어하기) : false; },
  async 코인두배() { return 광고.준비됨확인() ? 광고.재생(광고.자리.두배) : false; },
  // 판 깨고 「다음」 누를 때만 부른다. 3판마다·3분 이상 간격·1~2탄 뒤엔 안 냄. 게임 중엔 절대 안 부름.
  깬판: 0, 마지막전면: 0,
  async 전면_시도(탄) {
    광고.깬판++;
    if ((탄 || 0) < 광고_설정.전면_첫판) return false;
    if (광고.깬판 < 광고_설정.전면_간격판) return false;
    if (Date.now() - 광고.마지막전면 < 광고_설정.전면_간격초 * 1000) return false;
    if (!광고.준비됨확인()) return false;
    광고.깬판 = 0; 광고.마지막전면 = Date.now();
    return 광고.전면(광고.자리.전면);
  },
  // 결제 (Digital Goods API, TWA 안에서만). 나중에 연결.
  async 뼈다귀팩(수) { if (!광고.결제준비됨) return false; return false; },
};

// ── 보상형 광고 한 곳. 게임은 showRewardedAd(onReward) 만 부른다. 끝까지 보면(adViewed) onReward() 를 한 번 부른다.
// 광고가 없으면(승인 전·광고 차단·오프라인·재고 없음) 「지금은 광고가 없어요」만 띄우고 보상 없음.
async function showRewardedAd(onReward, 자리) {
  if (광고.보는중) return false;
  광고.보는중 = true;
  try {
    const ok = await 광고.재생(자리 || "reward");
    if (ok) { if (typeof onReward === "function") onReward(); }
    else if (광고.마지막상태 !== "dismissed") 광고.광고없음알림();   // 스스로 닫은 건 말 안 함
    return ok;
  } finally { 광고.보는중 = false; }
}
광고.켜기();
