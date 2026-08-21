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

// 무료 사용자가 pdf300 서버도구를 하루에 쓸 수 있는 횟수.
// 형 결정(2026-07-27): 5회. ("3회면 쓰다 막혀서 딴 데로 간다, 5회 넘으면 다른 도구 쓰기 싫을 타이밍")
const FREE_PDF_PER_DAY = 5;
// 하단 공유줄을 눌러 알려주면 그날 더 주는 횟수. 형 결정(2026-07-29): 10회.
// ⚠️ 검증하지 않는다(명예제). 공유 여부를 확인할 방법이 없고, 확인하는 척은 안 하기로 했다.
const SHARE_BONUS_PER_DAY = 10;

// pdf300 서버도구 무료/유료 한도 (형이 값 정하면 여기만 고치면 됨)
const PDF_SERVER_TOOLS = ["pdf-hq-compress", "pdf-ocr", "pdf-protect", "pdf-unlock",
    "pdf-strip", "pdf-repair", "pdf-numbers", "pdf-nup", "pdf-watermark", "pdf-office"];
const pdfLimits = (n) => Object.fromEntries(PDF_SERVER_TOOLS.map(t => [t, n]));

// 티어별 1일 호출 제한
const TIERS = {
    free:     { transcribe: 3,   "remove-bg": 5,    ocr: 5,    "pdf-compress": 10,    "restore-face": 2,   ...pdfLimits(FREE_PDF_PER_DAY) },
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, X-Pass",
        "Access-Control-Expose-Headers": "X-Pass-Ends, X-Result-KB, X-Orig-KB, X-Hit-Target, X-DPI, X-Quality, X-Elapsed, X-Quota-Used, X-Quota-Limit, X-Plan, Content-Disposition",
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


// 공유줄 클릭 → 그날 무료 횟수 추가. 하루 1번만. 검증 없음(명예제, 형 결정).
async function handleShareBonus(request, env, origin) {
    const h = corsHeaders(origin);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const key = `anonbonus:${ip}:${todayKey()}`;
    const cur = Number((await env.KV.get(key)) || 0);
    if (cur > 0) {
        return json({ ok: true, already: true, bonus: cur }, 200, h);
    }
    await env.KV.put(key, String(SHARE_BONUS_PER_DAY), { expirationTtl: 60 * 60 * 26 });
    return json({ ok: true, bonus: SHARE_BONUS_PER_DAY }, 200, h);
}

// ─────────────────────────────────────────────────────────────
// 하루 이용권 (day pass)  — 2026-08-21
//
// 왜 필요한가: 결제창은 이미 있었지만 "돈 낸 사람을 풀어주는" 장치가 없었다.
//   그대로 켰으면 손님이 0.99 달러를 내고도 계속 막혔을 것이다.
//
// 어떻게 도는가:
//   1. 열쇠를 미리 찍어둔다 (POST /admin/pass/mint, 내부 키 필요)
//   2. 페이힙 같은 데서 판다 → 손님이 열쇠를 받는다
//   3. 손님이 사이트에 열쇠를 넣으면 브라우저가 X-Pass 헤더로 보낸다
//   4. 처음 쓴 순간부터 24시간 무제한. 그 전엔 시계가 안 간다(사놓고 나중에 써도 손해 없음)
//
// KV: pass:{code} → { minted, firstUse, hours, note }
// ─────────────────────────────────────────────────────────────
const PASS_HOURS = 24;

// 헷갈리는 글자(0/O, 1/I/L) 뺀 32자
const PASS_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function mintPassCode() {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    let out = "";
    for (let i = 0; i < 16; i++) {
        out += PASS_ALPHABET[b[i] % PASS_ALPHABET.length];
        if (i % 4 === 3 && i !== 15) out += "-";
    }
    return "PDF300-" + out;          // 예: PDF300-K7QM-3XT9-BR2H-WY4N
}

// 페이힙이 판 열쇠인가 물어본다.
// 페이힙이 손님한테 열쇠를 만들어 주는데, 그 열쇠는 우리가 만든 게 아니라서
// 우리 창고에 없다. 그래서 페이힙한테 직접 물어본다.
// (이걸 안 하면 손님이 0.99 달러를 내고도 계속 막힌다.)
async function askPayhip(env, code) {
    if (!env.PAYHIP_SECRET) return false;
    try {
        const r = await fetch(
            "https://payhip.com/api/v2/license/verify?license_key=" + encodeURIComponent(code),
            { headers: { "product-secret-key": env.PAYHIP_SECRET } }
        );
        if (!r.ok) return false;
        const d = await r.json();
        // 실측 (2026-08-21): 없는 열쇠는 {"data":[],"error":true} 로 돌아온다.
        // 그래서 error 가 참이거나 data 가 비어 있으면 무조건 아니다.
        if (!d || d.error === true) return false;
        const dat = d.data;
        if (!dat) return false;
        if (Array.isArray(dat)) return dat.length > 0;
        if (dat.enabled === false) return false;      // 우리가 꺼둔 열쇠
        return !!(dat.license_key || dat.id || dat.enabled === true);
    } catch (e) {
        return false;   // 페이힙이 안 되면 막지 말고 그냥 모르는 열쇠로 둔다
    }
}

// 열쇠가 살아 있나. 살아 있으면 남은 시간을 준다.
// 처음 쓰는 순간 시계가 돌기 시작한다.
async function checkPass(env, raw) {
    const code = (raw || "").trim().toUpperCase();
    if (!code) return null;
    let rec = await env.KV.get(`pass:${code}`, "json");

    if (!rec) {
        // 우리 창고에 없다 → 페이힙이 판 것인지 물어본다
        if (await askPayhip(env, code)) {
            rec = { minted: Date.now(), firstUse: null, hours: PASS_HOURS, note: "payhip" };
            await env.KV.put(`pass:${code}`, JSON.stringify(rec));
        }
    }
    if (!rec) return { ok: false, reason: "unknown" };

    const now = Date.now();
    const hours = rec.hours || PASS_HOURS;

    if (!rec.firstUse) {                       // 첫 사용 — 지금부터 시계 시작
        rec.firstUse = now;
        await env.KV.put(`pass:${code}`, JSON.stringify(rec),
                         { expirationTtl: Math.ceil(hours * 3600) + 86400 });
        return { ok: true, code, endsAt: now + hours * 3600e3, fresh: true };
    }
    const endsAt = rec.firstUse + hours * 3600e3;
    if (now >= endsAt) return { ok: false, reason: "expired", endsAt };
    return { ok: true, code, endsAt, fresh: false };
}

// 익명 사용자용 pdf300 서버도구 프록시 (IP 기준 일일 무료 한도)
// KV: anon:{ip}:{date} → 그날 사용 횟수
async function handleAnonPdfCall(tool, req, env, origin) {
    const h = corsHeaders(origin);
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";

    // 하루 이용권을 들고 왔으면 세지 않는다
    const pass = await checkPass(env, req.headers.get("X-Pass"));
    if (pass && pass.ok) {
        return await passThrough(tool, req, env, h, pass);
    }

    const key = `anon:${ip}:${todayKey()}`;
    const used = Number((await env.KV.get(key)) || 0);
    const bonus = Number((await env.KV.get(`anonbonus:${ip}:${todayKey()}`)) || 0);
    const allowance = FREE_PDF_PER_DAY + bonus;

    if (used >= allowance) {
        return json({
            error: "daily free limit reached",
            tool, used, limit: allowance, bonus,
            message: `You have used all ${allowance} free server-tool runs for today. ` +
                     `Browser tools stay free and unlimited.`,
            upgrade_url: "https://pdf300.com/pricing",
            pass_hint: "Already bought a day pass? Enter your key to unlock.",
        }, 429, h);
    }

    await env.KV.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });

    const upstreamHeaders = new Headers();
    const ct = req.headers.get("Content-Type");
    if (ct) upstreamHeaders.set("Content-Type", ct);

    let upstream;
    try {
        upstream = await fetch(upstreamUrlFor(env, tool), {
            method: "POST", headers: upstreamHeaders, body: req.body,
        });
    } catch (e) {
        await env.KV.put(key, String(used), { expirationTtl: 60 * 60 * 26 });  // 환불
        return json({ error: "backend unreachable", detail: String(e) }, 502, h);
    }
    if (!upstream.ok) {
        await env.KV.put(key, String(used), { expirationTtl: 60 * 60 * 26 });  // 환불
    }

    const resp = new Response(upstream.body, upstream);
    Object.keys(h).forEach(k => resp.headers.set(k, h[k]));
    resp.headers.set("X-Quota-Used", String(upstream.ok ? used + 1 : used));
    resp.headers.set("X-Quota-Limit", String(allowance));
    resp.headers.set("X-Plan", "anonymous");
    return resp;
}

