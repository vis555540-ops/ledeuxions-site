/* PDF300 — share strip
 *
 * 형 결정(2026-07-28): "레몬즙 나올 때까지 행사하자" + "한 번 거론만 되면 좋겠다"
 *   · 행사 안내·이메일 수집은 early-access.js 상단 배너가 이미 한다. 여기는 겹치지 않는다.
 *   · 이 파일이 맡는 것은 하나뿐 — '알려주기(공유)' 줄. 페이지 맨 아래, 도구를 다 본 뒤에.
 *   · paywall.enabled 가 켜지면 문구가 자동으로 '공유하면 오늘 +N회' 로 바뀐다.
 *     지금은 어차피 무제한이라 보상을 말하지 않는다(거짓말이 되니까).
 *
 * 리서치 근거(2026-07-27, fugu 지식창고):
 *   · 인스타 '팔로우 확인'은 메타가 API를 막아 자동 검증 불가 → 공유 클릭이 마찰이 제일 낮다.
 *   · 검증은 하지 않는다(명예제). 보상을 작게 잡아 속여도 손해가 작게 한다.
 *
 * 끄려면 enabled:false 한 줄.
 */
window.PDF300_PROMO = {
    enabled: true,
    url: 'https://pdf300.com/',
    instagram: 'https://instagram.com/meajeum',
    bonusRuns: 5            // paywall 켜진 뒤 공유 보상(하루 +N회)
};

