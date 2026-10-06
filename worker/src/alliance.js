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
const roomOk = (r) => (r === "global" || /^s\d{1,5}$/.test(r) ? r : null);
const contactOk = (s) => oneLine(s, 120);

// ---------- 모집판 ----------
async function listRecruit(url, env) {
    const now = Date.now();
    const server = intOr(url.searchParams.get("server"), null, 1, 99999);
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
    const server = intOr(b.server, null, 1, 99999);
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
    const server = intOr(url.searchParams.get("server"), null, 1, 99999);
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
    const server = intOr(b.server, null, 1, 99999);
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
    const ih = await ipHashOf(req);
    if (await rateLimited(env, ih, "chat", 20, 60)) return [429, { error: "slow down", message: "1분에 20개까지 / max 20 per minute" }];
    const m = { id: newId(), room, nick, server: intOr(b.server, null, 1, 99999), lang: lang(b.lang) || "en",
        text, ts: Date.now(), reports: 0, ipHash: ih };
    const arr = await getArr(env, `al:chat:${room}`);
    arr.push(m);
    await putArr(env, `al:chat:${room}`, arr.slice(-150));
    return [200, { ok: true, msg: strip(m) }];
}

// ---------- 신고 · 관리 ----------
const KIND_KEY = { recruit: () => "al:recruit", char: () => "al:chars", chat: (room) => `al:chat:${room}` };

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
    } catch (e) {
        return send([500, { error: "server" }]);
    }
    return send([404, { error: "not found" }]);
}