// ─────────────────────────────────────────────────────────────
// 우리 계수기 (2026-08-21)
//
// 왜: 형이 "들어온 숫자 좀" 물었는데 볼 방법이 없었다.
//     클라우드플레어 화면은 권한이 있어야 하고, 게이트웨이엔 아무것도 안 남는다
//     (결제벽이 꺼져 있어서 손님이 게이트웨이를 안 거친다).
//
// 어떻게: 우리 페이지가 /hit 를 한 번 부른다. 쿠키 없음. 남의 서비스 없음.
//   KV: hit:{사이트}:{날짜}        → 그날 방문 수
//       hituv:{사이트}:{날짜}      → 그날 다른 사람 수 (IP 를 해시해서 셈, IP 자체는 저장 안 함)
//       hitp:{사이트}:{날짜}:{쪽}  → 쪽별
//
// 🚨 우리 집 IP 는 세지 않는다.
//    (2026-08-14 에 "하루 2~3건 실사용"이라고 했던 게 사실은 우리가 우리를 본 것이었다.
//     같은 실수 두 번 하지 않는다.)
// ─────────────────────────────────────────────────────────────
const 우리사이트 = ["pdf300", "ledeuxions"];

async function 우리인가(env, ip) {
    if (!ip || ip === "unknown") return false;
    const 목록 = (await env.KV.get("hit:ours")) || "";       // 줄바꿈으로 구분된 우리 IP
    return 목록.split(/\s+/).filter(Boolean).includes(ip);
}

