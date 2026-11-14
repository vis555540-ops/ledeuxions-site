// 양몰이 이사 코드 (2026-11-14) — 옛 앱(TWA, 크롬 저장) → 새 앱(Capacitor, 앱 안 저장)으로 진행을 옮긴다.
//   POST /sheepdog/move {save}   → {code}   저장 JSON 을 KV 에 30일 보관 (개인정보 X — 게임 저장만)
//   GET  /sheepdog/move/:code    → {save}   한 번 꺼내면 「씀」 표시. 10분 안에는 다시 꺼낼 수 있음(앱이 꺼졌을 때)
// KV 키: mv:{code} = {s: 저장문자열, t: 만든시각, u: 처음 꺼낸 시각|0}
//        mvrl:{ip}:{날짜} = 오늘 만든 횟수 (하루 20번까지)

const 글자 = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // 헷갈리는 0 O 1 I L 뺌
const 최대크기 = 200 * 1024;
const 보관초 = 60 * 60 * 24 * 30;
const 다시꺼냄_ms = 10 * 60 * 1000;
const 하루한도 = 20;

function 새코드() {
    const b = new Uint8Array(6); crypto.getRandomValues(b);
    let s = ""; for (const x of b) s += 글자[x % 글자.length]; return s;
}

export async function handleSheepdogMove(request, env, url, json, h) {
    const p = url.pathname;
    if (p === "/sheepdog/move" && request.method === "POST") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const rk = `mvrl:${ip}:${new Date().toISOString().slice(0, 10)}`;
        const n = parseInt(await env.KV.get(rk) || "0", 10);
        if (n >= 하루한도) return json({ error: "too many" }, 429, h);
        const raw = await request.text();
        if (raw.length > 최대크기 + 100) return json({ error: "too big" }, 413, h);
        let body; try { body = JSON.parse(raw); } catch (e) { return json({ error: "invalid json" }, 400, h); }
        const save = body && body.save;
        if (!save || typeof save !== "object" || Array.isArray(save) || !Array.isArray(save.개))
            return json({ error: "invalid save" }, 400, h);
        const s = JSON.stringify(save);
        if (s.length > 최대크기) return json({ error: "too big" }, 413, h);
        let code = "";
        for (let i = 0; i < 5; i++) { const c = 새코드(); if (!(await env.KV.get(`mv:${c}`))) { code = c; break; } }
        if (!code) return json({ error: "try again" }, 503, h);
        await env.KV.put(`mv:${code}`, JSON.stringify({ s, t: Date.now(), u: 0 }), { expirationTtl: 보관초 });
        await env.KV.put(rk, String(n + 1), { expirationTtl: 60 * 60 * 26 });
        return json({ code, days: 30 }, 200, h);
    }
    const m = /^\/sheepdog\/move\/([A-Za-z0-9]{6})$/.exec(p);
    if (m && request.method === "GET") {
        const code = m[1].toUpperCase();
        const v = await env.KV.get(`mv:${code}`, "json");
        if (!v) return json({ error: "not found" }, 404, h);
        const now = Date.now();
        if (v.u && now - v.u > 다시꺼냄_ms) return json({ error: "used" }, 410, h);
        if (!v.u) { v.u = now; await env.KV.put(`mv:${code}`, JSON.stringify(v), { expirationTtl: 다시꺼냄_ms / 1000 + 3600 }); }
        let save; try { save = JSON.parse(v.s); } catch (e) { return json({ error: "broken" }, 500, h); }
        return json({ save, made: v.t }, 200, h);
    }
    return null;
}
