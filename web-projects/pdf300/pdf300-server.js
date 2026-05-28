/* PDF300 — Server advanced tools
   Connects to https://pdf.ledeuxions.com (CORS enabled).
   Local browser tools (pdf300.js) keep working regardless of server status.
*/
(function () {
    'use strict';

    var BASE = 'https://pdf.ledeuxions.com';
    var serverOnline = false;

    // ---------- small helpers (this IIFE is independent of pdf300.js) ----------
    function $(id) { return document.getElementById(id); }

    function bindDrop(zoneId, inputId, onFile) {
        var zone = $(zoneId), input = $(inputId);
        if (!zone || !input) return;
        zone.addEventListener('click', function () { input.click(); });
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('is-active'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('is-active'); });
        zone.addEventListener('drop', function (e) {
            e.preventDefault(); zone.classList.remove('is-active');
            if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
        });
        input.addEventListener('change', function () { if (input.files[0]) onFile(input.files[0]); });
    }

    function setStatus(id, msg, kind) {
        var el = $(id);
        if (!el) return;
        el.textContent = msg;
        el.hidden = !msg;
        el.className = 'status' + (kind ? ' ' + kind : '');
    }

    function fmtBytes(b) {
        return (window.LD && LD.formatBytes) ? LD.formatBytes(b) : (b + ' B');
    }
    function download(blob, name) {
        if (window.LD && LD.download) { LD.download(blob, name); return; }
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 100);
    }

    // Pull a filename out of Content-Disposition, else fall back
    function filenameFromResponse(res, fallback) {
        var cd = res.headers.get('Content-Disposition') || '';
        var m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)/i.exec(cd);
        if (m && m[1]) { try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; } }
        return fallback;
    }

    async function postFile(endpoint, formData, expect) {
        var res = await fetch(BASE + endpoint, { method: 'POST', body: formData });
        if (!res.ok) {
            var detail = '';
            try { detail = (await res.text()).slice(0, 200); } catch (e) {}
            throw new Error('서버 오류 ' + res.status + (detail ? ' · ' + detail : ''));
        }
        if (expect === 'text') return { text: await res.text(), res: res };
        return { blob: await res.blob(), res: res };
    }

    function baseName(name) { return (name || 'document.pdf').replace(/\.[^.]+$/, ''); }

    // ---------- Health check ----------
    function applyServerState(online) {
        serverOnline = online;
        var badge = $('server-status');
        var grid = $('server-grid');
        var note = $('server-offline-note');
        if (badge) {
            badge.setAttribute('data-state', online ? 'online' : 'offline');
            badge.querySelector('.txt').textContent = online ? '서버 연결됨' : '서버 오프라인';
        }
        if (grid) grid.classList.toggle('offline', !online);
        if (note) note.hidden = online;
    }

    function checkHealth() {
        var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, 6000) : null;
        fetch(BASE + '/health', { method: 'GET', signal: controller ? controller.signal : undefined })
            .then(function (res) { if (timer) clearTimeout(timer); applyServerState(res.ok); })
            .catch(function () { if (timer) clearTimeout(timer); applyServerState(false); });
    }

    // ---------- Generic single-file tool wiring ----------
    // opts: { key, endpoint, outName, expect, extraFields(file)->{}, onText }
    function wireTool(opts) {
        var state = { file: null };
        var dropId = opts.key + '-drop';
        var fileId = opts.key + '-file';
        var infoId = opts.key + '-info';
        var runId = opts.key + '-run';
        var statusId = opts.key + '-status';

        bindDrop(dropId, fileId, function (file) {
            state.file = file;
            setStatus(infoId, file.name + ' · ' + fmtBytes(file.size), 'ok');
            if ($(runId)) $(runId).disabled = false;
        });

        var runBtn = $(runId);
        if (!runBtn) return state;
        runBtn.addEventListener('click', async function () {
            if (!state.file) return;
            if (!serverOnline) { setStatus(statusId, '서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.', 'err'); return; }
            // field validation
            if (opts.validate) {
                var v = opts.validate();
                if (v) { setStatus(statusId, v, 'err'); return; }
            }
            runBtn.disabled = true;
            setStatus(statusId, '서버에서 처리 중…');
            try {
                var fd = new FormData();
                fd.append('file', state.file, state.file.name);
                if (opts.extraFields) {
                    var fields = opts.extraFields();
                    Object.keys(fields).forEach(function (k) { fd.append(k, fields[k]); });
                }
                var result = await postFile(opts.endpoint, fd, opts.expect);
                if (opts.expect === 'text') {
                    opts.onText(result.text);
                    setStatus(statusId, '완료 · ' + result.text.length.toLocaleString() + '자 인식', 'ok');
                } else {
                    var fname = filenameFromResponse(result.res, opts.outName(state.file));
                    download(result.blob, fname);
                    setStatus(statusId, '완료 · ' + fmtBytes(result.blob.size) + ' 저장', 'ok');
                }
            } catch (e) {
                console.error(e);
                setStatus(statusId, '오류: ' + e.message, 'err');
            } finally {
                runBtn.disabled = false;
            }
        });
        return state;
    }

    // ---------- Wire each server tool ----------

    // Compress
    wireTool({
        key: 'srv-compress', endpoint: '/compress', expect: 'blob',
        outName: function (f) { return baseName(f.name) + '_compressed.pdf'; }
    });

    // OCR (text response)
    (function () {
        var langSel = $('srv-ocr-lang');
        var lastText = '';
        var st = wireTool({
            key: 'srv-ocr', endpoint: '/ocr', expect: 'text',
            extraFields: function () { return { lang: langSel ? langSel.value : 'kor+eng' }; },
            onText: function (text) {
                lastText = text;
                var out = $('srv-ocr-output');
                if (out) out.value = text;
                $('srv-ocr-copy').disabled = false;
                $('srv-ocr-download').disabled = false;
            }
        });
        var copyBtn = $('srv-ocr-copy');
        if (copyBtn) copyBtn.addEventListener('click', function () {
            if (!lastText) return;
            navigator.clipboard.writeText(lastText).then(function () {
                if (window.LD && LD.toast) LD.toast('클립보드에 복사되었습니다.');
            }, function () {
                var out = $('srv-ocr-output'); out.select(); document.execCommand('copy');
            });
        });
        var dlBtn = $('srv-ocr-download');
        if (dlBtn) dlBtn.addEventListener('click', function () {
            if (!lastText) return;
            download(new Blob([lastText], { type: 'text/plain;charset=utf-8' }),
                (st.file ? baseName(st.file.name) : 'ocr') + '.txt');
        });
    })();

    // Protect
    (function () {
        var pw = $('srv-protect-pw');
        wireTool({
            key: 'srv-protect', endpoint: '/protect', expect: 'blob',
            validate: function () { return (pw && pw.value) ? '' : '비밀번호를 입력하세요.'; },
            extraFields: function () { return { password: pw ? pw.value : '' }; },
            outName: function (f) { return baseName(f.name) + '_protected.pdf'; }
        });
    })();

    // Unlock
    (function () {
        var pw = $('srv-unlock-pw');
        wireTool({
            key: 'srv-unlock', endpoint: '/unlock', expect: 'blob',
            validate: function () { return (pw && pw.value) ? '' : '비밀번호를 입력하세요.'; },
            extraFields: function () { return { password: pw ? pw.value : '' }; },
            outName: function (f) { return baseName(f.name) + '_unlocked.pdf'; }
        });
    })();

    // Strip metadata
    wireTool({
        key: 'srv-strip', endpoint: '/strip-metadata', expect: 'blob',
        outName: function (f) { return baseName(f.name) + '_clean.pdf'; }
    });

    // Repair
    wireTool({
        key: 'srv-repair', endpoint: '/repair', expect: 'blob',
        outName: function (f) { return baseName(f.name) + '_repaired.pdf'; }
    });

    // Page numbers
    (function () {
        var pos = $('srv-numbers-pos'), fmt = $('srv-numbers-fmt');
        wireTool({
            key: 'srv-numbers', endpoint: '/add-page-numbers', expect: 'blob',
            extraFields: function () { return { position: pos ? pos.value : 'bottom-center', fmt: fmt ? fmt.value : '{n}' }; },
            outName: function (f) { return baseName(f.name) + '_numbered.pdf'; }
        });
    })();

    // N-up
    (function () {
        var rows = $('srv-nup-rows'), cols = $('srv-nup-cols');
        wireTool({
            key: 'srv-nup', endpoint: '/n-up', expect: 'blob',
            validate: function () {
                var r = parseInt(rows.value, 10), c = parseInt(cols.value, 10);
                if (!r || !c || r < 1 || c < 1) return '행과 열은 1 이상이어야 합니다.';
                return '';
            },
            extraFields: function () { return { rows: rows.value, cols: cols.value }; },
            outName: function (f) { return baseName(f.name) + '_nup.pdf'; }
        });
    })();

    // Office → PDF
    wireTool({
        key: 'srv-office', endpoint: '/office-to-pdf', expect: 'blob',
        outName: function (f) { return baseName(f.name) + '.pdf'; }
    });

    // Watermark
    (function () {
        var txt = $('srv-watermark-text');
        wireTool({
            key: 'srv-watermark', endpoint: '/watermark', expect: 'blob',
            validate: function () { return (txt && txt.value) ? '' : '워터마크 텍스트를 입력하세요.'; },
            extraFields: function () { return { watermark: txt ? txt.value : '' }; },
            outName: function (f) { return baseName(f.name) + '_watermarked.pdf'; }
        });
    })();

    // Kick off health check
    checkHealth();
})();
