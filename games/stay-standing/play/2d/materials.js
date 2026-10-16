// 재료·부재·접합부·도구 데이터. 새 재료(RC 등)는 여기에 항목만 추가하면 된다.
// 단위: N, m, kg. 값은 "대략 맞는 감"을 주도록 게임용으로 조정한 것.
(function () {
  const QR = (globalThis.QR = globalThis.QR || {});

  QR.MATERIALS = {
    wood: {
      name: { en: 'Timber', ko: '목조' },
      // role: frame = 기둥/보처럼 접합부 휨저항(각도 구속)을 가짐, brace/panel = 핀 접합 축부재
      // tcap = 나무 자체 인장(결 방향, 아주 셈). 당겨서 먼저 터지는 건 끝의 못 tEnd (철물이면 ×connEndFactor) — 그래서 철물이 중요
      elements: {
        post:   { role: 'frame', EA: 1.4e8, tcap: 1.8e+05, ccap: 1.6e5, vcap: 3.2e3, /* 전단: 짧은 기둥이 먼저 터짐 */ tEnd: 1.4e4, kgm: 10, width: 0.13, color: '#c98a4b', dark: '#8a5a2b' },
        beam:   { role: 'frame', EA: 2.5e8, tcap: 2.4e+05, ccap: 2.0e5, tEnd: 2.4e4, kgm: 16, width: 0.17, color: '#b97a3e', dark: '#7d4f24' },
        rafter: { role: 'frame', EA: 1.2e8, tcap: 1.5e+05, ccap: 1.2e5, tEnd: 3.0e4, kgm: 8,  width: 0.11, color: '#a86b35', dark: '#6e441f' },
        strut:  { role: 'frame', EA: 1.0e8, tcap: 1.2e+05, ccap: 1.0e5, tEnd: 3.0e4, kgm: 6,  width: 0.09, color: '#b5773d', dark: '#7a4c22' },
        stud:   { role: 'frame', EA: 3.0e7, tcap: 4.5e+04, ccap: 2.5e4, tEnd: 5.0e3, kgm: 4,  width: 0.07, color: '#d39a5e', dark: '#8a5a2b' }, // 문틀 샛기둥·인방: 가늘고 약함
        brace:  { role: 'brace', EA: 4.0e7, tcap: 1.4e+05, connF: 2.05, /* 철물 붙은 끝 = 철물·나사 내력 ≈45kN 이 한계 */ ccap: 5.0e3, buckle: true, Lref: 4.0, degrade: 0.08, /* 45×90 가새의 오일러 좌굴 ≈ 5kN @4m: ccap×(Lref/L)², 좌굴해도 안 부러지고 압축만 못 받음, 크게 흔들릴 때마다 8%씩 헐거워짐 */ tEnd: 2.2e4, kgm: 3,  width: 0.075, color: '#e0a35c', dark: '#9c6a30' },
        ply:    { role: 'panel', EA: 5.6e7, tcap: 2.6e4, ccap: 2.6e4, tEnd: 1e9,   kgm: 7,  width: 0,    color: '#e9c98d', dark: '#b8955a' },
      },
      // 칸 하나 기준 옆 강성 비율(2D 트러스 해석 보정): 가새 1개 1 · X 가새 ≈2 · 합판벽 ≈2.8 · 맨 틀 ≈0(접합부 마찰뿐)
      joints: {
        nailed: { k: 1.5e3, cap: 3.0e2 },   // 못·장부 접합 = 사실상 핀(마찰 정도의 휨저항만)
        plate:  { k: 3.0e3, cap: 6.0e2 },   // 철물: 회전은 못보다 아주 조금 더 — 고정단 절대 아님. 하는 일은 뽑힘·들림 막기
        continuous: { k: 2.0e6, cap: 3.0e4 }, // 한 부재가 절점을 그냥 지나감(이어진 보·기둥의 휨 강성)
      },
      anchors: {
        nailed: { uplift: 9e3,   shear: 4e4 },  // 토대에 그냥 꽂힌 기둥
        plate:  { uplift: 4.0e4, shear: 9e4 },  // 홀다운 철물
        plyEnd: { uplift: 1.0e3 },              // 합판벽 끝 기둥인데 홀다운이 없음 → 거의 못 잡음
      },
      connEndFactor: 3.2, // 철물이 붙은 쪽 끝의 인장(뽑힘) 내력 배수
      looks: { ground: '#7a5a3a', sky1: '#bfe3f5', sky2: '#eaf6fb' },
      pinnedJoints: true,   // 해석에서 못 접합은 핀
      wallElem: 'ply',      // 처음부터 있는 벽
    },
    // ===== 철근콘크리트(오래된 비연성 건물). 2D 한 줄 골조, 폭 5m 쯤의 바닥 무게를 절점에 얹음 =====
    rc: {
      name: { en: 'Reinforced concrete', ko: '철근콘크리트' },
      elements: {
        col:    { role: 'frame', EA: 4.0e9, tcap: 1.6e6, ccap: 4.0e6, tEnd: 1e9, kgm: 400, width: 0.45, vcap: 1.3e5, dcap: 0.022, color: '#b8b4ac', dark: '#7d7a73' }, // 기둥 450각: 띠철근 부족 → 전단에 약함
        colS:   { role: 'frame', EA: 2.5e9, tcap: 1.0e6, ccap: 2.5e6, tEnd: 1e9, kgm: 250, width: 0.32, vcap: 0.8e5, dcap: 0.02, jcap: 0.42, color: '#bdb9b1', dark: '#7d7a73' }, // 가는 기둥(약한 기둥-강한 보)
        rbeam:  { role: 'frame', EA: 6.0e9, tcap: 1.4e5, ccap: 6.0e6, tEnd: 1e9, kgm: 700, width: 0.55, color: '#c4c0b8', dark: '#85827a' },     // 보+슬래브. 인장(겹침이음 약함)은 약해서 한쪽 끝 가새로 힘을 다 끌어가면 끊어짐
        brk:    { role: 'panel', infill: true, EA: 1.2e9, tcap: 2.0e5, ccap: 6.0e5, tEnd: 1e9, kgm: 300, width: 0, color: '#c98b6b', dark: '#8f5b42' },     // 조적 채움벽(칸막이)
        rcw:    { role: 'panel', EA: 6.0e9, tcap: 1.5e6, ccap: 3.0e6, tEnd: 1e9, kgm: 900, width: 0, color: '#d6d3cc', dark: '#9a968e' },     // 증설 RC 전단벽
        sbrace: { role: 'brace', EA: 6.0e8, tcap: 6.0e5, ccap: 3.5e5, buckle: true, Lref: 6.5, tEnd: 1e9, kgm: 35, width: 0.16, color: '#5f7a91', dark: '#33475a' }, // 철골 X가새
      },
      // RC 접합부는 '모멘트 접합': 금이 가며 물러지고(균열) → 항복해 소성회전이 쌓이고 → 강도가 떨어짐 (아래 hyst)
      joints: {
        nailed:     { k: 6.0e7, cap: 8.0e4 },   // 기본 보-기둥 접합 (이름만 nailed — 기본값 자리). cap = 항복 모멘트 My
        plate:      { k: 6.0e7, cap: 8.0e4 },
        continuous: { k: 3.0e8, cap: 3.0e5 },   // 한 보가 절점을 지나감
      },
      footing: { k: 4.0e7, cap: 6.0e4 },        // 기초: 회전을 조금만 잡음 (고정단 아님 — 형 규칙)
      anchors: { nailed: { uplift: 1.5e6, shear: 6e6 }, plate: { uplift: 1.5e6, shear: 6e6 } },
      connEndFactor: 1,
      // 기둥 보강 배율: 전단(vcap)·접합 강성(jk)·접합 내력(jcap)·축강성(EA)
      mods: {
        jacket: { vcap: 3.0, jk: 2.0, jcap: 2.6, EA: 1.6, kgm: 200 },  // 기둥 단면 증설(RC/강판 재킷)
        frp:    { vcap: 2.6, jk: 1.0, jcap: 1.3, EA: 1.0, kgm: 2 },    // 탄소섬유 감기: 전단·구속만
        wing:   { vcap: 1.8, jk: 2.5, jcap: 1.8, EA: 1.3, kgm: 250 },  // 날개벽: 기둥 옆에 짧은 벽
      },
      // 이력: 접합부 모멘트가 crack×My 를 넘으면 금(강성 ÷crackSoft), My 에서 항복(소성회전 누적),
      // 누적 소성회전 thu 에서 강도 residual 까지 떨어지고 thBreak 를 넘으면 힌지가 풀림(핀).
      // 기둥 전단 내력은 소성회전 thv 까지 vdeg 만큼 줄어듦(휨-전단 파괴). 채움벽: 금 → 반복마다 infDeg 씩 부스러짐 → infOut 아래면 빠짐
      hyst: { crack: 0.4, crackSoft: 2.0, thu: 0.08, residual: 0.25, thBreak: 0.25, vdeg: 0, tfat: 0.25, thv: 0.05, infCrack: 0.45, infSoft: 3, infDeg: 0.08, infOut: 0.35 },
      looks: { ground: '#7a6a5a', sky1: '#c9dbe6', sky2: '#eef3f6' },
      pinnedJoints: false,
      wallElem: 'brk',
    },
  };

  // ===== 가격표 (형이 여기만 고치면 됨) =====
  // 작은 목조주택 보강 기준, 자재+인건비 포함 1개(1칸) 시공가. usd 는 영어 화면용(₩1,350/$ 쯤, 보기 좋게 반올림)
  QR.PRICES = {
    brace: { base: 30000, perM: 20000 },   // 가새: 설치비 + 각재 m당 (2.5m ≈ ₩80,000)
    post:  { base: 60000, perM: 40000 },   // 기둥 추가: 설치·밑동 앵커 + 각재 m당
    beam:  { base: 50000, perM: 35000 },   // 보·띠장: 설치 + 각재 m당
    wall:  { base: 60000, perM2: 40000 },  // 구조용 합판 내력벽: 설치 + 칸 넓이 ㎡당 (합판·못치기)
    conn:  { base: 40000 },                // 철물·홀다운 1개소
    // --- 철근콘크리트 (작은 상가·학교 건물 내진보강 시공가 감) ---
    steelx: { base: 2000000, perM2: 500000 },  // 철골 X가새 프레임 1칸 (6×3m ≈ ₩1,100만)
    rcwall: { base: 3000000, perM2: 700000 },  // RC 전단벽 증설 1칸 (6×3m ≈ ₩1,560만)
    jacket: { base: 1500000, perM: 1500000 },  // 기둥 단면 증설 1개 (3m ≈ ₩600만)
    frp:    { base: 500000,  perM: 600000 },   // 탄소섬유(FRP) 감기 1개 (3m ≈ ₩230만)
    wing:   { base: 1000000, perM: 900000 },   // 날개벽 1개 (3m ≈ ₩370만)
    slit:   { base: 400000, perM2: 30000 },    // 내진 슬릿: 벽돌벽과 기둥 사이를 잘라 띄움 1칸 (6×1.2m ≈ ₩62만)
  };
  // 값 계산은 physics.js 의 QR.priceOf(단계, 항목). 영어 화면은 원 ÷ USD_RATE 를 $5 단위로 반올림.
  QR.USD_RATE = 1350;

  // 도구 = 플레이어가 놓는 보강. what = 무엇에 붙는지(대각선/칸/수직칸/수평칸/절점)
  QR.TOOLS = [
    { id: 'brace', mat: 'wood', kind: 'link', elem: 'brace', key: '1',
      name: { en: 'Brace', ko: '가새' }, hint: { en: 'Drag from one joint to another (or tap two joints)', ko: '절점에서 절점으로 끌거나, 두 절점을 차례로 누르세요' } },
    { id: 'wall', mat: 'wood', kind: 'bay', panel: true, elem: 'ply', key: '2',
      name: { en: 'Plywood wall', ko: '합판 내력벽' }, hint: { en: 'Tap a framed bay to cover it with structural plywood', ko: '틀로 둘러싸인 칸을 눌러 구조용 합판으로 막습니다' } },
    { id: 'post', mat: 'wood', kind: 'link', elem: 'post', key: '3',
      name: { en: 'Extra post', ko: '기둥 추가' }, hint: { en: 'Connect two joints in a vertical line', ko: '세로로 나란한 두 절점을 이으세요' } },
    { id: 'beam', mat: 'wood', kind: 'link', elem: 'beam', key: '4',
      name: { en: 'Beam / girt', ko: '보·띠장' }, hint: { en: 'Connect two joints at the same height', ko: '같은 높이의 두 절점을 이으세요' } },
    { id: 'conn', mat: 'wood', kind: 'node', key: '5',
      name: { en: 'Metal connector', ko: '철물 보강' }, hint: { en: 'Tap any joint (at the base it is a hold-down)', ko: '아무 절점이나 누르세요 (밑동이면 홀다운)' } },
    // --- 철근콘크리트 ---
    { id: 'steelx', mat: 'rc', kind: 'bay', elem: 'sbrace', key: '1',
      name: { en: 'Steel X-brace', ko: '철골 X가새' }, hint: { en: 'Tap a bay to add a steel X-brace frame', ko: '칸을 눌러 철골 X가새 프레임을 넣습니다' } },
    { id: 'rcwall', mat: 'rc', kind: 'bay', panel: true, elem: 'rcw', key: '2',
      name: { en: 'RC shear wall', ko: 'RC 전단벽' }, hint: { en: 'Tap a bay to fill it with a concrete shear wall', ko: '칸을 눌러 콘크리트 전단벽으로 채웁니다' } },
    { id: 'jacket', mat: 'rc', kind: 'column', key: '3',
      name: { en: 'Column jacket', ko: '기둥 단면 증설' }, hint: { en: 'Tap a column to thicken it (stronger, stiffer)', ko: '기둥을 눌러 두껍게 감쌉니다 (강하고 단단해짐)' } },
    { id: 'frp', mat: 'rc', kind: 'column', key: '4',
      name: { en: 'Carbon-fiber wrap', ko: '탄소섬유 감기' }, hint: { en: 'Tap a column to wrap it — stops shear cracking', ko: '기둥을 눌러 감습니다 — 전단(빗금) 파괴를 막음' } },
    { id: 'wing', mat: 'rc', kind: 'column', key: '5',
      name: { en: 'Wing wall', ko: '날개벽' }, hint: { en: 'Tap a column to add a short wall beside it (keeps windows open)', ko: '기둥을 눌러 옆에 짧은 벽을 붙입니다 (창은 그대로)' } },
    { id: 'slit', mat: 'rc', kind: 'bay', slit: true, key: '6',
      name: { en: 'Seismic slit', ko: '내진 슬릿' }, hint: { en: 'Tap an old brick wall to cut it free from the columns (no more short columns, less pull to one side)', ko: '옛 벽돌벽을 눌러 기둥과 떼어 냅니다 (짧은 기둥이 풀리고, 한쪽으로 쏠림이 줄어듦)' } },
  ];
})();
