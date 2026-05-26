/* Shared site utilities — LeDeuxions */
(function () {
    'use strict';

    // Mobile nav toggle
    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.querySelector('[data-nav-toggle]');
        var menu = document.querySelector('[data-nav-menu]');
        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                menu.classList.toggle('open');
            });
        }

        // Mark active nav link based on path
        var path = window.location.pathname;
        document.querySelectorAll('[data-nav-link]').forEach(function (el) {
            var href = el.getAttribute('href') || '';
            if (href === '/' && (path === '/' || path === '/index.html')) {
                el.classList.add('active');
            } else if (href !== '/' && path.indexOf(href) === 0) {
                el.classList.add('active');
            }
        });
    });

    // Helpers exposed on window.LD
    window.LD = {
        formatBytes: function (bytes, decimals) {
            if (!+bytes) return '0 B';
            var k = 1024, dm = decimals || 1, sizes = ['B', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },
        download: function (blob, filename) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        },
        toast: function (msg, type) {
            var t = document.createElement('div');
            t.textContent = msg;
            t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:' +
                (type === 'error' ? '#8B3A1C' : '#1F1E1B') + ';color:#FAF9F5;padding:12px 20px;border-radius:10px;' +
                'font-size:.92rem;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;transition:opacity .25s';
            document.body.appendChild(t);
            requestAnimationFrame(function () { t.style.opacity = '1'; });
            setTimeout(function () {
                t.style.opacity = '0';
                setTimeout(function () { t.remove(); }, 300);
            }, 2400);
        }
    };
})();
