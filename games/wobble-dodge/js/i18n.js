/* 언더독 피구 / Underdog Dodgeball - i18n + global namespace */
(function () {
  'use strict';
  var G = window.G = {};
  var T = {
    en: {
      teamSize: 'PLAYERS', vs: '{0} vs {1}',
      gTapStart: 'TAP TO PLAY!', gKeyStart: 'PRESS ANY KEY!', gHowT: 'Left side: move  ·  right buttons: THROW / CATCH / JUMP', gHowK: 'Move: WASD / arrows  ·  J: throw  ·  K: catch  ·  Space: jump',
      gThrowT: 'Hold THROW... then let go!', gThrowK: 'Hold J... then let go to throw!', gRelease: 'Let go to throw!',
      gCatchT: 'Ball coming! Tap CATCH!', gCatchK: 'Ball coming! Press K to catch!',
      gSpT: 'SPECIAL! Tap JUMP, then THROW in the air!', gSpK: 'SPECIAL! Space to jump, then J in the air!',
      gGetT: 'Walk over the ball to grab it', gGetK: 'Walk over the ball to grab it', gPassT: 'Tap CATCH while holding = PASS to your teammate', gPassK: 'K while holding = PASS to your teammate',
      lite: 'LITE MODE', shareShot: 'SHARE', newRec: 'NEW RECORD!', recCat: '{0} catches in one match', recHit: '{0} hits in one match', recStreak: '{0} wins in a row',
      lv: 'LV {0}', streakN: 'Day {0}', daily: 'TODAY:', done: 'DONE', hat: 'HAT', hatOwn: 'own hats', charsN: 'Players {0}/{1}',
      h_star: 'Star Band', h_flower: 'Flower Crown', h_wizard: 'Wizard Hat', h_pirate: 'Pirate Hat', h_viking: 'Viking Helmet', h_goldcrown: 'Champion Crown',
      tier2: 'The teams are back, stronger. Beat the \u2605 teams!',
      xpMatch: 'Match', xpPlay: 'Plays', xpNewTeam: 'New team', xpDaily: 'Daily',
      newChar: 'NEW PLAYER!', newHat: 'NEW HAT!', lvUp: 'LEVEL UP! LV {0}', dailyDone: 'DAILY CHALLENGE CLEAR!', streakDay: 'Day {0} streak!',
      winsToChar: '{0} more win(s): new player', teaseDaily: 'New challenge: {0}', teaseStreak: 'Come back for a Day {0} streak bonus',
      tease: 'Tomorrow (in {0}h):', teaseGift: 'a free mystery player', welcome: 'WELCOME BACK!', ok: 'OK!',
      lockHint: 'Locked: {0} more win(s) or come back tomorrow for a free player', lockHint2: 'Locked: come back tomorrow for a free player', pickTeam: 'CHANGE TEAM',
      d_win: 'Win a match', d_spWin: 'Finish a round with a SPECIAL', d_left: 'Win a round with {0} still in', d_catch: 'Catch {0} balls in one match',
      d_sp: 'Throw {0} SPECIALs in one match', d_hit: 'Hit {0} players yourself in one match', d_flaw: 'Win a round without losing anyone',
      pHost: 'HOST TEAM', pGuest: 'FRIEND TEAM',
      online: 'VS FRIEND', mStory: 'STORY', freeSub: 'Any players, any size, any rival', onlineSub: 'Make a room or join one', mNextFoe: 'Next: {0} · {1}/{2}', settings: 'SETTINGS', close: 'CLOSE', ruleSAm: 'CATCH = OUT', ruleSEasy: 'EASY RULES', hatShort: 'HAT: {0}', mkRoom: 'CREATE ROOM', joinRoom: 'JOIN ROOM', back: 'BACK', cancel: 'CANCEL', share: 'SHARE LINK', copied: 'Link copied!', join: 'JOIN',
      roomCode: 'Room code', codeHint: 'Enter the 4-digit code', waitFriend: 'Waiting for your friend...', shareHint: 'Send the code or the link to your friend.',
      connecting: 'Connecting...', joining: 'Joining room {0}...', noroom: 'No room with that code.', full: 'That room is full.', netErr: 'Could not connect. Check your internet.',
      peerLeft: 'Your friend left the game.', hostLeft: 'The host left the game.', lost: 'Connection lost.', youHost: 'You: LEFT team (blue)', youGuest: 'You: RIGHT team (orange)',
      vsWin: 'YOU WIN!', vsLose: 'YOU LOSE...', rematch: 'REMATCH', waitHost: 'Waiting for the host...', shareText: 'Play Underdog Dodgeball with me! Room {0}',
      title1: 'UNDERDOG', title2: 'DODGEBALL', sub: 'From gym-class target to champion',
      play: 'PLAY', locked: 'LOCKED', beaten: 'CLEARED', next: 'NEXT UP', champion: 'CHAMPION!',
      t0: 'Jelly Jigglers', t1: 'Tummy Rumblers', t2: 'Peep Peep Chicks', t3: 'Clang Clang Pots', t4: 'Toot Toot Overlords', my: 'Underdog Squad',
      round: 'ROUND {0}', ready: 'READY...', go: 'DODGE!',
      out: 'OUT!', catch: 'CATCH!', caughtOut: 'CAUGHT OUT!', dodge: 'WHOOSH!', backIn: 'BACK IN!', tooBig: 'TOO BIG!',
      spReady: 'SPECIAL READY!', nextSp: 'NEXT', matchPoint: 'MATCH POINT!',
      roundWin: 'ROUND WON!', roundLose: 'ROUND LOST', draw: 'DRAW', timeUp: 'TIME UP!',
      win: 'YOU WIN!', lose: 'YOU LOSE...', nextTeam: 'NEXT TEAM', retry: 'RETRY', menu: 'MENU', resume: 'RESUME', paused: 'PAUSED',
      sound: 'SOUND', on: 'ON', off: 'OFF', lang: '한국어',
      tThrow: 'THROW', tGrab: 'CATCH', tJump: 'JUMP', tPass: 'PASS',
      you: 'YOU', catchNow: 'CATCH!', spHow: 'JUMP + THROW = SPECIAL!',
      hintK: 'Move WASD/Arrows · J throw (hold-release) · K catch/pass · Space jump · jump+throw = SPECIAL',
      hintT: 'Hold THROW, let go to throw · CATCH right before the ball hits you · full meter: JUMP and THROW = SPECIAL!',
      keyHelp: 'H: show/hide keys',
      help: '<b>Hit</b> = out. <b>Catch</b> a throw = the thrower is OUT and your teammate who went out first comes back in!<br>Outfielders who hit someone come back in. Catches and dodges fill the <b>SPECIAL</b> meter: then <b>jump and throw</b>.',
      helpEasy: '<b>Hit</b> = out. <b>Catch</b> a throw to steal the ball (easy rules: nobody goes out for it).<br>Outfielders who hit someone come back in. Catches and dodges fill the <b>SPECIAL</b> meter: then <b>jump and throw</b>.',
      ruleAm: 'RULES: CATCH = OUT', ruleEasy: 'EASY RULES (catch = no out)',
      pickTitle: 'PICK YOUR TEAM', pickMine: 'MY TEAM {0}/{1}', pickRandom: 'RANDOM', pickUndo: 'REMOVE', pickReady: 'READY!', pickBack: 'BACK',
      pickHint: 'Tap to pick · tap again to remove · empty slots are filled at random',
      pickHintK: 'Arrows: choose · J/Enter: pick · K: remove · Space: READY',
      stPow: 'POWER', stSpd: 'SPEED', stCat: 'CATCH', special: 'SPECIAL',
      foePick: 'Friend: picking...', foeReady: 'Friend: READY!', waitFoe: 'Waiting for your friend...', foeTeam: 'RIVALS', cdReady: 'READY!', cdFight: 'DODGE!',
      ch12: 'Zappy', ch13: 'Swooshy', ch14: 'Scarfy', ch15: 'Hulky', ch16: 'Grampy', ch17: 'Twinkle', ch18: 'Blazey', ch19: 'Meowy', ch20: 'Cooly', ch21: 'Buzzy', ch22: 'Puffy', ch23: 'Goggly', ch24: 'The Kid', ch25: 'Dex',
      sp_zap: 'ZAP ZAP', sp_sway: 'SWAYING GOURD', sp_fireball: 'HOT POTATO', ss_zap: 'bzzt! bzzt! bzzt!', ss_sway: 'whoa... where is it going?', ss_fireball: 'blazing fast!',
      ch0: 'Curly', ch1: 'Toot Boss', ch2: 'Clucky', ch3: 'Big Belly', ch4: 'Twinny', ch5: 'Snoozy', ch6: 'Spinny', ch7: 'Ziggy', ch8: 'Peekaboo', ch9: 'Flippy', ch10: 'Sniffles', ch11: 'Boingo',
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
      gTapStart: '눌러서 시작!', gKeyStart: '아무 키나 누르면 시작!', gHowT: '왼쪽: 움직이기  ·  오른쪽 버튼: 던지기 / 잡기 / 점프', gHowK: '이동: WASD / 방향키  ·  J: 던지기  ·  K: 잡기  ·  Space: 점프',
      gThrowT: '던지기 꾹 눌렀다가... 떼기!', gThrowK: 'J를 꾹 눌렀다가 떼면 던져요!', gRelease: '떼면 던져요!',
      gCatchT: '공이 와요! 잡기!', gCatchK: '공이 와요! K로 잡기!',
      gSpT: '필살기! 점프 누르고 공중에서 던지기!', gSpK: '필살기! Space로 점프, 공중에서 J!',
      gGetT: '공 위로 걸어가면 주워요', gGetK: '공 위로 걸어가면 주워요', gPassT: '공 들고 잡기 = 친구에게 패스', gPassK: '공 들고 K = 친구에게 패스',
      lite: '가볍게', shareShot: '공유', newRec: '새 기록!', recCat: '한 판에 {0}번 잡기', recHit: '한 판에 {0}명 맞히기', recStreak: '{0}연승',
      lv: 'LV {0}', streakN: '{0}일째', daily: '오늘:', done: '완료', hat: '모자', hatOwn: '기본 모자', charsN: '선수 {0}/{1}',
      h_star: '별 머리띠', h_flower: '꽃 왕관', h_wizard: '마법사 모자', h_pirate: '해적 모자', h_viking: '바이킹 투구', h_goldcrown: '챔피언 왕관',
      tier2: '팀들이 더 세져서 돌아왔어요. \u2605 팀을 이겨 봐요!',
      xpMatch: '경기', xpPlay: '활약', xpNewTeam: '새 팀', xpDaily: '오늘 도전',
      newChar: '새 선수!', newHat: '새 모자!', lvUp: '레벨 업! LV {0}', dailyDone: '오늘의 도전 성공!', streakDay: '{0}일 연속 출석!',
      winsToChar: '{0}번 더 이기면 새 선수', teaseDaily: '새 도전: {0}', teaseStreak: '오면 {0}일 연속 보너스',
      tease: '내일 ({0}시간 뒤):', teaseGift: '비밀 선수 선물', welcome: '다시 왔네요!', ok: '좋아!',
      lockHint: '잠김: {0}번 더 이기거나 내일 오면 선수 선물', lockHint2: '잠김: 내일 오면 선수 선물', pickTeam: '팀 바꾸기',
      d_win: '한 판 이기기', d_spWin: '필살기로 라운드 끝내기', d_left: '{0}명 남기고 라운드 이기기', d_catch: '한 판에 공 {0}번 잡기',
      d_sp: '한 판에 필살기 {0}번 쓰기', d_hit: '한 판에 내가 {0}명 맞히기', d_flaw: '아무도 안 나가고 라운드 이기기',
      pHost: '방장 팀', pGuest: '친구 팀',
      online: '친구랑 대전', mStory: '이야기', freeSub: '선수·인원·상대 마음대로', onlineSub: '방 만들기 · 방 들어가기', mNextFoe: '다음 상대: {0} · {1}/{2}', settings: '설정', close: '닫기', ruleSAm: '잡으면 아웃', ruleSEasy: '쉬운 규칙', hatShort: '모자: {0}', mkRoom: '방 만들기', joinRoom: '방 들어가기', back: '뒤로', cancel: '취소', share: '링크 보내기', copied: '링크를 복사했어요!', join: '들어가기',
      roomCode: '방 번호', codeHint: '숫자 4개를 넣어요', waitFriend: '친구를 기다리는 중...', shareHint: '친구에게 번호나 링크를 보내 주세요.',
      connecting: '연결하는 중...', joining: '{0}번 방에 들어가는 중...', noroom: '그 번호의 방이 없어요.', full: '그 방은 꽉 찼어요.', netErr: '연결이 안 돼요. 인터넷을 확인해 주세요.',
      peerLeft: '친구가 나갔어요.', hostLeft: '방장이 나갔어요.', lost: '연결이 끊겼어요.', youHost: '나: 왼쪽 팀 (파랑)', youGuest: '나: 오른쪽 팀 (주황)',
      vsWin: '이겼다!', vsLose: '졌다...', rematch: '한 판 더', waitHost: '방장을 기다리는 중...', shareText: '언더독 피구 같이 하자! 방 번호 {0}',
      title1: '언더독', title2: '피구', sub: '체육 시간 과녁에서 챔피언까지',
      play: '시작!', locked: '잠김', beaten: '격파', next: '도전', champion: '챔피언!',
      t0: '말랑 젤리단', t1: '꼬르륵 배꼽단', t2: '삐약 병아리단', t3: '우당탕 냄비단', t4: '뿡뿡 대마왕단', my: '언더독 동네단',
      round: '{0} 라운드', ready: '준비...', go: '피구 시작!',
      out: '아웃!', catch: '잡았다!', caughtOut: '잡혀서 아웃!', dodge: '휙!', backIn: '부활!', tooBig: '너무 커!',
      spReady: '필살 준비!', nextSp: '다음', matchPoint: '매치 포인트!',
      roundWin: '라운드 승리!', roundLose: '라운드 패배', draw: '무승부', timeUp: '시간 끝!',
      win: '이겼다!', lose: '졌다...', nextTeam: '다음 팀', retry: '다시 하기', menu: '메뉴', resume: '계속', paused: '일시정지',
      sound: '소리', on: '켬', off: '끔', lang: 'English',
      tThrow: '던지기', tGrab: '잡기', tJump: '점프', tPass: '패스',
      you: '나', catchNow: '잡아!', spHow: '점프하며 던지면 필살!',
      hintK: '이동 WASD/방향키 · J 던지기(꾹-떼기) · K 잡기/패스 · Space 점프 · 점프+던지기 = 필살',
      hintT: '던지기 꾹 눌렀다 떼기 · 공이 닿기 직전에 잡기 · 게이지 가득: 점프하며 던지면 필살!',
      keyHelp: 'H: 키 안내 켜기/끄기',
      help: '공에 <b>맞으면</b> 아웃. 날아온 공을 <b>잡으면</b> 던진 사람이 아웃 + 먼저 나간 우리 편이 다시 들어와요!<br>밖에 나간 친구가 맞히면 다시 들어와요. 잡기·피하기로 <b>필살</b> 게이지가 차면 <b>점프하며 던지기</b>.',
      helpEasy: '공에 <b>맞으면</b> 아웃. 날아온 공을 <b>잡으면</b> 우리 공! (쉬운 규칙: 잡혀도 아웃 없음)<br>밖에 나간 친구가 맞히면 다시 들어와요. 잡기·피하기로 <b>필살</b> 게이지가 차면 <b>점프하며 던지기</b>.',
      ruleAm: '규칙: 잡으면 아웃', ruleEasy: '쉬운 규칙 (잡아도 아웃 없음)',
      pickTitle: '팀 고르기', pickMine: '내 팀 {0}/{1}', pickRandom: '랜덤', pickUndo: '빼기', pickReady: '준비!', pickBack: '뒤로',
      pickHint: '눌러서 고르기 · 다시 누르면 빼기 · 빈 자리는 랜덤으로 채워요',
      pickHintK: '방향키 고르기 · J/Enter 넣기 · K 빼기 · Space 준비',
      stPow: '힘', stSpd: '속도', stCat: '받기', special: '필살',
      foePick: '친구: 고르는 중...', foeReady: '친구: 준비 완료!', waitFoe: '친구를 기다리는 중...', foeTeam: '상대 팀', cdReady: '준비!', cdFight: '피구 시작!',
      ch12: '찌릿이', ch13: '휘날이', ch14: '목도리', ch15: '우람이', ch16: '호리병 할배', ch17: '반짝이', ch18: '활활이', ch19: '냥냥이', ch20: '선글이', ch21: '윙윙이', ch22: '뭉게', ch23: '고글이', ch24: '주인공', ch25: '덱스',
      sp_zap: '찌릿찌릿 슛', sp_sway: '흔들 호리병 슛', sp_fireball: '뜨거운 감자 슛', ss_zap: '찌릿! 찌릿! 찌릿!', ss_sway: '어어... 어디로 가?', ss_fireball: '엄청 빠르다!',
      ch0: '뽀글이', ch1: '뿡대장', ch2: '꼬꼬댁', ch3: '왕배꼽', ch4: '쌍쌍이', ch5: '쿨쿨이', ch6: '빙글이', ch7: '지그잭', ch8: '투명이', ch9: '휘리릭', ch10: '에취왕', ch11: '통통이',
      winSub: '{0}을(를) 이겼어요!', loseSub: '이번엔 {0}이(가) 이겼어요. 다시 해 봐요!', unlocked: '새 팀이 열렸어요!', allClear: '모든 팀을 이겼어요! 아무 팀이나 다시 해도 재밌어요.',
      wows: ['와!', '와아!', '우와!', '오오!', '대박!'],
      sp_banana: '바나나 슛', sp_fart: '방귀 추진 슛', sp_chicken: '꼬꼬댁 슛', sp_giant: '왕왕 거대공', sp_clone: '분신 슛', sp_slow: '느림보 슛',
      sp_boomer: '부메랑 슛', sp_zigzag: '지그재그 슛', sp_ghost: '투명 슛', sp_flip: '공중제비 슛', sp_sneeze: '재채기 슛', sp_bouncy: '통통 슛',
      ss_banana: '엄청 휘어진다~!', ss_fart: '뿌우웅... 슈웅!', ss_chicken: '잠깐, 저거 닭이잖아', ss_giant: '점점 커진다!', ss_clone: '진짜는 하나뿐!', ss_slow: '느으으리이...',
      ss_boomer: '빙 돌아서 온다!', ss_zigzag: '지그! 재그! 지그!', ss_ghost: '보였다 안 보였다...', ss_flip: '하늘에서 떨어진다!', ss_sneeze: '에... 에...', ss_bouncy: '통! 통! 통!',
      toot: '뿌웅!', zoom: '슝!', bawk: '꼬꼬댁!', ah: '에...', achoo: '에취!!'
    }
  };

  // player goals (meta.js MT.UNLOCKS) + one-line play styles
  var U = {
    en: {
      u_wins1: 'Win 1 match', u_wins: 'Win matches {0}/{1}', u_hit: 'Hit opponents {0}/{1}', u_sp: 'Use special shots {0}/{1}',
      u_outsBest: 'Put {1} out in ONE match (best {0}/{1})', u_cat: 'Catch balls {0}/{1}', u_spBest: '{1} specials in ONE match (best {0}/{1})',
      u_rev: 'Catch to bring teammates back {0}/{1}', u_ban: 'Hit with the BANANA SHOT {0}/{1}', u_noHit: 'Win without getting hit',
      u_days: 'Come and play on 3 days {0}/{1}', u_w7: 'Win a 7 vs 7 match', u_flipAir: 'FLIP METEOR a jumping enemy',
      u_mpCatch: 'Win the match with a catch on match point', u_beaten: 'Beat ladder team 5 ({0}/{1})', u_hulkWin: 'Win with Hulky on your team',
      u_airCat: 'Catch a ball while jumping', u_passBest: 'Pass {1} times in a row without throwing (best {0}/{1})', u_code: 'Tickle the title',
      s_airCat: 'Secret: cats hunt in mid-air...', s_passBest: 'Secret: buzz buzz, teammate to teammate...', s_code: 'Secret: the title looks ticklish...',
      babam: 'TA-DA!', freeBtn: 'FREE PLAY', u_req: 'Unlock {0} first...', u_secret: '???', unlTitle: 'NEW PLAYER!', unlHow: 'Unlocked: {0}', unlOk: 'NICE!',
      nextUnl: 'Next player: {0}', lockHow: 'Locked: {0}', teaseDays: 'Come back on {0} more day(s): a new player', charsNew: 'NEW',
      ps0: 'All-rounder: good at everything', ps1: 'Big cannon, a bit slow', ps2: 'Light on its feet: run and dodge', ps3: 'Strongest arm, turtle feet',
      ps4: 'Quick trickster: only one ball is real', ps5: 'Catching expert, takes it slow', ps6: 'Fastest feet, weakest arm: boomerang from behind', ps7: 'Quick dodger, zigzags to confuse',
      ps8: 'Nimble, throws a ball you cannot see', ps9: 'All attack: cannot catch at all', ps10: 'Steady defender who catches well', ps11: 'Helper: catch to bring friends back',
      ps12: 'So fast it is a dodge master, poor catcher', ps13: 'Fastball rival with a curving shot', ps14: 'Hit-and-run ninja: fast and strong, no catching', ps15: 'Catches like a wall, moves slow',
      ps16: 'Best hands; the swaying shot fools everyone', ps17: 'Weak arm, but catches everything', ps18: 'Blazing power, forget catching', ps19: 'Jump and snatch, cat style',
      ps20: 'Cool and strong boomerang', ps21: 'Busy bee: pass, pass, ZAP', ps22: 'Heavy, sturdy cloud', ps23: 'Pilot who hunts jumpers', ps24: 'Falls down, gets up. Every. Single. Time.', ps25: 'Your old best friend: quick feet, big grin'
    },
    ko: {
      u_wins1: '한 판 이기기', u_wins: '이기기 {0}/{1}', u_hit: '상대 맞히기 {0}/{1}', u_sp: '필살기 쓰기 {0}/{1}',
      u_outsBest: '한 판에 {1}명 아웃시키기 (최고 {0}/{1})', u_cat: '공 잡기 {0}/{1}', u_spBest: '한 판에 필살기 {1}번 (최고 {0}/{1})',
      u_rev: '잡아서 우리 편 살리기 {0}/{1}', u_ban: '바나나 슛으로 맞히기 {0}/{1}', u_noHit: '한 번도 안 맞고 이기기',
      u_days: '3일 놀러 오기 {0}/{1}', u_w7: '7대7에서 이기기', u_flipAir: '점프한 상대를 공중제비 슛으로 맞히기',
      u_mpCatch: '매치 포인트에서 잡아서 끝내기', u_beaten: '사다리 5번째 팀 이기기 ({0}/{1})', u_hulkWin: '우람이와 함께 이기기',
      u_airCat: '점프한 채로 공 잡기', u_passBest: '안 던지고 {1}번 연속 패스 (최고 {0}/{1})', u_code: '제목 간질이기',
      s_airCat: '비밀: 고양이는 하늘에서 사냥해요…', s_passBest: '비밀: 윙윙, 동료에게서 동료에게…', s_code: '비밀: 제목이 간지럽대요…',
      babam: '빠밤!', freeBtn: '프리 게임', u_req: '{0} 열면 보여요…', u_secret: '???', unlTitle: '새 선수!', unlHow: '해낸 것: {0}', unlOk: '좋아!',
      nextUnl: '다음 선수: {0}', lockHow: '잠김: {0}', teaseDays: '{0}일 더 오면 새 선수', charsNew: '새',
      ps0: '뭐든 무난한 올라운더', ps1: '힘센 대포, 조금 굼뜸', ps2: '가볍게 뛰며 피하기', ps3: '최강 힘, 거북이 걸음',
      ps4: '재빠른 속임수꾼, 진짜 공은 하나', ps5: '잡기 장인, 느긋하게 버팀', ps6: '제일 빠르고 힘은 제일 약함, 부메랑으로 뒤를 노림', ps7: '재빠르게 피하고 지그재그로 헷갈리게',
      ps8: '날쌔고, 안 보이는 공', ps9: '공격만! 받기는 꽝', ps10: '잘 받고 버티는 수비수', ps11: '잡아서 친구 살리는 도우미',
      ps12: '빨라서 피하기 달인, 받기는 서툼', ps13: '강속구 라이벌, 휘는 공', ps14: '치고 빠지는 닌자: 빠르고 세지만 못 받음', ps15: '공 잡기 힘세게, 느림',
      ps16: '받기 최고, 흔들 공으로 속임', ps17: '힘은 약해도 다 받아내는 응원단', ps18: '불처럼 세게, 받기는 포기', ps19: '점프해서 낚아채는 고양이',
      ps20: '멋있고 센 부메랑', ps21: '부지런히 패스하는 일벌, 찌릿!', ps22: '묵직하게 버티는 구름', ps23: '점프한 상대를 노리는 비행사', ps24: '넘어져도 일어난다. 매번.', ps25: '옛 단짝 친구: 빠른 발, 큰 웃음'
    }
  };
  for (var lk in U) for (var kk in U[lk]) T[lk][kk] = U[lk][kk];
  G.addStr = function (o) { for (var l in o) for (var k in o[l]) if (T[l]) T[l][k] = o[l][k]; };   // more strings from other files (story.js)
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
