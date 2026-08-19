/* 게임월드 공용 아케이드 모듈 — 이름(1회 입력) + 전세계 랭킹.
   백엔드: Cloudflare Worker (api.ledeuxions.com) /score, /leaderboard  (KV 저장)
   각 게임에서: 시작 시 Arcade.ensureName(), 신기록 시 Arcade.submit(game, score).
   v2 (2026-08-19): 인앱 브라우저(텔레그램·카카오톡 등)에서 localStorage/prompt 차단 대응 (try/catch). */
(function () {
    const API = window.__ARCADE_API || "https://api.ledeuxions.com";
    const KEY = "gw_player";
    /* 영어 페이지(lang="en")에서는 영어로 묻는다. 이 모듈은 한/영 양쪽에서 같이 쓰인다.
       형 2026-08-20: itch 영어판에서 이름 묻는 창만 한글로 떴다 */
    const EN = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
    const say = {
        ask:  EN ? "Pick a name for the leaderboard! \u{1F30D}\n(You only enter this once)"
                 : "게임에 쓸 이름을 정해줘! \u{1F30D}\n(한 번만 입력하면 계속 저장돼요)",
        anon: EN ? "Player" : "익명",
        rank: (r, t) => EN ? "\u{1F30D} World #" + r + "! (of " + t + " players)"
                           : "\u{1F30D} 세계 " + r + "등! (전체 " + t + "명)",
    };

    let memName = ""; // localStorage 죽었을 때 이 세션 동안만 유지할 fallback

    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 인앱 등 차단 무시 */ } }

    function name() {
        return lsGet(KEY) || memName || "";
    }

    // 최초 1회만 이름 입력받아 저장. 이후엔 저장된 값 반환.
    // 인앱 브라우저에서 prompt 차단되면 익명 이름으로 fallback.
    function ensureName() {
        let n = lsGet(KEY) || memName;
        if (!n) {
            try {
                n = (window.prompt(say.ask, "") || "").trim().slice(0, 16);
            } catch (e) { n = ""; }
            if (!n) n = say.anon + Math.floor(Math.random() * 1000);
            memName = n;
            lsSet(KEY, n);
        }
        return n;
    }

    function setName(n) {
        n = (n || "").trim().slice(0, 16);
        if (n) { memName = n; lsSet(KEY, n); }
        return n;
    }

    // 점수 제출 → { rank, total, best, name, score } 또는 null(오프라인)
    async function submit(game, score) {
        try {
            const r = await fetch(API + "/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ game: game, name: ensureName(), score: score }),
            });
            if (!r.ok) return null;
            return await r.json();
        } catch (e) { return null; }
    }

    // 상위 랭킹 조회 → { game, total, top:[{n,s}] } 또는 null
    async function top(game, limit) {
        try {
            const r = await fetch(API + "/leaderboard?game=" + encodeURIComponent(game) + "&limit=" + (limit || 10));
            if (!r.ok) return null;
            return await r.json();
        } catch (e) { return null; }
    }

    // "🌍 세계 3등! (전체 12명)" 문구
    function rankText(res) {
        if (!res || !res.rank) return "";
        return say.rank(res.rank, res.total);
    }

    window.Arcade = { name: name, ensureName: ensureName, setName: setName, submit: submit, top: top, rankText: rankText };
})();
