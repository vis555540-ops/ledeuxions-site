/* PDF300 — server-tool metering (paywall)
 *
 * 결정(2026-07-27, 형 위임 + 리서치 근거):
 *   · 브라우저 도구 14종 = 영구 무료·무제한 (업로드 없음 = 최대 강점, 여기는 절대 안 막음)
 *   · 서버 도구 10종     = 하루 5회 무료, 초과 시 결제 유도
 *   근거: Smallpdf 하루 2건(+워터마크), iLovePDF 파일 15MB·일일 제한 → 5회면 업계 2.5배로 후함.
 *   가입은 요구하지 않는다(형: "가입시키면 딴 데로 간다"). 게이트웨이가 IP로 센다.
 *
 * ⚠️ enabled=false 인 동안은 아무 동작도 하지 않는다(=지금까지와 완전히 동일).
 *    켜는 조건: ①레몬즙 스토어 활성화 ②checkout URL 입력 ③형 "켜" — 셋 다 충족 후.
 *    지금 켜면 손님이 막히는데 살 방법이 없어서 손해만 난다.
 */
window.PDF300_PAYWALL = {
    enabled: false,
    freePerDay: 5,
    gateway: 'https://api.ledeuxions.com',
    direct: 'https://pdf.ledeuxions.com',
    checkout: { dayPass: '', monthly: '' }   // 상점 Publish 후 URL 넣기
};

/* 하루 이용권 열쇠 (2026-08-21)
 * 산 사람을 풀어주는 장치. 이게 없으면 손님이 0.99 달러를 내고도 계속 막힌다.
 * 열쇠는 이 브라우저에만 저장한다. 서버는 열쇠가 처음 쓰인 시각만 안다. */
window.PDF300_PASS = (function () {
    var KEY = 'pdf300_pass';
    function 읽기() {
        try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
    }
    function 쓰기(v) {
        try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch (e) {}
    }
    function 살아있나() {
        var p = 읽기();
        if (!p || !p.code) return null;
        if (p.endsAt && new Date(p.endsAt).getTime() <= Date.now()) { 쓰기(null); return null; }
        return p;
    }
    function 넣기(code) {
        return fetch(window.PDF300_PAYWALL.gateway + '/pass/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        }).then(function (r) { return r.json(); }).then(function (d) {
            if (d && d.ok) { 쓰기({ code: d.code, endsAt: d.endsAt }); }
            return d;
        });
    }
    return { get: 살아있나, set: 넣기, clear: function () { 쓰기(null); } };
})();

