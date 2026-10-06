/**
 * 연맹 광장 / Alliance Plaza — 비공개(unlisted) 시제품 백엔드. 2026-10-06.
 * 팬이 만든 비공식 커뮤니티. 게임사와 무관.
 *
 * KV (binding: KV)
 *   al:recruit            → [post]   모집글 전부 (14일 지나면 읽을 때 걸러냄, 끌어올리면 연장)
 *   al:chars              → [char]   캐릭터 명부
 *   al:chat:{room}        → [msg]    방마다 마지막 150개 (room = global | s{서버번호})
 *   al:tr:{msgId}:{lang}  → 번역문   (30일 보관)
 *   al:rl:{ipHash}:{kind} → 횟수     (짧은 TTL, 도배 막기)
 *   al:reports            → [{kind,id,room,n,ts}]
 *   al:rooms              → [room]   그룹 방 (마지막 글 30일 지나면 사라짐). 채팅은 al:chat:g{id} (31일 TTL)
 *
 * 접속자(presence)는 KV 에 안 씀 — Durable Object(AlliancePresence) 하나가 들고 있음.
 *   KV 무료 쓰기 하루 1,000번이라 25초 하트비트를 KV 에 쓰면 한 사람이 1시간에 144번 → 바로 바닥남.
 *   DO 는 메모리 + 자기 SQLite 저장소(무료 하루 10만 줄 쓰기). 하트비트 1번 = 1줄. KV 쓰기 0.
 *
 * 계정 없음. 닉네임 + PIN(4~6자리). PIN 은 글마다 무작위 소금 + SHA-256 으로만 저장.
 * 번역: DeepSeek (env.DEEPSEEK_API_KEY). 브라우저에는 절대 안 나감.
 */

const DAY = 86400000;
const POST_TTL = 14 * DAY;
const LANGS = ["ko", "en", "ja", "zh", "es", "pt", "de", "fr", "ru", "vi", "th", "id", "tr", "ar", "it", "pl"];
const LANG_NAMES = {
    ko: "Korean", en: "English", ja: "Japanese", zh: "Chinese (Simplified)", es: "Spanish",
    pt: "Portuguese", de: "German", fr: "French", ru: "Russian", vi: "Vietnamese", th: "Thai",
    id: "Indonesian", tr: "Turkish", ar: "Arabic", it: "Italian", pl: "Polish",
};
const HIDE_AT_REPORTS = 3;

// ---------- 작은 도구 ----------
const clean = (s, max) => String(s ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g, "")
    .trim().slice(0, max);
