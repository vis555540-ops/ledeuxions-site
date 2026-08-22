// entities.js — 특성 카드. §22.4 시작 카드는 고르기 전까지 사라지지 않는다.
import { CANVAS, WORLD, TRAITS, LEVEL_CARD, START_CARDS } from './config.js';
import * as player from './player.js';
import * as audio from './audio.js';
import * as juice from './juice.js';

function shuffled(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function spawnStartCards() {
  const ids = shuffled(START_CARDS.POOL);
  const y = WORLD.GROUND_Y + START_CARDS.Y_OFFSET;
  return {
    list: ids.map((id, i) => ({ id, x: LEVEL_CARD.X[i], y, start: true })),
    repos: 0, isStart: true,
  };
}

export function spawnLevelCards(y, owned) {
  const pool = TRAITS.filter(t => (owned[t.id] || 0) < t.max);
  const ids = shuffled(pool.map(t => t.id)).slice(0, 3);
  while (ids.length < 3) ids.push('dew');
  return { list: ids.map((id, i) => ({ id, x: LEVEL_CARD.X[i], y })), repos: 0, isStart: false };
}

// 카드는 발판·적과 충돌하지 않는다. 획득 판정만 있다 (§20.4).
export function updateCards(pack, p, cameraY) {
  if (!pack) return null;
  const hw = LEVEL_CARD.W / 2, hh = LEVEL_CARD.H / 2;
  for (const c of pack.list) {
    if (Math.abs(p.x - c.x) > hw + 6 || Math.abs(p.y - c.y) > hh + 7) continue;
    if (c.id === 'dew') { player.drink(p, 25); p.moistFrozen = false; }
    else player.giveTrait(p, c.id);
    audio.play('card');
    juice.particle(c.x, c.y, '#ffd166', 8);
    return c.id;                       // 나머지는 호출부가 즉시 버린다
  }
  // 시작 카드만 화면 밖으로 나가면 다시 올려준다 (최대 3회)
  if (pack.isStart && pack.list[0].y > cameraY + CANVAS.H) {
    if (pack.repos < START_CARDS.MAX_REPOS) {
      pack.repos++;
      for (const c of pack.list) c.y = p.y + START_CARDS.REPOS_Y;
    } else return 'gone';
  }
  return null;
}

export function cardLabel(id) {
  if (id === 'dew') return { icon: '이슬', name: '이슬' };
  const t = TRAITS.find(x => x.id === id);
  return t ? { icon: t.icon, name: t.name } : { icon: '?', name: '?' };
}
