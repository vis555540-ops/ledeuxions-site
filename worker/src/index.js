/**
 * LeDeuxions API Gateway — Cloudflare Worker
 *
 * 역할:
 *  1. 사용자 가입 / API key 발급 (무료 티어)
 *  2. Lemon Squeezy 결제 webhook → 플랜 업그레이드
 *  3. /v1/* 요청을 맥미니 백엔드로 프록시하면서 사용량 제한
 *
 * Storage: Cloudflare KV (binding: KV)
 *   user:{email}    → { email, apiKey, plan, daily, dailyDate, created }
 *   apikey:{key}    → email   (역참조)
 *
 * Secrets (wrangler secret put):
 *   INTERNAL_API_KEY    백엔드 인증용 (백엔드의 .env와 일치)
 *   LEMON_WEBHOOK_SECRET Lemon Squeezy webhook 검증용
 */

// 맥미니 백엔드 주소. wrangler.toml의 [vars]에서 BACKEND_URL로 오버라이드 가능.
// 기본값은 새 AI 서브도메인 (기존 pdf.ledeuxions.com과 분리해 운영)
const DEFAULT_BACKEND = "https://ai.ledeuxions.com";
const backendOf = (env) => env.BACKEND_URL || DEFAULT_BACKEND;

// 툴별 업스트림 라우팅. 없으면 {기본백엔드}/v1/{tool}.
//  - pdf-compress(목표용량 압축) = 미니PC 서버 본진
//  - pdf300 서버도구 10종 = 미니PC pdf-tools(:8022), 경로가 /v1/* 이 아니라 루트라서 path 지정
// ⚠️ 아직 pdf300 프론트는 pdf.ledeuxions.com 을 직접 부른다. 여기 등록은
//    "게이트웨이로도 서빙 가능하게" 만든 준비 단계일 뿐, 사용자 동작은 바뀌지 않는다.
const PDF_TOOLS_BASE = "https://pdf.ledeuxions.com";
const TOOL_ROUTES = {
    "pdf-compress":     { base: "https://pdf-api.ledeuxions.com", path: "/v1/pdf-compress" },
    "pdf-hq-compress":  { base: PDF_TOOLS_BASE, path: "/compress" },
    "pdf-ocr":          { base: PDF_TOOLS_BASE, path: "/ocr" },
    "pdf-protect":      { base: PDF_TOOLS_BASE, path: "/protect" },
    "pdf-unlock":       { base: PDF_TOOLS_BASE, path: "/unlock" },
    "pdf-strip":        { base: PDF_TOOLS_BASE, path: "/strip-metadata" },
    "pdf-repair":       { base: PDF_TOOLS_BASE, path: "/repair" },
    "pdf-numbers":      { base: PDF_TOOLS_BASE, path: "/add-page-numbers" },
    "pdf-nup":          { base: PDF_TOOLS_BASE, path: "/n-up" },
    "pdf-watermark":    { base: PDF_TOOLS_BASE, path: "/watermark" },
    "pdf-office":       { base: PDF_TOOLS_BASE, path: "/office-to-pdf" },
};
const upstreamUrlFor = (env, tool) => {
    const r = TOOL_ROUTES[tool];
    return r ? r.base + r.path : backendOf(env) + "/v1/" + tool;
};

// pdf300 서버도구 무료/유료 한도 (형이 값 정하면 여기만 고치면 됨)
const PDF_SERVER_TOOLS = ["pdf-hq-compress", "pdf-ocr", "pdf-protect", "pdf-unlock",
    "pdf-strip", "pdf-repair", "pdf-numbers", "pdf-nup", "pdf-watermark", "pdf-office"];
const pdfLimits = (n) => Object.fromEntries(PDF_SERVER_TOOLS.map(t => [t, n]));

// 티어별 1일 호출 제한
const TIERS = {
    free:     { transcribe: 3,   "remove-bg": 5,    ocr: 5,    "pdf-compress": 10,    "restore-face": 2,   ...pdfLimits(10)   },
    pro:      { transcribe: 200, "remove-bg": 500,  ocr: 500,  "pdf-compress": 1000,  "restore-face": 100, ...pdfLimits(1000) },
    business: { transcribe: 1000,"remove-bg": 5000, ocr: 5000, "pdf-compress": 10000, "restore-face": 500, ...pdfLimits(10000)},
};

const ALLOWED_TOOLS = ["transcribe", "remove-bg", "ocr", "pdf-compress", "restore-face",
    ...PDF_SERVER_TOOLS];

// ---------- Helpers ----------
const todayKey = () => new Date().toISOString().slice(0, 10);