const oneLine = (s, max) => clean(s, max).replace(/\s+/g, " ");
const intOr = (v, d, lo = 0, hi = 1e15) => {
    const n = Math.floor(Number(String(v ?? "").replace(/[, ]/g, "")));
    return Number.isFinite(n) && n >= lo && n <= hi ? n : d;
};
const srv = (v) => intOr(String(v ?? "").replace(/^\s*[sS#]+\s*/, ""), null, 1, 99999);
const lang = (v) => (LANGS.includes(v) ? v : null);
const newId = () => {
    const b = new Uint8Array(9); crypto.getRandomValues(b);
    return btoa(String.fromCharCode(...b)).replace(/[+/=]/g, "").slice(0, 12);
};
async function sha(s) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
}
const validPin = (p) => /^\d{4,6}$/.test(String(p || ""));
async function pinHash(pin, salt) { return sha("alliance-plaza|" + salt + "|" + pin); }
async function pinOk(item, pin) { return validPin(pin) && item.salt && (await pinHash(String(pin), item.salt)) === item.pinHash; }
const strip = (item) => { const { salt, pinHash, ipHash, ...pub } = item; return pub; };

async function ipHashOf(req) {
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    return (await sha("al-ip|" + ip)).slice(0, 16);
}
// kind 마다 window 초 안에 max 번까지
async function rateLimited(env, ipHash, kind, max, windowSec) {
    const k = `al:rl:${ipHash}:${kind}`;
    const n = Number(await env.KV.get(k)) || 0;
    if (n >= max) return true;
    await env.KV.put(k, String(n + 1), { expirationTtl: Math.max(60, windowSec) });
    return false;
}
async function getArr(env, key) { return (await env.KV.get(key, "json")) || []; }
async function putArr(env, key, arr) { await env.KV.put(key, JSON.stringify(arr)); }
async function body(req) { try { return await req.json(); } catch (e) { return null; } }
const roomOk = (r) => (r === "global" || /^s\d{1,5}$/.test(r) || /^g[A-Za-z0-9]{6,12}$/.test(r) ? r : null);
const contactOk = (s) => oneLine(s, 120);

// ---------- 모집판 ----------
async function listRecruit(url, env) {
    const now = Date.now();
    const server = srv(url.searchParams.get("server"));
    const lg = lang(url.searchParams.get("lang"));
    let posts = (await getArr(env, "al:recruit")).filter(p => p.expires > now && (p.reports || 0) < HIDE_AT_REPORTS);
    if (server) posts = posts.filter(p => p.server === server);
    if (lg) posts = posts.filter(p => (p.langs || []).includes(lg));
    posts.sort((a, b) => b.bumped - a.bumped);
    return { posts: posts.slice(0, 200).map(strip) };
}

async function saveRecruit(req, env) {
    const b = await body(req);
    if (!b) return [400, { error: "invalid json" }];
    if (!validPin(b.pin)) return [400, { error: "pin", message: "PIN 4~6자리 숫자 / PIN must be 4-6 digits" }];
    const server = srv(b.server);
    const name = oneLine(b.name, 40);
    if (!server || !name) return [400, { error: "server/name required" }];
    const langs = [...new Set((Array.isArray(b.langs) ? b.langs : []).filter(lang))].slice(0, 6);
    const fields = {
        server, name, tag: oneLine(b.tag, 8), langs: langs.length ? langs : ["en"],
        members: intOr(b.members, null, 0, 200), needs: oneLine(b.needs, 60),
        power: oneLine(b.power, 20), desc: clean(b.desc, 600), contact: contactOk(b.contact),
        nick: oneLine(b.nick, 24) || "익명",
    };
    const now = Date.now();
    const all = await getArr(env, "al:recruit");
    const live = all.filter(p => p.expires > now);
    if (b.id) {
        const p = live.find(x => x.id === b.id);
        if (!p) return [404, { error: "not found" }];
        if (!(await pinOk(p, b.pin))) return [403, { error: "pin wrong" }];
        Object.assign(p, fields, { edited: now });
        await putArr(env, "al:recruit", live);
        return [200, { ok: true, post: strip(p) }];
    }
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "recruit", 3, 3600)) return [429, { error: "slow down", message: "1시간에 3개까지 / max 3 posts per hour" }];
    const salt = newId();
    const p = { id: newId(), ...fields, created: now, bumped: now, expires: now + POST_TTL, reports: 0,
        salt, pinHash: await pinHash(String(b.pin), salt), ipHash: ih };
    live.push(p);
    live.sort((a, c) => c.bumped - a.bumped);
    await putArr(env, "al:recruit", live.slice(0, 500));
    return [200, { ok: true, post: strip(p) }];
}

async function bumpRecruit(req, env) {
    const b = await body(req) || {};
    const now = Date.now();
    const live = (await getArr(env, "al:recruit")).filter(p => p.expires > now);
    const p = live.find(x => x.id === b.id);
    if (!p) return [404, { error: "not found" }];
    if (!(await pinOk(p, b.pin))) return [403, { error: "pin wrong" }];
    if (now - p.bumped < 6 * 3600 * 1000) return [429, { error: "too soon", message: "6시간에 한 번 / once per 6 hours" }];
    p.bumped = now; p.expires = now + POST_TTL;
    await putArr(env, "al:recruit", live);
    return [200, { ok: true, post: strip(p) }];
}

async function ownerDelete(req, env, key) {
    const b = await body(req) || {};
    const arr = await getArr(env, key);
    const p = arr.find(x => x.id === b.id);
    if (!p) return [404, { error: "not found" }];
    if (!(await pinOk(p, b.pin))) return [403, { error: "pin wrong" }];
    await putArr(env, key, arr.filter(x => x.id !== b.id));
    return [200, { ok: true }];
}