async function 해시(s) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(b)).slice(0, 8)
        .map(x => x.toString(16).padStart(2, "0")).join("");
}

async function handleHit(request, env, origin) {
    const h = corsHeaders(origin);
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    let body = {};
    try { body = await request.json(); } catch (e) {}

    const 사이트 = 우리사이트.includes(String(body.site)) ? String(body.site) : "ledeuxions";
    const 쪽 = String(body.path || "/").slice(0, 120);
    const 날 = todayKey();

    if (await 우리인가(env, ip)) {
        return json({ ok: true, skipped: "ours" }, 200, h);   // 우리는 안 센다
    }

    // 🚨 기계인지 사람인지 갈라 센다.
    //    2026-08-14 에 "실사용 하루 2~3건"이라고 했던 게 우리 자신이었다.
    //    2026-08-21 첫날 숫자를 보니 이번엔 크롤러였다. 같은 실수 세 번 하지 않는다.
    const ua = (request.headers.get("User-Agent") || "").toLowerCase();
    // ⚠️ 그냥 "bot" 으로 거르면 안 된다 — Cubot 같은 진짜 폰 이름에 bot 이 들어간다.
    //    아는 로봇 이름과 확실한 표시만 본다.
    const 기계 = !ua || new RegExp([
        "googlebot","bingbot","yandex","duckduckbot","baiduspider","applebot","petalbot",
        "semrushbot","ahrefsbot","mj12bot","dotbot","gptbot","claudebot","ccbot","bytespider",
        "amazonbot","facebookexternalhit","whatsapp","telegrambot","discordbot","slackbot",
        "linkedinbot","twitterbot","pinterest","embedly","slurp",
        "crawler","crawling","spider","headless","lighthouse","pagespeed","gtmetrix",
        "curl/","wget","python-requests","python-urllib","go-http","java/","axios","node-fetch",
        "\\bbot/"
    ].join("|")).test(ua);
    if (기계) {
        const bk = `hitbot:${사이트}:${날}`;
        await env.KV.put(bk, String(Number(await env.KV.get(bk) || 0) + 1),
                         { expirationTtl: 60 * 60 * 24 * 400 });
        return json({ ok: true, counted: "bot" }, 200, h);
    }

    const 살 = 60 * 60 * 24 * 400;   // 400일 보관

    // 그날 다른 사람 수 — IP 를 해시해서 표시만 남긴다 (IP 자체는 저장 안 함)
    const 표 = `hituvx:${사이트}:${날}:${await 해시(ip + 날)}`;
    const 처음 = (await env.KV.get(표)) === null;
    if (처음) {
        await env.KV.put(표, "1", { expirationTtl: 60 * 60 * 30 });
        const uk = `hituv:${사이트}:${날}`;
        await env.KV.put(uk, String(Number(await env.KV.get(uk) || 0) + 1), { expirationTtl: 살 });
    }

    const hk = `hit:${사이트}:${날}`;
    await env.KV.put(hk, String(Number(await env.KV.get(hk) || 0) + 1), { expirationTtl: 살 });

    const pk = `hitp:${사이트}:${날}:${쪽}`;
    await env.KV.put(pk, String(Number(await env.KV.get(pk) || 0) + 1), { expirationTtl: 살 });

    return json({ ok: true }, 200, h);
}