function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
        "Access-Control-Expose-Headers": "X-Result-KB, X-Orig-KB, X-Hit-Target, X-DPI, X-Quality, X-Elapsed, X-Quota-Used, X-Quota-Limit, X-Plan, Content-Disposition",
        "Vary": "Origin",
    };
}

function json(obj, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
    });
}

function genApiKey() {
    const buf = new Uint8Array(24);
    crypto.getRandomValues(buf);
    const b64 = btoa(String.fromCharCode(...buf)).replace(/[+/=]/g, "");
    return "ld_" + b64;
}

async function hmacSha256Hex(secret, body) {
    const key = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getUserByKey(env, apiKey) {
    if (!apiKey) return null;
    const email = await env.KV.get(`apikey:${apiKey}`);
    if (!email) return null;
    return await env.KV.get(`user:${email}`, "json");
}

async function saveUser(env, user) {
    await env.KV.put(`user:${user.email}`, JSON.stringify(user));
}

// ---------- Routes ----------

async function handleHealth(env, origin) {
    let backendOk = false;
    const backend = backendOf(env);
    try {
        const r = await fetch(backend + "/health", {
            headers: { "X-API-Key": env.INTERNAL_API_KEY || "" },
            cf: { cacheTtl: 0 },
        });
        backendOk = r.ok;
    } catch (e) {}
    return json(
        { gateway: "ok", backend: backendOk ? "ok" : "offline", backend_url: backend, tools: ALLOWED_TOOLS },
        200, corsHeaders(origin)
    );
}

async function handleSignup(req, env, origin) {
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "invalid json" }, 400, corsHeaders(origin)); }
    const email = (body.email || "").toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return json({ error: "invalid email" }, 400, corsHeaders(origin));
    }

    // 이미 있으면 기존 key 반환
    let user = await env.KV.get(`user:${email}`, "json");
    if (user) {
        return json({ apiKey: user.apiKey, plan: user.plan, existing: true }, 200, corsHeaders(origin));
    }

    const apiKey = genApiKey();
    user = {
        email, apiKey, plan: "free",
        created: new Date().toISOString(),
        daily: {}, dailyDate: todayKey(),
    };
    await saveUser(env, user);
    await env.KV.put(`apikey:${apiKey}`, email);
    return json({ apiKey, plan: "free", existing: false }, 200, corsHeaders(origin));
}

async function handleWebhookLemon(req, env) {
    // Lemon Squeezy webhook 검증
    // 본문 raw bytes로 받아서 HMAC SHA-256 비교
    const sigHeader = req.headers.get("X-Signature") || "";
    const rawBody = await req.text();
    if (env.LEMON_WEBHOOK_SECRET) {
        const calc = await hmacSha256Hex(env.LEMON_WEBHOOK_SECRET, rawBody);
        if (calc !== sigHeader) {
            return json({ error: "invalid signature" }, 401);
        }
    }

    let event;
    try { event = JSON.parse(rawBody); } catch (e) { return json({ error: "invalid json" }, 400); }
    const name = event?.meta?.event_name;
    const email = (event?.data?.attributes?.user_email || "").toLowerCase();
    if (!email) return json({ error: "no email in event" }, 400);

    let user = await env.KV.get(`user:${email}`, "json");
    if (!user) {
        // 가입 안 한 사용자가 결제 → 자동 가입
        const apiKey = genApiKey();
        user = {
            email, apiKey, plan: "free",
            created: new Date().toISOString(),
            daily: {}, dailyDate: todayKey(),
        };
        await env.KV.put(`apikey:${apiKey}`, email);
    }

    if (["subscription_created", "subscription_resumed", "subscription_updated"].includes(name)) {
        // 결제 변형: variant name으로 pro/business 구분 가능
        const variant = (event?.data?.attributes?.variant_name || "").toLowerCase();
        user.plan = variant.includes("business") ? "business" : "pro";
        user.subscribed_at = new Date().toISOString();
    } else if (["subscription_cancelled", "subscription_expired", "subscription_paused"].includes(name)) {
        user.plan = "free";
        user.cancelled_at = new Date().toISOString();
    }
    await saveUser(env, user);
    return json({ ok: true, email, plan: user.plan });
}