// ---------- 캐릭터 명부 ----------
async function listChars(url, env) {
    const server = srv(url.searchParams.get("server"));
    const q = oneLine(url.searchParams.get("q"), 24).toLowerCase();
    const ids = (url.searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 200);
    let chars = (await getArr(env, "al:chars")).filter(c => (c.reports || 0) < HIDE_AT_REPORTS);
    if (ids.length) chars = chars.filter(c => ids.includes(c.id));
    if (server) chars = chars.filter(c => c.server === server);
    if (q) chars = chars.filter(c => c.nick.toLowerCase().includes(q) || (c.alliance || "").toLowerCase().includes(q));
    chars.sort((a, b) => b.updated - a.updated);
    return { chars: chars.slice(0, 200).map(strip) };
}

async function saveChar(req, env) {
    const b = await body(req);
    if (!b) return [400, { error: "invalid json" }];
    if (!validPin(b.pin)) return [400, { error: "pin", message: "PIN 4~6자리 숫자 / PIN must be 4-6 digits" }];
    const server = srv(b.server);
    const nick = oneLine(b.nick, 24);
    if (!server || !nick) return [400, { error: "nick/server required" }];
    const fields = { nick, server, alliance: oneLine(b.alliance, 40), lang: lang(b.lang) || "en",
        power: oneLine(b.power, 20), note: oneLine(b.note, 120) };
    const now = Date.now();
    const all = await getArr(env, "al:chars");
    if (b.id) {
        const c = all.find(x => x.id === b.id);
        if (!c) return [404, { error: "not found" }];
        if (!(await pinOk(c, b.pin))) return [403, { error: "pin wrong" }];
        Object.assign(c, fields, { updated: now });
        await putArr(env, "al:chars", all);
        return [200, { ok: true, char: strip(c) }];
    }
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "char", 5, 3600)) return [429, { error: "slow down", message: "1시간에 5개까지 / max 5 per hour" }];
    const salt = newId();
    const c = { id: newId(), ...fields, created: now, updated: now, reports: 0,
        salt, pinHash: await pinHash(String(b.pin), salt), ipHash: ih };
    all.push(c);
    await putArr(env, "al:chars", all.slice(-3000));
    return [200, { ok: true, char: strip(c) }];
}

// ---------- 번역 토론방 ----------
const SYS = (target) =>
    `Translate the user's chat message into ${LANG_NAMES[target]}. It is from a mobile strategy war game community ` +
    `(alliances, servers, rally, merge, troops, base, shield, teleport, power, KvK, buff, farm, zeroed, hit, gather). ` +
    `Keep game slang natural and accurate as players say it; keep names, numbers, coordinates and emoji as they are. ` +
    `Output only the translation, nothing else.`;

async function translate(env, text, target) {
    if (!env.DEEPSEEK_API_KEY) return null;
    try {
        const r = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.DEEPSEEK_API_KEY },
            body: JSON.stringify({
                model: "deepseek-chat", temperature: 0.2, max_tokens: 600,
                messages: [{ role: "system", content: SYS(target) }, { role: "user", content: text }],
            }),
        });
        if (!r.ok) return null;
        const j = await r.json();
        const out = j?.choices?.[0]?.message?.content;
        return out ? String(out).trim().slice(0, 1200) : null;
    } catch (e) { return null; }
}

async function getChat(url, env) {
    const room = roomOk(url.searchParams.get("room") || "global");
    if (!room) return [400, { error: "room" }];
    const acc = await roomAccess(env, room, url.searchParams.get("key"));
    if (acc.err) return acc.err;
    const since = Number(url.searchParams.get("since")) || 0;
    const target = lang(url.searchParams.get("lang"));
    let msgs = (await getArr(env, `al:chat:${room}`)).filter(m => m.ts > since && (m.reports || 0) < HIDE_AT_REPORTS);
    msgs = msgs.slice(-60);
    const out = msgs.map(strip);
    if (target) {
        let budget = 20; // 한 번 부를 때 새로 번역하는 건 20개까지. 나머지는 다음 폴링에.
        await Promise.all(out.map(async (m) => {
            if (m.lang === target) return;
            const k = `al:tr:${m.id}:${target}`;
            let t = await env.KV.get(k);
            if (!t && budget > 0) {
                budget--;
                t = await translate(env, m.text, target);
                if (t) await env.KV.put(k, t, { expirationTtl: 30 * 86400 });
            }
            if (t) m.tr = t; else m.trPending = true;
        }));
    }
    return [200, { room, msgs: out, now: Date.now() }];
}

