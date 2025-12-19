#!/usr/bin/env bash
set -e

# 항상 이 폴더 기준으로 실행
cd "$(dirname "$0")"

########################################
# 1) 도장 AI 추출 페이지 (stamp-ai-seal.html)
########################################
cat << 'HTML' > stamp-ai-seal.html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>도장 AI 추출기 – 고해상도 도장 PNG 만들기</title>
  <meta name="description" content="흰 종이에 찍은 도장 이미지를 업로드하면, 배경을 제거하고 도장 부분만 또렷한 투명 PNG로 추출해 주는 도장 전용 AI 도구입니다." />
  <style>
    :root {
      --mint: #00c4a7;
      --mint-soft: #e6fbf7;
      --bg: #f5f7fb;
      --card: #ffffff;
      --border: #dde3f0;
      --text-main: #111827;
      --text-sub: #6b7280;
      --danger: #ef4444;
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text-main);
    }
    a { color: inherit; text-decoration: none; }

    header {
      background:#ffffff;
      border-bottom:1px solid var(--border);
    }
    .nav {
      max-width: 960px;
      margin: 0 auto;
      padding: 14px 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      font-size:14px;
    }
    .logo {
      font-weight:700;
      font-size:16px;
      color:#0891b2;
    }
    .nav-links a {
      margin-left:16px;
      color: var(--text-sub);
    }
    .nav-links a.active {
      color:#0891b2;
      font-weight:600;
    }

    main {
      max-width: 960px;
      margin: 32px auto 40px;
      padding: 0 20px 40px;
    }

    .hero {
      background:#ffffff;
      border-radius:16px;
      padding:24px 24px 20px;
      border:1px solid var(--border);
      box-shadow:0 12px 35px rgba(15,23,42,0.04);
      margin-bottom:28px;
    }
    .hero-tag {
      display:inline-flex;
      align-items:center;
      font-size:11px;
      padding:4px 10px;
      border-radius:999px;
      background:var(--mint-soft);
      color:#047857;
      margin-bottom:10px;
    }
    .hero h1 {
      font-size:24px;
      margin-bottom:8px;
      line-height:1.4;
    }
    .hero p {
      font-size:14px;
      color:var(--text-sub);
      line-height:1.7;
    }
    .hero-highlight {
      color:var(--mint);
      font-weight:600;
    }

    .hero-actions {
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      margin-top:16px;
      gap:8px 16px;
    }
    .btn-main {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:10px 22px;
      border-radius:999px;
      border:none;
      background:var(--mint);
      color:#ffffff;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      box-shadow:0 10px 30px rgba(5,150,105,0.25);
      transition:transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .btn-main:hover {
      background:#06b196;
      transform:translateY(-1px);
      box-shadow:0 14px 38px rgba(5,150,105,0.3);
    }
    .hero-note {
      font-size:12px;
      color:var(--text-sub);
    }

    .layout {
      display:grid;
      grid-template-columns: 2fr 1.5fr;
      gap:20px;
      margin-top:24px;
    }
    .card {
      background:var(--card);
      border-radius:14px;
      border:1px solid var(--border);
      padding:18px 18px 16px;
      box-shadow:0 8px 24px rgba(15,23,42,0.03);
    }
    .card h2 {
      font-size:16px;
      margin-bottom:8px;
    }
    .card p {
      font-size:13px;
      color:var(--text-sub);
      line-height:1.6;
    }

    .upload-area {
      border-radius:12px;
      border:1px dashed #9ca3af;
      padding:20px 16px;
      margin-top:14px;
      text-align:center;
      background:#f9fafb;
    }
    .upload-area p {
      font-size:13px;
      color:var(--text-sub);
      margin-top:6px;
    }
    .upload-area input[type="file"] {
      display:none;
    }
    .btn-sub {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:9px 18px;
      border-radius:999px;
      border:1px solid var(--border);
      background:#ffffff;
      font-size:13px;
      cursor:pointer;
    }

    .preview-grid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:12px;
      margin-top:16px;
      font-size:11px;
      color:var(--text-sub);
    }
    .preview-box {
      border-radius:10px;
      background:#f9fafb;
      border:1px solid var(--border);
      padding:8px;
      text-align:center;
    }
    .preview-box img {
      max-width:100%;
      max-height:260px;
      border-radius:6px;
    }
    .status {
      font-size:12px;
      margin-top:8px;
      color:var(--text-sub);
    }
    .status strong {
      color:#059669;
    }
    .status.error strong {
      color:var(--danger);
    }

    .helper {
      font-size:12px;
      margin-top:10px;
      color:var(--text-sub);
      line-height:1.6;
    }
    .helper li { margin-left:16px; margin-top:4px; }

    .btn-download {
      margin-top:10px;
      width:100%;
      justify-content:center;
    }

    footer {
      border-top:1px solid var(--border);
      padding:16px 0 26px;
      font-size:11px;
      color:var(--text-sub);
      text-align:center;
    }
    footer a { color:var(--text-sub); margin:0 6px; }

    @media (max-width: 880px) {
      .layout { grid-template-columns:1fr; }
      .preview-grid { grid-template-columns:1fr; }
      .hero { padding:20px 18px 18px; }
      .hero h1 { font-size:20px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav">
      <div class="logo">도장 PNG 추출기</div>
      <div class="nav-links">
        <a href="index.html">홈</a>
        <a href="welcome.html">기본 추출기</a>
        <a href="stamp-ai-seal.html" class="active">도장 AI</a>
        <a href="stamp-ai-sign.html">서명 AI</a>
        <a href="board.html">문의</a>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-tag">고급 모드 · 도장 전용 AI</div>
      <h1>도장 부분만 또렷하게 남기는<br><span class="hero-highlight">도장 AI 추출기</span></h1>
      <p>
        공문서, 계약서에 쓸 <strong>고해상도 도장 PNG</strong>가 필요할 때 쓰는 고급 모드입니다.<br>
        빨간 도장 영역만 살리고 주변 얼룩과 그림자를 최대한 줄여 줍니다.
      </p>
      <div class="hero-actions">
        <button id="trigger-upload" class="btn-main">도장 이미지 선택하기</button>
        <span class="hero-note">권장: A4 흰 종이에 도장을 크게 찍고, 그림자 없이 촬영한 사진</span>
      </div>
    </section>

    <section class="layout">
      <div class="card">
        <h2>1. 이미지 업로드</h2>
        <p>아래 영역을 눌러 도장 사진을 올리면, 자동으로 AI가 도장 부분을 분석합니다.</p>
        <div class="upload-area" id="upload-area">
          <label for="file-input" class="btn-sub">파일에서 선택...</label>
          <input id="file-input" type="file" accept="image/*" />
          <p>jpg, png 사진 업로드 가능 · 최대 10MB</p>
        </div>

        <div class="helper">
          <ul>
            <li>배경은 <strong>완전히 흰 종이</strong>가 가장 좋습니다.</li>
            <li>도장은 사진 중앙에, 테두리가 잘리지 않게 찍어 주세요.</li>
            <li>가능하면 플래시 대신 자연광에서 촬영해 주세요.</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <h2>2. 결과 확인 및 다운로드</h2>
        <p>왼쪽은 원본, 오른쪽은 도장만 추출한 결과입니다.</p>

        <div class="preview-grid">
          <div class="preview-box">
            <div>원본 이미지</div>
            <img id="preview-original" alt="원본 미리보기" />
          </div>
          <div class="preview-box">
            <div>추출된 도장 PNG</div>
            <img id="preview-result" alt="결과 미리보기" />
          </div>
        </div>

        <div id="status" class="status">아직 처리 전입니다. 이미지를 업로드하면 자동으로 시작됩니다.</div>
        <button id="download-btn" class="btn-main btn-download" disabled>PNG 파일 다운로드</button>
      </div>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 도장 PNG 추출기 · 모든 이미지는 처리 후 즉시 삭제되도록 설계되었습니다.</p>
    <div style="margin-top:6px;">
      <a href="index.html">홈</a>·
      <a href="welcome.html">기본 추출기</a>·
      <a href="stamp-ai-sign.html">서명 AI</a>·
      <a href="privacy.html">개인정보처리방침</a>
    </div>
  </footer>

  <script>
    // 필요하면 여기 API 주소만 수정하면 됨
    const API_SEAL = "http://127.0.0.1:8100/seal";

    const fileInput = document.getElementById("file-input");
    const triggerUpload = document.getElementById("trigger-upload");
    const previewOriginal = document.getElementById("preview-original");
    const previewResult = document.getElementById("preview-result");
    const statusEl = document.getElementById("status");
    const downloadBtn = document.getElementById("download-btn");
    const uploadArea = document.getElementById("upload-area");

    triggerUpload.addEventListener("click", () => fileInput.click());

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.background = "#eef2ff";
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.style.background = "#f9fafb";
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.background = "#f9fafb";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });

    async function handleFile(file) {
      if (!file.type.startsWith("image/")) {
        setStatus("이미지 파일만 업로드할 수 있습니다.", true);
        return;
      }
      const url = URL.createObjectURL(file);
      previewOriginal.src = url;
      previewResult.src = "";
      downloadBtn.disabled = true;

      setStatus("도장 영역 분석 중입니다. 잠시만 기다려 주세요...", false);

      const form = new FormData();
      form.append("file", file);

      try {
        const res = await fetch(API_SEAL, { method: "POST", body: form });
        if (!res.ok) {
          throw new Error("API 응답 에러: " + res.status);
        }
        const blob = await res.blob();
        const outUrl = URL.createObjectURL(blob);
        previewResult.src = outUrl;
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => {
          const a = document.createElement("a");
          a.href = outUrl;
          a.download = "stamp-ai.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
        setStatus("완료되었습니다. 아래 PNG 다운로드 버튼을 눌러 저장하세요.", false);
      } catch (err) {
        console.error(err);
        setStatus("처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", true);
      }
    }

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.classList.toggle("error", !!isError);
    }
  </script>
