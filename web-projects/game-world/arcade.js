/* 게임월드 공용 아케이드 모듈 — 이름(1회 입력) + 전세계 랭킹.
   백엔드: Cloudflare Worker (api.ledeuxions.com) /score, /leaderboard  (KV 저장)
   각 게임에서: 시작 시 Arcade.ensureName(), 신기록 시 Arcade.submit(game, score). */
(function () {
    const API = window.__ARCADE_API || "https://api.ledeuxions.com";
    const KEY = "gw_player";

    function name() {
        return localStorage.getItem(KEY) || "";
    }

    // 최초 1회만 이름 입력받아 저장. 이후엔 저장된 값 반환.
    function ensureName() {
        let n = localStorage.getItem(KEY);
        if (!n) {
            n = (window.prompt("게임에 쓸 이름을 정해줘! 🌍\n(한 번만 입력하면 계속 저장돼요)", "") || "").trim().slice(0, 16);
            if (!n) n = "익명" + Math.floor(Math.random() * 1000);
            localStorage.setItem(KEY, n);
        }
        return n;
    }

    function setName(n) {
        n = (n || "").trim().slice(0, 16);
        if (n) localStorage.setItem(KEY, n);
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
        return "🌍 세계 " + res.rank + "등! (전체 " + res.total + "명)";
    }

    window.Arcade = { name: name, ensureName: ensureName, setName: setName, submit: submit, top: top, rankText: rankText };
})();