async function postChat(req, env) {
    const b = await body(req);
    if (!b) return [400, { error: "invalid json" }];
    const room = roomOk(b.room || "global");
    const text = clean(b.text, 500);
    const nick = oneLine(b.nick, 24);
    if (!room || !text || !nick) return [400, { error: "room/nick/text required" }];
    const acc = await roomAccess(env, room, b.key);
    if (acc.err) return acc.err;
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "chat", 20, 60)) return [429, { error: "slow down", message: "1분에 20개까지 / max 20 per minute" }];
    const m = { id: newId(), room, nick, server: srv(b.server), lang: lang(b.lang) || "en",
        text, ts: Date.now(), reports: 0, ipHash: ih };
    const arr = await getArr(env, `al:chat:${room}`);
    arr.push(m);
    if (acc.room) {
        // 그룹 방 글은 31일 TTL. 방의 lastMsg 는 하루 한 번만 고침(KV 쓰기 아끼기).
        await env.KV.put(`al:chat:${room}`, JSON.stringify(arr.slice(-150)), { expirationTtl: 31 * 86400 });
        if (m.ts - (acc.room.lastMsg || 0) > DAY) {
            const rooms = acc.rooms, r = rooms.find(x => x.id === acc.room.id);
            if (r) { r.lastMsg = m.ts; await putArr(env, "al:rooms", rooms); }
        }
    } else await putArr(env, `al:chat:${room}`, arr.slice(-150));
    return [200, { ok: true, msg: strip(m) }];
}

// ---------- 그룹 방 ----------
const ROOM_IDLE = 30 * DAY;
const roomAlive = (r, now) => Math.max(r.lastMsg || 0, r.created) > now - ROOM_IDLE && (r.reports || 0) < HIDE_AT_REPORTS;
const roomKey = async (r) => (await sha("al-room-key|" + r.id + "|" + r.pwHash)).slice(0, 24);
const pubRoom = (r) => ({ id: r.id, name: r.name, desc: r.desc, nick: r.nick, hasPw: !!r.pwHash,
    created: r.created, lastMsg: r.lastMsg || 0, members: (r.members || []).length });
const sameNick = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

// 그룹 방이면 방이 살아 있는지 + 비밀번호 방이면 열쇠(key)가 맞는지. 아니면 그냥 통과.
async function roomAccess(env, room, key) {
    if (room === "global" || room[0] !== "g") return {};
    const rooms = await getArr(env, "al:rooms");
    const r = rooms.find(x => x.id === room.slice(1));
    if (!r || !roomAlive(r, Date.now())) return { err: [404, { error: "room gone" }] };
    if (r.pwHash && String(key || "") !== (await roomKey(r))) return { err: [403, { error: "room key" }] };
    return { room: r, rooms };
}

async function listRooms(env) {
    const now = Date.now();
    const rooms = (await getArr(env, "al:rooms")).filter(r => roomAlive(r, now));
    const counts = await presenceCall(env, "/counts", null) || {};
    const out = rooms.map(r => ({ ...pubRoom(r), online: counts["g" + r.id] || 0 }));
    out.sort((a, b) => (b.online - a.online) || (Math.max(b.lastMsg, b.created) - Math.max(a.lastMsg, a.created)));
    return [200, { rooms: out.slice(0, 200), online: counts }];
}

