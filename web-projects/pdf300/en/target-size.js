/* PDF300 — compress a PDF to a target size.
   Browser mode (default): pdf.js draws each page, JPEG quality/resolution are searched
   until the file fits. Nothing is uploaded, no daily limit.
   Server mode: the original api.ledeuxions.com path (10 files/day).
   Used by /target-size and the /compress-pdf-to-* pages.
   Preset: ?kb=200 or ?mb=1 in the URL, or data-kb / data-mb on #toolCard. */
(function () {
  'use strict';
  var PDFLIB = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
  var PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  var API = 'https://api.ledeuxions.com';
  var MIN_DPI = 30, MAX_DPI = 200, MAX_PIXELS = 16e6;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  var libsP = null;
  function loadLibs() {
    if (!libsP) {
      libsP = Promise.all([
        window.PDFLib ? 0 : loadScript(PDFLIB),
        window.pdfjsLib ? 0 : loadScript(PDFJS)
      ]).then(function () { pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; });
      libsP.catch(function () { libsP = null; });
    }
    return libsP;
  }

  // ---------- engine ----------
  async function compressToTarget(buf, targetBytes, opt) {
    opt = opt || {};
    var progress = opt.onProgress || function () {};
    await loadLibs();
    var pdf = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    var n = pdf.numPages;
    var pages = [];
    for (var i = 1; i <= n; i++) {
      var pg = await pdf.getPage(i);
      var vp = pg.getViewport({ scale: 1 });
      pages.push({ page: pg, w: vp.width, h: vp.height });
    }
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d', { willReadFrequently: !!opt.gray });
    var tries = 0;

    // Draw every page at `dpi`, encode at quality `q`. Stops early once it is clearly over.
    async function encode(dpi, q, budget) {
      tries++;
      var blobs = [], total = 0;
      for (var k = 0; k < n; k++) {
        var p = pages[k];
        var s = dpi / 72;
        if (p.w * s * p.h * s > MAX_PIXELS) s = Math.sqrt(MAX_PIXELS / (p.w * p.h));
        var v = p.page.getViewport({ scale: s });
        canvas.width = Math.max(1, Math.floor(v.width));
        canvas.height = Math.max(1, Math.floor(v.height));
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await p.page.render({ canvasContext: ctx, viewport: v }).promise;
        if (opt.gray) toGray(ctx, canvas.width, canvas.height);
        var b = await new Promise(function (r) { canvas.toBlob(r, 'image/jpeg', q); });
        blobs.push(b); total += b.size;
        progress('Try ' + tries + ': ' + Math.round(dpi) + ' dpi, quality ' + Math.round(q * 100) + ' — page ' + (k + 1) + '/' + n);
        if (budget && k < n - 1 && total > budget * 1.5) {
          if (window.PDF300Debug) window.PDF300Debug.push([Math.round(dpi), q, 'abort@' + (k + 1), Math.round(total * n / (k + 1))]);
          return { dpi: dpi, q: q, total: total * n / (k + 1), blobs: null, over: true };
        }
      }
      if (window.PDF300Debug) window.PDF300Debug.push([Math.round(dpi), q, total, budget]);
      return { dpi: dpi, q: q, total: total, blobs: blobs, over: budget ? total > budget : false };
    }

    async function build(r) {
      var out = await PDFLib.PDFDocument.create();
      for (var k = 0; k < n; k++) {
        var img = await out.embedJpg(await r.blobs[k].arrayBuffer());
        var page = out.addPage([pages[k].w, pages[k].h]);
        page.drawImage(img, { x: 0, y: 0, width: pages[k].w, height: pages[k].h });
      }
      out.setProducer('PDF300 (pdf300.com)');
      out.setCreator('PDF300 target size');
      return out.save({ useObjectStreams: true });
    }

    // Find the highest dpi whose result fits `budget` at quality q.
    async function searchDpi(q, budget) {
      var best = null, lo = 0, hi = Infinity, dpi = 72;
      for (var it = 0; it < 8; it++) {
        var r = await encode(dpi, q, budget);
        if (!r.over) { if (!best || r.dpi > best.dpi) best = r; lo = r.dpi; } else { hi = r.dpi; }
        if (!r.over && r.dpi >= MAX_DPI) break;
        if (r.over && r.dpi <= MIN_DPI) break;
        if (hi - lo < 6) break;
        // JPEG bytes grow a little slower than pixel count, so a sqrt step is safe.
        var est = r.dpi * Math.sqrt(budget / r.total) * (r.over ? 0.95 : 0.99);
        est = Math.max(MIN_DPI, Math.min(MAX_DPI, est));
        if (hi !== Infinity && lo) {
          if (est <= lo + 2 || est >= hi - 2) est = (lo + hi) / 2;
        } else if (!r.over && est < r.dpi + 3) break;
        dpi = est;
      }
      return best;
    }

    var overhead = 900 + 260 * n;
    var budget = targetBytes - overhead;
    if (budget < 2000 * n) budget = Math.max(800 * n, targetBytes * 0.8);
    var qualities = [0.72, 0.5, 0.35, 0.22];
    var bytes = null, used = null;
    for (var round = 0; round < 3; round++) {
      var found = null, qi = 0;
      for (; qi < qualities.length && !found; qi++) found = await searchDpi(qualities[qi], budget);
      if (!found) break;
      // Low resolution hurts small text more than lower JPEG quality does:
      // if the fit is blurry, see whether a lower quality buys clearly more dpi.
      for (; qi < qualities.length - 1 && found.dpi < 80; qi++) {
        var alt = await searchDpi(qualities[qi], budget);
        if (alt && alt.dpi > found.dpi * 1.15) found = alt; else break;
      }
      // Lots of room left (size is not smooth in dpi): spend it on quality.
      var ups = [0.8, 0.88];
      for (var u = 0; u < ups.length && found.total < budget * 0.85 && ups[u] > found.q; u++) {
        var up = await encode(found.dpi, ups[u], budget);
        if (up.over) break;
        found = up;
      }
      progress('Building PDF…');
      bytes = await build(found); used = found;
      if (bytes.byteLength <= targetBytes) {
        return { bytes: bytes, hit: true, dpi: found.dpi, q: found.q, pages: n, tries: tries };
      }
      budget -= (bytes.byteLength - targetBytes) + 500; // overhead was underestimated; tighten
    }
    // Could not fit: hand back the smallest we can make.
    progress('Target too small — making the smallest possible version…');
    var smallest = await encode(MIN_DPI, qualities[qualities.length - 1], 0);
    var sb = await build(smallest);
    if (bytes && bytes.byteLength < sb.byteLength) { sb = bytes; smallest = used; }
    return { bytes: sb, hit: sb.byteLength <= targetBytes, dpi: smallest.dpi, q: smallest.q, pages: n, tries: tries };
  }

  function toGray(ctx, w, h) {
    var d = ctx.getImageData(0, 0, w, h), a = d.data;
    for (var i = 0; i < a.length; i += 4) {
      var y = (a[i] * 299 + a[i + 1] * 587 + a[i + 2] * 114) / 1000;
      a[i] = a[i + 1] = a[i + 2] = y;
    }
    ctx.putImageData(d, 0, 0);
  }

  window.PDF300Target = { compress: compressToTarget, loadLibs: loadLibs };

  // ---------- UI ----------
  var $ = function (id) { return document.getElementById(id); };
  var card = $('toolCard');
  if (!card || !$('runBtn')) return;
  var theFile = null;
  function show(msg, kind) { var el = $('runStatus'); el.className = 'status show ' + (kind || 'info'); el.textContent = msg; }
  function fmt(b) { return b >= 1e6 ? (b / 1e6).toFixed(2) + ' MB' : Math.round(b / 1000) + ' KB'; }

  // Preset: URL beats the page default.
  (function preset() {
    var q = new URLSearchParams(location.search);
    var kb = parseFloat(q.get('kb') || card.getAttribute('data-kb'));
    var mb = parseFloat(q.get('mb') || card.getAttribute('data-mb'));
    if (q.get('kb')) mb = NaN; else if (q.get('mb')) kb = NaN;
    if (kb > 0 && kb < 1e6) { $('targetVal').value = kb; $('targetUnit').value = 'KB'; }
    else if (mb > 0 && mb < 1000) { $('targetVal').value = mb; $('targetUnit').value = 'MB'; }
  })();

  function mode() { var r = document.querySelector('input[name="tsMode"]:checked'); return r ? r.value : 'browser'; }
  function syncMode() {
    var g = $('grayWrap'); if (g) g.style.display = mode() === 'browser' ? '' : 'none';
    var n = $('modeNote');
    if (n) n.textContent = mode() === 'browser'
      ? 'Runs on your device. The file is not uploaded and there is no daily limit.'
      : 'The file is sent to our server, processed in memory and not kept. Free: 10 files a day.';
  }
  document.querySelectorAll('input[name="tsMode"]').forEach(function (r) { r.addEventListener('change', syncMode); });
  syncMode();

  $('drop').onclick = function () { $('file').click(); };
  $('drop').ondragover = function (e) { e.preventDefault(); $('drop').classList.add('over'); };
  $('drop').ondragleave = function () { $('drop').classList.remove('over'); };
  $('drop').ondrop = function (e) { e.preventDefault(); $('drop').classList.remove('over'); if (e.dataTransfer.files[0]) pickFile(e.dataTransfer.files[0]); };
  $('file').onchange = function (e) { if (e.target.files[0]) pickFile(e.target.files[0]); };
  function pickFile(f) {
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) { show('PDF files only', 'err'); return; }
    theFile = f;
    $('fileInfo').textContent = 'Selected: ' + f.name + '  (' + fmt(f.size) + ')';
    $('drop').textContent = '✅ ' + f.name;
    $('runBtn').disabled = false;
    if (mode() === 'browser') loadLibs().catch(function () {});
  }

  function targetBytes() {
    var val = parseFloat($('targetVal').value);
    if (!val || val <= 0) return 0;
    // 1 KB = 1,000 bytes and 1 MB = 1,000,000 bytes, so the file also passes portals that count 1,024.
    return Math.floor($('targetUnit').value === 'MB' ? val * 1e6 : val * 1e3);
  }
  function outName() {
    var base = theFile.name.replace(/\.pdf$/i, '');
    return base + '_' + $('targetVal').value + $('targetUnit').value + '.pdf';
  }
  function download(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = outName(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
  }
  function bar(p) { $('barWrap').classList.remove('hide'); $('bar').style.width = p + '%'; }

  $('runBtn').onclick = async function () {
    if (!theFile) return;
    var tb = targetBytes();
    if (!tb) { show('Enter a target size', 'err'); return; }
    $('runBtn').disabled = true;
    try {
      if (theFile.size <= tb) {
        show('This file is already ' + fmt(theFile.size) + ' — under your target. No need to compress it.', 'ok');
        return;
      }
      if (mode() === 'browser') await runBrowser(tb); else await runServer(tb);
    } catch (e) {
      show('Error: ' + (e && e.message ? e.message : e) + (mode() === 'browser' ? ' — you can also try the server mode.' : ''), 'err');
    } finally {
      $('runBtn').disabled = false;
      setTimeout(function () { $('barWrap').classList.add('hide'); $('bar').style.width = '0'; }, 1200);
    }
  };

  async function runBrowser(tb) {
    bar(10); show('Loading the PDF engine…');
    var buf = await theFile.arrayBuffer();
    var t0 = Date.now();
    var steps = 0;
    var r = await compressToTarget(buf, tb, {
      gray: $('gray') && $('gray').checked,
      onProgress: function (m) { steps++; bar(Math.min(92, 10 + steps)); show(m); }
    });
    bar(100);
    var blob = new Blob([r.bytes], { type: 'application/pdf' });
    download(blob);
    window.PDF300LastResult = { bytes: r.bytes.byteLength, hit: r.hit, dpi: Math.round(r.dpi), q: r.q, ms: Date.now() - t0 };
    var detail = ' (' + r.pages + ' page' + (r.pages > 1 ? 's' : '') + ' at ' + Math.round(r.dpi) + ' dpi, quality ' + Math.round(r.q * 100) + ')';
    if (r.hit) show('✅ Done: ' + fmt(theFile.size) + ' → ' + fmt(r.bytes.byteLength) + detail + '. Downloaded.', 'ok');
    else show('⚠️ Closest possible: ' + fmt(r.bytes.byteLength) + detail + ' — still over the target. Remove pages, split the file, or tick black & white. Downloaded anyway.', 'err');
  }

  var apiKey = '';
  try { apiKey = localStorage.getItem('ld_apikey') || ''; } catch (e) {}
  async function ensureKey() {
    if (apiKey) return;
    try {
      var email = 'anon-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '@pdf300.ledeuxions.com';
      var r = await fetch(API + '/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) });
      var j = await r.json();
      if (j.apiKey) { apiKey = j.apiKey; try { localStorage.setItem('ld_apikey', apiKey); } catch (e) {} }
    } catch (e) {}
  }
  async function runServer(tb) {
    bar(30); show('Uploading and compressing on the server… (fitting your target)');
    await ensureKey();
    var fd = new FormData();
    fd.append('file', theFile);
    fd.append('target_kb', String(Math.floor(tb / 1024)));
    var r = await fetch(API + '/v1/pdf-compress', { method: 'POST', headers: { 'X-API-Key': apiKey }, body: fd });
    bar(80);
    if (!r.ok) {
      var msg; try { msg = (await r.json()).error; } catch (_) { msg = 'HTTP ' + r.status; }
      if (r.status === 429) msg = 'Daily free limit (10) reached — the browser mode has no limit.';
      throw new Error(msg);
    }
    var hit = r.headers.get('X-Hit-Target');
    var blob = await r.blob();
    bar(100);
    download(blob);
    show('✅ Done: ' + fmt(blob.size) + ' (' + (hit === '1' ? 'target met' : 'slightly over — maximum compression') + '). Downloaded.', hit === '1' ? 'ok' : 'err');
  }
})();
