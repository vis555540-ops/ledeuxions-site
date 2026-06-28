/* ImgWorks — Browser-native image toolkit (8 tools)
   Pure client-side. Uses Canvas + JSZip.
*/
(function () {
    'use strict';

    // ============ Hash routing ============
    function showTool(name) {
        var hero = document.getElementById('hero');
        var grid = document.getElementById('tool-grid');
        var heads = document.querySelectorAll('.grid-section-head');
        var workspaces = document.querySelectorAll('.workspace');
        if (!name) {
            if (hero) hero.style.display = '';
            if (grid) grid.style.display = '';
            heads.forEach(function (h) { h.style.display = ''; });
            workspaces.forEach(function (w) { w.classList.remove('is-active'); });
            return;
        }
        if (hero) hero.style.display = 'none';
        if (grid) grid.style.display = 'none';
        heads.forEach(function (h) { h.style.display = 'none'; });
        workspaces.forEach(function (w) {
            w.classList.toggle('is-active', w.dataset.ws === name);
        });
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    function sync() {
        showTool((location.hash || '').replace('#', '') || null);
    }
    window.addEventListener('hashchange', sync);
    document.querySelectorAll('.ws-back-link').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState('', document.title, location.pathname + location.search);
            sync();
        });
    });
    sync();

    // ============ Helpers ============
    function $(id) { return document.getElementById(id); }

    function bindDrop(zoneId, inputId, onFiles) {
        var zone = $(zoneId), input = $(inputId);
        if (!zone || !input) return;
        zone.addEventListener('click', function () { input.click(); });
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('is-active'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('is-active'); });
        zone.addEventListener('drop', function (e) {
            e.preventDefault(); zone.classList.remove('is-active');
            onFiles(Array.from(e.dataTransfer.files));
        });
        input.addEventListener('change', function () { onFiles(Array.from(input.files)); });
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

    function isImage(f) {
        return /^image\//.test(f.type) || /\.(jpe?g|png|webp|bmp|gif|heic|heif)$/i.test(f.name);
    }

    function loadImage(file) {
        return new Promise(function (res, rej) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function () { res({ img: img, url: url }); };
            img.onerror = function (e) { URL.revokeObjectURL(url); rej(new Error('이미지 로드 실패')); };
            img.src = url;
        });
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise(function (res) { canvas.toBlob(res, type, quality); });
    }

    function baseName(name) {
        return (name || 'image').replace(/\.[^.]+$/, '');
    }

    function extOf(mime) {
        return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/bmp': 'bmp' }[mime] || 'jpg';
    }

    function renderPreviewGrid(gridEl, items, onRemove) {
        gridEl.innerHTML = '';
        items.forEach(function (it, i) {
            var card = document.createElement('div');
            card.className = 'preview-card' + (it.done ? ' done' : '');
            card.innerHTML =
                '<div class="thumb">' +
                    (it.previewUrl ? '<img src="' + it.previewUrl + '">' : '<div style="color:#837C70;">🖼</div>') +
                '</div>' +
                '<div class="meta"><div class="name"></div><div class="size"></div></div>' +
                '<div class="x" data-i="' + i + '">✕</div>';
            card.querySelector('.name').textContent = it.file.name;
            card.querySelector('.size').textContent = fmtBytes(it.file.size) + (it.outSize ? ' → ' + fmtBytes(it.outSize) : '');
            card.querySelector('.x').onclick = function (e) {
                e.stopPropagation();
                onRemove(i);
            };
            gridEl.appendChild(card);
        });
    }

    function makePreviewUrls(items) {
        items.forEach(function (it) {
            if (!it.previewUrl) it.previewUrl = URL.createObjectURL(it.file);
        });
    }

    // Generic batch processor
    // processOne(it) returns Promise resolving { blob, name }
    async function runBatch(items, processOne, gridEl, statusId, refreshFn) {
        var done = 0, errs = 0;
        for (var i = 0; i < items.length; i++) {
            if (items[i].done) { done++; continue; }
            setStatus(statusId, '처리 중… (' + (i + 1) + '/' + items.length + ') ' + items[i].file.name);
            try {
                var r = await processOne(items[i]);
                items[i].blob = r.blob;
                items[i].outName = r.name;
                items[i].outSize = r.blob.size;
                items[i].done = true;
                // Auto-download single
                if (items.length === 1) download(r.blob, r.name);
                done++;
                refreshFn();
            } catch (e) {
                console.error(e); errs++;
            }
        }
        setStatus(statusId, errs ? '완료 (오류 ' + errs + '건)' : '완료 · ' + done + '개', errs ? 'err' : 'ok');
    }

    async function zipAndDownload(items, zipName) {
        var zip = new JSZip();
        items.forEach(function (it) {
            if (it.blob && it.outName) zip.file(it.outName, it.blob);
        });
        var blob = await zip.generateAsync({ type: 'blob' });
        download(blob, zipName);
    }

    // =====================================================
    // TOOL 1: CONVERT
    // =====================================================
    (function () {
        var items = [], fmt = 'image/jpeg', quality = 0.92;
        bindDrop('cv-drop', 'cv-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('cv-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('cv-run').disabled = !items.length;
            $('cv-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('cv-fmt').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#cv-fmt button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            fmt = e.target.dataset.fmt;
            // PNG has no quality
            $('cv-quality').parentElement.style.opacity = (fmt === 'image/png') ? '.4' : '1';
        });
        $('cv-quality').addEventListener('input', function () {
            quality = parseInt(this.value, 10) / 100;
            $('cv-q-val').textContent = this.value;
        });
        $('cv-run').addEventListener('click', async function () {
            $('cv-run').disabled = true;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var c = document.createElement('canvas');
                c.width = loaded.img.naturalWidth; c.height = loaded.img.naturalHeight;
                var ctx = c.getContext('2d');
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
                ctx.drawImage(loaded.img, 0, 0);
                URL.revokeObjectURL(loaded.url);
                var blob = await canvasToBlob(c, fmt, quality);
                return { blob: blob, name: baseName(it.file.name) + '.' + extOf(fmt) };
            }, $('cv-grid'), 'cv-status', refresh);
            $('cv-run').disabled = false;
        });
        $('cv-zip').addEventListener('click', function () {
            zipAndDownload(items, 'converted.zip');
        });
    })();

    // =====================================================
    // TOOL 2: COMPRESS
    // =====================================================
    (function () {
        var items = [], quality = 0.75, fmt = 'image/jpeg';
        bindDrop('cp-drop', 'cp-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('cp-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('cp-run').disabled = !items.length;
            $('cp-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('cp-level').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#cp-level button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            var presets = { light: 88, med: 75, strong: 60, extreme: 40 };
            quality = presets[e.target.dataset.l] / 100;
            $('cp-quality').value = presets[e.target.dataset.l];
            $('cp-q-val').textContent = presets[e.target.dataset.l];
        });
        $('cp-quality').addEventListener('input', function () {
            quality = parseInt(this.value, 10) / 100;
            $('cp-q-val').textContent = this.value;
        });
        $('cp-fmt').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#cp-fmt button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            fmt = e.target.dataset.fmt;
        });
        $('cp-run').addEventListener('click', async function () {
            $('cp-run').disabled = true;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var c = document.createElement('canvas');
                c.width = loaded.img.naturalWidth; c.height = loaded.img.naturalHeight;
                var ctx = c.getContext('2d');
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
                ctx.drawImage(loaded.img, 0, 0);
                URL.revokeObjectURL(loaded.url);
                var blob = await canvasToBlob(c, fmt, quality);
                return { blob: blob, name: baseName(it.file.name) + '_compressed.' + extOf(fmt) };
            }, $('cp-grid'), 'cp-status', refresh);
            $('cp-run').disabled = false;
        });
        $('cp-zip').addEventListener('click', function () {
            zipAndDownload(items, 'compressed.zip');
        });
    })();

    // =====================================================
    // TOOL 3: RESIZE
    // =====================================================
    (function () {
        var items = [], mode = 'long', px = 1280, pct = 50, outFmt = 'keep';
        bindDrop('rs-drop', 'rs-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('rs-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('rs-run').disabled = !items.length;
            $('rs-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('rs-mode').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#rs-mode button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            mode = e.target.dataset.m;
            $('rs-px-row').classList.toggle('hidden', mode === 'percent');
            $('rs-pct-row').classList.toggle('hidden', mode !== 'percent');
        });
        $('rs-px').addEventListener('input', function () { px = parseInt(this.value, 10) || 1280; });
        $('rs-pct').addEventListener('input', function () { pct = parseInt(this.value, 10) || 50; });
        $('rs-fmt').addEventListener('change', function () { outFmt = this.value; });

        $('rs-run').addEventListener('click', async function () {
            $('rs-run').disabled = true;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var w = loaded.img.naturalWidth, h = loaded.img.naturalHeight;
                var nw, nh;
                if (mode === 'long') {
                    var s = px / Math.max(w, h);
                    nw = Math.round(w * s); nh = Math.round(h * s);
                } else if (mode === 'width') {
                    nw = px; nh = Math.round(h * (px / w));
                } else if (mode === 'height') {
                    nh = px; nw = Math.round(w * (px / h));
                } else {
                    nw = Math.round(w * pct / 100); nh = Math.round(h * pct / 100);
                }
                var c = document.createElement('canvas');
                c.width = nw; c.height = nh;
                var ctx = c.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                var fmt = outFmt === 'keep' ? (it.file.type || 'image/jpeg') : outFmt;
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, nw, nh); }
                ctx.drawImage(loaded.img, 0, 0, nw, nh);
                URL.revokeObjectURL(loaded.url);
                var blob = await canvasToBlob(c, fmt, 0.92);
                return { blob: blob, name: baseName(it.file.name) + '_' + nw + 'x' + nh + '.' + extOf(fmt) };
            }, $('rs-grid'), 'rs-status', refresh);
            $('rs-run').disabled = false;
        });
        $('rs-zip').addEventListener('click', function () { zipAndDownload(items, 'resized.zip'); });
    })();

    // =====================================================
    // TOOL 4: CROP (interactive)
    // =====================================================
    (function () {
        var state = { file: null, img: null, scale: 1, sel: null }; // sel: {x,y,w,h} in image px
        var ratio = 'free';

        bindDrop('cr-drop', 'cr-file', async function (files) {
            if (!files[0] || !isImage(files[0])) return;
            state.file = files[0];
            var loaded = await loadImage(files[0]);
            state.img = loaded.img;
            $('cr-stage').hidden = false;
            renderCanvas();
            state.sel = null;
            redrawOverlay();
            $('cr-run').disabled = true;
            $('cr-reset').disabled = true;
            setStatus('cr-status', loaded.img.naturalWidth + ' × ' + loaded.img.naturalHeight + 'px', 'ok');
        });

        function renderCanvas() {
            var c = $('cr-canvas');
            var maxW = 600;
            var s = Math.min(1, maxW / state.img.naturalWidth);
            state.scale = s;
            c.width = state.img.naturalWidth * s;
            c.height = state.img.naturalHeight * s;
            c.getContext('2d').drawImage(state.img, 0, 0, c.width, c.height);
        }

        function redrawOverlay() {
            var ov = $('cr-overlay');
            var c = $('cr-canvas');
            ov.style.width = c.width + 'px';
            ov.style.height = c.height + 'px';
            ov.innerHTML = '';
            if (!state.sel) {
                $('cr-info').textContent = '드래그하여 선택';
                return;
            }
            var sel = state.sel;
            $('cr-info').textContent = Math.round(sel.w) + ' × ' + Math.round(sel.h) + 'px';
            var box = document.createElement('div');
            box.style.cssText =
                'position:absolute;border:2px dashed #E8895F;background:rgba(232,137,95,0.18);box-sizing:border-box;' +
                'left:' + (sel.x * state.scale) + 'px;' +
                'top:' + (sel.y * state.scale) + 'px;' +
                'width:' + (sel.w * state.scale) + 'px;' +
                'height:' + (sel.h * state.scale) + 'px;';
            ov.appendChild(box);
        }

        $('cr-ratio').addEventListener('change', function () {
            ratio = this.value;
            if (state.sel) constrainSel();
            redrawOverlay();
        });

        function constrainSel() {
            if (ratio === 'free' || !state.sel) return;
            var parts = ratio.split(':').map(function (s) { return parseInt(s, 10); });
            var r = parts[0] / parts[1];
            // Keep width, adjust height by ratio
            state.sel.h = state.sel.w / r;
            if (state.sel.y + state.sel.h > state.img.naturalHeight) {
                state.sel.h = state.img.naturalHeight - state.sel.y;
                state.sel.w = state.sel.h * r;
            }
        }

        (function () {
            var ov = $('cr-overlay');
            var startX, startY;
            ov.addEventListener('mousedown', function (e) {
                if (!state.img) return;
                var rect = ov.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                function onMove(ev) {
                    var rect2 = ov.getBoundingClientRect();
                    var cx = ev.clientX - rect2.left, cy = ev.clientY - rect2.top;
                    var x = Math.min(startX, cx), y = Math.min(startY, cy);
                    var w = Math.abs(cx - startX), h = Math.abs(cy - startY);
                    state.sel = {
                        x: x / state.scale, y: y / state.scale,
                        w: w / state.scale, h: h / state.scale
                    };
                    if (ratio !== 'free') constrainSel();
                    redrawOverlay();
                }
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (state.sel && state.sel.w > 5 && state.sel.h > 5) {
                        $('cr-run').disabled = false;
                        $('cr-reset').disabled = false;
                    } else {
                        state.sel = null; redrawOverlay();
                    }
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        })();

        $('cr-reset').addEventListener('click', function () {
            state.sel = null;
            $('cr-run').disabled = true;
            $('cr-reset').disabled = true;
            redrawOverlay();
        });

        $('cr-run').addEventListener('click', async function () {
            if (!state.sel) return;
            setStatus('cr-status', '자르는 중…');
            var c = document.createElement('canvas');
            c.width = Math.round(state.sel.w); c.height = Math.round(state.sel.h);
            var ctx = c.getContext('2d');
            ctx.drawImage(state.img,
                Math.round(state.sel.x), Math.round(state.sel.y), Math.round(state.sel.w), Math.round(state.sel.h),
                0, 0, c.width, c.height);
            var fmt = state.file.type || 'image/jpeg';
            if (fmt === 'image/jpeg') {
                // Re-paint white bg under (in case of transparency)
                var c2 = document.createElement('canvas');
                c2.width = c.width; c2.height = c.height;
                var ctx2 = c2.getContext('2d');
                ctx2.fillStyle = '#fff'; ctx2.fillRect(0, 0, c.width, c.height);
                ctx2.drawImage(c, 0, 0);
                var blob = await canvasToBlob(c2, fmt, 0.92);
                download(blob, baseName(state.file.name) + '_cropped.' + extOf(fmt));
            } else {
                var blob2 = await canvasToBlob(c, fmt, 0.92);
                download(blob2, baseName(state.file.name) + '_cropped.' + extOf(fmt));
            }
            setStatus('cr-status', '완료 · ' + c.width + ' × ' + c.height + 'px', 'ok');
        });
    })();

    // =====================================================
    // TOOL 5: ROTATE / FLIP
    // =====================================================
    (function () {
        var items = [], deg = 0, flip = 'none';
        bindDrop('rt-drop', 'rt-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('rt-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('rt-run').disabled = !items.length;
            $('rt-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('rt-deg').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#rt-deg button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            deg = parseInt(e.target.dataset.d, 10);
        });
        $('rt-flip').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#rt-flip button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            flip = e.target.dataset.f;
        });
        $('rt-run').addEventListener('click', async function () {
            $('rt-run').disabled = true;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var iw = loaded.img.naturalWidth, ih = loaded.img.naturalHeight;
                var swap = (deg === 90 || deg === 270);
                var cw = swap ? ih : iw, ch = swap ? iw : ih;
                var c = document.createElement('canvas');
                c.width = cw; c.height = ch;
                var ctx = c.getContext('2d');
                var fmt = it.file.type || 'image/jpeg';
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); }
                ctx.save();
                ctx.translate(cw / 2, ch / 2);
                ctx.rotate(deg * Math.PI / 180);
                var sx = (flip === 'h') ? -1 : 1;
                var sy = (flip === 'v') ? -1 : 1;
                ctx.scale(sx, sy);
                ctx.drawImage(loaded.img, -iw / 2, -ih / 2);
                ctx.restore();
                URL.revokeObjectURL(loaded.url);
                var blob = await canvasToBlob(c, fmt, 0.92);
                return { blob: blob, name: baseName(it.file.name) + '_rot.' + extOf(fmt) };
            }, $('rt-grid'), 'rt-status', refresh);
            $('rt-run').disabled = false;
        });
        $('rt-zip').addEventListener('click', function () { zipAndDownload(items, 'rotated.zip'); });
    })();

    // =====================================================
    // TOOL 6: WATERMARK
    // =====================================================
    (function () {
        var items = [], pos = 'br';
        bindDrop('wm-drop', 'wm-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('wm-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('wm-run').disabled = !items.length;
            $('wm-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('wm-pos').addEventListener('click', function (e) {
            if (e.target.tagName !== 'BUTTON') return;
            document.querySelectorAll('#wm-pos button').forEach(function (b) { b.classList.remove('on'); });
            e.target.classList.add('on');
            pos = e.target.dataset.p;
        });
        $('wm-run').addEventListener('click', async function () {
            $('wm-run').disabled = true;
            var text = $('wm-text').value || '';
            var sizePct = parseInt($('wm-size').value, 10) || 4;
            var opacity = parseInt($('wm-opacity').value, 10) / 100;
            var color = $('wm-color').value;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var w = loaded.img.naturalWidth, h = loaded.img.naturalHeight;
                var c = document.createElement('canvas');
                c.width = w; c.height = h;
                var ctx = c.getContext('2d');
                var fmt = it.file.type || 'image/jpeg';
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
                ctx.drawImage(loaded.img, 0, 0);
                URL.revokeObjectURL(loaded.url);
                // text
                var fontSize = Math.max(12, Math.round(Math.min(w, h) * sizePct / 100));
                ctx.font = '700 ' + fontSize + 'px Pretendard, sans-serif';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = color;
                ctx.globalAlpha = opacity;
                ctx.shadowColor = 'rgba(0,0,0,.4)';
                ctx.shadowBlur = Math.max(1, fontSize * 0.08);
                var pad = fontSize;
                var tw = ctx.measureText(text).width;
                var x, y;
                if (pos.endsWith('l')) { ctx.textAlign = 'left'; x = pad; }
                else if (pos.endsWith('r')) { ctx.textAlign = 'right'; x = w - pad; }
                else { ctx.textAlign = 'center'; x = w / 2; }
                if (pos.startsWith('t')) y = pad + fontSize / 2;
                else if (pos === 'center') y = h / 2;
                else y = h - pad - fontSize / 2;
                ctx.fillText(text, x, y);
                var blob = await canvasToBlob(c, fmt, 0.92);
                return { blob: blob, name: baseName(it.file.name) + '_wm.' + extOf(fmt) };
            }, $('wm-grid'), 'wm-status', refresh);
            $('wm-run').disabled = false;
        });
        $('wm-zip').addEventListener('click', function () { zipAndDownload(items, 'watermarked.zip'); });
    })();

    // =====================================================
    // TOOL 7: FILTER
    // =====================================================
    (function () {
        var state = { file: null, img: null };
        var presets = {
            none: '',
            gray: 'grayscale(100%)',
            sepia: 'sepia(80%)',
            vivid: 'saturate(150%) contrast(110%)',
            vintage: 'sepia(40%) contrast(95%) saturate(85%) brightness(105%)',
            cool: 'hue-rotate(-12deg) saturate(110%)',
            warm: 'hue-rotate(8deg) saturate(110%) brightness(105%)'
        };

        bindDrop('ft-drop', 'ft-file', async function (files) {
            if (!files[0] || !isImage(files[0])) return;
            state.file = files[0];
            var loaded = await loadImage(files[0]);
            state.img = loaded.img;
            $('ft-stage').hidden = false;
            paint();
            $('ft-run').disabled = false;
        });

        function paint() {
            if (!state.img) return;
            var c = $('ft-canvas');
            var maxW = 600;
            var s = Math.min(1, maxW / state.img.naturalWidth);
            c.width = state.img.naturalWidth * s;
            c.height = state.img.naturalHeight * s;
            var ctx = c.getContext('2d');
            var preset = presets[$('ft-preset').value] || '';
            var b = $('ft-bright').value, ctr = $('ft-contrast').value, sa = $('ft-sat').value, bl = $('ft-blur').value;
            ctx.filter = (preset ? preset + ' ' : '') +
                'brightness(' + b + '%) contrast(' + ctr + '%) saturate(' + sa + '%) blur(' + bl + 'px)';
            ctx.drawImage(state.img, 0, 0, c.width, c.height);
        }
        ['ft-preset','ft-bright','ft-contrast','ft-sat','ft-blur'].forEach(function (id) {
            $(id).addEventListener('input', function () {
                $('ft-b-val').textContent = $('ft-bright').value + '%';
                $('ft-c-val').textContent = $('ft-contrast').value + '%';
                $('ft-s-val').textContent = $('ft-sat').value + '%';
                $('ft-bl-val').textContent = $('ft-blur').value + 'px';
                paint();
            });
        });
        $('ft-reset').addEventListener('click', function () {
            $('ft-preset').value = 'none';
            $('ft-bright').value = 100; $('ft-contrast').value = 100;
            $('ft-sat').value = 100; $('ft-blur').value = 0;
            $('ft-b-val').textContent = '100%'; $('ft-c-val').textContent = '100%';
            $('ft-s-val').textContent = '100%'; $('ft-bl-val').textContent = '0px';
            paint();
        });
        $('ft-run').addEventListener('click', async function () {
            if (!state.img) return;
            setStatus('ft-status', '저장 중…');
            // Render at full resolution
            var c = document.createElement('canvas');
            c.width = state.img.naturalWidth; c.height = state.img.naturalHeight;
            var ctx = c.getContext('2d');
            var preset = presets[$('ft-preset').value] || '';
            ctx.filter = (preset ? preset + ' ' : '') +
                'brightness(' + $('ft-bright').value + '%) contrast(' + $('ft-contrast').value +
                '%) saturate(' + $('ft-sat').value + '%) blur(' + $('ft-blur').value + 'px)';
            var fmt = state.file.type || 'image/jpeg';
            if (fmt === 'image/jpeg') {
                ctx.filter = 'none';
                ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
                ctx.filter = (preset ? preset + ' ' : '') +
                    'brightness(' + $('ft-bright').value + '%) contrast(' + $('ft-contrast').value +
                    '%) saturate(' + $('ft-sat').value + '%) blur(' + $('ft-blur').value + 'px)';
            }
            ctx.drawImage(state.img, 0, 0);
            var blob = await canvasToBlob(c, fmt, 0.92);
            download(blob, baseName(state.file.name) + '_filtered.' + extOf(fmt));
            setStatus('ft-status', '완료 · ' + fmtBytes(blob.size), 'ok');
        });
    })();

    // =====================================================
    // TOOL 8: EXIF STRIP
    // =====================================================
    (function () {
        var items = [];
        bindDrop('ex-drop', 'ex-files', function (files) {
            files.filter(isImage).forEach(function (f) { items.push({ file: f, done: false }); });
            makePreviewUrls(items);
            refresh();
        });
        function refresh() {
            renderPreviewGrid($('ex-grid'), items, function (i) { items.splice(i, 1); refresh(); });
            $('ex-run').disabled = !items.length;
            $('ex-zip').disabled = !items.some(function (x) { return x.done; });
        }
        $('ex-run').addEventListener('click', async function () {
            $('ex-run').disabled = true;
            var fmtSel = $('ex-fmt').value;
            await runBatch(items, async function (it) {
                var loaded = await loadImage(it.file);
                var c = document.createElement('canvas');
                c.width = loaded.img.naturalWidth; c.height = loaded.img.naturalHeight;
                var ctx = c.getContext('2d');
                var fmt = fmtSel === 'keep' ? (it.file.type || 'image/jpeg') : fmtSel;
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
                ctx.drawImage(loaded.img, 0, 0);
                URL.revokeObjectURL(loaded.url);
                // Canvas re-encode strips all EXIF/XMP/IPTC metadata
                var blob = await canvasToBlob(c, fmt, 0.92);
                return { blob: blob, name: baseName(it.file.name) + '_clean.' + extOf(fmt) };
            }, $('ex-grid'), 'ex-status', refresh);
            $('ex-run').disabled = false;
        });
        $('ex-zip').addEventListener('click', function () { zipAndDownload(items, 'clean.zip'); });
    })();
})();
