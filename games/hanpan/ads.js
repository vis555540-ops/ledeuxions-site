// 한판퍼즐 광고 — 광고 일은 전부 이 파일에만. (대상: 13세 이상, 아동 대상 아님)
// 지금은 광고가 꺼져 있음(AdMob 계정 정지 중). 그래도 게임은 똑같이 돌아감:
//   · 판 사이 광고(between): 3판 끝날 때마다 한 번 부름 → 지금은 아무것도 안 뜨고 바로 다음 판
//   · 광고 보고 힌트(rewardHint): 광고 있으면 보상형 광고 → 끝나면 힌트. 없으면 「하루 3번 무료」
//
// 🔌 나중에 광고 붙일 때 바꿀 곳 = 아래 「다리(bridge)」 하나뿐.
//   지금 앱은 TWA(크롬이 웹을 엶)라 자바스크립트 다리를 못 꽂음. AdMob 을 쓰려면
//   앱을 WebView 껍데기로 바꾸고 addJavascriptInterface(…, "HanpanAndroid") 로 아래 세 함수를 줌:
//     HanpanAndroid.ready(kind)            → "1"/"0"  (kind = "interstitial" | "rewarded")
//     HanpanAndroid.show(kind, id)         → 광고 띄움. 끝나면 JS 로
//     window.HanpanAds._done(id, ok)       → ok=true: 끝까지 봄(보상 줌) / false: 닫음·실패
//   (TWA 그대로 두고 웹 광고(AdSense 등)로 갈 경우도 bridge.ready/show 만 바꾸면 됨)
(function () {
  'use strict';
  const EVERY = 3;          // 몇 판마다 판 사이 광고
  const FREE_PER_DAY = 3;   // 광고 없을 때 하루 무료 힌트
  const KEY = 'hanpan.ads.v1';

  let A = { day: '', free: 0, solved: 0 };
  try { const t = JSON.parse(localStorage.getItem(KEY) || 'null'); if (t) A = Object.assign(A, t); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} };
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  function roll() { if (A.day !== today()) { A.day = today(); A.free = FREE_PER_DAY; save(); } }

  // ---------- 다리 ----------
  const waits = {};
  let seq = 0;
  const bridge = {
    ready(kind) {
      try { return !!(window.HanpanAndroid && String(window.HanpanAndroid.ready(kind)) === '1'); } catch (e) { return false; }
    },
    show(kind) {
      return new Promise(res => {
        const id = 'a' + (++seq);
        waits[id] = res;
        setTimeout(() => { if (waits[id]) { delete waits[id]; res(false); } }, 90000); // 응답 없으면 그냥 진행
        try { window.HanpanAndroid.show(kind, id); } catch (e) { delete waits[id]; res(false); }
      });
    },
  };

  const stats = { betweenCalls: 0, betweenShown: 0, rewardCalls: 0, rewardShown: 0, freeUsed: 0 };

  window.HanpanAds = {
    stats,
    _done(id, ok) { const r = waits[id]; if (r) { delete waits[id]; r(!!ok); } },

    // 판 하나 끝날 때마다 부름. 3판째마다 판 사이 광고 자리.
    // 반드시 판이 끝난 뒤(다음 판 시작 전)에만 부를 것 — 푸는 도중엔 X.
    solved() { A.solved++; save(); },
    async between() {
      if (A.solved < EVERY) return false;
      A.solved = 0; save();
      stats.betweenCalls++;
      if (!bridge.ready('interstitial')) return false;   // 지금은 여기서 끝 → 바로 다음 판
      stats.betweenShown++;
      await bridge.show('interstitial');
      return true;
    },

    // 힌트 하나를 받을 수 있으면 true. 광고 있으면 보상형 광고 끝까지 봐야 true.
    async rewardHint() {
      stats.rewardCalls++;
      if (bridge.ready('rewarded')) {
        stats.rewardShown++;
        return await bridge.show('rewarded');
      }
      roll();
      if (A.free <= 0) return false;
      A.free--; stats.freeUsed++; save();
      return true;
    },
    // 버튼에 보일 것: 'ad' = 광고 보고 힌트, 숫자 = 오늘 남은 무료 힌트
    hintBadge() { if (bridge.ready('rewarded')) return 'ad'; roll(); return A.free; },
  };
})();