// 숫자 보기 — 우리만 (내부 키 필요)
async function handleHitStats(request, env, origin) {
    const h = corsHeaders(origin);
    const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    // 관리용 열쇠는 따로 둔다. INTERNAL_API_KEY 는 백엔드와 공유하므로 건드리지 않는다.
    if (!env.ADMIN_KEY || given !== env.ADMIN_KEY) {
        return json({ error: "nope" }, 401, h);
    }
    const url = new URL(request.url);
    const 며칠 = Math.max(1, Math.min(60, Number(url.searchParams.get("days")) || 14));

    const 날들 = [];
    for (let i = 0; i < 며칠; i++) {
        날들.push(new Date(Date.now() - i * 86400e3).toISOString().slice(0, 10));
    }
    const 답 = {};
    for (const 사이트 of 우리사이트) {
        답[사이트] = {};
        for (const 날 of 날들) {
            const v = Number(await env.KV.get(`hit:${사이트}:${날}`) || 0);
            const u = Number(await env.KV.get(`hituv:${사이트}:${날}`) || 0);
            const b = Number(await env.KV.get(`hitbot:${사이트}:${날}`) || 0);
            if (v || u || b) 답[사이트][날] = { 방문: v, 사람: u, 기계: b };
        }
    }
    return json({ ok: true, days: 며칠, stats: 답 }, 200, h);
}

// 손님이 열쇠를 넣었을 때 — 살아 있나 답해준다
async function handlePassCheck(request, env, origin) {
    const h = corsHeaders(origin);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const r = await checkPass(env, body.code);
    if (!r) return json({ ok: false, reason: "empty" }, 400, h);
    if (!r.ok) {
        const 말 = r.reason === "expired"
            ? "This pass has already been used up. It lasts 24 hours from first use."
            : "We could not find that pass. Check for typos, or contact us with your order number.";
        return json({ ok: false, reason: r.reason, message: 말 }, 200, h);
    }
    return json({
        ok: true, code: r.code, endsAt: new Date(r.endsAt).toISOString(),
        message: r.fresh
            ? "Pass activated. Server tools are unlimited for the next 24 hours."
            : "Pass is active.",
    }, 200, h);
}

