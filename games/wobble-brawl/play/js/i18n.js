/* Wobble Brawl - i18n + global namespace */
(function () {
  'use strict';
  var G = window.G = {};
  G.W = 1280; G.H = 720;
  var T = {
    en: {
      title1: 'WOBBLE', title2: 'BRAWL', sub: 'Stickman Ragdoll Duel',
      play: 'PLAY', vscpu: 'VS CPU', twop: '2 PLAYERS', shop: 'SKINS & HATS',
      easy: 'EASY', normal: 'NORMAL', hard: 'HARD',
      map: 'ARENA', random: 'RANDOM',
      m_roof: 'Rooftop', m_crane: 'Crane Site', m_train: 'Train Top', m_ice: 'Ice Floes', m_tramp: 'Bounce Park', m_spin: 'Spin Factory',
      daily: 'DAILY CHALLENGE', reward: 'Reward', done: 'DONE!', claim: 'Completed',
      streak: 'WIN STREAK', best: 'BEST',
      round: 'ROUND {0}', fight: 'FIGHT!', ko: 'K.O.!', ringout: 'RING OUT!', timeup: 'TIME UP!', draw: 'DRAW!',
      p1: 'P1', p2: 'P2', cpu: 'CPU', you: 'YOU',
      wins: '{0} WINS!', youwin: 'YOU WIN!', youlose: 'YOU LOSE', roundTo: 'ROUND TO {0}',
      rematch: 'REMATCH', next: 'NEXT FIGHT', menu: 'MENU', resume: 'RESUME', paused: 'PAUSED', back: 'BACK',
      music: 'MUSIC', sfx: 'SOUND', on: 'ON', off: 'OFF',
      skins: 'SKINS', hats: 'HATS', buy: 'BUY', equip: 'EQUIP', equipped: 'EQUIPPED', tryad: 'TRY 1 MATCH', trying: 'TRYING',
      doublead: 'DOUBLE COINS', coinsEarned: 'Coins', streakBonus: 'Streak bonus',
      replay: 'REPLAY', notenough: 'Not enough coins',
      ctl1: 'P1: A/D move, W jump, F punch, G kick, H grab/throw',
      ctl2: 'P2: Arrows move/jump, J punch, K kick, L grab/throw',
      ctl1p: 'A/D: move   W: jump (x2)   F: punch   G: kick   H: grab / throw      (or Arrows + J K L)',
      howto: 'HOW TO PLAY', a_move: 'MOVE', a_jump: 'JUMP x2', a_punch: 'PUNCH', a_kick: 'KICK', a_grab: 'GRAB / THROW', orKeys: 'or', tapSkip: 'press any key to start', stickL: 'STICK',
      ctlTouch: 'Stick: move   JUMP x2   HIT   KICK   GRAB: grab / throw item',
      tip: 'Knock them off the stage or drain their health. Best of 3!',
      d_win: 'Win {0} matches vs CPU', d_out: 'Score {0} ring outs', d_hits: 'Land {0} hits',
      d_throw: 'Throw your opponent {0} times', d_hard: 'Win {0} match on HARD', d_item: 'Pick up {0} items', d_round: 'Win {0} rounds',
      rotate: 'Rotate your device', pow: ['POW!', 'BAM!', 'WHAM!', 'BONK!', 'BOP!', 'THWACK!'],
      s_red: 'Classic Red', s_blue: 'Ocean Blue', s_lime: 'Lime', s_sun: 'Sunny', s_gum: 'Bubblegum', s_violet: 'Violet', s_ghost: 'Ghost', s_shadow: 'Shadow', s_gold: 'Gold', s_rainbow: 'Rainbow',
      h_none: 'No Hat', h_cap: 'Cap', h_band: 'Headband', h_party: 'Party Hat', h_top: 'Top Hat', h_cone: 'Traffic Cone', h_chef: 'Chef Hat', h_prop: 'Propeller', h_halo: 'Halo', h_crown: 'Crown',
      suddenTie: 'TIE - REPLAY ROUND'
    },
    ko: {
      title1: '휘청휘청', title2: '졸라맨 대결', sub: '래그돌 스틱맨 1:1 격투',
      play: '바로 시작', vscpu: 'CPU 대전', twop: '2인 대전', shop: '스킨 · 모자',
      easy: '쉬움', normal: '보통', hard: '어려움',
      map: '경기장', random: '랜덤',
      m_roof: '옥상', m_crane: '공사장 크레인', m_train: '기차 위', m_ice: '얼음', m_tramp: '트램폴린', m_spin: '회전판 공장',
      daily: '오늘의 도전', reward: '보상', done: '완료!', claim: '달성 완료',
      streak: '연승', best: '최고',
      round: '{0} 라운드', fight: '시작!', ko: 'K.O.!', ringout: '장외!', timeup: '시간 종료!', draw: '무승부!',
      p1: 'P1', p2: 'P2', cpu: 'CPU', you: '나',
      wins: '{0} 승리!', youwin: '승리!', youlose: '패배', roundTo: '{0} 라운드 승',
      rematch: '다시 하기', next: '다음 경기', menu: '메뉴', resume: '계속하기', paused: '일시정지', back: '뒤로',
      music: '음악', sfx: '효과음', on: '켬', off: '끔',
      skins: '스킨', hats: '모자', buy: '구매', equip: '착용', equipped: '착용 중', tryad: '1판 써보기', trying: '체험 중',
      doublead: '코인 2배', coinsEarned: '코인', streakBonus: '연승 보너스',
      replay: '리플레이', notenough: '코인이 부족해요',
      ctl1: 'P1: A/D 이동, W 점프, F 펀치, G 발차기, H 잡기·던지기',
      ctl2: 'P2: 방향키 이동/점프, J 펀치, K 발차기, L 잡기·던지기',
      ctl1p: 'A/D: 이동   W: 점프(2단)   F: 펀치   G: 발차기   H: 잡기·던지기      (또는 방향키 + J K L)',
      howto: '조작법', a_move: '이동', a_jump: '점프 (2단)', a_punch: '펀치', a_kick: '발차기', a_grab: '잡기 · 던지기', orKeys: '또는', tapSkip: '아무 키나 누르면 시작', stickL: '스틱',
      ctlTouch: '스틱: 이동   점프 2단   펀치   킥   잡기: 잡기·아이템 던지기',
      tip: '무대 밖으로 날리거나 체력을 0으로! 3판 2선승',
      d_win: 'CPU 대전 {0}번 승리', d_out: '장외 승리 {0}번', d_hits: '공격 {0}번 맞히기',
      d_throw: '상대를 {0}번 던지기', d_hard: '어려움에서 {0}번 승리', d_item: '아이템 {0}개 줍기', d_round: '라운드 {0}번 승리',
      rotate: '기기를 가로로 돌려 주세요', pow: ['퍽!', '쾅!', '뿅!', '빡!', '철썩!', '우당탕!'],
      s_red: '클래식 레드', s_blue: '오션 블루', s_lime: '라임', s_sun: '써니', s_gum: '풍선껌', s_violet: '바이올렛', s_ghost: '고스트', s_shadow: '섀도', s_gold: '골드', s_rainbow: '레인보우',
      h_none: '모자 없음', h_cap: '야구모자', h_band: '머리띠', h_party: '고깔모자', h_top: '신사 모자', h_cone: '라바콘', h_chef: '요리사 모자', h_prop: '프로펠러', h_halo: '천사 링', h_crown: '왕관',
      suddenTie: '동점 - 라운드 다시'
    }
  };
  var nav = (navigator.language || 'en').toLowerCase();
  G.lang = nav.indexOf('ko') === 0 ? 'ko' : 'en';
  G.t = function (k) {
    var s = (T[G.lang] && T[G.lang][k]); if (s === undefined) s = T.en[k]; if (s === undefined) return k;
    if (typeof s !== 'string') return s;
    for (var i = 1; i < arguments.length; i++) s = s.replace('{' + (i - 1) + '}', arguments[i]);
    return s;
  };
  G.applyI18n = function () {
    document.documentElement.lang = G.lang;
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) els[i].textContent = G.t(els[i].getAttribute('data-i18n'));
  };
  G.FONT = '"Arial Black","Segoe UI","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';
})();