async function saveRoom(req, env) {
    const b = await body(req);
    if (!b) return [400, { error: "invalid json" }];
    if (!validPin(b.pin)) return [400, { error: "pin", message: "PIN 4~6자리 숫자 / PIN must be 4-6 digits" }];
    const name = oneLine(b.name, 40), nick = oneLine(b.nick, 24);
    if (!name || !nick) return [400, { error: "name/nick required" }];
    const pw = b.password == null ? null : String(b.password).trim();
    if (pw && !/^\d{4,6}$/.test(pw)) return [400, { error: "password", message: "방 비밀번호 4~6자리 숫자 / room password must be 4-6 digits" }];
    const now = Date.now();
    const rooms = (await getArr(env, "al:rooms")).filter(r => roomAlive(r, now));
    if (b.id) {
        const r = rooms.find(x => x.id === b.id);
        if (!r) return [404, { error: "not found" }];
        if (!sameNick(r.nick, nick) || !(await pinOk(r, b.pin))) return [403, { error: "pin wrong" }];
        r.name = name; r.desc = clean(b.desc, 300); r.edited = now;
        if (b.clearPassword) { delete r.pwHash; delete r.pwSalt; }
        else if (pw) { r.pwSalt = newId(); r.pwHash = await sha("al-room-pw|" + r.pwSalt + "|" + pw); }
        await putArr(env, "al:rooms", rooms);
        return [200, { ok: true, room: pubRoom(r), key: r.pwHash ? await roomKey(r) : "" }];
    }
    if (rooms.length >= 300) return [429, { error: "full", message: "방이 너무 많습니다 / too many rooms" }];
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "room", 3, 3600)) return [429, { error: "slow down", message: "1시간에 방 3개까지 / max 3 rooms per hour" }];
    const salt = newId();
    const r = { id: newId(), name, desc: clean(b.desc, 300), nick, created: now, lastMsg: 0, reports: 0,
        members: [nick], salt, pinHash: await pinHash(String(b.pin), salt), ipHash: ih };
    if (pw) { r.pwSalt = newId(); r.pwHash = await sha("al-room-pw|" + r.pwSalt + "|" + pw); }
    rooms.push(r);
    await putArr(env, "al:rooms", rooms);
    return [200, { ok: true, room: pubRoom(r), key: r.pwHash ? await roomKey(r) : "" }];
}

async function deleteRoom(req, env) {
    const b = await body(req) || {};
    const rooms = await getArr(env, "al:rooms");
    const r = rooms.find(x => x.id === b.id);
    if (!r) return [404, { error: "not found" }];
    if (!sameNick(r.nick, b.nick) || !(await pinOk(r, b.pin))) return [403, { error: "pin wrong" }];
    await putArr(env, "al:rooms", rooms.filter(x => x.id !== b.id));
    await env.KV.delete(`al:chat:g${b.id}`);
    return [200, { ok: true }];
}

async function joinRoom(req, env) {
    const b = await body(req) || {};
    const now = Date.now();
    const rooms = await getArr(env, "al:rooms");
    const r = rooms.find(x => x.id === b.id);
    if (!r || !roomAlive(r, now)) return [404, { error: "not found" }];
    if (r.pwHash) {
        // 틀린 비밀번호만 셈 (10분에 10번). 맞는 건 KV 쓰기 안 함.
        const ih = await ipHashOf(req), k = `al:rl:${ih}:rpw`;
        const n = Number(await env.KV.get(k)) || 0;
        if (n >= 10) return [429, { error: "slow down", message: "잠시 뒤에 / try again later" }];
        const pw = String(b.password || "").trim();
        if (!/^\d{4,6}$/.test(pw) || (await sha("al-room-pw|" + r.pwSalt + "|" + pw)) !== r.pwHash) {
            await env.KV.put(k, String(n + 1), { expirationTtl: 600 });
            return [403, { error: "password wrong" }];
        }
    }
    const nick = oneLine(b.nick, 24);
    r.members = r.members || [];
    if (nick && !r.members.some(x => sameNick(x, nick)) && r.members.length < 500) {
        r.members.push(nick);
        await putArr(env, "al:rooms", rooms);
    }
    return [200, { ok: true, room: pubRoom(r), key: r.pwHash ? await roomKey(r) : "" }];
}

// ---------- 접속자 (Durable Object, 메모리만) ----------
async function presenceCall(env, path, data) {
    if (!env.AL_PRESENCE) return null;
    try {
        const stub = env.AL_PRESENCE.get(env.AL_PRESENCE.idFromName("plaza"));
        const r = await stub.fetch("https://presence" + path, data ? { method: "POST", body: JSON.stringify(data) } : {});
        return r.ok ? await r.json() : null;
    } catch (e) { return null; }
}