</body>
</html>
HTML

########################################
# 2) 서명 AI 추출 페이지 (stamp-ai-sign.html)
########################################
cat << 'HTML' > stamp-ai-sign.html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>서명 AI 추출기 – 볼펜 서명만 깔끔하게 분리</title>
  <meta name="description" content="볼펜·싸인펜으로 작성한 서명을 업로드하면, 배경을 제거하고 검정 서명만 남기는 서명 전용 AI 도구입니다." />
  <style>
    :root {
      --mint: #00c4a7;
      --mint-soft: #e6fbf7;
      --bg: #f5f7fb;
      --card: #ffffff;
      --border: #dde3f0;
      --text-main: #111827;
      --text-sub: #6b7280;
      --accent: #6366f1;
    }
    * { box-sizing:border-box; margin:0; padding:0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text-main);
    }
    header {
      background:#ffffff;
      border-bottom:1px solid var(--border);
    }
    .nav {
      max-width: 960px;
      margin: 0 auto;
      padding: 14px 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      font-size:14px;
    }
    .logo {
      font-weight:700;
      font-size:16px;
      color:#0891b2;
    }
    .nav-links a {
      margin-left:16px;
      color: var(--text-sub);
    }
    .nav-links a.active {
      color:#0891b2;
      font-weight:600;
    }

    main {
      max-width: 960px;
      margin: 32px auto 40px;
      padding: 0 20px 40px;
    }

    .hero {
      background:#ffffff;
      border-radius:16px;
      padding:24px 24px 20px;
      border:1px solid var(--border);
      box-shadow:0 12px 35px rgba(15,23,42,0.04);
      margin-bottom:28px;
    }
    .hero-tag {
      display:inline-flex;
      align-items:center;
      font-size:11px;
      padding:4px 10px;
      border-radius:999px;
      background:var(--mint-soft);
      color:#374151;
      margin-bottom:10px;
    }
    .hero h1 {
      font-size:24px;
      margin-bottom:8px;
      line-height:1.4;
    }
    .hero p {
      font-size:14px;
      color:var(--text-sub);
      line-height:1.7;
    }
    .hero-highlight {
      color:var(--accent);
      font-weight:600;
    }

    .hero-actions {
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      margin-top:16px;
      gap:8px 16px;
    }
    .btn-main {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:10px 22px;
      border-radius:999px;
      border:none;
      background:var(--accent);
      color:#ffffff;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      box-shadow:0 10px 30px rgba(79,70,229,0.25);
      transition:transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .btn-main:hover {
      background:#4f46e5;
      transform:translateY(-1px);
      box-shadow:0 14px 38px rgba(79,70,229,0.3);
    }
    .hero-note {
      font-size:12px;
      color:var(--text-sub);
    }

    .layout {
      display:grid;
      grid-template-columns: 2fr 1.5fr;
      gap:20px;
      margin-top:24px;
    }
    .card {
      background:var(--card);
      border-radius:14px;
      border:1px solid var(--border);
      padding:18px 18px 16px;
      box-shadow:0 8px 24px rgba(15,23,42,0.03);
    }
    .card h2 {
      font-size:16px;
      margin-bottom:8px;
    }
    .card p {
      font-size:13px;
      color:var(--text-sub);
      line-height:1.6;
    }

    .upload-area {
      border-radius:12px;
      border:1px dashed #9ca3af;
      padding:20px 16px;
      margin-top:14px;
      text-align:center;
      background:#f9fafb;
    }
    .upload-area p {
      font-size:13px;
      color:var(--text-sub);
      margin-top:6px;
    }
    .upload-area input[type="file"] {
      display:none;
    }
    .btn-sub {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      padding:9px 18px;
      border-radius:999px;
      border:1px solid var(--border);
      background:#ffffff;
      font-size:13px;
      cursor:pointer;
    }

    .preview-grid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:12px;
      margin-top:16px;
      font-size:11px;
      color:var(--text-sub);
    }
    .preview-box {
      border-radius:10px;
      background:#f9fafb;
      border:1px solid var(--border);
      padding:8px;
      text-align:center;
    }
    .preview-box img {
      max-width:100%;
      max-height:260px;
      border-radius:6px;
    }
    .status {
      font-size:12px;
      margin-top:8px;
      color:var(--text-sub);
    }
    .status.error { color:#ef4444; }
    .slider-row {
      margin-top:14px;
      font-size:12px;
      color:var(--text-sub);
    }
    .slider-row input[type="range"] {
      width:100%;
      margin-top:4px;
    }

    .btn-download {
      margin-top:10px;
      width:100%;
      justify-content:center;
    }

    footer {
      border-top:1px solid var(--border);
      padding:16px 0 26px;
      font-size:11px;
      color:var(--text-sub);
      text-align:center;
    }
    footer a { color:var(--text-sub); margin:0 6px; }

    @media (max-width: 880px) {
      .layout { grid-template-columns:1fr; }
      .preview-grid { grid-template-columns:1fr; }
      .hero { padding:20px 18px 18px; }
      .hero h1 { font-size:20px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="nav">
      <div class="logo">도장 PNG 추출기</div>
      <div class="nav-links">
        <a href="index.html">홈</a>
        <a href="welcome.html">기본 추출기</a>
        <a href="stamp-ai-seal.html">도장 AI</a>
        <a href="stamp-ai-sign.html" class="active">서명 AI</a>
        <a href="board.html">문의</a>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-tag">고급 모드 · 서명 전용 AI</div>
      <h1>볼펜·싸인펜으로 쓴 서명만<br><span class="hero-highlight">검은 선만 남기고 깨끗하게 분리</span>합니다.</h1>
      <p>
        계약서, 동의서 등에 쓸 <strong>서명 이미지</strong>를 따로 보관하고 싶을 때 쓰는 도구입니다.<br>
        배경은 최대한 지우고, 서명 선은 또렷하게 살려서 PNG로 제공합니다.
      </p>
      <div class="hero-actions">
        <button id="trigger-upload-sign" class="btn-main">서명 이미지 선택하기</button>
        <span class="hero-note">검정 또는 짙은 색 펜으로 흰 종이에 서명을 크게 써 주세요.</span>
      </div>
    </section>

    <section class="layout">
      <div class="card">
        <h2>1. 서명 이미지 업로드</h2>
        <p>서명이 보이도록 촬영한 사진을 올리면, AI가 배경과 서명을 분리합니다.</p>
        <div class="upload-area" id="upload-area-sign">
          <label for="file-input-sign" class="btn-sub">파일에서 선택...</label>
          <input id="file-input-sign" type="file" accept="image/*" />
          <p>jpg, png 사진 업로드 가능 · 최대 10MB</p>
        </div>

        <div class="slider-row">
          선 두께 조정 (1 = 얇게, 3 = 기본, 5 = 조금 두껍게)<br>
          <input id="thickness" type="range" min="1" max="5" step="1" value="3" />
        </div>

        <div style="font-size:12px; margin-top:10px; color:var(--text-sub);">
          · 너무 가늘게 나오면 슬라이더를 오른쪽으로 조금 올려 주세요.<br>
          · 선이 번져 보이면 3 이하로 낮추고 다시 처리해 보세요.
        </div>
      </div>

      <div class="card">
        <h2>2. 결과 확인 및 다운로드</h2>
        <p>왼쪽은 원본, 오른쪽은 서명만 추출한 결과입니다.</p>

        <div class="preview-grid">
          <div class="preview-box">
            <div>원본 이미지</div>
            <img id="preview-original-sign" alt="원본 미리보기" />
          </div>
          <div class="preview-box">
            <div>추출된 서명 PNG</div>
            <img id="preview-result-sign" alt="결과 미리보기" />
          </div>
        </div>

        <div id="status-sign" class="status">아직 처리 전입니다. 이미지를 업로드하면 자동으로 시작됩니다.</div>
        <button id="download-btn-sign" class="btn-main btn-download" disabled>PNG 파일 다운로드</button>
      </div>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 도장 PNG 추출기 · 서명 이미지는 결과 생성 후 즉시 삭제되도록 설계되었습니다.</p>
    <div style="margin-top:6px;">
      <a href="index.html">홈</a>·
      <a href="welcome.html">기본 추출기</a>·
      <a href="stamp-ai-seal.html">도장 AI</a>·
      <a href="privacy.html">개인정보처리방침</a>
    </div>
  </footer>

  <script>
    // 필요하면 여기 API 주소만 수정
    const API_SIGN = "http://127.0.0.1:8100/sign";

    const fileInput = document.getElementById("file-input-sign");
    const triggerUpload = document.getElementById("trigger-upload-sign");
    const uploadArea = document.getElementById("upload-area-sign");
    const previewOriginal = document.getElementById("preview-original-sign");
    const previewResult = document.getElementById("preview-result-sign");
    const statusEl = document.getElementById("status-sign");
    const downloadBtn = document.getElementById("download-btn-sign");
    const thicknessInput = document.getElementById("thickness");

    triggerUpload.addEventListener("click", () => fileInput.click());

    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.background = "#eef2ff";
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.style.background = "#f9fafb";
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.background = "#f9fafb";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });

    async function handleFile(file) {
      if (!file.type.startsWith("image/")) {
        setStatus("이미지 파일만 업로드할 수 있습니다.", true);
        return;
      }
      const url = URL.createObjectURL(file);
      previewOriginal.src = url;
      previewResult.src = "";
      downloadBtn.disabled = true;

      setStatus("서명 영역 분석 중입니다. 잠시만 기다려 주세요...", false);

      const form = new FormData();
      form.append("file", file);
      form.append("thickness", thicknessInput.value);

      try {
        const res = await fetch(API_SIGN, { method: "POST", body: form });
        if (!res.ok) {
          throw new Error("API 응답 에러: " + res.status);
        }
        const blob = await res.blob();
        const outUrl = URL.createObjectURL(blob);
        previewResult.src = outUrl;
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => {
          const a = document.createElement("a");
          a.href = outUrl;
          a.download = "signature-ai.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
        setStatus("완료되었습니다. 아래 PNG 다운로드 버튼을 눌러 저장하세요.", false);
      } catch (err) {
        console.error(err);
        setStatus("처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.", true);
      }
    }

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.classList.toggle("error", !!isError);
    }
  </script>
</body>
</html>
HTML

########################################
# 3) git 커밋 & 푸시
########################################
git add stamp-ai-seal.html stamp-ai-sign.html
git commit -m "add: 도장/서명 AI 추출 전용 페이지"
git push origin main

echo "✅ stamp-ai-seal.html / stamp-ai-sign.html 생성 및 git push 완료"