async function handleApiCall(tool, req, env, origin) {
    if (!ALLOWED_TOOLS.includes(tool)) {
        return json({ error: "unknown tool" }, 404, corsHeaders(origin));
    }
    const apiKey = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim()
                || (req.headers.get("X-API-Key") || "").trim();
    if (!apiKey) {
        return json({ error: "missing api key", hint: "Authorization: Bearer ld_..." }, 401, corsHeaders(origin));
    }

    const user = await getUserByKey(env, apiKey);
    if (!user) return json({ error: "invalid api key" }, 401, corsHeaders(origin));

    // 일별 리셋
    if (user.dailyDate !== todayKey()) {
        user.daily = {};
        user.dailyDate = todayKey();
    }
    const used = user.daily[tool] || 0;
    const limit = (TIERS[user.plan] || TIERS.free)[tool] || 0;
    if (used >= limit) {
        return json({
            error: "daily limit reached",
            tool, used, limit, plan: user.plan,
            upgrade_url: "https://ledeuxions.com/pricing",
        }, 429, corsHeaders(origin));
    }

    // pre-increment (race 방지 best effort)
    user.daily[tool] = used + 1;
    await saveUser(env, user);

    // 백엔드로 프록시
    const upstreamHeaders = new Headers();
    upstreamHeaders.set("X-API-Key", env.INTERNAL_API_KEY || "");
    const ct = req.headers.get("Content-Type");
    if (ct) upstreamHeaders.set("Content-Type", ct);

    let upstream;
    try {
        upstream = await fetch(upstreamUrlFor(env, tool), {
            method: "POST",
            headers: upstreamHeaders,
            body: req.body,
            // streaming pass-through
        });
    } catch (e) {
        // 백엔드 실패 시 사용량 환불
        user.daily[tool] = Math.max(0, (user.daily[tool] || 1) - 1);
        await saveUser(env, user);
        return json({ error: "backend unreachable", detail: String(e) }, 502, corsHeaders(origin));
    }

    // 백엔드가 실패 응답 → 사용량 환불
    if (!upstream.ok) {
        user.daily[tool] = Math.max(0, (user.daily[tool] || 1) - 1);
        await saveUser(env, user);
    }

    // 사용자에게 잔여 헤더 추가
    const resp = new Response(upstream.body, upstream);
    const ch = corsHeaders(origin);
    Object.keys(ch).forEach(k => resp.headers.set(k, ch[k]));
    resp.headers.set("X-Quota-Used", String(user.daily[tool] || 0));
    resp.headers.set("X-Quota-Limit", String(limit));
    resp.headers.set("X-Plan", user.plan);
    return resp;
}

async function handleMe(req, env, origin) {
    const apiKey = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim()
                || (req.headers.get("X-API-Key") || "").trim();
    const user = await getUserByKey(env, apiKey);
    if (!user) return json({ error: "invalid api key" }, 401, corsHeaders(origin));

    if (user.dailyDate !== todayKey()) {
        user.daily = {}; user.dailyDate = todayKey();
        await saveUser(env, user);
    }
    const limits = TIERS[user.plan] || TIERS.free;
    const quotas = Object.fromEntries(
        ALLOWED_TOOLS.map(t => [t, { used: user.daily[t] || 0, limit: limits[t] || 0 }])
    );
    return json(
        { email: user.email, plan: user.plan, quotas, resetsAt: todayKey() + "T24:00:00Z" },
        200, corsHeaders(origin)
    );
}

// ---------- Entry ----------
// ---------- Leaderboard (게임월드 전세계 랭킹) ----------
const ARCADE_GAMES = ["tower", "simon", "snake", "jump", "suika"];
const LB_MAX = 100;          // 게임별 저장 상위 인원 수
const LB_NAME_MAX = 16;

function sanitizeName(s) {
    return String(s || "").replace(/[<>\n\r\t]/g, "").trim().slice(0, LB_NAME_MAX) || "익명";
}

// POST /score  { game, name, score }  → { rank, total, best, name, score }
// 이름별 최고기록만 유지, 상위 LB_MAX명 보관. (KV eventual consistency — 가족 게임 규모라 허용)
async function handleScoreSubmit(req, env, origin) {
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "invalid json" }, 400, corsHeaders(origin)); }
    const game = String(body.game || "");
    if (!ARCADE_GAMES.includes(game)) return json({ error: "unknown game" }, 400, corsHeaders(origin));
    const name = sanitizeName(body.name);
    const score = Math.floor(Number(body.score));
    if (!Number.isFinite(score) || score < 0 || score > 1000000) {
        return json({ error: "invalid score" }, 400, corsHeaders(origin));
    }
    const key = `lb:${game}`;
    const list = (await env.KV.get(key, "json")) || [];
    const idx = list.findIndex(e => e.n === name);
    if (idx >= 0) {
        if (score > list[idx].s) { list[idx].s = score; list[idx].t = Date.now(); }
    } else {
        list.push({ n: name, s: score, t: Date.now() });
    }
    list.sort((a, b) => (b.s - a.s) || (a.t - b.t));
    if (list.length > LB_MAX) list.length = LB_MAX;
    await env.KV.put(key, JSON.stringify(list));
    const rank = list.filter(e => e.s > score).length + 1;
    return json({ rank, total: list.length, best: list[0].s, name, score }, 200, corsHeaders(origin));
}

