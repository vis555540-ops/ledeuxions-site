/* PDF300 — Searchable PDF (OCR text layer)
 *
 * 경쟁사(iLovePDF·Smallpdf)엔 있고 우리만 없던 기능.
 * 기존 OCR 패널은 '글자만' 뽑아준다. 이건 스캔본 겉모습은 그대로 두고
 * 보이지 않는 글자층을 입혀 검색·복사가 되는 PDF 를 돌려준다.
 *
 * pdf300-server.js 는 건드리지 않는다. 같은 파일 입력(#srv-ocr-file)을 재사용해
 * 버튼 하나만 얹는다 — 그래야 원본 파일이 갱신돼도 충돌이 없다.
 */
(function () {
    'use strict';

    var BASE = 'https://pdf.ledeuxions.com';
    var MAX_MB = 30;

    function $(id) { return document.getElementById(id); }

    function ready(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        var runBtn = $('srv-ocr-run');
        var input = $('srv-ocr-file');
        if (!runBtn || !input) return;

        var btn = document.createElement('button');
        btn.className = 'btn btn-secondary btn-block';
        btn.id = 'srv-ocr-searchable';
        btn.style.marginTop = 'var(--space-3)';
        btn.textContent = 'Download searchable PDF';
        btn.disabled = true;
        runBtn.parentNode.insertBefore(btn, runBtn.nextSibling);

        var note = document.createElement('p');
        note.className = 'help';
        note.style.marginTop = 'var(--space-2)';
        note.innerHTML = 'Keeps the page exactly as it looks and adds an invisible text layer, ' +
                         'so the scan becomes searchable. Up to ' + MAX_MB + ' MB and 30 pages.';
        btn.parentNode.insertBefore(note, btn.nextSibling);

        input.addEventListener('change', function () {
            btn.disabled = !input.files || !input.files[0];
        });

        function status(msg, kind) {
            var el = $('srv-ocr-status');
            if (!el) return;
            el.textContent = msg; el.hidden = !msg;
            el.className = 'status' + (kind ? ' ' + kind : '');
        }

        btn.addEventListener('click', async function () {
            var file = input.files && input.files[0];
            if (!file) return;
            if (file.size > MAX_MB * 1024 * 1024) {
                status('That file is larger than ' + MAX_MB + ' MB. OCR is heavy — please split it first.', 'err');
                return;
            }
            var lang = ($('srv-ocr-lang') || {}).value || 'eng';
            btn.disabled = true;
            status('Building a searchable PDF on the server… this takes a few seconds per page.');
            try {
                var fd = new FormData();
                fd.append('file', file, file.name);
                fd.append('lang', lang);
                var res = await fetch(BASE + '/ocr-pdf', { method: 'POST', body: fd });
                if (!res.ok) {
                    var detail = '';
                    try { detail = (await res.text()).slice(0, 160); } catch (e) { }
                    throw new Error('Server error ' + res.status + (detail ? ' · ' + detail : ''));
                }
                var blob = await res.blob();
                var name = (file.name || 'document.pdf').replace(/\.[^.]+$/, '') + '_searchable.pdf';
                if (window.LD && LD.download) LD.download(blob, name);
                else {
                    var url = URL.createObjectURL(blob), a = document.createElement('a');
                    a.href = url; a.download = name; document.body.appendChild(a); a.click();
                    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 100);
                }
                status('Done · searchable PDF saved', 'ok');
            } catch (e) {
                status('Error: ' + e.message, 'err');
            } finally {
                btn.disabled = false;
            }
        });
    });
})();
