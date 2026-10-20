/* Story layer (all original): a neighbourhood rec center is about to become condos + a parking lot; a misfit crew and a sleepy ex-champ coach
   go up the tournament ladder to win the prize money. Canvas comics (no image files), a sports announcer bar, recruit lines, coach lines,
   the optional training montage. Story text lives in TXT below so it can be rewritten without touching the code. */
(function () {
  'use strict';
  var G = window.G, S = G.story = {}, TAU = Math.PI * 2, INK = '#1b1b2f';
  S.HERO = 0; S.COACH = 3; S.DEX = 7; S.DEV = 1; S.CAPT = 6;   // character ids used in the comics
  // the ringleader from gym class: captain of the developer's team in the final, and the one you play in the final chapter. Swap his look here.
  S.BOSS = { ch: 20, hat: 'shades', uni: '#c9a227' };
  var TXT = {
    en: {
      nmCoach: 'Coach Mo', rvName: 'Dex', bsName: 'Vance', tBoss: 'Glossworth Platinum', stNext: 'CONTINUE ▶', stTap: 'TAP ▶', stSkip: 'SKIP ▶▶',
      stq: 'LOCAL QUALIFIER', str: 'REGIONALS', sts: 'STATE', stn: 'NATIONALS', stf: 'FINAL',
      babam: 'TA-DA!', skTag: 'NEW SKILL!', skName: 'SUPER CATCH (30s)', skDesc: 'Hold CATCH 1 s: every ball that reaches you is caught, for 30 s. Once per match.',
      skQuote: 'Coach Mo: "Thirty seconds where nothing gets past you. Don\'t waste it."', skPop: 'SUPER CATCH!', skOn: 'SUPER CATCH {0}', skHintT: 'Hold CATCH 1 s = SUPER CATCH', skHintK: 'Hold K 1 s = SUPER CATCH',
      trBtn: '🏋 TRAINING +XP', trTitle: 'TRAINING MONTAGE!', trHowK: 'Move: WASD / arrows · Space: hop — dodge everything for 20 s!', trHowT: 'Stick: move · JUMP: hop — dodge everything for 20 s!',
      trCoach: 'Coach Mo: "Chickens. Balloons. Tennis balls. Life throws stuff. Dodge it."', trDone: 'TRAINING DONE!', trSub: 'Dodged {0} · got hit {1}', trXp: 'Training', trEnd: 'STOP',
      trSplat: ['SPLAT!', 'BAWK!', 'BONK!', 'SPLOOSH!'],
      dfBtn: '🏆 DEFEND THE TITLE · Season {0} · {1}/10', dfTitle: 'TITLE DEFENDED!', dfSub: 'Season {0}: every team got tougher.', dfOpen: 'DEFEND THE TITLE!', dfOpenSub: 'The ladder loops, tougher every season.',
      coachSays: 'Coach Mo:',
      cl: ['Get up, kid. The floor\'s not that comfy.', 'Losing is just winning that hasn\'t happened yet.', 'I\'ve lost more games than you\'ve had birthdays. Go again.', 'Shake it off. Then dodge it.', 'Don\'t give up. The rec center\'s counting on you. So is my nap schedule.', 'That was a warm-up. Right? ...RIGHT?'],
      rl: ['He\'s not that good. You\'re just nervous. Again!', 'Breathe. He threw too hard, he\'s tired now. Go!', 'I loosened his shoelaces. Kidding. Mostly. Go!'],
      rlGive: 'You lost, but you got up every single time. That\'s what I need. You\'re on my team.',
      // announcer
      an_hit: ['HE\'S DOWN!', 'RIGHT IN THE BREADBASKET!', 'OH, THAT\'S GONNA LEAVE A MARK!', 'SIT DOWN, PAL!', 'TEXTBOOK! ...A WOBBLY TEXTBOOK!'],
      an_hitBig: ['UNBELIEVABLE!', 'HE\'S DOWN! AND HE\'S NOT GETTING UP!', 'SOMEBODY CALL HIS MOM!'],
      an_hitMe: ['OUCH! THAT ONE STINGS!', 'THE UNDERDOGS LOSE ONE!', 'OOF! RIGHT IN THE PRIDE!'],
      an_catch: ['WHAT A CATCH!', 'HANDS LIKE GLUE!', 'SNATCHED OUT OF THE AIR!', 'CAN YOU BELIEVE IT?!'],
      an_catchFoe: ['CAUGHT! THE CROWD GROANS!', 'OH NO, THEY CAUGHT IT!'],
      an_sp: ['UNBELIEVABLE!', 'IS THAT EVEN LEGAL?!', 'THE CROWD GOES BANANAS!', 'I\'VE NEVER SEEN ANYTHING LIKE IT!'],
      an_spFoe: ['HERE COMES TROUBLE!', 'LOOK OUT, UNDERDOGS!'],
      an_rev: ['AND HE\'S BACK IN!', 'THE COMEBACK IS ON!'],
      an_dodge: ['WHOOSH! LIKE A NOODLE!', 'MISSED BY A HAIR!', 'BENDY! SO BENDY!'],
      an_mp: ['MATCH POINT! YOU COULD HEAR A PIN DROP!', 'ONE LEFT! THIS IS IT, FOLKS!'],
      an_koWin: ['THE UNDERDOGS TAKE THE ROUND!', 'WHAT A FINISH!'], an_koLose: ['OOF! THE UNDERDOGS ARE REELING!', 'THAT ROUND GOES THE OTHER WAY!'],
      an_sc: ['MAGNET HANDS! NOTHING GETS PAST HIM!', 'SUPER CATCH IS ON!'], an_scCatch: ['ANOTHER ONE! STICKY HANDS!', 'HE CATCHES EVERYTHING!'],
      an_o_rival: 'PARK COURT. ONE ON ONE. OLD FRIENDS, NEW GRUDGE!', an_o_q: 'LIVE FROM THE LOCAL QUALIFIER!', an_o_r: 'WELCOME TO REGIONALS, FOLKS!', an_o_s: 'THE STATE FINALS ARE ON!',
      an_o_n: 'NATIONALS! THE BIG ONE!', an_o_f: 'THE FINAL! THE KID FROM GYM CLASS VS. VANCE AND THE MONEY!', an_o_d: 'THE CHAMPS DEFEND THE TITLE!',
      an_boss: ['VANCE IS DOWN! THIS ONE\'S PERSONAL, FOLKS!', 'THE CAPTAIN HITS THE FLOOR! THE KID FROM GYM CLASS DID IT!'],
      // comics
      cm_pro: 'CHAPTER 1 \u00B7 GYM CLASS', pro1c: 'Gym class. Dodgeball. Again.', pro1a: 'Nice catch... with your FACE!', pro1b: 'Vance\'s rule: the new kid is the target.', laugh: 'HA HA!',
      cm_friend: 'CHAPTER 2 \u00B7 OLD FRIENDS', fr1a: '...Okay. You got better.', fr1b: 'You got meaner.', fr2a: 'Vance made picking on you look cool. I went along. That was dumb.', fr2b: 'Then help me beat him.', fr2c: 'I\'m in.',
      pro2a: 'Dex... we used to be friends.', pro2b: 'Used to.', pro3c: 'After school.', pro3a: 'You. Me. Park court. One on one.', pro3b: 'Heh. Bring a helmet.', sgPark: 'PARK COURT',
      cm_coach: 'CHAPTER 3 \u00B7 THE COACH', co1c: 'Someone on the bench was watching...', co1a: 'Not bad, kid. We need you.', co1b: 'Who are YOU?',
      co2a: 'Coach Mo. Former champion. Current professional napper.', co2b: '...Are you okay?',
      co3c: 'The rec center. Sold to a rich developer.', co3a: 'Condos and a parking lot. Unless we win the Nationals prize money.', co3b: 'Then we WIN!', sgSold: 'SOLD! future parking lot', sgRec: 'WOBBLE REC CENTER',
      cm_r: 'CHAPTER 4 \u00B7 REGIONALS', r1c: 'Regionals. Real bleachers. Real pressure.', r1a: 'Bigger gym, louder crowd, same ball.', r2a: 'Coach, what\'s the plan?', r2b: 'Plan? Dodge. I\'ll be in the van.',
      cm_rb: 'REGIONAL FINAL', rb1a: 'You\'re the rec-center kids? Cute.', rb2a: 'Cute AND bendy.', rb2b: 'Kid. Don\'t poke the bear. ...Okay, a little.',
      cm_s: 'CHAPTER 5 \u00B7 STATE', s1c: 'Meanwhile, on the 80th floor...', s1a: 'Those rec-center kids made State? Get my elite team ready.', s2a: 'The rec center needs us. One match at a time.', s2b: 'LET\'S GO!',
      cm_sb: 'STATE FINAL', sb1a: 'Last stop before Nationals. For YOU, I mean.', sb1b: 'Funny. I was going to say that.',
      cm_n: 'CHAPTER 6 \u00B7 NATIONALS', n1c: 'Nationals. Lights. Cameras. Way too many mascots.', n1a: 'I lost my final here. Tripped on my own shoelace.', n2a: 'Then tie your shoes, Coach.', n2b: '...I wear slippers now.',
      cm_f: 'THE FINAL', f0c: 'Gym class. Three years of it.', f0a: 'Remember me? Still catching with your face?', f1a: 'Win, and the bulldozers roll on Monday.', f1b: 'My team. My captain. Your parking lot.', f2a: 'Not this time, Vance.', f2b: 'FOR THE REC CENTER!', f3a: 'Kid... go be the underdog.',
      sgSaved: 'SAVED!', e1a: 'I\'m gonna need a really long nap.', e2c: 'NATIONAL CHAMPIONS!', cm_credits: 'THANK YOU',
      cr: ['WOBBLE DODGEBALL', 'starring', 'THE WOBBLE SQUAD', 'Coach Mo as himself', 'Dex as the old friend', 'Vance as the captain', 'the parking lot as... nothing', 'no rubber chickens were harmed', 'THANK YOU FOR PLAYING!', 'next: DEFEND THE TITLE'],
      // recruit lines (said when a player joins)
      ru1: 'I tooted my way through three schools. Yours is next. I\'m in.', ru2: 'You won? BAWK! Put me on the team!', ru4: 'Two of me, zero of them. Count us in.',
      ru6: 'You catch like a vacuum, I spin like a fan. Team?', ru8: 'You keep bringing friends back. I want a team like that.', ru9: 'You won on the big court? Sign me up. Upside down.',
      ru10: 'You came back three days in a row. Ah... ah... I\'m in!', ru11: 'A catch on match point? That\'s my kind of drama.', ru12: 'Five hits already? You\'re electric. Bzzt, I\'m in.',
      ru13: 'Bananas that curve like mine? Fine. Rivals... and teammates.', ru14: 'Not one hit on you. A ninja respects that.', ru15: 'You beat team five. Hulky lift heavy. Hulky join.',
      ru16: 'You catch like my old team. I\'m in.', ru17: 'Twenty wins! I\'ll write you a cheer song!', ru18: 'Three specials in one match? That\'s hot. I\'m in.',
      ru19: 'You caught it mid-air. Purr. Fine, I\'ll join.', ru20: 'Won with the big guy, huh? Cool. I\'m in.', ru21: 'Pass, pass, pass! Busy bees stick together.',
      ru22: 'Who tickled the sign? ...Okay, I\'ll float along.', ru23: 'You hit a flyer mid-flip? Pilot\'s honor, I\'m in.'
    },
    ko: {
      nmCoach: '모 코치', rvName: '덱스', bsName: '반스', tBoss: '글로스워스 플래티넘', stNext: '이어서 ▶', stTap: '눌러서 ▶', stSkip: '건너뛰기 ▶▶',
      stq: '동네 예선', str: '지역 대회', sts: '주 대회', stn: '전국 대회', stf: '결승',
      babam: '빠밤!', skTag: '새 기술!', skName: '30초 무조건 잡기', skDesc: '잡기를 1초 꾹: 30초 동안 오는 공은 무조건 잡아요. 한 판에 한 번.',
      skQuote: '모 코치: "30초 동안은 아무것도 못 지나가. 아껴 써."', skPop: '무조건 잡기!', skOn: '무조건 잡기 {0}', skHintT: '잡기 1초 꾹 = 무조건 잡기', skHintK: 'K 1초 꾹 = 무조건 잡기',
      trBtn: '🏋 특훈 +XP', trTitle: '특훈 몽타주!', trHowK: '이동 WASD / 방향키 · Space 폴짝 — 20초 동안 다 피해요!', trHowT: '스틱 이동 · 점프 폴짝 — 20초 동안 다 피해요!',
      trCoach: '모 코치: "닭. 물풍선. 테니스공. 인생은 뭐든 던진다. 피해."', trDone: '특훈 끝!', trSub: '피함 {0} · 맞음 {1}', trXp: '특훈', trEnd: '그만',
      trSplat: ['철퍽!', '꼬꼬!', '콩!', '첨벙!'],
      dfBtn: '🏆 타이틀 방어전 · 시즌 {0} · {1}/10', dfTitle: '타이틀 방어 성공!', dfSub: '시즌 {0}: 모든 팀이 더 세졌어요.', dfOpen: '타이틀 방어전!', dfOpenSub: '사다리가 다시 돌아요. 시즌마다 더 세게.',
      coachSays: '모 코치:',
      cl: ['일어나, 꼬마. 바닥 그렇게 편하지 않아.', '진 건 아직 안 온 승리일 뿐이야.', '난 네 생일 수보다 더 많이 져 봤다. 다시 가.', '털고 일어나. 그리고 피해.', '포기하지 마. 체육관이 너만 믿어. 내 낮잠 일정도.', '방금 건 몸풀기였지? ...그렇지?'],
      rl: ['쟤 그렇게 잘하는 거 아냐. 네가 긴장한 거지. 다시!', '숨 쉬어. 쟤 너무 세게 던져서 지쳤어. 가!', '쟤 신발 끈 좀 풀어 놨다. 농담이야. 거의. 가!'],
      rlGive: '졌어도 매번 일어났지. 내가 원하는 건 그거야. 넌 우리 팀이다.',
      an_hit: ['쓰러졌습니다!', '명치에 정통으로!', '아, 저건 자국 남겠는데요!', '앉으세요, 친구!', '교과서적! ...흐물흐물한 교과서!'],
      an_hitBig: ['믿을 수 없습니다!', '쓰러졌다! 못 일어납니다!', '누가 저 선수 엄마 좀 불러 주세요!'],
      an_hitMe: ['아야! 저건 아프겠어요!', '언더독, 한 명 잃습니다!', '아이고! 자존심에 정통으로!'],
      an_catch: ['굉장한 캐치!', '손에 풀 발랐나요!', '허공에서 낚아챕니다!', '이게 말이 됩니까?!'],
      an_catchFoe: ['잡혔습니다! 관중석 탄식!', '아, 저걸 잡네요!'],
      an_sp: ['믿을 수 없습니다!', '저거 규칙상 되는 겁니까?!', '관중석이 뒤집어집니다!', '해설 20년에 처음 봅니다!'],
      an_spFoe: ['큰일 났습니다!', '조심해요, 언더독!'],
      an_rev: ['다시 들어옵니다!', '역전 드라마 시작!'],
      an_dodge: ['휙! 국수처럼 피합니다!', '머리카락 한 올 차이!', '흐물흐물! 정말 흐물흐물!'],
      an_mp: ['매치 포인트! 숨소리도 안 들립니다!', '한 명 남았습니다! 여기서 끝납니다!'],
      an_koWin: ['언더독이 라운드를 가져갑니다!', '멋진 마무리!'], an_koLose: ['아이고! 언더독 휘청입니다!', '이번 라운드는 저쪽으로!'],
      an_sc: ['자석 손! 아무것도 못 지나갑니다!', '무조건 잡기 발동!'], an_scCatch: ['또 잡았다! 끈끈이 손!', '전부 다 잡아냅니다!'],
      an_o_rival: '공원 코트. 1대1. 옛 친구, 새 앙금!', an_o_q: '동네 예선 생중계입니다!', an_o_r: '지역 대회에 오신 걸 환영합니다!', an_o_s: '주 결승전 시작합니다!',
      an_o_n: '전국 대회! 대망의 무대!', an_o_f: '결승! 체육 시간의 그 아이 대 반스와 돈다발!', an_o_d: '챔피언, 타이틀 방어전!',
      an_boss: ['반스 쓰러졌습니다! 이건 개인적인 경기예요, 여러분!', '주장이 바닥에! 체육 시간의 그 아이가 해냈습니다!'],
      cm_pro: '1화 \u00B7 체육 시간', pro1c: '체육 시간. 피구. 또.', pro1a: '잘 잡았다... 얼굴로!', pro1b: '반스의 규칙: 전학생이 과녁.', laugh: '깔깔!',
      cm_friend: '2화 \u00B7 옛 친구', fr1a: '...그래. 너 많이 늘었다.', fr1b: '넌 많이 못돼졌고.', fr2a: '반스가 너 괴롭히는 걸 멋있어 보이게 만들었어. 난 따라갔고. 바보 같았어.', fr2b: '그럼 반스 이기는 거 도와줘.', fr2c: '할게.',
      pro2a: '덱스... 우리 친구였잖아.', pro2b: '였지.', pro3c: '방과 후.', pro3a: '너랑 나. 공원 코트. 1대1.', pro3b: '헤. 헬멧 챙겨 와.', sgPark: '공원 코트',
      cm_coach: '3화 \u00B7 코치', co1c: '벤치에서 누가 보고 있었다...', co1a: '나쁘지 않네, 꼬마. 네가 필요해.', co1b: '아저씨 누구세요?',
      co2a: '모 코치. 전직 챔피언. 현직 낮잠 전문가.', co2b: '...괜찮으세요?',
      co3c: '동네 체육관. 부자 개발업자한테 팔렸다.', co3a: '아파트랑 주차장이 된대. 우리가 전국 대회 상금을 따지 않으면.', co3b: '그럼 이기면 되죠!', sgSold: '매각! 주차장 예정', sgRec: '흐물 동네 체육관',
      cm_r: '4화 \u00B7 지역 대회', r1c: '지역 대회. 진짜 관중석. 진짜 긴장.', r1a: '체육관은 크고 관중은 시끄럽지만, 공은 똑같아.', r2a: '코치님, 작전은요?', r2b: '작전? 피해. 난 차에 있을게.',
      cm_rb: '지역 결승', rb1a: '너희가 동네 체육관 애들? 귀엽네.', rb2a: '귀엽고 흐물흐물하지.', rb2b: '꼬마야. 곰 건드리지 마. ...좋아, 살짝만.',
      cm_s: '5화 \u00B7 주 대회', s1c: '한편, 80층 꼭대기에서는...', s1a: '그 동네 애들이 주 대회까지 왔다고? 내 엘리트 팀 준비시켜.', s2a: '체육관이 우릴 기다려. 한 경기씩.', s2b: '가자!',
      cm_sb: '주 결승', sb1a: '전국 대회 직전 마지막 정거장. 너희 말이야.', sb1b: '웃기네. 나도 그 말 하려고 했는데.',
      cm_n: '6화 \u00B7 전국 대회', n1c: '전국 대회. 조명. 카메라. 마스코트 너무 많음.', n1a: '난 여기서 결승을 졌어. 내 신발 끈에 걸려서.', n2a: '그럼 신발 끈 묶으세요, 코치님.', n2b: '...요즘은 슬리퍼 신어.',
      cm_f: '결승', f0c: '체육 시간. 3년 동안.', f0a: '나 기억나? 아직도 얼굴로 잡냐?', f1a: '우리가 이기면 월요일에 불도저가 들어간다.', f1b: '내 팀. 내가 주장. 너희는 주차장.', f2a: '이번엔 아니야, 반스.', f2b: '체육관을 위해!', f3a: '꼬마야... 가서 언더독 해라.',
      sgSaved: '지켰다!', e1a: '나 엄청 긴 낮잠이 필요하겠다.', e2c: '전국 챔피언!', cm_credits: '고마워요',
      cr: ['흐물 피구', '출연', '흐물 동네단', '모 코치 (본인 역)', '덱스 (옛 친구 역)', '반스 (주장 역)', '주차장 (없던 일로)', '고무 닭은 다치지 않았습니다', '플레이해 줘서 고마워요!', '다음: 타이틀 방어전'],
      ru1: '학교 세 군데를 뿡으로 평정했지. 다음은 너희 팀이다.', ru2: '이겼어? 꼬꼬! 나도 끼워 줘!', ru4: '나 둘이면 상대는 0. 우리 둘 다 낄게.',
      ru6: '넌 청소기처럼 잡고 난 선풍기처럼 돌아. 한 팀?', ru8: '친구를 계속 살려내더라. 나도 그런 팀이 좋아.', ru9: '큰 코트에서 이겼다며? 나도 뛸래. 거꾸로.',
      ru10: '사흘 내내 왔네. 에... 에... 나도 할래!', ru11: '매치 포인트에서 잡기? 딱 내 스타일 드라마야.', ru12: '벌써 다섯 명? 너 찌릿하다. 나도 낄게.',
      ru13: '나만큼 휘는 바나나? 좋아. 라이벌이자 동료다.', ru14: '한 대도 안 맞았네. 닌자는 그런 걸 존중해.', ru15: '5번째 팀을 이겼다고? 우람이 무거운 거 잘 들어. 우람이 간다.',
      ru16: '우리 옛날 팀처럼 잡는구먼. 나도 끼지.', ru17: '스무 번 이겼어! 응원가 만들어 줄게!', ru18: '한 판에 필살기 세 번? 뜨겁다. 나도 간다.',
      ru19: '공중에서 낚아챘네. 그르릉. 좋아, 낄게.', ru20: '우람이랑 이겼다고? 멋지네. 나도 간다.', ru21: '패스, 패스, 패스! 일벌은 뭉쳐 다녀.',
      ru22: '누가 간판을 간질였어? ...좋아, 나도 둥둥 따라갈게.', ru23: '공중에서 맞혔다고? 비행사의 명예를 걸고, 나도 간다.'
    }
  };
  G.addStr(TXT);
  S.TXT = TXT;
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  S.coachLine = function (kind) { return pick(G.t(kind === 'rival' ? 'rl' : kind === 'pov' ? 'pvl' : 'cl')); };
  S.recruit = function (ch) { var k = 'ru' + ch, s = G.t(k); return s === k ? '' : G.t('ch' + ch) + ': "' + s + '"'; };

  /* ---------- season: ladder stages + comics ---------- */
  // ladder level -> stage; INTRO = the comic shown before the first match at that level ('coach' already covers the local qualifier)
  S.stageOf = function (lvl) { return lvl <= 1 ? 'q' : lvl <= 3 ? 'r' : lvl <= 6 ? 's' : lvl <= 8 ? 'n' : 'f'; };
  S.INTRO = { 2: 'r', 3: 'rb', 4: 's', 6: 'sb', 7: 'n', 9: 'f' };
  var H0 = S.HERO, CO = S.COACH, DX = S.DEX, DV = S.DEV, CP = S.CAPT, BS = S.BOSS, MY = '#2a7fd4', FOE = '#e8692b';
  // a panel: bg, cast [[ch, x 0..1, {flop, flip, cheer, hat, uni, s}]], say [[cast index, key]], cap (caption key), fx [[kind, ...]]
  S.COMICS = {
    pro: [
      { bg: 'gym', cap: 'pro1c', cast: [[H0, 0.26, { flop: 1 }], [BS.ch, 0.6, { flip: 1, cheer: 1, hat: BS.hat, uni: FOE }], [DX, 0.84, { flip: 1, cheer: 1, hat: 'cap', uni: FOE, s: 0.85 }]], say: [[1, 'pro1a']], fx: [['balls', 0], ['laugh', 1], ['laugh', 2], ['dizzy', 0]] },
      { bg: 'gym', cap: 'pro1b', cast: [[H0, 0.28, {}], [DX, 0.74, { flip: 1, hat: 'cap', uni: FOE }]], say: [[0, 'pro2a'], [1, 'pro2b']] },
      { bg: 'park', cap: 'pro3c', cast: [[H0, 0.26, {}], [DX, 0.76, { flip: 1, hat: 'cap', uni: FOE }]], say: [[0, 'pro3a'], [1, 'pro3b']], fx: [['sign', 0.5, 0.22, 'sgPark', '#8ee53f']] }
    ],
    friend: [
      { bg: 'park', cast: [[H0, 0.3, { cheer: 1 }], [DX, 0.7, { flop: 1, hat: 'cap', uni: FOE }]], say: [[1, 'fr1a'], [0, 'fr1b']], fx: [['dizzy', 1]] },
      { bg: 'park', cast: [[H0, 0.28, {}], [DX, 0.72, { flip: 1, hat: 'cap', uni: MY }]], say: [[1, 'fr2a'], [0, 'fr2b']] },
      { bg: 'park', cast: [[H0, 0.3, { cheer: 1 }], [DX, 0.7, { flip: 1, cheer: 1, hat: 'cap', uni: MY }]], say: [[1, 'fr2c']], fx: [['shake']] }
    ],
    coach: [
      { bg: 'park', cap: 'co1c', cast: [[H0, 0.25, { cheer: 1 }], [CO, 0.74, { flip: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[1, 'co1a'], [0, 'co1b']], fx: [['bench', 0.74]] },
      { bg: 'park', cast: [[CO, 0.5, { hat: 'cap', uni: '#5b6b80', s: 1.1 }]], say: [[0, 'co2a']], fx: [['zzz', 0], ['sign', 0.18, 0.3, 'stq', '#ffd23f']] },
      { bg: 'rec', cap: 'co3c', cast: [[CO, 0.2, { hat: 'cap', uni: '#5b6b80' }], [H0, 0.8, { flip: 1, cheer: 1 }]], say: [[0, 'co3a'], [1, 'co3b']], fx: [['sign', 0.5, 0.24, 'sgSold', '#ff5a4f'], ['dozer', 0.5]] }
    ],
    r: [
      { bg: 'arena', cap: 'r1c', cast: [[CO, 0.24, { hat: 'cap', uni: '#5b6b80' }], [H0, 0.5, {}], [5, 0.72, {}], [7, 0.9, { uni: MY, s: 0.9 }]], say: [[0, 'r1a']] },
      { bg: 'arena', cast: [[H0, 0.28, {}], [CO, 0.72, { flip: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[0, 'r2a'], [1, 'r2b']], fx: [['zzz', 1]] }
    ],
    rb: [
      { bg: 'arena', cast: [[H0, 0.24, {}], [CP, 0.66, { flip: 1, uni: 'T3', hat: 'chef' }], [11, 0.86, { flip: 1, uni: 'T3', hat: 'chef', s: 0.9 }]], say: [[1, 'rb1a']] },
      { bg: 'arena', cast: [[H0, 0.3, { cheer: 1 }], [CO, 0.75, { flip: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[0, 'rb2a'], [1, 'rb2b']] }
    ],
    s: [
      { bg: 'office', cap: 's1c', cast: [[DV, 0.5, { hat: 'top', uni: '#c9a227', s: 1.1 }]], say: [[0, 's1a']] },
      { bg: 'rec', cast: [[H0, 0.2, {}], [5, 0.42, { cheer: 1 }], [2, 0.62, { cheer: 1 }], [CO, 0.84, { flip: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[0, 's2a'], [2, 's2b']], fx: [['sign', 0.5, 0.2, 'sgRec', '#6ecbff']] }
    ],
    sb: [
      { bg: 'arena', cast: [[H0, 0.26, {}], [CP, 0.72, { flip: 1, uni: 'T6', hat: 'crown' }]], say: [[1, 'sb1a'], [0, 'sb1b']] }
    ],
    n: [
      { bg: 'arena', cap: 'n1c', cast: [[CO, 0.5, { hat: 'cap', uni: '#5b6b80' }]], say: [[0, 'n1a']], fx: [['spot']] },
      { bg: 'arena', cast: [[H0, 0.28, {}], [CO, 0.72, { flip: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[0, 'n2a'], [1, 'n2b']], fx: [['spot']] }
    ],
    f: [
      { bg: 'gym', cap: 'f0c', cast: [[H0, 0.26, { flop: 1 }], [BS.ch, 0.7, { flip: 1, cheer: 1, hat: BS.hat, uni: FOE }]], say: [[1, 'f0a']], fx: [['dizzy', 0], ['laugh', 1]] },
      { bg: 'office', cast: [[DV, 0.26, { hat: 'top', uni: '#c9a227' }], [BS.ch, 0.74, { flip: 1, hat: BS.hat, uni: BS.uni }]], say: [[0, 'f1a'], [1, 'f1b']] },
      { bg: 'arena', cast: [[CO, 0.14, { hat: 'cap', uni: '#5b6b80', s: 0.9 }], [H0, 0.4, {}], [DX, 0.62, { hat: 'cap' }], [12, 0.84, { cheer: 1 }]], say: [[1, 'f2a'], [3, 'f2b']], fx: [['spot']] }
    ],
    credits: [{ bg: 'credits', fx: [['credits']] }]
  };

  /* ================= FINAL CHAPTER (edit everything about it here) =================
     After the national final, the point of view flips: you play VANCE (the ringleader from gym class) and his team,
     and the last boss is the grown-up hero: every special shot + SUPER CATCH 30 s on / 10 s off. Kind, no cruelty. */
  S.FINAL = {
    n: 3, foeL: 5.6,          // team size, rival AI skill (ladder teams go up to 5.1)
    myChars: [S.BOSS.ch, 6, 11], foeChars: [S.HERO, S.DEX, 12],
    skipAfter: 3              // losses before the small "skip to the ending" button appears
  };
  G.addStr({
    en: {
      freeBtn: 'FREE PLAY',
      cm_pov: 'FINAL CHAPTER · THROUGH VANCE\'S EYES', pv1c: 'Vance remembers gym class.', pv1a: 'HA! Look at him. He\'ll never be any good.',
      pv2c: 'Now that kid is holding the national trophy.', pv2a: '...Huh.', pv3c: 'You play as VANCE now.',
      pv3a: 'One more game. My team against yours. No prize. I just need to know.', pv3b: 'Any time, Vance.',
      myPov: 'Vance\'s Team', foePov: 'The Champ', stLast: '▶ FINAL CHAPTER', povOk: 'skip to the ending', povSays: 'Vance:',
      pvl: ['He used to fall over every time. ...Not anymore. Again.', 'Wait for the 10 seconds when his hands are tired. Again.', 'How did he get THIS good? ...Okay. Again.'],
      an_o_pov: 'PLOT TWIST, FOLKS! VANCE TAKES ON THE KID HE USED TO LAUGH AT!', an_povHit: ['A HIT ON THE CHAMP! THE CROWD CAN\'T BELIEVE IT!', 'YOU GOT HIM! ...AND HE\'S SMILING!'],
      an_heroSc: ['THE CHAMP\'S HANDS ARE GLUE AGAIN! DON\'T THROW AT HIM!'], an_heroCd: ['HIS HANDS ARE TIRED! 10 SECONDS! NOW, VANCE, NOW!'],
      hcOn: 'SUPER CATCH {0}', hcOff: 'ATTACK NOW! {0}', hcWait: 'WAIT... {0}',
      cm_end: 'THE ENDING', en1a: 'You were weak back then... now look at you.', en1b: 'I had a lot of help.',
      en2a: 'I was wrong about you. Sorry about gym class.', en2b: 'Good game, Vance. See you in gym class.', en2c: 'Bring a helmet.',
      bdTag: 'BADGE!', bdName: 'TRUE CHAMPION', bdSub: 'Beat the champ in the final chapter, no skipping.'
    },
    ko: {
      freeBtn: '프리 게임',
      cm_pov: '마지막 화 · 반스의 눈으로', pv1c: '반스는 체육 시간을 기억한다.', pv1a: '하! 쟤 좀 봐. 쟨 평생 안 될걸.',
      pv2c: '그 아이가 지금 전국 대회 트로피를 들고 있다.', pv2a: '...허.', pv3c: '이제 당신은 반스.',
      pv3a: '한 판만 더. 우리 팀 대 너희 팀. 상금 없이. 그냥 알고 싶어.', pv3b: '언제든지, 반스.',
      myPov: '반스 팀', foePov: '챔피언', stLast: '▶ 마지막 화', povOk: '엔딩으로 넘어가기', povSays: '반스:',
      pvl: ['예전엔 맨날 넘어지던 앤데. ...이젠 아니네. 다시.', '손이 지치는 10초를 기다려. 다시.', '어떻게 저렇게까지 잘해졌지? ...좋아. 다시.'],
      an_o_pov: '반전입니다, 여러분! 반스가 예전에 놀리던 그 아이에게 도전합니다!', an_povHit: ['챔피언을 맞혔습니다! 관중이 못 믿네요!', '맞혔다! ...그런데 웃고 있어요!'],
      an_heroSc: ['챔피언 손에 다시 풀이 발렸습니다! 던지지 마세요!'], an_heroCd: ['손이 지쳤습니다! 10초! 지금이에요, 반스!'],
      hcOn: '무조건 잡기 {0}', hcOff: '지금 공격! {0}', hcWait: '기다려... {0}',
      cm_end: '엔딩', en1a: '그땐 약했는데... 지금 너 좀 봐.', en1b: '도와준 사람이 많았어.',
      en2a: '내가 너를 잘못 봤어. 체육 시간 일은 미안해.', en2b: '좋은 경기였어, 반스. 체육 시간에 보자.', en2c: '헬멧 챙겨 와.',
      bdTag: '배지!', bdName: '진짜 챔피언', bdSub: '마지막 화에서 건너뛰지 않고 챔피언을 이겼어요.'
    }
  });
  S.COMICS.pov = [
    { bg: 'gym', cap: 'pv1c', cast: [[H0, 0.26, { flop: 1 }], [BS.ch, 0.68, { flip: 1, cheer: 1, hat: BS.hat, uni: FOE }]], say: [[1, 'pv1a']], fx: [['dizzy', 0], ['laugh', 1], ['balls', 0]] },
    { bg: 'trophy', cap: 'pv2c', cast: [[H0, 0.42, { cheer: 1, hat: 'goldcrown' }], [BS.ch, 0.84, { flip: 1, hat: BS.hat, uni: FOE, s: 0.85 }]], say: [[1, 'pv2a']], fx: [['cup', 0.18]] },
    { bg: 'arena', cap: 'pv3c', cast: [[BS.ch, 0.28, { hat: BS.hat, uni: BS.uni }], [H0, 0.72, { flip: 1 }]], say: [[0, 'pv3a'], [1, 'pv3b']], fx: [['spot']] }
  ];
  S.COMICS.end = [
    { bg: 'arena', cast: [[BS.ch, 0.32, { hat: BS.hat, uni: BS.uni }], [H0, 0.68, { flip: 1, cheer: 1 }]], say: [[0, 'en1a'], [1, 'en1b']], fx: [['shake'], ['spot']] },
    { bg: 'rec', cast: [[DX, 0.13, { cheer: 1, hat: 'cap', s: 0.85 }], [BS.ch, 0.37, { cheer: 1, hat: BS.hat }], [H0, 0.62, { flip: 1, cheer: 1 }], [CO, 0.87, { flip: 1, cheer: 1, hat: 'cap', uni: '#5b6b80', s: 0.9 }]], say: [[1, 'en2a'], [2, 'en2b']], fx: [['sign', 0.5, 0.2, 'sgSaved', '#8ee53f']] },
    { bg: 'trophy', cap: 'e2c', cast: [[H0, 0.28, { cheer: 1, hat: 'goldcrown' }], [CO, 0.76, { flip: 1, cheer: 1, hat: 'cap', uni: '#5b6b80' }]], say: [[1, 'e1a']], fx: [['cup', 0.52], ['confetti']] }
  ];
  /* ================= end of the final chapter ================= */

  /* ---------- comic player ---------- */
  var CM = null;   // { id, panels, shown, at[], done(), lvl }
  S.comicOpen = function () { return !!CM; };
  S.openComic = function (id, done) {
    var P = S.COMICS[id]; if (!P) { done && done(); return false; }
    CM = { id: id, panels: P, shown: 1, at: [performance.now() / 1000], done: done }; G.sfx('babam'); return true;
  };
  S.comicTap = function () {
    if (!CM) return; var now = performance.now() / 1000;
    if (now - CM.at[CM.shown - 1] < 0.25) return;   // a double tap does not skip a panel unread
    if (CM.shown < CM.panels.length) { CM.at.push(now); CM.shown++; G.sfx('pass'); return; }
    S.comicClose();
  };
  S.comicClose = function () { if (!CM) return; var d = CM.done; CM = null; G.sfx('click'); if (d) d(); };
  S.comicState = function () { return CM ? { id: CM.id, shown: CM.shown, n: CM.panels.length } : null; };

  /* ---------- opening video (media/opening.mp4, 62 s): created only when chapter 1 starts or from the menu, never in the first load ---------- */
  G.addStr({ en: { opBtn: '🎬 WATCH OPENING', opSkip: 'SKIP ▶▶', opPlay: '▶', opSound: 'TAP FOR SOUND' }, ko: { opBtn: '🎬 오프닝 다시 보기', opSkip: '건너뛰기 ▶▶', opPlay: '▶', opSound: '눌러서 소리 켜기' } });
  var OP = null, preV = null;
  function mkVideo(src) { var v = document.createElement('video'); v.src = src; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', ''); v.disablePictureInPicture = true; return v; }
  S.prefetchOpening = function (src) { if (preV || OP) return; try { preV = mkVideo(src); preV.preload = 'auto'; preV.onerror = function () { preV = null; }; preV.load(); } catch (e) { preV = null; } };   // results screen of the first match
  S.openingOpen = function () { return !!OP; };
  S.openingState = function () { return OP ? { t: OP.v.currentTime, paused: OP.v.paused, muted: OP.v.muted, skip: OP.skip.style.opacity !== '0', play: OP.play.style.display !== 'none', ready: OP.v.readyState } : null; };
  // done(how): how = 'ended' | 'skip' | 'error'. o.muted: start without sound (game sound off / site mute)
  S.playOpening = function (src, o, done) {
    if (OP) return; o = o || {};
    var v = preV && preV.getAttribute('src') === src ? preV : mkVideo(src); preV = null;
    var box = document.createElement('div'), skip = document.createElement('button'), play = document.createElement('button'), hideT = 0, guard = 0;
    box.id = 'opening'; box.style.cssText = 'position:fixed;inset:0;z-index:20;background:#000;touch-action:none;cursor:pointer';
    v.preload = 'auto'; v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;pointer-events:none';
    skip.id = 'opSkip'; skip.className = 'btn pri'; skip.textContent = G.t('opSkip');
    skip.style.cssText = 'position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));height:64px;font-size:24px;font-style:italic;padding:0 26px;z-index:2;transition:opacity .3s';
    play.id = 'opPlay'; play.className = 'btn'; play.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:auto;min-width:120px;height:120px;border-radius:60px;font-size:54px;padding:0 30px;z-index:2;display:none;flex-direction:column;gap:0;line-height:1';
    box.appendChild(v); box.appendChild(play); box.appendChild(skip); document.body.appendChild(box);
    OP = { v: v, box: box, skip: skip, play: play };
    function showSkip() { skip.style.opacity = '1'; skip.style.pointerEvents = 'auto'; clearTimeout(hideT); hideT = setTimeout(function () { if (OP && !v.paused) { skip.style.opacity = '0'; skip.style.pointerEvents = 'none'; } }, 4000); }
    function askPlay(sound) { play.innerHTML = G.t('opPlay') + (sound ? '<span style="font-size:15px;font-style:normal">' + G.t('opSound') + '</span>' : ''); play.style.display = 'inline-flex'; showSkip(); }
    function end(how) {
      if (!OP) return; clearTimeout(hideT); clearTimeout(guard); OP = null;
      v.onended = v.onerror = v.onplaying = null; try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { }
      if (box.parentNode) box.parentNode.removeChild(box);
      if (done) done(how);
    }
    v.onended = function () { end('ended'); };
    v.onerror = function () { end('error'); };   // offline / blocked / unsupported: straight on to the comic, no message
    v.onplaying = function () { clearTimeout(guard); };
    guard = setTimeout(function () { if (OP && v.readyState === 0 && play.style.display === 'none') end('error'); }, 12000);   // nothing arrived at all
    skip.onclick = function (e) { e.stopPropagation(); end('skip'); };
    play.onclick = function (e) {
      e.stopPropagation(); play.style.display = 'none';
      if (v.muted && !o.muted) { v.muted = false; if (!v.paused) { v.currentTime = 0; showSkip(); return; } }
      v.play().then(showSkip).catch(function () { askPlay(false); });
    };
    box.addEventListener('pointerdown', function (e) { if (e.target === box) showSkip(); });
    S.openingKey = function (code) { if (code === 'Escape' || code === 'Enter' || code === 'NumpadEnter') end('skip'); else if (code === 'Space' && play.style.display !== 'none') play.click(); else showSkip(); };
    v.muted = !!o.muted; showSkip();
    var pr; try { pr = v.play(); } catch (e) { pr = null; }
    if (pr && pr.catch) pr.catch(function (err) {
      if (!OP || (err && err.name === 'AbortError')) return;
      if (err && err.name === 'NotSupportedError') return end('error');
      // autoplay with sound blocked: play muted underneath and offer a big ▶ (tap = sound on, from the start)
      v.muted = true; askPlay(!o.muted);
      v.play().catch(function (e2) { if (OP && e2 && e2.name === 'NotSupportedError') end('error'); });
    });
  };
  S.closeOpening = function () { if (OP) OP.skip.click(); };

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function txt(c, s, x, y, size, col, align, ital, lw) { c.font = (ital ? 'italic ' : '') + '900 ' + Math.round(size) + 'px ' + G.FONT; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = size * (lw || 0.24); c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); }
  function wrap(c, s, maxW) {   // word wrap (falls back to characters for very long words)
    var out = [], line = '', words = String(s).split(' ');
    for (var i = 0; i < words.length; i++) {
      var w = words[i], t = line ? line + ' ' + w : w;
      if (c.measureText(t).width <= maxW) { line = t; continue; }
      if (line) out.push(line);
      if (c.measureText(w).width > maxW) { var part = ''; for (var j = 0; j < w.length; j++) { if (c.measureText(part + w[j]).width > maxW && part) { out.push(part); part = ''; } part += w[j]; } line = part; } else line = w;
    }
    if (line) out.push(line); return out;
  }
  function uniOf(u) { if (u && u[0] === 'T') { var tm = G.teamOf(+u.slice(1)); return tm.uni; } return u || MY; }
  function star(c, x, y, r) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fill(); }
  function bgDraw(c, kind, x, y, w, h, now) {
    var g, i, fy = y + h * 0.7;
    if (kind === 'gym' || kind === 'arena') {
      g = c.createLinearGradient(0, y, 0, fy); g.addColorStop(0, kind === 'arena' ? '#1d1640' : '#2a2058'); g.addColorStop(1, '#3d2f73'); c.fillStyle = g; c.fillRect(x, y, w, fy - y);
      var bc = ['#ff5a4f', '#ffd23f', '#3fa9ff', '#8ee53f']; for (i = 0; i * 34 < w; i++) { c.fillStyle = bc[i % 4]; c.beginPath(); c.moveTo(x + i * 34, y + 6); c.lineTo(x + i * 34 + 34, y + 6); c.lineTo(x + i * 34 + 17, y + 26); c.fill(); }
      if (kind === 'arena') for (i = 0; i < 40; i++) { var cx = x + ((i * 53) % w), cy = y + h * 0.22 + ((i * 37) % (h * 0.36)), j = Math.abs(Math.sin(now * 5 + i)) * 4; c.fillStyle = INK; c.beginPath(); c.arc(cx, cy - j, 8, 0, TAU); c.fill(); c.fillStyle = bc[i % 4]; c.beginPath(); c.arc(cx, cy - j, 6, 0, TAU); c.fill(); }
      g = c.createLinearGradient(0, fy, 0, y + h); g.addColorStop(0, '#c98c4f'); g.addColorStop(1, '#e6a861'); c.fillStyle = g; c.fillRect(x, fy, w, y + h - fy);
      c.strokeStyle = 'rgba(120,70,30,0.3)'; c.lineWidth = 2; for (var yy = fy + 12; yy < y + h; yy += 14) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
    } else if (kind === 'park') {
      g = c.createLinearGradient(0, y, 0, fy); g.addColorStop(0, '#6ecbff'); g.addColorStop(1, '#bfeaff'); c.fillStyle = g; c.fillRect(x, y, w, fy - y);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w * 0.2, y + h * 0.16, 16, 0, TAU); c.arc(x + w * 0.2 + 18, y + h * 0.15, 20, 0, TAU); c.arc(x + w * 0.2 + 38, y + h * 0.17, 14, 0, TAU); c.fill();
      c.strokeStyle = '#8a9bb0'; c.lineWidth = 2; for (i = 0; i * 18 < w; i++) { c.beginPath(); c.moveTo(x + i * 18, fy - h * 0.2); c.lineTo(x + i * 18 + 18, fy); c.moveTo(x + i * 18 + 18, fy - h * 0.2); c.lineTo(x + i * 18, fy); c.stroke(); }
      c.fillStyle = '#5aa04a'; c.fillRect(x, fy, w, y + h - fy); c.fillStyle = '#3d7fd0'; c.fillRect(x + w * 0.05, fy + 6, w * 0.9, y + h - fy - 6); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + w / 2, fy + 6); c.lineTo(x + w / 2, y + h); c.stroke();
    } else if (kind === 'rec' || kind === 'night') {
      c.fillStyle = kind === 'night' ? '#141238' : '#9be7ff'; c.fillRect(x, y, w, h);
      if (kind === 'night') { c.fillStyle = '#fff8c0'; for (i = 0; i < 18; i++) c.fillRect(x + (i * 71) % w, y + (i * 29) % (h * 0.3), 2, 2); c.beginPath(); c.arc(x + w * 0.85, y + h * 0.12, 14, 0, TAU); c.fill(); }
      var bx = x + w * 0.08, bw = w * 0.84, by = y + h * 0.28; c.fillStyle = INK; c.fillRect(bx - 3, by - 3, bw + 6, fy - by + 3); c.fillStyle = kind === 'night' ? '#6e3a2e' : '#b4553f'; c.fillRect(bx, by, bw, fy - by);
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5; for (var ry = by + 10; ry < fy; ry += 10) { c.beginPath(); c.moveTo(bx, ry); c.lineTo(bx + bw, ry); c.stroke(); }
      c.fillStyle = INK; c.fillRect(x + w * 0.44, fy - h * 0.2, w * 0.12, h * 0.2); c.fillStyle = kind === 'night' ? '#ffd23f' : '#7b4a2a'; c.fillRect(x + w * 0.45, fy - h * 0.19, w * 0.1, h * 0.19);
      c.fillStyle = '#7f8a99'; c.fillRect(x, fy, w, y + h - fy);
    } else if (kind === 'office') {
      c.fillStyle = '#0f1430'; c.fillRect(x, y, w, h);
      for (i = 0; i < 12; i++) { var tw = w / 12, th = h * (0.25 + ((i * 7) % 5) * 0.08); c.fillStyle = '#1f2a55'; c.fillRect(x + i * tw, fy - th, tw - 3, th); c.fillStyle = '#ffd23f'; for (var wy = fy - th + 6; wy < fy - 6; wy += 12) if ((i + wy) % 3) c.fillRect(x + i * tw + 4, wy, 4, 5); }
      c.strokeStyle = '#c9a227'; c.lineWidth = 4; c.strokeRect(x + 6, y + 6, w - 12, fy - y - 6);
      c.fillStyle = '#4a2d1a'; c.fillRect(x, fy, w, y + h - fy); c.fillStyle = '#2b1a10'; c.fillRect(x + w * 0.15, fy + 4, w * 0.7, 10);
    } else if (kind === 'trophy') {
      c.fillStyle = '#ffd23f'; c.fillRect(x, y, w, h); c.save(); c.translate(x + w / 2, y + h * 0.45); c.rotate(now * 0.3); c.fillStyle = '#ffe98a'; for (i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, -w * 0.12); c.lineTo(w, w * 0.12); c.fill(); } c.restore();
      c.fillStyle = '#c98c4f'; c.fillRect(x, fy, w, y + h - fy);
    } else if (kind === 'credits') { c.fillStyle = '#0d0b1e'; c.fillRect(x, y, w, h); }
  }
  function signRect(c, f, x, y, w, h) {   // a sign's box, kept inside the panel (bubbles steer around it)
    var s = G.t(f[3]), fs = Math.max(11, Math.min(26, h * 0.06, w * 0.06)); c.font = '900 ' + fs + 'px ' + G.FONT; var sw = Math.min(w - 16, c.measureText(s).width + fs * 1.4);
    var cx = Math.max(x + sw / 2 + 8, Math.min(x + w - sw / 2 - 8, x + w * f[1])), cy = y + h * f[2];
    return { cx: cx, cy: cy, s: s, fs: fs, sw: sw, x: cx - sw / 2 - 3, y: cy - fs * 0.9 - 3, w: sw + 6, h: fs * 1.8 + 6, obst: 1 };
  }
  function fxDraw(c, f, x, y, w, h, now, pos, front, lt) {
    var k = f[0], i, p;
    if (k === 'sign' && !front) {
      var sr = signRect(c, f, x, y, w, h), sx = sr.cx, sy = sr.cy, s = sr.s, fs = sr.fs, sw = sr.sw; c.font = '900 ' + fs + 'px ' + G.FONT;
      c.save(); c.translate(sx, sy); c.rotate(-0.04); c.fillStyle = INK; rr(c, -sw / 2 - 3, -fs * 0.9 - 3, sw + 6, fs * 1.8 + 6, 8); c.fill(); c.fillStyle = f[4] || '#ffd23f'; rr(c, -sw / 2, -fs * 0.9, sw, fs * 1.8, 6); c.fill();
      c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 1); c.restore();
    } else if (k === 'bench' && !front) {
      var bx = x + w * f[1]; c.fillStyle = INK; c.fillRect(bx - w * 0.2, y + h * 0.72, w * 0.4, 9); c.fillRect(bx - w * 0.18, y + h * 0.72, 5, h * 0.12); c.fillRect(bx + w * 0.17, y + h * 0.72, 5, h * 0.12); c.fillStyle = '#b07a43'; c.fillRect(bx - w * 0.2 + 2, y + h * 0.72 + 2, w * 0.4 - 4, 5);
    } else if (k === 'dozer' && !front) {
      var dx = x + w * f[1] + Math.sin(now * 2) * 4, dy = y + h * 0.86, ds = h * 0.11; c.fillStyle = INK; rr(c, dx - ds * 1.6, dy - ds * 1.2, ds * 3.2, ds * 1.2, 6); c.fill(); c.fillStyle = '#ffc400'; rr(c, dx - ds * 1.5, dy - ds * 1.1, ds * 3, ds, 5); c.fill();
      c.fillStyle = '#ffc400'; c.fillRect(dx - ds * 0.4, dy - ds * 2, ds, ds * 0.9); c.fillStyle = INK; c.fillRect(dx - ds * 2.2, dy - ds * 1.3, ds * 0.4, ds * 1.3); for (i = 0; i < 3; i++) { c.beginPath(); c.arc(dx - ds + i * ds, dy, ds * 0.32, 0, TAU); c.fill(); }
    } else if (k === 'balls' && front) {
      p = pos[f[1]]; if (!p) return; for (i = 0; i < 3; i++) { var a = now * 3 + i * 2.1, bx2 = p.x + 40 + i * 30 + Math.cos(a) * 6, by2 = p.y - p.hp * (0.3 + i * 0.18); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx2 + 14, by2); c.lineTo(bx2 + 44, by2 - 4); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(bx2, by2, 11, 0, TAU); c.fill(); c.fillStyle = '#ff5a4f'; c.beginPath(); c.arc(bx2, by2, 8.5, 0, TAU); c.fill(); }
    } else if (k === 'laugh' && front) {
      p = pos[f[1]]; if (!p) return; txt(c, G.t('laugh'), p.x + p.hp * 0.32 + Math.sin(now * 20 + f[1]) * 3, p.y - p.hp * (0.8 + 0.1 * f[1]), Math.max(12, p.hp * 0.16), '#ffd23f', 'center', true);
    } else if (k === 'dizzy' && front) {
      p = pos[f[1]]; if (!p) return; c.fillStyle = '#ffd23f'; for (i = 0; i < 3; i++) { var da = now * 4 + i * 2.09; star(c, p.hx + Math.cos(da) * p.hp * 0.16, p.hy - p.hp * 0.14 + Math.sin(da) * p.hp * 0.05, p.hp * 0.05); }
    } else if (k === 'zzz' && front) {
      p = pos[f[1]]; if (!p) return; for (i = 0; i < 3; i++) { var zt = (now * 0.8 + i / 3) % 1; txt(c, 'z', p.x + p.hp * (0.25 + zt * 0.3), p.y - p.hp * (1.0 + zt * 0.4), Math.max(10, p.hp * (0.1 + zt * 0.08)), '#9be7ff', 'center', true, 0.18); }
    } else if (k === 'confetti' && front) {
      var cols = ['#ff5a4f', '#ffd23f', '#3fa9ff', '#8ee53f', '#ff8fd0']; for (i = 0; i < 40; i++) { var cxp = x + ((i * 97) % w), cyp = y + ((i * 61 + now * 120 * (1 + i % 3)) % h); c.fillStyle = cols[i % 5]; c.save(); c.translate(cxp, cyp); c.rotate(now * 3 + i); c.fillRect(-4, -2, 8, 4); c.restore(); }
    } else if (k === 'shake' && front) {
      var hx = x + w * 0.5, hy = y + h * 0.66, hs = Math.min(w, h) * 0.09; c.fillStyle = '#ffd23f'; star(c, hx, hy, hs * (1 + 0.1 * Math.sin(now * 8))); txt(c, '\uD83E\uDD1D', hx, hy, hs * 1.1, '#fff', 'center', false, 0.05);
    } else if (k === 'spot' && !front) {
      c.fillStyle = 'rgba(255,240,180,0.13)'; for (i = 0; i < 2; i++) { var sx2 = x + w * (0.3 + 0.4 * i) + Math.sin(now * 0.8 + i * 2) * w * 0.12; c.beginPath(); c.moveTo(sx2 - 10, y); c.lineTo(sx2 + 10, y); c.lineTo(sx2 + w * 0.18, y + h); c.lineTo(sx2 - w * 0.18, y + h); c.fill(); }
    } else if (k === 'cup' && !front) {
      var ux = x + w * f[1], uy = y + h * 0.5, us = Math.min(w, h) * 0.12; c.fillStyle = INK; c.beginPath(); c.moveTo(ux - us, uy - us); c.lineTo(ux + us, uy - us); c.quadraticCurveTo(ux + us, uy + us * 0.6, ux, uy + us * 0.7); c.quadraticCurveTo(ux - us, uy + us * 0.6, ux - us, uy - us); c.fill(); c.fillRect(ux - us * 0.2, uy + us * 0.6, us * 0.4, us * 0.6); c.fillRect(ux - us * 0.6, uy + us * 1.15, us * 1.2, us * 0.3);
      c.fillStyle = '#ffc400'; c.beginPath(); c.moveTo(ux - us * 0.85, uy - us * 0.88); c.lineTo(ux + us * 0.85, uy - us * 0.88); c.quadraticCurveTo(ux + us * 0.85, uy + us * 0.5, ux, uy + us * 0.58); c.quadraticCurveTo(ux - us * 0.85, uy + us * 0.5, ux - us * 0.85, uy - us * 0.88); c.fill();
      c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(ux - us, uy - us * 0.4, us * 0.4, Math.PI * 0.5, Math.PI * 1.5); c.arc(ux + us, uy - us * 0.4, us * 0.4, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    } else if (k === 'credits' && front) {
      var L = G.t('cr'), fs2 = Math.max(13, Math.min(30, h * 0.07, w * 0.07)), sp = fs2 * 2, total = L.length * sp, off = ((lt * 34) % (total + h)) - h * 0.1;
      for (i = 0; i < L.length; i++) { var ly = y + h - (off - i * sp) * 1; if (ly < y - sp || ly > y + h + sp) continue; txt(c, L[i], x + w / 2, ly, i === 0 || i === L.length - 2 ? fs2 * 1.25 : fs2, i === 0 || i === L.length - 2 ? '#ffd23f' : i === L.length - 1 ? '#8ef0a8' : '#fff', 'center', i === 0); }
      c.fillStyle = '#ffd23f'; star(c, x + w * 0.15, y + h * 0.1, 8); star(c, x + w * 0.85, y + h * 0.18, 6);
    }
  }
  function panel(c, P, x, y, w, h, now, lt, lvl) {
    c.save(); rr(c, x, y, w, h, 10); c.clip();
    bgDraw(c, P.bg, x, y, w, h, now);
    var fx = P.fx || [], pos = [], gy = y + h * 0.9, hp0 = Math.min(h * 0.46, w * 0.42), i;
    fx.forEach(function (f) { fxDraw(c, f, x, y, w, h, now, pos, false, lt); });
    (P.cast || []).forEach(function (a, i) {
      var o = a[2] || {}, px = x + w * a[1], hp = hp0 * (o.s || 1), uni = uniOf(o.uni);
      if (o.flop) {
        c.save(); c.translate(px + hp * 0.42, gy - hp * 0.08); c.rotate(-1.45 + Math.sin(now * 3) * 0.04); G.drawChar(c, a[0], 0, 0, hp, now + i, uni, false, false, o.hat); c.restore();
        pos.push({ x: px, y: gy, hp: hp, hx: px - hp * 0.45, hy: gy - hp * 0.12 });
      } else {
        var bob = Math.sin(now * 2.2 + i) * hp * 0.012; G.drawChar(c, a[0], px, gy + bob, hp, now + i * 0.4, uni, !!o.cheer, !!o.flip, o.hat);
        pos.push({ x: px, y: gy, hp: hp, hx: px, hy: gy - hp });
      }
    });
    fx.forEach(function (f) { fxDraw(c, f, x, y, w, h, now, pos, true, lt); });
    // caption (narration) in the top-left corner
    var fs = Math.max(11, Math.min(22, h * 0.05, w * 0.05)), capH = 0;
    if (P.cap) {
      c.font = 'italic 900 ' + fs + 'px ' + G.FONT; var lines = wrap(c, G.t(P.cap, lvl), w * 0.8), cw = 0; lines.forEach(function (l) { cw = Math.max(cw, c.measureText(l).width); });
      capH = lines.length * fs * 1.25 + fs * 0.8; c.fillStyle = INK; c.fillRect(x, y, cw + fs * 1.4 + 4, capH + 4); c.fillStyle = '#ffd23f'; c.fillRect(x, y, cw + fs * 1.4, capH);
      c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'middle'; lines.forEach(function (l, j) { c.fillText(l, x + fs * 0.7, y + fs * 0.4 + fs * 1.25 * (j + 0.5)); });
    }
    // speech bubbles: laid out first (reading order = top to bottom; a later bubble never covers an earlier one), then drawn
    var B = [], bfs = Math.max(11, Math.min(24, h * 0.055, w * 0.055)), top = y + capH + 6;
    function hits(a, b) { return a.x < b.x + b.w + 4 && b.x < a.x + a.w + 4 && a.y < b.y + b.h + 4 && b.y < a.y + a.h + 4; }
    fx.forEach(function (f) { if (f[0] === 'sign') { var r = signRect(c, f, x, y, w, h); if (r.y + r.h > top) top = Math.max(top, y + capH + 6); B.push(r); } });
    c.font = '900 ' + bfs + 'px ' + G.FONT;
    (P.say || []).forEach(function (sy, j) {
      var p = pos[sy[0]]; if (!p) return;
      var maxW = w * (P.cast.length > 2 ? 0.5 : 0.6), L = wrap(c, G.t(sy[1], lvl), maxW), bw = 0; L.forEach(function (l) { bw = Math.max(bw, c.measureText(l).width); });
      bw += bfs * 1.2; var bh = L.length * bfs * 1.2 + bfs * 0.7;
      var me = { j: j, p: p, L: L, k: sy[1], w: bw, h: bh, x: Math.max(x + 6, Math.min(x + w - bw - 6, p.hx - bw / 2)), y: Math.max(top, p.hy - bh - h * 0.08) };
      B.forEach(function (r) {
        if (!hits(me, r)) return;
        var nx = p.hx >= r.x + r.w / 2 ? r.x + r.w + 8 : r.x - bw - 8;   // slide sideways, away from the earlier bubble
        if (nx >= x + 4 && nx + bw <= x + w - 4 && !B.some(function (o) { return o !== r && hits({ x: nx, y: me.y, w: bw, h: bh }, o); })) { me.x = nx; return; }
        me.y = r.y + r.h + 8;   // else below it; lift the earlier ones if that would push this one under the speaker's head
        var over = me.y + bh - (p.hy - 6), mv = B.filter(function (o) { return !o.obst; });
        if (over > 0 && mv.length && !r.obst) {
          var room = Math.max(0, Math.min(over, Math.min.apply(null, mv.map(function (o) { var fl = top; B.forEach(function (q) { if (q.obst && q.x < o.x + o.w && o.x < q.x + q.w && q.y < o.y) fl = Math.max(fl, q.y + q.h + 6); }); return o.y - fl; }))));
          mv.forEach(function (o) { o.y -= room; }); me.y -= room;
        }
      });
      B.push(me);
    });
    B.forEach(function (b) {
      if (b.obst) return; var at = lt - 0.3 - b.j * 0.55; if (at < 0) return;
      var sc = Math.min(1, at / 0.16), bx = b.x, by = b.y, bw = b.w, bh = b.h, p = b.p;
      c.save(); c.translate(bx + bw / 2, by + bh); c.scale(sc, sc); c.translate(-(bx + bw / 2), -(by + bh));
      var tx = Math.max(bx + 12, Math.min(bx + bw - 12, p.hx)), tipY = Math.max(by + bh + 6, Math.min(p.hy - 4, by + bh + h * 0.07)), loud = /!$/.test(G.t(b.k));
      c.fillStyle = INK; c.beginPath(); c.moveTo(tx - 9, by + bh - 2); c.lineTo(p.hx, tipY); c.lineTo(tx + 9, by + bh - 2); c.fill();
      rr(c, bx - 3, by - 3, bw + 6, bh + 6, 14); c.fill(); c.fillStyle = loud && b.k !== 'pro1a' ? '#fff3b0' : '#fff'; rr(c, bx, by, bw, bh, 12); c.fill();
      c.beginPath(); c.moveTo(tx - 6, by + bh - 3); c.lineTo(p.hx, tipY - 4); c.lineTo(tx + 6, by + bh - 3); c.fill();
      c.font = '900 ' + bfs + 'px ' + G.FONT; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; b.L.forEach(function (l, k) { c.fillText(l, bx + bw / 2, by + bfs * 0.35 + bfs * 1.2 * (k + 0.5)); });
      c.restore();
    });
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 5; rr(c, x, y, w, h, 10); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2; rr(c, x + 3, y + 3, w - 6, h - 6, 8); c.stroke();
  }
  S.drawComic = function (c, W, H, now) {
    if (!CM) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#120f26'; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.04)'; for (var dy = 0; dy < H; dy += 14) for (var dx = (dy / 14 % 2) * 7; dx < W; dx += 14) c.fillRect(dx, dy, 3, 3);
    var n = CM.panels.length, land = W > H * 1.15, m = Math.max(8, Math.min(W, H) * 0.025), th = Math.max(26, Math.min(W, H) * 0.08), bot = Math.max(30, Math.min(W, H) * 0.08);
    var tt = G.t('cm_' + CM.id), tfs = th * 0.62, maxT = W - 2 * Math.min(W * 0.3, 190 * (window.devicePixelRatio > 1 ? 2 : 1)); c.font = 'italic 900 ' + tfs + 'px ' + G.FONT; var tw0 = c.measureText(tt).width; if (tw0 > maxT) tfs *= maxT / tw0;
    txt(c, tt, W / 2, m + th / 2, tfs, '#ffd23f', 'center', true);
    var ax = m, ay = m + th + m * 0.5, aw = W - 2 * m, ah = H - ay - bot - m * 0.5, pw, ph;
    if (land) { pw = (aw - m * (n - 1)) / n; ph = Math.min(ah, pw * 1.45); if (n === 1) { pw = Math.min(aw, ah * 1.5); ph = ah; } }
    else { pw = aw; ph = (ah - m * (n - 1)) / n; if (n === 1) ph = Math.min(ah, pw * 1.2); }
    var tot = land ? n * pw + (n - 1) * m : pw, ox = (W - tot) / 2, oy = ay + (ah - (land ? ph : n * ph + (n - 1) * m)) / 2;
    for (var i = 0; i < CM.shown; i++) {
      var lt = now - CM.at[i], k = Math.min(1, lt / 0.22), e = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2), px = land ? ox + i * (pw + m) : ox, py = land ? oy : oy + i * (ph + m);
      c.save(); c.globalAlpha = Math.min(1, k * 1.5); c.translate(px + pw / 2, py + ph / 2); c.scale(e, e); c.rotate((i % 2 ? 1 : -1) * 0.012); c.translate(-(px + pw / 2), -(py + ph / 2));
      panel(c, CM.panels[i], px, py, pw, ph, now, lt, CM.lvl); c.restore();
    }
    var pu = 0.6 + 0.4 * Math.sin(now * 5); c.globalAlpha = pu; txt(c, G.t('stTap') + '  ' + CM.shown + '/' + n, W / 2, H - bot / 2 - m * 0.2, bot * 0.42, '#fff', 'center', true); c.globalAlpha = 1;
  };

  /* ---------- sports announcer ---------- */
  var PRI = { heroSc: 3, heroCd: 3, koWin: 3, koLose: 3, mp: 3, sp: 3, sc: 3, hit: 2, hitMe: 2, catch: 2, rev: 2, spFoe: 2, scCatch: 2, catchFoe: 1, dodge: 1, revFoe: 0 }, lastTxt = '';
  S.annOn = true;
  S.say = function (M, s, pri) { M.ann = { txt: s, t0: performance.now() / 1000, pri: pri || 1 }; lastTxt = s; if (S.log) S.log.push(s); };
  G.onEv = function (M, k, a, b) {
    if (!S.annOn || !M || M.guide || M.versus) return;
    var pri = PRI[k]; if (pri == null || pri === 0) return;
    if (k === 'dodge' && Math.random() > 0.3) return;
    var cur = M.ann, age = cur ? performance.now() / 1000 - cur.t0 : 9;
    if (cur && age < 1.3 && pri <= cur.pri && !(pri === 3 && age > 0.6)) return;
    var key = k === 'hit' && a > 1.2 ? 'an_hitBig' : 'an_' + k;
    if (k === 'hit' && b && b.team === 1 && b.i === 0 && (M.boss || M.story === 'pov')) { key = M.boss ? 'an_boss' : 'an_povHit'; pri = 3; }   // the ringleader / the champ goes down
    var pool = G.t(key); if (typeof pool === 'string') return;
    var s = pick(pool); if (s === lastTxt && pool.length > 1) s = pool[(pool.indexOf(s) + 1) % pool.length];
    S.say(M, s, pri);
  };
  S.matchStart = function (M) {
    if (!M || M.guide || M.versus) return;
    if (M.free) return;
    var k = M.story === 'rival' ? 'an_o_rival' : M.story === 'pov' ? 'an_o_pov' : M.defend ? 'an_o_d' : 'an_o_' + S.stageOf(M.lvl);
    M.ann = { txt: G.t(k), t0: performance.now() / 1000 + 0.2, pri: 2, dur: 2.6 };
  };
  // drawn over the HUD: announcer bar, SUPER CATCH timer / hint / hold ring
  S.overlay = function (c, M, now, V, hold) {
    if (!M || M.guide) return;
    var SW = V.SW, k = V.k, H = G.H; c.setTransform(k, 0, 0, k, 0, 0);
    var a = M.ann;
    if (a) {
      var age = performance.now() / 1000 - a.t0, dur = a.dur || 2.1;
      if (age > dur) M.ann = null;
      else if (age >= 0) {
        var sl = Math.min(1, age / 0.18), al = age > dur - 0.3 ? (dur - age) / 0.3 : 1, fs = 24, y = H - 30 - (V.keys ? 42 : 0);   // broadcast lower third
        c.font = 'italic 900 ' + fs + 'px ' + G.FONT; var tw = Math.min(SW - 40, c.measureText(a.txt).width + 74), x0 = (SW - tw) / 2 - (1 - sl) * SW * 0.4;
        c.save(); c.globalAlpha = Math.max(0, al);
        c.fillStyle = INK; rr(c, x0 - 3, y - 21, tw + 6, 42, 12); c.fill(); c.fillStyle = 'rgba(30,24,70,0.96)'; rr(c, x0, y - 18, tw, 36, 10); c.fill();
        c.fillStyle = '#ff5a4f'; rr(c, x0, y - 18, 40, 36, 10); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x0 + 20, y - 4, 6, 0, TAU); c.fill(); c.fillRect(x0 + 18, y + 1, 4, 10); c.fillRect(x0 + 13, y + 10, 14, 3);   // a little microphone
        G.fitLabel(c, a.txt, x0 + 40 + (tw - 40) / 2, y, fs, '#ffd23f', 'center', tw - 54, true);
        c.restore();
      }
    }
    if (M.story === 'pov' && M.scCyc) {   // the champ's SUPER CATCH window, above his head and as a bar under the HUD
      var hb = M.bodies[M.n], cy = M.scCyc, on = cy.on, first = !on && cy.t > 0 && !M.scSeen, left = Math.ceil(cy.t);
      if (on) M.scSeen = 1;
      var lab = G.t(on ? 'hcOn' : first ? 'hcWait' : 'hcOff', left), col = on ? '#ffd23f' : first ? '#c9cbe0' : '#8ef0a8';
      if (hb && hb.role === 'in' && !hb.pendingOut) {
        c.setTransform(k, 0, 0, k, -V.camX * k, 0); var hx = hb.x, hy = G.FY(hb.z) - hb.h - 175;
        c.font = 'italic 900 18px ' + G.FONT; var lw = c.measureText(lab).width + 26;
        c.fillStyle = INK; rr(c, hx - lw / 2 - 2, hy - 15, lw + 4, 30, 15); c.fill(); c.fillStyle = on ? 'rgba(120,90,0,0.95)' : 'rgba(20,70,40,0.95)'; rr(c, hx - lw / 2, hy - 13, lw, 26, 13); c.fill();
        c.fillStyle = col; rr(c, hx - lw / 2, hy + 9, lw * (cy.t / (on ? 30 : first ? 6 : 10)), 4, 2); c.fill();
        G.fitLabel(c, lab, hx, hy - 1, 18, col, 'center', lw - 10, true);
        if (on) { var pu2 = 0.5 + 0.5 * Math.sin(now * 10); c.strokeStyle = 'rgba(255,210,63,' + (0.5 + 0.5 * pu2) + ')'; c.lineWidth = 5; c.beginPath(); c.ellipse(hb.x, G.FY(hb.z), 46 + pu2 * 6, 14 + pu2 * 2, 0, 0, TAU); c.stroke(); }
        c.setTransform(k, 0, 0, k, 0, 0);
      }
    }
    if (!M.scOk) return;
    var my = M.ctrl >= 0 ? M.bodies[M.ctrl] : null;
    if (M.sc > 0 && my) {   // active: glow ring at my feet + a countdown pill
      c.setTransform(k, 0, 0, k, -V.camX * k, 0);
      var pu = 0.5 + 0.5 * Math.sin(now * 10); c.strokeStyle = 'rgba(255,210,63,' + (0.55 + 0.45 * pu) + ')'; c.lineWidth = 5; c.beginPath(); c.ellipse(my.x, G.FY(my.z), 46 + pu * 6, 14 + pu * 2, 0, 0, TAU); c.stroke();
      c.setTransform(k, 0, 0, k, 0, 0);
      var py = V.port ? 112 : 142, pw = 250, s = G.t('skOn', Math.ceil(M.sc));
      c.fillStyle = INK; rr(c, (SW - pw) / 2 - 3, py - 19, pw + 6, 38, 19); c.fill(); c.fillStyle = '#ffd23f'; rr(c, (SW - pw) / 2, py - 16, pw * (M.sc / 30), 32, 16); c.fill();
      G.fitLabel(c, '🧲 ' + s, SW / 2, py, 20, '#fff', 'center', pw - 20, true);
    } else if (!M.scUsed && M.state === 'play' && my) {
      var show = M.time > M.roundT - 7 || hold > 0;
      if (show) {
        var t2 = G.t(V.touch ? 'skHintT' : 'skHintK'), hy = V.port ? 112 : 142; c.font = '900 16px ' + G.FONT; var hw = c.measureText(t2).width + 50;
        c.fillStyle = 'rgba(16,12,40,0.85)'; rr(c, (SW - hw) / 2, hy - 15, hw, 30, 15); c.fill(); c.strokeStyle = '#ffd23f'; c.lineWidth = 2; rr(c, (SW - hw) / 2, hy - 15, hw, 30, 15); c.stroke();
        G.fitLabel(c, t2, SW / 2 + 10, hy, 16, '#ffd23f', 'center', hw - 40);
        c.strokeStyle = '#4a4e69'; c.lineWidth = 4; c.beginPath(); c.arc((SW - hw) / 2 + 17, hy, 9, 0, TAU); c.stroke();
        if (hold > 0) { c.strokeStyle = '#8ef0a8'; c.beginPath(); c.arc((SW - hw) / 2 + 17, hy, 9, -Math.PI / 2, -Math.PI / 2 + TAU * hold); c.stroke(); }
      }
    }
  };

  /* ---------- training montage (optional, 20 s): dodge rubber chickens, water balloons, tennis balls ---------- */
  var TR = null;
  S.trainOpen = function () { return !!TR; };
  S.trainState = function () { return TR ? { t: TR.t, dodged: TR.dodged, hits: TR.hits, n: TR.objs.length, x: TR.x, z: TR.z, over: TR.over } : null; };
  S.startTrain = function (ch, done) { TR = { ch: ch, done: done, t: 0, x: 300, z: 0.5, h: 0, vh: 0, flop: 0, dodged: 0, hits: 0, objs: [], spawn: 0.8, pops: [], over: 0 }; G.sfx('whistle'); };
  S.endTrain = function () { if (!TR) return; var r = { dodged: TR.dodged, hits: TR.hits, xp: Math.min(160, TR.dodged * 4 + (TR.t >= 20 ? (TR.hits ? 20 : 50) : 0)) }, d = TR.done; TR = null; if (d) d(r); };
  function trPop(x, y, s, col) { TR.pops.push({ x: x, y: y, s: s, col: col, t: 0 }); }
  S.trainStep = function (dt, inp, SW) {
    if (!TR) return; var T = TR, FY = G.FY, ZPX = G.ZPX, i;
    if (T.over) { T.over += dt; if (T.over > 1.8) S.endTrain(); return; }
    T.t += dt; if (T.t >= 20) { T.over = 0.001; G.sfx('win'); return; }
    if (T.flop > 0) T.flop -= dt;
    else { T.x = Math.max(50, Math.min(SW - 140, T.x + inp.mx * 420 * dt)); T.z = Math.max(0, Math.min(1, T.z + inp.mz * 1.5 * dt)); if (inp.jumpP && T.h <= 0) { T.vh = 640; G.sfx('jump'); } }
    if (T.h > 0 || T.vh > 0) { T.vh -= 2100 * dt; T.h = Math.max(0, T.h + T.vh * dt); if (T.h === 0) T.vh = 0; }
    // spawns get quicker over the 20 s
    T.spawn -= dt; if (T.spawn <= 0) {
      var r = Math.random(), lvl = T.t / 20; T.spawn = 0.85 - 0.45 * lvl + Math.random() * 0.3;
      if (r < 0.42) T.objs.push({ k: 'ball', x: SW - 70, z: Math.random() < 0.6 ? T.z : Math.random(), h: 12, vx: -(380 + 220 * lvl), vh: 0 });
      else if (r < 0.75) T.objs.push({ k: 'chick', x: SW + 30, z: Math.random() < 0.6 ? T.z : Math.random(), h: 70, vx: -(300 + 160 * lvl), rot: 0 });
      else T.objs.push({ k: 'balloon', x: T.x + (Math.random() - 0.5) * 80, z: Math.max(0, Math.min(1, T.z + (Math.random() - 0.5) * 0.2)), fall: 1.1 });
    }
    for (i = T.objs.length - 1; i >= 0; i--) {
      var o = T.objs[i], hit = false, gone = false;
      if (o.k === 'balloon') { o.fall -= dt; if (o.fall <= 0) { var dx = Math.abs(o.x - T.x), dz = Math.abs(o.z - T.z) * ZPX; if (dx < 50 && dz < 34) hit = true; else gone = true; if (!hit) { G.sfx('poof'); trPop(o.x, FY(o.z) - 30, '+4', '#8ef0a8'); } } }
      else {
        o.x += o.vx * dt; if (o.k === 'chick') { o.rot += dt * 9; if (Math.random() < 0.02) G.sfx('bawk'); }
        var ddx = Math.abs(o.x - T.x), ddz = Math.abs(o.z - T.z) * ZPX;
        if (ddx < 28 && ddz < 26 && T.flop <= 0) { if (o.k === 'ball' ? T.h < 30 : T.h < 110) hit = true; }
        if (o.x < -40) { gone = true; trPop(Math.max(40, T.x), FY(T.z) - 140, '+4', '#8ef0a8'); }
      }
      if (hit) { T.hits++; T.flop = 0.7; T.objs.splice(i, 1); G.sfx(o.k === 'chick' ? 'bawk' : o.k === 'balloon' ? 'poof' : 'hit'); trPop(T.x, FY(T.z) - 150, pick(G.t('trSplat')), o.k === 'balloon' ? '#6ecbff' : '#ff5a4f'); continue; }
      if (gone) { T.dodged++; T.objs.splice(i, 1); }
    }
    for (i = T.pops.length - 1; i >= 0; i--) { T.pops[i].t += dt; if (T.pops[i].t > 0.8) T.pops.splice(i, 1); }
  };
  S.drawTrain = function (c, now, V) {
    if (!TR) return; var T = TR, k = V.k, SW = V.SW, H = G.H, FY = G.FY, i;
    c.setTransform(k, 0, 0, k, 0, 0);
    // tennis-ball machine on the right
    var mx = SW - 60, my = FY(0.5); c.fillStyle = INK; rr(c, mx - 30, my - 80, 64, 80, 10); c.fill(); c.fillStyle = '#8ee53f'; rr(c, mx - 26, my - 76, 56, 72, 8); c.fill(); c.fillStyle = INK; c.fillRect(mx - 46, my - 50, 20, 14); c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(mx + 2, my - 82, 12, 0, TAU); c.fill();
    // shadows first, then objects, then me
    T.objs.forEach(function (o) {
      var gy = FY(o.z); c.fillStyle = 'rgba(0,0,0,0.25)';
      if (o.k === 'balloon') { var s = 1 - o.fall / 1.1; c.beginPath(); c.ellipse(o.x, gy, 20 + 30 * s, 7 + 9 * s, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,90,79,' + (0.4 + 0.5 * s) + ')'; c.lineWidth = 3; c.stroke(); }
      else { c.beginPath(); c.ellipse(o.x, gy, 14, 5, 0, 0, TAU); c.fill(); }
    });
    T.objs.forEach(function (o) {
      var gy = FY(o.z);
      if (o.k === 'ball') { c.fillStyle = INK; c.beginPath(); c.arc(o.x, gy - o.h, 11, 0, TAU); c.fill(); c.fillStyle = '#e4f53d'; c.beginPath(); c.arc(o.x, gy - o.h, 8.5, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(o.x - 5, gy - o.h, 6, -1, 1); c.stroke(); }
      else if (o.k === 'chick') { c.save(); c.translate(o.x, gy - o.h); c.rotate(o.rot); c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, 26, 9, 0, 0, TAU); c.fill(); c.fillStyle = '#ffe14d'; c.beginPath(); c.ellipse(0, 0, 23, 6.5, 0, 0, TAU); c.fill(); c.fillStyle = '#ff5a4f'; c.beginPath(); c.arc(-22, -5, 5, 0, TAU); c.fill(); c.fillStyle = '#ff9d2b'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-34, 3); c.lineTo(-25, 4); c.fill(); c.restore(); }
      else { var s = 1 - o.fall / 1.1, by = gy - 520 * (1 - s) - 20; c.fillStyle = INK; c.beginPath(); c.ellipse(o.x, by, 18, 21, 0, 0, TAU); c.fill(); c.fillStyle = '#6ecbff'; c.beginPath(); c.ellipse(o.x, by, 15, 18, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(o.x - 5, by - 7, 4, 0, TAU); c.fill(); }
    });
    var gy = FY(T.z); c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(T.x, gy, 30, 9, 0, 0, TAU); c.fill();
    if (T.flop > 0) { c.save(); c.translate(T.x + 50, gy - 6); c.rotate(-1.45); G.drawChar(c, T.ch, 0, 0, 120, now, '#2a7fd4', false, false); c.restore(); }
    else G.drawChar(c, T.ch, T.x, gy - T.h, 120, now, '#2a7fd4', T.over > 0, false);
    T.pops.forEach(function (p) { c.globalAlpha = 1 - p.t / 0.8; txt(c, p.s, p.x, p.y - p.t * 40, 30, p.col, 'center', true); c.globalAlpha = 1; });
    // top: title, timer, counters; coach line at the start
    var left = Math.max(0, 20 - T.t);
    txt(c, G.t('trTitle'), SW / 2, 40, 40, '#ffd23f', 'center', true);
    c.fillStyle = INK; rr(c, SW / 2 - 153, 70, 306, 22, 11); c.fill(); c.fillStyle = '#ff5a4f'; rr(c, SW / 2 - 150, 73, 300 * left / 20, 16, 8); c.fill();
    txt(c, Math.ceil(left) + 's', SW / 2, 81, 16, '#fff', 'center');
    txt(c, '✔ ' + T.dodged + '   ✖ ' + T.hits, SW / 2, 116, 26, '#fff', 'center');
    if (T.t < 4) { c.font = '900 18px ' + G.FONT; var s1 = G.t('trCoach'), s2 = G.t(V.touch ? 'trHowT' : 'trHowK'), w1 = Math.min(SW - 30, Math.max(c.measureText(s1).width, c.measureText(s2).width) + 40); c.fillStyle = 'rgba(16,12,40,0.88)'; rr(c, (SW - w1) / 2, 140, w1, 66, 14); c.fill(); G.fitLabel(c, s1, SW / 2, 160, 18, '#9be7ff', 'center', w1 - 24); G.fitLabel(c, s2, SW / 2, 188, 16, '#fff', 'center', w1 - 24); }
    if (T.over) { var sc = Math.min(1, T.over / 0.25); c.save(); c.translate(SW / 2, H * 0.4); c.scale(sc, sc); txt(c, G.t('trDone'), 0, 0, 70, '#8ef0a8', 'center', true); txt(c, G.t('trSub', T.dodged, T.hits), 0, 60, 30, '#fff', 'center'); c.restore(); }
  };
})();