// 열쇠 찍기 — 우리만 쓴다. 찍어서 페이힙에 올린다.
async function handlePassMint(request, env, origin) {
    const h = corsHeaders(origin);
    const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
    // 관리용 열쇠는 따로 둔다. INTERNAL_API_KEY 는 백엔드와 공유하므로 건드리지 않는다.
    if (!env.ADMIN_KEY || given !== env.ADMIN_KEY) {
        return json({ error: "nope" }, 401, h);
    }
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const n = Math.max(1, Math.min(500, Number(body.count) || 1));
    const hours = Math.max(1, Math.min(24 * 31, Number(body.hours) || PASS_HOURS));
    const note = String(body.note || "").slice(0, 80);

    const codes = [];
    for (let i = 0; i < n; i++) {
        const code = mintPassCode();
        await env.KV.put(`pass:${code}`, JSON.stringify({
            minted: Date.now(), firstUse: null, hours, note,
        }));   // 안 쓰면 안 지워진다. 산 사람이 언제 써도 되게.
        codes.push(code);
    }
    return json({ ok: true, count: codes.length, hours, codes }, 200, h);
}

// 이용권 손님 — 세지 않고 그냥 보낸다
async function passThrough(tool, req, env, h, pass) {
    const upstreamHeaders = new Headers();
    const ct = req.headers.get("Content-Type");
    if (ct) upstreamHeaders.set("Content-Type", ct);
    let upstream;
    try {
        upstream = await fetch(upstreamUrlFor(env, tool), {
            method: "POST", headers: upstreamHeaders, body: req.body,
        });
    } catch (e) {
        return json({ error: "backend unreachable", detail: String(e) }, 502, h);
    }
    const resp = new Response(upstream.body, upstream);
    Object.keys(h).forEach(k => resp.headers.set(k, h[k]));
    resp.headers.set("X-Plan", "daypass");
    resp.headers.set("X-Pass-Ends", new Date(pass.endsAt).toISOString());
    return resp;
}

async function handleApiCall(tool, req, env, origin) {
    if (!ALLOWED_TOOLS.includes(tool)) {
        return json({ error: "unknown tool" }, 404, corsHeaders(origin));
    }
    const apiKey = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim()
                || (req.headers.get("X-API-Key") || "").trim();
    if (!apiKey) {
        // 익명(계정 없이) pdf300 서버도구 사용 — IP 기준 하루 무료 N회.
        // ⚠️ env.PDF_METER_ANON 이 "on" 일 때만 동작. 기본은 꺼짐(=기존대로 401).
        //    가입 강요하면 이탈한다는 형 판단 때문에 키 대신 IP로 셈.
        if (env.PDF_METER_ANON === "on" && PDF_SERVER_TOOLS.includes(tool)) {
            return handleAnonPdfCall(tool, req, env, origin);
        }
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
        // 우리 계수기
        if (url.pathname === "/hit" && request.method === "POST") {
            return await handleHit(request, env, origin);
        }
        if (url.pathname === "/admin/hits" && request.method === "GET") {
            return await handleHitStats(request, env, origin);
        }

        // 하루 이용권 — 손님이 열쇠가 살아 있나 확인할 때
        if (url.pathname === "/pass/check" && request.method === "POST") {
            return await handlePassCheck(request, env, origin);
        }
        // 하루 이용권 — 열쇠 찍기 (우리만. 내부 키 필요)
        if (url.pathname === "/admin/pass/mint" && request.method === "POST") {
            return await handlePassMint(request, env, origin);
        }

        if (url.pathname === "/share-bonus" && request.method === "POST") {
            return handleShareBonus(request, env, origin);
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
