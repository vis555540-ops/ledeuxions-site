/* PDF300 — client-side PDF toolkit (no upload)
   Libs: pdf-lib, pdf.js, JSZip
*/
(function () {
    'use strict';
    var PDFDocument = PDFLib.PDFDocument;
    var degrees = PDFLib.degrees;
    var rgb = PDFLib.rgb;
    var StandardFonts = PDFLib.StandardFonts;

    // ============ Tabs ============
    document.querySelectorAll('[data-tab]').forEach(function (t) {
        t.addEventListener('click', function () {
            var name = t.dataset.tab;
            document.querySelectorAll('[data-tab]').forEach(function (x) { x.classList.toggle('is-active', x === t); });
            document.querySelectorAll('[data-pane]').forEach(function (p) {
                p.classList.toggle('is-active', p.dataset.pane === name);
            });
        });
    });

    // ============ Helpers ============
    function bindDrop(zoneId, inputId, onFiles) {
        var zone = document.getElementById(zoneId);
        var input = document.getElementById(inputId);
        if (!zone || !input) return;
        zone.addEventListener('click', function () { input.click(); });
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

    function renderFileList(arr, listEl, onRemove, onReorder) {
        listEl.innerHTML = '';
        arr.forEach(function (f, i) {
            var li = document.createElement('li');
            li.className = 'file-item';
            li.draggable = true;
            li.dataset.idx = i;
            li.innerHTML =
                '<div class="file-item-icon">' + (i + 1) + '</div>' +
                '<div class="file-item-body">' +
                '<div class="file-item-name"></div>' +
                '<div class="file-item-meta"></div>' +
                '</div>' +
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
            // drag-and-drop reorder
            li.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/idx', String(i));
                li.style.opacity = '.5';
            });
            li.addEventListener('dragend', function () { li.style.opacity = ''; });
            li.addEventListener('dragover', function (e) { e.preventDefault(); });
            li.addEventListener('drop', function (e) {
                e.preventDefault();
                var from = parseInt(e.dataTransfer.getData('text/idx'), 10);
                if (!isNaN(from) && from !== i) onReorder(from, i);
            });
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

    // =====================================================
    // MERGE
    // =====================================================
    var mergeFiles = [];
    bindDrop('merge-drop', 'merge-files', function (files) {
        mergeFiles = mergeFiles.concat(files.filter(function (f) { return f.type === 'application/pdf'; }));
        refreshMerge();
    });

    function refreshMerge() {
        var list = document.getElementById('merge-list');
        renderFileList(mergeFiles, list,
            function (i) { mergeFiles.splice(i, 1); refreshMerge(); },
            function (from, to) {
                var item = mergeFiles.splice(from, 1)[0];
                mergeFiles.splice(to, 0, item);
                refreshMerge();
            }
        );
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
            var name = document.getElementById('merge-name').value || 'merged.pdf';
            LD.download(new Blob([bytes], { type: 'application/pdf' }), name);
            setStatus('merge-status', '완료 · ' + LD.formatBytes(bytes.byteLength) + ' 저장', 'ok');
        } catch (e) {
            console.error(e);
            setStatus('merge-status', '오류: ' + e.message, 'err');
        }
    });

    // =====================================================
    // SPLIT
    // =====================================================
    var splitFile = null;
    var splitPageCount = 0;
    bindDrop('split-drop', 'split-file', async function (files) {
        if (!files[0]) return;
        splitFile = files[0];
        var buf = await readArrayBuffer(splitFile);
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        splitPageCount = doc.getPageCount();
        document.getElementById('split-info').hidden = false;
        document.getElementById('split-info').textContent = splitFile.name + ' · ' + splitPageCount + '페이지';
        document.getElementById('split-info').className = 'status';
        document.getElementById('split-range').placeholder = '예: 1-' + splitPageCount;
        document.getElementById('split-run').disabled = false;
    });

    document.getElementById('split-mode').addEventListener('change', function () {
        var mode = this.value;
        document.getElementById('split-range-row').classList.toggle('hidden', mode !== 'range');
        document.getElementById('split-every-row').classList.toggle('hidden', mode !== 'every');
    });

    document.getElementById('split-run').addEventListener('click', async function () {
        if (!splitFile) return;
        setStatus('split-status', '분할 중…');
        try {
            var buf = await readArrayBuffer(splitFile);
            var src = await PDFDocument.load(buf, { ignoreEncryption: true });
            var mode = document.getElementById('split-mode').value;
            var groups = [];
            if (mode === 'range') {
                groups = parseRanges(document.getElementById('split-range').value, splitPageCount);
                if (!groups.length) throw new Error('유효한 페이지 범위가 없습니다.');
            } else if (mode === 'each') {
                for (var i = 0; i < splitPageCount; i++) groups.push([i]);
            } else {
                var n = Math.max(1, parseInt(document.getElementById('split-every').value, 10) || 1);
                for (var s = 0; s < splitPageCount; s += n) {
                    var g = [];
                    for (var j = s; j < Math.min(s + n, splitPageCount); j++) g.push(j);
                    groups.push(g);
                }
            }
            var zip = new JSZip();
            var baseName = splitFile.name.replace(/\.pdf$/i, '');
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
        } catch (e) {
            console.error(e);
            setStatus('split-status', '오류: ' + e.message, 'err');
        }
    });

    // =====================================================
    // ROTATE / REORDER (with preview)
    // =====================================================
    var rotState = { file: null, doc: null, pages: [], rotations: [], removed: [] };

    bindDrop('rot-drop', 'rot-file', async function (files) {
        if (!files[0]) return;
        rotState.file = files[0];
        setStatus('rot-status', '미리보기 생성 중…');
        try {
            var buf = await readArrayBuffer(rotState.file);
            rotState.buf = buf;
            var pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
            rotState.pages = [];
            rotState.rotations = [];
            rotState.removed = [];
            var grid = document.getElementById('rot-grid');
            grid.innerHTML = '';
            for (var i = 1; i <= pdf.numPages; i++) {
                rotState.rotations.push(0);
                rotState.removed.push(false);
                var page = await pdf.getPage(i);
                var vp = page.getViewport({ scale: 0.4 });
                var canvas = document.createElement('canvas');
                canvas.width = vp.width;
                canvas.height = vp.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
                var idx = i - 1;
                var thumb = document.createElement('div');
                thumb.className = 'preview-thumb';
                thumb.dataset.idx = idx;
                thumb.appendChild(canvas);
                thumb.insertAdjacentHTML('beforeend',
                    '<div class="preview-thumb-num">' + i + '</div>' +
                    '<div class="preview-thumb-actions">' +
                    '<button class="preview-thumb-action" data-rot="-90" title="좌">↺</button>' +
                    '<button class="preview-thumb-action" data-rot="90" title="우">↻</button>' +
                    '<button class="preview-thumb-action" data-toggle title="제외/복원">✕</button>' +
                    '</div>');
                grid.appendChild(thumb);
                rotState.pages.push({ thumb: thumb, canvas: canvas });
            }
            bindRotControls();
            document.getElementById('rot-run').disabled = false;
            setStatus('rot-status', rotState.file.name + ' · ' + pdf.numPages + '페이지 로드 완료', 'ok');
        } catch (e) {
            console.error(e);
            setStatus('rot-status', '오류: ' + e.message, 'err');
        }
    });

    function bindRotControls() {
        rotState.pages.forEach(function (p, idx) {
            p.thumb.querySelectorAll('[data-rot]').forEach(function (b) {
                b.onclick = function () {
                    var d = parseInt(b.dataset.rot, 10);
                    rotState.rotations[idx] = (rotState.rotations[idx] + d + 360) % 360;
                    p.canvas.style.transform = 'rotate(' + rotState.rotations[idx] + 'deg)';
                };
            });
            p.thumb.querySelector('[data-toggle]').onclick = function () {
                rotState.removed[idx] = !rotState.removed[idx];
                p.thumb.classList.toggle('removed', rotState.removed[idx]);
            };
        });
    }

    document.querySelectorAll('[data-rotate-all]').forEach(function (b) {
        b.addEventListener('click', function () {
            var d = parseInt(b.dataset.rotateAll, 10);
            rotState.rotations.forEach(function (_, i) {
                rotState.rotations[i] = (rotState.rotations[i] + d + 360) % 360;
                rotState.pages[i].canvas.style.transform = 'rotate(' + rotState.rotations[i] + 'deg)';
            });
        });
    });

    document.getElementById('rot-run').addEventListener('click', async function () {
        if (!rotState.buf) return;
        setStatus('rot-status', '저장 중…');
        try {
            var src = await PDFDocument.load(rotState.buf, { ignoreEncryption: true });
            var out = await PDFDocument.create();
            var keep = [];
            rotState.removed.forEach(function (r, i) { if (!r) keep.push(i); });
            if (!keep.length) throw new Error('남아있는 페이지가 없습니다.');
            var copied = await out.copyPages(src, keep);
            copied.forEach(function (p, k) {
                var origRot = p.getRotation().angle || 0;
                p.setRotation(degrees((origRot + rotState.rotations[keep[k]]) % 360));
                out.addPage(p);
            });
            var bytes = await out.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('rot-name').value || 'edited.pdf');
            setStatus('rot-status', '완료 · ' + keep.length + '페이지 · ' + LD.formatBytes(bytes.byteLength), 'ok');
        } catch (e) {
            console.error(e);
            setStatus('rot-status', '오류: ' + e.message, 'err');
        }
    });

    // =====================================================
    // EXTRACT IMAGES
    // =====================================================
    var extFile = null;
    bindDrop('ext-drop', 'ext-file', async function (files) {
        if (!files[0]) return;
        extFile = files[0];
        var grid = document.getElementById('ext-grid');
        grid.innerHTML = '<div class="empty"><div class="empty-icon">⏳</div>미리보기 생성 중…</div>';
        setStatus('ext-status', '');
        try {
            var buf = await readArrayBuffer(extFile);
            var pdf = await pdfjsLib.getDocument({ data: buf }).promise;
            grid.innerHTML = '';
            for (var i = 1; i <= Math.min(pdf.numPages, 30); i++) {
                var page = await pdf.getPage(i);
                var vp = page.getViewport({ scale: 0.3 });
                var c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                var thumb = document.createElement('div');
                thumb.className = 'preview-thumb';
                thumb.innerHTML = '<div class="preview-thumb-num">' + i + '</div>';
                thumb.appendChild(c);
                grid.appendChild(thumb);
            }
            if (pdf.numPages > 30) {
                grid.insertAdjacentHTML('beforeend',
                    '<div class="empty"><small>+' + (pdf.numPages - 30) + '페이지 더 있음</small></div>');
            }
            document.getElementById('ext-run').disabled = false;
            setStatus('ext-status', extFile.name + ' · ' + pdf.numPages + '페이지', 'ok');
        } catch (e) {
            setStatus('ext-status', '오류: ' + e.message, 'err');
        }
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
                if (fmt === 'image/jpeg') {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, c.width, c.height);
                }
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                var blob = await new Promise(function (res) { c.toBlob(res, fmt, quality); });
                var arr = await blob.arrayBuffer();
                zip.file(baseName + '_p' + String(i).padStart(3, '0') + '.' + extMap[fmt], arr);
            }
            var z = await zip.generateAsync({ type: 'blob' });
            LD.download(z, baseName + '_images.zip');
            setStatus('ext-status', '완료 · ' + pdf.numPages + '개', 'ok');
        } catch (e) {
            console.error(e);
            setStatus('ext-status', '오류: ' + e.message, 'err');
        }
    });

    // =====================================================
    // IMAGES → PDF
    // =====================================================
    var imgFiles = [];
    bindDrop('img-drop', 'img-files', function (files) {
        imgFiles = imgFiles.concat(files.filter(function (f) { return /^image\/(jpeg|png)$/.test(f.type); }));
        refreshImgs();
    });

    function refreshImgs() {
        var list = document.getElementById('img-list');
        renderFileList(imgFiles, list,
            function (i) { imgFiles.splice(i, 1); refreshImgs(); },
            function (from, to) {
                var it = imgFiles.splice(from, 1)[0];
                imgFiles.splice(to, 0, it);
                refreshImgs();
            }
        );
        document.getElementById('img-run').disabled = imgFiles.length < 1;
    }

    document.getElementById('img-run').addEventListener('click', async function () {
        setStatus('img-status', 'PDF 생성 중…');
        try {
            var doc = await PDFDocument.create();
            var size = document.getElementById('img-size').value;
            var orient = document.getElementById('img-orient').value;
            var margin = parseFloat(document.getElementById('img-margin').value) || 0;
            var mmToPt = function (mm) { return mm * 2.83465; };
            var sizes = { A4: [595.28, 841.89], Letter: [612, 792] };

            for (var i = 0; i < imgFiles.length; i++) {
                var f = imgFiles[i];
                var buf = await readArrayBuffer(f);
                var img = f.type === 'image/png'
                    ? await doc.embedPng(buf)
                    : await doc.embedJpg(buf);
                var pw, ph;
                if (size === 'fit') {
                    pw = img.width + mmToPt(margin) * 2;
                    ph = img.height + mmToPt(margin) * 2;
                } else {
                    var s = sizes[size];
                    var landscape = orient === 'landscape' || (orient === 'auto' && img.width > img.height);
                    pw = landscape ? s[1] : s[0];
                    ph = landscape ? s[0] : s[1];
                }
                var page = doc.addPage([pw, ph]);
                var maxW = pw - mmToPt(margin) * 2;
                var maxH = ph - mmToPt(margin) * 2;
                var scale = Math.min(maxW / img.width, maxH / img.height);
                var w = img.width * scale, h = img.height * scale;
                page.drawImage(img, {
                    x: (pw - w) / 2,
                    y: (ph - h) / 2,
                    width: w, height: h
                });
            }
            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('img-name').value || 'images.pdf');
            setStatus('img-status', '완료 · ' + imgFiles.length + '페이지 · ' + LD.formatBytes(bytes.byteLength), 'ok');
        } catch (e) {
            console.error(e);
            setStatus('img-status', '오류: ' + e.message, 'err');
        }
    });

    // =====================================================
    // WATERMARK
    // =====================================================
    var wmFile = null;
    bindDrop('wm-drop', 'wm-file', async function (files) {
        if (!files[0]) return;
        wmFile = files[0];
        var buf = await readArrayBuffer(wmFile);
        var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        document.getElementById('wm-info').hidden = false;
        document.getElementById('wm-info').textContent = wmFile.name + ' · ' + doc.getPageCount() + '페이지';
        document.getElementById('wm-info').className = 'status';
        document.getElementById('wm-run').disabled = false;
    });

    document.getElementById('wm-run').addEventListener('click', async function () {
        if (!wmFile) return;
        setStatus('wm-status', '워터마크 추가 중…');
        try {
            var buf = await readArrayBuffer(wmFile);
            var doc = await PDFDocument.load(buf, { ignoreEncryption: true });
            var font = await doc.embedFont(StandardFonts.HelveticaBold);
            var text = document.getElementById('wm-text').value || 'WATERMARK';
            var size = parseInt(document.getElementById('wm-size').value, 10) || 60;
            var opacity = parseInt(document.getElementById('wm-opacity').value, 10) / 100;
            var angle = parseInt(document.getElementById('wm-angle').value, 10);
            var color = document.getElementById('wm-color').value;
            var r = parseInt(color.slice(1, 3), 16) / 255;
            var g = parseInt(color.slice(3, 5), 16) / 255;
            var b = parseInt(color.slice(5, 7), 16) / 255;

            doc.getPages().forEach(function (page) {
                var w = page.getWidth(), h = page.getHeight();
                var tw = font.widthOfTextAtSize(text, size);
                page.drawText(text, {
                    x: (w - tw) / 2,
                    y: h / 2,
                    size: size,
                    font: font,
                    color: rgb(r, g, b),
                    opacity: opacity,
                    rotate: degrees(angle)
                });
            });

            var bytes = await doc.save();
            LD.download(new Blob([bytes], { type: 'application/pdf' }),
                document.getElementById('wm-name').value || 'watermarked.pdf');
            setStatus('wm-status', '완료 · ' + LD.formatBytes(bytes.byteLength), 'ok');
        } catch (e) {
            console.error(e);
            setStatus('wm-status', '오류: ' + e.message, 'err');
        }
    });
})();
