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

// 티어별 1일 호출 제한
const TIERS = {
    free:     { transcribe: 3,   "remove-bg": 5,    ocr: 5,    "restore-face": 2   },
    pro:      { transcribe: 200, "remove-bg": 500,  ocr: 500,  "restore-face": 100 },
    business: { transcribe: 1000,"remove-bg": 5000, ocr: 5000, "restore-face": 500 },
};

const ALLOWED_TOOLS = ["transcribe", "remove-bg", "ocr", "restore-face"];

// ---------- Helpers ----------
const todayKey = () => new Date().toISOString().slice(0, 10);

function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
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
        upstream = await fetch(backendOf(env) + "/v1/" + tool, {
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

        return json({ error: "not found", path: url.pathname }, 404, corsHeaders(origin));
    },
};
