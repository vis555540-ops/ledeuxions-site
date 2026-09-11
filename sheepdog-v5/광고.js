// 광고.js — 광고·결제 훅. 승인 전에는 광고_준비됨() 이 false.
// H5 Games Ads 승인 후: index.html 에 adsbygoogle 태그 넣고 광고.준비됨=true, 광고_재생/전면_재생 안만 교체.
const 광고 = {
  준비됨: false,
  결제준비됨: false,
  자리: { 뼈다귀:"bone", 이어하기:"revive", 두배:"double", 전면:"interstitial" },
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
  async 이어하기() { return 광고.준비됨확인() ? 광고.재생(광고.자리.이어하기) : false; },
  async 코인두배() { return 광고.준비됨확인() ? 광고.재생(광고.자리.두배) : false; },
  전면횟수: 0,
  async 전면_시도() { 광고.전면횟수++; if (광고.전면횟수 % 3 === 0) return 광고.전면(광고.자리.전면); return false; },
  // 결제 (Digital Goods API, TWA 안에서만). 나중에 연결.
  async 뼈다귀팩(수) { if (!광고.결제준비됨) return false; return false; },
};
