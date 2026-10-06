/* 우리 계수기 — 남의 서비스 안 씀. 쿠키 안 씀. IP 저장 안 함.
   들어온 곳은 도메인 이름만 센다 (예: search.naver.com). 2026-10-06.
   우리 집에서 본 것은 서버가 안 센다 (2026-08-14 자기감시 사고 재발 방지). */
(function () {
    try {
        var 사이트 = location.hostname.indexOf('pdf300') === 0 ||
                    location.hostname.indexOf('pdf300') > -1 ? 'pdf300' : 'ledeuxions';
        var 쪽 = location.pathname || '/';
        if (쪽.length > 120) 쪽 = 쪽.slice(0, 120);
        // 어디서 왔나 — 도메인 이름만 보낸다 (전체 주소·검색어는 안 보냄). 없으면 '' = 바로 들어옴
        var 곳 = '';
        try { if (document.referrer) 곳 = new URL(document.referrer).hostname || ''; } catch (e) {}
        fetch('https://api.ledeuxions.com/hit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: 사이트, path: 쪽, ref: 곳 }),
            keepalive: true
        }).catch(function () {});
    } catch (e) {}
})();
