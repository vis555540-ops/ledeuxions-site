/* 흐물 피구 / Wobble Dodgeball - i18n + global namespace */
(function () {
  'use strict';
  var G = window.G = {};
  var T = {
    en: {
      teamSize: 'PLAYERS', vs: '{0} vs {1}',
      pHost: 'HOST TEAM', pGuest: 'FRIEND TEAM',
      online: 'PLAY WITH A FRIEND', mkRoom: 'CREATE ROOM', joinRoom: 'JOIN ROOM', back: 'BACK', cancel: 'CANCEL', share: 'SHARE LINK', copied: 'Link copied!', join: 'JOIN',
      roomCode: 'Room code', codeHint: 'Enter the 4-digit code', waitFriend: 'Waiting for your friend...', shareHint: 'Send the code or the link to your friend.',
      connecting: 'Connecting...', joining: 'Joining room {0}...', noroom: 'No room with that code.', full: 'That room is full.', netErr: 'Could not connect. Check your internet.',
      peerLeft: 'Your friend left the game.', hostLeft: 'The host left the game.', lost: 'Connection lost.', youHost: 'You: LEFT team (blue)', youGuest: 'You: RIGHT team (orange)',
      vsWin: 'YOU WIN!', vsLose: 'YOU LOSE...', rematch: 'REMATCH', waitHost: 'Waiting for the host...', shareText: 'Play Wobble Dodgeball with me! Room {0}',
      title1: 'WOBBLE', title2: 'DODGEBALL', sub: 'Floppy team dodgeball',
      play: 'PLAY', locked: 'LOCKED', beaten: 'CLEARED', next: 'NEXT UP', champion: 'CHAMPION!',
      t0: 'Jelly Jigglers', t1: 'Tummy Rumblers', t2: 'Peep Peep Chicks', t3: 'Clang Clang Pots', t4: 'Toot Toot Overlords', my: 'Wobble Squad',
      round: 'ROUND {0}', ready: 'READY...', go: 'DODGE!',
      out: 'OUT!', catch: 'CATCH!', caughtOut: 'CAUGHT OUT!', dodge: 'WHOOSH!', backIn: 'BACK IN!', tooBig: 'TOO BIG!',
      spReady: 'SPECIAL READY!', nextSp: 'NEXT', matchPoint: 'MATCH POINT!',
      roundWin: 'ROUND WON!', roundLose: 'ROUND LOST', draw: 'DRAW', timeUp: 'TIME UP!',
      win: 'YOU WIN!', lose: 'YOU LOSE...', nextTeam: 'NEXT TEAM', retry: 'RETRY', menu: 'MENU', resume: 'RESUME', paused: 'PAUSED',
      sound: 'SOUND', on: 'ON', off: 'OFF', lang: '한국어',
      tThrow: 'THROW', tCatch: 'CATCH', tJump: 'JUMP', tPass: 'PASS', tSwitch: 'SWAP', tSp: 'SUPER',
      you: 'YOU', catchNow: 'CATCH!',
      hintK: 'WASD / Arrows: move   J or Z (hold): throw   K or X: catch   Space: jump   I or V: pass / swap   O or B: special',
      hintT: 'Hold THROW to power up  ·  tap CATCH right before the ball hits you!',
      help: '<b>Hit</b> an enemy to send them out. <b>Catch</b> a throw to steal the ball! Outfielders who hit someone come back in.<br>Catches and dodges fill the <b>SPECIAL</b> meter. Jump-throws are extra strong.',
      winSub: 'You beat the {0}!', loseSub: 'The {0} won this time. Try again!', unlocked: 'New team unlocked!', allClear: 'You beat every team! Play any of them again for fun.',
      wows: ['WOW!', 'OOOH!', 'YEAH!', 'WHOA!', 'NICE!'],
      sp_banana: 'BANANA SHOT', sp_fart: 'TOOT ROCKET', sp_chicken: 'CHICKEN SHOT', sp_giant: 'MEGA BALL', sp_clone: 'TRIPLE TRICK', sp_slow: 'SNAIL... ZOOM!',
      sp_boomer: 'BOOMERANG', sp_zigzag: 'ZIGZAG', sp_ghost: 'GHOST BALL', sp_flip: 'FLIP METEOR', sp_sneeze: 'SNEEZE SHOT', sp_bouncy: 'BOING BOING',
      ss_banana: 'it curves like crazy!', ss_fart: 'pfffrrt... VROOM!', ss_chicken: 'wait, that is a chicken', ss_giant: 'it keeps growing!', ss_clone: 'only one is real!', ss_slow: 'sooo slooow...',
      ss_boomer: 'it comes back around!', ss_zigzag: 'zig! zag! zig!', ss_ghost: 'now you see it...', ss_flip: 'triple flip from the sky!', ss_sneeze: 'ah... ah...', ss_bouncy: 'boing boing boing!',
      toot: 'TOOT!', zoom: 'ZOOM!', bawk: 'BAWK!', ah: 'ah...', achoo: 'AH-CHOO!!'
    },
    ko: {
      teamSize: '인원', vs: '{0}대{1}',
      pHost: '방장 팀', pGuest: '친구 팀',
      online: '친구랑 대전', mkRoom: '방 만들기', joinRoom: '방 들어가기', back: '뒤로', cancel: '취소', share: '링크 보내기', copied: '링크를 복사했어요!', join: '들어가기',
      roomCode: '방 번호', codeHint: '숫자 4개를 넣어요', waitFriend: '친구를 기다리는 중...', shareHint: '친구에게 번호나 링크를 보내 주세요.',
      connecting: '연결하는 중...', joining: '{0}번 방에 들어가는 중...', noroom: '그 번호의 방이 없어요.', full: '그 방은 꽉 찼어요.', netErr: '연결이 안 돼요. 인터넷을 확인해 주세요.',
      peerLeft: '친구가 나갔어요.', hostLeft: '방장이 나갔어요.', lost: '연결이 끊겼어요.', youHost: '나: 왼쪽 팀 (파랑)', youGuest: '나: 오른쪽 팀 (주황)',
      vsWin: '이겼다!', vsLose: '졌다...', rematch: '한 판 더', waitHost: '방장을 기다리는 중...', shareText: '흐물 피구 같이 하자! 방 번호 {0}',
      title1: '흐물', title2: '피구', sub: '흐물흐물 팀 피구',
      play: '시작!', locked: '잠김', beaten: '격파', next: '도전', champion: '챔피언!',
      t0: '말랑 젤리단', t1: '꼬르륵 배꼽단', t2: '삐약 병아리단', t3: '우당탕 냄비단', t4: '뿡뿡 대마왕단', my: '흐물 동네단',
      round: '{0} 라운드', ready: '준비...', go: '피구 시작!',
      out: '아웃!', catch: '잡았다!', caughtOut: '잡혀서 아웃!', dodge: '휙!', backIn: '부활!', tooBig: '너무 커!',
      spReady: '필살 준비!', nextSp: '다음', matchPoint: '매치 포인트!',
      roundWin: '라운드 승리!', roundLose: '라운드 패배', draw: '무승부', timeUp: '시간 끝!',
      win: '이겼다!', lose: '졌다...', nextTeam: '다음 팀', retry: '다시 하기', menu: '메뉴', resume: '계속', paused: '일시정지',
      sound: '소리', on: '켬', off: '끔', lang: 'English',
      tThrow: '던지기', tCatch: '받기', tJump: '점프', tPass: '패스', tSwitch: '바꾸기', tSp: '필살',
      you: '나', catchNow: '받아!',
      hintK: 'WASD/방향키 이동   J·Z 꾹 = 던지기   K·X 받기   스페이스 점프   I·V 패스·바꾸기   O·B 필살',
      hintT: '던지기를 꾹 눌러 힘 모으기  ·  공이 닿기 직전에 받기!',
      help: '공을 <b>맞히면</b> 상대가 아웃. 날아온 공을 <b>받으면</b> 우리 공! 밖에 나간 친구가 맞히면 다시 들어와요.<br>받기·피하기로 <b>필살</b> 게이지가 차요. 점프하며 던지면 더 세요.',
      winSub: '{0}을(를) 이겼어요!', loseSub: '이번엔 {0}이(가) 이겼어요. 다시 해 봐요!', unlocked: '새 팀이 열렸어요!', allClear: '모든 팀을 이겼어요! 아무 팀이나 다시 해도 재밌어요.',
      wows: ['와!', '와아!', '우와!', '오오!', '대박!'],
      sp_banana: '바나나 슛', sp_fart: '방귀 추진 슛', sp_chicken: '꼬꼬댁 슛', sp_giant: '왕왕 거대공', sp_clone: '분신 슛', sp_slow: '느림보 슛',
      sp_boomer: '부메랑 슛', sp_zigzag: '지그재그 슛', sp_ghost: '투명 슛', sp_flip: '공중제비 슛', sp_sneeze: '재채기 슛', sp_bouncy: '통통 슛',
      ss_banana: '엄청 휘어진다~!', ss_fart: '뿌우웅... 슈웅!', ss_chicken: '잠깐, 저거 닭이잖아', ss_giant: '점점 커진다!', ss_clone: '진짜는 하나뿐!', ss_slow: '느으으리이...',
      ss_boomer: '빙 돌아서 온다!', ss_zigzag: '지그! 재그! 지그!', ss_ghost: '보였다 안 보였다...', ss_flip: '하늘에서 떨어진다!', ss_sneeze: '에... 에...', ss_bouncy: '통! 통! 통!',
      toot: '뿌웅!', zoom: '슝!', bawk: '꼬꼬댁!', ah: '에...', achoo: '에취!!'
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
  G.tr = function (str, from) {   // a string translated in language `from` -> the same key in G.lang
    var d = T[from]; if (!d || from === G.lang) return str;
    for (var k in d) { if (d[k] === str) return G.t(k); if (typeof d[k] !== 'string' && d[k].indexOf && d[k].indexOf(str) >= 0) { var w = G.t(k); return w[(Math.random() * w.length) | 0]; } }
    return str;
  };
  G.applyI18n = function () {
    document.documentElement.lang = G.lang;
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) els[i].textContent = G.t(els[i].getAttribute('data-i18n'));
  };
  G.FONT = '"Arial Black","Segoe UI","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';
})();
