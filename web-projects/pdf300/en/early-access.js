/* PDF300 — Early access capture
 *
 * 결제 오픈 전(레몬즙 스토어 활성화 대기) 동안, 도구를 많이 쓴 사용자에게
 * 이메일을 받아두고 오픈 때 무료 Pro 코드를 보내주기 위한 스크립트.
 *
 * - 도구를 실제로 "끝까지" 쓴 횟수만 센다 (LD.download 호출 = 결과물 생성)
 * - THRESHOLD 회를 넘기면 모달 1회 노출, 닫으면 SNOOZE 회 뒤에 다시
 * - 제출: POST https://api.ledeuxions.com/waitlist  { email, source, uses }
 * - 도구 사용을 막지 않는다. 차단이 아니라 제안.
 */
(function () {
    'use strict';

    var API = 'https://api.ledeuxions.com/waitlist';
    var THRESHOLD = 10;   // 이 횟수를 넘기면 제안
    var SNOOZE = 10;      // 나중에 누르면 이만큼 더 쓴 뒤 다시
    var K_USES = 'pdf300_uses';
    var K_NEXT = 'pdf300_ea_next';
    var K_DONE = 'pdf300_ea_done';

    function get(k, d) {
        try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; }
    }
    function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { } }

    function injectStyles() {
        if (document.getElementById('ea-styles')) return;
        var s = document.createElement('style');
        s.id = 'ea-styles';
        s.textContent = [
            '.ea-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);',
            'display:flex;align-items:center;justify-content:center;z-index:9999;padding:var(--space-4,16px);}',
            '.ea-card{background:var(--bg-card,#1E1A16);color:var(--text-primary,#F6F2EA);border:1px solid var(--border,rgba(255,255,255,.1));',
            'border-radius:var(--radius-lg,14px);max-width:440px;width:100%;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.5);}',
            '.ea-card h3{margin:0 0 10px;font-size:1.25rem;line-height:1.3;}',
            '.ea-card p{margin:0 0 18px;color:var(--text-secondary,#B7B0A4);font-size:.94rem;line-height:1.55;}',
            '.ea-card input{width:100%;padding:12px 14px;border-radius:var(--radius,10px);border:1px solid var(--border,rgba(255,255,255,.15));',
            'background:var(--bg-sunken,#16120F);color:inherit;font-size:1rem;}',
            '.ea-row{display:flex;gap:10px;margin-top:14px;}',
            '.ea-row button{flex:1;padding:12px 14px;border-radius:var(--radius,10px);border:0;font-size:.95rem;cursor:pointer;}',
            '.ea-go{background:var(--accent,#E8895F);color:#14110F;font-weight:600;}',
            '.ea-later{background:transparent;color:var(--text-muted,#837C70);border:1px solid var(--border,rgba(255,255,255,.15));}',
            '.ea-note{margin:14px 0 0;font-size:.78rem;color:var(--text-muted,#837C70);}',
            '.ea-msg{margin:12px 0 0;font-size:.88rem;min-height:1.2em;}',
            '.ea-msg.err{color:#E4796B;} .ea-msg.ok{color:#7FB88A;}'
        ].join('');
        document.head.appendChild(s);
    }

    function close(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

    function show(uses) {
        injectStyles();
        var back = document.createElement('div');
        back.className = 'ea-backdrop';
        back.innerHTML =
            '<div class="ea-card" role="dialog" aria-modal="true" aria-labelledby="ea-title">' +
            '<h3 id="ea-title">You have used PDF300 ' + uses + ' times</h3>' +
            '<p>Paid plans are not open yet. Leave your email and we will send you a <strong>free Pro code</strong> the day we launch — nothing to pay, nothing to cancel.</p>' +
            '<input type="email" id="ea-email" placeholder="you@example.com" autocomplete="email" inputmode="email">' +
            '<div class="ea-msg" id="ea-msg"></div>' +
            '<div class="ea-row">' +
            '<button class="ea-later" id="ea-later">Not now</button>' +
            '<button class="ea-go" id="ea-go">Send me the code</button>' +
            '</div>' +
            '<p class="ea-note">Only used to send your code. No newsletter, no sharing. ' +
            '<a href="https://ledeuxions.com/privacy/" target="_blank" rel="noopener">Privacy</a></p>' +
            '</div>';
        document.body.appendChild(back);

        var input = back.querySelector('#ea-email');
        var msg = back.querySelector('#ea-msg');
        var go = back.querySelector('#ea-go');
        input.focus();

        back.querySelector('#ea-later').onclick = function () {
            set(K_NEXT, uses + SNOOZE);
            close(back);
        };
        back.addEventListener('click', function (e) {
            if (e.target === back) { set(K_NEXT, uses + SNOOZE); close(back); }
        });

        go.onclick = async function () {
            var email = (input.value || '').trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                msg.className = 'ea-msg err'; msg.textContent = 'Please enter a valid email address.';
                return;
            }
            go.disabled = true; msg.className = 'ea-msg'; msg.textContent = 'Sending…';
            try {
                var res = await fetch(API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, source: 'pdf300-en', uses: uses })
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                msg.className = 'ea-msg ok';
                msg.textContent = 'Thank you — your code is reserved. Watch your inbox.';
                set(K_DONE, '1');
                setTimeout(function () { close(back); }, 1800);
            } catch (err) {
                go.disabled = false;
                msg.className = 'ea-msg err';
                msg.textContent = 'Could not reach the server. Please try again later.';
            }
        };
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    }

    function bump() {
        if (get(K_DONE, '') === '1') return;
        var uses = Number(get(K_USES, 0)) + 1;
        set(K_USES, uses);
        var next = Number(get(K_NEXT, THRESHOLD));
        if (uses >= next && !document.querySelector('.ea-backdrop')) {
            setTimeout(function () { show(uses); }, 900);   // 다운로드가 끝난 뒤에 띄우기
        }
    }

    /* ── 사전 오픈 행사 배너 ────────────────────────────────────────
       형 지시(2026-07-28): "레몬즙 나올 때까지 행사하자".
       지금은 전부 무료·무제한인 상태 자체가 행사다. 그걸 페이지에 말해주고
       이메일을 받아둔다. 결제 열리는 날 이 사람들부터 무료 코드.
       한 번 닫으면 다시 안 뜬다(K_BANNER). 이메일 넣으면 당연히 안 뜬다. */
    var K_BANNER = 'pdf300_banner_off';

    function banner() {
        if (get(K_DONE, '') === '1' || get(K_BANNER, '') === '1') return;
        if (!document.body) { document.addEventListener('DOMContentLoaded', banner); return; }
        injectStyles();
        if (!document.getElementById('ea-banner-styles')) {
            var bs = document.createElement('style');
            bs.id = 'ea-banner-styles';
            bs.textContent = [
                '.ea-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center;',
                'padding:12px 18px;background:linear-gradient(90deg,rgba(232,137,95,.16),rgba(232,137,95,.06));',
                'border-bottom:1px solid var(--border,rgba(255,255,255,.1));font-size:.92rem;}',
                '.ea-bar b{color:var(--accent,#E8895F);}',
                '.ea-bar form{display:flex;gap:8px;}',
                '.ea-bar input{padding:8px 12px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.15));',
                'background:var(--bg-sunken,#16120F);color:inherit;font-size:.9rem;min-width:200px;}',
                '.ea-bar button{padding:8px 14px;border-radius:8px;border:0;background:var(--accent,#E8895F);',
                'color:#14110F;font-weight:600;font-size:.9rem;cursor:pointer;}',
                '.ea-bar .ea-dismiss{background:transparent;color:var(--text-muted,#837C70);font-weight:400;}',
                '.ea-bar .ea-said{color:#7FB88A;}'
            ].join('');
            document.head.appendChild(bs);
        }
        var bar = document.createElement('div');
        bar.className = 'ea-bar';
        bar.innerHTML =
            '<span>🎁 <b>Founding user offer</b> — every tool is free and unlimited while we are in beta. ' +
            'Leave your email and get a <b>free Pro code</b> the day paid plans open.</span>' +
            '<form id="ea-bform"><input type="email" id="ea-bmail" placeholder="you@example.com" ' +
            'autocomplete="email" inputmode="email"><button type="submit">Reserve my code</button></form>' +
            '<button class="ea-dismiss" id="ea-bx" aria-label="Dismiss">✕</button>';
        document.body.insertBefore(bar, document.body.firstChild);

        bar.querySelector('#ea-bx').onclick = function () {
            set(K_BANNER, '1');
            if (bar.parentNode) bar.parentNode.removeChild(bar);
        };
        bar.querySelector('#ea-bform').onsubmit = async function (e) {
            e.preventDefault();
            var email = (bar.querySelector('#ea-bmail').value || '').trim();
            var msgEl = bar.querySelector('span');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
                msgEl.innerHTML = '⚠️ Please enter a valid email address.';
                return;
            }
            try {
                var res = await fetch(API, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, source: 'pdf300-banner', uses: Number(get(K_USES, 0)) })
                });
                if (!res.ok) throw new Error(res.status);
                set(K_DONE, '1'); set(K_BANNER, '1');
                bar.innerHTML = '<span class="ea-said">✅ Thank you — your free Pro code is reserved. ' +
                                'Keep using everything free in the meantime.</span>';
                setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 4000);
            } catch (err) {
                msgEl.innerHTML = '⚠️ Could not reach the server. Please try again later.';
            }
        };
    }
    banner();

    // LD.download 를 감싸서 "결과물이 만들어진 순간"만 카운트
    function hook() {
        if (!window.LD || typeof LD.download !== 'function' || LD.__eaHooked) return false;
        var orig = LD.download;
        LD.download = function () {
            var r = orig.apply(this, arguments);
            try { bump(); } catch (e) { }
            return r;
        };
        LD.__eaHooked = true;
        return true;
    }

    if (!hook()) {
        var tries = 0;
        var t = setInterval(function () {
            if (hook() || ++tries > 40) clearInterval(t);
        }, 100);
    }
})();