async function presence(req, env, leave) {
    const b = await body(req) || {};
    const room = roomOk(b.room);
    const uid = /^[A-Za-z0-9]{8,32}$/.test(String(b.uid || "")) ? b.uid : null;
    if (!room || !uid) return [400, { error: "room/uid" }];
    if (leave) { await presenceCall(env, "/leave", { room, uid }); return [200, { ok: true }]; }
    const acc = await roomAccess(env, room, b.key);
    if (acc.err) return acc.err;
    const j = await presenceCall(env, "/beat", { room, uid, nick: oneLine(b.nick, 24), server: srv(b.server), lang: lang(b.lang) || "en" });
    return [200, { room, online: (j && j.online) || [], me: j && j.me, now: Date.now() }];
}

const ONLINE_MS = 60000;
// 메모리가 원본, DO 자체 저장소(SQLite)는 잠들었다 깨어날 때 되살리는 용도.
// (DO 는 요청이 10초쯤 없으면 내려가서 메모리가 비워짐 — 실측.) 하트비트 1번 = 저장소 줄 1개 쓰기.
export class AlliancePresence {
    constructor(state, env) {
        this.state = state; this.rooms = new Map(); this.lastSweep = 0;
        state.blockConcurrencyWhile(async () => {
            const all = await state.storage.list({ prefix: "r:" });
            for (const [k, v] of all) this.rooms.set(k.slice(2), new Map(Object.entries(v || {})));
        });
    }
    save(room) {
        const m = this.rooms.get(room);
        if (!m || !m.size) { this.rooms.delete(room); return this.state.storage.delete("r:" + room); }
        return this.state.storage.put("r:" + room, Object.fromEntries(m));
    }
    async sweep(now) {
        if (now - this.lastSweep < 5000) return;
        this.lastSweep = now;
        const changed = [];
        for (const [room, m] of this.rooms) {
            let c = false;
            for (const [uid, u] of m) if (now - u.seen > ONLINE_MS) { m.delete(uid); c = true; }
            if (c) changed.push(room);
        }
        await Promise.all(changed.map(r => this.save(r)));
    }
    async fetch(request) {
        const url = new URL(request.url), now = Date.now();
        await this.sweep(now);
        if (url.pathname === "/counts") {
            const out = {};
            for (const [room, m] of this.rooms) if (m.size) out[room] = m.size;
            return Response.json(out);
        }
        const b = await request.json().catch(() => ({}));
        if (url.pathname === "/leave") {
            const m = this.rooms.get(b.room);
            if (m && m.delete(b.uid)) await this.save(b.room);
            return Response.json({ ok: true });
        }
        if (url.pathname === "/beat") {
            let m = this.rooms.get(b.room);
            if (!m) {
                if (this.rooms.size >= 5000) return Response.json({ online: [] });
                m = new Map(); this.rooms.set(b.room, m);
            }
            const u = m.get(b.uid);
            if (u || m.size < 500) {
                const pid = u ? u.pid : (await sha("al-pid|" + b.uid)).slice(0, 10);
                m.set(b.uid, { pid, nick: b.nick, server: b.server, lang: b.lang, since: u ? u.since : now, seen: now });
                await this.save(b.room);
            }
            const online = [...m.values()].filter(x => now - x.seen <= ONLINE_MS).sort((x, y) => x.since - y.since)
                .map(x => ({ id: x.pid, nick: x.nick, server: x.server, lang: x.lang, since: x.since }));
            return Response.json({ online, me: m.get(b.uid)?.pid || null });
        }
        return new Response("nope", { status: 404 });
    }
}

// ---------- 신고 · 관리 ----------
const KIND_KEY = { recruit: () => "al:recruit", char: () => "al:chars", chat: (room) => `al:chat:${room}`, room: () => "al:rooms" };

