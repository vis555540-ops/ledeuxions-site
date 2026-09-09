// 검사 — 브라우저 없이 데이터와 흐름을 훑는다.
//   node 검사.js
// 보는 것: 장면마다 누를 수 있는 게 하나라도 있나 · 누른 뒤 결과가 비지 않았나 ·
//          빈 글은 없나 · 힘 값이 말이 되나.
// 2026-09-09 공황 편 붙이면서 만들었다. 기억에는 있다고 적혀 있었는데 파일이 없었다.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];

// 브라우저 것들을 흉내만 내고 데이터만 얻는다
const sandbox = {
  localStorage: { getItem: () => null, setItem: () => {} },
  document: { getElementById: () => ({ innerHTML: '' }) },
};
const 방 = {};
try {
  new Function('localStorage', 'document', '앱', js + '\nreturn {아픈사람,곁의사람,PTSD_아픈사람,PTSD_곁의사람,공황_아픈사람,공황_곁의사람};')
    .call(방, sandbox.localStorage, sandbox.document, { innerHTML: '' });
} catch (e) { /* 아래에서 다시 시도 */ }

let 데이터;
try {
  데이터 = new Function('localStorage', 'document',
    js.replace(/^\s*시작화면\(\);\s*$/m, '') +
    '\nreturn {우울_아픈:아픈사람, 우울_곁:곁의사람, PTSD_아픈:PTSD_아픈사람, PTSD_곁:PTSD_곁의사람, 공황_아픈:공황_아픈사람, 공황_곁:공황_곁의사람};'
  )(sandbox.localStorage, sandbox.document);
} catch (e) {
  console.log('🚨 자바스크립트가 아예 안 돌아간다:', e.message);
  process.exit(1);
}

let 문제 = 0;
const 탈 = (편, i, 말) => { console.log(`  🚨 ${편} ${i + 1}번째 장면 — ${말}`); 문제++; };

for (const [편, 목록] of Object.entries(데이터)) {
  if (!Array.isArray(목록)) { console.log(`  🚨 ${편} 이 배열이 아니다`); 문제++; continue; }
  목록.forEach((s, i) => {
    if (!s.때) 탈(편, i, '「때」가 없다');
    if (!s.글) 탈(편, i, '「글」이 없다');
    if (typeof s.힘 !== 'number' || s.힘 < 0 || s.힘 > 100) 탈(편, i, `힘 값이 이상하다 (${s.힘})`);
    if (!Array.isArray(s.고르기) || !s.고르기.length) { 탈(편, i, '고를 게 하나도 없다 — 여기서 막힌다'); return; }
    const 눌리는것 = s.고르기.filter(o => !o.잠김);
    if (!눌리는것.length) 탈(편, i, '전부 잠겨 있다 — 여기서 막힌다');
    s.고르기.forEach((o, j) => {
      if (!o.말) 탈(편, i, `${j + 1}번째 선택지에 글이 없다`);
      if (!o.잠김 && !o.뒤 && !o.바뀜 && !o.몰아침) 탈(편, i, `「${o.말}」 을 눌러도 나올 게 없다`);
    });
  });
  console.log(`  ✅ ${편} — 장면 ${목록.length}개`);
}

// 공황 편 고유 장치가 실제로 들어 있나
const 공황 = [...(데이터.공황_아픈 || []), ...(데이터.공황_곁 || [])];
const 지움수 = 공황.filter(s => s.지움).length;
const 지나감수 = 공황.filter(s => s.지나감).length;
const 몰아침수 = 공황.reduce((n, s) => n + s.고르기.filter(o => o.몰아침).length, 0);
console.log(`\n  공황 장치 — 지워지는 곳 ${지움수} · 지나가는 장면 ${지나감수} · 먼저 몰아치는 선택 ${몰아침수}`);
if (!지움수) { console.log('  🚨 지워지는 곳이 없다 — 이 편이 하려는 말이 빠졌다'); 문제++; }
if (!지나감수) { console.log('  🚨 지나가는 장면이 없다 — 끝난다는 걸 안 보여주면 거짓말이 된다'); 문제++; }
if (!몰아침수) { console.log('  🚨 먼저 몰아치는 선택이 없다'); 문제++; }

console.log(문제 ? `\n문제 ${문제} 건` : '\n전부 정상입니다.');
process.exit(문제 ? 1 : 0);