(function () {
    'use strict';

    var CFG = window.PDF300_PAYWALL;

    // pdf.ledeuxions.com 경로 → 게이트웨이 도구 이름
    var TOOL_OF = {
        '/compress': 'pdf-hq-compress',
        '/ocr': 'pdf-ocr',
        '/protect': 'pdf-protect',
        '/unlock': 'pdf-unlock',
        '/strip-metadata': 'pdf-strip',
        '/repair': 'pdf-repair',
        '/add-page-numbers': 'pdf-numbers',
        '/n-up': 'pdf-nup',
        '/watermark': 'pdf-watermark',
        '/office-to-pdf': 'pdf-office'
    };

    function styles() {
        if (document.getElementById('pw-styles')) return;
        var s = document.createElement('style');
        s.id = 'pw-styles';
        s.textContent = [
            '.pw-back{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);',
            'display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;}',
            '.pw-card{background:var(--bg-card,#1E1A16);color:var(--text-primary,#F6F2EA);',
            'border:1px solid var(--border,rgba(255,255,255,.1));border-radius:14px;max-width:460px;width:100%;padding:28px;}',
            '.pw-card h3{margin:0 0 10px;font-size:1.25rem;}',
            '.pw-card p{margin:0 0 16px;color:var(--text-secondary,#B7B0A4);font-size:.94rem;line-height:1.55;}',
            '.pw-card ul{margin:0 0 18px;padding-left:18px;color:var(--text-secondary,#B7B0A4);font-size:.9rem;line-height:1.7;}',
            '.pw-row{display:flex;gap:10px;flex-wrap:wrap;}',
            '.pw-row a,.pw-row button{flex:1;min-width:140px;padding:12px 14px;border-radius:10px;border:0;',
            'font-size:.95rem;cursor:pointer;text-align:center;text-decoration:none;}',
            '.pw-buy{background:var(--accent,#E8895F);color:#14110F;font-weight:600;}',
            '.pw-close{background:transparent;color:var(--text-muted,#837C70);border:1px solid var(--border,rgba(255,255,255,.15));}'
        ].join('');
        document.head.appendChild(s);
    }

    function showLimit(info) {
        styles();
        if (document.querySelector('.pw-back')) return;
        var c = CFG.checkout || {};
        var buttons = (c.dayPass || c.monthly)
            ? (c.dayPass ? '<a class="pw-buy" href="' + c.dayPass + '" target="_blank" rel="noopener">Day Pass $0.99</a>' : '') +
              (c.monthly ? '<a class="pw-buy" href="' + c.monthly + '" target="_blank" rel="noopener">Monthly $4.90</a>' : '')
            : '<button class="pw-buy" id="pw-ok">OK</button>';

        var back = document.createElement('div');
        back.className = 'pw-back';
        back.innerHTML =
            '<div class="pw-card" role="dialog" aria-modal="true">' +
            '<h3>Daily free limit reached</h3>' +
            '<p>' + (info && info.message
                ? info.message
                : 'You have used all ' + CFG.freePerDay + ' free server-tool runs for today.') + '</p>' +
            '<ul>' +
            '<li>All 14 browser tools stay <strong>free and unlimited</strong> — your files never leave your device.</li>' +
            '<li>Server tools (OCR, password, repair, Office→PDF) reset tomorrow.</li>' +
            '<li>No watermarks on anything we produce.</li>' +
            '</ul>' +
            '<div class="pw-row">' + buttons +
            '<button class="pw-close" id="pw-x">Close</button></div>' +
            '<div style="margin-top:18px;padding-top:16px;border-top:1px solid var(--border,rgba(255,255,255,.1))">' +
            '<p style="margin:0 0 8px;font-size:.86rem">Already bought a day pass? Enter your key.</p>' +
            '<div class="pw-row">' +
            '<input id="pw-key" placeholder="PDF300-XXXX-XXXX-XXXX-XXXX" ' +
            'style="flex:2;min-width:190px;padding:11px 12px;border-radius:10px;border:1px solid ' +
            'var(--border,rgba(255,255,255,.15));background:transparent;color:inherit;font-size:.9rem">' +
            '<button class="pw-buy" id="pw-use" style="flex:1;min-width:100px">Unlock</button>' +
            '</div><p id="pw-msg" style="margin:8px 0 0;font-size:.84rem"></p></div>' +
            '</div>';
        document.body.appendChild(back);
        function close() { if (back.parentNode) back.parentNode.removeChild(back); }
        back.querySelector('#pw-x').onclick = close;

        var 칸 = back.querySelector('#pw-key');
        var 말 = back.querySelector('#pw-msg');
        function 풀기() {
            var v = (칸.value || '').trim();
            if (!v) { 말.textContent = 'Enter the key from your purchase email.'; return; }
            말.textContent = 'Checking...';
            window.PDF300_PASS.set(v).then(function (d) {
                if (d && d.ok) {
                    말.textContent = d.message || 'Unlocked.';
                    setTimeout(function () { close(); location.reload(); }, 900);
                } else {
                    말.textContent = (d && d.message) || 'That key did not work.';
                }
            }).catch(function () { 말.textContent = 'Could not reach the server. Try again.'; });
        }
        back.querySelector('#pw-use').onclick = 풀기;
        칸.addEventListener('keydown', function (e) { if (e.key === 'Enter') 풀기(); });
        var ok = back.querySelector('#pw-ok');
        if (ok) ok.onclick = close;
        back.addEventListener('click', function (e) { if (e.target === back) close(); });
    }

    // 마지막 무료 1회 남았을 때 부드럽게 미리 알려주기 (형 요청: 4회째에 예고)
    function softNotice(used, limit) {
        var msg = 'Heads up — that was your last free server-tool run for today (' +
                  used + '/' + limit + '). Browser tools stay unlimited.';
        if (window.LD && LD.toast) { LD.toast(msg); return; }
        styles();
        var el = document.createElement('div');
        el.className = 'pw-back';
        el.style.alignItems = 'flex-end';
        el.style.background = 'transparent';
        el.style.pointerEvents = 'none';
        el.innerHTML = '<div class="pw-card" style="max-width:380px;pointer-events:auto">' +
                       '<p style="margin:0">' + msg + '</p></div>';
        document.body.appendChild(el);
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6000);
    }

    if (!CFG.enabled) return;    // ← 꺼져 있으면 여기서 끝. 아무것도 건드리지 않음.

    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url.indexOf(CFG.direct) === 0) {
            var path = url.slice(CFG.direct.length).split('?')[0];
            var tool = TOOL_OF[path];
            if (tool) {                       // /health 등은 그대로 직통
                var target = CFG.gateway + '/v1/' + tool;
                var 표 = window.PDF300_PASS.get();
                if (표) {                      // 이용권이 있으면 같이 보낸다
                    init = init || {};
                    var h2 = new Headers(init.headers || {});
                    h2.set('X-Pass', 표.code);
                    init = Object.assign({}, init, { headers: h2 });
                }
                return origFetch(target, init).then(function (res) {
                    if (res.status === 429) {
                        res.clone().json().then(showLimit).catch(function () { showLimit(null); });
                    } else if (res.ok) {
                        var u = Number(res.headers.get('X-Quota-Used'));
                        var l = Number(res.headers.get('X-Quota-Limit'));
                        if (l && u === l - 1) softNotice(u, l);   // 마지막 1회 남음
                    }
                    return res;
                });
            }
        }
        return origFetch(input, init);
    };
})();