// GET /leaderboard?game=tower&limit=10  → { game, total, top: [{n,s}] }
async function handleLeaderboard(req, env, origin) {
    const url = new URL(req.url);
    const game = String(url.searchParams.get("game") || "");
    if (!ARCADE_GAMES.includes(game)) return json({ error: "unknown game" }, 400, corsHeaders(origin));
    let limit = parseInt(url.searchParams.get("limit") || "10", 10);
    if (!Number.isFinite(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50;
    const list = (await env.KV.get(`lb:${game}`, "json")) || [];
    return json({ game, total: list.length, top: list.slice(0, limit).map(e => ({ n: e.n, s: e.s })) }, 200, corsHeaders(origin));
}

// ---------- 얼리 액세스 대기명단 (pdf300 사전등록) ----------
// 결제 오픈 전까지 "무료 10회 넘게 쓴 사람"에게 이메일을 받아두는 용도.
// KV: wl:{email} → { email, source, uses, ts, ip }
//     wlrl:{ip}:{date} → 하루 제출 횟수 (스팸 방지)
const WL_MAX_PER_IP_PER_DAY = 5;

function validEmail(s) {
    return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

async function handleWaitlistSubmit(request, env, origin) {
    const h = corsHeaders(origin);
    let body;
    try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400, h); }

    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) return json({ error: "invalid email" }, 400, h);

    const source = String(body.source || "unknown").slice(0, 40);
    const uses = Number.isFinite(body.uses) ? Math.min(Math.trunc(body.uses), 100000) : 0;
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    // IP당 하루 제출 제한
    const rlKey = `wlrl:${ip}:${todayKey()}`;
    const count = Number((await env.KV.get(rlKey)) || 0);
    if (count >= WL_MAX_PER_IP_PER_DAY) {
        return json({ error: "too many requests" }, 429, h);
    }
    await env.KV.put(rlKey, String(count + 1), { expirationTtl: 60 * 60 * 26 });

    const key = `wl:${email}`;
    const existing = await env.KV.get(key, "json");
    const record = {
        email,
        source,
        uses: Math.max(uses, existing?.uses || 0),
        ts: existing?.ts || new Date().toISOString(),
        updated: new Date().toISOString(),
        country: request.headers.get("CF-IPCountry") || null,
    };
    await env.KV.put(key, JSON.stringify(record));

    return json({ ok: true, already: Boolean(existing) }, 200, h);
}

// 관리자용: GET /waitlist?key=INTERNAL_API_KEY
async function handleWaitlistList(request, env, origin) {
    const h = corsHeaders(origin);
    const url = new URL(request.url);
    // 키는 헤더 우선(쿼리스트링은 특수문자·WAF 때문에 403 나는 경우가 있었음)
    const key = request.headers.get("X-Admin-Key") || url.searchParams.get("key");
    if (!env.INTERNAL_API_KEY || key !== env.INTERNAL_API_KEY) {
        return json({ error: "unauthorized" }, 401, h);
    }
    const out = [];
    let cursor;
    do {
        const page = await env.KV.list({ prefix: "wl:", cursor });
        for (const k of page.keys) {
            const v = await env.KV.get(k.name, "json");
            if (v) out.push(v);
        }
        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
    out.sort((a, b) => (a.ts < b.ts ? -1 : 1));
    return json({ total: out.length, entries: out }, 200, h);
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const origin = request.headers.get("Origin");

        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (url.pathname === "/health" || url.pathname === "/") {
            return handleHealth(env, origin);
        }
        if (url.pathname === "/me" && request.method === "GET") {
            return handleMe(request, env, origin);
        }
        if (url.pathname === "/signup" && request.method === "POST") {
            return handleSignup(request, env, origin);
        }
        if (url.pathname === "/webhook/lemon" && request.method === "POST") {
            return handleWebhookLemon(request, env);
        }
        if (url.pathname.startsWith("/v1/") && request.method === "POST") {
            const tool = url.pathname.slice(4);
            return handleApiCall(tool, request, env, origin);
        }
        if (url.pathname === "/waitlist" && request.method === "POST") {
            return handleWaitlistSubmit(request, env, origin);
        }
        if (url.pathname === "/waitlist" && request.method === "GET") {
            return handleWaitlistList(request, env, origin);
        }
        if (url.pathname === "/score" && request.method === "POST") {
            return handleScoreSubmit(request, env, origin);
        }
        if (url.pathname === "/leaderboard" && request.method === "GET") {
            return handleLeaderboard(request, env, origin);
        }

        return json({ error: "not found", path: url.pathname }, 404, corsHeaders(origin));
    },
};