(function () {
    'use strict';

    var CFG = window.PDF300_PROMO;
    if (!CFG.enabled) return;

    var KO = document.documentElement.lang === 'ko';
    var PAID = !!(window.PDF300_PAYWALL && window.PDF300_PAYWALL.enabled);

    var T = KO ? {
        title: '이 도구가 쓸 만했다면, 한 사람에게만 알려주세요',
        sub: '광고도 가입도 없이 굴러가는 사이트예요. 알려주시는 게 제일 큰 도움이에요.',
        titlePaid: '알려주시면 오늘 ' + CFG.bonusRuns + '번 더',
        subPaid: '서버 도구가 오늘 ' + CFG.bonusRuns + '번 늘어나요. 브라우저 도구 14개는 언제나 무제한이고요.',
        copy: '링크 복사',
        copied: '복사됐어요',
        thanks: '고마워요 💛 덕분에 이 사이트가 계속 무료로 굴러가요.',
        thanksPaid: '고마워요 💛 오늘 서버 도구 ' + CFG.bonusRuns + '번이 추가됐어요.',
        text: '브라우저에서 바로 되는 무료 PDF 도구 24개. 파일을 올리지 않아요.'
    } : {
        title: 'If this helped, tell one person',
        sub: 'No ads, no sign-up, no upload. Word of mouth is the only way people find it.',
        titlePaid: 'Share once, get ' + CFG.bonusRuns + ' more runs today',
        subPaid: 'Today’s server-tool allowance goes up by ' + CFG.bonusRuns + '. The 14 browser tools stay unlimited, always.',
        copy: 'Copy link',
        copied: 'Link copied',
        thanks: 'Thank you 💛 That is what keeps this site free.',
        thanksPaid: 'Thank you 💛 ' + CFG.bonusRuns + ' more server runs added for today.',
        text: '24 free PDF tools that run in your browser. Your files never get uploaded.'
    };

    var t = PAID ? { title: T.titlePaid, sub: T.subPaid, thanks: T.thanksPaid }
                 : { title: T.title, sub: T.sub, thanks: T.thanks };

    var U = encodeURIComponent(CFG.url);
    var X = encodeURIComponent(T.text);

    var CHANNELS = [
        { id: 'x', label: 'X', href: 'https://twitter.com/intent/tweet?text=' + X + '&url=' + U },
        { id: 'threads', label: 'Threads', href: 'https://www.threads.net/intent/post?text=' + X + '%20' + U },
        { id: 'reddit', label: 'Reddit', href: 'https://www.reddit.com/submit?url=' + U + '&title=' + X },
        { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + U },
        { id: 'instagram', label: 'Instagram', href: CFG.instagram }
    ];

    var PATH = {
        x: 'M18.9 2H22l-7 8 8.2 12H17l-5-7.3L6.2 22H3l7.5-8.6L2.6 2H9l4.6 6.7L18.9 2z',
        threads: 'M12 2a10 10 0 100 20 10 10 0 000-20zm.3 15.4c-2.7 0-4.4-1.6-4.6-4.2-.2-3 1.6-5.2 4.4-5.3 1.9-.1 3.2.7 3.8 2l-1.5.7c-.4-.8-1.1-1.2-2.2-1.1-1.6.1-2.6 1.3-2.5 3.4.1 1.9 1 2.9 2.6 2.9 1.2 0 1.9-.5 2.1-1.3-.5.2-1.1.3-1.7.3-1.4 0-2.3-.7-2.3-1.9 0-1.3 1.1-2.1 2.7-2.1 1.9 0 3.1 1.1 3.1 3 0 2.2-1.6 3.6-3.9 3.6z',
        reddit: 'M22 12a2 2 0 00-3.4-1.4 9.8 9.8 0 00-5.1-1.6l.9-4 2.8.6a1.6 1.6 0 101.6-1.7 1.6 1.6 0 00-1.4.9L14 4.1a.5.5 0 00-.6.4l-1 4.6a9.8 9.8 0 00-5 1.5A2 2 0 105.5 14a4 4 0 000 .6c0 3 3.4 5.4 7.6 5.4s7.6-2.4 7.6-5.4a4 4 0 000-.6A2 2 0 0022 12zM8.4 13.4a1.4 1.4 0 112.8 0 1.4 1.4 0 01-2.8 0zm7.9 4a5.4 5.4 0 01-3.4 1 5.4 5.4 0 01-3.4-1 .5.5 0 01.7-.7 4.5 4.5 0 002.7.8 4.5 4.5 0 002.7-.8.5.5 0 01.7.7zm-.5-2.6a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8z',
        facebook: 'M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z',
        instagram: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2 0 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1018.6 12 6.6 6.6 0 0012 5.4zm0 10.9A4.3 4.3 0 1116.3 12 4.3 4.3 0 0112 16.3zm6.8-11.1a1.5 1.5 0 11-1.5-1.5 1.5 1.5 0 011.5 1.5z',
        link: 'M9.9 14.1a1 1 0 010-1.4l2.8-2.8a1 1 0 011.4 1.4l-2.8 2.8a1 1 0 01-1.4 0zm-1.5 4.3l-1.4 1.4a4.4 4.4 0 01-6.2-6.2l2.8-2.8a4.4 4.4 0 016.2 0l-1.5 1.5a2.3 2.3 0 00-3.2 0l-2.8 2.8a2.3 2.3 0 003.2 3.2l1.4-1.4a5.9 5.9 0 001.5.2zm7-12.8l-1.4 1.4a5.9 5.9 0 00-1.5-.2l1.4-1.4a4.4 4.4 0 016.2 6.2l-2.8 2.8a4.4 4.4 0 01-6.2 0l1.5-1.5a2.3 2.3 0 003.2 0l2.8-2.8a2.3 2.3 0 00-3.2-3.2z'
    };

    function icon(id) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + PATH[id] + '"/></svg>';
    }

    function styles() {
        if (document.getElementById('promo-styles')) return;
        var s = document.createElement('style');
        s.id = 'promo-styles';
        s.textContent = [
            '.promo{margin:var(--space-8,56px) auto 0;padding:22px 24px;border-radius:16px;',
            'background:var(--bg-canvas-soft,#1A1613);border:1px solid var(--border,#2C2722);text-align:center;}',
            '.promo h3{margin:0 0 6px;font-size:1rem;font-weight:600;color:var(--text-primary,#F6F2EA);}',
            '.promo p{margin:0 0 16px;font-size:.87rem;line-height:1.6;color:var(--text-muted,#837C70);}',
            '.promo-share{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;}',
            '.promo-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;',
            'border:1px solid var(--border-strong,#3C352D);background:var(--bg-card,#1E1A16);',
            'color:var(--text-secondary,#B7B0A4);font-size:.84rem;font-weight:500;font-family:inherit;',
            'text-decoration:none;cursor:pointer;transition:border-color .15s,color .15s,transform .15s;}',
            '.promo-btn:hover{border-color:var(--accent,#E8895F);color:var(--text-primary,#F6F2EA);transform:translateY(-1px);}',
            '.promo-btn svg{width:14px;height:14px;fill:currentColor;}',
            '.promo-thanks{margin:14px 0 0;font-size:.86rem;color:var(--accent-deep,#F3AE8E);}',
            '@media(max-width:640px){.promo{padding:20px 16px;}.promo-btn{padding:7px 12px;font-size:.8rem;}}'
        ].join('');
        document.head.appendChild(s);
    }

    function thank(box) {
        var msg = box.querySelector('.promo-thanks');
        if (!msg) {
            msg = document.createElement('p');
            msg.className = 'promo-thanks';
            box.appendChild(msg);
        }
        msg.textContent = t.thanks;
        try { localStorage.setItem('pdf300_shared_at', String(Date.now())); } catch (e) {}
    }

    function build() {
        if (document.querySelector('.promo')) return;
        var main = document.querySelector('main.container');
        if (!main) return;
        styles();

        var box = document.createElement('section');
        box.className = 'promo';
        box.innerHTML =
            '<h3>' + t.title + '</h3><p>' + t.sub + '</p><div class="promo-share">' +
            CHANNELS.map(function (c) {
                return '<a class="promo-btn" data-share="' + c.id + '" href="' + c.href +
                       '" target="_blank" rel="noopener">' + icon(c.id) + c.label + '</a>';
            }).join('') +
            '<button class="promo-btn" data-share="link" type="button">' + icon('link') + T.copy + '</button>' +
            '</div>';
        main.appendChild(box);

        Array.prototype.forEach.call(box.querySelectorAll('[data-share]'), function (el) {
            el.addEventListener('click', function () {
                if (el.getAttribute('data-share') === 'link') {
                    var done = function () {
                        var keep = el.innerHTML;
                        el.innerHTML = icon('link') + T.copied;
                        setTimeout(function () { el.innerHTML = keep; }, 2000);
                    };
                    if (navigator.clipboard) navigator.clipboard.writeText(CFG.url).then(done, done);
                    else done();
                }
                thank(box);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
