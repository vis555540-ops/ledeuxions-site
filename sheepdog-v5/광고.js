// 광고.js — 광고·결제 훅. 승인 전에는 광고_준비됨() 이 false.
// H5 Games Ads 승인 후: index.html 에 adsbygoogle 태그 넣고 광고.준비됨=true, 광고_재생/전면_재생 안만 교체.
const 광고 = {
  준비됨: false,
  결제준비됨: false,
  자리: { 뼈다귀:"bone", 뽑기:"gacha_more", 이어하기:"revive", 두배:"double", 전면:"interstitial" },
  준비됨확인() { return 광고.준비됨 && typeof window.adBreak === "function"; },
  async 재생(자리) {
    if (!광고.준비됨확인()) return false;
    return new Promise(res => {
      window.adBreak({ type:"reward", name:자리,
        beforeReward: (show) => show(),
        adViewed: () => res(true), adDismissed: () => res(false),
        beforeAd: () => 소리.배경음_멈춤(), afterAd: () => 소리.배경음_재개(),
      });
      setTimeout(() => res(false), 60000);
    });
  },
  async 전면(이름) {
    if (!광고.준비됨확인()) return false;
    return new Promise(res => {
      window.adBreak({ type:"next", name:이름, beforeAd:()=>소리.배경음_멈춤(), afterAd:()=>{ 소리.배경음_재개(); res(true); } });
      setTimeout(() => res(false), 30000);
    });
  },
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
  전면횟수: 0,
  async 전면_시도() { 광고.전면횟수++; if (광고.전면횟수 % 3 === 0) return 광고.전면(광고.자리.전면); return false; },
  // 결제 (Digital Goods API, TWA 안에서만). 나중에 연결.
  async 뼈다귀팩(수) { if (!광고.결제준비됨) return false; return false; },
};

// ── 보상형 광고 한 곳 (v5.57). 게임은 showRewardedAd(onReward) 만 부른다. 끝까지 보면 onReward() 를 한 번 부른다.
// TODO(광고 SDK): H5 Games Ads 승인 뒤 index.html 의 adsbygoogle 태그를 되살리고 광고.준비됨=true.
//   그러면 아래 첫 갈래가 adBreak({type:'reward', beforeReward:show=>show(), adViewed:…}) 로 진짜 광고를 튼다.
//   아이 대상 앱이라 인증된(가족용) 광고만. 외부 광고 스크립트는 아직 하나도 안 불러온다.
//   승인 전에는 3초짜리 「광고 자리 (시험)」 카드를 보여 주고 보상을 준다.
async function showRewardedAd(onReward, 자리) {
  if (광고.보는중) return false;
  광고.보는중 = true;
  try {
    let ok;
    if (광고.준비됨확인()) ok = await 광고.재생(자리 || "reward");
    else ok = await 광고.시험카드(3);
    if (ok && typeof onReward === "function") onReward();
    return ok;
  } finally { 광고.보는중 = false; }
}
광고.시험카드 = function(초) {
  return new Promise(res => {
    const en = (저장.자료 && 저장.자료.언어) === "en";
    const 판 = document.createElement("div");
    판.style.cssText = "position:fixed;inset:0;z-index:99;display:flex;align-items:center;justify-content:center;background:rgba(10,14,34,.88);font-family:'DungGeunMo','Galmuri','NeoDunggeunmo',monospace;touch-action:none";
    판.innerHTML = '<div style="width:72vw;max-width:300px;background:#f6ecd2;border:4px solid #3a2414;box-shadow:0 6px 0 #1a0e08;padding:22px 14px;text-align:center;color:#2a1c10">'
      + '<div style="font-size:20px;font-weight:bold">' + (en ? "Ad slot (test)" : "광고 자리 (시험)") + '</div>'
      + '<div style="margin:14px 0 8px;font-size:13px;color:#6a5440">' + (en ? "A real ad will play here later" : "나중에 여기서 진짜 광고가 나와요") + '</div>'
      + '<div data-n style="font-size:34px;font-weight:bold;color:#e04870">' + 초 + '</div>'
      + '<button data-x style="margin-top:12px;font:inherit;font-size:12px;background:none;border:0;color:#8a7a68;text-decoration:underline">' + (en ? "Close (no reward)" : "닫기 (보상 없음)") + '</button></div>';
    document.body.appendChild(판);
    let 남 = 초, 끝 = false;
    const 마침 = ok => { if (끝) return; 끝 = true; clearInterval(타); 판.remove(); res(ok); };
    const 타 = setInterval(() => { 남--; if (남 <= 0) 마침(true); else 판.querySelector("[data-n]").textContent = 남; }, 1000);
    판.querySelector("[data-x]").addEventListener("click", e => { e.stopPropagation(); 마침(false); });
    판.addEventListener("pointerdown", e => e.stopPropagation());
  });
};
