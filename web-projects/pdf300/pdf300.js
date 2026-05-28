/* PDF300 v2 — 14-tool PDF suite, fully client-side
   Libs: pdf-lib, pdfjs, fontkit (Korean fonts), JSZip
*/
(function () {
    'use strict';

    var PDFDocument = PDFLib.PDFDocument;
    var degrees = PDFLib.degrees;
    var rgb = PDFLib.rgb;
    var StandardFonts = PDFLib.StandardFonts;

    var MM_PER_PT = 0.352778;
    var PT_PER_MM = 2.83465;

    // ==========================================================
    // Tool routing (hash-based)
    // ==========================================================
    function showTool(name) {
        var hero = document.getElementById('hero');
        var workspaces = document.querySelectorAll('.workspace');
        // Everything that belongs to the "home" view (hidden while a tool is open)
        var homeEls = [
            document.getElementById('hero'),
            document.getElementById('tool-grid'),
            document.getElementById('server-grid')
        ].concat(
            Array.prototype.slice.call(document.querySelectorAll('.grid-section-head, .server-head'))
        );
        var offlineNote = document.getElementById('server-offline-note');

        if (!name) {
            homeEls.forEach(function (el) { if (el) el.style.display = ''; });
            // offline note visibility is controlled by the server module; restore if it was meant to show
            if (offlineNote) offlineNote.style.display = '';
            workspaces.forEach(function (w) { w.classList.remove('is-active'); });
            return;
        }
        homeEls.forEach(function (el) { if (el) el.style.display = 'none'; });
        if (offlineNote) offlineNote.style.display = 'none';
        workspaces.forEach(function (w) {
            w.classList.toggle('is-active', w.dataset.ws === name);
        });
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    function syncTool() {
        var hash = (location.hash || '').replace('#', '');
        showTool(hash || null);
    }
    window.addEventListener('hashchange', syncTool);
    document.querySelectorAll('.ws-back-link').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            history.pushState('', document.title, location.pathname + location.search);
            syncTool();
        });
    });
    syncTool();

    // ==========================================================
    // Common helpers
    // ==========================================================
    function bindDrop(zoneId, inputId, onFiles) {
        var zone = document.getElementById(zoneId);
        var input = document.getElementById(inputId);
        if (!zone || !input) return;
        zone.addEventListener('click', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
            input.click();
        });
        zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('is-active'); });
        zone.addEventListener('dragleave', function () { zone.classList.remove('is-active'); });
        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            zone.classList.remove('is-active');
            onFiles(Array.from(e.dataTransfer.files));
        });
        input.addEventListener('change', function () { onFiles(Array.from(input.files)); });
    }

    function setStatus(id, msg, kind) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = msg;
        el.hidden = !msg;
        el.className = 'status' + (kind ? ' ' + kind : '');
    }

    function readArrayBuffer(file) {
        return new Promise(function (res, rej) {
            var r = new FileReader();
            r.onload = function () { res(r.result); };
            r.onerror = rej;
            r.readAsArrayBuffer(file);
        });
    }

    function hexToRgb(hex) {
        var r = parseInt(hex.slice(1, 3), 16) / 255;
        var g = parseInt(hex.slice(3, 5), 16) / 255;
        var b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
    }

    function renderFileList(arr, listEl, onRemove, onReorder) {
        listEl.innerHTML = '';
        arr.forEach(function (f, i) {
            var li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML =
                '<div class="file-item-icon">' + (i + 1) + '</div>' +
                '<div class="file-item-body"><div class="file-item-name"></div><div class="file-item-meta"></div></div>' +
                '<div class="file-item-actions">' +
                '<button class="icon-btn" data-up title="위로">▲</button>' +
                '<button class="icon-btn" data-down title="아래로">▼</button>' +
                '<button class="icon-btn" data-rm title="제거">✕</button>' +
                '</div>';
            li.querySelector('.file-item-name').textContent = f.name;
            li.querySelector('.file-item-meta').textContent = LD.formatBytes(f.size);
            li.querySelector('[data-rm]').onclick = function () { onRemove(i); };
            li.querySelector('[data-up]').onclick = function () { if (i > 0) onReorder(i, i - 1); };
            li.querySelector('[data-down]').onclick = function () { if (i < arr.length - 1) onReorder(i, i + 1); };
            listEl.appendChild(li);
        });
    }

    function parseRanges(text, max) {
        var out = [];
        text.split(',').forEach(function (chunk) {
            chunk = chunk.trim();
            if (!chunk) return;
            if (chunk.indexOf('-') > -1) {
                var parts = chunk.split('-').map(function (s) { return parseInt(s.trim(), 10); });
                var a = parts[0], b = parts[1];
                if (a >= 1 && b >= a && b <= max) {
                    var r = [];
                    for (var i = a; i <= b; i++) r.push(i - 1);
                    out.push(r);
                }
            } else {
                var n = parseInt(chunk, 10);
                if (n >= 1 && n <= max) out.push([n - 1]);
            }
        });
        return out;
    }

    // Render PDF page to canvas via pdf.js
    async function renderPdfPage(pdfDoc, pageNum, scale) {
        var page = await pdfDoc.getPage(pageNum);
        var vp = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        return { canvas: canvas, vp: vp };
    }

    // Korean-capable font (cached, loaded on demand)
    var cachedKoFont = null;
    async function embedKoreanFont(doc) {
        if (!doc.registerFontkit) doc.registerFontkit(fontkit);
        if (!cachedKoFont) {
            var fontUrl = 'https://cdn.jsdelivr.net/gh/fonts-archive/NanumGothic/NanumGothicBold.ttf';
            try {
                var res = await fetch(fontUrl);
                if (!res.ok) throw new Error('font fetch failed');
                cachedKoFont = await res.arrayBuffer();
            } catch (e) {
                console.warn('Korean font load failed, falling back to Helvetica', e);
                return null;
            }
        }
        return await doc.embedFont(cachedKoFont);
    }

    // =====================================================
    // TOOL 1: MERGE
    // =====================================================
    var mergeFiles = [];
    bindDrop('merge-drop', 'merge-files', function (files) {
        mergeFiles = mergeFiles.concat(files.filter(function (f) { return f.type === 'application/pdf'; }));
        renderFileList(mergeFiles, document.getElementById('merge-list'),
            function (i) { mergeFiles.splice(i, 1); refreshMerge(); },
            function (a, b) { var x = mergeFiles.splice(a, 1)[0]; mergeFiles.splice(b, 0, x); refreshMerge(); });
        refreshMerge();
    });
    function refreshMerge() {
        renderFileList(mergeFiles, document.getElementById('merge-list'),
            function (i) { mergeFiles.splice(i, 1); refreshMerge(); },
            function (a, b) { var x = mergeFiles.splice(a, 1)[0]; mergeFiles.splice(b, 0, x); refreshMerge(); });
        document.getElementById('merge-run').disabled = mergeFiles.length < 1;
    }
    document.getElementById('merge-run').addEventListener('click', async function () {
        setStatus('merge-status', '처리 중…');
        try {
            var out = await PDFDocument.create();
            for (var i = 0; i < mergeFiles.length; i++) {
                var buf = await readArrayBuffer(mergeFiles[i]);
                var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
                var pages = await out.copyPages(doc, doc.getPageIndices());
                pages.forEach(function (p) { out.addPage(p); });
            }
            var bytes = await out.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('merge-name').value || 'merged.pdf');
            setStatus('merge-status', '완료 · ' + LD.formatBytes(bytes.byteLength) + ' 저장', 'ok');
        } catch (e) { setStatus('merge-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 2: SPLIT
    // =====================================================
    var splitState = { file: null, pageCount: 0 };
    bindDrop('split-drop', 'split-file', async function (files) {
        if (!files[0]) return;
        splitState.file = files[0];
        var buf = await readArrayBuffer(files[0]);
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        splitState.pageCount = doc.getPageCount();
        setStatus('split-info', files[0].name + ' · ' + splitState.pageCount + '페이지', 'ok');
        document.getElementById('split-range').placeholder = '예: 1-' + splitState.pageCount;
        document.getElementById('split-run').disabled = false;
    });
    document.getElementById('split-mode').addEventListener('change', function () {
        document.getElementById('split-range-row').classList.toggle('hidden', this.value !== 'range');
        document.getElementById('split-every-row').classList.toggle('hidden', this.value !== 'every');
    });
    document.getElementById('split-run').addEventListener('click', async function () {
        if (!splitState.file) return;
        setStatus('split-status', '분할 중…');
        try {
            var buf = await readArrayBuffer(splitState.file);
            var src = await PDFDocument.load(buf, { ignoreEncryption: true });
            var mode = document.getElementById('split-mode').value;
            var groups = [];
            if (mode === 'range') {
                groups = parseRanges(document.getElementById('split-range').value, splitState.pageCount);
                if (!groups.length) throw new Error('유효한 범위가 없습니다.');
            } else if (mode === 'each') {
                for (var i = 0; i < splitState.pageCount; i++) groups.push([i]);
            } else {
                var n = Math.max(1, parseInt(document.getElementById('split-every').value, 10) || 1);
                for (var s = 0; s < splitState.pageCount; s += n) {
                    var g = [];
                    for (var j = s; j < Math.min(s + n, splitState.pageCount); j++) g.push(j);
                    groups.push(g);
                }
            }
            var zip = new JSZip();
            var baseName = splitState.file.name.replace(/\.pdf$/i, '');
            for (var k = 0; k < groups.length; k++) {
                var out = await PDFDocument.create();
                var copied = await out.copyPages(src, groups[k]);
                copied.forEach(function (p) { out.addPage(p); });
                var bytes = await out.save();
                var label = groups[k].length === 1
                    ? (groups[k][0] + 1)
                    : (groups[k][0] + 1) + '-' + (groups[k][groups[k].length - 1] + 1);
                zip.file(baseName + '_p' + label + '.pdf', bytes);
            }
            var blob = await zip.generateAsync({ type: 'blob' });
            LD.download(blob, baseName + '_split.zip');
            setStatus('split-status', '완료 · ' + groups.length + '개 파일', 'ok');
        } catch (e) { setStatus('split-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 3: ORGANIZE (rotate + reorder + remove)
    // =====================================================
    var orgState = { file: null, buf: null, pageCount: 0, rotations: [], removed: [], order: [] };
    bindDrop('org-drop', 'org-file', async function (files) {
        if (!files[0]) return;
        orgState.file = files[0];
        setStatus('org-status', '미리보기 생성 중…');
        try {
            var buf = await readArrayBuffer(files[0]);
            orgState.buf = buf;
            var pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            orgState.pageCount = pdf.numPages;
            orgState.rotations = [];
            orgState.removed = [];
            orgState.order = [];
            var grid = document.getElementById('org-grid');
            grid.innerHTML = '';
            for (var i = 1; i <= pdf.numPages; i++) {
                orgState.rotations.push(0);
                orgState.removed.push(false);
                orgState.order.push(i - 1);
                var r = await renderPdfPage(pdf, i, 0.4);
                var thumb = document.createElement('div');
                thumb.className = 'preview-thumb';
                thumb.dataset.idx = i - 1;
                thumb.draggable = true;
                thumb.appendChild(r.canvas);
                thumb.insertAdjacentHTML('beforeend',
                    '<div class="preview-thumb-num">' + i + '</div>' +
                    '<div class="preview-thumb-actions">' +
                    '<button class="preview-thumb-action" data-rot="-90" title="좌">↺</button>' +
                    '<button class="preview-thumb-action" data-rot="90" title="우">↻</button>' +
                    '<button class="preview-thumb-action" data-toggle title="제외">✕</button>' +
                    '</div>');
                grid.appendChild(thumb);
                bindOrgThumb(thumb, i - 1);
            }
            document.getElementById('org-run').disabled = false;
            setStatus('org-status', orgState.file.name + ' · ' + pdf.numPages + '페이지', 'ok');
        } catch (e) { setStatus('org-status', '오류: ' + e.message, 'err'); }
    });

    function bindOrgThumb(thumb, idx) {
        var canvas = thumb.querySelector('canvas');
        thumb.querySelectorAll('[data-rot]').forEach(function (b) {
            b.onclick = function () {
                var d = parseInt(b.dataset.rot, 10);
                orgState.rotations[idx] = (orgState.rotations[idx] + d + 360) % 360;
                canvas.style.transform = 'rotate(' + orgState.rotations[idx] + 'deg)';
            };
        });
        thumb.querySelector('[data-toggle]').onclick = function () {
            orgState.removed[idx] = !orgState.removed[idx];
            thumb.classList.toggle('removed', orgState.removed[idx]);
        };
        // Drag reorder
        thumb.addEventListener('dragstart', function (e) {
            e.dataTransfer.setData('text/idx', String(idx));
            thumb.style.opacity = '.5';
        });
        thumb.addEventListener('dragend', function () { thumb.style.opacity = ''; });
        thumb.addEventListener('dragover', function (e) { e.preventDefault(); });
        thumb.addEventListener('drop', function (e) {
            e.preventDefault();
            var from = parseInt(e.dataTransfer.getData('text/idx'), 10);
            if (isNaN(from) || from === idx) return;
            // Find indices in `order` array
            var fromPos = orgState.order.indexOf(from);
            var toPos = orgState.order.indexOf(idx);
            var item = orgState.order.splice(fromPos, 1)[0];
            orgState.order.splice(toPos, 0, item);
            // Rebuild DOM
            var grid = document.getElementById('org-grid');
            var children = Array.from(grid.children);
            grid.innerHTML = '';
            orgState.order.forEach(function (i) {
                var ch = children.find(function (c) { return parseInt(c.dataset.idx, 10) === i; });
                if (ch) grid.appendChild(ch);
            });
        });
    }

    document.querySelectorAll('[data-org-rotate-all]').forEach(function (b) {
        b.addEventListener('click', function () {
            var d = parseInt(b.dataset.orgRotateAll, 10);
            orgState.rotations.forEach(function (_, i) {
                orgState.rotations[i] = (orgState.rotations[i] + d + 360) % 360;
            });
            document.querySelectorAll('#org-grid .preview-thumb canvas').forEach(function (c, idx) {
                var realIdx = parseInt(c.parentElement.dataset.idx, 10);
                c.style.transform = 'rotate(' + orgState.rotations[realIdx] + 'deg)';
            });
        });
    });

    document.getElementById('org-run').addEventListener('click', async function () {
        if (!orgState.buf) return;
        setStatus('org-status', '저장 중…');
        try {
            var src = await PDFDocument.load(orgState.buf, { ignoreEncryption: true });
            var out = await PDFDocument.create();
            var keep = orgState.order.filter(function (i) { return !orgState.removed[i]; });
            if (!keep.length) throw new Error('남아있는 페이지가 없습니다.');
            var copied = await out.copyPages(src, keep);
            copied.forEach(function (p, k) {
                var origRot = p.getRotation().angle || 0;
                p.setRotation(degrees((origRot + orgState.rotations[keep[k]]) % 360));
                out.addPage(p);
            });
            var bytes = await out.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('org-name').value || 'organized.pdf');
            setStatus('org-status', '완료 · ' + keep.length + '페이지', 'ok');
        } catch (e) { setStatus('org-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 4: CROP
    // =====================================================
    var cropState = { file: null, buf: null, pdfDoc: null, pageNum: 1, pageCount: 0, scale: 0 };
    bindDrop('crop-drop', 'crop-file', async function (files) {
        if (!files[0]) return;
        cropState.file = files[0];
        setStatus('crop-status', '미리보기 생성 중…');
        try {
            var buf = await readArrayBuffer(files[0]);
            cropState.buf = buf;
            cropState.pdfDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            cropState.pageCount = cropState.pdfDoc.numPages;
            cropState.pageNum = 1;
            document.getElementById('crop-stage').hidden = false;
            await renderCropPage();
            document.getElementById('crop-run').disabled = false;
            setStatus('crop-status', '');
        } catch (e) { setStatus('crop-status', '오류: ' + e.message, 'err'); }
    });

    async function renderCropPage() {
        var canvas = document.getElementById('crop-canvas');
        var page = await cropState.pdfDoc.getPage(cropState.pageNum);
        var vp = page.getViewport({ scale: 1 });
        var maxW = 600;
        var scale = Math.min(2, maxW / vp.width);
        var vp2 = page.getViewport({ scale: scale });
        canvas.width = vp2.width;
        canvas.height = vp2.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp2 }).promise;
        cropState.scale = scale;
        cropState.pageW = vp.width;
        cropState.pageH = vp.height;
        document.getElementById('crop-pageinfo').textContent = cropState.pageNum + ' / ' + cropState.pageCount;
        drawCropOverlay();
    }
    function drawCropOverlay() {
        var ov = document.getElementById('crop-overlay');
        var canvas = document.getElementById('crop-canvas');
        ov.style.width = canvas.width + 'px';
        ov.style.height = canvas.height + 'px';
        var t = parseFloat(document.getElementById('crop-top').value) || 0;
        var b = parseFloat(document.getElementById('crop-bottom').value) || 0;
        var l = parseFloat(document.getElementById('crop-left').value) || 0;
        var r = parseFloat(document.getElementById('crop-right').value) || 0;
        var pxPerMm = cropState.scale * PT_PER_MM;
        ov.innerHTML = '';
        var box = document.createElement('div');
        box.style.cssText = 'position:absolute;border:2px dashed #D97757;background:rgba(217,119,87,0.08);box-sizing:border-box;' +
            'top:' + (t * pxPerMm) + 'px;' +
            'left:' + (l * pxPerMm) + 'px;' +
            'right:' + (r * pxPerMm) + 'px;' +
            'bottom:' + (b * pxPerMm) + 'px;';
        ov.appendChild(box);
    }
    ['crop-top','crop-bottom','crop-left','crop-right'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', drawCropOverlay);
    });
    document.querySelector('[data-crop-prev]').addEventListener('click', async function () {
        if (cropState.pageNum > 1) { cropState.pageNum--; await renderCropPage(); }
    });
    document.querySelector('[data-crop-next]').addEventListener('click', async function () {
        if (cropState.pageNum < cropState.pageCount) { cropState.pageNum++; await renderCropPage(); }
    });

    document.getElementById('crop-run').addEventListener('click', async function () {
        if (!cropState.buf) return;
        setStatus('crop-status', '자르는 중…');
        try {
            var doc = await PDFDocument.load(cropState.buf, { ignoreEncryption: true });
            var t = (parseFloat(document.getElementById('crop-top').value) || 0) * PT_PER_MM;
            var b = (parseFloat(document.getElementById('crop-bottom').value) || 0) * PT_PER_MM;
            var l = (parseFloat(document.getElementById('crop-left').value) || 0) * PT_PER_MM;
            var r = (parseFloat(document.getElementById('crop-right').value) || 0) * PT_PER_MM;
            doc.getPages().forEach(function (page) {
                var w = page.getWidth(), h = page.getHeight();
                var box = page.getCropBox();
                // PDF coordinate origin is bottom-left
                page.setCropBox(box.x + l, box.y + b, Math.max(1, w - l - r), Math.max(1, h - t - b));
            });
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('crop-name').value || 'cropped.pdf');
            setStatus('crop-status', '완료 · ' + LD.formatBytes(bytes.byteLength), 'ok');
        } catch (e) { setStatus('crop-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 5: N-UP
    // =====================================================
    var nupState = { file: null, buf: null, n: 2, orient: 'auto' };
    bindDrop('nup-drop', 'nup-file', async function (files) {
        if (!files[0]) return;
        nupState.file = files[0];
        var buf = await readArrayBuffer(files[0]);
        nupState.buf = buf;
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        setStatus('nup-info', files[0].name + ' · ' + doc.getPageCount() + '페이지', 'ok');
        document.getElementById('nup-run').disabled = false;
    });
    document.getElementById('nup-layout').addEventListener('click', function (e) {
        if (e.target.tagName !== 'BUTTON') return;
        document.querySelectorAll('#nup-layout button').forEach(function (b) { b.classList.remove('on'); });
        e.target.classList.add('on');
        nupState.n = parseInt(e.target.dataset.n, 10);
    });
    document.getElementById('nup-orient').addEventListener('click', function (e) {
        if (e.target.tagName !== 'BUTTON') return;
        document.querySelectorAll('#nup-orient button').forEach(function (b) { b.classList.remove('on'); });
        e.target.classList.add('on');
        nupState.orient = e.target.dataset.o;
    });

    document.getElementById('nup-run').addEventListener('click', async function () {
        if (!nupState.buf) return;
        setStatus('nup-status', '재구성 중…');
        try {
            var src = await PDFDocument.load(nupState.buf, { ignoreEncryption: true });
            var pages = src.getPages();
            var n = nupState.n;
            // grid: 2-up=1x2, 4-up=2x2, 6-up=2x3, 9-up=3x3
            var grids = { 2: [1, 2], 4: [2, 2], 6: [2, 3], 9: [3, 3] };
            var grid = grids[n];
            var cols = grid[1], rows = grid[0];

            var out = await PDFDocument.create();
            var first = pages[0];
            var srcW = first.getWidth(), srcH = first.getHeight();
            var landscape = nupState.orient === 'landscape' || (nupState.orient === 'auto' && cols > rows);
            var pageW = landscape ? Math.max(srcW, srcH) : Math.min(srcW, srcH);
            var pageH = landscape ? Math.min(srcW, srcH) : Math.max(srcW, srcH);
            // Use A4 if difference too big
            var A4 = [595.28, 841.89];
            pageW = landscape ? A4[1] : A4[0];
            pageH = landscape ? A4[0] : A4[1];

            var margin = parseFloat(document.getElementById('nup-margin').value) || 0;
            var cellW = (pageW - margin * (cols + 1)) / cols;
            var cellH = (pageH - margin * (rows + 1)) / rows;

            // Embed all source pages
            var embedded = await out.embedPages(pages);

            for (var i = 0; i < embedded.length; i += n) {
                var newPage = out.addPage([pageW, pageH]);
                for (var j = 0; j < n && i + j < embedded.length; j++) {
                    var emb = embedded[i + j];
                    var col = j % cols;
                    var row = Math.floor(j / cols);
                    var w = emb.width, h = emb.height;
                    var s = Math.min(cellW / w, cellH / h);
                    var dw = w * s, dh = h * s;
                    var x = margin + col * (cellW + margin) + (cellW - dw) / 2;
                    // PDF y starts at bottom
                    var y = pageH - margin - (row + 1) * (cellH) - row * margin + (cellH - dh) / 2;
                    newPage.drawPage(emb, { x: x, y: y, width: dw, height: dh });
                }
            }
            var bytes = await out.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('nup-name').value || 'nup.pdf');
            setStatus('nup-status', '완료 · ' + LD.formatBytes(bytes.byteLength), 'ok');
        } catch (e) { console.error(e); setStatus('nup-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 6: PAGE NUMBERS
    // =====================================================
    var numState = { file: null, buf: null, pos: 'bc' };
    bindDrop('num-drop', 'num-file', async function (files) {
        if (!files[0]) return;
        numState.file = files[0];
        var buf = await readArrayBuffer(files[0]);
        numState.buf = buf;
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        setStatus('num-info', files[0].name + ' · ' + doc.getPageCount() + '페이지', 'ok');
        document.getElementById('num-run').disabled = false;
    });
    document.getElementById('num-pos').addEventListener('click', function (e) {
        if (e.target.tagName !== 'BUTTON') return;
        document.querySelectorAll('#num-pos button').forEach(function (b) { b.classList.remove('on'); });
        e.target.classList.add('on');
        numState.pos = e.target.dataset.p;
    });
    document.getElementById('num-run').addEventListener('click', async function () {
        if (!numState.buf) return;
        setStatus('num-status', '페이지 번호 추가 중…');
        try {
            var doc = await PDFDocument.load(numState.buf, { ignoreEncryption: true });
            var font = await doc.embedFont(StandardFonts.Helvetica);
            var size = parseInt(document.getElementById('num-size').value, 10) || 12;
            var fmt = document.getElementById('num-format').value;
            var start = parseInt(document.getElementById('num-start').value, 10) || 1;
            var color = hexToRgb(document.getElementById('num-color').value);
            var pages = doc.getPages();
            var N = pages.length;
            pages.forEach(function (page, i) {
                var num = start + i;
                var text = fmt
                    .replace('N', N)
                    .replace('n', num);
                var tw = font.widthOfTextAtSize(text, size);
                var w = page.getWidth(), h = page.getHeight();
                var pad = 24;
                var x, y;
                if (numState.pos.endsWith('l')) x = pad;
                else if (numState.pos.endsWith('r')) x = w - tw - pad;
                else x = (w - tw) / 2;
                if (numState.pos.startsWith('t')) y = h - pad - size;
                else y = pad;
                page.drawText(text, { x: x, y: y, size: size, font: font, color: color });
            });
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('num-name').value || 'numbered.pdf');
            setStatus('num-status', '완료 · ' + N + '페이지', 'ok');
        } catch (e) { setStatus('num-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 7: WATERMARK
    // =====================================================
    var wmState = { file: null, buf: null };
    bindDrop('wm-drop', 'wm-file', async function (files) {
        if (!files[0]) return;
        wmState.file = files[0];
        var buf = await readArrayBuffer(files[0]);
        wmState.buf = buf;
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        setStatus('wm-info', files[0].name + ' · ' + doc.getPageCount() + '페이지', 'ok');
        document.getElementById('wm-run').disabled = false;
    });
    document.getElementById('wm-run').addEventListener('click', async function () {
        if (!wmState.buf) return;
        setStatus('wm-status', '워터마크 추가 중…');
        try {
            var doc = await PDFDocument.load(wmState.buf, { ignoreEncryption: true });
            var text = document.getElementById('wm-text').value || 'WATERMARK';
            // Use Korean font if text contains hangul
            var hasKo = /[ㄱ-ㆎ가-힣]/.test(text);
            var font = hasKo
                ? (await embedKoreanFont(doc)) || (await doc.embedFont(StandardFonts.HelveticaBold))
                : await doc.embedFont(StandardFonts.HelveticaBold);
            var size = parseInt(document.getElementById('wm-size').value, 10) || 60;
            var opacity = parseInt(document.getElementById('wm-opacity').value, 10) / 100;
            var angle = parseInt(document.getElementById('wm-angle').value, 10);
            var color = hexToRgb(document.getElementById('wm-color').value);

            doc.getPages().forEach(function (page) {
                var w = page.getWidth(), h = page.getHeight();
                var tw = font.widthOfTextAtSize(text, size);
                page.drawText(text, {
                    x: (w - tw) / 2,
                    y: h / 2,
                    size: size, font: font, color: color,
                    opacity: opacity,
                    rotate: degrees(angle)
                });
            });
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('wm-name').value || 'watermarked.pdf');
            setStatus('wm-status', '완료', 'ok');
        } catch (e) { setStatus('wm-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 8: SIGN
    // =====================================================
    var signState = {
        file: null, buf: null, pdfDoc: null, pageNum: 1, pageCount: 0,
        scale: 0, signatures: [], currentSig: null, placements: []
        // placements: [{page, x, y, w, h, sigIdx}]
    };
    bindDrop('sign-drop', 'sign-file', async function (files) {
        if (!files[0]) return;
        signState.file = files[0];
        setStatus('sign-status', '미리보기 생성 중…');
        try {
            var buf = await readArrayBuffer(files[0]);
            signState.buf = buf;
            signState.pdfDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            signState.pageCount = signState.pdfDoc.numPages;
            signState.pageNum = 1;
            signState.placements = [];
            document.getElementById('sign-stage').hidden = false;
            await renderSignPage();
            document.getElementById('sign-run').disabled = false;
            setStatus('sign-status', '');
        } catch (e) { setStatus('sign-status', '오류: ' + e.message, 'err'); }
    });

    async function renderSignPage() {
        var canvas = document.getElementById('sign-canvas');
        var page = await signState.pdfDoc.getPage(signState.pageNum);
        var vp = page.getViewport({ scale: 1 });
        var maxW = 600;
        var scale = Math.min(2, maxW / vp.width);
        var vp2 = page.getViewport({ scale: scale });
        canvas.width = vp2.width;
        canvas.height = vp2.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp2 }).promise;
        signState.scale = scale;
        signState.pageW = vp.width;
        signState.pageH = vp.height;
        document.getElementById('sign-pageinfo').textContent = signState.pageNum + ' / ' + signState.pageCount;
        redrawSignOverlay();
    }

    function redrawSignOverlay() {
        var ov = document.getElementById('sign-overlay');
        var canvas = document.getElementById('sign-canvas');
        ov.style.width = canvas.width + 'px';
        ov.style.height = canvas.height + 'px';
        ov.innerHTML = '';
        signState.placements.filter(function (p) { return p.page === signState.pageNum; })
            .forEach(function (p) {
                var sig = signState.signatures[p.sigIdx];
                if (!sig) return;
                var el = document.createElement('img');
                el.src = sig.url;
                el.style.cssText = 'position:absolute;pointer-events:none;' +
                    'left:' + (p.x * signState.scale) + 'px;' +
                    'top:' + ((signState.pageH - p.y - p.h) * signState.scale) + 'px;' +
                    'width:' + (p.w * signState.scale) + 'px;' +
                    'height:' + (p.h * signState.scale) + 'px;';
                ov.appendChild(el);
            });
    }

    document.querySelector('[data-sign-prev]').addEventListener('click', async function () {
        if (signState.pageNum > 1) { signState.pageNum--; await renderSignPage(); }
    });
    document.querySelector('[data-sign-next]').addEventListener('click', async function () {
        if (signState.pageNum < signState.pageCount) { signState.pageNum++; await renderSignPage(); }
    });

    document.getElementById('sign-img-input').addEventListener('change', async function (e) {
        var files = Array.from(e.target.files);
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (!/^image\/(png|jpeg)$/.test(f.type)) continue;
            var url = URL.createObjectURL(f);
            await new Promise(function (res) {
                var img = new Image();
                img.onload = function () {
                    signState.signatures.push({
                        file: f, url: url, type: f.type,
                        natW: img.naturalWidth, natH: img.naturalHeight
                    });
                    res();
                };
                img.src = url;
            });
        }
        renderSignTray();
    });

    function renderSignTray() {
        var tray = document.getElementById('sign-tray');
        // Remove all but add button
        Array.from(tray.querySelectorAll(':not(#sign-add)')).forEach(function (n) { n.remove(); });
        signState.signatures.forEach(function (sig, i) {
            var item = document.createElement('div');
            item.className = 'sign-tray-item';
            if (signState.currentSig === i) item.style.outline = '2px solid var(--accent)';
            item.innerHTML = '<img src="' + sig.url + '"><span class="x" data-x="' + i + '">×</span>';
            item.onclick = function (e) {
                if (e.target.dataset.x !== undefined) {
                    signState.signatures.splice(i, 1);
                    if (signState.currentSig === i) signState.currentSig = null;
                    renderSignTray();
                    return;
                }
                signState.currentSig = i;
                renderSignTray();
            };
            tray.insertBefore(item, document.getElementById('sign-add'));
        });
    }

    document.getElementById('sign-overlay').addEventListener('click', function (e) {
        if (signState.currentSig === null) {
            LD.toast('먼저 트레이에서 서명을 선택하세요.', 'error');
            return;
        }
        var sig = signState.signatures[signState.currentSig];
        var rect = this.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var clickY = e.clientY - rect.top;
        // Default size: 120pt, keep aspect
        var scalePct = parseInt(document.getElementById('sign-scale').value, 10) / 100;
        var baseW = 120 * scalePct;
        var aspect = sig.natH / sig.natW;
        var baseH = baseW * aspect;
        // Convert to PDF coordinates (origin bottom-left)
        var pdfX = clickX / signState.scale - baseW / 2;
        var pdfY = signState.pageH - (clickY / signState.scale) - baseH / 2;
        signState.placements.push({
            page: signState.pageNum,
            sigIdx: signState.currentSig,
            x: pdfX, y: pdfY, w: baseW, h: baseH
        });
        document.getElementById('sign-undo').disabled = false;
        redrawSignOverlay();
    });
    document.getElementById('sign-scale').addEventListener('input', function () {
        document.getElementById('sign-scale-val').textContent = this.value + '%';
    });
    document.getElementById('sign-undo').addEventListener('click', function () {
        signState.placements.pop();
        document.getElementById('sign-undo').disabled = signState.placements.length === 0;
        redrawSignOverlay();
    });

    document.getElementById('sign-run').addEventListener('click', async function () {
        if (!signState.buf) return;
        setStatus('sign-status', '서명 삽입 중…');
        try {
            var doc = await PDFDocument.load(signState.buf, { ignoreEncryption: true });
            // Embed all signature images
            var embedded = [];
            for (var i = 0; i < signState.signatures.length; i++) {
                var sig = signState.signatures[i];
                var arr = await sig.file.arrayBuffer();
                embedded.push(sig.type === 'image/png'
                    ? await doc.embedPng(arr)
                    : await doc.embedJpg(arr));
            }
            var pages = doc.getPages();
            signState.placements.forEach(function (p) {
                var page = pages[p.page - 1];
                if (!page) return;
                page.drawImage(embedded[p.sigIdx], {
                    x: p.x, y: p.y, width: p.w, height: p.h
                });
            });
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('sign-name').value || 'signed.pdf');
            setStatus('sign-status', '완료 · ' + signState.placements.length + '곳 서명', 'ok');
        } catch (e) { console.error(e); setStatus('sign-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 9: REDACT
    // =====================================================
    var rdState = {
        file: null, buf: null, pdfDoc: null, pageNum: 1, pageCount: 0,
        scale: 0, boxes: [] // {page, x, y, w, h}
    };
    bindDrop('rd-drop', 'rd-file', async function (files) {
        if (!files[0]) return;
        rdState.file = files[0];
        setStatus('rd-status', '미리보기 생성 중…');
        try {
            var buf = await readArrayBuffer(files[0]);
            rdState.buf = buf;
            rdState.pdfDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            rdState.pageCount = rdState.pdfDoc.numPages;
            rdState.pageNum = 1;
            rdState.boxes = [];
            document.getElementById('rd-stage').hidden = false;
            await renderRdPage();
            document.getElementById('rd-run').disabled = false;
            setStatus('rd-status', '');
        } catch (e) { setStatus('rd-status', '오류: ' + e.message, 'err'); }
    });

    async function renderRdPage() {
        var canvas = document.getElementById('rd-canvas');
        var page = await rdState.pdfDoc.getPage(rdState.pageNum);
        var vp = page.getViewport({ scale: 1 });
        var maxW = 600;
        var scale = Math.min(2, maxW / vp.width);
        var vp2 = page.getViewport({ scale: scale });
        canvas.width = vp2.width;
        canvas.height = vp2.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp2 }).promise;
        rdState.scale = scale;
        rdState.pageW = vp.width;
        rdState.pageH = vp.height;
        document.getElementById('rd-pageinfo').textContent = rdState.pageNum + ' / ' + rdState.pageCount;
        redrawRdOverlay();
    }
    function redrawRdOverlay() {
        var ov = document.getElementById('rd-overlay');
        var canvas = document.getElementById('rd-canvas');
        ov.style.width = canvas.width + 'px';
        ov.style.height = canvas.height + 'px';
        ov.innerHTML = '';
        rdState.boxes.filter(function (b) { return b.page === rdState.pageNum; })
            .forEach(function (b) {
                var el = document.createElement('div');
                el.style.cssText = 'position:absolute;background:' + document.getElementById('rd-color').value + ';' +
                    'left:' + (b.x * rdState.scale) + 'px;' +
                    'top:' + ((rdState.pageH - b.y - b.h) * rdState.scale) + 'px;' +
                    'width:' + (b.w * rdState.scale) + 'px;' +
                    'height:' + (b.h * rdState.scale) + 'px;';
                ov.appendChild(el);
            });
        document.getElementById('rd-clear').disabled = rdState.boxes.filter(function (b) { return b.page === rdState.pageNum; }).length === 0;
    }
    document.getElementById('rd-color').addEventListener('input', redrawRdOverlay);
    document.querySelector('[data-rd-prev]').addEventListener('click', async function () {
        if (rdState.pageNum > 1) { rdState.pageNum--; await renderRdPage(); }
    });
    document.querySelector('[data-rd-next]').addEventListener('click', async function () {
        if (rdState.pageNum < rdState.pageCount) { rdState.pageNum++; await renderRdPage(); }
    });
    // Drag to draw
    (function () {
        var ov = document.getElementById('rd-overlay');
        var startX, startY, draftEl;
        ov.addEventListener('mousedown', function (e) {
            var rect = ov.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            draftEl = document.createElement('div');
            draftEl.style.cssText = 'position:absolute;background:rgba(0,0,0,.5);border:1px dashed #fff;' +
                'left:' + startX + 'px;top:' + startY + 'px;width:0;height:0;';
            ov.appendChild(draftEl);
            function onMove(ev) {
                var rect2 = ov.getBoundingClientRect();
                var cx = ev.clientX - rect2.left;
                var cy = ev.clientY - rect2.top;
                var x = Math.min(startX, cx), y = Math.min(startY, cy);
                var w = Math.abs(cx - startX), h = Math.abs(cy - startY);
                draftEl.style.left = x + 'px';
                draftEl.style.top = y + 'px';
                draftEl.style.width = w + 'px';
                draftEl.style.height = h + 'px';
            }
            function onUp(ev) {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                var rect2 = ov.getBoundingClientRect();
                var cx = ev.clientX - rect2.left;
                var cy = ev.clientY - rect2.top;
                var x = Math.min(startX, cx), y = Math.min(startY, cy);
                var w = Math.abs(cx - startX), h = Math.abs(cy - startY);
                if (w > 3 && h > 3) {
                    // Convert to PDF coords
                    var pdfX = x / rdState.scale;
                    var pdfY = rdState.pageH - (y + h) / rdState.scale;
                    var pdfW = w / rdState.scale;
                    var pdfH = h / rdState.scale;
                    rdState.boxes.push({
                        page: rdState.pageNum, x: pdfX, y: pdfY, w: pdfW, h: pdfH
                    });
                }
                draftEl.remove();
                redrawRdOverlay();
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    })();
    document.getElementById('rd-clear').addEventListener('click', function () {
        rdState.boxes = rdState.boxes.filter(function (b) { return b.page !== rdState.pageNum; });
        redrawRdOverlay();
    });
    document.getElementById('rd-run').addEventListener('click', async function () {
        if (!rdState.buf) return;
        setStatus('rd-status', '저장 중…');
        try {
            var doc = await PDFDocument.load(rdState.buf, { ignoreEncryption: true });
            var color = hexToRgb(document.getElementById('rd-color').value);
            var pages = doc.getPages();
            rdState.boxes.forEach(function (b) {
                var page = pages[b.page - 1];
                if (!page) return;
                page.drawRectangle({
                    x: b.x, y: b.y, width: b.w, height: b.h,
                    color: color, borderWidth: 0
                });
            });
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('rd-name').value || 'redacted.pdf');
            setStatus('rd-status', '완료 · ' + rdState.boxes.length + '개 영역', 'ok');
        } catch (e) { setStatus('rd-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 10: PDF → IMAGES
    // =====================================================
    var extFile = null;
    bindDrop('ext-drop', 'ext-file', async function (files) {
        if (!files[0]) return;
        extFile = files[0];
        var grid = document.getElementById('ext-grid');
        grid.innerHTML = '<div class="status">미리보기 생성 중…</div>';
        try {
            var buf = await readArrayBuffer(files[0]);
            var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            grid.innerHTML = '';
            for (var i = 1; i <= Math.min(pdf.numPages, 30); i++) {
                var r = await renderPdfPage(pdf, i, 0.3);
                var thumb = document.createElement('div');
                thumb.className = 'preview-thumb';
                thumb.innerHTML = '<div class="preview-thumb-num">' + i + '</div>';
                thumb.appendChild(r.canvas);
                grid.appendChild(thumb);
            }
            if (pdf.numPages > 30) {
                grid.insertAdjacentHTML('beforeend', '<div class="status">+' + (pdf.numPages - 30) + '페이지 더 있음</div>');
            }
            document.getElementById('ext-run').disabled = false;
            setStatus('ext-status', extFile.name + ' · ' + pdf.numPages + '페이지', 'ok');
        } catch (e) { setStatus('ext-status', '오류: ' + e.message, 'err'); }
    });
    document.getElementById('ext-run').addEventListener('click', async function () {
        if (!extFile) return;
        setStatus('ext-status', '변환 중…');
        try {
            var buf = await readArrayBuffer(extFile);
            var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            var fmt = document.getElementById('ext-format').value;
            var scale = parseFloat(document.getElementById('ext-dpi').value);
            var quality = parseInt(document.getElementById('ext-quality').value, 10) / 100;
            var zip = new JSZip();
            var baseName = extFile.name.replace(/\.pdf$/i, '');
            var extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
            for (var i = 1; i <= pdf.numPages; i++) {
                setStatus('ext-status', '변환 중… (' + i + '/' + pdf.numPages + ')');
                var page = await pdf.getPage(i);
                var vp = page.getViewport({ scale: scale });
                var c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                var ctx = c.getContext('2d');
                if (fmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                var blob = await new Promise(function (res) { c.toBlob(res, fmt, quality); });
                var arr = await blob.arrayBuffer();
                zip.file(baseName + '_p' + String(i).padStart(3, '0') + '.' + extMap[fmt], arr);
            }
            var z = await zip.generateAsync({ type: 'blob' });
            LD.download(z, baseName + '_images.zip');
            setStatus('ext-status', '완료 · ' + pdf.numPages + '개', 'ok');
        } catch (e) { setStatus('ext-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 11: IMAGES → PDF
    // =====================================================
    var imgFiles = [];
    bindDrop('img-drop', 'img-files', function (files) {
        imgFiles = imgFiles.concat(files.filter(function (f) { return /^image\/(jpeg|png)$/.test(f.type); }));
        refreshImgs();
    });
    function refreshImgs() {
        renderFileList(imgFiles, document.getElementById('img-list'),
            function (i) { imgFiles.splice(i, 1); refreshImgs(); },
            function (a, b) { var x = imgFiles.splice(a, 1)[0]; imgFiles.splice(b, 0, x); refreshImgs(); });
        document.getElementById('img-run').disabled = imgFiles.length < 1;
    }
    document.getElementById('img-run').addEventListener('click', async function () {
        setStatus('img-status', 'PDF 생성 중…');
        try {
            var doc = await PDFDocument.create();
            var size = document.getElementById('img-size').value;
            var orient = document.getElementById('img-orient').value;
            var margin = parseFloat(document.getElementById('img-margin').value) || 0;
            var sizes = { A4: [595.28, 841.89], Letter: [612, 792] };

            for (var i = 0; i < imgFiles.length; i++) {
                var f = imgFiles[i];
                var buf = await readArrayBuffer(f);
                var img = f.type === 'image/png' ? await doc.embedPng(buf) : await doc.embedJpg(buf);
                var pw, ph;
                if (size === 'fit') {
                    pw = img.width + margin * PT_PER_MM * 2;
                    ph = img.height + margin * PT_PER_MM * 2;
                } else {
                    var s = sizes[size];
                    var landscape = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
                    pw = landscape ? s[1] : s[0];
                    ph = landscape ? s[0] : s[1];
                }
                var page = doc.addPage([pw, ph]);
                var maxW = pw - margin * PT_PER_MM * 2;
                var maxH = ph - margin * PT_PER_MM * 2;
                var sc = Math.min(maxW / img.width, maxH / img.height);
                var w = img.width * sc, h = img.height * sc;
                page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
            }
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('img-name').value || 'images.pdf');
            setStatus('img-status', '완료 · ' + imgFiles.length + '페이지', 'ok');
        } catch (e) { setStatus('img-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 12: PDF → TEXT
    // =====================================================
    var txtFile = null;
    var txtResult = '';
    bindDrop('txt-drop', 'txt-file', function (files) {
        if (!files[0]) return;
        txtFile = files[0];
        document.getElementById('txt-run').disabled = false;
        setStatus('txt-status', txtFile.name + ' 준비됨', 'ok');
    });
    document.getElementById('txt-run').addEventListener('click', async function () {
        if (!txtFile) return;
        setStatus('txt-status', '텍스트 추출 중…');
        try {
            var buf = await readArrayBuffer(txtFile);
            var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            var sep = document.getElementById('txt-sep').value;
            var pages = [];
            for (var i = 1; i <= pdf.numPages; i++) {
                setStatus('txt-status', '추출 중… (' + i + '/' + pdf.numPages + ')');
                var page = await pdf.getPage(i);
                var content = await page.getTextContent();
                var text = content.items.map(function (it) { return it.str; }).join(' ')
                    .replace(/\s+/g, ' ').trim();
                if (sep === 'header') pages.push('--- Page ' + i + ' ---\n' + text);
                else pages.push(text);
            }
            var joiner = sep === 'form-feed' ? '\f' : (sep === 'header' ? '\n\n' : '\n\n');
            txtResult = pages.join(joiner);
            document.getElementById('txt-output').value = txtResult;
            document.getElementById('txt-download').disabled = false;
            document.getElementById('txt-copy').disabled = false;
            setStatus('txt-status', '완료 · ' + pdf.numPages + '페이지 · ' + txtResult.length + '자', 'ok');
        } catch (e) { setStatus('txt-status', '오류: ' + e.message, 'err'); }
    });
    document.getElementById('txt-download').addEventListener('click', function () {
        var name = document.getElementById('txt-name').value || 'extracted.txt';
        LD.download(new Blob([txtResult], { type: 'text/plain;charset=utf-8' }), name);
    });
    document.getElementById('txt-copy').addEventListener('click', function () {
        navigator.clipboard.writeText(txtResult).then(function () {
            LD.toast('클립보드에 복사되었습니다.');
        });
    });

    // =====================================================
    // TOOL 13: COMPRESS (image-mode)
    // =====================================================
    var cmpState = { file: null, level: 'med' };
    bindDrop('cmp-drop', 'cmp-file', async function (files) {
        if (!files[0]) return;
        cmpState.file = files[0];
        setStatus('cmp-info', files[0].name + ' · ' + LD.formatBytes(files[0].size), 'ok');
        document.getElementById('cmp-run').disabled = false;
    });
    document.getElementById('cmp-level').addEventListener('click', function (e) {
        if (e.target.tagName !== 'BUTTON') return;
        document.querySelectorAll('#cmp-level button').forEach(function (b) { b.classList.remove('on'); });
        e.target.classList.add('on');
        cmpState.level = e.target.dataset.l;
        var presets = {
            low: { w: 1600, q: 85 },
            med: { w: 1280, q: 72 },
            high: { w: 1024, q: 60 },
            extreme: { w: 800, q: 45 }
        };
        var p = presets[cmpState.level];
        document.getElementById('cmp-width').value = p.w;
        document.getElementById('cmp-quality').value = p.q;
    });
    document.getElementById('cmp-run').addEventListener('click', async function () {
        if (!cmpState.file) return;
        setStatus('cmp-status', '압축 중…');
        try {
            var origSize = cmpState.file.size;
            var buf = await readArrayBuffer(cmpState.file);
            var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            var maxW = parseInt(document.getElementById('cmp-width').value, 10) || 1280;
            var q = parseInt(document.getElementById('cmp-quality').value, 10) / 100;
            var out = await PDFDocument.create();
            for (var i = 1; i <= pdf.numPages; i++) {
                setStatus('cmp-status', '압축 중… (' + i + '/' + pdf.numPages + ')');
                var page = await pdf.getPage(i);
                var vp = page.getViewport({ scale: 1 });
                var scale = Math.min(2, maxW / vp.width);
                var vp2 = page.getViewport({ scale: scale });
                var canvas = document.createElement('canvas');
                canvas.width = vp2.width;
                canvas.height = vp2.height;
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: ctx, viewport: vp2 }).promise;
                var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', q); });
                var arr = await blob.arrayBuffer();
                var img = await out.embedJpg(arr);
                var newPage = out.addPage([vp.width, vp.height]);
                newPage.drawImage(img, { x: 0, y: 0, width: vp.width, height: vp.height });
            }
            var bytes = await out.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('cmp-name').value || 'compressed.pdf');
            var saved = origSize - bytes.byteLength;
            var pct = ((saved / origSize) * 100).toFixed(1);
            setStatus('cmp-status',
                '완료 · ' + LD.formatBytes(origSize) + ' → ' + LD.formatBytes(bytes.byteLength) +
                ' (' + (saved >= 0 ? '−' : '+') + Math.abs(pct) + '%)',
                saved >= 0 ? 'ok' : 'err');
        } catch (e) { setStatus('cmp-status', '오류: ' + e.message, 'err'); }
    });

    // =====================================================
    // TOOL 14: METADATA
    // =====================================================
    var metaState = { file: null, buf: null };
    bindDrop('meta-drop', 'meta-file', async function (files) {
        if (!files[0]) return;
        metaState.file = files[0];
        try {
            var buf = await readArrayBuffer(files[0]);
            metaState.buf = buf;
            var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
            var info = {
                'Title': doc.getTitle() || '(없음)',
                'Author': doc.getAuthor() || '(없음)',
                'Subject': doc.getSubject() || '(없음)',
                'Keywords': (doc.getKeywords() || []).join(', ') || '(없음)',
                'Producer': doc.getProducer() || '(없음)',
                'Creator': doc.getCreator() || '(없음)',
                'CreationDate': (doc.getCreationDate() || '').toString().slice(0, 25) || '(없음)',
                'ModificationDate': (doc.getModificationDate() || '').toString().slice(0, 25) || '(없음)',
                'Pages': doc.getPageCount()
            };
            document.getElementById('meta-current').hidden = false;
            document.getElementById('meta-list').innerHTML = Object.keys(info).map(function (k) {
                return '<div><strong style="color:var(--text-primary);">' + k + ':</strong> ' + escapeHtml(String(info[k])) + '</div>';
            }).join('');
            // Pre-fill form
            document.getElementById('meta-title').value = doc.getTitle() || '';
            document.getElementById('meta-author').value = doc.getAuthor() || '';
            document.getElementById('meta-subject').value = doc.getSubject() || '';
            document.getElementById('meta-keywords').value = (doc.getKeywords() || []).join(', ');
            document.getElementById('meta-run').disabled = false;
            document.getElementById('meta-strip').disabled = false;
            setStatus('meta-status', '');
        } catch (e) { setStatus('meta-status', '오류: ' + e.message, 'err'); }
    });
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) {
            return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
        });
    }
    document.getElementById('meta-run').addEventListener('click', async function () {
        if (!metaState.buf) return;
        setStatus('meta-status', '저장 중…');
        try {
            var doc = await PDFDocument.load(metaState.buf, { ignoreEncryption: true });
            doc.setTitle(document.getElementById('meta-title').value);
            doc.setAuthor(document.getElementById('meta-author').value);
            doc.setSubject(document.getElementById('meta-subject').value);
            var kw = document.getElementById('meta-keywords').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            doc.setKeywords(kw);
            doc.setModificationDate(new Date());
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('meta-name').value || 'meta-edited.pdf');
            setStatus('meta-status', '완료', 'ok');
        } catch (e) { setStatus('meta-status', '오류: ' + e.message, 'err'); }
    });
    document.getElementById('meta-strip').addEventListener('click', async function () {
        if (!metaState.buf) return;
        setStatus('meta-status', '메타데이터 제거 중…');
        try {
            var doc = await PDFDocument.load(metaState.buf, { ignoreEncryption: true });
            doc.setTitle('');
            doc.setAuthor('');
            doc.setSubject('');
            doc.setKeywords([]);
            doc.setProducer('');
            doc.setCreator('');
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                'stripped_' + (metaState.file.name));
            setStatus('meta-status', '완료 · 메타데이터 제거됨', 'ok');
        } catch (e) { setStatus('meta-status', '오류: ' + e.message, 'err'); }
    });

})();