async function report(req, env) {
    const b = await body(req) || {};
    const kk = KIND_KEY[b.kind];
    const room = b.kind === "chat" ? roomOk(b.room) : null;
    if (!kk || !b.id || (b.kind === "chat" && !room)) return [400, { error: "kind/id" }];
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "report", 20, 3600)) return [429, { error: "slow down" }];
    const once = `al:rl:${ih}:rep:${b.id}`;
    if (await env.KV.get(once)) return [200, { ok: true, already: true }];
    await env.KV.put(once, "1", { expirationTtl: 30 * 86400 });
    const key = kk(room);
    const arr = await getArr(env, key);
    const it = arr.find(x => x.id === b.id);
    if (!it) return [404, { error: "not found" }];
    it.reports = (it.reports || 0) + 1;
    await putArr(env, key, arr);
    const reps = await getArr(env, "al:reports");
    const r = reps.find(x => x.id === b.id);
    if (r) { r.n = it.reports; r.ts = Date.now(); } else reps.push({ kind: b.kind, id: b.id, room, n: it.reports, ts: Date.now() });
    await putArr(env, "al:reports", reps.slice(-500));
    return [200, { ok: true }];
}

function isAdmin(req, env) {
    const given = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    return !!env.ADMIN_KEY && given === env.ADMIN_KEY;
}

async function adminDelete(req, env) {
    const b = await body(req) || {};
    const kk = KIND_KEY[b.kind];
    const room = b.kind === "chat" ? roomOk(b.room) : null;
    if (!kk || !b.id || (b.kind === "chat" && !room)) return [400, { error: "kind/id(/room)" }];
    const key = kk(room);
    const arr = await getArr(env, key);
    const left = arr.filter(x => x.id !== b.id);
    if (left.length !== arr.length) await putArr(env, key, left);
    if (b.kind === "chat") await Promise.all(LANGS.map(l => env.KV.delete(`al:tr:${b.id}:${l}`)));
    if (b.kind === "room") await env.KV.delete(`al:chat:g${b.id}`);
    const reps = await getArr(env, "al:reports");
    if (reps.some(r => r.id === b.id)) await putArr(env, "al:reports", reps.filter(r => r.id !== b.id));
    return [200, { ok: true, deleted: arr.length - left.length }];
}

async function adminReports(env) {
    return [200, { reports: await getArr(env, "al:reports") }];
}

// ---------- 길잡이 ----------
// 맞으면 Response, 아니면 null.
export async function handleAlliance(request, env, h) {
    const url = new URL(request.url);
    const p = url.pathname, m = request.method;
    const send = ([status, obj]) => new Response(JSON.stringify(obj), {
        status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...h } });
    if (p.startsWith("/admin/alliance/")) {
        if (!isAdmin(request, env)) return send([401, { error: "nope" }]);
        if (p === "/admin/alliance/delete" && m === "POST") return send(await adminDelete(request, env));
        if (p === "/admin/alliance/reports" && m === "GET") return send(await adminReports(env));
        return send([404, { error: "not found" }]);
    }
    if (!p.startsWith("/alliance/")) return null;
    try {
        if (p === "/alliance/recruit" && m === "GET") return send([200, await listRecruit(url, env)]);
        if (p === "/alliance/recruit" && m === "POST") return send(await saveRecruit(request, env));
        if (p === "/alliance/recruit/bump" && m === "POST") return send(await bumpRecruit(request, env));
        if (p === "/alliance/recruit/delete" && m === "POST") return send(await ownerDelete(request, env, "al:recruit"));
        if (p === "/alliance/chars" && m === "GET") return send([200, await listChars(url, env)]);
        if (p === "/alliance/chars" && m === "POST") return send(await saveChar(request, env));
        if (p === "/alliance/chars/delete" && m === "POST") return send(await ownerDelete(request, env, "al:chars"));
        if (p === "/alliance/chat" && m === "GET") return send(await getChat(url, env));
        if (p === "/alliance/chat" && m === "POST") return send(await postChat(request, env));
        if (p === "/alliance/report" && m === "POST") return send(await report(request, env));
        if (p === "/alliance/rooms" && m === "GET") return send(await listRooms(env));
        if (p === "/alliance/rooms" && m === "POST") return send(await saveRoom(request, env));
        if (p === "/alliance/rooms/delete" && m === "POST") return send(await deleteRoom(request, env));
        if (p === "/alliance/rooms/join" && m === "POST") return send(await joinRoom(request, env));
        if (p === "/alliance/presence" && m === "POST") return send(await presence(request, env, false));
        if (p === "/alliance/presence/leave" && m === "POST") return send(await presence(request, env, true));
    } catch (e) {
        return send([500, { error: "server" }]);
    }
    return send([404, { error: "not found" }]);
}
